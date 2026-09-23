interface SpotifyPlaylistApiResponse {
  items?: Array<{
    id: string
    name: string
    description: string | null
    images?: Array<{ url: string }>
    owner?: { display_name?: string }
    tracks?: { total?: number }
    items?: { total?: number }
  }>
}

export default defineEventHandler(async (event) => {
  const accessToken = getAccessToken(event)

  try {
    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    const responseBody = await readSpotifyResponse(response)

    if (!response.ok) {
      console.error('Spotify playlists request failed:', response.status, responseBody)
      throw createError({
        statusCode: getSpotifyStatusCode(response.status),
        message: getSpotifyErrorMessage(response.status, responseBody)
      })
    }

    const data = responseBody as SpotifyPlaylistApiResponse
    const playlists = (data.items ?? []).map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description ?? '',
      imageUrl: playlist.images?.[0]?.url ?? '',
      owner: playlist.owner?.display_name ?? 'Spotify user',
      trackCount: playlist.items?.total ?? playlist.tracks?.total ?? 0
    }))

    return { playlists }
  } catch (error) {
    if (isError(error)) throw error

    console.error('Spotify playlists request could not be completed:', error)
    throw createError({
      statusCode: 502,
      message: 'Could not connect to Spotify. Please try again.'
    })
  }
})

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
    return 'Spotify denied access to your playlists. Log out and connect Spotify again to grant playlist-read permission.'
  }

  return `Spotify playlists request failed with status ${status}`
}

function getSpotifyStatusCode(status: number): number {
  return [401, 403, 404].includes(status) ? status : 502
}
