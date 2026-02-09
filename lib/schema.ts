/**
 * Semantic Gateway — Schema.org JSON-LD Builder
 *
 * Builds valid Schema.org Restaurant JSON-LD from a Prisma Restaurant
 * record with its relations. Reused by:
 *   - /r/[slug] (injected into page head)
 *   - /api/v1/restaurants/[id] (response body)
 *   - /api/embed/[id] (injected into restaurant's site)
 */

import type {
  Restaurant,
  OperatingHours,
  MenuSection,
  MenuItem,
  VerifiedField,
} from '@prisma/client';

export type RestaurantWithRelations = Restaurant & {
  hours: OperatingHours[];
  menuSections: (MenuSection & { items: MenuItem[] })[];
  verifiedFields: VerifiedField[];
};

export function buildSchemaOrgJsonLd(restaurant: RestaurantWithRelations) {
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': restaurant.type || 'Restaurant',
    name: restaurant.name,
  };

  if (restaurant.description) jsonLd.description = restaurant.description;
  if (restaurant.cuisine) jsonLd.servesCuisine = restaurant.cuisine;
  if (restaurant.priceRange) jsonLd.priceRange = restaurant.priceRange;
  if (restaurant.phone) jsonLd.telephone = restaurant.phone;
  if (restaurant.email) jsonLd.email = restaurant.email;
  if (restaurant.imageUrl) jsonLd.image = restaurant.imageUrl;
  if (restaurant.websiteUrl) jsonLd.url = restaurant.websiteUrl;

  // Address
  if (restaurant.streetAddress || restaurant.city) {
    jsonLd.address = {
      '@type': 'PostalAddress',
      ...(restaurant.streetAddress && { streetAddress: restaurant.streetAddress }),
      ...(restaurant.city && { addressLocality: restaurant.city }),
      ...(restaurant.state && { addressRegion: restaurant.state }),
      ...(restaurant.postalCode && { postalCode: restaurant.postalCode }),
    };
  }

  // Aggregate rating
  if (restaurant.ratingValue != null) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: restaurant.ratingValue,
      ...(restaurant.reviewCount != null && { reviewCount: restaurant.reviewCount }),
    };
  }

  // Opening hours
  const activeHours = restaurant.hours.filter(h => !h.isClosed);
  if (activeHours.length) {
    jsonLd.openingHoursSpecification = activeHours.map(h => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    }));
  }

  // Menu
  if (restaurant.menuSections.length) {
    jsonLd.hasMenu = {
      '@type': 'Menu',
      hasMenuSection: restaurant.menuSections
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(section => ({
          '@type': 'MenuSection',
          name: section.name,
          hasMenuItem: section.items
            .filter(item => item.available)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(item => {
              const menuItem: Record<string, any> = {
                '@type': 'MenuItem',
                name: item.name,
              };
              if (item.description) menuItem.description = item.description;
              if (item.price != null) {
                menuItem.offers = {
                  '@type': 'Offer',
                  price: item.price,
                  priceCurrency: item.currency,
                };
              }
              if (item.dietaryFlags.length) {
                menuItem.suitableForDiet = item.dietaryFlags.map(
                  f => `https://schema.org/${f.charAt(0).toUpperCase() + f.slice(1)}Diet`
                );
              }
              return menuItem;
            }),
        })),
    };
  } else if (restaurant.menuUrl) {
    jsonLd.hasMenu = restaurant.menuUrl;
  }

  // Actions
  const actions: any[] = [];
  if (restaurant.reservationUrl) {
    actions.push({
      '@type': 'ReserveAction',
      target: restaurant.reservationUrl,
    });
  }
  if (restaurant.orderUrl) {
    actions.push({
      '@type': 'OrderAction',
      target: restaurant.orderUrl,
    });
  }
  if (actions.length) jsonLd.potentialAction = actions;

  return jsonLd;
}

/**
 * Build the _semanticGateway confidence extension from VerifiedField records.
 */
export function buildConfidenceMetadata(restaurant: RestaurantWithRelations) {
  const confidence: Record<string, { value: number; provenance: string; lastVerified: string }> = {};

  for (const field of restaurant.verifiedFields) {
    confidence[field.fieldName] = {
      value: field.confidence,
      provenance: field.provenance,
      lastVerified: field.lastVerified.toISOString(),
    };
  }

  return {
    verified: restaurant.status === 'published',
    lastVerified: restaurant.lastVerified?.toISOString() || null,
    confidence,
  };
}
