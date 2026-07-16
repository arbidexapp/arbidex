'use client';

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { TokenInput } from './TokenInput';
import { RouteDisplay } from './RouteDisplay';
import { SwapButton } from './SwapButton';
import { SlippageSettings } from './SlippageSettings';
import { NATIVE_ETH, TOKENS, RouteInfo } from '@/lib/contracts';
import ERC20ABI from '@/lib/abis/ERC20.json';

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  isNative: boolean;
}

export function SwapInterface() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const [tokenIn, setTokenIn] = useState<TokenInfo>({
    address: NATIVE_ETH, symbol: 'ETH', decimals: 18, isNative: true,
  });
  const [tokenOut, setTokenOut] = useState<TokenInfo>({
    address: TOKENS.USDC, symbol: 'USDC', decimals: 6, isNative: false,
  });

  const [amountIn, setAmountIn]       = useState('');
  const [amountOut, setAmountOut]     = useState('');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [slippage, setSlippage]       = useState(0.5);
  const [bestRoute, setBestRoute]     = useState<RouteInfo | null>(null);
  const [refreshKey, setRefreshKey]   = useState(0);

  const fetchTokenInfo = async (tokenAddress: string): Promise<TokenInfo> => {
    if (tokenAddress.toLowerCase() === NATIVE_ETH.toLowerCase())
      return { address: NATIVE_ETH, symbol: 'ETH', decimals: 18, isNative: true };
    if (tokenAddress.toLowerCase() === TOKENS.WETH.toLowerCase())
      return { address: TOKENS.WETH, symbol: 'WETH', decimals: 18, isNative: false };
    if (tokenAddress.toLowerCase() === TOKENS.USDC.toLowerCase())
      return { address: TOKENS.USDC, symbol: 'USDC', decimals: 6, isNative: false };
    if (tokenAddress.toLowerCase() === TOKENS.DAI.toLowerCase())
      return { address: TOKENS.DAI, symbol: 'DAI', decimals: 18, isNative: false };
    if (tokenAddress.toLowerCase() === TOKENS.USDT.toLowerCase())
      return { address: TOKENS.USDT, symbol: 'USDT', decimals: 6, isNative: false };
    if (publicClient) {
      try {
        const [symbol, decimals] = await Promise.all([
          publicClient.readContract({ address: tokenAddress as `0x${string}`, abi: ERC20ABI, functionName: 'symbol' }),
          publicClient.readContract({ address: tokenAddress as `0x${string}`, abi: ERC20ABI, functionName: 'decimals' }),
        ]);
        return { address: tokenAddress, symbol: symbol as string, decimals: decimals as number, isNative: false };
      } catch {}
    }
    return { address: tokenAddress, symbol: tokenAddress.slice(0, 6) + '...', decimals: 18, isNative: false };
  };

  const handleTokenInSelect = async (tokenAddress: string) => {
    const info = await fetchTokenInfo(tokenAddress);
    setTokenIn(info);
    setAmountOut('');
    setBestRoute(null);
  };

  const handleTokenOutSelect = async (tokenAddress: string) => {
    const info = await fetchTokenInfo(tokenAddress);
    setTokenOut(info);
    setAmountOut('');
    setBestRoute(null);
  };

  const switchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn('');
    setAmountOut('');
    setBestRoute(null);
  };

  // Called by SwapButton after confirmed tx — refresh everything
  const handleSwapSuccess = useCallback(() => {
    setAmountIn('');
    setAmountOut('');
    setBestRoute(null);
    setRefreshKey(k => k + 1); // triggers balance re-fetch in all TokenInput components
    queryClient.invalidateQueries();
  }, [queryClient]);

  // Stable callbacks so RouteDisplay doesn't re-render infinitely
  const handleAmountOutChange = useCallback((v: string) => setAmountOut(v), []);
  const handleLoadingChange   = useCallback((v: boolean) => setIsLoadingQuote(v), []);
  const handleBestRouteChange = useCallback((r: RouteInfo | null) => setBestRoute(r), []);

  const swapDisabled =
    !isConnected ||
    !amountIn ||
    parseFloat(amountIn) <= 0 ||
    isLoadingQuote ||
    !bestRoute;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-orange-100 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold text-gray-900">Swap</h2>
        <SlippageSettings slippage={slippage} onChange={setSlippage} />
      </div>

      <div className="px-6 pb-6 space-y-2">
        {/* You Pay */}
        <TokenInput
          label="You pay"
          value={amountIn}
          onValueChange={(v) => { setAmountIn(v); if (!v) { setAmountOut(''); setBestRoute(null); } }}
          selectedToken={tokenIn.address}
          onTokenSelect={handleTokenInSelect}
          userAddress={address}
          tokenDecimals={tokenIn.decimals}
          tokenSymbol={tokenIn.symbol}
          showPercentageButtons={true}
          refreshKey={refreshKey}
        />

        {/* Switch */}
        <div className="flex justify-center relative z-10">
          <button
            onClick={switchTokens}
            className="bg-orange-50 hover:bg-orange-100 border-2 border-white rounded-xl p-2 shadow-md transition-all hover:scale-110 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* You Receive */}
        <TokenInput
          label="You receive"
          value={amountOut}
          onValueChange={() => {}}
          selectedToken={tokenOut.address}
          onTokenSelect={handleTokenOutSelect}
          userAddress={address}
          tokenDecimals={tokenOut.decimals}
          tokenSymbol={tokenOut.symbol}
          readOnly
          showPercentageButtons={false}
          isLoading={isLoadingQuote}
          refreshKey={refreshKey}
        />

        {/* Route / Exchange Rate */}
        {isConnected && amountIn && parseFloat(amountIn) > 0 && (
          <RouteDisplay
            tokenIn={tokenIn.address}
            tokenOut={tokenOut.address}
            amountIn={amountIn}
            decimalsIn={tokenIn.decimals}
            decimalsOut={tokenOut.decimals}
            symbolIn={tokenIn.symbol}
            symbolOut={tokenOut.symbol}
            onAmountOutChange={handleAmountOutChange}
            onLoadingChange={handleLoadingChange}
            onBestRouteChange={handleBestRouteChange}
          />
        )}

        {/* Swap Button */}
        <div className="pt-1">
          <SwapButton
            tokenIn={tokenIn.address}
            tokenOut={tokenOut.address}
            tokenInSymbol={tokenIn.symbol}
            tokenOutSymbol={tokenOut.symbol}
            amountIn={amountIn}
            amountOut={amountOut}
            decimalsIn={tokenIn.decimals}
            decimalsOut={tokenOut.decimals}
            slippage={slippage}
            bestRoute={bestRoute}
            disabled={swapDisabled}
            onSwapSuccess={handleSwapSuccess}
          />
        </div>

        {!isConnected && (
          <p className="text-center text-sm text-gray-400 pt-1">
            Connect your wallet to start trading
          </p>
        )}
      </div>
    </div>
  );
}
