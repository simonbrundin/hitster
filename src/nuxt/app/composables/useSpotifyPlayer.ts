/**
 * Spotify Web Playback SDK composable.
 * Requires a Spotify Premium account and a token with `streaming` scope.
 *
 * Usage:
 *   const player = useSpotifyPlayer()
 *   await player.connect()
 *   await player.playTrack('spotify:track:...')
 */
export function useSpotifyPlayer() {
  const { accessToken, getValidAccessToken } = useSpotify()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let player: any = null
  let deviceId = ''
  let sdkReady = false
  let connectPromise: Promise<void> | null = null

  const isConnected = ref(false)
  const isPlaying = ref(false)
  const currentTrackUri = ref<string | null>(null)
  const error = ref<string | null>(null)
  const needsPremium = ref(false)

  // Load the Spotify Web Playback SDK script once
  const loadSdk = (): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).Spotify) return resolve()

      const script = document.createElement('script')
      script.src = 'https://sdk.scdn.co/spotify-player.js'

      // The SDK calls this global during script initialization. Defining it
      // before inserting the script prevents an uncaught SDK error.
      const spotifyWindow = window as Window & {
        onSpotifyWebPlaybackSDKReady?: () => void
      }
      spotifyWindow.onSpotifyWebPlaybackSDKReady = () => resolve()

      script.onload = () => resolve()
      script.onerror = () => {
        error.value = 'Kunde inte ladda Spotify Player. Kontrollera din internetuppkoppling.'
        resolve()
      }
      document.head.appendChild(script)
    })
  }

  const getSdk = (): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Spotify) return Promise.resolve()
    return loadSdk() as Promise<void>
  }

  const connect = async (): Promise<void> => {
    if (!import.meta.client) return
    if (!accessToken.value) {
      error.value = 'Ingen Spotify-token. Logga in med Spotify först.'
      return
    }

    if (connectPromise) return connectPromise

    connectPromise = getSdk().then(() => {
      return new Promise<void>((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Spotify = (window as any).Spotify
        if (!Spotify) {
          error.value = 'Spotify Player kunde inte laddas.'
          connectPromise = null
          resolve()
          return
        }

        player = new Spotify.Player({
          name: 'Hitster Battle',
          getOAuthToken: (cb: (token: string) => void) => {
            void getValidAccessToken().then((token) => {
              if (token) cb(token)
            })
          },
          volume: 0.8
        })

        player.addListener('ready', ({ device_id }: { device_id: string }) => {
          deviceId = device_id
          isConnected.value = true
          sdkReady = true
          needsPremium.value = false
          console.log('[Spotify Player] Ready, device ID:', deviceId)
        })

        player.addListener('not_ready', () => {
          isConnected.value = false
          sdkReady = false
        })

        player.addListener('initialization_error', (err: Error) => {
          error.value = `Init-fel: ${err.message}`
          sdkReady = false
        })

        player.addListener('authentication_error', () => {
          error.value = 'Autentisering misslyckades. Kontrollera att du har Spotify Premium och att "streaming"-scopet är aktiverat.'
          needsPremium.value = true
          sdkReady = false
          isConnected.value = false
        })

        player.addListener('account_error', (err: Error) => {
          error.value = `Kontofel: ${err.message}. Spotify Premium krävs för att spela musik i webbläsaren.`
          needsPremium.value = true
          sdkReady = false
        })

        player.addListener('playback_error', (err: Error) => {
          error.value = `Uppspelningsfel: ${err.message}`
        })

        player.addListener('player_state_changed', (state: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const s = state as any
          if (!s) {
            isPlaying.value = false
            return
          }
          isPlaying.value = !s.paused
          currentTrackUri.value = s.context?.uri ?? null
        })

        player.connect().then((success: boolean) => {
          if (success) {
            sdkReady = true
            resolve()
          } else {
            error.value = 'Kunde inte ansluta till Spotify Player. Kontrollera Spotify Premium och att en Spotify-enhet är aktiv.'
            sdkReady = false
            isConnected.value = false
            player = null
            resolve()
          }
          connectPromise = null
        }).catch((err: Error) => {
          error.value = err.message
          sdkReady = false
          isConnected.value = false
          player = null
          connectPromise = null
          resolve()
        })
      })
    })

    return connectPromise
  }

  const disconnect = async () => {
    if (player) {
      await player.disconnect()
      player = null
      deviceId = ''
      isConnected.value = false
      sdkReady = false
    }
  }

  const playTrack = async (
    spotifyUri: string,
    positionMs = 0
  ): Promise<void> => {
    const token = await getValidAccessToken()
    if (!deviceId || !token) {
      error.value = 'Spotify Player är inte ansluten.'
      return
    }

    error.value = null

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            uris: [spotifyUri],
            position_ms: positionMs
          })
        }
      )

      if (response.status === 403 || response.status === 401) {
        needsPremium.value = true
        error.value = 'Spotify Premium krävs för att spela musik i webbläsaren.'
        return
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error.value = `Kunde inte spela låten: ${(body as any).error?.message ?? response.status}`
        return
      }

      currentTrackUri.value = spotifyUri
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Okänt fel vid uppspelning'
    }
  }

  const pause = async () => {
    if (!player) return
    await player.pause()
    isPlaying.value = false
  }

  const resume = async () => {
    if (!player) return
    await player.resume()
    isPlaying.value = true
  }

  const togglePlay = async () => {
    if (!player || !sdkReady) return
    await player.togglePlay()
  }

  return {
    isConnected,
    isPlaying,
    error,
    needsPremium,
    connect,
    disconnect,
    playTrack,
    pause,
    resume,
    togglePlay
  }
}
