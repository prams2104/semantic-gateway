import { prisma } from '@/lib/db';
import { buildSchemaOrgJsonLd, buildConfidenceMetadata } from '@/lib/schema';
import type { RestaurantWithRelations } from '@/lib/schema';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RestaurantProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug, status: 'published' },
    include: {
      hours: true,
      menuSections: { include: { items: true }, orderBy: { sortOrder: 'asc' } },
      verifiedFields: true,
    },
  });

  if (!restaurant) notFound();

  const typed = restaurant as RestaurantWithRelations;
  const jsonLd = buildSchemaOrgJsonLd(typed);
  const confidence = buildConfidenceMetadata(typed);

  const font = "'DM Sans', sans-serif";
  const heading = "'Fraunces', Georgia, serif";

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedHours = [...restaurant.hours].sort(
    (a, b) => dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek)
  );

  return (
    <html lang="en">
      <head>
        <title>{restaurant.name} — Verified by Semantic Gateway</title>
        <meta name="description" content={restaurant.description || `Verified restaurant profile for ${restaurant.name}`} />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700;9..144,900&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ margin: 0, minHeight: '100vh', background: '#fafaf9', color: '#1c1917', fontFamily: font }}>

        {/* Header */}
        <header style={{ padding: '20px 32px', borderBottom: '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <a href="/" style={{ color: '#1c1917', textDecoration: 'none', fontFamily: heading, fontWeight: 700, fontSize: '1.1rem' }}>Semantic Gateway</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600 }}>
              Verified
            </span>
            {restaurant.lastVerified && (
              <span style={{ fontSize: '0.75rem', color: '#a8a29e' }}>
                {new Date(restaurant.lastVerified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </header>

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 100px' }}>

          {/* Hero */}
          <div style={{ marginBottom: '40px' }}>
            {restaurant.imageUrl && (
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '12px', marginBottom: '24px' }}
              />
            )}
            <h1 style={{ fontFamily: heading, fontSize: '2.4rem', fontWeight: 900, lineHeight: 1.15, marginBottom: '12px', marginTop: 0 }}>
              {restaurant.name}
            </h1>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
              {restaurant.type && (
                <span style={{ background: '#f5f5f4', padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#57534e' }}>
                  {restaurant.type}
                </span>
              )}
              {restaurant.cuisine && (
                <span style={{ background: '#f5f5f4', padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#57534e' }}>
                  {restaurant.cuisine}
                </span>
              )}
              {restaurant.priceRange && (
                <span style={{ background: '#f5f5f4', padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#57534e' }}>
                  {restaurant.priceRange}
                </span>
              )}
              {restaurant.ratingValue != null && (
                <span style={{ fontSize: '0.85rem', color: '#57534e' }}>
                  {restaurant.ratingValue}/5{restaurant.reviewCount != null ? ` (${restaurant.reviewCount} reviews)` : ''}
                </span>
              )}
            </div>
            {restaurant.description && (
              <p style={{ fontSize: '1rem', color: '#57534e', lineHeight: 1.7, margin: 0 }}>
                {restaurant.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '40px' }}>
            {restaurant.reservationUrl && (
              <a href={restaurant.reservationUrl} target="_blank" rel="noopener noreferrer"
                style={{ padding: '12px 24px', background: '#1c1917', color: '#fafaf9', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                Reserve a Table
              </a>
            )}
            {restaurant.orderUrl && (
              <a href={restaurant.orderUrl} target="_blank" rel="noopener noreferrer"
                style={{ padding: '12px 24px', background: '#fff', color: '#1c1917', border: '2px solid #d6d3d1', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                Order Online
              </a>
            )}
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`}
                style={{ padding: '12px 24px', background: '#fff', color: '#1c1917', border: '2px solid #d6d3d1', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                Call
              </a>
            )}
            {restaurant.directionsUrl && (
              <a href={restaurant.directionsUrl} target="_blank" rel="noopener noreferrer"
                style={{ padding: '12px 24px', background: '#fff', color: '#1c1917', border: '2px solid #d6d3d1', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                Directions
              </a>
            )}
          </div>

          {/* Contact & Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
            {/* Contact */}
            <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ fontFamily: heading, fontSize: '1.1rem', fontWeight: 700, marginTop: 0, marginBottom: '16px' }}>Contact</h2>
              <div style={{ fontSize: '0.9rem', lineHeight: 2, color: '#57534e' }}>
                {restaurant.phone && <div><span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '70px' }}>Phone</span> {restaurant.phone}</div>}
                {restaurant.email && <div><span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '70px' }}>Email</span> {restaurant.email}</div>}
                {restaurant.streetAddress && (
                  <div>
                    <span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '70px' }}>Address</span>
                    {[restaurant.streetAddress, restaurant.city, restaurant.state, restaurant.postalCode].filter(Boolean).join(', ')}
                  </div>
                )}
                {restaurant.websiteUrl && (
                  <div>
                    <span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '70px' }}>Web</span>
                    <a href={restaurant.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1c1917' }}>
                      {restaurant.websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Hours */}
            {sortedHours.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '24px' }}>
                <h2 style={{ fontFamily: heading, fontSize: '1.1rem', fontWeight: 700, marginTop: 0, marginBottom: '16px' }}>Hours</h2>
                <div style={{ fontSize: '0.9rem', lineHeight: 2, color: '#57534e' }}>
                  {sortedHours.map((h, i) => (
                    <div key={i}>
                      <span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '90px' }}>
                        {h.dayOfWeek.substring(0, 3)}
                      </span>
                      {h.isClosed ? (
                        <span style={{ color: '#ef4444' }}>Closed</span>
                      ) : (
                        <span>{h.opens} – {h.closes}</span>
                      )}
                      {h.label && <span style={{ color: '#a8a29e', marginLeft: '8px', fontSize: '0.8rem' }}>({h.label})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Menu */}
          {restaurant.menuSections.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '32px', marginBottom: '40px' }}>
              <h2 style={{ fontFamily: heading, fontSize: '1.3rem', fontWeight: 700, marginTop: 0, marginBottom: '28px' }}>Menu</h2>
              {restaurant.menuSections
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((section) => (
                  <div key={section.id} style={{ marginBottom: '28px' }}>
                    <h3 style={{ fontFamily: heading, fontSize: '1rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', marginTop: 0 }}>
                      {section.name}
                    </h3>
                    {section.items
                      .filter((item) => item.available)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #f5f5f4' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: '2px' }}>
                              {item.name}
                              {item.dietaryFlags.length > 0 && (
                                <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#a8a29e' }}>
                                  {item.dietaryFlags.join(', ')}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <div style={{ fontSize: '0.8rem', color: '#a8a29e', lineHeight: 1.5 }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                          {item.price != null && (
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginLeft: '16px', whiteSpace: 'nowrap' }}>
                              ${item.price.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          )}

          {/* Confidence metadata */}
          {restaurant.verifiedFields.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '32px', marginBottom: '40px' }}>
              <h2 style={{ fontFamily: heading, fontSize: '1.1rem', fontWeight: 700, marginTop: 0, marginBottom: '16px' }}>Data Verification</h2>
              <p style={{ fontSize: '0.85rem', color: '#78716c', marginBottom: '16px' }}>
                Each field is tracked with provenance, confidence score, and freshness timestamp.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {restaurant.verifiedFields.map((vf) => (
                  <div key={vf.id} style={{ background: '#fafaf9', borderRadius: '8px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', textTransform: 'capitalize' }}>{vf.fieldName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#78716c' }}>
                      <span style={{ color: vf.confidence >= 0.9 ? '#22c55e' : vf.confidence >= 0.7 ? '#eab308' : '#f97316' }}>
                        {(vf.confidence * 100).toFixed(0)}%
                      </span>
                      {' · '}
                      {vf.provenance.replace(/-/g, ' ')}
                      {' · '}
                      {new Date(vf.lastVerified).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: '32px 0', borderTop: '1px solid #e7e5e4' }}>
            <p style={{ fontSize: '0.8rem', color: '#a8a29e', marginBottom: '12px' }}>
              Verified profile powered by Semantic Gateway
            </p>
            <a href="/report" style={{ fontSize: '0.85rem', color: '#1c1917', fontWeight: 600, textDecoration: 'none' }}>
              Run your own AI Visibility Audit →
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
