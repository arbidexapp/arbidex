'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { getTxHistory, TxRecord } from '@/lib/tx-history';

const TW = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets';

const TOKEN_LOGOS: Record<string, string> = {
  ETH:  'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  WETH: `${TW}/0x4200000000000000000000000000000000000006/logo.png`,
  USDC: `${TW}/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/logo.png`,
  DAI:  `${TW}/0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb/logo.png`,
  USDT: `${TW}/0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2/logo.png`,
};

function timeAgo(ts: number): { relative: string; date: string } {
  const diff = Math.floor((Date.now() - ts) / 1000);
  const days  = Math.floor(diff / 86400);
  const hours = Math.floor(diff / 3600);
  const mins  = Math.floor(diff / 60);

  const relative = days > 0 ? `${days}d ago` : hours > 0 ? `${hours}h ago` : mins > 0 ? `${mins}m ago` : 'Just now';
  const d = new Date(ts);
  const date = `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })} ${String(d.getFullYear()).slice(2)}`;
  return { relative, date };
}

function TokenLogo({ symbol }: { symbol: string }) {
  const [err, setErr] = useState(false);
  const logo = TOKEN_LOGOS[symbol];
  if (!logo || err) {
    return (
      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
        {symbol.slice(0, 2)}
      </div>
    );
  }
  return (
    <img src={logo} alt={symbol} width={28} height={28}
      className="w-7 h-7 rounded-full object-cover bg-white"
      onError={() => setErr(true)}
    />
  );
}

function TxRow({ tx }: { tx: TxRecord }) {
  const { relative, date } = timeAgo(tx.timestamp);

  return (
    <tr className="border-b border-orange-50 last:border-0 hover:bg-orange-50/40 transition-colors">
      {/* TRANSACTION */}
      <td className="py-4 px-6">
        <div className="inline-flex items-center gap-2 bg-white border border-orange-100 rounded-xl px-3 py-2 shadow-sm">
          {tx.type === 'swap' ? (
            <>
              <TokenLogo symbol={tx.tokenIn} />
              <span className="text-gray-800 text-sm font-bold">{tx.tokenIn}</span>
              <span className="text-gray-400 text-sm mx-1">→</span>
              <TokenLogo symbol={tx.tokenOut} />
              <span className="text-gray-800 text-sm font-bold">{tx.tokenOut}</span>
            </>
          ) : (
            <>
              <TokenLogo symbol={tx.tokenIn} />
              <span className="text-gray-800 text-sm font-bold">{tx.tokenIn}</span>
              <span className="text-gray-500 text-xs ml-1">Send {tx.amountIn}</span>
            </>
          )}
        </div>
      </td>

      {/* TIME */}
      <td className="py-4 px-6 text-center">
        <div className="font-semibold text-gray-800 text-sm">{relative}</div>
        <div className="text-xs text-gray-400">{date}</div>
      </td>

      {/* STATUS */}
      <td className="py-4 px-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            ✓ Completed
          </span>
          <a
            href={`https://basescan.org/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 hover:text-orange-600 transition-colors"
            title="View on BaseScan"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </td>
    </tr>
  );
}

const PAGE_SIZE = 5;

export function TransactionHistory() {
  const { address, isConnected } = useAccount();
  const [txs, setTxs]   = useState<TxRecord[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isConnected || !address) return;

    const load = () => setTxs(getTxHistory(address));
    load();

    // storage event: update if record comes from another tab
    window.addEventListener('storage', load);
    // triggered after swap/send on the same tab
    window.addEventListener('arbidex_tx_update', load);
    // refresh when page regains focus
    window.addEventListener('focus', load);

    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener('arbidex_tx_update', load);
      window.removeEventListener('focus', load);
    };
  }, [isConnected, address]);

  const totalPages = Math.max(1, Math.ceil(txs.length / PAGE_SIZE));
  const pageTxs    = txs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-10 border border-orange-100 text-center max-w-3xl mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Connect Your Wallet</h2>
        <p className="text-gray-400 text-sm">Connect your wallet to view transaction history</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">

        {txs.length === 0 ? (
          <div className="py-16 text-center px-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-800 mb-2">No transactions yet</h3>
            <p className="text-gray-400 text-sm mb-6">Your swap and send history will appear here</p>
            <a href="/" className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-medium text-sm transition-all">
              Start Swapping
            </a>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/60">
                  <th className="py-3 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction</th>
                  <th className="py-3 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="py-3 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {pageTxs.map((tx) => (
                  <TxRow key={tx.hash} tx={tx} />
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-orange-100 bg-orange-50/40">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                      p === page ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:bg-orange-100 hover:text-orange-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
