'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlbumWithTracks } from '../library/LibraryTab'
import { getTier } from '@/types'
import Image from 'next/image'

interface Props {
  userId: string
}

export default function StatsTab({ userId }: Props) {
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

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500">Loading...</div>

  const allRatings = albums.flatMap(a =>
    a.tracks.flatMap(t => t.ratings.filter(r => r.user_id === userId).map(r => r.rating))
  )

  const albumAvgs = albums.map(a => {
    const ratings = a.tracks
      .map(t => t.ratings.find(r => r.user_id === userId)?.rating)
      .filter((r): r is number => r !== undefined)
    const avg = ratings.length ? ratings.reduce((x, y) => x + y, 0) / ratings.length : null
    return { album: a, avg, count: ratings.length }
  }).filter(x => x.avg !== null) as { album: AlbumWithTracks; avg: number; count: number }[]

  const topAlbums = [...albumAvgs].sort((a, b) => b.avg - a.avg).slice(0, 5)
  const bottomAlbums = [...albumAvgs].sort((a, b) => a.avg - b.avg).slice(0, 3)

  const topTracks = albums.flatMap(a =>
    a.tracks.map(t => ({
      track: t,
      album: a,
      rating: t.ratings.find(r => r.user_id === userId)?.rating ?? null,
    }))
  ).filter(x => x.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5) as { track: AlbumWithTracks['tracks'][0]; album: AlbumWithTracks; rating: number }[]

  const overallAvg = allRatings.length ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : null
  const totalRated = allRatings.length
  const totalTracks = albums.reduce((s, a) => s + a.tracks.length, 0)

  // Rating distribution buckets (0-1, 1-2, ..., 9-10)
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    label: `${i}–${i + 1}`,
    count: allRatings.filter(r => r >= i && r < i + 1).length,
  }))
  // handle exactly 10
  buckets[9].count += allRatings.filter(r => r === 10).length
  const maxBucket = Math.max(...buckets.map(b => b.count), 1)

  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-zinc-400 font-medium">No data yet</p>
        <p className="text-zinc-600 text-sm mt-1">Add albums and rate tracks to see your stats</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-100">Stats</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Your listening and rating breakdown</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Albums', value: albums.length },
          { label: 'Tracks', value: totalTracks },
          { label: 'Ratings', value: totalRated },
          { label: 'Avg Rating', value: overallAvg !== null ? overallAvg.toFixed(2) : '—' },
        ].map(card => (
          <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-zinc-100">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rating distribution */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Rating Distribution</h3>
          {allRatings.length === 0 ? (
            <p className="text-zinc-600 text-sm">No ratings yet</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {buckets.map(b => (
                <div key={b.label} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full bg-violet-600 rounded-t transition-all"
                    style={{ height: `${(b.count / maxBucket) * 100}%`, minHeight: b.count > 0 ? 4 : 0 }}
                  />
                  <span className="text-[10px] text-zinc-600">{b.label.split('–')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top tracks */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Top Tracks</h3>
          {topTracks.length === 0 ? (
            <p className="text-zinc-600 text-sm">No rated tracks yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topTracks.map(({ track, album, rating }, i) => {
                const tier = getTier(rating)
                return (
                  <div key={track.id} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600 w-4 text-right">{i + 1}</span>
                    <div className="relative w-7 h-7 rounded overflow-hidden bg-zinc-800 shrink-0">
                      {album.cover_url ? (
                        <Image src={album.cover_url} alt={album.title} fill className="object-cover" sizes="28px" />
                      ) : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">♪</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{track.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{album.artist}</p>
                    </div>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${tier?.bg ?? 'bg-zinc-700'} ${tier?.color ?? 'text-zinc-300'}`}>
                      {rating.toFixed(1)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top albums */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Best Albums</h3>
          {topAlbums.length === 0 ? (
            <p className="text-zinc-600 text-sm">No rated albums yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topAlbums.map(({ album, avg }, i) => {
                const tier = getTier(avg)
                return (
                  <div key={album.id} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600 w-4 text-right">{i + 1}</span>
                    <div className="relative w-8 h-8 rounded overflow-hidden bg-zinc-800 shrink-0">
                      {album.cover_url ? (
                        <Image src={album.cover_url} alt={album.title} fill className="object-cover" sizes="32px" />
                      ) : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">♪</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{album.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{album.artist}</p>
                    </div>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${tier?.bg ?? 'bg-zinc-700'} ${tier?.color ?? 'text-zinc-300'}`}>
                      {avg.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Lowest albums */}
        {bottomAlbums.length > 0 && albumAvgs.length >= 3 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Lowest Rated</h3>
            <div className="flex flex-col gap-2">
              {bottomAlbums.map(({ album, avg }, i) => {
                const tier = getTier(avg)
                return (
                  <div key={album.id} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600 w-4 text-right">{i + 1}</span>
                    <div className="relative w-8 h-8 rounded overflow-hidden bg-zinc-800 shrink-0">
                      {album.cover_url ? (
                        <Image src={album.cover_url} alt={album.title} fill className="object-cover" sizes="32px" />
                      ) : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">♪</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{album.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{album.artist}</p>
                    </div>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${tier?.bg ?? 'bg-zinc-700'} ${tier?.color ?? 'text-zinc-300'}`}>
                      {avg.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
