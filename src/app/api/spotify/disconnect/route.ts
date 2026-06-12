import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  await supabase.from('profiles').update({
    spotify_access_token: null,
    spotify_refresh_token: null,
    spotify_token_expires_at: null,
    spotify_connected: false,
  }).eq('id', user.id)

  return NextResponse.json({ success: true })
}
