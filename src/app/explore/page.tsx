import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Music, ArrowLeft } from 'lucide-react'

export default async function ExplorePage() {
  const supabase = await createClient()

  // Fetch all profiles with their albums + ratings
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, created_at')
    .order('created_at', { ascending: false })

  // Fetch albums for all users to get stats
  const { data: albums } = await supabase
    .from('albums')
    .select('id, user_id, title, artist, cover_url, tracks(id, ratings:track_ratings(rating, user_id))')

  // Build per-user stats
  const userStats = (profiles ?? []).map(profile => {
    const userAlbums = (albums ?? []).filter(a => a.user_id === profile.id)
    const covers = userAlbums
      .filter(a => a.cover_url)
      .slice(0, 3)
      .map(a => a.cover_url as string)

    const allRatings = userAlbums.flatMap(a =>
      (a.tracks as { id: string; ratings: { rating: number; user_id: string }[] }[])
        .flatMap(t => t.ratings.filter(r => r.user_id === profile.id).map(r => r.rating))
    )
    const avgRating = allRatings.length
      ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
      : null

    return {
      ...profile,
      albumCount: userAlbums.length,
      ratingCount: allRatings.length,
      avgRating,
      covers,
    }
  })

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="w-px h-4 bg-zinc-700" />
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <Music className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-zinc-100">Explore</span>
            </div>
          </div>
          <p className="text-sm text-zinc-500">{profiles?.length ?? 0} users</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8">
        {userStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-zinc-400 font-medium">No users yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userStats.map(user => (
              <Link
                key={user.id}
                href={`/u/${user.username}`}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all group"
              >
                {/* Album covers strip */}
                <div className="flex gap-2 mb-4">
                  {user.covers.length > 0 ? (
                    <>
                      {user.covers.map((url, i) => (
                        <div key={i} className="relative flex-1 aspect-square rounded-xl overflow-hidden bg-zinc-800">
                          <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                        </div>
                      ))}
                      {/* Fill empty slots */}
                      {Array.from({ length: 3 - user.covers.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="flex-1 aspect-square rounded-xl bg-zinc-800" />
                      ))}
                    </>
                  ) : (
                    <div className="w-full h-20 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600">
                      <Music className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* User info */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {(user.display_name || user.username)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-sm text-zinc-500">@{user.username}</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-800">
                  <div>
                    <p className="text-lg font-bold text-zinc-100">{user.albumCount}</p>
                    <p className="text-xs text-zinc-500">albums</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-zinc-100">{user.ratingCount}</p>
                    <p className="text-xs text-zinc-500">ratings</p>
                  </div>
                  {user.avgRating !== null && (
                    <div>
                      <p className="text-lg font-bold text-violet-400">{user.avgRating.toFixed(1)}</p>
                      <p className="text-xs text-zinc-500">avg</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
