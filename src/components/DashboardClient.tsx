'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import { Music, BarChart3, LogOut, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import LibraryTab from './library/LibraryTab'
import StatsTab from './stats/StatsTab'
import SpotifyTab from './spotify/SpotifyTab'

interface Props {
  user: User
  profile: (Profile & { spotify_connected?: boolean }) | null
}

type Tab = 'library' | 'stats' | 'spotify'

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
)

export default function DashboardClient({ user, profile }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('library')
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'there'
  const username = profile?.username

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'library', label: 'Library', icon: <Music className="w-4 h-4" /> },
    { key: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'spotify', label: 'Spotify', icon: <SpotifyIcon /> },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-zinc-100">Music Ranker</span>
          </div>
          <div className="flex items-center gap-3">
            {username && (
              <a
                href={`/u/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Public profile
              </a>
            )}
            <div className="text-sm text-zinc-400">
              Hey, <span className="text-zinc-200 font-medium">{displayName}</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-6">
        <div className="max-w-6xl mx-auto flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? tab.key === 'spotify'
                    ? 'border-[#1DB954] text-[#1DB954]'
                    : 'border-violet-500 text-violet-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.key === 'spotify' && profile?.spotify_connected && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'library' && <LibraryTab userId={user.id} />}
          {activeTab === 'stats' && <StatsTab userId={user.id} />}
          {activeTab === 'spotify' && profile && <SpotifyTab profile={profile} />}
        </div>
      </main>
    </div>
  )
}
