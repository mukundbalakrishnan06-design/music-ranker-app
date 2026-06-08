-- ============================================================
-- Music Ranker — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Albums
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  artist text not null,
  cover_url text,
  spotify_id text,
  release_year int,
  genre text,
  created_at timestamptz default now() not null
);

-- Tracks
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  title text not null,
  track_number int not null default 1,
  duration_ms int,
  spotify_id text,
  created_at timestamptz default now() not null
);

-- Track ratings
create table if not exists public.track_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  rating numeric(4,2) not null check (rating >= 0 and rating <= 10),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, track_id)
);

-- Indexes
create index if not exists albums_user_id_idx on public.albums(user_id);
create index if not exists tracks_album_id_idx on public.tracks(album_id);
create index if not exists track_ratings_user_id_idx on public.track_ratings(user_id);
create index if not exists track_ratings_track_id_idx on public.track_ratings(track_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.tracks enable row level security;
alter table public.track_ratings enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Albums: anyone can read, only owner can write
create policy "Albums are viewable by everyone"
  on public.albums for select using (true);

create policy "Users can insert own albums"
  on public.albums for insert with check (auth.uid() = user_id);

create policy "Users can update own albums"
  on public.albums for update using (auth.uid() = user_id);

create policy "Users can delete own albums"
  on public.albums for delete using (auth.uid() = user_id);

-- Tracks: anyone can read, only album owner can write
create policy "Tracks are viewable by everyone"
  on public.tracks for select using (true);

create policy "Album owners can insert tracks"
  on public.tracks for insert with check (
    exists (select 1 from public.albums where id = album_id and user_id = auth.uid())
  );

create policy "Album owners can update tracks"
  on public.tracks for update using (
    exists (select 1 from public.albums where id = album_id and user_id = auth.uid())
  );

create policy "Album owners can delete tracks"
  on public.tracks for delete using (
    exists (select 1 from public.albums where id = album_id and user_id = auth.uid())
  );

-- Track ratings: owner can write, everyone can read
create policy "Ratings are viewable by everyone"
  on public.track_ratings for select using (true);

create policy "Users can insert own ratings"
  on public.track_ratings for insert with check (auth.uid() = user_id);

create policy "Users can update own ratings"
  on public.track_ratings for update using (auth.uid() = user_id);

create policy "Users can delete own ratings"
  on public.track_ratings for delete using (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'username'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Auto-update updated_at on track_ratings
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger track_ratings_updated_at
  before update on public.track_ratings
  for each row execute procedure public.handle_updated_at();
