'use client';

import { useState, useEffect } from 'react';
import { useBalance, usePublicClient } from 'wagmi';
import { TokenSelectModal } from './TokenSelectModal';
import { formatUnits } from 'viem';
import { NATIVE_ETH } from '@/lib/contracts';
import ERC20ABI from '@/lib/abis/ERC20.json';

interface TokenInputProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  selectedToken: string;
  onTokenSelect: (token: string) => void;
  userAddress?: `0x${string}`;
  readOnly?: boolean;
  tokenDecimals?: number;
  tokenSymbol?: string;
  showPercentageButtons?: boolean;
  isLoading?: boolean;
  refreshKey?: number;
}

// ── Token logos ───────────────────────────────────────────────────────────────

const trustBase =
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets';

const TOKEN_LOGOS: Record<string, string> = {
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee':
    'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  '0x4200000000000000000000000000000000000006':
    `${trustBase}/0x4200000000000000000000000000000000000006/logo.png`,
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913':
    `${trustBase}/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/logo.png`,
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb':
    `${trustBase}/0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb/logo.png`,
  '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2':
    `${trustBase}/0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2/logo.png`,
};

const FALLBACK_COLORS: Record<string, string> = {
  ETH:  'from-blue-500 to-indigo-600',
  WETH: 'from-blue-400 to-indigo-500',
  USDC: 'from-blue-500 to-blue-700',
  USDT: 'from-green-500 to-teal-600',
  DAI:  'from-yellow-400 to-orange-500',
};

function TokenIcon({ address, symbol }: { address: string; symbol: string }) {
  const [err, setErr] = useState(false);
  const logo = TOKEN_LOGOS[address?.toLowerCase() ?? ''];
  const gradient = FALLBACK_COLORS[symbol] ?? 'from-orange-400 to-amber-500';

  if (!logo || err) {
    return (
      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
        {symbol?.[0] ?? '?'}
      </div>
    );
  }
  return (
    <img
      src={logo}
      alt={symbol}
      width={28}
      height={28}
      className="w-7 h-7 rounded-full shrink-0 object-cover"
      onError={() => setErr(true)}
    />
  );
}

// ── Separate components for ETH vs ERC-20 so hooks are always called ─────────

/** ETH balance wrapper — calls useBalance without token param */
function EthTokenInput(props: InnerProps) {
  const { data: balance } = useBalance({ address: props.userAddress });

  const formatted = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(6)
    : null;

  const handlePct = (pct: number) => {
    if (!balance) return;
    const raw = parseFloat(formatUnits(balance.value, balance.decimals));
    const amt = (raw * pct) / 100;
    props.onValueChange(amt.toFixed(props.tokenDecimals > 6 ? 6 : props.tokenDecimals));
  };

  return <InputUI {...props} formattedBalance={formatted} onPct={handlePct} />;
}

