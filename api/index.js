import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const config = {
  runtime: 'edge',
};

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': 'https://percs.fun',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const visitorIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  
  const { success, limit, reset, remaining } = await ratelimit.limit(visitorIp);
  
  const rateHeaders = {
    ...headers,
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset.toString(),
  };

  if (!success) {
    return new Response(JSON.stringify({ 
      status: "fail", 
      message: "Too many requests. Slow down." 
    }), { status: 429, headers: rateHeaders });
  }

  try {
    const { searchParams } = new URL(request.url);
    const targetIp = searchParams.get('ip') || Array.from(searchParams.keys())[0];

    if (!targetIp) {
      return new Response(JSON.stringify({
        status: "success",
        type: "visitor",
        ip: visitorIp,
        city: request.headers.get('x-vercel-ip-city') || 'Unknown',
        region: request.headers.get('x-vercel-ip-country-region') || 'Unknown',
        country: request.headers.get('x-vercel-ip-country') || 'Unknown',
        latitude: request.headers.get('x-vercel-ip-latitude') || 'Unknown',
        longitude: request.headers.get('x-vercel-ip-longitude') || 'Unknown',
        timezone: request.headers.get('x-vercel-ip-timezone') || 'Unknown'
      }), { status: 200, headers: rateHeaders });
    }

    const res = await fetch(`http://ip-api.com/json/${targetIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
    const data = await res.json();

    return new Response(JSON.stringify({ ...data, type: "manual_lookup" }), { 
      status: 200, 
      headers: rateHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      status: "error", 
      message: error.message 
    }), { status: 500, headers: rateHeaders });
  }
}
