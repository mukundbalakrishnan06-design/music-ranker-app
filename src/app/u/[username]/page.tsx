import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PublicProfile from '@/components/PublicProfile'

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: albums } = await supabase
    .from('albums')
    .select(`*, tracks(*, ratings:track_ratings(*))`)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  return <PublicProfile profile={profile} albums={albums ?? []} />
}
