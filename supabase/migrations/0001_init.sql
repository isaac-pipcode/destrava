-- Destrava — schema inicial com Row-Level Security (RLS).
-- Cada usuário só enxerga e altera os próprios dados. A segurança é garantida
-- no banco, então mesmo que o app seja comprometido os dados de terceiros
-- permanecem inacessíveis.

-- =========================================================================
-- Perfil (espelha auth.users, criado automaticamente no signup)
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "perfil próprio - leitura"  on public.profiles for select using (auth.uid() = id);
create policy "perfil próprio - update"   on public.profiles for update using (auth.uid() = id);

-- Cria o profile automaticamente quando um usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- Dados de domínio — cada tabela isolada por user_id via RLS
-- =========================================================================
create table if not exists public.business_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user on public.transactions (user_id);
create index if not exists idx_projects_user     on public.projects (user_id);
create index if not exists idx_accounts_user      on public.bank_accounts (user_id);
create index if not exists idx_invoices_user      on public.invoices (user_id);

-- RLS uniforme: dono total sobre as próprias linhas.
do $$
declare t text;
begin
  foreach t in array array['business_profiles','bank_accounts','projects','transactions','invoices']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$create policy "dono - tudo" on public.%I
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);$f$, t);
  end loop;
end $$;

-- =========================================================================
-- Rate limiting de IA (gravado apenas pela Edge Function via service role)
-- =========================================================================
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default current_date,
  count int not null default 0,
  primary key (user_id, usage_date)
);

alter table public.ai_usage enable row level security; -- sem policy: bloqueado para clientes

-- Incrementa o uso do dia e retorna o novo total, ou -1 se passou do limite.
create or replace function public.increment_ai_usage(p_user_id uuid, p_limit int)
returns int language plpgsql security definer set search_path = public as $$
declare current_count int;
begin
  insert into public.ai_usage (user_id, usage_date, count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, usage_date)
  do update set count = public.ai_usage.count + 1
  returning count into current_count;

  if current_count > p_limit then
    update public.ai_usage set count = count - 1
      where user_id = p_user_id and usage_date = current_date;
    return -1;
  end if;
  return current_count;
end;
$$;
