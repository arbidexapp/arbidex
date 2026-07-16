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

// ── User Tasks (milestone + social — Supabase tabanlı) ────────────────────────
async function isTaskGranted(wallet: string, taskKey: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_tasks')
    .select('id')
    .eq('wallet', wallet.toLowerCase())
    .eq('task_key', taskKey)
    .single();
  return !!data;
}

async function markTaskGranted(wallet: string, taskKey: string): Promise<void> {
  await supabase.from('user_tasks').upsert(
    { wallet: wallet.toLowerCase(), task_key: taskKey },
    { onConflict: 'wallet,task_key' }
  );
}

export async function getGrantedTaskKeys(wallet: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_tasks')
    .select('task_key')
    .eq('wallet', wallet.toLowerCase());
  return (data ?? []).map((r: { task_key: string }) => r.task_key);
}

// ── Leaderboard update + milestone bonuses ────────────────────────────────────
const SWAP_MILESTONES: Record<number, number> = { 10: 2500, 25: 7500, 50: 20000 };
const SEND_MILESTONES: Record<number, number> = { 10: 1500, 25: 4000, 50: 10000 };

export async function updateLeaderboard(
  wallet: string,
  type: 'swap' | 'send',
  volumeUsd: number = 0
): Promise<void> {
  const pts      = type === 'swap' ? 200 : 100;
  const w        = wallet.toLowerCase();
  const milestones = type === 'swap' ? SWAP_MILESTONES : SEND_MILESTONES;

  const { data: existing } = await supabase
    .from('leaderboard')
    .select('points, volume_usd, trade_count')
    .eq('wallet', w)
    .single();

  const newTradeCount = (existing?.trade_count ?? 0) + 1;

  // Milestone bonus — Supabase üzerinden kontrol
  let bonusPts = 0;
  for (const [threshold, bonus] of Object.entries(milestones)) {
    const t = Number(threshold);
    if (newTradeCount >= t) {
      const taskKey = `milestone_${type}_${t}`;
      const alreadyGranted = await isTaskGranted(w, taskKey);
      if (!alreadyGranted) {
        bonusPts += bonus;
        await markTaskGranted(w, taskKey);
      }
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

// ── Social tasks ──────────────────────────────────────────────────────────────
export async function grantSocialTaskPoints(
  wallet: string,
  task: string,
  points: number
): Promise<boolean> {
  const w       = wallet.toLowerCase();
  const taskKey = `social_${task}`;

  const alreadyGranted = await isTaskGranted(w, taskKey);
  if (alreadyGranted) return false;

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
      wallet: w, points, volume_usd: 0, trade_count: 0,
    });
  }

  await markTaskGranted(w, taskKey);
  return true;
}
