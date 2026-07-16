'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
// ── LeaderboardView ──────────────────────────────────────────────────────────
import { getLeaderboard, getMyRank, LeaderboardRow, getProfile } from '@/lib/supabase-db';

const PAGE_SIZE = 5;

export function LeaderboardView() {
  const { address, isConnected } = useAccount();
  const [page, setPage]           = useState(1);
  const [data, setData]           = useState<LeaderboardRow[]>([]);
  const [myRow, setMyRow]         = useState<LeaderboardRow | null>(null);
  const [myRank, setMyRank]       = useState<number | null>(null);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard()
      .then(async (rows) => {
        setData(rows);
        const names: Record<string, string> = {};
        await Promise.all(
          rows.map(async (r) => {
            const p = await getProfile(r.wallet);
            names[r.wallet] = p?.username ?? `${r.wallet.slice(0, 6)}...${r.wallet.slice(-4)}`;
          })
        );
        setUsernames(names);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isConnected || !address) return;
    getMyRank(address)
      .then((row) => {
        setMyRow(row);
        if (row) {
          // Rank'ı zaten yüklü data üzerinden hesapla — setData callback içinde setMyRank çağırmak yerine
          setData((prev) => {
            const idx = prev.findIndex((r) => r.wallet.toLowerCase() === address.toLowerCase());
            // Side-effect'siz: hesaplanan rank'ı bir sonraki render'da set et
            setTimeout(() => setMyRank(idx >= 0 ? idx + 1 : null), 0);
            return prev;
          });
        }
      })
      .catch(console.error);
  }, [isConnected, address]);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pageData   = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-gray-200 to-gray-300';
  };

  const formatPts = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  const formatVol = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000    ? `$${(n / 1000).toFixed(0)}K`
    : `$${n.toFixed(0)}`;

  return (
    <div className="space-y-4">

      {/* YOUR WALLET RANK */}
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
        {isConnected ? (
          <table className="w-full">
            <tbody>
              <tr>
                <td className="px-6 py-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Your Wallet Rank</p>
                  <p className="text-2xl font-extrabold text-gray-900">
                    {myRank ? `#${myRank}` : '—'}
                  </p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Points</p>
                  <p className="text-lg font-bold text-orange-500">{myRow ? formatPts(myRow.points) : '—'}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Volume</p>
                  <p className="text-lg font-bold text-gray-900">{myRow ? formatVol(myRow.volume_usd) : '—'}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Trades</p>
                  <p className="text-lg font-bold text-gray-900">{myRow ? myRow.trade_count : '—'}</p>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Your Wallet Rank</p>
            <p className="text-sm text-gray-400">Connect your wallet to see your rank</p>
          </div>
        )}
      </div>

      {/* TOP TRADERS */}
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Top Traders</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No traders yet. Make the first swap!</p>
            <a href="/" className="mt-3 inline-block text-sm font-medium text-orange-600 hover:underline">
              Start Swapping →
            </a>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank / Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trades</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {pageData.map((entry, idx) => {
                    const rank    = (page - 1) * PAGE_SIZE + idx + 1;
                    const isMe    = isConnected && address?.toLowerCase() === entry.wallet.toLowerCase();
                    const display = usernames[entry.wallet] ?? `${entry.wallet.slice(0, 6)}...${entry.wallet.slice(-4)}`;

                    return (
                      <tr key={entry.wallet} className={`hover:bg-gray-50 transition-colors ${isMe ? 'bg-orange-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {rank <= 3 ? (
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                {rank}
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                                {rank}
                              </div>
                            )}
                            <span className="font-mono font-medium text-gray-800">{display}</span>
                            {isMe && (
                              <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-lg">YOU</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-orange-600">{formatPts(entry.points)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-800">{formatVol(entry.volume_usd)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{entry.trade_count}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-orange-100 bg-orange-50/40">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${p === page ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:bg-orange-100 hover:text-orange-600'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
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
