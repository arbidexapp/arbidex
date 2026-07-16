'use client';

import { useAccount, useBalance, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { TOKENS } from '@/lib/contracts';
import { useState, useEffect } from 'react';

const TW = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets';

const STABLE_PRICES: Record<string, number> = {
  USDC: 1,
  DAI:  1,
  USDT: 1,
};

const TOKEN_META = [
  { symbol: 'ETH',  name: 'Ethereum',       decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  { symbol: 'WETH', name: 'Wrapped Ether',  decimals: 18, logoUrl: `${TW}/0x4200000000000000000000000000000000000006/logo.png` },
  { symbol: 'USDC', name: 'USD Coin',       decimals: 6,  logoUrl: `${TW}/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/logo.png` },
  { symbol: 'DAI',  name: 'Dai Stablecoin', decimals: 18, logoUrl: `${TW}/0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb/logo.png` },
  { symbol: 'USDT', name: 'Tether USD',     decimals: 6,  logoUrl: `${TW}/0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2/logo.png` },
];

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

interface TokenRowProps {
  symbol: string;
  name: string;
  logoUrl: string;
  amount: number;       // token amount
  usdValue: number;     // USD equivalent
  price: number;        // token unit price
  pct: number;          // percentage of portfolio
}

function TokenRow({ symbol, name, logoUrl, amount, usdValue, price, pct }: TokenRowProps) {
  // Don't render tokens with $0.00 value (very small amounts)
  if (usdValue < 0.005) return null;

  const priceLabel = price >= 1000 ? `$${(price / 1000).toFixed(2)}K` : `$${price.toFixed(2)}`;

  return (
    <div className="py-4 border-b border-orange-50 last:border-0">
      <div className="flex items-center justify-between mb-2">
        {/* Left: logo + name */}
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 flex-shrink-0">
            <img
              src={logoUrl}
              alt={symbol}
              width={44}
              height={44}
              className="w-11 h-11 rounded-full object-cover bg-white shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fb) fb.style.display = 'flex';
              }}
            />
            <div className="w-11 h-11 rounded-full bg-gray-200 items-center justify-center text-gray-600 font-bold text-xs absolute inset-0 hidden">
              {symbol.slice(0, 2)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-900 text-sm">{symbol}</span>
              <span className="text-gray-400 text-xs">{name}</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {amount.toLocaleString('en-US', { maximumFractionDigits: 6 })} {symbol}
            </div>
          </div>
        </div>

        {/* Right: value + price + percentage */}
        <div className="text-right">
          <div className="font-bold text-gray-900 text-sm">
            ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-400">{priceLabel}</div>
          <div className="text-xs text-gray-400">{pct.toFixed(1)}%</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-orange-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-500 bg-gradient-to-r from-orange-500 to-amber-500"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function PortfolioView() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-10 border border-orange-100 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Connect Your Wallet</h2>
        <p className="text-gray-400 text-sm">Connect your wallet to view your portfolio</p>
      </div>
    );
  }

  return <PortfolioContent address={address!} />;
}

