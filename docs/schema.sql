-- 아장아장 (BabySteps) Supabase 스키마
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- =====================
-- 1. profiles (유저 프로필)
-- =====================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nickname text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 회원가입 시 자동으로 profile 행 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================
-- 2. stories (동화)
-- =====================
create table if not exists public.stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content jsonb not null default '[]', -- [{ page: 1, text: "", image_prompt: "" }]
  cover_image_url text,
  created_at timestamptz default now() not null
);

-- =====================
-- 3. english_lessons (영어 학습)
-- =====================
create table if not exists public.english_lessons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  words jsonb not null default '[]', -- [{ word, meaning, example }]
  created_at timestamptz default now() not null
);

-- =====================
-- 4. hangul_lessons (한글 학습)
-- =====================
create table if not exists public.hangul_lessons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  characters jsonb not null default '[]', -- [{ char, pronunciation, example }]
  created_at timestamptz default now() not null
);

-- =====================
-- 5. number_lessons (숫자 학습)
-- =====================
create table if not exists public.number_lessons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  numbers jsonb not null default '[]', -- [{ value, korean, english }]
  created_at timestamptz default now() not null
);

-- =====================
-- 6. coloring_pages (색칠 도안)
-- =====================
create table if not exists public.coloring_pages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  svg_content text not null,
  created_at timestamptz default now() not null
);

-- =====================
-- 7. coloring_strokes (색칠 상태)
-- =====================
create table if not exists public.coloring_strokes (
  id uuid default gen_random_uuid() primary key,
  page_id uuid references public.coloring_pages(id) on delete cascade not null unique,
  strokes jsonb not null default '{}',
  updated_at timestamptz default now() not null
);

-- =====================
-- RLS (Row Level Security) 활성화
-- =====================
alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.english_lessons enable row level security;
alter table public.hangul_lessons enable row level security;
alter table public.number_lessons enable row level security;
alter table public.coloring_pages enable row level security;
alter table public.coloring_strokes enable row level security;

-- profiles 정책
drop policy if exists "자신의 프로필만 조회" on public.profiles;
drop policy if exists "자신의 프로필만 수정" on public.profiles;
create policy "자신의 프로필만 조회" on public.profiles for select using (auth.uid() = id);
create policy "자신의 프로필만 수정" on public.profiles for update using (auth.uid() = id);

-- stories 정책
drop policy if exists "자신의 동화만 조회" on public.stories;
drop policy if exists "동화 생성" on public.stories;
drop policy if exists "자신의 동화만 삭제" on public.stories;
create policy "자신의 동화만 조회" on public.stories for select using (auth.uid() = user_id);
create policy "동화 생성" on public.stories for insert with check (auth.uid() = user_id);
create policy "자신의 동화만 삭제" on public.stories for delete using (auth.uid() = user_id);

-- english_lessons 정책
drop policy if exists "자신의 영어 학습만 조회" on public.english_lessons;
drop policy if exists "영어 학습 생성" on public.english_lessons;
drop policy if exists "자신의 영어 학습만 삭제" on public.english_lessons;
create policy "자신의 영어 학습만 조회" on public.english_lessons for select using (auth.uid() = user_id);
create policy "영어 학습 생성" on public.english_lessons for insert with check (auth.uid() = user_id);
create policy "자신의 영어 학습만 삭제" on public.english_lessons for delete using (auth.uid() = user_id);

-- hangul_lessons 정책
drop policy if exists "자신의 한글 학습만 조회" on public.hangul_lessons;
drop policy if exists "한글 학습 생성" on public.hangul_lessons;
drop policy if exists "자신의 한글 학습만 삭제" on public.hangul_lessons;
create policy "자신의 한글 학습만 조회" on public.hangul_lessons for select using (auth.uid() = user_id);
create policy "한글 학습 생성" on public.hangul_lessons for insert with check (auth.uid() = user_id);
create policy "자신의 한글 학습만 삭제" on public.hangul_lessons for delete using (auth.uid() = user_id);

-- number_lessons 정책
drop policy if exists "자신의 숫자 학습만 조회" on public.number_lessons;
drop policy if exists "숫자 학습 생성" on public.number_lessons;
drop policy if exists "자신의 숫자 학습만 삭제" on public.number_lessons;
create policy "자신의 숫자 학습만 조회" on public.number_lessons for select using (auth.uid() = user_id);
create policy "숫자 학습 생성" on public.number_lessons for insert with check (auth.uid() = user_id);
create policy "자신의 숫자 학습만 삭제" on public.number_lessons for delete using (auth.uid() = user_id);

-- coloring_pages 정책
drop policy if exists "자신의 색칠 도안만 조회" on public.coloring_pages;
drop policy if exists "색칠 도안 생성" on public.coloring_pages;
drop policy if exists "자신의 색칠 도안만 삭제" on public.coloring_pages;
create policy "자신의 색칠 도안만 조회" on public.coloring_pages for select using (auth.uid() = user_id);
create policy "색칠 도안 생성" on public.coloring_pages for insert with check (auth.uid() = user_id);
create policy "자신의 색칠 도안만 삭제" on public.coloring_pages for delete using (auth.uid() = user_id);

-- coloring_strokes 정책 (page_id를 통해 user 확인)
drop policy if exists "자신의 색칠 상태만 조회" on public.coloring_strokes;
drop policy if exists "색칠 상태 저장" on public.coloring_strokes;
drop policy if exists "색칠 상태 수정" on public.coloring_strokes;
create policy "자신의 색칠 상태만 조회" on public.coloring_strokes for select
  using (exists (
    select 1 from public.coloring_pages
    where id = page_id and user_id = auth.uid()
  ));
create policy "색칠 상태 저장" on public.coloring_strokes for insert
  with check (exists (
    select 1 from public.coloring_pages
    where id = page_id and user_id = auth.uid()
  ));
create policy "색칠 상태 수정" on public.coloring_strokes for update
  using (exists (
    select 1 from public.coloring_pages
    where id = page_id and user_id = auth.uid()
  ));
