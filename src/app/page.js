export default function BackendStatusPage() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '48px 24px', maxWidth: 640, margin: '0 auto' }}>
      <h1>Inkwell Next.js Backend API</h1>
      <p>This Next.js server hosts all REST APIs and media uploads on port 5000.</p>
      <p>Health endpoint: <code>GET /api/health</code></p>
    </main>
  );
}
