'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Link, PenLine, Loader2 } from 'lucide-react'

interface Props {
  userId: string
  onClose: () => void
  onAdded: () => void
}

type Mode = 'choose' | 'spotify' | 'manual'

interface SpotifyTrack {
  spotify_id: string
  title: string
  track_number: number
  duration_ms: number
}

interface SpotifyAlbumData {
  spotify_id: string
  title: string
  artist: string
  cover_url: string | null
  release_year: number | null
  tracks: SpotifyTrack[]
}

export default function AddAlbumModal({ userId, onClose, onAdded }: Props) {
  const [mode, setMode] = useState<Mode>('choose')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [spotifyData, setSpotifyData] = useState<SpotifyAlbumData | null>(null)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Manual form
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [year, setYear] = useState('')
  const [genre, setGenre] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [tracksRaw, setTracksRaw] = useState('')

  const supabase = createClient()

  async function fetchSpotify() {
    if (!spotifyUrl.trim()) return
    setFetching(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/spotify/album?url=${encodeURIComponent(spotifyUrl.trim())}`)
      if (!res.ok) {
        const err = await res.json()
        setFetchError(err.error ?? 'Failed to fetch album')
        return
      }
      const data = await res.json()
      setSpotifyData(data)
    } catch {
      setFetchError('Network error')
    } finally {
      setFetching(false)
    }
  }

  async function saveSpotifyAlbum() {
    if (!spotifyData) return
    setSaving(true)
    const { data: album, error } = await supabase
      .from('albums')
      .insert({
        user_id: userId,
        title: spotifyData.title,
        artist: spotifyData.artist,
        cover_url: spotifyData.cover_url,
        spotify_id: spotifyData.spotify_id,
        release_year: spotifyData.release_year,
      })
      .select()
      .single()

    if (error || !album) { setSaving(false); return }

    await supabase.from('tracks').insert(
      spotifyData.tracks.map(t => ({
        album_id: album.id,
        title: t.title,
        track_number: t.track_number,
        duration_ms: t.duration_ms,
        spotify_id: t.spotify_id,
      }))
    )

    setSaving(false)
    onAdded()
  }

  async function saveManualAlbum() {
    if (!title.trim() || !artist.trim()) return
    setSaving(true)

    const { data: album, error } = await supabase
      .from('albums')
      .insert({
        user_id: userId,
        title: title.trim(),
        artist: artist.trim(),
        cover_url: coverUrl.trim() || null,
        release_year: year ? parseInt(year) : null,
        genre: genre.trim() || null,
      })
      .select()
      .single()

    if (error || !album) { setSaving(false); return }

    const lines = tracksRaw.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length > 0) {
      await supabase.from('tracks').insert(
        lines.map((title, i) => ({
          album_id: album.id,
          title,
          track_number: i + 1,
        }))
      )
    }

    setSaving(false)
    onAdded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="font-semibold text-zinc-100">Add Album</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {mode === 'choose' && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setMode('spotify')}
                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
                  <Link className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-zinc-100">Spotify Link</p>
                  <p className="text-xs text-zinc-500">Paste a Spotify album URL to auto-fill</p>
                </div>
              </button>
              <button
                onClick={() => setMode('manual')}
                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                  <PenLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-zinc-100">Manual Entry</p>
                  <p className="text-xs text-zinc-500">Enter album details yourself</p>
                </div>
              </button>
            </div>
          )}

          {mode === 'spotify' && (
            <div className="flex flex-col gap-4">
              {!spotifyData ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1">Spotify Album URL</label>
                    <input
                      value={spotifyUrl}
                      onChange={e => setSpotifyUrl(e.target.value)}
                      placeholder="https://open.spotify.com/album/..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  {fetchError && <p className="text-red-400 text-xs">{fetchError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setMode('choose')} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
                      Back
                    </button>
                    <button
                      onClick={fetchSpotify}
                      disabled={fetching || !spotifyUrl.trim()}
                      className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch Album'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl">
                    {spotifyData.cover_url && (
                      <img src={spotifyData.cover_url} alt={spotifyData.title} className="w-14 h-14 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-medium text-zinc-100">{spotifyData.title}</p>
                      <p className="text-sm text-zinc-400">{spotifyData.artist}</p>
                      <p className="text-xs text-zinc-600">{spotifyData.tracks.length} tracks · {spotifyData.release_year}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSpotifyData(null)} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
                      Try again
                    </button>
                    <button
                      onClick={saveSpotifyAlbum}
                      disabled={saving}
                      className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Library'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {mode === 'manual' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">Album Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500" placeholder="Album name" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">Artist *</label>
                <input value={artist} onChange={e => setArtist(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500" placeholder="Artist name" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-zinc-400 block mb-1">Year</label>
                  <input value={year} onChange={e => setYear(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500" placeholder="2024" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-zinc-400 block mb-1">Genre</label>
                  <input value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500" placeholder="Genre" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">Cover URL (optional)</label>
                <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500" placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">Tracks (one per line)</label>
                <textarea
                  value={tracksRaw}
                  onChange={e => setTracksRaw(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
                  placeholder={"Track 1\nTrack 2\nTrack 3"}
                  rows={4}
                />
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setMode('choose')} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
                  Back
                </button>
                <button
                  onClick={saveManualAlbum}
                  disabled={saving || !title.trim() || !artist.trim()}
                  className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Library'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
