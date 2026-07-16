import { PublicClient, parseUnits, Address } from 'viem';
import {
  UNISWAP_V3,
  PANCAKESWAP_V3,
  AERODROME_V2,
  AERODROME_SLIPSTREAM,
  UNISWAP_V3_FEE_TIERS,
  RouteInfo,
  NATIVE_ETH,
  WETH_ADDRESS,
} from './contracts';

import QuoterV2ABI from './abis/QuoterV2.json';
import AerodromeRouterABI from './abis/AerodromeRouter.json';

/**
 * Fetches quotes in parallel from Uniswap V3 and Aerodrome.
 * Converts native ETH → WETH for pool queries.
 */
export async function getAllQuotes(
  client: PublicClient,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: string,
  decimalsIn: number = 18
): Promise<RouteInfo[]> {
  const amount = parseUnits(amountIn, decimalsIn);

  // ETH ↔ WETH: 1:1, fee yok
  const isETHtoWETH =
    tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase() &&
    tokenOut.toLowerCase() === WETH_ADDRESS.toLowerCase();
  const isWETHtoETH =
    tokenIn.toLowerCase() === WETH_ADDRESS.toLowerCase() &&
    tokenOut.toLowerCase() === NATIVE_ETH.toLowerCase();

  if (isETHtoWETH || isWETHtoETH) {
    return [{ dex: 'weth-wrap', amountOut: amount, routerAddress: WETH_ADDRESS }];
  }

  // Use WETH for pool queries when native ETH is involved
  const quoteTokenIn  = tokenIn.toLowerCase()  === NATIVE_ETH.toLowerCase() ? WETH_ADDRESS : tokenIn;
  const quoteTokenOut = tokenOut.toLowerCase() === NATIVE_ETH.toLowerCase() ? WETH_ADDRESS : tokenOut;

  const routes: RouteInfo[] = [];

  // 1. Uniswap V3 — 4 fee tier paralel
  const uniswapPromises = UNISWAP_V3_FEE_TIERS.map(async (feeTier) => {
    try {
      const result = await client.readContract({
        address: UNISWAP_V3.QuoterV2 as `0x${string}`,
        abi: QuoterV2ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          tokenIn: quoteTokenIn,
          tokenOut: quoteTokenOut,
          amountIn: amount,
          fee: feeTier,
          sqrtPriceLimitX96: 0n,
        }],
      });
      const [amountOut, , , gasEstimate] = result as [bigint, bigint, number, bigint];
      if (amountOut > 0n) {
        routes.push({
          dex: 'uniswap-v3',
          amountOut,
          routerAddress: UNISWAP_V3.SwapRouter02,
          quoterAddress: UNISWAP_V3.QuoterV2,
          feeTier,
          gasEstimate,
        });
      }
    } catch {
      console.debug(`Uniswap V3 fee ${feeTier} — pool yok`);
    }
  });

  // 2. PancakeSwap V3 — 4 fee tier paralel
  const pancakePromises = UNISWAP_V3_FEE_TIERS.map(async (feeTier) => {
    try {
      const result = await client.readContract({
        address: PANCAKESWAP_V3.QuoterV2 as `0x${string}`,
        abi: QuoterV2ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          tokenIn: quoteTokenIn,
          tokenOut: quoteTokenOut,
          amountIn: amount,
          fee: feeTier,
          sqrtPriceLimitX96: 0n,
        }],
      });
      const [amountOut, , , gasEstimate] = result as [bigint, bigint, number, bigint];
      if (amountOut > 0n) {
        routes.push({
          dex: 'pancakeswap-v3',
          amountOut,
          routerAddress: PANCAKESWAP_V3.SwapRouter,
          quoterAddress: PANCAKESWAP_V3.QuoterV2,
          feeTier,
          gasEstimate,
        });
      }
    } catch {
      console.debug(`PancakeSwap V3 fee ${feeTier} — pool yok`);
    }
  });

  // 3. Aerodrome V2 — stable + volatile paralel
  const aeroV2Promises = [true, false].map(async (stable) => {
    try {
      const result = await client.readContract({
        address: AERODROME_V2.Router as `0x${string}`,
        abi: AerodromeRouterABI,
        functionName: 'getAmountsOut',
        args: [
          amount,
          [{ from: quoteTokenIn, to: quoteTokenOut, stable, factory: AERODROME_V2.PoolFactory }],
        ],
      });
      const amounts = result as bigint[];
      const amountOut = amounts[amounts.length - 1];
      if (amountOut > 0n) {
        routes.push({
          dex: stable ? 'aerodrome-v2-stable' : 'aerodrome-v2-volatile',
          amountOut,
          routerAddress: AERODROME_V2.Router,
          stable,
        });
      }
    } catch {
      console.debug(`Aerodrome V2 ${stable ? 'stable' : 'volatile'} — pool yok`);
    }
  });

  // 3. Aerodrome Slipstream — tickSpacing based (not fee); try common tickSpacing values
  const aeroSlipTickSpacings = [1, 50, 100, 200];
  const aeroSlipPromises = aeroSlipTickSpacings.map(async (tickSpacing) => {
    try {
      // Slipstream QuoterV2 uses tickSpacing instead of fee
      // Pass tickSpacing as the fee parameter (Aerodrome Slipstream compatible)
      const result = await client.readContract({
        address: AERODROME_SLIPSTREAM.QuoterV2 as `0x${string}`,
        abi: QuoterV2ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          tokenIn: quoteTokenIn,
          tokenOut: quoteTokenOut,
          amountIn: amount,
          fee: tickSpacing,
          sqrtPriceLimitX96: 0n,
        }],
      });
      const [amountOut, , , gasEstimate] = result as [bigint, bigint, number, bigint];
      if (amountOut > 0n) {
        routes.push({
          dex: 'aerodrome-slipstream',
          amountOut,
          routerAddress: AERODROME_SLIPSTREAM.SwapRouter,
          quoterAddress: AERODROME_SLIPSTREAM.QuoterV2,
          feeTier: tickSpacing,
          gasEstimate,
        });
      }
    } catch {
      // incompatible tickSpacing — skip silently
    }
  });

  // Run all in parallel
  await Promise.all([...uniswapPromises, ...pancakePromises, ...aeroV2Promises, ...aeroSlipPromises]);

  return routes;
}

/**
 * Calculates minimum output amount based on slippage tolerance
 */
export function calculateMinAmountOut(amountOut: bigint, slippagePercent: number): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100));
  return (amountOut * (10000n - slippageBps)) / 10000n;
}

/**
 * Deadline timestamp (now + minutes)
 */
export function getDeadline(minutesFromNow: number = 20): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + minutesFromNow * 60);
}
