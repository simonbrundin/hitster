/**
 * Combines timeline card selection with Spotify playback for the game page.
 */
export function useGameSpotify() {
  const { gameState } = useGame()
  const { isConnected, isPlaying, error, connect, playTrack, activateElement, togglePlay } = useSpotifyPlayer()

  const connecting = ref(false)
  const activeUri = ref<string | null>(null)

  const currentCard = computed(() => {
    const state = gameState.value
    if (!state) return null
    return state.cards.find(card => !card.isRevealed && !card.isDiscarded) ?? null
  })

  const spotifyUri = computed<string>(() => {
    const card = currentCard.value
    const url = card?.playbackUri ?? card?.track.spotifyUrl
    if (!url) return ''
    return url
      .replace('https://open.spotify.com/track/', 'spotify:track:')
      .split('?')[0] ?? ''
  })

  const isCurrentTrackPlaying = computed(() =>
    isPlaying.value && activeUri.value === spotifyUri.value
  )

  const playCurrentTrack = async () => {
    const uri = spotifyUri.value
    if (!uri) return

    if (!isConnected.value) {
      connecting.value = true
      try {
        await connect()
        if (isConnected.value) {
          await playTrack(uri)
          activeUri.value = uri
        }
      } finally {
        connecting.value = false
      }
      return
    }

    await playTrack(uri)
    activeUri.value = uri
  }

  const togglePlayback = async () => {
    const uri = spotifyUri.value
    if (!uri) return

    if (isCurrentTrackPlaying.value) {
      await togglePlay()
    } else {
      // iOS Safari blocks playback transferred from Spotify unless the SDK
      // is activated from the same user gesture as the play action.
      await activateElement()
      await playCurrentTrack()
    }
  }

  const ensureConnected = async () => {
    if (isConnected.value) return
    connecting.value = true
    try {
      await connect()
    } finally {
      connecting.value = false
    }
  }

  return {
    currentCard,
    spotifyUri,
    isConnected,
    isPlaying: isCurrentTrackPlaying,
    isCurrentTrackPlaying,
    spotifyError: error,
    connecting,
    playCurrentTrack,
    togglePlayback,
    ensureConnected
  }
}
