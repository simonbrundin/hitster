<script setup lang="ts">
import type { SpotifyPlaylist } from '~/types'

const emit = defineEmits<{
  (e: 'select', playlistId: string): void
}>()

const { isAuthenticated, fetchPlaylists } = useSpotify()
const playlists = ref<SpotifyPlaylist[]>([])
const isLoading = ref(false)
const selectedPlaylist = ref<string | null>(null)
const searchQuery = ref('')
const loadError = ref('')

const filteredPlaylists = computed(() => {
  if (!searchQuery.value) return playlists.value
  return playlists.value.filter(p =>
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const loadPlaylists = async () => {
  if (!isAuthenticated.value) return

  isLoading.value = true
  try {
    loadError.value = ''
    playlists.value = await fetchPlaylists()
  } catch (error) {
    console.error('Failed to load playlists:', error)
    loadError.value = 'Could not load your Spotify playlists. Please reconnect and try again.'
  } finally {
    isLoading.value = false
  }
}

watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    loadPlaylists()
  }
}, { immediate: true })

const selectPlaylist = (playlistId: string) => {
  selectedPlaylist.value = playlistId
  emit('select', playlistId)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4 mb-4">
      <Icon
        name="i-simple-icons-spotify"
        class="w-8 h-8 text-spotify"
      />
      <div>
        <h3 class="text-xl font-semibold text-[#17211d]">
          Select a playlist
        </h3>
        <p class="mt-1 text-sm text-[#17211d]/55">
          Choose the soundtrack for this game.
        </p>
        <p class="mt-1 text-xs text-[#17211d]/45">
          Spotify only allows playlists you own or collaborate on.
        </p>
      </div>
    </div>

    <UInput
      v-model="searchQuery"
      placeholder="Search playlists..."
      icon="i-lucide-search"
      color="neutral"
      variant="outline"
      class="max-w-md"
    />

    <div
      v-if="isLoading"
      class="flex justify-center py-8"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-spotify"
      />
    </div>

    <div
      v-else-if="loadError"
      class="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center text-red-700"
    >
      <Icon
        name="i-lucide-circle-alert"
        class="mx-auto mb-2 h-8 w-8"
      />
      <p class="text-sm">
        {{ loadError }}
      </p>
    </div>

    <div
      v-else-if="!playlists.length"
      class="rounded-2xl border border-[#17211d]/10 bg-[#f5f5f2] px-5 py-10 text-center text-[#17211d]/55"
    >
      <Icon
        name="i-lucide-inbox"
        class="mx-auto mb-3 h-10 w-10 opacity-50"
      />
      <p class="font-medium text-[#17211d]">
        No playlists found
      </p>
      <p class="mt-1 text-sm">
        Create a playlist in Spotify and try again.
      </p>
    </div>

    <div
      v-else-if="filteredPlaylists.length"
      class="grid max-h-96 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2 lg:grid-cols-3"
    >
      <button
        v-for="playlist in filteredPlaylists"
        :key="playlist.id"
        :class="[
          'flex items-center gap-3 p-3 rounded-lg transition-all text-left',
          'bg-neutral-800 hover:bg-neutral-700 border-2',
          selectedPlaylist === playlist.id
            ? 'border-spotify'
            : 'border-transparent'
        ]"
        @click="selectPlaylist(playlist.id)"
      >
        <img
          :src="playlist.imageUrl"
          :alt="playlist.name"
          class="w-14 h-14 rounded-md object-cover"
        >
        <div class="flex-1 min-w-0">
          <h4 class="text-white font-medium truncate">
            {{ playlist.name }}
          </h4>
          <p class="text-neutral-400 text-sm truncate">
            {{ playlist.owner }}
          </p>
          <p class="text-neutral-500 text-xs">
            {{ playlist.trackCount }} tracks
          </p>
        </div>
        <Icon
          v-if="selectedPlaylist === playlist.id"
          name="i-lucide-check-circle"
          class="w-5 h-5 text-spotify shrink-0"
        />
      </button>
    </div>

    <div
      v-else
      class="rounded-2xl border border-[#17211d]/10 bg-[#f5f5f2] px-5 py-8 text-center text-[#17211d]/55"
    >
      <Icon
        name="i-lucide-search-x"
        class="mx-auto mb-2 h-8 w-8"
      />
      <p class="text-sm">
        No playlists match “{{ searchQuery }}”.
      </p>
    </div>
  </div>
</template>

<style scoped>
.text-spotify {
  color: #1DB954;
}
.border-spotify {
  border-color: #1DB954;
}
</style>
