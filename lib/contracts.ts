// Base Mainnet (Chain ID: 8453) DEX Contract Addresses

// Native ETH Sentinel Address (not a real contract, represents native ETH)
export const NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as const;

// WETH9 on Base
export const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as const;

// Uniswap V3 on Base MAINNET (CORRECT addresses)
export const UNISWAP_V3 = {
  QuoterV2: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
  SwapRouter02: '0x2626664c2603336E57B271c5C0b26F421741e481',
  Factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
} as const;

// PancakeSwap V3 on Base
export const PANCAKESWAP_V3 = {
  SwapRouter: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
  QuoterV2: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
  Factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
} as const;

// Aerodrome V2 (stable/volatile pools)
export const AERODROME_V2 = {
  Router: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
  PoolFactory: '0x420DD381b31aEf6683db6B902084cB0FfECe40Da',
} as const;

// Aerodrome Slipstream (concentrated liquidity, V3-style)
export const AERODROME_SLIPSTREAM = {
  QuoterV2: '0x254cF9E1E6e233aa1AC962CB9B05b2cfeAaE15b0',
  SwapRouter: '0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5',
  PoolFactory: '0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A',
} as const;

// Multicall3 (standard address on Base) — reserved for future multi-call optimizations
// export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

// Uniswap V3 Fee Tiers
export const UNISWAP_V3_FEE_TIERS = [100, 500, 3000, 10000] as const; // 0.01%, 0.05%, 0.3%, 1%

// Common token addresses on Base
export const TOKENS = {
  WETH: WETH_ADDRESS,
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
} as const;

// DEX identifiers for routing
export type DexType = 
  | 'uniswap-v3' 
  | 'pancakeswap-v3' 
  | 'aerodrome-v2-stable' 
  | 'aerodrome-v2-volatile' 
  | 'aerodrome-slipstream'
  | 'weth-wrap'; // Special case for ETH ↔ WETH

export interface RouteInfo {
  dex: DexType;
  amountOut: bigint;
  routerAddress: string;
  quoterAddress?: string;
  feeTier?: number;
  stable?: boolean;
  gasEstimate?: bigint;
}

// Builder Code for ERC-8021 Attribution
export const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE || 'bc_arbidex';
