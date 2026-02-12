/**
 * Semantic Gateway — Extraction Engine v2
 *
 * Replaces regex-based HTML stripping with proper DOM parsing,
 * Readability-based content extraction, and JSON-LD structured data mining.
 *
 * Dependencies: cheerio, @mozilla/readability, linkedom
 */

import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReservationInfo {
  platform: string;   // "opentable", "resy", "tock", "yelp", "direct"
  url: string;
  confidence: number; // 0.0–1.0
}

export interface ExtractionResult {
  markdown: string;
  structured: {
    title?: string;
    description?: string;
    ogData?: Record<string, string>;
    jsonLd?: any[];
    contactInfo?: { phones: string[]; emails: string[]; addresses: string[] };
    reservations?: ReservationInfo[];
  };
  pdfs: string[];
  tokensOriginal: number;
  tokensExtracted: number;
  quality: {
    hasMainContent: boolean;
    hasStructuredData: boolean;
    hasNavigation: boolean;
    hasContactInfo: boolean;
    hasReservationWidget: boolean;
    contentSections: number;
    informationDensity: number;
  };
}

// ── Main entry ───────────────────────────────────────────────────────────────

export async function extractContent(
  url: string,
  includePdfs = true
): Promise<ExtractionResult> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; SemanticGatewayBot/2.0; +https://semanticgateway.com/bot)',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const html = await res.text();
  const tokensOriginal = estimateTokens(html);

  if (html.trim().length < 100) {
    return emptyResult(url, tokensOriginal);
  }

  const $ = cheerio.load(html);
  const structured = buildStructured($, url);
  const reservations = detectReservations($, url);
  if (reservations.length) structured.reservations = reservations;
  const pdfs = includePdfs ? pdfLinks($, url) : [];
  const markdown = buildMarkdown($, structured, url);
  const tokensExtracted = estimateTokens(markdown);

  return {
    markdown,
    structured,
    pdfs,
    tokensOriginal,
    tokensExtracted,
    quality: computeQuality(structured, markdown, reservations),
  };
}

/** Backward-compat shim used by the API route for cost estimates. */
export function estimateStandardTokens(_url: string): number {
  // TODO: replace with per-domain average cache in production
  return 12_500;
}

// ── Structured data extraction ───────────────────────────────────────────────

