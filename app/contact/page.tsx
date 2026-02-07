'use client';

export default function ContactPage() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '50px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '600px',
        margin: '0 auto',
        background: '#fff',
        borderRadius: '12px',
        padding: '40px'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: '#111' }}>
          Request API Access
        </h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Get started with our free tier (1,000 queries/month)
        </p>

        <form action= "https://formspree.io/f/mbdajppa" method="POST">
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Your Name *
            </label>
            <input 
              type="text" 
              name="name" 
              required
              style={{ 
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Email *
            </label>
            <input 
              type="email" 
              name="email" 
              required
              style={{ 
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              What are you building? *
            </label>
            <textarea 
              name="project" 
              required
              rows={4}
              placeholder="E.g., AI agent for restaurant discovery, food delivery chatbot, etc."
              style={{ 
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '1rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Estimated monthly queries
            </label>
            <select 
              name="volume"
              style={{ 
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="<1k">Less than 1,000</option>
              <option value="1k-10k">1,000 - 10,000</option>
              <option value="10k-100k">10,000 - 100,000</option>
              <option value="100k+">100,000+</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '15px',
              background: '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Request API Key
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
          We'll send your API key within 24 hours
        </p>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/" style={{ color: '#667eea', textDecoration: 'none' }}>
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
}