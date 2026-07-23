-- Run this once in your Supabase project's SQL editor, after 0001_profiles.sql.
-- Adds a role column ('user' or 'caregiver') populated from signUp()'s metadata,
-- and updates the new-user trigger to carry it over.

alter table public.profiles
  add column if not exists role text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'role'
  );
  return new;
end;
$$;
