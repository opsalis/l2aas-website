/**
 * L2aaS — Purchase Processing Worker
 *
 * Flow:
 *   1. Client sends POST /api/purchase with { tier, paymentMethod, l1Wallet }
 *   2. Worker validates session + tier selection
 *   3. For card: initiates Coinbase Onramp session (returns redirect URL)
 *   4. For USDC: returns contract address + calldata for client-side tx
 *   5. After payment confirmed: relayer handles OpsGas credit (separate service)
 *
 * KV Namespaces: SESSIONS, CUSTOMERS
 * Env vars: COINBASE_ONRAMP_API_KEY, PURCHASE_CONTRACT_ADDRESS
 */

const TIERS = [
  { id: 0, price: 10,   credits: 10,    label: '$10'    },
  { id: 1, price: 50,   credits: 75,    label: '$50'    },
  { id: 2, price: 100,  credits: 200,   label: '$100'   },
  { id: 3, price: 500,  credits: 1500,  label: '$500'   },
  { id: 4, price: 1000, credits: 5000,  label: '$1,000' },
];

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const body = await request.json();
    const { tier, paymentMethod, l1Wallet } = body;

    // Validate tier
    if (tier === undefined || tier < 0 || tier >= TIERS.length) {
      return new Response(
        JSON.stringify({ error: 'Invalid tier', validTiers: TIERS }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!l1Wallet) {
      return new Response(
        JSON.stringify({ error: 'Missing l1Wallet address' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const selectedTier = TIERS[tier];

    if (paymentMethod === 'card') {
      // TODO: Coinbase Onramp integration
      // const onrampSession = await fetch('https://api.developer.coinbase.com/onramp/v1/buy/options', {
      //   headers: { 'Authorization': `Bearer ${env.COINBASE_ONRAMP_API_KEY}` },
      //   ...
      // });

      return new Response(
        JSON.stringify({
          ok: true,
          method: 'card',
          tier: selectedTier,
          redirectUrl: null,
          message: 'Coinbase Onramp stub — card payment integration not yet implemented. In production, this returns a redirect URL to the Coinbase payment flow.',
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    if (paymentMethod === 'usdc') {
      // Return contract details for client-side transaction
      return new Response(
        JSON.stringify({
          ok: true,
          method: 'usdc',
          tier: selectedTier,
          contract: {
            address: '0x0000000000000000000000000000000000000000', // Placeholder
            network: 'Base Sepolia',
            chainId: 84532,
            functionName: 'buyOpsGas',
            args: {
              usdcAmount: selectedTier.price * 1e6, // USDC has 6 decimals
              l1Wallet: l1Wallet,
            },
          },
          message: 'USDC payment stub — contract not yet deployed. In production, the client uses this data to build and submit the transaction.',
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid paymentMethod. Use "card" or "usdc".' }),
      { status: 400, headers: corsHeaders }
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
