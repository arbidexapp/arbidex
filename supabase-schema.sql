-- ── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  wallet     text primary key,
  username   text not null default 'Aggrex User',
  avatar     text not null default '🦊',
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (true);
create policy "profiles_update" on profiles for update using (true);

-- ── Transaction History ───────────────────────────────────────────────────────
create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  hash        text not null unique,
  wallet      text not null,
  type        text not null check (type in ('swap','send')),
  token_in    text not null,
  token_out   text not null default '',
  amount_in   text not null,
  timestamp   bigint not null,
  created_at  timestamptz default now()
);

alter table transactions enable row level security;
create policy "transactions_select" on transactions for select using (true);
create policy "transactions_insert" on transactions for insert with check (true);

create index if not exists transactions_wallet_idx on transactions(wallet);
create index if not exists transactions_timestamp_idx on transactions(timestamp desc);

-- ── Leaderboard (puan tablosu) ────────────────────────────────────────────────
create table if not exists leaderboard (
  wallet      text primary key,
  points      bigint not null default 0,
  volume_usd  numeric not null default 0,
  trade_count integer not null default 0,
  updated_at  timestamptz default now()
);

alter table leaderboard enable row level security;
create policy "leaderboard_select" on leaderboard for select using (true);
create policy "leaderboard_insert" on leaderboard for insert with check (true);
create policy "leaderboard_update" on leaderboard for update using (true);

create index if not exists leaderboard_points_idx on leaderboard(points desc);

-- ── User Tasks (milestone + social task takibi) ──────────────────────────────
create table if not exists user_tasks (
  id         uuid primary key default gen_random_uuid(),
  wallet     text not null,
  task_key   text not null,         -- e.g. 'milestone_swap_10', 'social_x_follow'
  granted_at timestamptz default now(),
  unique(wallet, task_key)
);

alter table user_tasks enable row level security;
create policy "user_tasks_select" on user_tasks for select using (true);
create policy "user_tasks_insert" on user_tasks for insert with check (true);

create index if not exists user_tasks_wallet_idx on user_tasks(wallet);
