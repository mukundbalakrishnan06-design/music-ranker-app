'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import { Music, BarChart3, Compass, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import LibraryTab from './library/LibraryTab'
import StatsTab from './stats/StatsTab'

interface Props {
  user: User
  profile: (Profile & { spotify_connected?: boolean }) | null
}

type Tab = 'library' | 'stats'

export default function DashboardClient({ user, profile }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('library')
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'library', label: 'Library', icon: <Music className="w-5 h-5" /> },
    { key: 'stats', label: 'Stats', icon: <BarChart3 className="w-5 h-5" /> },
  ]

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col border-r border-zinc-800 bg-zinc-950 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-zinc-100 text-base">Music Ranker</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                activeTab === item.key
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <a
            href="/explore"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors w-full"
          >
            <Compass className="w-5 h-5" />
            Explore
          </a>
        </nav>

        {/* User */}
        <div className="border-t border-zinc-800 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{displayName}</p>
              {profile?.username && (
                <p className="text-xs text-zinc-500 truncate">@{profile.username}</p>
              )}
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {activeTab === 'library' && <LibraryTab userId={user.id} />}
          {activeTab === 'stats' && <StatsTab userId={user.id} profile={profile} />}
        </div>
      </main>
    </div>
  )
}
