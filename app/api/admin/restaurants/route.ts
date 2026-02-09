import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')?.replace('Bearer ', '');
  return auth === process.env.ADMIN_SECRET;
}

// GET — List all restaurants
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const restaurants = await prisma.restaurant.findMany({
    include: {
      hours: true,
      menuSections: { include: { items: true }, orderBy: { sortOrder: 'asc' } },
      verifiedFields: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(restaurants);
}

// POST — Create a new restaurant
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, websiteUrl, ...rest } = body;

  if (!name || !slug || !websiteUrl) {
    return NextResponse.json(
      { error: 'name, slug, and websiteUrl are required' },
      { status: 400 }
    );
  }

  // Check slug uniqueness
  const existing = await prisma.restaurant.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: `Slug "${slug}" is already taken` },
      { status: 409 }
    );
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      name,
      slug,
      websiteUrl,
      type: rest.type || 'Restaurant',
      cuisine: rest.cuisine,
      priceRange: rest.priceRange,
      description: rest.description,
      imageUrl: rest.imageUrl,
      phone: rest.phone,
      email: rest.email,
      streetAddress: rest.streetAddress,
      city: rest.city,
      state: rest.state,
      postalCode: rest.postalCode,
      ratingValue: rest.ratingValue ? parseFloat(rest.ratingValue) : null,
      reviewCount: rest.reviewCount ? parseInt(rest.reviewCount) : null,
      reservationUrl: rest.reservationUrl,
      orderUrl: rest.orderUrl,
      directionsUrl: rest.directionsUrl,
      menuUrl: rest.menuUrl,
    },
    include: {
      hours: true,
      menuSections: { include: { items: true } },
      verifiedFields: true,
    },
  });

  return NextResponse.json(restaurant, { status: 201 });
}
