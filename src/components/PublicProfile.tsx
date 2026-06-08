import { Profile, TIERS, getTier } from '@/types'
import { AlbumWithTracks } from './library/LibraryTab'
import Image from 'next/image'
import { Music } from 'lucide-react'

interface Props {
  profile: Profile
  albums: AlbumWithTracks[]
}

function getAvgRating(album: AlbumWithTracks, userId: string): number | null {
  const ratings = album.tracks
    .map(t => t.ratings.find(r => r.user_id === userId)?.rating)
    .filter((r): r is number => r !== undefined)
  if (ratings.length === 0) return null
  return ratings.reduce((a, b) => a + b, 0) / ratings.length
}

export default function PublicProfile({ profile, albums }: Props) {
  const albumAvgs = albums.map(a => ({
    album: a,
    avg: getAvgRating(a, profile.id),
  }))

  const ratedAlbums = albumAvgs.filter(x => x.avg !== null) as { album: AlbumWithTracks; avg: number }[]
  const unrated = albumAvgs.filter(x => x.avg === null).map(x => x.album)

  const overallAvg = ratedAlbums.length
    ? ratedAlbums.reduce((s, x) => s + x.avg, 0) / ratedAlbums.length
    : null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <Music className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-zinc-100">Music Ranker</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-violet-700 flex items-center justify-center text-2xl font-bold text-white">
            {(profile.display_name || profile.username)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-zinc-500 text-sm">@{profile.username}</p>
            {overallAvg !== null && (
              <p className="text-zinc-400 text-sm mt-0.5">
                {albums.length} albums · avg {overallAvg.toFixed(2)} / 10
              </p>
            )}
          </div>
        </div>

        {/* Tier list */}
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Rankings</h2>
        {ratedAlbums.length === 0 ? (
          <p className="text-zinc-600">No rated albums yet.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-8">
            {TIERS.map(tier => {
              const tierAlbums = ratedAlbums
                .filter(({ avg }) => avg >= tier.min && avg <= tier.max)
                .sort((a, b) => b.avg - a.avg)
              if (tierAlbums.length === 0) return null

              return (
                <div key={tier.label} className="flex gap-0 rounded-xl overflow-hidden border border-zinc-800">
                  <div className={`${tier.bg} w-12 flex items-center justify-center shrink-0`}>
                    <span className={`text-xl font-black ${tier.color}`}>{tier.label}</span>
                  </div>
                  <div className="flex-1 bg-zinc-900 p-3">
                    <div className="flex flex-wrap gap-2">
                      {tierAlbums.map(({ album, avg }) => (
                        <div key={album.id} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-2 py-1.5">
                          <div className="relative w-8 h-8 rounded overflow-hidden bg-zinc-700 shrink-0">
                            {album.cover_url ? (
                              <Image src={album.cover_url} alt={album.title} fill className="object-cover" sizes="32px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">♪</div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-zinc-200 max-w-[120px] truncate">{album.title}</p>
                            <p className="text-xs text-zinc-500">{avg.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* All albums grid */}
        {albums.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Library</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums.map(album => {
                const avg = getAvgRating(album, profile.id)
                const tier = getTier(avg)
                return (
                  <div key={album.id} className="flex flex-col gap-2">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                      {album.cover_url ? (
                        <Image src={album.cover_url} alt={album.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, 20vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">♪</div>
                      )}
                      {tier && (
                        <div className={`absolute top-2 right-2 w-7 h-7 rounded-lg ${tier.bg} flex items-center justify-center`}>
                          <span className={`text-xs font-bold ${tier.color}`}>{tier.label}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-100 truncate">{album.title}</p>
                      <p className="text-xs text-zinc-500 truncate">{album.artist}</p>
                      {avg !== null && <p className="text-xs text-zinc-600">{avg.toFixed(2)}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
