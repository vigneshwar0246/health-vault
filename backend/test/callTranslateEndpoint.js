const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    const port = process.env.PORT || 5002;
    const res = await fetch(`http://localhost:${port}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello from test', lang: 'ta' })
    });

    const txt = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', txt.slice(0,1000));
  } catch (err) {
    console.error('Call failed:', err);
  }
})();