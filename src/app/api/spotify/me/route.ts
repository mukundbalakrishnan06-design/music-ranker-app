import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

async function refreshSpotifyToken(refreshToken: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) return null
  return res.json()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'tracks'
  const timeRange = searchParams.get('time_range') ?? 'medium_term'
  const limit = searchParams.get('limit') ?? '50'

  // Verify user identity via cookie client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Use admin client to read/write tokens (bypasses RLS on sensitive columns)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('spotify_access_token, spotify_refresh_token, spotify_token_expires_at, spotify_connected')
    .eq('id', user.id)
    .single()

  if (!profile?.spotify_connected || !profile.spotify_access_token) {
    return NextResponse.json({ error: 'Spotify not connected' }, { status: 403 })
  }

  let accessToken = profile.spotify_access_token

  // Refresh token if expired (60s buffer)
  const expiresAt = new Date(profile.spotify_token_expires_at)
  if (Date.now() > expiresAt.getTime() - 60_000) {
    const refreshed = await refreshSpotifyToken(profile.spotify_refresh_token!)
    if (!refreshed) {
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
    }
    accessToken = refreshed.access_token
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000)
    await admin.from('profiles').update({
      spotify_access_token: accessToken,
      spotify_token_expires_at: newExpiry.toISOString(),
    }).eq('id', user.id)
  }

  const res = await fetch(
    `https://api.spotify.com/v1/me/top/${type}?time_range=${timeRange}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Spotify API error' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
