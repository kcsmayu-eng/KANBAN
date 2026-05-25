-- Allow both manager and employee roles to create projects
-- and restrict project deletion to managers only.

alter table public.projects enable row level security;

drop policy if exists "projects_insert" on public.projects;
create policy "projects_insert" on public.projects for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('manager','employee'))
);

drop policy if exists "projects_delete" on public.projects;
create policy "projects_delete" on public.projects for delete using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
);
