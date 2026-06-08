'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TIERS, getTier } from '@/types'
import { AlbumWithTracks } from '../library/LibraryTab'
import Image from 'next/image'

interface Props {
  userId: string
}

function getAvgRating(album: AlbumWithTracks, userId: string): number | null {
  const ratings = album.tracks
    .map(t => t.ratings.find(r => r.user_id === userId)?.rating)
    .filter((r): r is number => r !== undefined)
  if (ratings.length === 0) return null
  return ratings.reduce((a, b) => a + b, 0) / ratings.length
}

export default function RankingsTab({ userId }: Props) {
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

  const ratedAlbums = albums
    .map(a => ({ album: a, avg: getAvgRating(a, userId) }))
    .filter(({ avg }) => avg !== null) as { album: AlbumWithTracks; avg: number }[]

  const unrated = albums.filter(a => getAvgRating(a, userId) === null)

  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-zinc-400 font-medium">No albums in library</p>
        <p className="text-zinc-600 text-sm mt-1">Add albums and rate tracks to see your tier list</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-100">Rankings</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Albums ranked by average track rating</p>
      </div>

      <div className="flex flex-col gap-2">
        {TIERS.map(tier => {
          const tierAlbums = ratedAlbums
            .filter(({ avg }) => avg >= tier.min && avg <= tier.max)
            .sort((a, b) => b.avg - a.avg)

          return (
            <div key={tier.label} className="flex gap-0 rounded-xl overflow-hidden border border-zinc-800">
              <div className={`${tier.bg} w-14 flex items-center justify-center shrink-0`}>
                <span className={`text-2xl font-black ${tier.color}`}>{tier.label}</span>
              </div>
              <div className="flex-1 bg-zinc-900 p-3 min-h-[72px]">
                {tierAlbums.length === 0 ? (
                  <div className="h-full flex items-center">
                    <p className="text-zinc-700 text-sm italic">No albums</p>
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          )
        })}

        {unrated.length > 0 && (
          <div className="flex gap-0 rounded-xl overflow-hidden border border-zinc-800">
            <div className="bg-zinc-700 w-14 flex items-center justify-center shrink-0">
              <span className="text-lg font-black text-zinc-400">?</span>
            </div>
            <div className="flex-1 bg-zinc-900 p-3">
              <p className="text-xs text-zinc-600 mb-2">Unrated</p>
              <div className="flex flex-wrap gap-2">
                {unrated.map(album => (
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
                      <p className="text-xs text-zinc-500">No ratings</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
