module.exports = async function (req, res) {
  // Enable CORS for this Vercel function
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://mazari-md.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { number } = req.body || {};
  if (!number) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const backendUrl = process.env.BACKEND_URL || 'https://mazari-bot-01.herokuapp.com';
  const internalApiKey = process.env.INTERNAL_API_KEY;

  if (!internalApiKey) {
    console.error('Missing INTERNAL_API_KEY in Vercel environment');
    return res.status(500).json({ error: 'Pairing backend is not properly configured on Vercel.' });
  }

  try {
    // Use global fetch (Node >=18) or fallback to node-fetch if needed
    const fetchFn = typeof fetch === 'function' ? fetch : (await import('node-fetch')).default;

    console.log(`Forwarding pairing request for ${number} to backend: ${backendUrl}`);
    const backendResponse = await fetchFn(`${backendUrl}/api/pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': internalApiKey
      },
      body: JSON.stringify({ phone: number })
    });

    const data = await backendResponse.json();
    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json({ error: data.error || 'Backend error' });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error contacting backend:', error);
    return res.status(502).json({ error: 'Network error – unable to contact the bot server.' });
  }
};
