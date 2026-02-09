export default function HomePage() {
  const font = "'DM Sans', sans-serif";
  const heading = "'Fraunces', Georgia, serif";

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', color: '#1c1917', fontFamily: font }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700;9..144,900&family=DM+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Nav */}
      <header
        style={{
          padding: '20px 32px',
          borderBottom: '1px solid #e7e5e4',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
        }}
      >
        <span style={{ fontFamily: heading, fontWeight: 700, fontSize: '1.1rem' }}>
          Semantic Gateway
        </span>
        <nav style={{ display: 'flex', gap: '24px', fontSize: '0.9rem' }}>
          <a href="/report" style={{ color: '#78716c', textDecoration: 'none' }}>
            AI Audit
          </a>
          <a href="/calculator" style={{ color: '#78716c', textDecoration: 'none' }}>
            Calculator
          </a>
          <a href="/docs" style={{ color: '#78716c', textDecoration: 'none' }}>
            API Docs
          </a>
          <a href="/contact" style={{ color: '#78716c', textDecoration: 'none' }}>
            Contact
          </a>
        </nav>
      </header>

      {/* Hero */}
      <div
        style={{
          maxWidth: '740px',
          margin: '0 auto',
          padding: '100px 24px 60px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '100px',
            fontSize: '0.8rem',
            color: '#92400e',
            marginBottom: '28px',
            letterSpacing: '0.03em',
            fontWeight: 500,
          }}
        >
          The Discovery Layer for the Agentic Web
        </div>

        <h1
          style={{
            fontFamily: heading,
            fontSize: 'clamp(2.2rem, 5.5vw, 3.4rem)',
            fontWeight: 900,
            lineHeight: 1.12,
            marginBottom: '20px',
            letterSpacing: '-0.02em',
          }}
        >
          Is AI getting your
          <br />
          restaurant wrong?
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            color: '#78716c',
            lineHeight: 1.7,
            maxWidth: '560px',
            margin: '0 auto 40px',
          }}
        >
          ChatGPT, Perplexity, and Apple Intelligence are the new front door.
          We make sure they get your menu, hours, and prices right — so every
          AI recommendation is accurate and every booking lands.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/report"
            style={{
              padding: '15px 36px',
              background: '#1c1917',
              color: '#fafaf9',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Run Your Free AI Audit
          </a>
          <a
            href="/calculator"
            style={{
              padding: '15px 36px',
              background: '#fff',
              color: '#1c1917',
              border: '2px solid #d6d3d1',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Token Savings Calculator
          </a>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 24px 80px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '16px',
          textAlign: 'center',
        }}
      >
        {[
          { value: '99%', label: 'Token Reduction', sub: 'Treehouse SM: 106k → 679' },
          { value: '<100ms', label: 'Processing Time', sub: 'Edge-compatible latency' },
          { value: '15', label: 'Visibility Checks', sub: 'Per-field pass/fail audit' },
          { value: '0–100', label: 'AI Visibility Score', sub: 'Hospitality-specific' },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid #e7e5e4',
              borderRadius: '12px',
              padding: '28px 16px',
            }}
          >
            <div
              style={{
                fontFamily: heading,
                fontSize: '2rem',
                fontWeight: 900,
                color: '#1c1917',
                lineHeight: 1,
                marginBottom: '8px',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a8a29e' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div style={{ background: '#fff', borderTop: '1px solid #e7e5e4', padding: '80px 24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: heading,
              fontSize: '2rem',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '48px',
              letterSpacing: '-0.01em',
            }}
          >
            Three steps to AI visibility
          </h2>

          {[
            {
              step: '1',
              title: 'Diagnose',
              desc: 'Run the AI Visibility Report on any restaurant URL. See exactly what ChatGPT, Perplexity, and Siri can — and can\'t — find about your business.',
            },
            {
              step: '2',
              title: 'Capture',
              desc: 'We collect the source of truth — menu, hours, reservation links — and verify it into a structured profile with provenance and confidence scores per field.',
            },
            {
              step: '3',
              title: 'Publish',
              desc: 'Deploy a verified endpoint and install one line on your website. AI agents discover your canonical data and recommend you accurately.',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '24px',
                marginBottom: '36px',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#1c1917',
                  color: '#fafaf9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: heading,
                  fontWeight: 700,
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: heading,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  {item.title}
                </div>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: '#57534e',
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Preview */}
      <div style={{ padding: '80px 24px', maxWidth: '700px', margin: '0 auto' }}>
        <h2
          style={{
            fontFamily: heading,
            fontSize: '2rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '12px',
          }}
        >
          One API call. Verified data.
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: '#78716c',
            fontSize: '1rem',
            marginBottom: '32px',
          }}
        >
          Our extraction engine processes any URL in under 100ms — returning clean markdown,
          Schema.org structured data, and quality metrics.
        </p>
        <div
          style={{
            background: '#1c1917',
            borderRadius: '12px',
            padding: '28px',
            fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
            fontSize: '0.85rem',
            color: '#a8a29e',
            lineHeight: 1.8,
            overflowX: 'auto',
          }}
        >
          <div style={{ color: '#57534e' }}>// Extract structured restaurant data</div>
          <div>
            <span style={{ color: '#fbbf24' }}>POST</span>{' '}
            <span style={{ color: '#e8e8e8' }}>/api/v1/extract</span>
          </div>
          <div style={{ color: '#57534e', marginTop: '8px' }}>// Response</div>
          <div style={{ color: '#86efac' }}>{'{'}</div>
          <div style={{ paddingLeft: '16px' }}>
            <span style={{ color: '#fbbf24' }}>&quot;structured_data&quot;</span>
            <span style={{ color: '#e8e8e8' }}>: {'{'}</span>
          </div>
          <div style={{ paddingLeft: '32px' }}>
            <span style={{ color: '#fbbf24' }}>&quot;jsonLd&quot;</span>
            <span style={{ color: '#e8e8e8' }}>: [{'{'} &quot;@type&quot;: &quot;Restaurant&quot;, &quot;name&quot;: &quot;...&quot; {'}'}]</span>
          </div>
          <div style={{ paddingLeft: '16px', color: '#e8e8e8' }}>{'}'}</div>
          <div style={{ paddingLeft: '16px' }}>
            <span style={{ color: '#fbbf24' }}>&quot;quality&quot;</span>
            <span style={{ color: '#e8e8e8' }}>
              : {'{'} &quot;hasStructuredData&quot;: true, &quot;hasReservationWidget&quot;: true {'}'}
            </span>
          </div>
          <div style={{ paddingLeft: '16px' }}>
            <span style={{ color: '#fbbf24' }}>&quot;meta&quot;</span>
            <span style={{ color: '#e8e8e8' }}>
              : {'{'} &quot;tokens_saved_percent&quot;: 99, &quot;processing_time_ms&quot;: 47 {'}'}
            </span>
          </div>
          <div style={{ color: '#86efac' }}>{'}'}</div>
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          background: '#1c1917',
          padding: '60px 24px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: heading,
            fontSize: '1.8rem',
            fontWeight: 700,
            color: '#fafaf9',
            marginBottom: '12px',
          }}
        >
          Ready to fix your AI visibility?
        </h2>
        <p
          style={{
            color: '#a8a29e',
            fontSize: '1rem',
            marginBottom: '28px',
            maxWidth: '480px',
            margin: '0 auto 28px',
            lineHeight: 1.6,
          }}
        >
          Free audit — we&rsquo;ll show you exactly what AI agents see about your restaurant,
          and what they&rsquo;re missing.
        </p>
        <a
          href="/report"
          style={{
            display: 'inline-block',
            padding: '15px 40px',
            background: '#fafaf9',
            color: '#1c1917',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          Run Your Free AI Audit
        </a>
      </div>

      {/* Footer */}
      <footer
        style={{
          padding: '24px 32px',
          borderTop: '1px solid #e7e5e4',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#a8a29e',
        }}
      >
        Semantic Gateway &middot; The Discovery Layer for the Agentic Web
      </footer>
    </div>
  );
}
