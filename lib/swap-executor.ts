import { WalletClient, encodeFunctionData, Address } from 'viem';
import { RouteInfo, NATIVE_ETH, WETH_ADDRESS, AERODROME_V2, BUILDER_CODE } from './contracts';
import { getDeadline } from './routing';
import SwapRouter02ABI from './abis/SwapRouter02.json';
import PancakeSwapV3RouterABI from './abis/PancakeSwapV3Router.json';
import AerodromeRouterABI from './abis/AerodromeRouter.json';
import WETH9ABI from './abis/WETH9.json';

// ── ERC-8021 Builder Code Attribution ────────────────────────────────────────
// Format: builderCode(utf8 hex) + length(1 byte hex) + 8021 marker x8 (16 bytes)
function erc8021Suffix(): string {
  const codeBytes = Buffer.from(BUILDER_CODE, 'utf8');
  const codeHex   = codeBytes.toString('hex');
  const lenHex    = codeBytes.length.toString(16).padStart(2, '0');
  const marker    = '80218021802180218021802180218021'; // 16 bytes
  return codeHex + lenHex + marker;
}

function withAttribution(calldata: `0x${string}`): `0x${string}` {
  return (calldata + erc8021Suffix()) as `0x${string}`;
}

function tx(to: string, data: `0x${string}`, value?: bigint) {
  return { to: to as Address, data, ...(value !== undefined ? { value } : {}) } as any;
}

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

  if (route.dex === 'weth-wrap') {
    const isWrap = tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase();
    if (isWrap) {
      return walletClient.sendTransaction(tx(
        WETH_ADDRESS,
        withAttribution(encodeFunctionData({ abi: WETH9ABI, functionName: 'deposit' })),
        amountIn
      ));
    } else {
      return walletClient.sendTransaction(tx(
        WETH_ADDRESS,
        withAttribution(encodeFunctionData({ abi: WETH9ABI, functionName: 'withdraw', args: [amountIn] }))
      ));
    }
  }

  const isEthIn  = tokenIn.toLowerCase()  === NATIVE_ETH.toLowerCase();
  const isEthOut = tokenOut.toLowerCase() === NATIVE_ETH.toLowerCase();

  switch (route.dex) {
    case 'uniswap-v3':
    case 'aerodrome-slipstream':
      return executeV3Swap(walletClient, route.routerAddress as Address, SwapRouter02ABI,
        tokenIn, tokenOut, route.feeTier!, amountIn, minAmountOut, userAddress, deadline, isEthIn, isEthOut, false);
    case 'pancakeswap-v3':
      return executeV3Swap(walletClient, route.routerAddress as Address, PancakeSwapV3RouterABI,
        tokenIn, tokenOut, route.feeTier!, amountIn, minAmountOut, userAddress, deadline, isEthIn, isEthOut, true);
    case 'aerodrome-v2-stable':
    case 'aerodrome-v2-volatile':
      return executeAerodromeV2Swap(walletClient, tokenIn, tokenOut, route.stable!,
        amountIn, minAmountOut, userAddress, deadline, isEthIn, isEthOut);
    default:
      throw new Error(`Unsupported DEX: ${route.dex}`);
  }
}

async function executeV3Swap(
  walletClient: WalletClient,
  routerAddress: Address,
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

  const buildParams = (r: Address) =>
    isPancake
      ? { tokenIn: actualTokenIn, tokenOut: actualTokenOut, fee, recipient: r, deadline, amountIn, amountOutMinimum, sqrtPriceLimitX96: 0n }
      : { tokenIn: actualTokenIn, tokenOut: actualTokenOut, fee, recipient: r, amountIn, amountOutMinimum, sqrtPriceLimitX96: 0n };

  if (isEthOut) {
    const swapData   = encodeFunctionData({ abi, functionName: 'exactInputSingle', args: [buildParams(routerAddress)] });
    const unwrapData = encodeFunctionData({ abi, functionName: 'unwrapWETH9', args: [amountOutMinimum, recipient] });
    const data = withAttribution(encodeFunctionData({ abi, functionName: 'multicall', args: [[swapData, unwrapData]] }));
    return walletClient.sendTransaction(tx(routerAddress, data, isEthIn ? amountIn : 0n));
  }

  const data = withAttribution(encodeFunctionData({ abi, functionName: 'exactInputSingle', args: [buildParams(recipient)] }));
  return walletClient.sendTransaction(tx(routerAddress, data, isEthIn ? amountIn : 0n));
}

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
  const aeroRoute = [{
    from: isEthIn ? WETH_ADDRESS : tokenIn,
    to: isEthOut ? WETH_ADDRESS : tokenOut,
    stable,
    factory: AERODROME_V2.PoolFactory,
  }];

  if (isEthIn) {
    return walletClient.sendTransaction(tx(
      AERODROME_V2.Router,
      withAttribution(encodeFunctionData({ abi: AerodromeRouterABI, functionName: 'swapExactETHForTokens', args: [amountOutMin, aeroRoute, recipient, deadline] })),
      amountIn
    ));
  }
  if (isEthOut) {
    return walletClient.sendTransaction(tx(
      AERODROME_V2.Router,
      withAttribution(encodeFunctionData({ abi: AerodromeRouterABI, functionName: 'swapExactTokensForETH', args: [amountIn, amountOutMin, aeroRoute, recipient, deadline] }))
    ));
  }
  return walletClient.sendTransaction(tx(
    AERODROME_V2.Router,
    withAttribution(encodeFunctionData({ abi: AerodromeRouterABI, functionName: 'swapExactTokensForTokens', args: [amountIn, amountOutMin, aeroRoute, recipient, deadline] }))
  ));
}
