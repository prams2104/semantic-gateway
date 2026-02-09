import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildSchemaOrgJsonLd, buildConfidenceMetadata } from '@/lib/schema';
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
    return NextResponse.json(
      { error: 'Restaurant not found or not published' },
      { status: 404 }
    );
  }

  const typed = restaurant as RestaurantWithRelations;
  const jsonLd = buildSchemaOrgJsonLd(typed);
  const confidenceMeta = buildConfidenceMetadata(typed);

  const response = {
    ...jsonLd,
    _semanticGateway: confidenceMeta,
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/ld+json',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
