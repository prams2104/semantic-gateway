'use client';

import { useState, useRef } from 'react';

interface ReservationInfo {
  platform: string;
  url: string;
  confidence: number;
}

interface ReportData {
  url: string;
  markdown: string;
  structured_data: {
    title?: string;
    description?: string;
    ogData?: Record<string, string>;
    jsonLd?: any[];
    contactInfo?: { phones: string[]; emails: string[]; addresses: string[] };
    reservations?: ReservationInfo[];
  };
  pdfs_extracted: string[];
  meta: {
    processing_time_ms: number;
    tokens_original: number;
    tokens_extracted: number;
    tokens_saved: number;
    tokens_saved_percent: number;
    cost_saved_usd: number;
  };
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

function computeVisibilityScore(data: ReportData): number {
  let score = 0;
  const q = data.quality;
  const s = data.structured_data;
  if (q.hasStructuredData) {
    score += 18;
    const ld = s.jsonLd || [];
    if (ld.some((l: any) => ['Restaurant','FoodEstablishment','LocalBusiness','Hotel','LodgingBusiness'].includes(l['@type']))) score += 8;
    if (ld.some((l: any) => l.aggregateRating)) score += 5;
    if (ld.some((l: any) => l.openingHoursSpecification)) score += 5;
  }
  if (q.hasContactInfo) {
    if (s.contactInfo?.phones?.length) score += 7;
    if (s.contactInfo?.emails?.length) score += 3;
    if (s.contactInfo?.addresses?.length) score += 7;
  }
  if (q.hasMainContent) score += 8;
  if (q.informationDensity > 0.7) score += 4;
  else if (q.informationDensity > 0.4) score += 2;
  if (q.contentSections >= 3) score += 4;
  if (data.pdfs_extracted?.length > 0) score += 4;
  if (s.jsonLd?.some((l: any) => l.hasMenu)) score += 5;
  if (s.ogData && Object.keys(s.ogData).length >= 3) score += 4;
  if (s.description && s.description.length > 20) score += 4;
  // Reservation / bookability — high signal for hospitality
  if (q.hasReservationWidget) score += 9;
  return Math.min(score, 100);
}

function getScoreColor(s: number) { return s >= 75 ? '#22c55e' : s >= 50 ? '#eab308' : s >= 25 ? '#f97316' : '#ef4444'; }
function getScoreLabel(s: number) { return s >= 75 ? 'Strong' : s >= 50 ? 'Moderate' : s >= 25 ? 'Weak' : 'Critical'; }

export default function ReportPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true); setError(''); setData(null);
    try {
      const res = await fetch('/api/v1/calculator', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      const d = await res.json(); setData(d);
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    } catch (err: any) { setError(err.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  const score = data ? computeVisibilityScore(data) : 0;
  const scoreColor = getScoreColor(score);
  const jsonLd = data?.structured_data?.jsonLd || [];
  const businessLd = jsonLd.find((l: any) => ['Restaurant','FoodEstablishment','LocalBusiness','Hotel','LodgingBusiness','CafeOrCoffeeShop','BarOrPub'].includes(l['@type']));

  const checks = data ? [
    { category: 'Business Identity', items: [
      { label: 'Business name', found: !!data.structured_data.title, value: data.structured_data.title || null, impact: "AI agents can't recommend you if they don't know your name." },
      { label: 'Description', found: !!(data.structured_data.description && data.structured_data.description.length > 20), value: data.structured_data.description || null, impact: 'Without a description, agents give generic or inaccurate summaries.' },
      { label: 'Business type (Schema.org)', found: !!businessLd, value: businessLd?.['@type'] || null, impact: "Agents don't know if you're a restaurant, bar, or hotel without this." },
      { label: 'Cuisine type', found: !!businessLd?.servesCuisine, value: businessLd?.servesCuisine || null, impact: 'When someone asks "best Italian near me," you won\'t appear.' },
      { label: 'Price range', found: !!businessLd?.priceRange, value: businessLd?.priceRange || null, impact: 'Agents can\'t match you to "affordable" or "fine dining" queries.' },
    ]},
    { category: 'Contact & Location', items: [
      { label: 'Phone number', found: !!(data.structured_data.contactInfo?.phones?.length), value: data.structured_data.contactInfo?.phones?.[0] || null, impact: 'Customers asking "call this restaurant" get nothing.' },
      { label: 'Address', found: !!(data.structured_data.contactInfo?.addresses?.length || businessLd?.address), value: businessLd?.address ? [businessLd.address.streetAddress, businessLd.address.addressLocality].filter(Boolean).join(', ') : data.structured_data.contactInfo?.addresses?.[0] || null, impact: '"Where is this restaurant?" returns no answer.' },
      { label: 'Email', found: !!(data.structured_data.contactInfo?.emails?.length), value: data.structured_data.contactInfo?.emails?.[0] || null, impact: 'Minor — most customers call or visit, but agents may look for this.' },
    ]},
    { category: 'Reputation & Trust', items: [
      { label: 'Star rating', found: !!businessLd?.aggregateRating, value: businessLd?.aggregateRating ? `${businessLd.aggregateRating.ratingValue}/5 (${businessLd.aggregateRating.reviewCount} reviews)` : null, impact: 'Agents rank recommendations by rating. No rating = no priority.' },
      { label: 'Social preview image (OG)', found: !!data.structured_data.ogData?.image, value: data.structured_data.ogData?.image ? 'Found' : null, impact: 'When shared or cited, your listing looks empty without an image.' },
    ]},
    { category: 'Operations', items: [
      { label: 'Hours of operation', found: !!businessLd?.openingHoursSpecification, value: businessLd?.openingHoursSpecification ? 'Found' : null, impact: '"Are they open right now?" — agents can\'t answer this.' },
      { label: 'Menu link', found: !!businessLd?.hasMenu, value: businessLd?.hasMenu || null, impact: '"What\'s on the menu?" is unanswerable without this.' },
      { label: 'Menu in PDF (needs parsing)', found: (data.pdfs_extracted?.length || 0) > 0, value: data.pdfs_extracted?.length ? `${data.pdfs_extracted.length} PDF(s) found` : null, impact: 'Your menu exists but is locked inside a PDF that AI agents cannot read.' },
    ]},
    { category: 'Bookability', items: [
      { label: 'Reservation widget', found: !!data.quality.hasReservationWidget, value: data.structured_data.reservations?.[0] ? `${data.structured_data.reservations[0].platform} detected` : null, impact: 'When a customer says "book me a table," agents need a reservation link to complete the action.' },
      { label: 'Online ordering link', found: !!(businessLd?.potentialAction?.some?.((a: any) => a['@type'] === 'OrderAction')), value: businessLd?.potentialAction?.find?.((a: any) => a['@type'] === 'OrderAction') ? 'Found' : null, impact: '"Order from this restaurant" fails without a direct ordering link.' },
    ]},
  ] : [];

  const totalChecks = checks.reduce((s, c) => s + c.items.length, 0);
  const passedChecks = checks.reduce((s, c) => s + c.items.filter(i => i.found).length, 0);
  const failedChecks = totalChecks - passedChecks;

  const font = "'DM Sans', sans-serif";
  const heading = "'Fraunces', Georgia, serif";

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', color: '#1c1917', fontFamily: "'Georgia', serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700;9..144,900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`@media print {
        .no-print { display: none !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        div { break-inside: avoid; }
      }`}</style>

      <header style={{ padding: '20px 32px', borderBottom: '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
        <a href="/" style={{ color: '#1c1917', textDecoration: 'none', fontFamily: heading, fontWeight: 700, fontSize: '1.1rem' }}>Semantic Gateway</a>
        <span style={{ fontFamily: font, fontSize: '0.8rem', color: '#78716c', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Visibility Report</span>
      </header>

      <div className="no-print" style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px 48px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: heading, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-0.02em' }}>
          Can AI agents<br />find your business?
        </h1>
        <p style={{ fontFamily: font, fontSize: '1.1rem', color: '#78716c', lineHeight: 1.7, maxWidth: '500px', margin: '0 auto 40px' }}>
          When a customer asks ChatGPT, Perplexity, or Siri for a recommendation, your website needs to speak their language. See exactly what AI sees — and what it misses.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '540px', margin: '0 auto' }}>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourrestaurant.com" required
            style={{ flex: 1, padding: '14px 18px', background: '#fff', border: '2px solid #d6d3d1', borderRadius: '8px', color: '#1c1917', fontSize: '1rem', fontFamily: font, outline: 'none' }} />
          <button type="submit" disabled={loading}
            style={{ padding: '14px 28px', background: loading ? '#a8a29e' : '#1c1917', color: '#fafaf9', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontFamily: font, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
            {loading ? 'Analyzing...' : 'Run Report'}
          </button>
        </form>

        {error && <p style={{ marginTop: '16px', color: '#dc2626', fontFamily: font, fontSize: '0.9rem' }}>{error}</p>}

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: '#a8a29e', fontFamily: font }}>Try:</span>
          {['https://treehousesm.com', 'https://www.georgesatthecove.com', 'https://www.cataniasd.com'].map(ex => (
            <button key={ex} onClick={() => setUrl(ex)}
              style={{ background: 'none', border: '1px solid #d6d3d1', color: '#78716c', padding: '3px 10px', borderRadius: '5px', fontSize: '0.75rem', cursor: 'pointer', fontFamily: font }}>
              {ex.replace('https://', '').replace('www.', '')}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e7e5e4', borderTop: '3px solid #1c1917', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontFamily: font, color: '#78716c', fontSize: '0.9rem' }}>Scanning your website the way an AI agent would...</p>
        </div>
      )}

      {data && (
        <div ref={reportRef} style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 100px' }}>

          <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '48px 40px', textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontFamily: font, fontSize: '0.75rem', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>AI Visibility Score</div>
            <div style={{ fontFamily: heading, fontSize: '5rem', fontWeight: 900, color: scoreColor, lineHeight: 1, marginBottom: '8px' }}>{score}</div>
            <div style={{ fontFamily: font, fontSize: '1rem', color: scoreColor, fontWeight: 600, marginBottom: '20px' }}>{getScoreLabel(score)} Visibility</div>
            <div style={{ fontFamily: font, fontSize: '0.85rem', color: '#78716c', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
              {score >= 75 ? `${data.structured_data.title || 'Your business'} is well-structured for AI discovery. Most agents can find and recommend you accurately.`
                : score >= 50 ? `${data.structured_data.title || 'Your business'} has some visibility, but AI agents are missing key details that could cost you recommendations.`
                : `${data.structured_data.title || 'Your business'} is largely invisible to AI agents. When customers ask for recommendations, you're unlikely to appear.`}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #f5f5f4', fontFamily: font, fontSize: '0.85rem' }}>
              <div><span style={{ color: '#22c55e', fontWeight: 700, fontSize: '1.2rem' }}>{passedChecks}</span><div style={{ color: '#a8a29e', marginTop: '2px' }}>visible</div></div>
              <div><span style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.2rem' }}>{failedChecks}</span><div style={{ color: '#a8a29e', marginTop: '2px' }}>missing</div></div>
              <div><span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#1c1917' }}>{totalChecks}</span><div style={{ color: '#a8a29e', marginTop: '2px' }}>checked</div></div>
            </div>
            <button className="no-print" onClick={() => window.print()}
              style={{ marginTop: '20px', padding: '10px 24px', background: 'none', border: '1px solid #d6d3d1', borderRadius: '8px', color: '#78716c', fontSize: '0.85rem', fontFamily: font, cursor: 'pointer' }}>
              Save as PDF
            </button>
          </div>

          {businessLd && (
            <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
              <h2 style={{ fontFamily: heading, fontSize: '1.3rem', fontWeight: 700, marginTop: 0, marginBottom: '16px' }}>What AI agents see</h2>
              <p style={{ fontFamily: font, fontSize: '0.85rem', color: '#78716c', marginBottom: '20px' }}>This is the structured data AI agents extract from your website. If a field is blank, agents guess or skip it.</p>
              <div style={{ background: '#fafaf9', borderRadius: '8px', padding: '20px', fontFamily: font, fontSize: '0.9rem', lineHeight: 2 }}>
                {businessLd.name && <div><span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '90px' }}>Name</span> <strong>{businessLd.name}</strong></div>}
                {businessLd['@type'] && <div><span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '90px' }}>Type</span> {businessLd['@type']}</div>}
                {businessLd.servesCuisine && <div><span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '90px' }}>Cuisine</span> {businessLd.servesCuisine}</div>}
                {businessLd.priceRange && <div><span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '90px' }}>Price</span> {businessLd.priceRange}</div>}
                {businessLd.telephone && <div><span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '90px' }}>Phone</span> {businessLd.telephone}</div>}
                {businessLd.aggregateRating && <div><span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '90px' }}>Rating</span> {businessLd.aggregateRating.ratingValue}/5 ({businessLd.aggregateRating.reviewCount} reviews)</div>}
                {businessLd.address && <div><span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '90px' }}>Address</span> {[businessLd.address.streetAddress, businessLd.address.addressLocality, businessLd.address.addressRegion].filter(Boolean).join(', ')}</div>}
                {businessLd.openingHoursSpecification && <div><span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '90px' }}>Hours</span> ✓ Published</div>}
                {businessLd.hasMenu && <div><span style={{ color: '#a8a29e', display: 'inline-block', minWidth: '90px' }}>Menu</span> ✓ Linked</div>}
              </div>
            </div>
          )}

          {checks.map((section, si) => (
            <div key={si} style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '32px', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: heading, fontSize: '1.1rem', fontWeight: 700, marginTop: 0, marginBottom: '20px' }}>{section.category}</h3>
              {section.items.map((item, ii) => (
                <div key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 0', borderTop: ii > 0 ? '1px solid #f5f5f4' : 'none' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>{item.found ? '✅' : '❌'}</span>
                  <div style={{ flex: 1, fontFamily: font }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1c1917', marginBottom: '2px' }}>
                      {item.label}
                      {item.found && item.value && <span style={{ fontWeight: 400, color: '#78716c', marginLeft: '8px', fontSize: '0.85rem' }}> — {typeof item.value === 'string' && item.value.length > 60 ? item.value.substring(0, 60) + '...' : item.value}</span>}
                    </div>
                    {!item.found && <div style={{ fontSize: '0.8rem', color: '#dc2626', lineHeight: 1.5, marginTop: '4px' }}>{item.impact}</div>}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {(data.pdfs_extracted?.length || 0) > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '28px 32px', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: heading, fontSize: '1.1rem', fontWeight: 700, marginTop: 0, marginBottom: '12px', color: '#92400e' }}>
                ⚠️ Your menu is locked in a PDF
              </h3>
              <p style={{ fontFamily: font, fontSize: '0.9rem', color: '#78716c', lineHeight: 1.7, margin: 0 }}>
                We found {data.pdfs_extracted.length} PDF document{data.pdfs_extracted.length > 1 ? 's' : ''} on your site.
                AI agents <strong>cannot read PDF files</strong>. When a customer asks &ldquo;what&rsquo;s on the menu at {data.structured_data.title}?&rdquo; the agent has no answer.
              </p>
              <p style={{ fontFamily: font, fontSize: '0.85rem', color: '#a16207', marginTop: '12px', marginBottom: 0, fontWeight: 500 }}>
                This is the #1 thing you can fix to improve AI recommendations.
              </p>
            </div>
          )}

          {data.structured_data.reservations && data.structured_data.reservations.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '28px 32px', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: heading, fontSize: '1.1rem', fontWeight: 700, marginTop: 0, marginBottom: '12px', color: '#166534' }}>
                Reservation widget detected
              </h3>
              <p style={{ fontFamily: font, fontSize: '0.9rem', color: '#78716c', lineHeight: 1.7, margin: 0 }}>
                We found a <strong>{data.structured_data.reservations[0].platform}</strong> integration on your site.
                This means AI agents can potentially direct customers to book with you — a strong signal for discovery.
              </p>
            </div>
          )}

          <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '32px', marginBottom: '32px', marginTop: '32px' }}>
            <h2 style={{ fontFamily: heading, fontSize: '1.3rem', fontWeight: 700, marginTop: 0, marginBottom: '16px' }}>Why this matters</h2>
            <div style={{ fontFamily: font, fontSize: '0.9rem', color: '#57534e', lineHeight: 1.8 }}>
              <p style={{ marginTop: 0 }}>Millions of people now ask AI assistants for restaurant recommendations instead of searching Google or Yelp. ChatGPT, Perplexity, Apple Intelligence, and Google Gemini all pull data directly from your website to decide whether to recommend you.</p>
              <p>If your site has clean structured data, AI agents recommend you with accurate details — your cuisine, price range, hours, location, and ratings. If that data is missing or locked in PDFs, you&rsquo;re invisible.</p>
              <p style={{ marginBottom: 0 }}><strong>Your competitors who show up in AI recommendations will capture the customers who never find you.</strong></p>
            </div>
          </div>

          <div style={{ background: '#1c1917', borderRadius: '12px', padding: '40px 32px', textAlign: 'center' }}>
            <h3 style={{ fontFamily: heading, fontSize: '1.4rem', fontWeight: 700, color: '#fafaf9', marginTop: 0, marginBottom: '12px' }}>Want to fix your AI visibility?</h3>
            <p style={{ fontFamily: font, fontSize: '0.9rem', color: '#a8a29e', marginBottom: '24px', lineHeight: 1.6 }}>We help restaurants and hotels become discoverable by AI agents. Free consultation — we&rsquo;ll show you exactly what to fix and how.</p>
            <a href="/contact" style={{ display: 'inline-block', padding: '14px 36px', background: '#fafaf9', color: '#1c1917', borderRadius: '8px', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: '0.95rem' }}>Get a Free Consultation</a>
          </div>

          <p style={{ fontFamily: font, fontSize: '0.75rem', color: '#a8a29e', textAlign: 'center', marginTop: '24px', lineHeight: 1.6 }}>
            Report generated by Semantic Gateway &middot; {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
}