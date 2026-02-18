import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')?.replace('Bearer ', '');
  return auth === process.env.ADMIN_SECRET;
}

// GET — Single restaurant with all relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      hours: true,
      menuSections: { include: { items: true }, orderBy: { sortOrder: 'asc' } },
      verifiedFields: true,
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(restaurant);
}

// PUT — Update a restaurant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Update main restaurant fields
  const {
    hours,
    menuSections,
    verifiedFields,
    status: newStatus,
    ...fields
  } = body;

  // Parse numeric fields
  if (fields.ratingValue !== undefined) {
    fields.ratingValue = fields.ratingValue ? parseFloat(fields.ratingValue) : null;
  }
  if (fields.reviewCount !== undefined) {
    fields.reviewCount = fields.reviewCount ? parseInt(fields.reviewCount) : null;
  }

  const updateData: any = { ...fields };

  // If publishing, set lastVerified
  if (newStatus === 'published') {
    updateData.status = 'published';
    updateData.lastVerified = new Date();
  } else if (newStatus) {
    updateData.status = newStatus;
  }

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data: updateData,
    include: {
      hours: true,
      menuSections: { include: { items: true }, orderBy: { sortOrder: 'asc' } },
      verifiedFields: true,
    },
  });

  // Auto-create VerifiedField records for all non-null fields on publish or save
  if (newStatus === 'published' || !newStatus) {
    const fieldMap: { fieldName: string; hasValue: boolean }[] = [
      { fieldName: 'name', hasValue: !!restaurant.name },
      { fieldName: 'type', hasValue: !!restaurant.type },
      { fieldName: 'cuisine', hasValue: !!restaurant.cuisine },
      { fieldName: 'priceRange', hasValue: !!restaurant.priceRange },
      { fieldName: 'description', hasValue: !!restaurant.description },
      { fieldName: 'phone', hasValue: !!restaurant.phone },
      { fieldName: 'email', hasValue: !!restaurant.email },
      { fieldName: 'address', hasValue: !!restaurant.streetAddress },
      { fieldName: 'hours', hasValue: restaurant.hours.length > 0 },
      { fieldName: 'menu', hasValue: restaurant.menuSections.length > 0 || !!restaurant.menuUrl },
      { fieldName: 'reservation', hasValue: !!restaurant.reservationUrl },
      { fieldName: 'rating', hasValue: restaurant.ratingValue != null },
    ];

    for (const { fieldName, hasValue } of fieldMap) {
      if (hasValue) {
        await prisma.verifiedField.upsert({
          where: { restaurantId_fieldName: { restaurantId: id, fieldName } },
          update: { lastVerified: new Date(), confidence: 1.0, provenance: 'manual-entry' },
          create: { restaurantId: id, fieldName, confidence: 1.0, provenance: 'manual-entry' },
        });
      }
    }
  }

  // Update hours if provided (replace all)
  if (hours) {
    await prisma.operatingHours.deleteMany({ where: { restaurantId: id } });
    if (hours.length > 0) {
      await prisma.operatingHours.createMany({
        data: hours.map((h: any) => ({
          restaurantId: id,
          dayOfWeek: h.dayOfWeek,
          opens: h.opens || '',
          closes: h.closes || '',
          isClosed: h.isClosed || false,
          label: h.label || null,
        })),
      });
    }
  }

  // Update menu sections if provided (replace all)
  if (menuSections) {
    // Delete existing sections (cascades to items)
    await prisma.menuSection.deleteMany({ where: { restaurantId: id } });

    for (let i = 0; i < menuSections.length; i++) {
      const section = menuSections[i];
      const created = await prisma.menuSection.create({
        data: {
          restaurantId: id,
          name: section.name,
          sortOrder: i,
        },
      });

      if (section.items?.length) {
        await prisma.menuItem.createMany({
          data: section.items.map((item: any, j: number) => ({
            sectionId: created.id,
            name: item.name,
            description: item.description || null,
            price: item.price ? parseFloat(item.price) : null,
            currency: item.currency || 'USD',
            dietaryFlags: item.dietaryFlags || [],
            available: item.available !== false,
            sortOrder: j,
          })),
        });
      }
    }
  }

  // Update verified fields if provided (upsert each)
  if (verifiedFields) {
    for (const vf of verifiedFields) {
      const confidence = Math.max(0, Math.min(1, parseFloat(vf.confidence) || 0));
      await prisma.verifiedField.upsert({
        where: {
          restaurantId_fieldName: {
            restaurantId: id,
            fieldName: vf.fieldName,
          },
        },
        update: {
          provenance: vf.provenance || 'manual-entry',
          confidence,
          lastVerified: new Date(),
          notes: vf.notes || null,
        },
        create: {
          restaurantId: id,
          fieldName: vf.fieldName,
          provenance: vf.provenance || 'manual-entry',
          confidence,
          notes: vf.notes || null,
        },
      });
    }
  }

  // Re-fetch with all relations
  const updated = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      hours: true,
      menuSections: { include: { items: true }, orderBy: { sortOrder: 'asc' } },
      verifiedFields: true,
    },
  });

  return NextResponse.json(updated);
}

// DELETE — Remove a restaurant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  await prisma.restaurant.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
