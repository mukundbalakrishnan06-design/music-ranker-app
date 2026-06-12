-- Add Spotify token columns to profiles
alter table public.profiles
  add column if not exists spotify_access_token text,
  add column if not exists spotify_refresh_token text,
  add column if not exists spotify_token_expires_at timestamptz,
  add column if not exists spotify_connected boolean default false;
