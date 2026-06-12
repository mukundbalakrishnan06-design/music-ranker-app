'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlbumWithTracks } from '../library/LibraryTab'
import { getTier, Profile } from '@/types'
import Image from 'next/image'
import SpotifyTab from '../spotify/SpotifyTab'

interface Props {
  userId: string
  profile: (Profile & { spotify_connected?: boolean }) | null
}

type View = 'library' | 'spotify'

export default function StatsTab({ userId, profile }: Props) {
  const [view, setView] = useState<View>('library')
  const [albums, setAlbums] = useState<AlbumWithTracks[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('albums')
      .select(`*, tracks(*, ratings:track_ratings(*))`)
      .eq('user_id', userId)
      .then(({ data }) => {
        setAlbums((data as AlbumWithTracks[]) ?? [])
        setLoading(false)
      })
  }, [])

  const albumAvgs = albums.map(a => {
    const ratings = a.tracks
      .map(t => t.ratings.find(r => r.user_id === userId)?.rating)
      .filter((r): r is number => r !== undefined)
    const avg = ratings.length ? ratings.reduce((x, y) => x + y, 0) / ratings.length : null
    return { album: a, avg }
  }).filter(x => x.avg !== null) as { album: AlbumWithTracks; avg: number }[]

  const topAlbums = [...albumAvgs].sort((a, b) => b.avg - a.avg)

  const topTracks = albums.flatMap(a =>
    a.tracks.map(t => ({
      track: t,
      album: a,
      rating: t.ratings.find(r => r.user_id === userId)?.rating ?? null,
    }))
  ).filter(x => x.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)) as {
      track: AlbumWithTracks['tracks'][0]
      album: AlbumWithTracks
      rating: number
    }[]

  const allRatings = albums.flatMap(a =>
    a.tracks.flatMap(t => t.ratings.filter(r => r.user_id === userId).map(r => r.rating))
  )
  const totalTracks = albums.reduce((s, a) => s + a.tracks.length, 0)

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header + toggle */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <h2 className="text-2xl font-bold text-zinc-100">Stats</h2>
        <div className="flex gap-2">
          {(['library', 'spotify'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors capitalize border ${
                view === v
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                  : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {v === 'spotify' ? 'Spotify' : 'Your Library'}
            </button>
          ))}
        </div>
      </div>

      {view === 'spotify' ? (
        <SpotifyTab profile={profile} />
      ) : loading ? (
        <div className="flex items-center justify-center h-64 text-zinc-500">Loading...</div>
      ) : albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-zinc-400 font-medium">No data yet</p>
          <p className="text-zinc-500 text-sm mt-1">Add albums and rate tracks to see your stats</p>
        </div>
      ) : (
        <>
          {/* Overview cards — 3 only */}
          <div className="grid grid-cols-3 gap-3 mb-5 shrink-0">
            {[
              { label: 'Albums', value: albums.length },
              { label: 'Tracks', value: totalTracks },
              { label: 'Ratings', value: allRatings.length },
            ].map(card => (
              <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-sm text-zinc-500 mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-zinc-100">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Two scrollable boxes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Best Albums */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col min-h-0">
              <h3 className="text-base font-semibold text-zinc-200 px-5 pt-5 pb-3 shrink-0">Best Albums</h3>
              <div className="overflow-y-auto flex-1 px-5 pb-5">
                {topAlbums.length === 0 ? (
                  <p className="text-zinc-600 text-sm">No rated albums yet</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {topAlbums.map(({ album, avg }, i) => {
                      const tier = getTier(avg)
                      return (
                        <div key={album.id} className="flex items-center gap-3">
                          <span className="text-sm text-zinc-500 w-5 text-right shrink-0 font-mono">{i + 1}</span>
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                            {album.cover_url ? (
                              <Image src={album.cover_url} alt={album.title} fill className="object-cover" sizes="40px" />
                            ) : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">♪</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-100 truncate">{album.title}</p>
                            <p className="text-xs text-zinc-500 truncate">{album.artist}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${tier?.bg ?? 'bg-zinc-700'} ${tier?.color ?? 'text-zinc-300'}`}>
                            {avg.toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Top Tracks */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col min-h-0">
              <h3 className="text-base font-semibold text-zinc-200 px-5 pt-5 pb-3 shrink-0">Top Tracks</h3>
              <div className="overflow-y-auto flex-1 px-5 pb-5">
                {topTracks.length === 0 ? (
                  <p className="text-zinc-600 text-sm">No rated tracks yet</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {topTracks.map(({ track, album, rating }, i) => {
                      const tier = getTier(rating)
                      return (
                        <div key={track.id} className="flex items-center gap-3">
                          <span className="text-sm text-zinc-500 w-5 text-right shrink-0 font-mono">{i + 1}</span>
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                            {album.cover_url ? (
                              <Image src={album.cover_url} alt={album.title} fill className="object-cover" sizes="40px" />
                            ) : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">♪</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-100 truncate">{track.title}</p>
                            <p className="text-xs text-zinc-500 truncate">{album.artist}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${tier?.bg ?? 'bg-zinc-700'} ${tier?.color ?? 'text-zinc-300'}`}>
                            {rating.toFixed(1)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
