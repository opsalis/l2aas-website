/**
 * L2aaS — Wallet Authentication Worker
 *
 * Flow:
 *   1. Client sends POST /api/auth/login with { address, signature, message }
 *   2. Worker verifies the signature matches the address
 *   3. Worker creates/updates customer record in KV
 *   4. Worker returns a JWT session token (stored in KV with TTL)
 *
 * KV Namespaces: SESSIONS (l2aas-sessions), CUSTOMERS (l2aas-customers)
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { address, signature, message } = body;

    if (!address || !signature || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing address, signature, or message' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // TODO: Verify EIP-191 signature against address
    // const recoveredAddress = ethers.verifyMessage(message, signature);
    // if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
    //   return Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    // }

    // Generate session token (placeholder — use proper JWT in production)
    const sessionToken = crypto.randomUUID();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Store session in KV
    // await env.SESSIONS.put(sessionToken, JSON.stringify({
    //   address: address.toLowerCase(),
    //   createdAt: Date.now(),
    //   expiresAt,
    // }), { expirationTtl: 86400 });

    // Upsert customer record
    // const existing = await env.CUSTOMERS.get(address.toLowerCase(), 'json');
    // if (!existing) {
    //   await env.CUSTOMERS.put(address.toLowerCase(), JSON.stringify({
    //     address: address.toLowerCase(),
    //     createdAt: Date.now(),
    //     l2ChainId: null,
    //     l2Rpc: null,
    //   }));
    // }

    return new Response(
      JSON.stringify({
        ok: true,
        token: sessionToken,
        expiresAt,
        address: address.toLowerCase(),
        message: 'Authentication stub — signature verification not yet implemented',
      }),
      { status: 200, headers: corsHeaders }
    );
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
