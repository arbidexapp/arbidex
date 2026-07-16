'use client';

import { useState } from 'react';
import { TOKENS, NATIVE_ETH } from '@/lib/contracts';

interface TokenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tokenAddress: string) => void;
}

const trustWalletBase = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets';

const commonTokens = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: NATIVE_ETH,
    isNative: true,
    logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: TOKENS.WETH,
    isNative: false,
    logo: `${trustWalletBase}/0x4200000000000000000000000000000000000006/logo.png`,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: TOKENS.USDC,
    isNative: false,
    logo: `${trustWalletBase}/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/logo.png`,
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: TOKENS.DAI,
    isNative: false,
    logo: `${trustWalletBase}/0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb/logo.png`,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: TOKENS.USDT,
    isNative: false,
    logo: `${trustWalletBase}/0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2/logo.png`,
  },
];

const fallbackColors: Record<string, string> = {
  ETH:  'from-blue-500 to-indigo-600',
  WETH: 'from-blue-400 to-indigo-500',
  USDC: 'from-blue-500 to-blue-700',
  USDT: 'from-green-500 to-teal-600',
  DAI:  'from-yellow-400 to-orange-500',
};

function TokenLogo({ logo, symbol }: { logo: string; symbol: string }) {
  const [error, setError] = useState(false);
  const gradient = fallbackColors[symbol] ?? 'from-orange-400 to-amber-500';

  if (!logo || error) {
    return (
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
        {symbol[0]}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={symbol}
      width={40}
      height={40}
      className="w-10 h-10 rounded-full object-cover shrink-0"
      onError={() => setError(true)}
    />
  );
}

export function TokenSelectModal({ isOpen, onClose, onSelect }: TokenSelectModalProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = commonTokens.filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[560px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Select a token</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or paste address"
              className="w-full pl-9 pr-4 py-2.5 bg-orange-50 rounded-xl border border-orange-100 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-sm text-gray-800 placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>

        {/* Token List */}
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No tokens found</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    onSelect(token.address);
                    setSearch('');
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-all group"
                >
                  <TokenLogo logo={token.logo} symbol={token.symbol} />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors flex items-center gap-2">
                      <span>{token.symbol}</span>
                      {token.isNative && (
                        <span className="text-xs bg-blue-50 text-blue-500 border border-blue-100 px-1.5 py-0.5 rounded-md font-medium">Native</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{token.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
