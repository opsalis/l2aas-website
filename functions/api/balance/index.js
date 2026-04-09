/**
 * L2aaS — Balance Check Worker
 *
 * Flow:
 *   1. Client sends GET /api/balance with Authorization header (session token)
 *   2. Worker validates session token against KV
 *   3. Worker calls L1 RPC to check customer's OpsGas balance
 *   4. Returns balance + usage estimate
 *
 * KV Namespaces: SESSIONS, CUSTOMERS, USAGE_CACHE
 * Env vars: L1_RPC_URL (private — never exposed to browser)
 */

export async function onRequestGet(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(' ')[1];

    // TODO: Validate session token from KV
    // const session = await env.SESSIONS.get(token, 'json');
    // if (!session || session.expiresAt < Date.now()) {
    //   return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
    // }

    // TODO: Check cached balance first
    // const cached = await env.USAGE_CACHE.get(`balance:${session.address}`, 'json');
    // if (cached) return new Response(JSON.stringify(cached), { headers: corsHeaders });

    // TODO: Call L1 RPC to get real balance
    // const balance = await fetch(env.L1_RPC_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     jsonrpc: '2.0', id: 1, method: 'eth_getBalance',
    //     params: [session.address, 'latest']
    //   })
    // });

    // Placeholder response
    const response = {
      ok: true,
      balance: {
        credits: 147.3,
        usdValue: 73.65,
        lastUpdated: new Date().toISOString(),
      },
      usage: {
        currentMonth: 30.1,
        averageMonthly: 28.5,
        estimatedMonthsRemaining: 4.9,
      },
      status: 'active', // active | low_balance | stalled
      message: 'Balance stub — L1 RPC integration not yet implemented',
    };

    return new Response(JSON.stringify(response), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
