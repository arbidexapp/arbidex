'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { grantSocialTaskPoints, getMyRank, getTxFromSupabase } from '@/lib/supabase-db';

const CAT = {
  bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', tag: 'bg-orange-100 text-orange-700'
};

const SWAP_MILESTONES = [
  { count: 10, bonus: 2500 },
  { count: 25, bonus: 7500 },
  { count: 50, bonus: 20000 },
];
const SEND_MILESTONES = [
  { count: 10, bonus: 1500 },
  { count: 25, bonus: 4000 },
  { count: 50, bonus: 10000 },
];

function getMilestoneGranted(wallet: string, type: 'swap' | 'send'): number[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(`arbidex_milestones_${type}_${wallet.toLowerCase()}`) ?? '[]');
  } catch { return []; }
}

function isSocialDone(wallet: string, task: string): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(`arbidex_social_${task}_${wallet.toLowerCase()}`);
}

// ── Swap Card ─────────────────────────────────────────────────────────────────
function SwapTaskCard({ tradeCount, wallet }: { tradeCount: number; wallet: string }) {
  const s = CAT;
  const granted = getMilestoneGranted(wallet, 'swap');

  return (
    <div className={`bg-white rounded-2xl border ${s.border} shadow-sm overflow-hidden`}>
      <div className={`${s.bg} px-4 py-3 flex items-center gap-2`}>
        <span className="text-xl">🔄</span>
        <h3 className="font-bold text-gray-900 text-sm">Swap Transactions</h3>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">Per swap</p>
          <span className={`font-bold text-xs ${s.text}`}>+200 pts</span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {SWAP_MILESTONES.map((m) => {
          const done = granted.includes(m.count);
          const progress = Math.min(tradeCount, m.count);
          return (
            <div key={m.count} className={`rounded-xl p-2 border transition-all ${done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-700 font-medium">
                  {done ? '✅' : '🔒'} {m.count} Swaps
                </span>
                {!done && (
                  <span className="text-xs text-gray-400 font-medium">{progress} / {m.count}</span>
                )}
              </div>
              {!done && (
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-amber-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${(progress / m.count) * 100}%` }}
                  />
                </div>
              )}
              <div className="flex items-center justify-end mt-1">
                <span className={`font-bold text-xs ${done ? 'text-green-600' : s.text}`}>
                  {done ? 'Completed ✓' : `+${m.bonus.toLocaleString()} pts`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Send Card ─────────────────────────────────────────────────────────────────
function SendTaskCard({ sendCount, wallet }: { sendCount: number; wallet: string }) {
  const s = CAT;
  const granted = getMilestoneGranted(wallet, 'send');

  return (
    <div className={`bg-white rounded-2xl border ${s.border} shadow-sm overflow-hidden`}>
      <div className={`${s.bg} px-4 py-3 flex items-center gap-2`}>
        <span className="text-xl">📤</span>
        <h3 className="font-bold text-gray-900 text-sm">Token Transfer</h3>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">Per send</p>
          <span className={`font-bold text-xs ${s.text}`}>+100 pts</span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {SEND_MILESTONES.map((m) => {
          const done = granted.includes(m.count);
          const progress = Math.min(sendCount, m.count);
          return (
            <div key={m.count} className={`rounded-xl p-2 border transition-all ${done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-700 font-medium">
                  {done ? '✅' : '🔒'} {m.count} Sends
                </span>
                {!done && (
                  <span className="text-xs text-gray-400 font-medium">{progress} / {m.count}</span>
                )}
              </div>
              {!done && (
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-amber-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${(progress / m.count) * 100}%` }}
                  />
                </div>
              )}
              <div className="flex items-center justify-end mt-1">
                <span className={`font-bold text-xs ${done ? 'text-green-600' : s.text}`}>
                  {done ? 'Completed ✓' : `+${m.bonus.toLocaleString()} pts`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Social Card ───────────────────────────────────────────────────────────────
function SocialTaskCard({ wallet }: { wallet: string }) {
  const s = CAT;
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDone(isSocialDone(wallet, 'x_follow'));
  }, [wallet]);

  const handleFollow = async () => {
    if (done || loading) return;
    window.open('https://x.com/aggrex', '_blank');
    setLoading(true);
    try {
      await grantSocialTaskPoints(wallet, 'x_follow', 2500);
      setDone(true);
    } catch (err) {
      console.error('Social task error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border ${s.border} shadow-sm overflow-hidden`}>
      <div className={`${s.bg} px-4 py-3 flex items-center gap-2`}>
        <span className="text-xl font-bold">𝕏</span>
        <h3 className="font-bold text-gray-900 text-sm">Social Tasks</h3>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <div className={`rounded-xl p-2 border transition-all ${done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-700 font-medium">
              {done ? '✅' : '🔒'} Follow on X
            </span>
            <span className={`font-bold text-xs ${done ? 'text-green-600' : s.text}`}>+2,500 pts</span>
          </div>
          {!done && (
            <button
              onClick={handleFollow}
              disabled={loading}
              className="mt-2 w-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-2.5 py-1.5 rounded-xl transition-all disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Follow on X → +2,500 pts'}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Coming Soon</p>
        {['Discord Membership', 'Telegram Channel', 'Refer a Friend'].map((item) => (
          <div key={item} className="flex items-center justify-between py-1.5 opacity-40">
            <span className="text-xs text-gray-500">{item}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Banner ────────────────────────────────────────────────────────────────────
function Banner({ points }: { points: number }) {
  return (
    <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-2xl shadow-xl px-6 py-4 text-white flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold">Tasks & Rewards</h1>
        <p className="text-orange-100 text-xs mt-0.5">Trade, earn points, climb the leaderboard</p>
      </div>
      <div className="text-right">
        <p className="text-3xl font-bold">{points.toLocaleString()}</p>
        <p className="text-orange-100 text-xs">total points</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function TasksRewards() {
  const { address, isConnected } = useAccount();
  const [points, setPoints]         = useState(0);
  const [tradeCount, setTradeCount] = useState(0);
  const [sendCount, setSendCount]   = useState(0);

  useEffect(() => {
    if (!address) return;

    const load = async () => {
      try {
        const rank = await getMyRank(address);
        if (rank) setPoints(rank.points);
        const txs = await getTxFromSupabase(address);
        setSendCount(txs.filter(t => t.type === 'send').length);
        setTradeCount(txs.filter(t => t.type === 'swap').length);
      } catch (err) {
        console.error('TasksRewards load error:', err);
      }
    };

    load();

    // Refresh after swap/send
    window.addEventListener('arbidex_tx_update', load);
    return () => window.removeEventListener('arbidex_tx_update', load);
  }, [address]);

  if (!isConnected || !address) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 border border-orange-100 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏆</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-500 text-sm">Connect your wallet to view tasks and earn points.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Banner points={points} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SwapTaskCard tradeCount={tradeCount} wallet={address} />
        <SendTaskCard sendCount={sendCount} wallet={address} />
        <SocialTaskCard wallet={address} />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <span className="text-lg shrink-0 mt-0.5">💡</span>
        <div>
          <h3 className="font-bold text-amber-900 mb-1 text-sm">How It Works</h3>
          <ul className="text-xs text-amber-800 space-y-1">
            <li>• Every swap earns <strong>200 points</strong> — no limit, keep earning</li>
            <li>• Every send earns <strong>100 points</strong> — no limit, keep earning</li>
            <li>• Reaching 10 / 25 / 50 transaction milestones adds a <strong>one-time bonus</strong> automatically</li>
            <li>• Following on X earns <strong>2,500 points</strong> one time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
