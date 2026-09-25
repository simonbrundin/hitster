<script setup lang="ts">
definePageMeta({
  layout: false
})

useHead({
  title: 'Resultat - Hitster Battle'
})

const router = useRouter()
const { gameState, getLeaderboard } = useGame()

const leaderboard = computed(() => getLeaderboard())

// Play again
const playAgain = () => {
  router.push('/lobby')
}

// Go home
const goHome = () => {
  router.push('/')
}

// Share results
const shareResults = () => {
  if (!gameState.value) return

  const text = `🎵 Hitster Battle-resultat!\n\n🏆 Vinnare: ${gameState.value.winner?.name} med ${gameState.value.winner?.score} poäng!\n\nAnslut på: ${window.location.origin}`

  if (navigator.share) {
    navigator.share({
      title: 'Hitster Battle-resultat',
      text
    })
  } else {
    navigator.clipboard.writeText(text)
  }
}

// Get medal emoji
const getMedal = (index: number): string => {
  switch (index) {
    case 0: return '🥇'
    case 1: return '🥈'
    case 2: return '🥉'
    default: return `#${index + 1}`
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 theme-dark">
    <div class="safe-area-top pt-3">
      <div class="max-w-4xl mx-auto px-6 py-12">
        <!-- Header -->
        <div class="text-center mb-12">
          <div class="text-6xl mb-4">
            🎉
          </div>
          <h1 class="text-4xl font-bold text-white mb-2">
            Spelet är slut!
          </h1>
          <p class="text-neutral-400">
            Slutresultat
          </p>
        </div>

        <!-- Winner Highlight -->
        <div
          v-if="gameState?.winner"
          class="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-8 mb-8 border border-yellow-500/30 text-center"
        >
          <div class="text-5xl mb-4">
            🏆
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">
            {{ gameState.winner.name }}
          </h2>
          <p class="text-4xl font-bold text-yellow-400">
            {{ gameState.winner.score }} poäng
          </p>
          <p class="text-neutral-400 mt-2">
            Vinnare!
          </p>
        </div>

        <!-- Full Leaderboard -->
        <div class="bg-neutral-900/50 backdrop-blur rounded-2xl border border-neutral-800 overflow-hidden mb-8">
          <div class="p-6 border-b border-neutral-800">
            <h3 class="text-lg font-semibold text-white">
              Slutlig ranking
            </h3>
          </div>

          <div class="divide-y divide-neutral-800">
            <div
              v-for="(team, index) in leaderboard"
              :key="team.id"
              :class="[
                'flex items-center gap-4 p-4 transition-colors',
                team.id === gameState?.winner?.id ? 'bg-yellow-500/10' : ''
              ]"
            >
              <div class="w-12 text-center text-2xl">
                {{ getMedal(index) }}
              </div>

              <div
                class="w-4 h-4 rounded-full"
                :style="{ backgroundColor: team.color }"
              />

              <div class="flex-1">
                <h4 class="font-semibold text-white">
                  {{ team.name }}
                </h4>
                <p class="text-sm text-neutral-400">
                  {{ team.members.length }} {{ team.members.length === 1 ? 'medlem' : 'medlemmar' }}
                </p>
              </div>

              <div class="text-right">
                <p class="text-2xl font-bold text-white">
                  {{ team.score }}
                </p>
                <p class="text-xs text-neutral-500">
                  poäng
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Cards Summary -->
        <div
          v-if="gameState"
          class="bg-neutral-900/50 backdrop-blur rounded-2xl border border-neutral-800 p-6 mb-8"
        >
          <h3 class="text-lg font-semibold text-white mb-4">
            Spelstatistik
          </h3>

          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-3xl font-bold text-white">
                {{ gameState.cards.length }}
              </p>
              <p class="text-sm text-neutral-400">
                Totalt antal kort
              </p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-yellow-400">
                {{ gameState.cards.filter(c => c.isGoldenShot).length }}
              </p>
              <p class="text-sm text-neutral-400">
                Guldkort
              </p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-white">
                {{ gameState.teams.length }}
              </p>
              <p class="text-sm text-neutral-400">
                Lag
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            size="lg"
            color="primary"
            @click="playAgain"
          >
            <Icon
              name="i-lucide-refresh-ccw"
              class="w-5 h-5 mr-2"
            />
            Spela igen
          </UButton>

          <UButton
            size="lg"
            variant="outline"
            color="neutral"
            @click="shareResults"
          >
            <Icon
              name="i-lucide-share-2"
              class="w-5 h-5 mr-2"
            />
            Dela resultat
          </UButton>

          <UButton
            size="lg"
            variant="ghost"
            color="neutral"
            @click="goHome"
          >
            <Icon
              name="i-lucide-home"
              class="w-5 h-5 mr-2"
            />
            Hem
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
