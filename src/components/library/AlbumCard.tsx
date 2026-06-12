'use client'

import { AlbumWithTracks } from './LibraryTab'
import { getTier } from '@/types'
import Image from 'next/image'

interface Props {
  album: AlbumWithTracks
  userId: string
  onClick: () => void
}

function getAlbumAvgRating(album: AlbumWithTracks, userId: string): number | null {
  const ratings = album.tracks
    .map(t => t.ratings.find(r => r.user_id === userId)?.rating)
    .filter((r): r is number => r !== undefined)

  if (ratings.length === 0) return null
  return ratings.reduce((a, b) => a + b, 0) / ratings.length
}

export default function AlbumCard({ album, userId, onClick }: Props) {
  const avg = getAlbumAvgRating(album, userId)
  const tier = getTier(avg)
  const ratedCount = album.tracks.filter(t => t.ratings.some(r => r.user_id === userId)).length

  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-2 text-left hover:opacity-90 transition-opacity"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800 w-full">
        {album.cover_url ? (
          <Image
            src={album.cover_url}
            alt={album.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">♪</div>
        )}
        {tier && (
          <div className={`absolute top-2 right-2 w-7 h-7 rounded-lg ${tier.bg} flex items-center justify-center`}>
            <span className={`text-xs font-bold ${tier.color}`}>{tier.label}</span>
          </div>
        )}
      </div>
      <div className="px-0.5">
        <p className="text-sm font-semibold text-zinc-100 truncate">{album.title}</p>
        <p className="text-sm text-zinc-400 truncate">{album.artist}</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {ratedCount}/{album.tracks.length} rated
          {avg !== null && <span className="text-zinc-300 font-medium"> · {avg.toFixed(1)}</span>}
        </p>
      </div>
    </button>
  )
}
