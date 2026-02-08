'use client';

import { useState, useEffect, useRef } from 'react';

interface ExtractionResult {
  url: string;
  markdown: string;
  structured_data: {
    title?: string;
    description?: string;
    ogData?: Record<string, string>;
    jsonLd?: any[];
    contactInfo?: { phones: string[]; emails: string[]; addresses: string[] };
  };
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
    contentSections: number;
    informationDensity: number;
  };
}

const MODEL_COSTS: Record<string, { input: number; name: string }> = {
  'gpt4o': { input: 0.0025, name: 'GPT-4o' },
  'gpt4o-mini': { input: 0.00015, name: 'GPT-4o Mini' },
  'claude-sonnet': { input: 0.003, name: 'Claude Sonnet 4' },
  'claude-haiku': { input: 0.0008, name: 'Claude Haiku 3.5' },
};

export default function CalculatorPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt4o');
  const [queriesPerMonth, setQueriesPerMonth] = useState(10000);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/v1/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Extraction failed');
      }

      const data = await res.json();
      setResult(data);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try a different URL.');
    } finally {
      setLoading(false);
    }
  };

  const costPerQuery = (tokens: number) => {
    const model = MODEL_COSTS[selectedModel];
    return (tokens / 1000) * model.input;
  };

  const monthlySavings = result
    ? costPerQuery(result.meta.tokens_saved) * queriesPerMonth
    : 0;

  const annualSavings = monthlySavings * 12;

  // Detect restaurant/hospitality from JSON-LD
  const isRestaurant = result?.structured_data?.jsonLd?.some(
    (ld: any) =>
      ['Restaurant', 'FoodEstablishment', 'LocalBusiness', 'Hotel'].includes(
        ld['@type']
      )
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#e8e8e8',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Nav */}
      <nav style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #1a1a1a',
      }}>
        <a href="/" style={{ color: '#e8e8e8', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem' }}>
          ← Semantic Gateway
        </a>
        <a href="/docs" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.9rem' }}>
          API Docs
        </a>
      </nav>

      {/* Hero */}
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '80px 24px 40px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          background: '#1a1a2e',
          border: '1px solid #2a2a4a',
          borderRadius: '100px',
          fontSize: '0.8rem',
          color: '#8b8bf5',
          marginBottom: '24px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}>
          Free tool — no API key needed
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 700,
          lineHeight: 1.15,
          marginBottom: '16px',
          letterSpacing: '-0.03em',
        }}>
          How much is the<br />
          <span style={{
            background: 'linear-gradient(135deg, #f87171, #fb923c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Token Tax
          </span>{' '}
          costing you?
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: '#6b7280',
          maxWidth: '520px',
          margin: '0 auto 40px',
          lineHeight: 1.6,
        }}>
          Paste any URL. See exactly how many tokens your AI agent wastes
          on boilerplate HTML, and what that costs per query.
        </p>

        {/* Input */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          gap: '8px',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://treehousesm.com"
            required
            style={{
              flex: 1,
              padding: '16px 20px',
              background: '#141414',
              border: '1px solid #2a2a2a',
              borderRadius: '10px',
              color: '#e8e8e8',
              fontSize: '1rem',
              fontFamily: "'JetBrains Mono', monospace",
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '16px 28px',
              background: loading ? '#333' : 'linear-gradient(135deg, #f87171, #fb923c)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Extracting...' : 'Calculate'}
          </button>
        </form>

        {error && (
          <p style={{
            marginTop: '16px',
            color: '#f87171',
            fontSize: '0.9rem',
          }}>
            {error}
          </p>
        )}

        {/* Quick examples */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>Try:</span>
          {['https://treehousesm.com', 'https://stripe.com', 'https://www.nytimes.com'].map(
            (example) => (
              <button
                key={example}
                onClick={() => { setUrl(example); }}
                style={{
                  background: 'none',
                  border: '1px solid #2a2a2a',
                  color: '#6b7280',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {example.replace('https://', '').replace('www.', '')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Loading animation */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #1a1a1a',
            borderTop: '3px solid #f87171',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Fetching and extracting semantic content...
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div ref={resultsRef} style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 80px' }}>

          {/* Big number hero */}
          <div style={{
            textAlign: 'center',
            padding: '60px 0 40px',
            borderTop: '1px solid #1a1a1a',
          }}>
            <div style={{
              fontSize: 'clamp(4rem, 10vw, 7rem)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg, #f87171, #fb923c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1,
            }}>
              {result.meta.tokens_saved_percent}%
            </div>
            <div style={{ color: '#6b7280', fontSize: '1.1rem', marginTop: '8px' }}>
              token reduction on <strong style={{ color: '#e8e8e8' }}>{result.structured_data.title || result.url}</strong>
            </div>
          </div>

          {/* Metric cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '40px',
          }}>
            {[
              {
                label: 'Raw HTML',
                value: result.meta.tokens_original.toLocaleString(),
                sub: 'tokens',
                color: '#ef4444',
              },
              {
                label: 'After extraction',
                value: result.meta.tokens_extracted.toLocaleString(),
                sub: 'tokens',
                color: '#22c55e',
              },
              {
                label: 'Tokens saved',
                value: result.meta.tokens_saved.toLocaleString(),
                sub: 'per query',
                color: '#fb923c',
              },
              {
                label: 'Processing time',
                value: `${result.meta.processing_time_ms}`,
                sub: 'ms',
                color: '#8b8bf5',
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  background: '#141414',
                  border: '1px solid #1e1e1e',
                  borderRadius: '12px',
                  padding: '24px',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: card.color, fontFamily: "'JetBrains Mono', monospace" }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Cost calculator */}
          <div style={{
            background: '#141414',
            border: '1px solid #1e1e1e',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '40px',
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', marginTop: 0 }}>
              💰 Your cost savings
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                  AI Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#e8e8e8',
                    fontSize: '0.9rem',
                  }}
                >
                  {Object.entries(MODEL_COSTS).map(([k, v]) => (
                    <option key={k} value={k}>{v.name} (${v.input}/1K tokens)</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                  Queries per month
                </label>
                <input
                  type="number"
                  value={queriesPerMonth}
                  onChange={(e) => setQueriesPerMonth(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#e8e8e8',
                    fontSize: '0.9rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '16px',
            }}>
              <div style={{
                background: '#0a0a0a',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Per query
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e', fontFamily: "'JetBrains Mono', monospace" }}>
                  ${costPerQuery(result.meta.tokens_saved).toFixed(4)}
                </div>
              </div>
              <div style={{
                background: '#0a0a0a',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Monthly
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e', fontFamily: "'JetBrains Mono', monospace" }}>
                  ${monthlySavings.toFixed(2)}
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(248,113,113,0.1), rgba(251,146,60,0.1))',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                border: '1px solid rgba(248,113,113,0.2)',
              }}>
                <div style={{ fontSize: '0.7rem', color: '#fb923c', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Annual
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fb923c', fontFamily: "'JetBrains Mono', monospace" }}>
                  ${annualSavings.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Quality report */}
          <div style={{
            background: '#141414',
            border: '1px solid #1e1e1e',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '40px',
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', marginTop: 0 }}>
              📊 Extraction quality report
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Main content', ok: result.quality.hasMainContent },
                { label: 'Structured data (JSON-LD)', ok: result.quality.hasStructuredData },
                { label: 'Navigation preserved', ok: result.quality.hasNavigation },
                { label: 'Contact info found', ok: result.quality.hasContactInfo },
              ].map((q, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    background: '#0a0a0a',
                    borderRadius: '8px',
                    border: `1px solid ${q.ok ? '#1a3a1a' : '#2a1a1a'}`,
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{q.ok ? '✅' : '⚠️'}</span>
                  <span style={{ fontSize: '0.85rem', color: q.ok ? '#86efac' : '#fca5a5' }}>
                    {q.label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', fontSize: '0.85rem', color: '#4b5563' }}>
              Information density: <strong style={{ color: '#e8e8e8' }}>
                {(result.quality.informationDensity * 100).toFixed(0)}%
              </strong>
              {' · '}
              Content sections: <strong style={{ color: '#e8e8e8' }}>
                {result.quality.contentSections}
              </strong>
            </div>
          </div>

          {/* Restaurant-specific insights */}
          {isRestaurant && (
            <div style={{
              background: 'linear-gradient(135deg, #1a1a0a, #1a140a)',
              border: '1px solid #3a3a1a',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '40px',
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', marginTop: 0, color: '#fbbf24' }}>
                🍽️ Hospitality data detected
              </h3>
              <p style={{ color: '#a3a3a3', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.6 }}>
                This site contains structured restaurant/hospitality data (Schema.org JSON-LD).
                Our extraction preserves menu items, hours, ratings, and contact info that raw HTML
                scraping destroys.
              </p>
              {result.structured_data.jsonLd?.filter((ld: any) =>
                ['Restaurant', 'FoodEstablishment', 'LocalBusiness', 'Hotel'].includes(ld['@type'])
              ).map((ld: any, i: number) => (
                <div key={i} style={{
                  background: '#0a0a0a',
                  borderRadius: '10px',
                  padding: '16px',
                  fontSize: '0.85rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#a3a3a3',
                  lineHeight: 1.8,
                }}>
                  {ld.name && <div><span style={{ color: '#6b7280' }}>name:</span> <span style={{ color: '#fbbf24' }}>{ld.name}</span></div>}
                  {ld.servesCuisine && <div><span style={{ color: '#6b7280' }}>cuisine:</span> {ld.servesCuisine}</div>}
                  {ld.priceRange && <div><span style={{ color: '#6b7280' }}>price:</span> {ld.priceRange}</div>}
                  {ld.telephone && <div><span style={{ color: '#6b7280' }}>phone:</span> {ld.telephone}</div>}
                  {ld.aggregateRating && (
                    <div><span style={{ color: '#6b7280' }}>rating:</span> {ld.aggregateRating.ratingValue}/5 ({ld.aggregateRating.reviewCount} reviews)</div>
                  )}
                  {ld.address && (
                    <div><span style={{ color: '#6b7280' }}>address:</span> {[ld.address.streetAddress, ld.address.addressLocality, ld.address.addressRegion].filter(Boolean).join(', ')}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div style={{
            textAlign: 'center',
            padding: '40px 0',
            borderTop: '1px solid #1a1a1a',
          }}>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Get these savings on every query with the Semantic Gateway API.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/contact" style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #f87171, #fb923c)',
                color: '#fff',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
              }}>
                Get API Key — Free
              </a>
              <a href="/docs" style={{
                padding: '14px 32px',
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid #2a2a2a',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}>
                Read the docs
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}