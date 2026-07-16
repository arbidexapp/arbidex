import { supabase } from './supabase';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Profile {
  wallet:   string;
  username: string;
  avatar:   string;
}

export interface TxRow {
  id?:        string;
  hash:       string;
  wallet:     string;
  type:       'swap' | 'send';
  token_in:   string;
  token_out:  string;
  amount_in:  string;
  timestamp:  number;
}

export interface LeaderboardRow {
  wallet:      string;
  points:      number;
  volume_usd:  number;
  trade_count: number;
}

// ── Profile ───────────────────────────────────────────────────────────────────
export async function getProfile(wallet: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('wallet, username, avatar')
    .eq('wallet', wallet.toLowerCase())
    .single();
  return data ?? null;
}

export async function upsertProfile(profile: Profile): Promise<void> {
  await supabase.from('profiles').upsert({
    wallet:     profile.wallet.toLowerCase(),
    username:   profile.username,
    avatar:     profile.avatar,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'wallet' });
}

// ── Transactions ──────────────────────────────────────────────────────────────
export async function saveTxToSupabase(tx: TxRow): Promise<void> {
  await supabase.from('transactions').upsert({
    hash:      tx.hash,
    wallet:    tx.wallet.toLowerCase(),
    type:      tx.type,
    token_in:  tx.token_in,
    token_out: tx.token_out,
    amount_in: tx.amount_in,
    timestamp: tx.timestamp,
  }, { onConflict: 'hash' });
}

export async function getTxFromSupabase(wallet: string): Promise<TxRow[]> {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('wallet', wallet.toLowerCase())
    .order('timestamp', { ascending: false })
    .limit(200);
  return (data ?? []) as TxRow[];
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const { data } = await supabase
    .from('leaderboard')
    .select('wallet, points, volume_usd, trade_count')
    .order('points', { ascending: false })
    .limit(100);
  return (data ?? []) as LeaderboardRow[];
}

export async function getMyRank(wallet: string): Promise<LeaderboardRow | null> {
  const { data } = await supabase
    .from('leaderboard')
    .select('wallet, points, volume_usd, trade_count')
    .eq('wallet', wallet.toLowerCase())
    .single();
  return data ?? null;
}

// Swap/send milestone bonus thresholds
const SWAP_MILESTONES: Record<number, number> = { 10: 2500, 25: 7500, 50: 20000 };
const SEND_MILESTONES: Record<number, number> = { 10: 1500, 25: 4000, 50: 10000 };

// Track which milestones have been granted in localStorage
function getMilestonesKey(wallet: string, type: 'swap' | 'send') {
  return `arbidex_milestones_${type}_${wallet.toLowerCase()}`;
}

function getGrantedMilestones(wallet: string, type: 'swap' | 'send'): number[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(getMilestonesKey(wallet, type)) ?? '[]');
  } catch { return []; }
}

function markMilestoneGranted(wallet: string, type: 'swap' | 'send', count: number) {
  if (typeof window === 'undefined') return;
  const granted = getGrantedMilestones(wallet, type);
  if (!granted.includes(count)) {
    localStorage.setItem(getMilestonesKey(wallet, type), JSON.stringify([...granted, count]));
  }
}

// Update leaderboard after swap/send + check milestone bonuses
// Each swap = 200 pts, each send = 100 pts
export async function updateLeaderboard(
  wallet: string,
  type: 'swap' | 'send',
  volumeUsd: number = 0
): Promise<void> {
  const pts       = type === 'swap' ? 200 : 100;
  const w         = wallet.toLowerCase();
  const milestones = type === 'swap' ? SWAP_MILESTONES : SEND_MILESTONES;

  // Fetch existing record
  const { data: existing } = await supabase
    .from('leaderboard')
    .select('points, volume_usd, trade_count')
    .eq('wallet', w)
    .single();

  const newTradeCount = (existing?.trade_count ?? 0) + 1;

  // Milestone bonus hesapla
  const granted = getGrantedMilestones(wallet, type);
  let bonusPts = 0;
  for (const [threshold, bonus] of Object.entries(milestones)) {
    const t = Number(threshold);
    if (newTradeCount >= t && !granted.includes(t)) {
      bonusPts += bonus;
      markMilestoneGranted(wallet, type, t);
    }
  }

  const totalPts = pts + bonusPts;

  if (existing) {
    await supabase.from('leaderboard').update({
      points:      existing.points + totalPts,
      volume_usd:  existing.volume_usd + volumeUsd,
      trade_count: newTradeCount,
      updated_at:  new Date().toISOString(),
    }).eq('wallet', w);
  } else {
    await supabase.from('leaderboard').insert({
      wallet:      w,
      points:      totalPts,
      volume_usd:  volumeUsd,
      trade_count: 1,
    });
  }
}

// Social task: grant points for X follow (one-time)
export async function grantSocialTaskPoints(
  wallet: string,
  task: string,
  points: number
): Promise<boolean> {
  const w   = wallet.toLowerCase();
  const key = `arbidex_social_${task}_${w}`;

  // localStorage ile tekrar verilmesini engelle
  if (typeof window !== 'undefined' && localStorage.getItem(key)) return false;

  const { data: existing } = await supabase
    .from('leaderboard')
    .select('points, volume_usd, trade_count')
    .eq('wallet', w)
    .single();

  if (existing) {
    await supabase.from('leaderboard').update({
      points:     existing.points + points,
      updated_at: new Date().toISOString(),
    }).eq('wallet', w);
  } else {
    await supabase.from('leaderboard').insert({
      wallet:      w,
      points:      points,
      volume_usd:  0,
      trade_count: 0,
    });
  }

  if (typeof window !== 'undefined') localStorage.setItem(key, '1');
  return true;
}
