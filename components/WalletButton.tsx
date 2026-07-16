'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useRef, useEffect } from 'react';

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        if (!ready) return <div className="w-32 h-9 bg-orange-100 rounded-xl animate-pulse" />;

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-orange-200 transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Connect Wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              onClick={openChainModal}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            >
              ⚠️ Wrong Network
            </button>
          );
        }

        return <ConnectedMenu account={account} chain={chain} />;
      }}
    </ConnectButton.Custom>
  );
}

// ── Bağlı cüzdan menüsü ───────────────────────────────────────────────────────
function ConnectedMenu({
  account,
  chain,
}: {
  account: { address: string; displayName: string; displayBalance?: string };
  chain: { name?: string; iconUrl?: string };
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white border border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-gray-800 text-sm font-semibold px-3 py-2 rounded-xl shadow-sm transition-all"
      >
        {/* Chain icon */}
        {chain.iconUrl && (
          <img src={chain.iconUrl} alt={chain.name ?? ''} className="w-4 h-4 rounded-full" />
        )}
        {/* Address */}
        <span className="font-mono text-sm">{account.displayName}</span>
        {/* Balance */}
        {account.displayBalance && (
          <span className="text-orange-500 font-semibold text-xs bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-lg">
            {account.displayBalance}
          </span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-orange-100 rounded-2xl shadow-xl z-50 overflow-hidden">
        <div className="p-2 space-y-1">
            <button
              onClick={copyAddress}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all font-medium"
            >
              {copied ? (
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            <a
              href={`https://basescan.org/address/${account.address}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all font-medium"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on BaseScan
            </a>

            <div className="border-t border-orange-100 my-1" />

            <DisconnectButton onDisconnect={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Disconnect ayrı component çünkü useDisconnect hook lazım
import { useDisconnect } from 'wagmi';

function DisconnectButton({ onDisconnect }: { onDisconnect: () => void }) {
  const { disconnect } = useDisconnect();
  return (
    <button
      onClick={() => { disconnect(); onDisconnect(); }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all font-medium"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Disconnect
    </button>
  );
}
