-- Device inventory: a shared pool of devices (identified by serial number)
-- that haven't been assigned to a patient yet.
--
-- Today, doctors register devices into this pool by hand (serial number +
-- name + type) as a stand-in for the real provisioning feed. Once the
-- hardware team's endpoint exists, swap the manual "Register Device" write
-- path for a sync job that inserts into this same table — nothing else in
-- the app needs to change.
--
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).

create table public.device_inventory (
  id uuid primary key default gen_random_uuid(),
  serial_number text not null unique,
  name text not null,
  type text not null check (type in ('wearable', 'implant', 'mobile', 'sensor')),
  status text not null default 'available' check (status in ('available', 'assigned')),
  created_at timestamptz not null default now()
);

alter table public.devices
  add column serial_number text unique;

alter table public.device_inventory enable row level security;

-- Shared clinic stock: any signed-in doctor can see and manage inventory.
create policy "Doctors view device inventory"
  on public.device_inventory for select
  using (auth.uid() is not null);

create policy "Doctors register devices into inventory"
  on public.device_inventory for insert
  with check (auth.uid() is not null);

create policy "Doctors update device inventory"
  on public.device_inventory for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
