export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Changed to * for testing; we can lock it to percs.fun later
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const { searchParams } = new URL(request.url);
    const targetIp = searchParams.get('ip');

    // If no IP is provided, we use the header Vercel provides automatically
    if (!targetIp) {
      const visitorIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
      const city = request.headers.get('x-vercel-ip-city') || 'Unknown';
      const country = request.headers.get('x-vercel-ip-country') || 'Unknown';

      return new Response(JSON.stringify({
        status: "success",
        type: "visitor",
        ip: visitorIp.split(',')[0], // Get the first IP in the list
        city: city,
        country: country
      }), { status: 200, headers });
    }

    // Manual lookup using a more stable service
    const res = await fetch(`http://ip-api.com/json/${targetIp}`);
    const data = await res.json();

    return new Response(JSON.stringify(data), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({ 
      status: "error", 
      message: error.message 
    }), { status: 500, headers });
  }
}
