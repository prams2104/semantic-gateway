export default function BenchmarkPage() {
    const results = [
      { name: "Marriott Hotels", tokens_before: 247610, tokens_after: 1420, cost_saved: 7.39, time: 503 },
      { name: "Treehouse Restaurant", tokens_before: 106924, tokens_after: 1277, cost_saved: 3.17, time: 1761 },
      { name: "George's Fine Dining", tokens_before: 54950, tokens_after: 5056, cost_saved: 1.50, time: 444 },
      { name: "Allbirds E-commerce", tokens_before: 229275, tokens_after: 38338, cost_saved: 5.73, time: 565 },
    ];
    
    return (
      <div style={{ padding: '80px 20px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1>Real-World Benchmarks</h1>
        <p>Tested on major websites across industries</p>
        
        <table style={{ width: '100%', marginTop: '40px' }}>
          <thead>
            <tr>
              <th>Website</th>
              <th>Before</th>
              <th>After</th>
              <th>Saved</th>
              <th>Cost</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td>{r.name}</td>
                <td>{r.tokens_before.toLocaleString()}</td>
                <td>{r.tokens_after.toLocaleString()}</td>
                <td>{Math.round((r.tokens_before - r.tokens_after) / r.tokens_before * 100)}%</td>
                <td>${r.cost_saved}</td>
                <td>{r.time}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }