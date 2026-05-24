-- Add missing profiles INSERT policy for profile creation to work
-- First, drop the existing update policy if it exists
drop policy if exists "profiles_update" on public.profiles;

-- Add both insert and update policies
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);
