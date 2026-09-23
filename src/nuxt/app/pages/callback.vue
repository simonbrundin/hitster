<script setup lang="ts">
definePageMeta({
  layout: false
})

const router = useRouter()
const route = useRoute()
const { setTokens } = useSpotify()

onMounted(async () => {
  const { code, state, error } = route.query

  if (error) {
    console.error('Spotify auth error:', error)
    router.push('/?error=' + error)
    return
  }

  if (!code || typeof code !== 'string') {
    router.push('/')
    return
  }

  // Verify state
  const storedState = localStorage.getItem('spotify_auth_state')
  if (state !== storedState) {
    console.error('State mismatch')
    router.push('/?error=state_mismatch')
    return
  }

  localStorage.removeItem('spotify_auth_state')

  try {
    // Exchange code for token via server
    const response = await $fetch<{
      access_token: string
      refresh_token?: string
      expires_in?: number
    }>('/api/spotify/token', {
      method: 'POST',
      body: {
        code,
        redirectUri: window.location.origin + '/callback'
      }
    })

    setTokens(response)

    // Check if there's a pending game code
    const pendingGameCode = localStorage.getItem('pending_game_code')
    localStorage.removeItem('pending_game_code')

    if (pendingGameCode) {
      router.push(`/join/${pendingGameCode}`)
    } else {
      router.push('/lobby')
    }
  } catch (err) {
    console.error('Token exchange failed:', err)
    router.push('/?error=token_exchange_failed')
  }
})
</script>

<template>
  <div class="min-h-screen bg-neutral-950 flex items-center justify-center">
    <div class="text-center">
      <Icon
        name="i-simple-icons-spotify"
        class="w-16 h-16 text-spotify mx-auto mb-4 animate-pulse"
      />
      <p class="text-neutral-400">
        Connecting to Spotify...
      </p>
    </div>
  </div>
</template>

<style scoped>
.text-spotify {
  color: #1DB954;
}
</style>
