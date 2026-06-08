'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Album, Track, TrackRating } from '@/types'
import { Plus } from 'lucide-react'
import AlbumCard from './AlbumCard'
import AlbumModal from './AlbumModal'
import AddAlbumModal from './AddAlbumModal'

interface Props {
  userId: string
}

export interface AlbumWithTracks extends Album {
  tracks: (Track & { ratings: TrackRating[] })[]
}

export default function LibraryTab({ userId }: Props) {
  const [albums, setAlbums] = useState<AlbumWithTracks[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithTracks | null>(null)
  const supabase = createClient()

  async function fetchAlbums() {
    const { data } = await supabase
      .from('albums')
      .select(`*, tracks(*, ratings:track_ratings(*))`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setAlbums((data as AlbumWithTracks[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchAlbums() }, [])

  async function handleDeleteAlbum(albumId: string) {
    await supabase.from('albums').delete().eq('id', albumId)
    setAlbums(prev => prev.filter(a => a.id !== albumId))
    setSelectedAlbum(null)
  }

  async function handleRateTrack(trackId: string, rating: number) {
    const { data } = await supabase
      .from('track_ratings')
      .upsert(
        { user_id: userId, track_id: trackId, rating },
        { onConflict: 'user_id,track_id' }
      )
      .select()
      .single()

    if (data) {
      setAlbums(prev => prev.map(album => ({
        ...album,
        tracks: album.tracks.map(track => {
          if (track.id !== trackId) return track
          const existing = track.ratings.find(r => r.user_id === userId)
          if (existing) {
            return { ...track, ratings: track.ratings.map(r => r.user_id === userId ? data : r) }
          }
          return { ...track, ratings: [...track.ratings, data] }
        })
      })))

      if (selectedAlbum) {
        setSelectedAlbum(prev => prev ? {
          ...prev,
          tracks: prev.tracks.map(track => {
            if (track.id !== trackId) return track
            const existing = track.ratings.find(r => r.user_id === userId)
            if (existing) {
              return { ...track, ratings: track.ratings.map(r => r.user_id === userId ? data : r) }
            }
            return { ...track, ratings: [...track.ratings, data] }
          })
        } : null)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading library...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Your Library</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{albums.length} album{albums.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Album
        </button>
      </div>

      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-medium">No albums yet</p>
          <p className="text-zinc-600 text-sm mt-1">Add an album to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albums.map(album => (
            <AlbumCard
              key={album.id}
              album={album}
              userId={userId}
              onClick={() => setSelectedAlbum(album)}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddAlbumModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onAdded={() => { fetchAlbums(); setShowAddModal(false) }}
        />
      )}

      {selectedAlbum && (
        <AlbumModal
          album={selectedAlbum}
          userId={userId}
          onClose={() => setSelectedAlbum(null)}
          onRate={handleRateTrack}
          onDelete={() => handleDeleteAlbum(selectedAlbum.id)}
          onUpdated={fetchAlbums}
        />
      )}
    </div>
  )
}
