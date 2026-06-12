import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/dashboard?spotify_error=access_denied`)
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!

  // Exchange code for tokens
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/dashboard?spotify_error=token_exchange`)
  }

  const tokens = await tokenRes.json()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

  // Save tokens to the user's profile
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/?error=not_logged_in`)
  }

  await supabase.from('profiles').update({
    spotify_access_token: tokens.access_token,
    spotify_refresh_token: tokens.refresh_token,
    spotify_token_expires_at: expiresAt.toISOString(),
    spotify_connected: true,
  }).eq('id', user.id)

  return NextResponse.redirect(`${origin}/dashboard?spotify_connected=true`)
}
