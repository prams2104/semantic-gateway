export default function HumanPage() {
    return (
      <div style={{ padding: '50px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h1>Welcome to Treehouse (Human View)</h1>
        <p>This is the beautiful, heavy website humans see.</p>
        <img src="https://treehousesm.com/wp-content/uploads/2023/07/Treehouse-Logo.png" alt="Logo" style={{ width: '300px' }} />
        <div style={{ marginTop: '30px', color: '#666' }}>
          <p>Try visiting this page as an AI Bot to see the Semantic Gateway in action!</p>
          <code>curl -A "GPTBot" http://localhost:3000</code>
        </div>
      </div>
    );
  }