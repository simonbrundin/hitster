import type { SpotifyPlaylist, SpotifyTrack } from '~/types'

type SpotifyTokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

const ACCESS_TOKEN_KEY = 'spotify_access_token'
const REFRESH_TOKEN_KEY = 'spotify_refresh_token'
const EXPIRES_AT_KEY = 'spotify_token_expires_at'
const TOKEN_REFRESH_MARGIN_MS = 60_000

export function useSpotify() {
  const runtimeConfig = useRuntimeConfig()
  const clientId = runtimeConfig.public.spotifyClientId
  const accessToken = useState<string | null>('spotify_access_token', () => null)
  const refreshToken = useState<string | null>('spotify_refresh_token', () => null)
  const tokenExpiresAt = useState<number>('spotify_token_expires_at', () => 0)
  const isAuthenticated = computed(() => !!accessToken.value)

  const login = () => {
    if (!clientId) {
      throw new Error('Spotify Client ID saknas. Lägg till SPOTIFY_CLIENT_ID i .env och starta om Nuxt.')
    }

    const redirectUri = `${window.location.origin}/callback`
    const state = generateRandomString(16)
    localStorage.setItem('spotify_auth_state', state)

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
      scope: [
        'user-read-private',
        'user-read-email',
        'playlist-read-private',
        'playlist-read-collaborative',
        'streaming'
      ].join(' ')
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  const setTokens = (tokens: SpotifyTokenResponse) => {
    accessToken.value = tokens.access_token
    if (tokens.refresh_token) refreshToken.value = tokens.refresh_token
    if (tokens.expires_in) tokenExpiresAt.value = Date.now() + tokens.expires_in * 1000

    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
    if (refreshToken.value) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.value)
    localStorage.setItem(EXPIRES_AT_KEY, String(tokenExpiresAt.value))
  }

  const setAccessToken = (token: string) => {
    setTokens({ access_token: token })
  }

  const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshToken.value) return null

    try {
      const response = await $fetch<SpotifyTokenResponse>('/api/spotify/refresh', {
        method: 'POST',
        body: { refreshToken: refreshToken.value }
      })
      setTokens(response)
      return response.access_token
    } catch {
      logout()
      return null
    }
  }

  const getValidAccessToken = async (): Promise<string | null> => {
    if (accessToken.value && tokenExpiresAt.value > Date.now() + TOKEN_REFRESH_MARGIN_MS) {
      return accessToken.value
    }
    return refreshAccessToken()
  }

  const initFromStorage = () => {
    if (!import.meta.client) return
    accessToken.value = localStorage.getItem(ACCESS_TOKEN_KEY)
    refreshToken.value = localStorage.getItem(REFRESH_TOKEN_KEY)
    tokenExpiresAt.value = Number(localStorage.getItem(EXPIRES_AT_KEY) ?? 0)
  }

  const logout = () => {
    accessToken.value = null
    refreshToken.value = null
    tokenExpiresAt.value = 0
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
  }

  const fetchPlaylists = async (): Promise<SpotifyPlaylist[]> => {
    const token = await getValidAccessToken()
    if (!token) return []

    const response = await $fetch<{ playlists: SpotifyPlaylist[] }>('/api/spotify/playlists', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.playlists
  }

  const fetchPlaylistTracks = async (playlistId: string): Promise<SpotifyTrack[]> => {
    const token = await getValidAccessToken()
    if (!token) return []

    const response = await $fetch<{ tracks: SpotifyTrack[] }>(`/api/spotify/playlist/${playlistId}/tracks`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.tracks
  }

  return {
    accessToken,
    isAuthenticated,
    login,
    logout,
    setAccessToken,
    setTokens,
    initFromStorage,
    getValidAccessToken,
    fetchPlaylists,
    fetchPlaylistTracks
  }
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((result, value) => result + possible[value % possible.length], '')
}
