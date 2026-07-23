-- Run this once in your Supabase project's SQL editor, after 0001/0002.
-- Real data storage for the seizure diary and (future) home-screen trend
-- charts. No mock/demo rows are ever inserted here — every row comes from
-- an actual wearable event or reading.

-- One row per seizure episode detected by the wearable.
create table if not exists public.seizure_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_at timestamptz not null,
  resolved_at timestamptz,
  duration_seconds integer,
  status text not null check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.seizure_events enable row level security;

create policy "Users can view their own seizure events"
  on public.seizure_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own seizure events"
  on public.seizure_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own seizure events"
  on public.seizure_events for update
  using (auth.uid() = user_id);

create index if not exists seizure_events_user_id_occurred_at_idx
  on public.seizure_events (user_id, occurred_at desc);

-- Continuous motion/rotation telemetry samples from the wearable, for the
-- Home screen trend charts. Populated once the firmware exposes the
-- corresponding BLE characteristics — table exists ahead of that so the
-- app can start writing to it as soon as it does.
create table if not exists public.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recorded_at timestamptz not null default now(),
  motion_intensity numeric,
  rotation_activity numeric,
  created_at timestamptz not null default now()
);

alter table public.sensor_readings enable row level security;

create policy "Users can view their own sensor readings"
  on public.sensor_readings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sensor readings"
  on public.sensor_readings for insert
  with check (auth.uid() = user_id);

create index if not exists sensor_readings_user_id_recorded_at_idx
  on public.sensor_readings (user_id, recorded_at desc);
