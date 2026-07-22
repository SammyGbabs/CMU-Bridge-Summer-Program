-- SafeSeizure initial schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).

-- ── Helper: keep updated_at fresh on every UPDATE ──────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── doctors ─────────────────────────────────────────────────────────────
-- One row per authenticated doctor, keyed 1:1 to Supabase Auth's auth.users.
create table public.doctors (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  license_number text,
  specialization text,
  facility text,
  is_available boolean not null default true,
  availability jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger doctors_set_updated_at
  before update on public.doctors
  for each row execute function public.set_updated_at();

-- ── patients ────────────────────────────────────────────────────────────
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  date_of_birth date not null,
  gender text,
  photo text,

  status text not null default 'stable'
    check (status in ('stable', 'monitoring', 'alert', 'offline')),
  risk_level text not null default 'low'
    check (risk_level in ('low', 'medium', 'high', 'critical')),

  diagnoses text[] not null default '{}',
  medication_adherence int not null default 100
    check (medication_adherence between 0 and 100),
  last_seizure_date date,
  seizure_frequency text,
  average_seizure_duration int not null default 0,

  location_enabled boolean not null default false,
  current_latitude double precision,
  current_longitude double precision,
  current_address text,

  address_country text,
  address_city text,
  address_state text,
  address_house text,
  address_zip text,

  emergency_contact_name text,
  emergency_contact_relation text,
  emergency_contact_email text,
  emergency_contact_phone_code text,
  emergency_contact_phone text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patients_doctor_id_idx on public.patients (doctor_id);

create trigger patients_set_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

-- ── devices ─────────────────────────────────────────────────────────────
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  name text not null,
  type text not null check (type in ('wearable', 'implant', 'mobile', 'sensor')),
  status text not null default 'offline'
    check (status in ('online', 'offline', 'low-battery', 'error')),
  battery_level int check (battery_level between 0 and 100),
  last_sync_time timestamptz,
  next_scheduled_check timestamptz,
  created_at timestamptz not null default now()
);

create index devices_patient_id_idx on public.devices (patient_id);

-- ── seizure_events ──────────────────────────────────────────────────────
create table public.seizure_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  type text not null
    check (type in ('tonic-clonic', 'focal', 'absence', 'atonic', 'myoclonic', 'unknown')),
  start_time timestamptz not null,
  duration int not null,
  latitude double precision,
  longitude double precision,
  address text,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  witnesses text[],
  notes text,
  treatment_provided text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index seizure_events_patient_id_idx on public.seizure_events (patient_id);

create trigger seizure_events_set_updated_at
  before update on public.seizure_events
  for each row execute function public.set_updated_at();

-- ── alerts ──────────────────────────────────────────────────────────────
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  type text not null
    check (type in ('seizure', 'device', 'medication', 'appointment', 'manual')),
  title text not null,
  description text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  status text not null default 'active'
    check (status in ('active', 'acknowledged', 'resolved', 'escalated')),
  timestamp timestamptz not null default now(),
  acknowledged_by uuid references public.doctors (id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb
);

create index alerts_patient_id_idx on public.alerts (patient_id);
create index alerts_status_idx on public.alerts (status);

-- ── appointments ────────────────────────────────────────────────────────
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  type text not null
    check (type in ('consultation', 'follow-up', 'medication-review', 'emergency')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled', 'no-show')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index appointments_doctor_id_idx on public.appointments (doctor_id);
create index appointments_patient_id_idx on public.appointments (patient_id);

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ── conversations ───────────────────────────────────────────────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_doctor_id_idx on public.conversations (doctor_id);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- ── messages ────────────────────────────────────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null,
  sender_name text not null,
  sender_role text not null check (sender_role in ('doctor', 'patient', 'caregiver', 'admin')),
  type text not null default 'text' check (type in ('text', 'image', 'document', 'alert')),
  content text not null,
  attachment_url text,
  is_read boolean not null default false,
  timestamp timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id);

-- ── Row Level Security ──────────────────────────────────────────────────
-- Every table is scoped to the signed-in doctor: a doctor can only ever
-- see/modify their own patients, and anything hanging off those patients.

alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.devices enable row level security;
alter table public.seizure_events enable row level security;
alter table public.alerts enable row level security;
alter table public.appointments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Doctors manage their own profile"
  on public.doctors for all
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Doctors manage their own patients"
  on public.patients for all
  using (doctor_id = auth.uid())
  with check (doctor_id = auth.uid());

create policy "Doctors manage devices of their patients"
  on public.devices for all
  using (exists (
    select 1 from public.patients
    where patients.id = devices.patient_id
      and patients.doctor_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.patients
    where patients.id = devices.patient_id
      and patients.doctor_id = auth.uid()
  ));

create policy "Doctors manage seizure events of their patients"
  on public.seizure_events for all
  using (exists (
    select 1 from public.patients
    where patients.id = seizure_events.patient_id
      and patients.doctor_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.patients
    where patients.id = seizure_events.patient_id
      and patients.doctor_id = auth.uid()
  ));

create policy "Doctors manage alerts of their patients"
  on public.alerts for all
  using (exists (
    select 1 from public.patients
    where patients.id = alerts.patient_id
      and patients.doctor_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.patients
    where patients.id = alerts.patient_id
      and patients.doctor_id = auth.uid()
  ));

create policy "Doctors manage their own appointments"
  on public.appointments for all
  using (doctor_id = auth.uid())
  with check (doctor_id = auth.uid());

create policy "Doctors manage their own conversations"
  on public.conversations for all
  using (doctor_id = auth.uid())
  with check (doctor_id = auth.uid());

create policy "Doctors manage messages in their conversations"
  on public.messages for all
  using (exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.doctor_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.doctor_id = auth.uid()
  ));

-- ── Auto-create a doctor profile row on signup ─────────────────────────
create or replace function public.handle_new_doctor()
returns trigger as $$
begin
  insert into public.doctors (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_doctor();
