-- ROLES ENUM
create type public.app_role as enum ('admin', 'teacher');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  default_test_minutes int not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can view their own roles" on public.user_roles
  for select using (auth.uid() = user_id);

-- GROUPS (owned by teacher)
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.groups enable row level security;

create policy "Anyone can view groups" on public.groups for select using (true);
create policy "Teachers manage their own groups - insert" on public.groups
  for insert with check (auth.uid() = owner_id);
create policy "Teachers manage their own groups - update" on public.groups
  for update using (auth.uid() = owner_id);
create policy "Teachers manage their own groups - delete" on public.groups
  for delete using (auth.uid() = owner_id);

-- TESTS
create table public.tests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  time_minutes int not null default 20,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tests enable row level security;

create policy "Anyone can view published tests" on public.tests
  for select using (is_published = true or auth.uid() = owner_id);
create policy "Teachers create their own tests" on public.tests
  for insert with check (auth.uid() = owner_id);
create policy "Teachers update their own tests" on public.tests
  for update using (auth.uid() = owner_id);
create policy "Teachers delete their own tests" on public.tests
  for delete using (auth.uid() = owner_id);

-- QUESTIONS
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  position int not null default 0,
  text text not null,
  options jsonb not null default '[]'::jsonb,
  correct_index int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.questions enable row level security;

create policy "Anyone can view questions of viewable tests" on public.questions
  for select using (
    exists (select 1 from public.tests t where t.id = test_id and (t.is_published = true or t.owner_id = auth.uid()))
  );
create policy "Test owner can insert questions" on public.questions
  for insert with check (
    exists (select 1 from public.tests t where t.id = test_id and t.owner_id = auth.uid())
  );
create policy "Test owner can update questions" on public.questions
  for update using (
    exists (select 1 from public.tests t where t.id = test_id and t.owner_id = auth.uid())
  );
create policy "Test owner can delete questions" on public.questions
  for delete using (
    exists (select 1 from public.tests t where t.id = test_id and t.owner_id = auth.uid())
  );

-- RESULTS
create table public.results (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  student_first_name text not null,
  student_last_name text not null,
  group_id uuid references public.groups(id) on delete set null,
  group_name text,
  total_questions int not null,
  correct_count int not null,
  score_percent numeric(5,2) not null,
  answers jsonb not null default '[]'::jsonb,
  time_taken_seconds int,
  created_at timestamptz not null default now()
);
alter table public.results enable row level security;

create policy "Anyone can submit results" on public.results
  for insert with check (true);
create policy "Test owner can view results" on public.results
  for select using (
    exists (select 1 from public.tests t where t.id = test_id and t.owner_id = auth.uid())
  );
create policy "Test owner can delete results" on public.results
  for delete using (
    exists (select 1 from public.tests t where t.id = test_id and t.owner_id = auth.uid())
  );

-- TRIGGER: auto-create profile + assign teacher role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  );
  insert into public.user_roles (user_id, role) values (new.id, 'teacher');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger tests_updated_at before update on public.tests
  for each row execute function public.set_updated_at();

-- indexes
create index idx_questions_test on public.questions(test_id, position);
create index idx_results_test on public.results(test_id);
create index idx_tests_owner on public.tests(owner_id);
create index idx_groups_owner on public.groups(owner_id);