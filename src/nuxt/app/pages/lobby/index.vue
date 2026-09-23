<script setup lang="ts">
import type { GameRulesMode, SpotifyTrack } from '~/types'

definePageMeta({
  layout: false
})

useHead({
  title: 'Skapa spel - Hitster Battle'
})

const { isAuthenticated, fetchPlaylistTracks } = useSpotify()
const { createGame, startGame: initializeGame, gameState, syncError, isHost } = useGame()

const router = useRouter()

// Game setup state
const step = ref<'teams' | 'playlist' | 'ready'>('teams')
const teamNames = ref<string[]>(['Lag 1', 'Lag 2'])
const rulesMode = ref<GameRulesMode>('original')
const tracks = ref<SpotifyTrack[]>([])
const isLoadingTracks = ref(false)
const playlistError = ref('')
const launchError = ref('')

watch(syncError, (error) => {
  if (error?.includes('host')) {
    launchError.value = 'Endast spelets värd kan starta spelet. Börja om från startsidan.'
  }
})
const createError = ref('')

// Create game
const handleGameCreated = async (names: string[]) => {
  teamNames.value = names
  createError.value = ''
  const game = await createGame(names, rulesMode.value)
  if (!game) {
    createError.value = 'Spelet kunde inte skapas. Försök igen.'
    return
  }
  step.value = 'playlist'
}

// Load playlist tracks
const handlePlaylistSelected = async (playlistId: string) => {
  playlistError.value = ''
  isLoadingTracks.value = true

  try {
    tracks.value = await fetchPlaylistTracks(playlistId)
    step.value = 'ready'
  } catch (error: unknown) {
    console.error('Failed to load tracks:', error)
    const fetchError = error as {
      data?: { message?: string }
      statusMessage?: string
    }
    playlistError.value = fetchError.data?.message
      ?? fetchError.statusMessage
      ?? 'Kunde inte läsa låtarna från Spotify. Logga ut och anslut Spotify igen.'
  } finally {
    isLoadingTracks.value = false
  }
}

// Start the game
const launchGame = async () => {
  launchError.value = ''

  if (!gameState.value) {
    launchError.value = 'Spelsessionen saknas. Börja om från steget med lag.'
    return
  }

  if (tracks.value.length < 10) {
    launchError.value = `Den här spellistan har bara ${tracks.value.length} användbara låtar. Välj en spellista med minst 10 låtar.`
    return
  }

  const started = await initializeGame(tracks.value)

  if (!started) {
    launchError.value = 'Spelet kunde inte startas. Välj en annan spellista och försök igen.'
    return
  }

  router.push('/game')
}

