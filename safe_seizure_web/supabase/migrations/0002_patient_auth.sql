-- Patient self-registration support (for the companion Flutter app)
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).

-- ── Link patients to their own Supabase Auth account ───────────────────
alter table public.patients
  add column auth_user_id uuid unique references auth.users (id) on delete set null;

-- ── Replace the signup trigger so it branches by role ──────────────────
-- The Flutter app must pass { data: { role: 'patient' } } when calling
-- supabase.auth.signUp(). Anything else (including no role at all, which
-- covers the existing doctor sign-in flow) is treated as a doctor.
create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
  user_role text := coalesce(new.raw_user_meta_data->>'role', 'doctor');
begin
  if user_role = 'patient' then
    -- Link to the patient record the doctor already created with this email.
    -- If none exists yet, the account simply stays unlinked until a doctor
    -- registers a patient with this same email (handled below).
    update public.patients
    set auth_user_id = new.id
    where email = new.email
      and auth_user_id is null;
  else
    insert into public.doctors (id, email, name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email));
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ── Cover the reverse order: patient signs up in Flutter BEFORE the ────
-- doctor gets around to registering them on the dashboard.
create or replace function public.link_patient_auth_by_email()
returns trigger as $$
begin
  if new.auth_user_id is null and new.email is not null then
    select id into new.auth_user_id
    from auth.users
    where auth.users.email = new.email
    limit 1;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger patients_link_auth_by_email
  before insert or update of email on public.patients
  for each row execute function public.link_patient_auth_by_email();

-- ── RLS: let a signed-in patient see their own record ──────────────────
create policy "Patients view their own record"
  on public.patients for select
  using (auth_user_id = auth.uid());

-- ── RLS: let a signed-in patient see their own conversation(s) ─────────
create policy "Patients view their own conversations"
  on public.conversations for select
  using (exists (
    select 1 from public.patients
    where patients.id = conversations.patient_id
      and patients.auth_user_id = auth.uid()
  ));

-- ── RLS: let a signed-in patient read and send messages in their own ───
-- conversation(s). Doctors keep their existing separate policy.
create policy "Patients view messages in their conversations"
  on public.messages for select
  using (exists (
    select 1 from public.conversations
    join public.patients on patients.id = conversations.patient_id
    where conversations.id = messages.conversation_id
      and patients.auth_user_id = auth.uid()
  ));

create policy "Patients send messages in their conversations"
  on public.messages for insert
  with check (
    sender_role = 'patient'
    and exists (
      select 1 from public.conversations
      join public.patients on patients.id = conversations.patient_id
      where conversations.id = messages.conversation_id
        and patients.auth_user_id = auth.uid()
    )
  );
