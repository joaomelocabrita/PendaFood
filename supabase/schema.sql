-- PendaFood privacy-first schema.
-- Run this in Supabase SQL Editor after reviewing it.
-- Existing projects can run this whole file; policies are recreated safely.

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
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  food_name text not null,
  portion text,
  symptoms_after text,
  notes text
);

-- Public seed knowledge: no personal health data here.
create table if not exists public.food_catalog (
  id text primary key,
  name text not null unique,
  category text not null,
  default_portion text,
  fodmap_note text,
  preparation_note text,
  source_name text not null,
  source_url text,
  is_active boolean not null default true
);

-- Private preferences and tolerance observations.
create table if not exists public.user_food_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id text not null references public.food_catalog(id) on delete cascade,
  preference text not null default 'neutral' check (preference in ('neutral','like','dislike','unavailable','avoid')),
  tolerance text not null default 'unknown' check (tolerance in ('unknown','tolerated','uncertain','problematic')),
  notes text,
  updated_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

alter table public.daily_logs enable row level security;
alter table public.meal_logs enable row level security;
alter table public.food_catalog enable row level security;
alter table public.user_food_preferences enable row level security;

drop policy if exists "users can read own daily logs" on public.daily_logs;
drop policy if exists "users can insert own daily logs" on public.daily_logs;
drop policy if exists "users can update own daily logs" on public.daily_logs;
drop policy if exists "users can delete own daily logs" on public.daily_logs;
create policy "users can read own daily logs" on public.daily_logs for select using (auth.uid() = user_id);
create policy "users can insert own daily logs" on public.daily_logs for insert with check (auth.uid() = user_id);
create policy "users can update own daily logs" on public.daily_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete own daily logs" on public.daily_logs for delete using (auth.uid() = user_id);

drop policy if exists "users can read own meal logs" on public.meal_logs;
drop policy if exists "users can insert own meal logs" on public.meal_logs;
drop policy if exists "users can update own meal logs" on public.meal_logs;
drop policy if exists "users can delete own meal logs" on public.meal_logs;
create policy "users can read own meal logs" on public.meal_logs for select using (auth.uid() = user_id);
create policy "users can insert own meal logs" on public.meal_logs for insert with check (auth.uid() = user_id);
create policy "users can update own meal logs" on public.meal_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete own meal logs" on public.meal_logs for delete using (auth.uid() = user_id);

drop policy if exists "catalog is readable by everyone" on public.food_catalog;
create policy "catalog is readable by everyone" on public.food_catalog for select using (is_active = true);

drop policy if exists "users can read own food preferences" on public.user_food_preferences;
drop policy if exists "users can insert own food preferences" on public.user_food_preferences;
drop policy if exists "users can update own food preferences" on public.user_food_preferences;
drop policy if exists "users can delete own food preferences" on public.user_food_preferences;
create policy "users can read own food preferences" on public.user_food_preferences for select using (auth.uid() = user_id);
create policy "users can insert own food preferences" on public.user_food_preferences for insert with check (auth.uid() = user_id);
create policy "users can update own food preferences" on public.user_food_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete own food preferences" on public.user_food_preferences for delete using (auth.uid() = user_id);

insert into public.food_catalog (id,name,category,default_portion,fodmap_note,preparation_note,source_name,source_url) values
('oats','Oats','grain','1 bowl','Portion and individual tolerance vary.','Cook until soft if preferred.','PendaFood starter catalog',null),
('rice','Rice','grain','1 bowl','Portion and individual tolerance vary.','Plain, well-cooked rice is a simple base.','PendaFood starter catalog',null),
('potato','Potato','starch','1 medium','Portion and individual tolerance vary.','Boiled, baked, or mashed; preparation changes tolerance.','PendaFood starter catalog',null),
('banana','Banana','fruit','1 small','Ripeness and portion can matter for individual tolerance.','Choose preparation/ripeness according to personal tolerance.','PendaFood starter catalog',null),
('blueberries','Blueberries','fruit','1 small handful','Portion and individual tolerance vary.','Fresh or cooked according to tolerance.','PendaFood starter catalog',null),
('carrot','Carrot','vegetable','1 serving','Portion and individual tolerance vary.','Cooked texture may be easier for some people.','PendaFood starter catalog',null),
('courgette','Courgette','vegetable','1 serving','Portion and individual tolerance vary.','Cook thoroughly if that is personally easier.','PendaFood starter catalog',null),
('spinach','Spinach','vegetable','1 serving','Portion and individual tolerance vary.','Cooked preparation available.','PendaFood starter catalog',null),
('egg','Egg','protein','1–2 eggs','Not a FODMAP claim; individual tolerance varies.','Boiled, poached, scrambled, or omelette.','PendaFood starter catalog',null),
('chicken','Chicken','protein','1 palm-sized serving','Not a FODMAP claim; sauces and marinades can change ingredients.','Bake, poach, grill, or stew according to tolerance.','PendaFood starter catalog',null),
('turkey','Turkey','protein','1 palm-sized serving','Not a FODMAP claim; sauces and marinades can change ingredients.','Choose simple preparation if preferred.','PendaFood starter catalog',null),
('white_fish','White fish','protein','1 fillet','Not a FODMAP claim; sauces and marinades can change ingredients.','Bake, poach, or steam.','PendaFood starter catalog',null)
on conflict (id) do nothing;
