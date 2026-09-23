import type { SpotifyTrack } from '~/types'

interface SpotifyPlaylistItem {
  item?: SpotifyApiTrack
  track?: SpotifyApiTrack
}

interface SpotifyApiTrack {
  id: string
  type?: string
  name: string
  artists?: Array<{ name: string }>
  album?: {
    name: string
    images?: Array<{ url: string }>
    release_date?: string
  }
  preview_url?: string | null
  duration_ms?: number
  external_urls?: { spotify?: string }
}

export default defineEventHandler(async (event) => {
  const playlistId = getRouterParam(event, 'id')
  const accessToken = getAccessToken(event)

  if (!playlistId) {
    throw createError({
      statusCode: 400,
      message: 'Playlist ID is required'
    })
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    const responseBody = await readSpotifyResponse(response)

    if (!response.ok) {
      console.error('Spotify playlist items request failed:', response.status, responseBody)
      throw createError({
        statusCode: getSpotifyStatusCode(response.status),
        message: getSpotifyErrorMessage(response.status, responseBody)
      })
    }

    const items = Array.isArray((responseBody as { items?: unknown }).items)
      ? (responseBody as { items: SpotifyPlaylistItem[] }).items
      : []

    const tracks = items
      .map(item => item.item ?? item.track)
      .filter(isPlayableTrack)
      .map(toSpotifyTrack)

    return { tracks }
  } catch (error) {
    if (isError(error)) throw error

    console.error('Spotify playlist items request could not be completed:', error)
    throw createError({
      statusCode: 502,
      message: 'Could not connect to Spotify. Please try again.'
    })
  }
})

function isPlayableTrack(track: SpotifyApiTrack | undefined): track is SpotifyApiTrack {
  return Boolean(
    track
    && track.type === 'track'
    && track.album?.release_date
    && track.artists?.length
  )
}

function toSpotifyTrack(track: SpotifyApiTrack): SpotifyTrack {
  return {
    id: track.id,
    name: track.name,
    artist: track.artists?.map(artist => artist.name).join(', ') ?? 'Unknown artist',
    album: track.album?.name ?? 'Unknown album',
    albumImageUrl: track.album?.images?.[0]?.url ?? '',
    previewUrl: track.preview_url ?? null,
    releaseYear: Number.parseInt(track.album?.release_date ?? '0', 10),
    durationMs: track.duration_ms ?? 0,
    spotifyUrl: track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`
  }
}

function getAccessToken(event: Parameters<typeof getHeader>[0]): string {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Spotify access token is missing'
    })
  }

  return authHeader.slice('Bearer '.length)
}

async function readSpotifyResponse(response: Response): Promise<unknown> {
  const body = await response.text()
  if (!body) return {}

  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}

function getSpotifyErrorMessage(status: number, body: unknown): string {
  if (status === 401) {
    return 'Spotify session expired. Please connect Spotify again.'
  }

  if (typeof body === 'object' && body !== null && 'error' in body) {
    const error = (body as { error?: { message?: string } }).error
    if (error?.message) return `Spotify error: ${error.message}`
  }

  if (status === 403) {
    return 'Spotify denied access to this playlist. Use a playlist you own or collaborate on, then reconnect Spotify if needed.'
  }

  return `Spotify playlist request failed with status ${status}`
}

function getSpotifyStatusCode(status: number): number {
  return [401, 403, 404].includes(status) ? status : 502
}
