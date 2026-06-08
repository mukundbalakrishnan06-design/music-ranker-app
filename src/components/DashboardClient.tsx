'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import { Music, BarChart3, TrendingUp, LogOut, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import LibraryTab from './library/LibraryTab'
import RankingsTab from './rankings/RankingsTab'
import StatsTab from './stats/StatsTab'

interface Props {
  user: User
  profile: Profile | null
}

type Tab = 'library' | 'rankings' | 'stats'

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
    { key: 'rankings', label: 'Rankings', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
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
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'library' && <LibraryTab userId={user.id} />}
          {activeTab === 'rankings' && <RankingsTab userId={user.id} />}
          {activeTab === 'stats' && <StatsTab userId={user.id} />}
        </div>
      </main>
    </div>
  )
}