/** ERC-20 balance wrapper — reads balanceOf via publicClient */
function Erc20TokenInput(props: InnerProps) {
  const publicClient = usePublicClient();
  const [rawBalance, setRawBalance] = useState<bigint | null>(null);

  useEffect(() => {
    if (!publicClient || !props.userAddress || !props.selectedToken) return;
    let cancelled = false;

    publicClient
      .readContract({
        address: props.selectedToken as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [props.userAddress],
      })
      .then((res) => {
        if (!cancelled) setRawBalance(res as bigint);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  // re-fetch balance when refreshKey changes (after swap)
  }, [publicClient, props.userAddress, props.selectedToken, props.refreshKey]);

  const formatted = rawBalance !== null
    ? parseFloat(formatUnits(rawBalance, props.tokenDecimals)).toFixed(6)
    : null;

  const handlePct = (pct: number) => {
    if (rawBalance === null) return;
    const raw = parseFloat(formatUnits(rawBalance, props.tokenDecimals));
    const amt = (raw * pct) / 100;
    props.onValueChange(amt.toFixed(props.tokenDecimals > 6 ? 6 : props.tokenDecimals));
  };

  return <InputUI {...props} formattedBalance={formatted} onPct={handlePct} />;
}

// ── Shared UI (no hooks) ──────────────────────────────────────────────────────

interface InnerProps {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  selectedToken: string;
  tokenSymbol: string;
  tokenDecimals: number;
  showPercentageButtons: boolean;
  readOnly: boolean;
  isLoading: boolean;
  userAddress: `0x${string}`;
  onOpenModal: () => void;
  refreshKey: number;
}

function InputUI({
  label, value, onValueChange, selectedToken, tokenSymbol,
  showPercentageButtons, readOnly, isLoading, onOpenModal,
  formattedBalance, onPct,
}: InnerProps & { formattedBalance: string | null; onPct: (pct: number) => void }) {
  return (
    <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-4">
      {/* Top: label + balance */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {formattedBalance !== null && (
          <span className="text-xs text-gray-500">
            Balance:{' '}
            <span className="font-semibold text-gray-700">{formattedBalance}</span>
          </span>
        )}
      </div>

      {/* Input + token button */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {isLoading && readOnly ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
              <span className="text-gray-400 text-sm">Calculating...</span>
            </div>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d*\.?\d*$/.test(v)) onValueChange(v);
              }}
              placeholder="0.0"
              disabled={readOnly}
              className="w-full bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none disabled:cursor-not-allowed"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            />
          )}
        </div>

        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 bg-white hover:bg-orange-50 border border-orange-200 px-3 py-2 rounded-xl shadow-sm transition-all shrink-0"
        >
          <TokenIcon address={selectedToken} symbol={tokenSymbol} />
          <span className="font-bold text-gray-900 text-sm">
            {tokenSymbol || (selectedToken ? selectedToken.slice(0, 6) + '...' : 'Select')}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* % buttons */}
      {showPercentageButtons && (
        <div className="flex gap-2 mt-3">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              onClick={() => onPct(pct)}
              disabled={formattedBalance === null}
              className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-white border border-orange-200 text-orange-600 hover:bg-orange-100 hover:border-orange-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pct === 100 ? 'MAX' : `${pct}%`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── No-wallet layout (no balance hooks needed) ────────────────────────────────

function NoWalletInput({
  label, value, onValueChange, selectedToken, tokenSymbol,
  readOnly, isLoading, onOpenModal,
}: Omit<InnerProps, 'userAddress' | 'tokenDecimals' | 'showPercentageButtons' | 'refreshKey'>) {
  return (
    <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {isLoading && readOnly ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
              <span className="text-gray-400 text-sm">Calculating...</span>
            </div>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d*\.?\d*$/.test(v)) onValueChange(v);
              }}
              placeholder="0.0"
              disabled={readOnly}
              className="w-full bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none disabled:cursor-not-allowed"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            />
          )}
        </div>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 bg-white hover:bg-orange-50 border border-orange-200 px-3 py-2 rounded-xl shadow-sm transition-all shrink-0"
        >
          <TokenIcon address={selectedToken} symbol={tokenSymbol} />
          <span className="font-bold text-gray-900 text-sm">
            {tokenSymbol || (selectedToken ? selectedToken.slice(0, 6) + '...' : 'Select')}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function TokenInput({
  label, value, onValueChange, selectedToken, onTokenSelect,
  userAddress, readOnly = false, tokenDecimals = 18, tokenSymbol = '',
  showPercentageButtons = false, isLoading = false, refreshKey = 0,
}: TokenInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isNativeETH = selectedToken?.toLowerCase() === NATIVE_ETH.toLowerCase();

  const modal = (
    <TokenSelectModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSelect={(token) => { onTokenSelect(token); setIsModalOpen(false); }}
    />
  );

  if (!userAddress) {
    return (
      <>
        <NoWalletInput
          label={label} value={value} onValueChange={onValueChange}
          selectedToken={selectedToken} tokenSymbol={tokenSymbol}
          readOnly={readOnly} isLoading={isLoading}
          onOpenModal={() => setIsModalOpen(true)}
        />
        {modal}
      </>
    );
  }

  const innerProps: InnerProps = {
    label, value, onValueChange, selectedToken, tokenSymbol,
    tokenDecimals, showPercentageButtons, readOnly, isLoading,
    userAddress, onOpenModal: () => setIsModalOpen(true),
    refreshKey,
  };

  return (
    <>
      {isNativeETH
        ? <EthTokenInput {...innerProps} />
        : <Erc20TokenInput {...innerProps} />
      }
      {modal}
    </>
  );
}
