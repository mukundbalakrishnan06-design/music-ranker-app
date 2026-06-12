'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Profile } from '@/types'

interface Props {
  profile: Profile & {
    spotify_connected?: boolean
  }
}

type TimeRange = 'short_term' | 'medium_term' | 'long_term'
type ViewType = 'tracks' | 'artists'

const TIME_LABELS: Record<TimeRange, string> = {
  short_term: 'Last 4 weeks',
  medium_term: 'Last 6 months',
  long_term: 'All time',
}

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: { name: string; images: { url: string }[] }
  popularity: number
}

interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  images: { url: string }[]
  popularity: number
  followers: { total: number }
}

export default function SpotifyTab({ profile }: Props) {
  const [connected, setConnected] = useState(profile.spotify_connected ?? false)
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term')
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
      if (viewType === 'tracks') setTracks(data.items ?? [])
      else setArtists(data.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [connected, viewType, timeRange])

  useEffect(() => { fetchData() }, [fetchData])

  // Check URL params for post-OAuth redirect
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
      <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#1DB954]/10 flex items-center justify-center mb-2">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#1DB954]">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-100">Connect Spotify</h2>
        <p className="text-zinc-500 text-sm max-w-xs">
          See your top artists and tracks from your personal listening history
        </p>
        <a
          href="/api/spotify/auth"
          className="mt-2 flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold px-6 py-3 rounded-full transition-colors text-sm"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect with Spotify
        </a>
      </div>
    )
  }

  const items = viewType === 'tracks' ? tracks : artists

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          {/* View type toggle */}
          <div className="flex rounded-lg bg-zinc-800 p-1">
            {(['tracks', 'artists'] as ViewType[]).map(v => (
              <button
                key={v}
                onClick={() => setViewType(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  viewType === v ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Time range toggle */}
          <div className="flex rounded-lg bg-zinc-800 p-1">
            {(Object.entries(TIME_LABELS) as [TimeRange, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeRange === key ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#1DB954]">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#1DB954]">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
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
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
          <h3 className="text-sm font-semibold text-zinc-300">
            Top {viewType === 'tracks' ? 'Tracks' : 'Artists'} · {TIME_LABELS[timeRange]}
          </h3>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-zinc-500 text-sm">Loading...</div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">No data for this period</div>
          ) : viewType === 'tracks' ? (
            <div className="divide-y divide-zinc-800/50">
              {tracks.map((track, i) => (
                <div key={track.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors">
                  <span className="text-sm text-zinc-600 w-6 text-right shrink-0 font-mono">{i + 1}</span>
                  <div className="relative w-10 h-10 rounded overflow-hidden bg-zinc-800 shrink-0">
                    {track.album.images[0]?.url ? (
                      <Image src={track.album.images[0].url} alt={track.name} fill className="object-cover" sizes="40px" />
                    ) : <div className="w-full h-full flex items-center justify-center text-zinc-600">♪</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{track.name}</p>
                    <p className="text-xs text-zinc-500 truncate">
                      {track.artists.map(a => a.name).join(', ')} · {track.album.name}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1DB954] rounded-full" style={{ width: `${track.popularity}%` }} />
                      </div>
                      <span className="text-[10px] text-zinc-600 w-6">{track.popularity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {artists.map((artist, i) => (
                <div key={artist.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors">
                  <span className="text-sm text-zinc-600 w-6 text-right shrink-0 font-mono">{i + 1}</span>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                    {artist.images[0]?.url ? (
                      <Image src={artist.images[0].url} alt={artist.name} fill className="object-cover" sizes="40px" />
                    ) : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-lg">♪</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{artist.name}</p>
                    <p className="text-xs text-zinc-500 truncate capitalize">
                      {artist.genres.slice(0, 3).join(', ') || 'No genres'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-zinc-500">{artist.followers.total.toLocaleString()} followers</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1DB954] rounded-full" style={{ width: `${artist.popularity}%` }} />
                      </div>
                      <span className="text-[10px] text-zinc-600 w-6">{artist.popularity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
