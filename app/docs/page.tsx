export default function DocsPage() {
  return (
    <div style={{ 
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '50px 20px'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>API Documentation</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>
        <a href="/" style={{ color: '#667eea' }}>← Back to home</a>
      </p>

      {/* Quick Start */}
      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Quick Start</h2>
        
        <div style={{ background: '#f7f7f7', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>1. Get an API Key</h3>
          <p>Email <a href="mailto:prameshsinghavi02@gmail.com" style={{ color: '#667eea' }}>prameshsinghavi02@gmail.com</a> with:</p>
          <ul>
            <li>Your name</li>
            <li>What you're building</li>
            <li>Estimated monthly queries</li>
          </ul>
          <p>We'll send you a key within 24 hours.</p>
        </div>

        <div style={{ background: '#f7f7f7', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>2. Make Your First Request</h3>
          <pre style={{ 
            background: '#1a1a1a', 
            color: '#fff', 
            padding: '15px', 
            borderRadius: '5px',
            overflow: 'auto'
          }}>
{`curl -X POST https://semantic-gateway.vercel.app/api/v1/extract \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
          </pre>
        </div>
      </section>

      {/* API Reference */}
      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>API Reference</h2>
        
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <h3>POST /api/v1/extract</h3>
          <p>Extract clean, structured data from any URL.</p>
          
          <h4 style={{ marginTop: '20px' }}>Headers</h4>
          <pre style={{ background: '#f7f7f7', padding: '10px', borderRadius: '5px' }}>
{`X-API-Key: YOUR_API_KEY
Content-Type: application/json`}
          </pre>

          <h4 style={{ marginTop: '20px' }}>Request Body</h4>
          <pre style={{ background: '#f7f7f7', padding: '10px', borderRadius: '5px' }}>
{`{
  "url": "https://example.com",
  "format": "both",           // "markdown" | "json" | "both"
  "include_pdfs": true        // optional, default: true
}`}
          </pre>

          <h4 style={{ marginTop: '20px' }}>Response</h4>
          <pre style={{ background: '#f7f7f7', padding: '10px', borderRadius: '5px', fontSize: '0.85rem' }}>
{`{
  "url": "https://example.com",
  "markdown": "# Example Domain\\n> Description...\\n## Structured Data\\n...",
  "structured_data": {
    "title": "Example Domain",
    "description": "...",
    "ogData": { "title": "...", "image": "..." },
    "jsonLd": [ { "@type": "Restaurant", "name": "..." } ],
    "contactInfo": {
      "phones": ["(555) 123-4567"],
      "emails": ["info@example.com"],
      "addresses": ["123 Main St"]
    }
  },
  "pdfs_extracted": [],
  "meta": {
    "processing_time_ms": 1554,
    "tokens_original": 12500,
    "tokens_extracted": 450,
    "tokens_saved": 12050,
    "tokens_saved_percent": 96,
    "cost_saved_usd": 0.3615
  },
  "quality": {
    "hasMainContent": true,
    "hasStructuredData": true,
    "hasNavigation": true,
    "hasContactInfo": true,
    "contentSections": 5,
    "informationDensity": 0.87
  }
}`}
          </pre>

          <h4 style={{ marginTop: '20px' }}>Quality Metrics</h4>
          <p style={{ fontSize: '0.9rem', color: '#555' }}>
            The <code>quality</code> object tells you what data was found so your agent can
            decide whether to trust the extraction or fall back to a full browser render.
          </p>
          <ul style={{ fontSize: '0.9rem', color: '#555' }}>
            <li><strong>hasMainContent</strong> — meaningful page content was extracted</li>
            <li><strong>hasStructuredData</strong> — JSON-LD / Schema.org data found</li>
            <li><strong>hasNavigation</strong> — site navigation links resolved</li>
            <li><strong>hasContactInfo</strong> — phone, email, or address detected</li>
            <li><strong>informationDensity</strong> — ratio of useful lines to total (0–1)</li>
          </ul>
        </div>
      </section>

      {/* Code Examples */}
      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Code Examples</h2>
        
        <h3>Python</h3>
        <pre style={{ background: '#1a1a1a', color: '#fff', padding: '15px', borderRadius: '5px', overflow: 'auto', marginBottom: '30px' }}>
{`import requests

API_KEY = "your_api_key"
API_URL = "https://semantic-gateway.vercel.app/api/v1/extract"

response = requests.post(
    API_URL,
    headers={"X-API-Key": API_KEY},
    json={"url": "https://example.com"}
)

data = response.json()
print(data["markdown"])
print(f"Saved: $\{data['meta']['cost_saved_usd']}")
print(f"Quality: \{data['quality']}")`}
        </pre>

        <h3>JavaScript/Node.js</h3>
        <pre style={{ background: '#1a1a1a', color: '#fff', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
{`const response = await fetch(
  "https://semantic-gateway.vercel.app/api/v1/extract",
  {
    method: "POST",
    headers: {
      "X-API-Key": "your_api_key",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url: "https://example.com" })
  }
);

const data = await response.json();
console.log(data.markdown);
console.log(\`Saved: $\${data.meta.cost_saved_usd}\`);

// Check extraction quality before using
if (data.quality.hasStructuredData) {
  console.log("Rich structured data available:", data.structured_data.jsonLd);
}`}
        </pre>
      </section>

      {/* Support */}
      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Support</h2>
        <p>Questions? Email us at <a href="mailto:prameshsinghavi02@gmail.com" style={{ color: '#667eea' }}>prameshsinghavi02@gmail.com</a></p>
        <p>Response time: Usually within 24 hours</p>
      </section>

      <div style={{ textAlign: 'center', marginTop: '60px', paddingTop: '40px', borderTop: '1px solid #e5e7eb' }}>
        <a href="/pricing" style={{ 
          padding: '15px 40px',
          background: '#667eea',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold',
          display: 'inline-block'
        }}>
          View Pricing
        </a>
      </div>
    </div>
  );
}
