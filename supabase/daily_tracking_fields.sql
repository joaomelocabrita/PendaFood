-- Add optional daily symptom and habit fields. Safe to run more than once.
alter table public.daily_logs
  add column if not exists bloating_score integer check (bloating_score between 0 and 10),
  add column if not exists cramping_score integer check (cramping_score between 0 and 10),
  add column if not exists appetite_score integer check (appetite_score between 1 and 5),
  add column if not exists blood_seen boolean not null default false,
  add column if not exists mucus_seen boolean not null default false;

-- Existing stool_count and sleep_hours columns are reused.