function PortfolioContent({ address }: { address: string }) {
  const storageKey    = `arbidex_username_${address.toLowerCase()}`;
  const avatarKey     = `arbidex_avatar_${address.toLowerCase()}`;

  const AVATARS = ['🦊','🐺','🦁','🐯','🐻','🦝','🐼','🦄','🐉','🤖'];

  const [username, setUsername] = useState('Aggrex User');
  const [avatar,   setAvatar]   = useState('🦊');
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editAvatar, setEditAvatar] = useState('🦊');
  const [ethPrice, setEthPrice] = useState(0);

  useEffect(() => {
    const savedName   = localStorage.getItem(storageKey);
    const savedAvatar = localStorage.getItem(avatarKey);
    if (savedName)   setUsername(savedName);
    if (savedAvatar) setAvatar(savedAvatar);
  }, [storageKey, avatarKey]);

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      .then((r) => r.json())
      .then((d) => { if (d?.ethereum?.usd) setEthPrice(d.ethereum.usd); })
      .catch(() => {});
  }, []);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setUsername(trimmed);
    setAvatar(editAvatar);
    localStorage.setItem(storageKey, trimmed);
    localStorage.setItem(avatarKey, editAvatar);
    setEditOpen(false);
  };
  // ETH native balance
  const { data: ethBal } = useBalance({ address: address as `0x${string}` });

  // Read ERC-20 balanceOf directly — bypasses useBalance cache/decimals issues
  const { data: erc20Results } = useReadContracts({
    contracts: [
      { address: TOKENS.WETH as `0x${string}`, abi: ERC20_BALANCE_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
      { address: TOKENS.USDC as `0x${string}`, abi: ERC20_BALANCE_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
      { address: TOKENS.DAI  as `0x${string}`, abi: ERC20_BALANCE_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
      { address: TOKENS.USDT as `0x${string}`, abi: ERC20_BALANCE_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
    ],
  });

  const rawValues: Record<string, bigint> = {
    ETH:  ethBal?.value ?? 0n,
    WETH: (erc20Results?.[0]?.result as bigint | undefined) ?? 0n,
    USDC: (erc20Results?.[1]?.result as bigint | undefined) ?? 0n,
    DAI:  (erc20Results?.[2]?.result as bigint | undefined) ?? 0n,
    USDT: (erc20Results?.[3]?.result as bigint | undefined) ?? 0n,
  };

  const tokenData = TOKEN_META.map((meta) => {
    const raw = rawValues[meta.symbol] ?? 0n;
    const amount = raw > 0n ? parseFloat(formatUnits(raw, meta.decimals)) : 0;
    const price    = STABLE_PRICES[meta.symbol] ?? ethPrice;
    const usdValue = amount * price;
    return { ...meta, amount, usdValue, price };
  });

  // Total USD
  const totalUsd = tokenData.reduce((acc, t) => acc + t.usdValue, 0);

  // Visible tokens: balance > 0 and USD value >= $0.005
  const visibleTokens = tokenData.filter((t) => t.amount > 0 && t.usdValue >= 0.005);

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* ── Profile Card ── */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-xl px-4 sm:px-6 py-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
            {avatar}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm sm:text-base truncate">{username}</p>
            <p className="text-orange-100 text-xs font-mono mt-0.5 truncate">
              {address.slice(0, 8)}...{address.slice(-6)}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditValue(username); setEditAvatar(avatar); setEditOpen(true); }}
          className="flex items-center gap-1 sm:gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl transition-all shrink-0"
        >
          ✏️ <span className="hidden sm:inline">Edit Profile</span><span className="sm:hidden">Edit</span>
        </button>
      </div>

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Profile</h3>

            {/* Avatar picker */}
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Avatar</label>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setEditAvatar(a)}
                  className={`text-2xl w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                    editAvatar === a
                      ? 'bg-orange-100 border-2 border-orange-400 scale-110 shadow-sm'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-orange-50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Display Name</label>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              maxLength={32}
              placeholder="Aggrex User"
              className="w-full px-4 py-2.5 border border-orange-200 rounded-xl outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-gray-900 text-sm mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold text-sm transition-all"
              >
                Save
              </button>
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Total Balance Card ── */}
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 px-5 sm:px-8 py-5 sm:py-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Total Balance</p>
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
              ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Prices are estimates</p>
          </div>
        </div>
      </div>

      {/* ── Token List Card ── */}
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
        <div className="px-4 sm:px-8">
          {visibleTokens.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm">No tokens found in your wallet.</p>
              <a href="/" className="mt-3 inline-block text-sm font-medium text-orange-600 hover:underline">
                Start Swapping →
              </a>
            </div>
          ) : (
            visibleTokens.map((token) => (
              <TokenRow
                key={token.symbol}
                symbol={token.symbol}
                name={token.name}
                logoUrl={token.logoUrl}
                amount={token.amount}
                usdValue={token.usdValue}
                price={token.price}
                pct={totalUsd > 0 ? (token.usdValue / totalUsd) * 100 : 0}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-8 py-4 bg-orange-50 border-t border-orange-100">
          <button
            onClick={() => window.open(`https://basescan.org/address/${address}`, '_blank')}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <span>View on BaseScan</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}
