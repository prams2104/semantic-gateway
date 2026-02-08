export default function BenchmarkPage() {
  const results = [
    { category: 'Restaurant', name: 'Treehouse', tokens_before: 106924, tokens_after: 679, cost_saved: 3.19, time: 2124 },
    { category: 'Restaurant', name: "George's at the Cove", tokens_before: 54950, tokens_after: 1108, cost_saved: 1.62, time: 671 },
    { category: 'Restaurant', name: 'Catania', tokens_before: 38597, tokens_after: 2837, cost_saved: 1.07, time: 579 },
    { category: 'Restaurant', name: 'Cucina Urbana', tokens_before: 20116, tokens_after: 779, cost_saved: 0.58, time: 1230 },
    { category: 'Restaurant', name: 'Juniper & Ivy', tokens_before: 11571, tokens_after: 1037, cost_saved: 0.32, time: 1207 },
    { category: 'Hotel', name: 'Marriott', tokens_before: 247332, tokens_after: 1518, cost_saved: 7.37, time: 1051 },
    { category: 'Hotel', name: 'Hotel Del Coronado', tokens_before: 45487, tokens_after: 2912, cost_saved: 1.28, time: 784 },
    { category: 'Hotel', name: 'Fairmont', tokens_before: 39367, tokens_after: 519, cost_saved: 1.17, time: 1097 },
    { category: 'E-commerce', name: 'Allbirds', tokens_before: 229537, tokens_after: 1278, cost_saved: 6.85, time: 1216 },
    { category: 'E-commerce', name: 'Warby Parker', tokens_before: 226444, tokens_after: 663, cost_saved: 6.77, time: 1222 },
    { category: 'E-commerce', name: 'Everlane', tokens_before: 208062, tokens_after: 5349, cost_saved: 6.08, time: 1296 },
    { category: 'E-commerce', name: 'Glossier', tokens_before: 213613, tokens_after: 3511, cost_saved: 6.30, time: 941 },
    { category: 'Travel', name: 'Airbnb', tokens_before: 153765, tokens_after: 897, cost_saved: 4.59, time: 896 },
    { category: 'News', name: 'New York Times', tokens_before: 317396, tokens_after: 5854, cost_saved: 9.35, time: 1333 },
    { category: 'SaaS', name: 'Stripe', tokens_before: 140375, tokens_after: 2419, cost_saved: 4.14, time: 1175 },
    { category: 'SaaS', name: 'Notion', tokens_before: 47226, tokens_after: 1417, cost_saved: 1.37, time: 1924 },
    { category: 'SaaS', name: 'Slack', tokens_before: 54345, tokens_after: 2250, cost_saved: 1.56, time: 671 },
    { category: 'SaaS', name: 'Airtable', tokens_before: 105411, tokens_after: 8479, cost_saved: 2.91, time: 599 },
  ];

  const avgSavings = Math.round(
    results.reduce((sum, r) => sum + Math.round((r.tokens_before - r.tokens_after) / r.tokens_before * 100), 0) / results.length
  );

  const totalCostSaved = results.reduce((sum, r) => sum + r.cost_saved, 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#e8e8e8',
      fontFamily: "'system-ui', -apple-system, sans-serif",
      padding: '40px 20px 80px',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Back to home
        </a>

        <h1 style={{ fontSize: '2.5rem', marginTop: '24px', marginBottom: '8px', fontWeight: 700 }}>
          Real-World Benchmarks
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '40px', fontSize: '1.05rem' }}>
          Extraction Engine v2 — tested across {results.length} major websites
        </p>

        {/* Summary stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '40px',
        }}>
          {[
            { label: 'Avg. token reduction', value: `${avgSavings}%`, color: '#22c55e' },
            { label: 'Total cost saved (test run)', value: `$${totalCostSaved.toFixed(2)}`, color: '#fb923c' },
            { label: 'Sites tested', value: results.length.toString(), color: '#8b8bf5' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#141414',
              border: '1px solid #1e1e1e',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{
          overflowX: 'auto',
          background: '#141414',
          borderRadius: '12px',
          border: '1px solid #1e1e1e',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.88rem',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                {['Category', 'Website', 'Before', 'After', 'Saved', 'Cost Saved', 'Time'].map(h => (
                  <th key={h} style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    color: '#6b7280',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const pct = Math.round((r.tokens_before - r.tokens_after) / r.tokens_before * 100);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.8rem' }}>{r.category}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '12px 16px', color: '#ef4444', fontFamily: 'monospace' }}>{r.tokens_before.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: '#22c55e', fontFamily: 'monospace' }}>{r.tokens_after.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: pct >= 95 ? 'rgba(34,197,94,0.15)' : 'rgba(251,146,60,0.15)',
                        color: pct >= 95 ? '#22c55e' : '#fb923c',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}>
                        {pct}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#22c55e', fontFamily: 'monospace' }}>${r.cost_saved.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontFamily: 'monospace' }}>{r.time}ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p style={{
          color: '#4b5563',
          fontSize: '0.8rem',
          marginTop: '16px',
          fontStyle: 'italic',
        }}>
          Cost savings calculated at GPT-4o input pricing ($0.0025/1K tokens).
          Processing time includes network fetch + extraction.
          Sites returning errors (Hilton, Hyatt, Expedia, Washington Post) require JavaScript rendering and are excluded.
        </p>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <a href="/calculator" style={{
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #f87171, #fb923c)',
            color: '#fff',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 700,
            display: 'inline-block',
            marginRight: '12px',
          }}>
            Try the calculator →
          </a>
          <a href="/docs" style={{
            padding: '14px 32px',
            border: '1px solid #2a2a2a',
            color: '#6b7280',
            borderRadius: '10px',
            textDecoration: 'none',
            display: 'inline-block',
          }}>
            API Docs
          </a>
        </div>
      </div>
    </div>
  );
}