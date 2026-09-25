<script setup lang="ts">
definePageMeta({
  layout: false
})

useHead({
  title: 'Anslut till spel - Hitster Battle'
})

const route = useRoute()
const router = useRouter()
const { gameState, getGameByCode, joinGame, syncError } = useGame()

const code = computed(() => route.params.code as string)
const playerNameInput = ref('')
const selectedTeamId = ref<string | null>(null)
const isJoining = ref(false)
const joinError = ref('')

onMounted(async () => {
  await getGameByCode(code.value)
})

// Join game
const handleJoin = async () => {
  if (!playerNameInput.value.trim() || !selectedTeamId.value) return

  isJoining.value = true
  joinError.value = ''

  try {
    // In a real app, this would fetch game state from server
    // For demo, we simulate joining
    const success = await joinGame(code.value, playerNameInput.value, selectedTeamId.value)

    if (success) {
      router.push('/game')
    } else {
      joinError.value = 'Kunde inte hitta ett spel med denna kod'
    }
  } catch {
    joinError.value = 'Det gick inte att ansluta till spelet. Försök igen.'
  } finally {
    isJoining.value = false
  }
}

// Select team
const selectTeam = (teamId: string) => {
  selectedTeamId.value = teamId
}
</script>

<template>
  <div class="min-h-screen bg-neutral-950 flex items-center justify-center p-6 theme-dark">
    <div class="w-full max-w-md" :style="{ paddingTop: `max(env(safe-area-inset-top), 12px)` }">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="flex items-center justify-center gap-2 mb-4">
            <Icon
              name="i-simple-icons-spotify"
              class="h-8 w-8 text-[#1db954]"
            />
            <span class="text-2xl font-bold text-white">Hitster Battle</span>
          </div>

          <div class="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 rounded-full">
            <span class="text-neutral-400 text-sm">Ansluter till spel:</span>
            <code class="text-lg font-mono font-bold text-white">{{ code }}</code>
          </div>
        </div>

        <!-- Join Form -->
        <div class="bg-neutral-900/50 backdrop-blur rounded-2xl p-8 border border-neutral-800">
          <h2 class="text-xl font-bold text-white mb-6">
            Gå med i spelet
          </h2>

          <UFormField
            label="Ditt namn"
            class="mb-6"
          >
            <UInput
              v-model="playerNameInput"
              placeholder="Ange ditt namn"
              icon="i-lucide-user"
              color="neutral"
              variant="outline"
              class="w-full"
              size="lg"
            />
          </UFormField>

          <UFormField
            label="Välj ditt lag"
            class="mb-6"
          >
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="team in gameState?.teams"
                :key="team.id"
                :class="[
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  selectedTeamId === team.id
                    ? 'border-white bg-white/10'
                    : 'border-neutral-600 hover:border-neutral-500'
                ]"
                @click="selectTeam(team.id)"
              >
                <div
                  class="w-8 h-8 rounded-full"
                  :style="{ backgroundColor: team.color }"
                />
                <span class="text-white text-sm font-medium">{{ team.name }}</span>
                <span class="text-xs text-neutral-500">
                  {{ team.members.length }} anslutna
                </span>
              </button>
            </div>
          </UFormField>

          <!-- Error -->
          <UAlert
            v-if="joinError || syncError"
            color="error"
            variant="subtle"
            class="mb-4"
            :title="joinError || syncError || undefined"
          />

          <UButton
            :disabled="!playerNameInput.trim() || !selectedTeamId || isJoining"
            :loading="isJoining"
            size="lg"
            class="w-full"
            color="primary"
            @click="handleJoin"
          >
            <Icon
              name="i-lucide-log-in"
              class="w-5 h-5 mr-2"
            />
            Gå med
          </UButton>
        </div>

        <!-- Back Link -->
        <div class="text-center mt-6">
          <NuxtLink
            to="/"
            class="text-neutral-400 hover:text-white transition-colors text-sm"
          >
            <Icon
              name="i-lucide-arrow-left"
              class="w-4 h-4 inline mr-1"
            />
            Tillbaka till startsidan
          </NuxtLink>
        </div>
      </div>
  </div>
</template>

<style scoped>
.text-spotify {
  color: #1DB954;
}
</style>
