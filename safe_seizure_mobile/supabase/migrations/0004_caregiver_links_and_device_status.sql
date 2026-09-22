-- Run this once in your Supabase project's SQL editor, after 0001-0003.
-- Lets a user (wearer) link a caregiver by email, gives that caregiver
-- read access to the wearer's seizure_events/sensor_readings, and adds a
-- small live-status table so a caregiver's phone (which has no direct
-- Bluetooth link to the wearable) can see the wearer's current state and
-- request a remote dismiss in real time while the app is open.

-- Which caregiver emails a patient (wearer) has linked.
create table if not exists public.caregiver_links (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid not null references auth.users (id) on delete cascade,
  caregiver_email text not null,
  created_at timestamptz not null default now(),
  unique (patient_user_id, caregiver_email)
);

alter table public.caregiver_links enable row level security;

create policy "Patients can view their own caregiver links"
  on public.caregiver_links for select
  using (auth.uid() = patient_user_id);

create policy "Patients can add their own caregiver links"
  on public.caregiver_links for insert
  with check (auth.uid() = patient_user_id);

create policy "Patients can remove their own caregiver links"
  on public.caregiver_links for delete
  using (auth.uid() = patient_user_id);

-- A linked caregiver looks up which patient they're linked to by matching
-- their own JWT email against caregiver_email.
create policy "Caregivers can find the patient they're linked to"
  on public.caregiver_links for select
  using (auth.email() = caregiver_email);

-- Let a linked caregiver read the patient's seizure diary / alerts.
create policy "Linked caregivers can view patient seizure events"
  on public.seizure_events for select
  using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_user_id = seizure_events.user_id
        and cl.caregiver_email = auth.email()
    )
  );

-- Let a linked caregiver read the patient's motion/rotation trend data.
create policy "Linked caregivers can view patient sensor readings"
  on public.sensor_readings for select
  using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_user_id = sensor_readings.user_id
        and cl.caregiver_email = auth.email()
    )
  );

-- One live row per patient: their current seizure state, updated by the
-- wearer's own phone every time it changes, watched in real time by any
-- linked caregiver. dismiss_requested lets a caregiver ask the wearer's
-- phone to send the actual BLE dismiss on their behalf, since only the
-- phone with the live Bluetooth connection can do that.
create table if not exists public.device_status (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state text not null default 'normal' check (state in ('normal', 'suspected', 'alarm')),
  updated_at timestamptz not null default now(),
  dismiss_requested boolean not null default false,
  dismiss_requested_at timestamptz
);

alter table public.device_status enable row level security;

create policy "Patients can view their own device status"
  on public.device_status for select
  using (auth.uid() = user_id);

create policy "Patients can upsert their own device status"
  on public.device_status for insert
  with check (auth.uid() = user_id);

create policy "Patients can update their own device status"
  on public.device_status for update
  using (auth.uid() = user_id);

create policy "Linked caregivers can view patient device status"
  on public.device_status for select
  using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_user_id = device_status.user_id
        and cl.caregiver_email = auth.email()
    )
  );

-- Caregivers only ever set dismiss_requested/dismiss_requested_at from the
-- app; this keeps things simple (no separate RPC) for this project's scope
-- rather than enforcing column-level restrictions in SQL.
create policy "Linked caregivers can request a dismiss"
  on public.device_status for update
  using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_user_id = device_status.user_id
        and cl.caregiver_email = auth.email()
    )
  );

-- Enable realtime so caregivers get live updates while the app is open.
alter publication supabase_realtime add table public.device_status;
alter publication supabase_realtime add table public.seizure_events;
