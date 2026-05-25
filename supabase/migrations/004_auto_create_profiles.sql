-- Auto-create profiles for new users using a trigger
-- This allows profile creation without hitting RLS restrictions

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, 'User', 'employee');
  return new;
end;
$$;

-- Create trigger on auth.users to auto-create profiles
-- Using "on_auth_user_created" as the trigger name
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
