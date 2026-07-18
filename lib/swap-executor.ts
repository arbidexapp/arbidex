import { WalletClient, encodeFunctionData, Address } from 'viem';
import { RouteInfo, NATIVE_ETH, WETH_ADDRESS, AERODROME_V2, PANCAKESWAP_V3, BUILDER_CODE } from './contracts';
import { getDeadline } from './routing';
import SwapRouter02ABI from './abis/SwapRouter02.json';
import PancakeSwapV3RouterABI from './abis/PancakeSwapV3Router.json';
import AerodromeRouterABI from './abis/AerodromeRouter.json';
import WETH9ABI from './abis/WETH9.json';

// ── ERC-8021 Builder Code Attribution ────────────────────────────────────────
// Format: <builderCode UTF-8 hex> + <length byte> + <16-byte 0x8021 marker>
// Example: "bc_uecl1gee" → hex + 0b + 80218021802180218021802180218021
function buildERC8021Suffix(): `0x${string}` {
  const codeHex = Buffer.from(BUILDER_CODE, 'utf8').toString('hex');
  const lengthByte = BUILDER_CODE.length.toString(16).padStart(2, '0');
  const marker = '80218021802180218021802180218021';
  return `0x${codeHex}${lengthByte}${marker}`;
}

// Append ERC-8021 suffix to existing calldata
function withBuilderCode(calldata: `0x${string}`): `0x${string}` {
  const suffix = buildERC8021Suffix();
  // Remove '0x' from suffix before appending
  return (calldata + suffix.slice(2)) as `0x${string}`;
}

/**
 * Execute swap on the best route with native ETH support
 */
export async function executeSwap(
  walletClient: WalletClient,
  route: RouteInfo,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
  minAmountOut: bigint,
  userAddress: Address
): Promise<`0x${string}`> {
  const deadline = getDeadline(20);

  // Special case: ETH ↔ WETH wrap/unwrap
  if (route.dex === 'weth-wrap') {
    const isWrap = tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase();
    if (isWrap) {
      return walletClient.writeContract({
        address: WETH_ADDRESS as `0x${string}`,
        abi: WETH9ABI,
        functionName: 'deposit',
        value: amountIn,
        dataSuffix: buildERC8021Suffix(),
      } as any);
    } else {
      return walletClient.writeContract({
        address: WETH_ADDRESS as `0x${string}`,
        abi: WETH9ABI,
        functionName: 'withdraw',
        args: [amountIn],
        dataSuffix: buildERC8021Suffix(),
      } as any);
    }
  }

  const isEthIn  = tokenIn.toLowerCase()  === NATIVE_ETH.toLowerCase();
  const isEthOut = tokenOut.toLowerCase() === NATIVE_ETH.toLowerCase();

  switch (route.dex) {
    case 'uniswap-v3':
    case 'aerodrome-slipstream':
      return executeV3Swap(walletClient, route.routerAddress as `0x${string}`, SwapRouter02ABI,
        tokenIn, tokenOut, route.feeTier!, amountIn, minAmountOut, userAddress, deadline, isEthIn, isEthOut, false);

    case 'pancakeswap-v3':
      return executeV3Swap(walletClient, route.routerAddress as `0x${string}`, PancakeSwapV3RouterABI,
        tokenIn, tokenOut, route.feeTier!, amountIn, minAmountOut, userAddress, deadline, isEthIn, isEthOut, true);

    case 'aerodrome-v2-stable':
    case 'aerodrome-v2-volatile':
      return executeAerodromeV2Swap(walletClient, tokenIn, tokenOut, route.stable!,
        amountIn, minAmountOut, userAddress, deadline, isEthIn, isEthOut);

    default:
      throw new Error(`Unsupported DEX: ${route.dex}`);
  }
}

/**
 * Execute Uniswap V3 / PancakeSwap V3 / Aerodrome Slipstream swap
 */
async function executeV3Swap(
  walletClient: WalletClient,
  routerAddress: `0x${string}`,
  abi: typeof SwapRouter02ABI,
  tokenIn: Address,
  tokenOut: Address,
  fee: number,
  amountIn: bigint,
  amountOutMinimum: bigint,
  recipient: Address,
  deadline: bigint,
  isEthIn: boolean,
  isEthOut: boolean,
  isPancake: boolean = false
): Promise<`0x${string}`> {
  const actualTokenIn  = isEthIn  ? WETH_ADDRESS : tokenIn;
  const actualTokenOut = isEthOut ? WETH_ADDRESS : tokenOut;
  const suffix = buildERC8021Suffix();

  const buildParams = (overrideRecipient: Address) =>
    isPancake
      ? { tokenIn: actualTokenIn, tokenOut: actualTokenOut, fee, recipient: overrideRecipient, deadline, amountIn, amountOutMinimum, sqrtPriceLimitX96: 0n }
      : { tokenIn: actualTokenIn, tokenOut: actualTokenOut, fee, recipient: overrideRecipient, amountIn, amountOutMinimum, sqrtPriceLimitX96: 0n };

  if (isEthOut) {
    const swapCalldata = encodeFunctionData({ abi, functionName: 'exactInputSingle', args: [buildParams(routerAddress)] });
    const unwrapCalldata = encodeFunctionData({ abi, functionName: 'unwrapWETH9', args: [amountOutMinimum, recipient] });
    return walletClient.writeContract({
      address: routerAddress, abi, functionName: 'multicall',
      args: [[swapCalldata, unwrapCalldata]],
      value: isEthIn ? amountIn : 0n,
      dataSuffix: suffix,
    } as any);
  }

  return walletClient.writeContract({
    address: routerAddress, abi, functionName: 'exactInputSingle',
    args: [buildParams(recipient)],
    value: isEthIn ? amountIn : 0n,
    dataSuffix: suffix,
  } as any);
}

/**
 * Execute Aerodrome V2 swap with native ETH support
 */
async function executeAerodromeV2Swap(
  walletClient: WalletClient,
  tokenIn: Address,
  tokenOut: Address,
  stable: boolean,
  amountIn: bigint,
  amountOutMin: bigint,
  recipient: Address,
  deadline: bigint,
  isEthIn: boolean,
  isEthOut: boolean
): Promise<`0x${string}`> {
  const route = [{
    from: isEthIn ? WETH_ADDRESS : tokenIn,
    to: isEthOut ? WETH_ADDRESS : tokenOut,
    stable,
    factory: AERODROME_V2.PoolFactory,
  }];
  const suffix = buildERC8021Suffix();

  if (isEthIn) {
    return walletClient.writeContract({
      address: AERODROME_V2.Router as `0x${string}`, abi: AerodromeRouterABI,
      functionName: 'swapExactETHForTokens',
      args: [amountOutMin, route, recipient, deadline],
      value: amountIn, dataSuffix: suffix,
    } as any);
  }

  if (isEthOut) {
    return walletClient.writeContract({
      address: AERODROME_V2.Router as `0x${string}`, abi: AerodromeRouterABI,
      functionName: 'swapExactTokensForETH',
      args: [amountIn, amountOutMin, route, recipient, deadline],
      dataSuffix: suffix,
    } as any);
  }

  return walletClient.writeContract({
    address: AERODROME_V2.Router as `0x${string}`, abi: AerodromeRouterABI,
    functionName: 'swapExactTokensForTokens',
    args: [amountIn, amountOutMin, route, recipient, deadline],
    dataSuffix: suffix,
  } as any);
}
