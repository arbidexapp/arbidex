'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { RouteInfo } from '@/lib/contracts';
import { getAllQuotes } from '@/lib/routing';
import { formatUnits } from 'viem';

interface RouteDisplayProps {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  decimalsIn: number;
  decimalsOut: number;
  symbolIn: string;
  symbolOut: string;
  onAmountOutChange?: (amount: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  onBestRouteChange?: (route: RouteInfo | null) => void;
}

export function RouteDisplay({ 
  tokenIn, 
  tokenOut, 
  amountIn, 
  decimalsIn, 
  decimalsOut,
  symbolIn,
  symbolOut,
  onAmountOutChange,
  onLoadingChange,
  onBestRouteChange,
}: RouteDisplayProps) {
  const publicClient = usePublicClient();
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!publicClient || !tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) <= 0) {
        setRoutes([]);
        onAmountOutChange?.('');
        onLoadingChange?.(false);
        onBestRouteChange?.(null);
        return;
      }

      setLoading(true);
      onLoadingChange?.(true);
      setError(null);
      setRoutes([]);

      let sorted: RouteInfo[] = [];
      let lastError: unknown = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const quotes = await getAllQuotes(
            publicClient,
            tokenIn as `0x${string}`,
            tokenOut as `0x${string}`,
            amountIn,
            decimalsIn
          );
          sorted = quotes.sort((a, b) => Number(b.amountOut - a.amountOut));
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
          if (attempt < 2) await new Promise(r => setTimeout(r, 800));
        }
      }

      if (lastError) {
        console.error('Quote fetch failed after retries:', lastError);
        setError('Could not fetch quotes. Please try again.');
        onAmountOutChange?.('');
        onBestRouteChange?.(null);
      } else if (sorted.length > 0) {
        setRoutes(sorted);
        const best = sorted[0];
        const bestAmountOut = formatUnits(best.amountOut, decimalsOut);
        onAmountOutChange?.(Number(bestAmountOut).toFixed(decimalsOut > 6 ? 6 : decimalsOut));
        onBestRouteChange?.(best);
      } else {
        setRoutes([]);
        onAmountOutChange?.('');
        onBestRouteChange?.(null);
        setError('No liquidity found for this pair.');
      }

      setLoading(false);
      onLoadingChange?.(false);
    };

    const timer = setTimeout(fetchQuotes, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient, tokenIn, tokenOut, amountIn, decimalsIn, decimalsOut]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="h-4 w-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 text-xs py-1">{error}</div>
    );
  }

  if (routes.length === 0) {
    return null;
  }

  const bestRoute = routes[0];
  const amountInNum = parseFloat(amountIn);
  const amountOutNum = parseFloat(formatUnits(bestRoute.amountOut, decimalsOut));
  const rateInToOut = amountInNum > 0 ? (amountOutNum / amountInNum).toFixed(4) : '0';

  return (
    <div className="flex items-center justify-center gap-2 py-1 text-xs text-gray-500">
      <span className="font-medium">1 {symbolIn} ≈ {rateInToOut} {symbolOut}</span>
      <span className="text-orange-400 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full font-medium">
        {bestRoute.dex === 'uniswap-v3' ? 'Uniswap V3' :
         bestRoute.dex === 'pancakeswap-v3' ? 'PancakeSwap' :
         bestRoute.dex === 'aerodrome-v2-stable' ? 'Aerodrome Stable' :
         bestRoute.dex === 'aerodrome-v2-volatile' ? 'Aerodrome' :
         bestRoute.dex === 'aerodrome-slipstream' ? 'Aerodrome CL' :
         bestRoute.dex === 'weth-wrap' ? 'Wrap' :
         bestRoute.dex}
      </span>
    </div>
  );
}
