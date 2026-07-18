'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, maxUint256, encodeFunctionData, concat } from 'viem';
import { Attribution } from 'ox/erc8021';
import { calculateMinAmountOut } from '@/lib/routing';
import { executeSwap } from '@/lib/swap-executor';
import { NATIVE_ETH, RouteInfo, BUILDER_CODE } from '@/lib/contracts';
import ERC20ABI from '@/lib/abis/ERC20.json';
import { saveTxToSupabase, updateLeaderboard } from '@/lib/supabase-db';

// ERC-8021 suffix — approve tx'i de attribution'lı gönder
const BUILDER_CODE_SUFFIX = Attribution.toDataSuffix({ codes: [BUILDER_CODE] }) as `0x${string}`;

interface SwapButtonProps {
  tokenIn: string;
  tokenOut: string;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amountIn: string;
  amountOut: string;
  decimalsIn: number;
  decimalsOut: number;
  slippage: number;
  bestRoute: RouteInfo | null;
  disabled: boolean;
  onSwapSuccess?: () => void;
}

enum SwapStep {
  IDLE       = 'idle',
  APPROVING  = 'approving',
  SWAPPING   = 'swapping',
  CONFIRMING = 'confirming',
  SUCCESS    = 'success',
  ERROR      = 'error',
}

