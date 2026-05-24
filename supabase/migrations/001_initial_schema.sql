-- ============================================================
-- EXTENSIONS
-- ============================================================
-- Using gen_random_uuid() instead of uuid-ossp

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null check (role in ('manager','employee')),
  created_at  timestamptz default now()
);

-- Projects
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  manager_id  uuid references public.profiles(id),
  created_at  timestamptz default now()
);

-- Project members (employees assigned to a project)
create table public.project_members (
  project_id  uuid references public.projects(id) on delete cascade,
  profile_id  uuid references public.profiles(id) on delete cascade,
  primary key (project_id, profile_id)
);

-- Work catalog (imported from Excel; source of truth for autocomplete)
create table public.work_catalog (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects(id) on delete cascade,
  work_number  text not null,
  employee_id  uuid references public.profiles(id),
  manager_id   uuid references public.profiles(id),
  unique (project_id, work_number)
);

-- Tasks (Kanban cards)
create table public.tasks (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid references public.projects(id) on delete cascade,
  work_number         text not null,
  employee_id         uuid references public.profiles(id),
  manager_id          uuid references public.profiles(id),
  status              text not null default 'todo'
                        check (status in ('todo','in_progress','review','finished')),
  proposed_finish_date date,
  finished_at         timestamptz,
  manager_reviewed_at timestamptz,
  auto_completed      boolean default false,
  delayed             boolean default false,
  notes               text,
  created_by          uuid references public.profiles(id),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.work_catalog    enable row level security;
alter table public.tasks           enable row level security;

-- Profiles: anyone can read; only owner can update/insert own profile
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Projects: visible to members and managers
create policy "projects_select" on public.projects for select using (
  manager_id = auth.uid() or
  exists (select 1 from public.project_members pm where pm.project_id = id and pm.profile_id = auth.uid())
);
create policy "projects_insert" on public.projects for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
);
create policy "projects_update" on public.projects for update using (manager_id = auth.uid());

-- Project members
create policy "pm_select" on public.project_members for select using (true);
create policy "pm_manage" on public.project_members for all using (
  exists (
    select 1 from public.projects pr
    where pr.id = project_id and pr.manager_id = auth.uid()
  )
);

-- Work catalog
create policy "wc_select" on public.work_catalog for select using (true);
create policy "wc_insert" on public.work_catalog for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
);
create policy "wc_delete" on public.work_catalog for delete using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
);

-- Tasks
create policy "tasks_select" on public.tasks for select using (
  exists (
    select 1 from public.project_members pm
    where pm.project_id = tasks.project_id and pm.profile_id = auth.uid()
  ) or
  exists (
    select 1 from public.projects pr
    where pr.id = tasks.project_id and pr.manager_id = auth.uid()
  )
);

create policy "tasks_insert" on public.tasks for insert with check (
  exists (
    select 1 from public.project_members pm
    where pm.project_id = project_id and pm.profile_id = auth.uid()
  ) or
  exists (
    select 1 from public.projects pr
    where pr.id = project_id and pr.manager_id = auth.uid()
  )
);

-- Employees can move tasks; managers can do everything
create policy "tasks_update" on public.tasks for update using (
  employee_id = auth.uid() or
  manager_id  = auth.uid() or
  exists (
    select 1 from public.projects pr
    where pr.id = project_id and pr.manager_id = auth.uid()
  )
);

-- Only managers can delete tasks
create policy "tasks_delete" on public.tasks for delete using (
  exists (
    select 1 from public.projects pr
    where pr.id = project_id and pr.manager_id = auth.uid()
  )
);

-- Enable realtime on tasks
alter publication supabase_realtime add table public.tasks;
