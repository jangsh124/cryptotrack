-- Supabase에서 SQL Editor에 복사/붙여넣기 후 실행하세요

create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- Row Level Security: 본인 데이터만 접근 가능
alter table holdings enable row level security;

create policy "Users can read own holdings"
  on holdings for select using (auth.uid() = user_id);

create policy "Users can insert own holdings"
  on holdings for insert with check (auth.uid() = user_id);

create policy "Users can update own holdings"
  on holdings for update using (auth.uid() = user_id);
