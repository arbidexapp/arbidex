import { WalletClient, encodeFunctionData, Address, encodeAbiParameters, parseAbiParameters } from 'viem';
import { RouteInfo, NATIVE_ETH, WETH_ADDRESS, AERODROME_V2, PANCAKESWAP_V3, BUILDER_CODE } from './contracts';
import { getDeadline } from './routing';
import SwapRouter02ABI from './abis/SwapRouter02.json';
import PancakeSwapV3RouterABI from './abis/PancakeSwapV3Router.json';
import AerodromeRouterABI from './abis/AerodromeRouter.json';
import WETH9ABI from './abis/WETH9.json';

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
      // ETH → WETH (deposit)
      return walletClient.writeContract({
        address: WETH_ADDRESS as `0x${string}`,
        abi: WETH9ABI,
        functionName: 'deposit',
        value: amountIn,
      } as any);
    } else {
      // WETH → ETH (withdraw)
      return walletClient.writeContract({
        address: WETH_ADDRESS as `0x${string}`,
        abi: WETH9ABI,
        functionName: 'withdraw',
        args: [amountIn],
      } as any);
    }
  }

  // Check if ETH is input or output
  const isEthIn = tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase();
  const isEthOut = tokenOut.toLowerCase() === NATIVE_ETH.toLowerCase();

  // Route to appropriate swap function
  switch (route.dex) {
    case 'uniswap-v3':
    case 'aerodrome-slipstream':
      return executeV3Swap(
        walletClient,
        route.routerAddress as `0x${string}`,
        SwapRouter02ABI,
        tokenIn,
        tokenOut,
        route.feeTier!,
        amountIn,
        minAmountOut,
        userAddress,
        deadline,
        isEthIn,
        isEthOut,
        false
      );

    case 'pancakeswap-v3':
      return executeV3Swap(
        walletClient,
        route.routerAddress as `0x${string}`,
        PancakeSwapV3RouterABI,
        tokenIn,
        tokenOut,
        route.feeTier!,
        amountIn,
        minAmountOut,
        userAddress,
        deadline,
        isEthIn,
        isEthOut,
        true  // PancakeSwap includes a deadline parameter
      );

    case 'aerodrome-v2-stable':
    case 'aerodrome-v2-volatile':
      return executeAerodromeV2Swap(
        walletClient,
        tokenIn,
        tokenOut,
        route.stable!,
        amountIn,
        minAmountOut,
        userAddress,
        deadline,
        isEthIn,
        isEthOut
      );

    default:
      throw new Error(`Unsupported DEX: ${route.dex}`);
  }
}

/**
 * Appends builder code to calldata for Base attribution (ERC-8021)
 */
function appendBuilderCode(calldata: `0x${string}`): `0x${string}` {
  const encoded = Buffer.from(BUILDER_CODE, 'utf8').toString('hex');
  return (calldata + encoded) as `0x${string}`;
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

  const buildParams = (overrideRecipient: Address) =>
    isPancake
      ? { tokenIn: actualTokenIn, tokenOut: actualTokenOut, fee, recipient: overrideRecipient, deadline, amountIn, amountOutMinimum, sqrtPriceLimitX96: 0n }
      : { tokenIn: actualTokenIn, tokenOut: actualTokenOut, fee, recipient: overrideRecipient, amountIn, amountOutMinimum, sqrtPriceLimitX96: 0n };
  // ETH output: swap → WETH, sonra unwrap
  if (isEthOut) {
    const swapCalldata = encodeFunctionData({
      abi,
      functionName: 'exactInputSingle',
      args: [buildParams(routerAddress)],
    });

    const unwrapCalldata = encodeFunctionData({
      abi,
      functionName: 'unwrapWETH9',
      args: [amountOutMinimum, recipient],
    });

    return walletClient.writeContract({
      address: routerAddress,
      abi,
      functionName: 'multicall',
      args: [[swapCalldata, unwrapCalldata]],
      value: isEthIn ? amountIn : 0n,
    } as any);
  }

  // Normal swap
  return walletClient.writeContract({
    address: routerAddress,
    abi,
    functionName: 'exactInputSingle',
    args: [buildParams(recipient)],
    value: isEthIn ? amountIn : 0n,
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

  // ETH input case
  if (isEthIn) {
    return walletClient.writeContract({
      address: AERODROME_V2.Router as `0x${string}`,
      abi: AerodromeRouterABI,
      functionName: 'swapExactETHForTokens',
      args: [amountOutMin, route, recipient, deadline],
      value: amountIn,
    } as any);
  }

  // ETH output case
  if (isEthOut) {
    return walletClient.writeContract({
      address: AERODROME_V2.Router as `0x${string}`,
      abi: AerodromeRouterABI,
      functionName: 'swapExactTokensForETH',
      args: [amountIn, amountOutMin, route, recipient, deadline],
    } as any);
  }

  // Token to token case
  return walletClient.writeContract({
    address: AERODROME_V2.Router as `0x${string}`,
    abi: AerodromeRouterABI,
    functionName: 'swapExactTokensForTokens',
    args: [amountIn, amountOutMin, route, recipient, deadline],
  } as any);
}
