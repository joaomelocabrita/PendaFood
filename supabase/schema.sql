-- PendaFood privacy-first schema.
-- Run this in a Supabase project after reviewing it.
-- Health records are private to their owner through Row Level Security.

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  health_status text,
  stool_type text,
  stool_count integer,
  pain_score integer,
  urgency_score integer,
  energy_score integer,
  sleep_hours numeric,
  water_glasses integer,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, log_date)
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  eaten_at timestamptz not null default now(),
  meal_type text not null,
  food_name text not null,
  portion text,
  symptoms_after text,
  notes text
);

alter table public.daily_logs enable row level security;
alter table public.meal_logs enable row level security;

create policy "users can read own daily logs"
  on public.daily_logs for select
  using (auth.uid() = user_id);

create policy "users can insert own daily logs"
  on public.daily_logs for insert
  with check (auth.uid() = user_id);

create policy "users can update own daily logs"
  on public.daily_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own daily logs"
  on public.daily_logs for delete
  using (auth.uid() = user_id);

create policy "users can read own meal logs"
  on public.meal_logs for select
  using (auth.uid() = user_id);

create policy "users can insert own meal logs"
  on public.meal_logs for insert
  with check (auth.uid() = user_id);

create policy "users can update own meal logs"
  on public.meal_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own meal logs"
  on public.meal_logs for delete
  using (auth.uid() = user_id);
