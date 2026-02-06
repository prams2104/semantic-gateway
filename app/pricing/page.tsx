'use client';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      queries: '1,000',
      features: [
        '1,000 queries/month',
        'Basic extraction',
        'Markdown output',
        'Community support',
        'API access'
      ],
      cta: 'Start Free',
      highlighted: false
    },
    {
      name: 'Starter',
      price: '$99',
      queries: '100,000',
      features: [
        '100,000 queries/month',
        'Full extraction + PDFs',
        'JSON + Markdown output',
        'Email support',
        'API access',
        'Usage analytics'
      ],
      cta: 'Start Trial',
      highlighted: true
    },
    {
      name: 'Pro',
      price: '$499',
      queries: '1,000,000',
      features: [
        '1M queries/month',
        'Full extraction + PDFs',
        'JSON + Markdown output',
        'Priority support',
        'API access',
        'Usage analytics',
        'Custom rate limits'
      ],
      cta: 'Start Trial',
      highlighted: false
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      queries: 'Unlimited',
      features: [
        'Unlimited queries',
        'Dedicated infrastructure',
        'SLA guarantees',
        '24/7 support',
        'Custom integrations',
        'On-premise options'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '80px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '20px', color: '#111' }}>
            Simple, Transparent Pricing
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#666' }}>
            Start free. Scale as you grow. No hidden fees.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
          marginBottom: '60px'
        }}>
          {plans.map((plan, i) => (
            <div
              key={i}
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '40px',
                border: plan.highlighted ? '3px solid #667eea' : '1px solid #e5e7eb',
                position: 'relative',
                boxShadow: plan.highlighted ? '0 10px 40px rgba(102, 126, 234, 0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {plan.highlighted && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#667eea',
                  color: '#fff',
                  padding: '5px 20px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold'
                }}>
                  MOST POPULAR
                </div>
              )}

              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#111' }}>
                {plan.name}
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#111' }}>
                  {plan.price}
                </span>
                {plan.price !== 'Custom' && (
                  <span style={{ color: '#666', fontSize: '1rem' }}>/month</span>
                )}
              </div>

              <div style={{ 
                fontSize: '0.9rem', 
                color: '#666', 
                marginBottom: '30px',
                paddingBottom: '20px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                {plan.queries} queries/month
              </div>

              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                marginBottom: '30px',
                fontSize: '0.95rem'
              }}>
                {plan.features.map((feature, j) => (
                  <li key={j} style={{ 
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#10b981', marginRight: '10px' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                style={{
                  width: '100%',
                  padding: '15px',
                  background: plan.highlighted ? '#667eea' : '#fff',
                  color: plan.highlighted ? '#fff' : '#667eea',
                  border: `2px solid #667eea`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={{ 
          textAlign: 'center', 
          maxWidth: '800px', 
          margin: '60px auto 0',
          padding: '40px',
          background: '#fff',
          borderRadius: '12px'
        }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#111' }}>
            All plans include:
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            textAlign: 'left',
            color: '#666'
          }}>
            <div>✓ Sub-100ms response times</div>
            <div>✓ PDF extraction</div>
            <div>✓ Structured data output</div>
            <div>✓ 99.9% uptime SLA</div>
            <div>✓ GDPR compliant</div>
            <div>✓ No rate limits (within plan)</div>
          </div>
        </div>
      </div>
    </div>
  );
}