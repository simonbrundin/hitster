<script setup lang="ts">
definePageMeta({ layout: false })

useHead({ title: 'Spelar - Hitster Battle' })

const { isAuthenticated } = useSpotify()
const {
  checkPlacedCard,
  lockPendingCards,
  continueTurn,
  finishTurn,
  challengePlacedCard,
  skipCurrentCard,
  tradeTokensForCard,
  placeCard,
  syncError,
  startPolling,
  stopPolling,
  gameState
} = useGame()
const router = useRouter()

// ── Timeline queries ────────────────────────────────────────────────────────

const {
  timelineCards,
  currentCard,
  placedCards,
  pendingCards,
  lastCheckedCard,
  currentTeam,
  turnPhase,
  isLockInVariant,
  isViewerTurn,
  lastResult,
  lastMessage,
  challengeTeamId,
  currentTeamHitsterCards,
  isGameFinished,
  opponentTeams
} = useTimeline()

// ── Drag and drop ────────────────────────────────────────────────────────────

const {
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onTouchStart,
  suppressClick
} = useTimelineDrag()

const timelineLength = computed(() => timelineCards.value.length)

// ── Spotify playback ────────────────────────────────────────────────────────

const {
  isConnected,
  isPlaying,
  spotifyError,
  connecting,
  activateForUserGesture,
  playCurrentTrack,
  togglePlayback,
  ensureConnected
} = useGameSpotify()

// ── Lifecycle ───────────────────────────────────────────────────────────────

onMounted(async () => {
  if (!isAuthenticated.value) {
    router.push('/')
    return
  }
  if (!gameState.value || gameState.value.status !== 'playing') {
    router.push('/lobby')
    return
  }

  startPolling()
  if (!isConnected.value) {
    connecting.value = true
    try {
      await ensureConnected()
    } finally {
      connecting.value = false
    }
  }
})

onUnmounted(() => {
  stopPolling()
})

// ── Action handlers ─────────────────────────────────────────────────────────

const handleCheck = async () => {
  await checkPlacedCard()
}

const handleLockIn = async () => {
  await activateForUserGesture()
  const result = await lockPendingCards()
  if (!result.success) return
  await nextTick()
  await playCurrentTrack()
}

const handleContinue = async () => {
  await activateForUserGesture()
  const result = await continueTurn()
  if (!result.success) return
  await nextTick()
  await playCurrentTrack()
}

const handleNextTurn = async () => {
  await activateForUserGesture()
  const result = await finishTurn()
  if (!result.success) return
  await nextTick()
  await playCurrentTrack()
}

const handleChallenge = (teamId: string) => {
  challengePlacedCard(teamId)
}

const handleSkip = () => {
  skipCurrentCard()
}

const handleTrade = () => {
  tradeTokensForCard()
}

const handlePlayClick = async () => {
  await togglePlayback()
}

const placeCurrentCard = () => {
  if (suppressClick.value || turnPhase.value !== 'placing' || !isViewerTurn.value) return
  if (currentCard.value) placeCard(currentCard.value.id, timelineLength.value)
}

const goToResults = () => router.push('/results')

// ── Drag helpers ────────────────────────────────────────────────────────────

const handleCardDragStart = (event: DragEvent) => {
  onDragStart(event, timelineLength.value)
}

const handleCardTouchStart = (_event?: TouchEvent) => {
  onTouchStart(timelineLength.value)
}

const onMainDragOver = (event: DragEvent) => {
  const target = event.target as HTMLElement
  const cardEl = target.closest('[data-timeline-index]')
  if (!cardEl) return
  const index = Number((cardEl as HTMLElement).dataset.timelineIndex)
  onDragOver(event, index)
}

const handleDrop = (event: DragEvent) => {
  onDrop(event, timelineLength.value)
}
</script>