export function SwapButton({
  tokenIn,
  tokenOut,
  tokenInSymbol,
  tokenOutSymbol,
  amountIn,
  amountOut,
  decimalsIn,
  decimalsOut,
  slippage,
  bestRoute,
  disabled,
  onSwapSuccess,
}: SwapButtonProps) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [step, setStep]       = useState<SwapStep>(SwapStep.IDLE);
  const [txHash, setTxHash]   = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const isNativeETH = tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase();

  const handleSwap = async () => {
    if (!publicClient || !walletClient || !address || !bestRoute) return;

    setStep(SwapStep.IDLE);
    setError(null);
    setTxHash(null);

    try {
      const amount = parseUnits(amountIn, decimalsIn);

      // 1. Approve if needed
      if (!isNativeETH && bestRoute.dex !== 'weth-wrap') {
        const allowance = await publicClient.readContract({
          address: tokenIn as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'allowance',
          args: [address, bestRoute.routerAddress as `0x${string}`],
        }) as bigint;

        if (allowance < amount) {
          setStep(SwapStep.APPROVING);
          // Attribution ekleyerek approve gönder
          const approveData = encodeFunctionData({
            abi: ERC20ABI,
            functionName: 'approve',
            args: [bestRoute.routerAddress as `0x${string}`, maxUint256],
          });
          const approveHash = await walletClient.sendTransaction({
            to: tokenIn as `0x${string}`,
            data: concat([approveData, BUILDER_CODE_SUFFIX]),
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      // 2. Execute swap with pre-fetched bestRoute
      const minAmountOut = calculateMinAmountOut(bestRoute.amountOut, slippage);
      setStep(SwapStep.SWAPPING);

      const swapHash = await executeSwap(
        walletClient,
        bestRoute,
        tokenIn as `0x${string}`,
        tokenOut as `0x${string}`,
        amount,
        minAmountOut,
        address
      );

      setTxHash(swapHash);
      setStep(SwapStep.CONFIRMING);

      // 3. Wait for on-chain confirmation
      await publicClient.waitForTransactionReceipt({ hash: swapHash });

      // 4. Volume USD hesapla
      const STABLE_SYMBOLS = ['USDC', 'USDT', 'DAI'];
      let volumeUsd = 0;
      if (STABLE_SYMBOLS.includes(tokenOutSymbol.toUpperCase())) {
        // tokenOut zaten USD cinsinden
        volumeUsd = parseFloat(amountOut) || 0;
      } else if (STABLE_SYMBOLS.includes(tokenInSymbol.toUpperCase())) {
        // tokenIn USD cinsinden
        volumeUsd = parseFloat(amountIn) || 0;
      } else {
        // ETH/WETH based — fetch price from CoinGecko
        try {
          const res = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
          );
          const data = await res.json();
          const ethPrice: number = data?.ethereum?.usd ?? 0;
          if (tokenInSymbol === 'ETH' || tokenInSymbol === 'WETH') {
            volumeUsd = (parseFloat(amountIn) || 0) * ethPrice;
          } else if (tokenOutSymbol === 'ETH' || tokenOutSymbol === 'WETH') {
            volumeUsd = (parseFloat(amountOut) || 0) * ethPrice;
          }
        } catch {
          volumeUsd = 0;
        }
      }

      // 5. Kaydet — sadece Supabase
      saveTxToSupabase({
        hash:      swapHash,
        wallet:    address,
        type:      'swap',
        token_in:  tokenInSymbol,
        token_out: tokenOutSymbol,
        amount_in: amountIn,
        timestamp: Date.now(),
      }).catch(console.error);
      updateLeaderboard(address, 'swap', volumeUsd).catch(console.error);
      // Aynı tab'daki History'yi güncelle
      window.dispatchEvent(new Event('aggrex_tx_update'));

      setStep(SwapStep.SUCCESS);
      onSwapSuccess?.();          // reset UI + refresh balances

    } catch (err) {
      console.error('Swap error:', err);
      setError(humanizeError(err instanceof Error ? err.message : String(err)));
      setStep(SwapStep.ERROR);
    }
  };

  const humanizeError = (msg: string): string => {
    if (msg.includes('insufficient funds'))   return 'Insufficient ETH for gas.';
    if (msg.includes('User rejected') || msg.includes('User denied')) return 'Transaction rejected in wallet.';
    if (msg.includes('execution reverted'))   return 'Swap reverted — try increasing slippage.';
    if (msg.includes('deadline'))             return 'Transaction expired. Please try again.';
    return msg.length > 80 ? msg.slice(0, 80) + '…' : msg;
  };

  const isProcessing = step === SwapStep.APPROVING || step === SwapStep.SWAPPING || step === SwapStep.CONFIRMING;

  const buttonLabel = () => {
    if (step === SwapStep.APPROVING)  return 'Approving…';
    if (step === SwapStep.SWAPPING)   return 'Confirm in wallet…';
    if (step === SwapStep.CONFIRMING) return 'Confirming…';
    return 'Swap';
  };

  if (!isConnected) {
    return (
      <button disabled className="w-full py-4 bg-gray-100 text-gray-400 rounded-xl font-semibold text-base cursor-not-allowed">
        Connect Wallet
      </button>
    );
  }

  if (disabled) {
    return (
      <button disabled className="w-full py-4 bg-gray-100 text-gray-400 rounded-xl font-semibold text-base cursor-not-allowed">
        {!amountIn || parseFloat(amountIn) <= 0 ? 'Enter an amount' : 'Finding best route…'}
      </button>
    );
  }

  return (
    <>
      {/* Main swap button — always orange */}
      <button
        onClick={handleSwap}
        disabled={isProcessing}
        className="w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-200"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            {buttonLabel()}
          </span>
        ) : 'Swap'}
      </button>

      {/* ── Fixed toasts — bottom right ─────────────────────────────── */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col gap-3 sm:w-80 pointer-events-none">

        {/* Processing toast */}
        {isProcessing && (
          <div className="pointer-events-auto flex items-start gap-3 bg-white border border-orange-200 shadow-xl rounded-2xl p-4">
            <span className="mt-0.5 h-4 w-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {step === SwapStep.APPROVING  && 'Waiting for token approval…'}
                {step === SwapStep.SWAPPING   && 'Confirm the swap in your wallet…'}
                {step === SwapStep.CONFIRMING && 'Confirming on-chain…'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Please wait</p>
            </div>
          </div>
        )}

        {/* Success toast */}
        {step === SwapStep.SUCCESS && txHash && (
          <div className="pointer-events-auto flex items-start gap-3 bg-white border border-green-200 shadow-xl rounded-2xl p-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">Swap successful!</p>
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-500 hover:text-orange-600 underline font-medium mt-0.5 block"
              >
                View on BaseScan ↗
              </a>
            </div>
            <button
              onClick={() => { setStep(SwapStep.IDLE); setTxHash(null); }}
              className="text-gray-300 hover:text-gray-500 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Error toast */}
        {step === SwapStep.ERROR && error && (
          <div className="pointer-events-auto flex items-start gap-3 bg-white border border-red-200 shadow-xl rounded-2xl p-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">Swap failed</p>
              <p className="text-xs text-gray-500 mt-0.5 break-words">{error}</p>
              <button
                onClick={() => { setError(null); setStep(SwapStep.IDLE); }}
                className="text-xs text-orange-500 hover:text-orange-600 underline font-medium mt-1"
              >
                Try again
              </button>
            </div>
            <button
              onClick={() => { setError(null); setStep(SwapStep.IDLE); }}
              className="text-gray-300 hover:text-gray-500 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

      </div>
    </>
  );
}
