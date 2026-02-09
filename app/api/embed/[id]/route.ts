import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { buildSchemaOrgJsonLd } from '@/lib/schema';
import type { RestaurantWithRelations } from '@/lib/schema';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id, status: 'published' },
    include: {
      hours: true,
      menuSections: { include: { items: true }, orderBy: { sortOrder: 'asc' } },
      verifiedFields: true,
    },
  });

  if (!restaurant) {
    return new Response('/* Semantic Gateway: restaurant not found */', {
      status: 404,
      headers: { 'Content-Type': 'application/javascript' },
    });
  }

  const typed = restaurant as RestaurantWithRelations;
  const jsonLd = buildSchemaOrgJsonLd(typed);
  const slug = restaurant.slug;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://semanticgateway.ai';

  const script = `(function(){
  try {
    // Inject Schema.org JSON-LD
    var ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = ${JSON.stringify(JSON.stringify(jsonLd))};
    document.head.appendChild(ld);

    // Inject canonical link to verified profile
    var link = document.createElement('link');
    link.rel = 'canonical';
    link.href = '${baseUrl}/r/${slug}';
    document.head.appendChild(link);
  } catch(e) {
    console.warn('[SemanticGateway] Embed error:', e);
  }
})();`;

  return new Response(script, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
