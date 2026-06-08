import { NextRequest, NextResponse } from 'next/server'

async function getSpotifyToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error('Failed to get Spotify token')
  const data = await res.json()
  return data.access_token
}

function extractAlbumId(input: string): string | null {
  // Handle full Spotify URL or just the ID
  const urlMatch = input.match(/album\/([a-zA-Z0-9]+)/)
  if (urlMatch) return urlMatch[1]
  // Raw ID (22 chars alphanumeric)
  if (/^[a-zA-Z0-9]{22}$/.test(input.trim())) return input.trim()
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('url')

  if (!input) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  const albumId = extractAlbumId(input)
  if (!albumId) {
    return NextResponse.json({ error: 'Invalid Spotify album URL or ID' }, { status: 400 })
  }

  try {
    const token = await getSpotifyToken()

    const [albumRes, tracksRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])

    if (!albumRes.ok) {
      return NextResponse.json({ error: 'Album not found on Spotify' }, { status: 404 })
    }

    const album = await albumRes.json()
    const tracksData = await tracksRes.json()

    return NextResponse.json({
      spotify_id: album.id,
      title: album.name,
      artist: album.artists.map((a: { name: string }) => a.name).join(', '),
      cover_url: album.images[0]?.url ?? null,
      release_year: parseInt(album.release_date?.split('-')[0] ?? '0') || null,
      tracks: tracksData.items.map((t: {
        id: string
        name: string
        track_number: number
        duration_ms: number
      }) => ({
        spotify_id: t.id,
        title: t.name,
        track_number: t.track_number,
        duration_ms: t.duration_ms,
      })),
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch from Spotify' }, { status: 500 })
  }
}