// Redirect if not authenticated
onMounted(() => {
  if (!isAuthenticated.value) {
    router.push('/')
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f5f2] text-[#17211d]">
    <div class="mx-auto max-w-4xl px-5 py-8 lg:px-8">
      <!-- Header -->
      <div class="mb-12 flex items-center justify-between">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 text-sm font-medium text-[#17211d]/55 transition-colors hover:text-[#17211d]"
        >
          <Icon
            name="i-lucide-arrow-left"
            class="h-4 w-4"
          />
          <span>Tillbaka till startsidan</span>
        </NuxtLink>

        <div class="flex items-center gap-2 text-sm font-bold tracking-tight">
          <span>HITSTER <span class="font-normal text-[#17211d]/45">BATTLE</span></span>
          <Icon
            name="i-simple-icons-spotify"
            class="h-5 w-5 text-[#1db954]"
          />
        </div>
      </div>

      <!-- Progress Steps -->
      <div class="mb-12 flex items-center justify-center gap-3 sm:gap-5">
        <div :class="['flex items-center gap-2', step === 'teams' ? 'text-[#1db954]' : 'text-neutral-500']">
          <div :class="['w-8 h-8 rounded-full flex items-center justify-center font-bold', step === 'teams' ? 'bg-[#1db954] text-white' : 'bg-neutral-800']">
            <Icon
              v-if="step !== 'teams'"
              name="i-lucide-check"
              class="w-4 h-4"
            />
            <span v-else>1</span>
          </div>
          <span class="font-medium">Lag</span>
        </div>

        <Icon
          name="i-lucide-chevron-right"
          class="w-5 h-5 text-neutral-600"
        />

        <div :class="['flex items-center gap-2', step === 'playlist' ? 'text-[#1db954]' : 'text-neutral-500']">
          <div :class="['w-8 h-8 rounded-full flex items-center justify-center font-bold', step === 'playlist' ? 'bg-[#1db954] text-white' : 'bg-neutral-800']">
            <Icon
              v-if="step === 'ready'"
              name="i-lucide-check"
              class="w-4 h-4"
            />
            <span v-else>2</span>
          </div>
          <span class="font-medium">Spellista</span>
        </div>

        <Icon
          name="i-lucide-chevron-right"
          class="w-5 h-5 text-neutral-600"
        />

        <div :class="['flex items-center gap-2', step === 'ready' ? 'text-[#1db954]' : 'text-neutral-500']">
          <div :class="['w-8 h-8 rounded-full flex items-center justify-center font-bold', step === 'ready' ? 'bg-[#1db954] text-white' : 'bg-neutral-800']">
            <span>3</span>
          </div>
          <span class="font-medium">Klart!</span>
        </div>
      </div>

      <!-- Step Content -->
      <div class="rounded-3xl border border-[#17211d]/10 bg-white p-6 shadow-[0_18px_50px_rgba(23,33,29,0.07)] sm:p-10">
        <!-- Step 1: Team Setup -->
        <div v-if="step === 'teams'">
          <TeamSetup
            :initial-teams="teamNames"
            @update:teams="teamNames = $event"
            @start="handleGameCreated"
          />

          <UAlert
            v-if="createError"
            color="error"
            variant="subtle"
            class="mt-5"
            :title="createError"
          />

          <div class="mt-8 border-t border-[#17211d]/10 pt-6 text-left">
            <h3 class="mb-3 text-sm font-bold uppercase tracking-wider text-[#17211d]/55">
              Spelregler
            </h3>
            <div class="grid gap-3 sm:grid-cols-2">
              <button
                class="rounded-xl border-2 p-4 text-left transition"
                :class="rulesMode === 'original' ? 'border-[#1db954] bg-[#1db954]/10' : 'border-neutral-200 bg-neutral-50'"
                @click="rulesMode = 'original'"
              >
                <p class="font-bold text-[#17211d]">
                  Original
                </p>
                <p class="mt-1 text-xs text-[#17211d]/55">
                  Rätt kort låses direkt och turen går vidare.
                </p>
              </button>
              <button
                class="rounded-xl border-2 p-4 text-left transition"
                :class="rulesMode === 'lock-in' ? 'border-[#1db954] bg-[#1db954]/10' : 'border-neutral-200 bg-neutral-50'"
                @click="rulesMode = 'lock-in'"
              >
                <p class="font-bold text-[#17211d]">
                  Lås in-variant
                </p>
                <p class="mt-1 text-xs text-[#17211d]/55">
                  Efter rätt svar väljer laget Lås in eller Ta nästa låt.
                </p>
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Playlist Selection -->
        <div v-else-if="step === 'playlist'">
          <div
            v-if="isLoadingTracks"
            class="flex flex-col items-center py-12"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="mb-4 h-12 w-12 animate-spin text-[#1db954]"
            />
            <p class="text-neutral-400">
              Laddar låtar från spellistan...
            </p>
          </div>

          <UAlert
            v-if="playlistError"
            color="error"
            variant="subtle"
            class="mb-5 text-left"
            :title="playlistError"
          />

          <SpotifyPlaylistSelector
            v-if="!isLoadingTracks"
            @select="handlePlaylistSelected"
          />
        </div>

        <!-- Step 3: Ready to Start -->
        <div
          v-else-if="step === 'ready'"
          class="text-center"
        >
          <div class="mb-8">
            <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#1db954]/20">
              <Icon
                name="i-lucide-check-circle"
                class="h-10 w-10 text-[#1db954]"
              />
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">
              Allt klart!
            </h2>
            <p class="text-neutral-400">
              {{ tracks.length }} låtar laddade från din spellista
            </p>
          </div>

          <!-- Game Code Preview -->
          <div class="bg-neutral-800 rounded-xl p-6 mb-8">
            <p class="text-neutral-400 text-sm mb-2">
              Spelkod
            </p>
            <GameCode
              v-if="gameState"
              :code="gameState.code"
              size="lg"
            />
          </div>

          <!-- Teams Summary -->
          <div class="flex justify-center gap-4 flex-wrap mb-8">
            <div
              v-for="(name, index) in teamNames"
              :key="index"
              class="flex items-center gap-2 px-4 py-2 rounded-lg"
              :style="{ backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][index] + '20' }"
            >
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][index] }"
              />
              <span class="text-white font-medium">{{ name }}</span>
            </div>
          </div>

          <UAlert
            v-if="launchError"
            color="error"
            variant="subtle"
            class="mx-auto mb-5 max-w-lg text-left"
            :title="launchError"
          />

          <p
            v-if="!isHost"
            class="mb-4 text-center text-sm text-neutral-400"
          >
            Endast spelets värd kan starta spelet
          </p>

          <UButton
            size="xl"
            color="primary"
            :disabled="!isHost"
            @click="launchGame"
          >
            <Icon
              name="i-lucide-rocket"
              class="mr-2 h-5 w-5"
            />
            Starta spelet
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
