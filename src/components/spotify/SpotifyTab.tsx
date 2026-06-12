'use client'

import { useEffect, useState, useCallback } from 'react'
import { Profile } from '@/types'

interface Props {
  profile: (Profile & { spotify_connected?: boolean }) | null
}

type TimeRange = 'short_term' | 'medium_term' | 'long_term'
type ViewType = 'tracks' | 'artists'

const TIME_LABELS: { key: TimeRange; label: string }[] = [
  { key: 'short_term', label: 'Last 4 weeks' },
  { key: 'medium_term', label: 'Last 6 months' },
  { key: 'long_term', label: 'Last 12 months' },
]

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: { name: string; images: { url: string }[] }
}

interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  images: { url: string }[]
  followers: { total: number } | null
}

export default function SpotifyTab({ profile }: Props) {
  const [connected, setConnected] = useState(profile?.spotify_connected ?? false)
  const [timeRange, setTimeRange] = useState<TimeRange>('short_term')
  const [viewType, setViewType] = useState<ViewType>('tracks')
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [artists, setArtists] = useState<SpotifyArtist[]>([])
  const [loading, setLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!connected) return
    setLoading(true)
    try {
      const res = await fetch(`/api/spotify/me?type=${viewType}&time_range=${timeRange}&limit=50`)
      if (!res.ok) {
        if (res.status === 403) setConnected(false)
        return
      }
      const data = await res.json()
      const items = Array.isArray(data.items) ? data.items : []
      if (viewType === 'tracks') setTracks(items)
      else setArtists(items)
    } finally {
      setLoading(false)
    }
  }, [connected, viewType, timeRange])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('spotify_connected') === 'true') {
      setConnected(true)
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  async function disconnect() {
    setDisconnecting(true)
    await fetch('/api/spotify/disconnect', { method: 'POST' })
    setConnected(false)
    setTracks([])
    setArtists([])
    setDisconnecting(false)
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#1DB954]/10 flex items-center justify-center mb-2">
          <SpotifyLogo className="w-8 h-8 fill-[#1DB954]" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-100">Connect Spotify</h2>
        <p className="text-zinc-500 text-sm max-w-xs">
          See your top artists and tracks from your personal listening history
        </p>
        <a
          href="/api/spotify/auth"
          className="mt-2 flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold px-6 py-3 rounded-full transition-colors text-sm"
        >
          <SpotifyLogo className="w-4 h-4 fill-black" />
          Connect with Spotify
        </a>
      </div>
    )
  }

  const items = viewType === 'tracks' ? tracks : artists

  return (
    <div className="flex flex-col gap-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* View type pills */}
        <div className="flex gap-2">
          {(['tracks', 'artists'] as ViewType[]).map(v => (
            <button
              key={v}
              onClick={() => setViewType(v)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors capitalize border ${
                viewType === v
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                  : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Time range pills */}
        <div className="flex gap-2">
          {TIME_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                timeRange === key
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                  : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-[#1DB954]">
            <SpotifyLogo className="w-4 h-4 fill-[#1DB954]" />
            Connected
          </div>
          <button
            onClick={disconnect}
            disabled={disconnecting}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-zinc-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-zinc-600">No data for this period</div>
        ) : viewType === 'tracks' ? (
          <div className="divide-y divide-zinc-800/60">
            {tracks.map((track, i) => (
              <div key={track.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/40 transition-colors">
                <span className="text-base text-zinc-500 w-7 text-right shrink-0 font-mono">{i + 1}</span>
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                  {track.album.images[0]?.url ? (
                    <img src={track.album.images[0].url} alt={track.name} className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-zinc-600">♪</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-zinc-100 truncate">{track.name}</p>
                  <p className="text-sm text-zinc-400 truncate">
                    {track.artists.map(a => a.name).join(', ')} · {track.album.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {artists.map((artist, i) => {
              const imageUrl = artist.images?.[0]?.url ?? null
              const genres = Array.isArray(artist.genres) ? artist.genres.slice(0, 2).join(', ') : ''
              const followers = artist.followers?.total ?? null
              return (
                <div key={artist.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/40 transition-colors">
                  <span className="text-base text-zinc-500 w-7 text-right shrink-0 font-mono">{i + 1}</span>
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-zinc-600">♪</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-zinc-100 truncate">{artist.name}</p>
                    <p className="text-sm text-zinc-400 truncate capitalize">
                      {genres || (followers !== null ? `${followers.toLocaleString()} followers` : 'Artist')}
                    </p>
                  </div>
                  {followers !== null && genres && (
                    <p className="text-sm text-zinc-500 shrink-0">{followers.toLocaleString()}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function SpotifyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}
