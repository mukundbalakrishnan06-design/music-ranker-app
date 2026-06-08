export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Album {
  id: string
  user_id: string
  title: string
  artist: string
  cover_url: string | null
  spotify_id: string | null
  release_year: number | null
  genre: string | null
  created_at: string
  tracks?: Track[]
}

export interface Track {
  id: string
  album_id: string
  title: string
  track_number: number
  duration_ms: number | null
  spotify_id: string | null
  ratings?: TrackRating[]
}

export interface TrackRating {
  id: string
  user_id: string
  track_id: string
  rating: number
  created_at: string
  updated_at: string
}

export interface AlbumWithRating extends Album {
  average_rating: number | null
  rated_tracks: number
  total_tracks: number
}

export type TierLabel = 'S' | 'A' | 'B' | 'C' | 'D' | 'F' | 'Unrated'

export interface Tier {
  label: TierLabel
  min: number
  max: number
  color: string
  bg: string
}

export const TIERS: Tier[] = [
  { label: 'S', min: 9, max: 10, color: 'text-yellow-900', bg: 'bg-yellow-400' },
  { label: 'A', min: 7.5, max: 8.99, color: 'text-green-900', bg: 'bg-green-400' },
  { label: 'B', min: 6, max: 7.49, color: 'text-blue-900', bg: 'bg-blue-400' },
  { label: 'C', min: 4.5, max: 5.99, color: 'text-purple-900', bg: 'bg-purple-400' },
  { label: 'D', min: 3, max: 4.49, color: 'text-orange-900', bg: 'bg-orange-400' },
  { label: 'F', min: 0, max: 2.99, color: 'text-red-900', bg: 'bg-red-400' },
]

export function getTier(rating: number | null): Tier | null {
  if (rating === null) return null
  return TIERS.find(t => rating >= t.min && rating <= t.max) ?? TIERS[TIERS.length - 1]
}
