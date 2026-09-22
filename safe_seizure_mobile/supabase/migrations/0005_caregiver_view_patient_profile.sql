-- Run this once in your Supabase project's SQL editor, after 0001-0004.
-- Lets a linked caregiver read the patient's profile (first name only, used
-- to personalize the caregiver's Home screen — "Jordan is stable" instead of
-- a generic "You're stable").

create policy "Linked caregivers can view patient profile"
  on public.profiles for select
  using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_user_id = profiles.id
        and cl.caregiver_email = auth.email()
    )
  );