function buildStructured($: cheerio.CheerioAPI, base: string) {
  // OpenGraph
  const ogData: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const p = $(el).attr('property')?.replace('og:', '');
    const c = $(el).attr('content');
    if (p && c) ogData[p] = c;
  });

  // JSON-LD (Schema.org) — the highest-signal data on any page
  const jsonLd: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const d = JSON.parse($(el).html() || '');
      if (d['@graph']) jsonLd.push(...d['@graph']);
      else jsonLd.push(d);
    } catch { /* malformed JSON-LD, skip */ }
  });

  // Contact info via regex on body text
  const bodyText = $('body').text();
  const phones = unique(
    (bodyText.match(/(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [])
      .map(s => s.trim())
      .filter(s => !/^\d{10,}$/.test(s)) // filter tracking pixel IDs
  );
  const emails = unique(
    (bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
      .map(s => s.trim())
  );
  const addresses: string[] = [];
  $('[itemprop="address"], .address, [class*="address"]').each((_, el) => {
    const t = clean($(el).text());
    if (t.length > 10) addresses.push(t);
  });

  // Clean title: split on common separators and take the shortest meaningful part
  const rawTitle =
    ogData.title?.trim() ||
    $('title').first().text()?.trim() ||
    $('h1').first().text()?.trim() || '';
  const titleParts = rawTitle.split(/\s*[|–—·]\s*/).filter(p => p.length > 1);
  const cleanTitle = titleParts.length > 1
    ? titleParts.reduce((a, b) => a.length <= b.length ? a : b) // shortest part is usually the brand name
    : rawTitle;

  return {
    title: cleanTitle || rawTitle,
    description:
      ogData.description?.trim() ||
      $('meta[name="description"]').attr('content')?.trim(),
    ogData: Object.keys(ogData).length ? ogData : undefined,
    jsonLd: jsonLd.length ? jsonLd : undefined,
    contactInfo:
      phones.length || emails.length || addresses.length
        ? { phones, emails, addresses }
        : undefined,
    reservations: undefined as ReservationInfo[] | undefined,
  };
}

// ── Markdown assembly ────────────────────────────────────────────────────────

function buildMarkdown(
  $: cheerio.CheerioAPI,
  data: ReturnType<typeof buildStructured>,
  url: string
): string {
  const s: string[] = [];

  // Title + meta
  s.push(`# ${data.title || url}`);
  if (data.description) s.push(`> ${data.description}\n`);
  s.push(`Source: ${url}\n`);

  // JSON-LD structured data
  if (data.jsonLd?.length) {
    s.push('## Structured Data');
    for (const ld of data.jsonLd) s.push(formatJsonLd(ld));
    s.push('');
  }

  // Navigation links (resolved to absolute URLs)
  const nav = extractNavLinks($, url);
  if (nav.length) {
    s.push('## Navigation');
    s.push(nav.map(l => `- [${l.text}](${l.href})`).join('\n'));
    s.push('');
  }

  // Main content — try Readability first, fall back to manual
  const readability = tryReadability($, url);
  const manual = extractManualContent($);
  const main =
    readability && readability.length > (manual?.length ?? 0)
      ? readability
      : manual;

  if (main && main.length > 50) {
    s.push('## Content');
    s.push(main);
    s.push('');
  }

  // Tables
  const tables = extractTables($);
  if (tables.length) {
    s.push('## Tables');
    for (const t of tables) {
      if (t.headers.length) {
        s.push('| ' + t.headers.join(' | ') + ' |');
        s.push('| ' + t.headers.map(() => '---').join(' | ') + ' |');
      }
      for (const r of t.rows) s.push('| ' + r.join(' | ') + ' |');
      s.push('');
    }
  }

  // Contact info
  if (data.contactInfo) {
    s.push('## Contact');
    const ci = data.contactInfo;
    if (ci.phones.length) s.push(`**Phone:** ${ci.phones.join(', ')}`);
    if (ci.emails.length) s.push(`**Email:** ${ci.emails.join(', ')}`);
    if (ci.addresses.length) s.push(`**Address:** ${ci.addresses.join('; ')}`);
    s.push('');
  }

  // Reservation links
  if (data.reservations?.length) {
    s.push('## Reservations');
    for (const r of data.reservations) {
      s.push(`- **${r.platform}**: ${r.url}`);
    }
    s.push('');
  }

  // PDF document links (for downstream "unfolding" via PyMuPDF)
  const pdfs = pdfLinks($, url);
  if (pdfs.length) {
    s.push('## Documents');
    pdfs.forEach(p => s.push(`- ${p}`));
    s.push('');
  }

  return s.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ── Readability extraction ───────────────────────────────────────────────────

function tryReadability($: cheerio.CheerioAPI, url: string): string | null {
  try {
    const { document } = parseHTML($.html());
    const article = new Readability(document as any, {
      charThreshold: 100,
    }).parse();

    if (!article?.textContent || article.textContent.trim().length < 100) {
      return null;
    }

    const $c = cheerio.load(article.content || '');
    const lines: string[] = [];

    $c('h1, h2, h3, h4, p, li, blockquote, pre').each((_, el) => {
      const tag = (el as any).tagName?.toLowerCase() ?? '';
      const t = clean($c(el).text());
      if (!t || t.length < 2) return;

      const map: Record<string, string> = {
        h1: `# ${t}`,
        h2: `## ${t}`,
        h3: `### ${t}`,
        h4: `#### ${t}`,
        li: `- ${t}`,
        blockquote: `> ${t}`,
      };
      lines.push(map[tag] ?? t);
    });

    const out = dedup(lines).join('\n').trim();
    return out.length > 50 ? out : null;
  } catch {
    return null;
  }
}

// ── Manual content extraction (fallback) ─────────────────────────────────────

function extractManualContent($: cheerio.CheerioAPI): string | null {
  // Try semantic containers first
  const selectors = [
    'main',
    '[role="main"]',
    '#main-content',
    '#content',
    'article',
    '.content',
    '.main-content',
  ];

  let $target: cheerio.Cheerio<any> | null = null;
  for (const sel of selectors) {
    const $el = $(sel).first();
    if ($el.length && clean($el.text()).length > 100) {
      $target = $el;
      break;
    }
  }

  // Fallback: whole body with noise removed
  if (!$target) {
    $target = $('body').clone();
    $target
      .find(
        'script, style, nav, header, footer, noscript, iframe, ' +
          '[role="navigation"], .cookie-notice, .cookie-banner, ' +
          '.popup, .modal, .advertisement, .ad, #sidebar, .sidebar'
      )
      .remove();
  }

  const lines: string[] = [];

  $target
    .find(
      'h1, h2, h3, h4, h5, p, li, blockquote, dt, dd, figcaption, ' +
        '[class*="price"], [class*="menu-item"], [class*="description"]'
    )
    .each((_, el) => {
      const tag = (el as any).tagName?.toLowerCase() ?? '';
      const t = clean($(el).text());
      if (!t || t.length < 2) return;

      const map: Record<string, string> = {
        h1: `# ${t}`,
        h2: `\n## ${t}`,
        h3: `\n### ${t}`,
        h4: `**${t}**`,
        h5: `**${t}**`,
        li: `- ${t}`,
        blockquote: `> ${t}`,
      };
      lines.push(map[tag] ?? t);
    });

  const out = dedup(lines).join('\n').trim();
  return out.length > 50 ? out : null;
}

// ── Sub-extractors ───────────────────────────────────────────────────────────

function extractNavLinks($: cheerio.CheerioAPI, base: string) {
  const seen = new Set<string>();
  const out: { text: string; href: string }[] = [];

  $('nav a[href], [role="navigation"] a[href]').each((_, el) => {
    const text = clean($(el).text());
    const href = resolve($(el).attr('href') || '', base);
    if (text && text.length > 1 && href && !seen.has(text)) {
      seen.add(text);
      out.push({ text, href });
    }
  });
  return out;
}

function extractTables($: cheerio.CheerioAPI) {
  const tables: { headers: string[]; rows: string[][] }[] = [];

  $('table').each((_, table) => {
    const headers: string[] = [];
    $(table)
      .find('thead th, thead td, tr:first-child th')
      .each((_, th) => {
        headers.push(clean($(th).text()));
      });

    const rows: string[][] = [];
    $(table)
      .find('tbody tr, tr')
      .each((i, tr) => {
        if (i === 0 && headers.length && $(tr).find('th').length) return;
        const row: string[] = [];
        $(tr)
          .find('td, th')
          .each((_, td) => {
            row.push(clean($(td).text()));
          });
        
        if (row.some(c => c)) rows.push(row);
      });

    if (rows.length) tables.push({ headers, rows });
  });
  return tables;
}

function pdfLinks($: cheerio.CheerioAPI, base: string): string[] {
  const out: string[] = [];
  $('a[href$=".pdf"], a[href*=".pdf?"]').each((_, el) => {
    const href = resolve($(el).attr('href') || '', base);
    if (href && !out.includes(href)) out.push(href);
  });
  return out;
}

// ── JSON-LD formatting ───────────────────────────────────────────────────────

function formatJsonLd(ld: any, depth = 0): string {
  if (!ld || typeof ld !== 'object') return '';

  const p = '  '.repeat(depth);
  const lines: string[] = [];
  const type = ld['@type'] || '';

  // Special formatting for common Schema.org types
  if (['Restaurant', 'LocalBusiness', 'Hotel', 'FoodEstablishment'].includes(type)) {
    if (ld.name) lines.push(`${p}**Name:** ${ld.name}`);
    if (ld.description) lines.push(`${p}**Description:** ${ld.description}`);
    if (ld.servesCuisine) lines.push(`${p}**Cuisine:** ${ld.servesCuisine}`);
    if (ld.priceRange) lines.push(`${p}**Price Range:** ${ld.priceRange}`);
    if (ld.telephone) lines.push(`${p}**Phone:** ${ld.telephone}`);
    if (ld.address) {
      const a = ld.address;
      lines.push(
        `${p}**Address:** ${[a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].filter(Boolean).join(', ')}`
      );
    }
    if (ld.aggregateRating) {
      lines.push(
        `${p}**Rating:** ${ld.aggregateRating.ratingValue}/5 (${ld.aggregateRating.reviewCount} reviews)`
      );
    }
    if (ld.openingHoursSpecification) {
      lines.push(`${p}**Hours:**`);
      for (const h of ([] as any[]).concat(ld.openingHoursSpecification)) {
        const days = Array.isArray(h.dayOfWeek)
          ? h.dayOfWeek.join(', ')
          : h.dayOfWeek;
        lines.push(`${p}  ${days}: ${h.opens}–${h.closes}`);
      }
    }
    if (ld.hasMenu) lines.push(`${p}**Menu:** ${ld.hasMenu}`);
  } else {
    // Generic: output type + all string/number fields
    if (type) lines.push(`${p}**Type:** ${type}`);
    for (const [k, v] of Object.entries(ld)) {
      if (k.startsWith('@')) continue;
      if (typeof v === 'string' || typeof v === 'number') {
        lines.push(`${p}**${k}:** ${v}`);
      } else if (Array.isArray(v) && typeof v[0] === 'string') {
        lines.push(`${p}**${k}:** ${v.join(', ')}`);
      } else if (typeof v === 'object' && v !== null) {
        lines.push(formatJsonLd(v, depth + 1));
      }
    }
  }

  return lines.join('\n');
}

// ── Quality metrics ──────────────────────────────────────────────────────────

function computeQuality(
  data: ReturnType<typeof buildStructured>,
  markdown: string,
  reservations: ReservationInfo[] = []
) {
  const lines = markdown.split('\n').filter(l => l.trim().length > 0);
  const useful = lines.filter(l => l.length > 10);

  return {
    hasMainContent:
      markdown.includes('## Content') &&
      (markdown.split('## Content')[1]?.trim().length ?? 0) > 100,
    hasStructuredData: (data.jsonLd?.length ?? 0) > 0,
    hasNavigation: markdown.includes('## Navigation'),
    hasContactInfo: !!data.contactInfo,
    hasReservationWidget: reservations.length > 0,
    contentSections: (markdown.match(/^## /gm) || []).length,
    informationDensity: lines.length
      ? +(useful.length / lines.length).toFixed(2)
      : 0,
  };
}

// ── Utilities ────────────────────────────────────────────────────────────────

function estimateTokens(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.ceil(Math.max(words * 1.3, text.length / 4));
}

function clean(t: string): string {
  return t.replace(/\s+/g, ' ').trim();
}

function resolve(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function dedup(lines: string[]): string[] {
  return lines.filter((l, i) => !i || l !== lines[i - 1]);
}

function emptyResult(url: string, tokensOriginal: number): ExtractionResult {
  return {
    markdown: `# ${url}\n\n*No meaningful content extracted. Site may require JavaScript rendering.*`,
    structured: { title: url },
    pdfs: [],
    tokensOriginal,
    tokensExtracted: 20,
    quality: {
      hasMainContent: false,
      hasStructuredData: false,
      hasNavigation: false,
      hasContactInfo: false,
      hasReservationWidget: false,
      contentSections: 0,
      informationDensity: 0,
    },
  };
}

// ── Reservation widget detection ─────────────────────────────────────────────

function detectReservations($: cheerio.CheerioAPI, base: string): ReservationInfo[] {
  const results: ReservationInfo[] = [];
  const seen = new Set<string>();

  const platforms: { name: string; selectors: string[]; }[] = [
    {
      name: 'opentable',
      selectors: [
        'a[href*="opentable.com"]',
        'iframe[src*="opentable.com"]',
        '[class*="opentable"]',
        '[id*="opentable"]',
        'script[src*="opentable"]',
      ],
    },
    {
      name: 'resy',
      selectors: [
        'a[href*="resy.com"]',
        'iframe[src*="resy.com"]',
        '[class*="resy"]',
        'script[src*="resy"]',
      ],
    },
    {
      name: 'tock',
      selectors: [
        'a[href*="exploretock.com"]',
        'iframe[src*="exploretock.com"]',
        'script[src*="exploretock"]',
      ],
    },
    {
      name: 'yelp-reservations',
      selectors: [
        'a[href*="yelp.com/reservations"]',
      ],
    },
  ];

  for (const platform of platforms) {
    for (const selector of platform.selectors) {
      $(selector).each((_, el) => {
        const href = $(el).attr('href') || $(el).attr('src') || '';
        const resolved = href ? resolve(href, base) : '';
        const key = `${platform.name}:${resolved}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            platform: platform.name,
            url: resolved,
            confidence: resolved ? 0.95 : 0.7,
          });
        }
      });
    }
  }

  // Generic "reserve" / "book a table" links (lower confidence)
  if (results.length === 0) {
    $('a[href]').each((_, el) => {
      const text = clean($(el).text()).toLowerCase();
      const href = $(el).attr('href') || '';
      if (
        (text.includes('reserv') || text.includes('book a table') || text.includes('book now')) &&
        href && !href.startsWith('#') && !href.startsWith('javascript')
      ) {
        const resolved = resolve(href, base);
        if (!seen.has(resolved)) {
          seen.add(resolved);
          results.push({ platform: 'direct', url: resolved, confidence: 0.6 });
        }
      }
    });
  }

  return results;
}
