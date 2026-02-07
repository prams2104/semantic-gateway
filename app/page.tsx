export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Hero Section */}
      <div style={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '100px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '3.5rem',
          fontWeight: 'bold',
          marginBottom: '20px',
          lineHeight: '1.2'
        }}>
          Stop Wasting Tokens<br />on Messy Websites
        </h1>
        
        <p style={{ 
          fontSize: '1.5rem',
          maxWidth: '800px',
          margin: '0 auto 40px',
          opacity: 0.9
        }}>
          Extract clean, structured data from any website in &lt;100ms.
          <br />Save 90% on AI agent query costs.
        </p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/docs" style={{
            padding: '15px 40px',
            background: '#fff',
            color: '#667eea',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>
            View API Docs
          </a>
          <a href="/contact" style={{
            padding: '15px 40px',
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>
            Request Access
          </a>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '30px',
          marginTop: '80px',
          maxWidth: '900px',
          margin: '80px auto 0'
        }}>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>90%</div>
            <div style={{ fontSize: '1rem', opacity: 0.9 }}>Cost Reduction</div>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>&lt;100ms</div>
            <div style={{ fontSize: '1rem', opacity: 0.9 }}>Response Time</div>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>10x</div>
            <div style={{ fontSize: '1rem', opacity: 0.9 }}>Faster Extraction</div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ 
        background: '#fff',
        color: '#333',
        padding: '80px 20px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '50px' }}>
            One API Call. Clean Data.
          </h2>
          
          <div style={{ 
            background: '#f7f7f7',
            padding: '30px',
            borderRadius: '12px',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            marginBottom: '20px'
          }}>
            <div style={{ color: '#888', marginBottom: '10px' }}>// Your code</div>
            <div>curl -X POST https://api.semanticgateway.com/v1/extract \</div>
            <div>&nbsp;&nbsp;-H "X-API-Key: sk_your_key" \</div>
            <div>&nbsp;&nbsp;-d '{`{"url": "https://example.com"}`}'</div>
          </div>

          <div style={{ textAlign: 'center', margin: '30px 0' }}>↓</div>

          <div style={{ 
            background: '#f7f7f7',
            padding: '30px',
            borderRadius: '12px',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            <div style={{ color: '#888', marginBottom: '10px' }}>// Clean, structured data</div>
            <div>{`{ "markdown": "...", "structured_data": {...}, "meta": { "tokens_saved": 8500 } }`}</div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <a href="/pricing" style={{
              padding: '15px 40px',
              background: '#667eea',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              display: 'inline-block'
            }}>
              Start Free →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}