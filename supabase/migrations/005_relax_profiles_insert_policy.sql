-- Relax profiles RLS policy to allow signup
-- Allow insert if profile doesn't exist yet (new user)
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert with check (true);

-- Keep update restricted to owner
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);
