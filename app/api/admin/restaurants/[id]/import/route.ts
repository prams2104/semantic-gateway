import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractContent } from '@/lib/extract';
import { parseHeuristics } from '@/lib/heuristics';

export const runtime = 'nodejs';
export const maxDuration = 30;

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')?.replace('Bearer ', '');
  return auth === process.env.ADMIN_SECRET;
}

/**
 * POST — Import data from a URL into an existing restaurant profile.
 *
 * Runs the extraction engine on the given URL, extracts JSON-LD + contact info,
 * and returns pre-populated fields + confidence scores. Does NOT auto-save;
 * the admin reviews and then PUTs the update.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { url } = body;

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // Verify restaurant exists
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  // Run extraction
  const extracted = await extractContent(url, true);
  const jsonLd = extracted.structured.jsonLd || [];
  const contactInfo = extracted.structured.contactInfo;
  const reservations = extracted.structured.reservations || [];

  // Find the best business JSON-LD entity
  const businessTypes = ['Restaurant', 'FoodEstablishment', 'LocalBusiness', 'Hotel', 'LodgingBusiness', 'CafeOrCoffeeShop', 'BarOrPub'];
  const businessLd = jsonLd.find((ld: any) => businessTypes.includes(ld['@type']));

  // Build suggested fields from extraction
  const suggested: Record<string, any> = {};
  const suggestedConfidence: { fieldName: string; provenance: string; confidence: number }[] = [];

  // From JSON-LD (high confidence)
  if (businessLd) {
    if (businessLd.name) {
      suggested.name = businessLd.name;
      suggestedConfidence.push({ fieldName: 'name', provenance: 'json-ld-extracted', confidence: 0.9 });
    }
    if (businessLd['@type']) {
      suggested.type = businessLd['@type'];
      suggestedConfidence.push({ fieldName: 'type', provenance: 'json-ld-extracted', confidence: 0.95 });
    }
    if (businessLd.servesCuisine) {
      suggested.cuisine = businessLd.servesCuisine;
      suggestedConfidence.push({ fieldName: 'cuisine', provenance: 'json-ld-extracted', confidence: 0.9 });
    }
    if (businessLd.priceRange) {
      suggested.priceRange = businessLd.priceRange;
      suggestedConfidence.push({ fieldName: 'priceRange', provenance: 'json-ld-extracted', confidence: 0.85 });
    }
    if (businessLd.description) {
      suggested.description = businessLd.description;
      suggestedConfidence.push({ fieldName: 'description', provenance: 'json-ld-extracted', confidence: 0.85 });
    }
    if (businessLd.telephone) {
      suggested.phone = businessLd.telephone;
      suggestedConfidence.push({ fieldName: 'phone', provenance: 'json-ld-extracted', confidence: 0.9 });
    }
    if (businessLd.email) {
      suggested.email = businessLd.email;
      suggestedConfidence.push({ fieldName: 'email', provenance: 'json-ld-extracted', confidence: 0.9 });
    }
    if (businessLd.image) {
      suggested.imageUrl = typeof businessLd.image === 'string' ? businessLd.image : businessLd.image?.url;
    }
    if (businessLd.address) {
      const addr = businessLd.address;
      if (addr.streetAddress) suggested.streetAddress = addr.streetAddress;
      if (addr.addressLocality) suggested.city = addr.addressLocality;
      if (addr.addressRegion) suggested.state = addr.addressRegion;
      if (addr.postalCode) suggested.postalCode = addr.postalCode;
      suggestedConfidence.push({ fieldName: 'address', provenance: 'json-ld-extracted', confidence: 0.9 });
    }
    if (businessLd.aggregateRating) {
      suggested.ratingValue = businessLd.aggregateRating.ratingValue;
      suggested.reviewCount = businessLd.aggregateRating.reviewCount;
      suggestedConfidence.push({ fieldName: 'rating', provenance: 'json-ld-extracted', confidence: 0.9 });
    }
    if (businessLd.hasMenu) {
      suggested.menuUrl = typeof businessLd.hasMenu === 'string' ? businessLd.hasMenu : businessLd.hasMenu?.url;
      suggestedConfidence.push({ fieldName: 'menu', provenance: 'json-ld-extracted', confidence: 0.8 });
    }
    if (businessLd.openingHoursSpecification) {
      const specs = Array.isArray(businessLd.openingHoursSpecification)
        ? businessLd.openingHoursSpecification
        : [businessLd.openingHoursSpecification];
      suggested.hours = specs.map((h: any) => ({
        dayOfWeek: Array.isArray(h.dayOfWeek) ? h.dayOfWeek[0] : h.dayOfWeek,
        opens: h.opens || '',
        closes: h.closes || '',
      }));
      suggestedConfidence.push({ fieldName: 'hours', provenance: 'json-ld-extracted', confidence: 0.85 });
    }
  }

  // Fallbacks from regex-parsed contact info (lower confidence)
  if (!suggested.phone && contactInfo?.phones?.length) {
    suggested.phone = contactInfo.phones[0];
    suggestedConfidence.push({ fieldName: 'phone', provenance: 'regex-body-text', confidence: 0.5 });
  }
  if (!suggested.email && contactInfo?.emails?.length) {
    suggested.email = contactInfo.emails[0];
    suggestedConfidence.push({ fieldName: 'email', provenance: 'regex-body-text', confidence: 0.5 });
  }

  // Reservation URL from detection
  if (reservations.length > 0) {
    suggested.reservationUrl = reservations[0].url;
    suggestedConfidence.push({
      fieldName: 'reservation',
      provenance: 'widget-detected',
      confidence: reservations[0].confidence,
    });
  }

  // Title/description fallbacks
  if (!suggested.name && extracted.structured.title) {
    // Clean title: split on separators and take the shortest meaningful part (brand name)
    const raw = extracted.structured.title;
    const parts = raw.split(/\s*[|–—·]\s*/).filter((p: string) => p.length > 1);
    suggested.name = parts.length > 1
      ? parts.reduce((a: string, b: string) => a.length <= b.length ? a : b)
      : raw;
    suggestedConfidence.push({ fieldName: 'name', provenance: 'html-title', confidence: 0.6 });
  }
  if (!suggested.description && extracted.structured.description) {
    suggested.description = extracted.structured.description;
    suggestedConfidence.push({ fieldName: 'description', provenance: 'html-meta', confidence: 0.6 });
  }

  // ── Enhanced heuristic parsing (for sites without JSON-LD) ──────────────
  // Fetch raw HTML and run heuristic parsers for menu items, hours, addresses
  let heuristicResults = null;
  try {
    const htmlRes = await fetch(url, {
      headers: {
        'User-Agent': 'SemanticGatewayBot/2.0 (+https://semanticgateway.com/bot)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      heuristicResults = parseHeuristics(html, url);

      // Merge heuristic hours (only if JSON-LD didn't provide them)
      if (!suggested.hours && heuristicResults.hours.length > 0) {
        suggested.hours = heuristicResults.hours.map(h => ({
          dayOfWeek: h.dayOfWeek,
          opens: h.opens,
          closes: h.closes,
        }));
        suggestedConfidence.push({
          fieldName: 'hours',
          provenance: 'html-heuristic',
          confidence: Math.max(...heuristicResults.hours.map(h => h.confidence)),
        });
      }

      // Merge heuristic address (only if no address from JSON-LD)
      if (!suggested.streetAddress && heuristicResults.addresses.length > 0) {
        const addr = heuristicResults.addresses[0];
        suggested.streetAddress = addr.streetAddress;
        if (addr.city) suggested.city = addr.city;
        if (addr.state) suggested.state = addr.state;
        if (addr.postalCode) suggested.postalCode = addr.postalCode;
        suggestedConfidence.push({
          fieldName: 'address',
          provenance: 'html-heuristic',
          confidence: addr.confidence,
        });
      }

      // Merge heuristic phone (only if no phone yet)
      if (!suggested.phone && heuristicResults.phones.length > 0) {
        suggested.phone = heuristicResults.phones[0].value;
        suggestedConfidence.push({
          fieldName: 'phone',
          provenance: 'html-heuristic',
          confidence: heuristicResults.phones[0].confidence,
        });
      }

      // Build suggested menu sections from heuristic items
      if (heuristicResults.menuItems.length > 0) {
        // Group items by section name
        const sectionMap = new Map<string, typeof heuristicResults.menuItems>();
        for (const item of heuristicResults.menuItems) {
          const section = item.section || 'Menu';
          if (!sectionMap.has(section)) sectionMap.set(section, []);
          sectionMap.get(section)!.push(item);
        }

        suggested.menuSections = Array.from(sectionMap.entries()).map(([name, items]) => ({
          name,
          items: items.map(item => ({
            name: item.name,
            description: item.description,
            price: item.price,
          })),
        }));

        suggestedConfidence.push({
          fieldName: 'menu',
          provenance: 'html-heuristic',
          confidence: Math.max(...heuristicResults.menuItems.map(i => i.confidence)),
        });
      }
    }
  } catch {
    // Heuristic parsing is best-effort; don't fail the import
  }

  return NextResponse.json({
    restaurant_id: id,
    source_url: url,
    suggested_fields: suggested,
    suggested_confidence: suggestedConfidence,
    pdfs_found: extracted.pdfs,
    quality: extracted.quality,
    raw_json_ld: jsonLd,
    heuristic_menu_items: heuristicResults?.menuItems || [],
    heuristic_hours: heuristicResults?.hours || [],
    heuristic_addresses: heuristicResults?.addresses || [],
  });
}
