<script setup lang="ts">
import type { GameCard, Team } from '~/types'

const props = defineProps<{
  code: string
  currentTeam: Team | null
  turnPhase: string
  isLockInVariant: boolean
  isViewerTurn: boolean
  isController: boolean
  currentTeamHitsterCards: number
  currentCard: GameCard | undefined
  placedCards: GameCard[]
  pendingCards: GameCard[]
  lastMessage: string | null
  opponentTeams: Team[]
  challengeTeamId: string | null
}>()

defineEmits<{
  (e: 'check' | 'lock-in' | 'continue' | 'skip' | 'trade', ...args: never[]): void
  (e: 'challenge', teamId: string): void
}>()

const phaseLabel = computed(() => {
  if (props.turnPhase === 'result') return 'Resultat för'
  return 'Nu spelar'
})
</script>

<template>
  <header class="shrink-0 border-b border-neutral-800 bg-neutral-900 px-3 py-3">
    <!-- Top bar -->
    <div class="mb-2 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/"
          class="text-neutral-400 hover:text-white"
        >
          <Icon
            name="i-lucide-arrow-left"
            class="h-5 w-5"
          />
        </NuxtLink>
        <Icon
          name="i-simple-icons-spotify"
          class="h-4 w-4 text-[#1db954]"
        />
        <span class="text-sm font-bold">Hitster</span>
      </div>
      <GameCode
        :code="code"
        size="sm"
      />
    </div>

    <!-- Team status bar -->
    <div
      v-if="currentTeam"
      class="mb-3 flex items-center justify-between rounded-xl border-2 bg-white/5 px-3 py-2"
      :style="{ borderColor: currentTeam.color }"
    >
      <div class="flex items-center gap-2">
        <span
          class="h-3 w-3 rounded-full"
          :style="{ backgroundColor: currentTeam.color }"
        />
        <div>
          <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {{ phaseLabel }}
          </p>
          <p
            class="text-lg font-extrabold"
            :style="{ color: currentTeam.color }"
          >
            {{ currentTeam.name }}
          </p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-xs text-neutral-400">
          Poäng
        </p>
        <p class="text-lg font-bold">
          {{ currentTeam.score }}
        </p>
      </div>
    </div>

    <!-- Phase: checking -->
    <div
      v-if="turnPhase === 'checking'"
      class="space-y-2"
    >
      <button
        class="w-full rounded-xl bg-[#1db954] py-3 text-sm font-bold text-black transition hover:bg-[#1db954]/90 disabled:opacity-30"
        :disabled="!placedCards.length"
        @click="$emit('check')"
      >
        ✓ Rätta kortet
      </button>
      <div class="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
        <span>Utmana:</span>
        <button
          v-for="team in opponentTeams"
          :key="team.id"
          class="rounded-lg border border-neutral-700 px-2 py-1 transition hover:border-yellow-400 hover:text-yellow-300 disabled:cursor-not-allowed disabled:opacity-30"
          :disabled="challengeTeamId !== null || (team.hitsterCards ?? 3) <= 0"
          @click="$emit('challenge', team.id)"
        >
          {{ team.name }} 🃏 {{ team.hitsterCards ?? 3 }}
        </button>
      </div>
    </div>

    <!-- Phase: decision (lock-in variant) -->
    <div
      v-else-if="turnPhase === 'decision' && isLockInVariant && (isViewerTurn || isController)"
      class="space-y-2"
    >
      <p class="text-center text-xs text-green-300">
        Rätt! Lås in kortet eller ta nästa låt.
      </p>
      <div class="flex gap-2">
        <button
          class="flex-1 rounded-xl bg-[#1db954] py-3 text-sm font-bold text-black transition hover:bg-[#1db954]/90 disabled:opacity-30"
          :disabled="!pendingCards.length"
          @click="$emit('lock-in')"
        >
          🔒 Lås in ({{ pendingCards.length }})
        </button>
        <button
          class="flex-1 rounded-xl border-2 border-neutral-700 bg-neutral-800 py-3 text-sm font-bold transition hover:border-neutral-500"
          :disabled="!pendingCards.length"
          @click="$emit('continue')"
        >
          ▶ Ta nästa låt
        </button>
      </div>
    </div>

    <!-- Phase: placing — hint line -->
    <div
      v-else-if="turnPhase === 'placing'"
      class="flex items-center justify-between gap-2 text-xs text-neutral-500"
    >
      <span>{{ currentTeam?.name }}: dra låten till en plats i tidslinjen</span>
      <span class="shrink-0 text-yellow-300">🃏 {{ currentTeamHitsterCards }}</span>
    </div>

    <!-- Skip / trade buttons (always shown in placing phase) -->
    <div
      v-if="turnPhase === 'placing' && currentTeam"
      class="mt-2 flex gap-2"
    >
      <button
        class="flex-1 rounded-lg border border-neutral-700 px-2 py-2 text-xs text-neutral-300 transition hover:border-yellow-400 hover:text-yellow-300 disabled:cursor-not-allowed disabled:opacity-30"
        :disabled="currentTeamHitsterCards <= 0 || !currentCard"
        @click="$emit('skip')"
      >
        🃏 Byt låt (1)
      </button>
      <button
        class="flex-1 rounded-lg border border-neutral-700 px-2 py-2 text-xs text-neutral-300 transition hover:border-yellow-400 hover:text-yellow-300 disabled:cursor-not-allowed disabled:opacity-30"
        :disabled="currentTeamHitsterCards < 3 || !currentCard"
        @click="$emit('trade')"
      >
        🃏 Byt 3 mot kort
      </button>
    </div>
  </header>
</template>
