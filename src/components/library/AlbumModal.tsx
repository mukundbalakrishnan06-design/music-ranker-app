'use client'

import { useState } from 'react'
import { AlbumWithTracks } from './LibraryTab'
import { Track, TrackRating } from '@/types'
import { X, Trash2, Edit2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Props {
  album: AlbumWithTracks
  userId: string
  onClose: () => void
  onRate: (trackId: string, rating: number) => void
  onDelete: () => void
  onUpdated: () => void
}

function formatDuration(ms: number | null): string {
  if (!ms) return ''
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function RatingSlider({ track, userId, onRate }: {
  track: Track & { ratings: TrackRating[] }
  userId: string
  onRate: (trackId: string, rating: number) => void
}) {
  const existing = track.ratings.find(r => r.user_id === userId)
  const [value, setValue] = useState<number>(existing?.rating ?? 0)

  function handleCommit() {
    if (value > 0) onRate(track.id, value)
  }

  const color = value >= 9 ? '#facc15' : value >= 7.5 ? '#4ade80' : value >= 6 ? '#60a5fa' : value >= 4.5 ? '#c084fc' : value >= 3 ? '#fb923c' : '#f87171'

  return (
    <div className="flex items-center gap-3 min-w-0">
      <input
        type="range"
        min={0}
        max={10}
        step={0.5}
        value={value}
        onChange={e => setValue(parseFloat(e.target.value))}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        className="flex-1 h-1.5"
        style={{ accentColor: color }}
      />
      <span
        className="text-sm font-mono font-semibold w-8 text-right shrink-0"
        style={{ color: value > 0 ? color : '#52525b' }}
      >
        {value > 0 ? value.toFixed(1) : '—'}
      </span>
    </div>
  )
}

function TrackRow({ track, userId, onRate, editMode, onSaveTrack, onDeleteTrack }: {
  track: Track & { ratings: TrackRating[] }
  userId: string
  onRate: (trackId: string, rating: number) => void
  editMode: boolean
  onSaveTrack: (trackId: string, title: string) => void
  onDeleteTrack: (trackId: string) => void
}) {
  const [editTitle, setEditTitle] = useState(track.title)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 group">
      <span className="text-xs text-zinc-600 w-5 text-right shrink-0">{track.track_number}</span>
      <div className="flex-1 min-w-0">
        {editMode ? (
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={() => onSaveTrack(track.id, editTitle)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
          />
        ) : (
          <>
            <p className="text-sm text-zinc-200 truncate">{track.title}</p>
            {track.duration_ms && (
              <p className="text-xs text-zinc-600">{formatDuration(track.duration_ms)}</p>
            )}
          </>
        )}
      </div>
      {editMode ? (
        confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onDeleteTrack(track.id)}
              className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="shrink-0 p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-zinc-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )
      ) : (
        <div className="w-44 shrink-0">
          <RatingSlider track={track} userId={userId} onRate={onRate} />
        </div>
      )}
    </div>
  )
}

export default function AlbumModal({ album, userId, onClose, onRate, onDelete, onUpdated }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [editTitle, setEditTitle] = useState(album.title)
  const [editArtist, setEditArtist] = useState(album.artist)
  const [editYear, setEditYear] = useState(String(album.release_year ?? ''))
  const [editGenre, setEditGenre] = useState(album.genre ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const supabase = createClient()

  const userRatings = album.tracks
    .map(t => t.ratings.find(r => r.user_id === userId)?.rating)
    .filter((r): r is number => r !== undefined)
  const avg = userRatings.length ? (userRatings.reduce((a, b) => a + b, 0) / userRatings.length) : null

  async function saveAlbumEdit() {
    setSaving(true)
    await supabase.from('albums').update({
      title: editTitle,
      artist: editArtist,
      release_year: editYear ? parseInt(editYear) : null,
      genre: editGenre || null,
    }).eq('id', album.id)
    setSaving(false)
    setEditMode(false)
    onUpdated()
  }

  async function saveTrack(trackId: string, title: string) {
    if (!title.trim()) return
    await supabase.from('tracks').update({ title: title.trim() }).eq('id', trackId)
    onUpdated()
  }

  async function deleteTrack(trackId: string) {
    await supabase.from('tracks').delete().eq('id', trackId)
    onUpdated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-zinc-800 shrink-0">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
            {album.cover_url ? (
              <Image src={album.cover_url} alt={album.title} fill className="object-cover" sizes="80px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-3xl">♪</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editMode ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                  placeholder="Album title"
                />
                <input
                  value={editArtist}
                  onChange={e => setEditArtist(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                  placeholder="Artist"
                />
                <div className="flex gap-2">
                  <input
                    value={editYear}
                    onChange={e => setEditYear(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 w-24"
                    placeholder="Year"
                  />
                  <input
                    value={editGenre}
                    onChange={e => setEditGenre(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 flex-1"
                    placeholder="Genre"
                  />
                </div>
                <p className="text-xs text-zinc-500">Track names are editable in the list below</p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-zinc-100 truncate">{album.title}</h2>
                <p className="text-sm text-zinc-400">{album.artist}</p>
                {(album.release_year || album.genre) && (
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {[album.release_year, album.genre].filter(Boolean).join(' · ')}
                  </p>
                )}
                {avg !== null && (
                  <p className="text-sm font-semibold text-violet-400 mt-1">
                    Avg: {avg.toFixed(2)} / 10
                  </p>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {editMode ? (
              <button
                onClick={saveAlbumEdit}
                disabled={saving}
                className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button onClick={onDelete} className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors">
                  Confirm
                </button>
                <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tracks */}
        <div className="overflow-y-auto flex-1 p-2">
          {editMode && (
            <p className="text-xs text-zinc-500 px-3 py-2">Edit track names inline · click trash to remove a track</p>
          )}
          {album.tracks.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">No tracks</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {album.tracks
                .sort((a, b) => a.track_number - b.track_number)
                .map(track => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    userId={userId}
                    onRate={onRate}
                    editMode={editMode}
                    onSaveTrack={saveTrack}
                    onDeleteTrack={deleteTrack}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