<template>
  <div class="flex h-screen flex-col bg-neutral-950 text-white">
    <!-- Header with team status and action buttons -->
    <GameHeader
      v-if="gameState"
      :code="gameState.code"
      :current-team="currentTeam"
      :turn-phase="turnPhase"
      :is-lock-in-variant="isLockInVariant"
      :is-viewer-turn="isViewerTurn"
      :current-team-hitster-cards="currentTeamHitsterCards"
      :current-card="currentCard"
      :placed-cards="placedCards"
      :pending-cards="pendingCards"
      :last-message="lastMessage"
      :opponent-teams="opponentTeams"
      :challenge-team-id="challengeTeamId"
      @check="handleCheck"
      @lock-in="handleLockIn"
      @continue="handleContinue"
      @skip="handleSkip"
      @trade="handleTrade"
      @challenge="handleChallenge"
    />

    <!-- Game over overlay -->
    <GameOverlay
      v-if="isGameFinished"
      :winner="gameState?.winner ?? null"
      @show-results="goToResults"
    />

    <!-- Timeline -->
    <main
      class="flex-1 overflow-y-auto"
      @dragover.prevent="onMainDragOver"
      @drop="handleDrop"
    >
      <div class="mx-auto max-w-2xl space-y-1 p-3">
        <!-- Result banner -->
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="translate-y-4 scale-95 opacity-0"
          enter-to-class="translate-y-0 scale-100 opacity-100"
        >
          <div
            v-if="turnPhase === 'result' && lastCheckedCard"
            :key="`${lastCheckedCard.id}-${lastResult}`"
            class="mb-3 rounded-2xl border-2 p-4 text-center shadow-lg"
            :class="lastResult === 'correct'
              ? 'border-green-400/60 bg-green-500/15 text-green-200'
              : 'border-red-400/60 bg-red-500/15 text-red-200'"
          >
            <div
              class="mb-1 text-5xl"
              :class="lastResult === 'correct' ? 'animate-bounce' : 'animate-pulse'"
            >
              {{ lastResult === 'correct' ? '🎉' : '💥' }}
            </div>
            <h2 class="text-2xl font-extrabold">
              {{ lastResult === 'correct' ? 'Rätt!' : 'Fel!' }}
            </h2>
            <p class="mt-2 font-semibold text-white">
              {{ lastCheckedCard.track.name }} — {{ lastCheckedCard.track.artist }}
            </p>
            <p class="mt-1 text-xl font-extrabold text-white">
              {{ lastCheckedCard.track.releaseYear }}
            </p>
            <p
              v-if="lastMessage"
              class="mt-1 text-xs opacity-80"
            >
              {{ lastMessage }}
            </p>
            <button
              v-if="isViewerTurn"
              class="mt-4 w-full rounded-xl bg-white/15 py-3 font-bold text-white transition hover:bg-white/25"
              @click="handleNextTurn"
            >
              Nästa låt →
            </button>
          </div>
        </Transition>

        <!-- Last message hint -->
        <div
          v-if="turnPhase !== 'result' && lastMessage"
          class="mb-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200"
        >
          {{ lastMessage }}
        </div>

        <!-- Timeline cards -->
        <GameTimelineCard
          v-for="(card, index) in timelineCards"
          :key="card.id"
          :card="card"
          :index="index"
          :turn-phase="turnPhase"
          @drag-start="handleCardDragStart"
          @drag-end="onDragEnd"
          @touch-start="handleCardTouchStart"
        />

        <!-- Empty state -->
        <div
          v-if="!timelineCards.length"
          class="py-12 text-center text-neutral-500"
        >
          Tidslinjen är tom.
        </div>
      </div>
    </main>

    <!-- Bottom bar: current card player + team list -->
    <div class="shrink-0 border-t border-neutral-800 bg-neutral-900 p-3">
      <!-- Current card with Spotify player -->
      <div
        v-if="currentCard && currentTeam"
        class="mx-auto max-w-2xl"
      >
        <div
          class="flex cursor-grab touch-none items-center gap-3 rounded-xl border-2 border-dashed border-neutral-600 bg-neutral-900/80 p-3 transition hover:border-neutral-400 active:cursor-grabbing"
          draggable="true"
          @click="placeCurrentCard"
          @dragstart="handleCardDragStart"
          @dragend="onDragEnd"
          @touchstart.passive="handleCardTouchStart"
        >
          <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-2xl">
            🎵
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold">
              Hemligt kort
            </p>
            <p class="text-sm text-neutral-500">
              Lyssna och placera låten i tidslinjen
            </p>
            <p class="mt-1 text-xs text-neutral-500">
              Ingen information visas innan kortet är rättat
            </p>
          </div>
          <div class="flex-shrink-0 text-right">
            <p class="text-lg font-bold text-neutral-400">
              ?
            </p>
            <button
              v-if="isViewerTurn"
              class="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#1db954] text-white"
              :disabled="connecting"
              @click.stop="handlePlayClick"
            >
              <Icon
                :name="isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
                class="h-5 w-5"
              />
            </button>
            <span
              v-else
              class="mt-1 block text-xs text-neutral-500"
            >
              Väntar på aktivt lag
            </span>
          </div>
        </div>
      </div>

      <!-- Spotify / sync error -->
      <p
        v-if="spotifyError || syncError"
        class="mx-auto mt-2 max-w-2xl rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200"
      >
        {{ spotifyError || syncError }}
      </p>

      <!-- Team list collapsible -->
      <details class="group mx-auto mt-2 max-w-2xl border-t border-neutral-800">
        <summary class="flex cursor-pointer items-center justify-between px-1 py-2 text-xs font-semibold text-neutral-400 hover:text-white">
          <span>Lag ({{ gameState?.teams.length }})</span>
          <Icon
            name="i-lucide-chevron-up"
            class="h-4 w-4 transition-transform group-open:rotate-180"
          />
        </summary>
        <div class="divide-y divide-neutral-800 px-1 pb-3">
          <div
            v-for="team in gameState?.teams"
            :key="team.id"
            class="flex items-center justify-between py-2"
          >
            <div class="flex items-center gap-2">
              <div
                class="h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: team.color }"
              />
              <span
                class="text-sm"
                :class="team.id === gameState?.currentTurn ? 'font-semibold text-white' : 'text-neutral-400'"
              >
                {{ team.name }}
              </span>
              <span
                v-if="team.id === gameState?.currentTurn"
                class="rounded bg-white/10 px-1.5 py-0.5 text-[10px]"
              >TUR</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-yellow-300">🃏 {{ team.hitsterCards ?? 3 }}</span>
              <span class="text-sm font-bold">{{ team.score }} p</span>
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>
