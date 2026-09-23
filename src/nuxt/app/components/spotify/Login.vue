<script setup lang="ts">
defineProps<{
  compact?: boolean
}>()

const { login, isAuthenticated, logout } = useSpotify()
const loginError = ref('')

const startSpotifyLogin = () => {
  loginError.value = ''

  try {
    login()
  } catch (error) {
    loginError.value = error instanceof Error ? error.message : 'Spotify kunde inte startas.'
  }
}
</script>

<template>
  <div :class="['flex flex-col items-center gap-4', compact ? 'scale-90' : '']">
    <div class="text-center space-y-2">
      <Icon
        name="i-simple-icons-spotify"
        class="w-16 h-16 text-spotify mx-auto"
      />
      <h2 class="text-2xl font-bold text-white">
        Connect with Spotify
      </h2>
      <p class="text-neutral-400 max-w-md">
        Sign in with your Spotify account to access your playlists and start playing
      </p>
      <p class="text-xs text-white/30 mt-1">
        Note: Playing full tracks in the browser requires Spotify Premium
      </p>
    </div>

    <p
      v-if="loginError"
      class="max-w-sm text-center text-sm text-red-300"
    >
      {{ loginError }}
    </p>

    <div class="flex gap-4">
      <UButton
        v-if="!isAuthenticated"
        size="lg"
        class="bg-spotify hover:bg-spotify/90 text-white font-semibold px-8"
        @click="startSpotifyLogin"
      >
        <Icon
          name="i-simple-icons-spotify"
          class="w-5 h-5 mr-2"
        />
        Login with Spotify
      </UButton>

      <UButton
        v-else
        size="lg"
        variant="outline"
        color="neutral"
        @click="logout"
      >
        <Icon
          name="i-lucide-log-out"
          class="w-5 h-5 mr-2"
        />
        Logout
      </UButton>
    </div>
  </div>
</template>

<style scoped>
.text-spotify {
  color: #1DB954;
}
.bg-spotify {
  background-color: #1DB954;
}
.bg-spotify:hover {
  background-color: #1ed760;
}
</style>
