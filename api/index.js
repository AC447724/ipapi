import { ipAddress, geolocation } from '@vercel/functions';

export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': 'https://percs.fun',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const { searchParams } = new URL(request.url);
  const targetIp = searchParams.get('ip');

  try {
    let data;
    if (!targetIp) {
      const visitorIp = ipAddress(request) || '127.0.0.1';
      const geo = geolocation(request);
      data = { ip: visitorIp, ...geo };
    } else {
      const response = await fetch(`https://ipapi.co/${targetIp}/json/`);
      data = await response.json();
    }

    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Lookup failed" }), { status: 500, headers });
  }
}
