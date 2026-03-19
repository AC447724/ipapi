import { ipAddress, geolocation } from '@vercel/functions';

export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': 'https://percs.fun',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
      
      data = {
        status: "success",
        type: "visitor",
        query: visitorIp,
        city: geo?.city || "Unknown",
        country: geo?.country || "Unknown",
        region: geo?.region || "Unknown",
        lat: geo?.latitude || 0,
        lon: geo?.longitude || 0
      };
    } else {
      const response = await fetch(`http://ip-api.com/json/${targetIp}`);
      
      if (!response.ok) {
        throw new Error(`External API responded with status: ${response.status}`);
      }
      
      data = await response.json();
      data.type = "manual_lookup";
    }

    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers 
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      status: "fail", 
      message: error.message 
    }), { 
      status: 500, 
      headers 
    });
  }
}
