<script setup lang="ts">
import type { GameCard } from '~/types'

const props = defineProps<{
  card: GameCard
  index: number
  turnPhase: string
}>()

const emit = defineEmits<{
  (e: 'drag-start' | 'drag-end', event: DragEvent): void
  (e: 'drag-over', event: DragEvent, index: number): void
  (e: 'touch-start', event: TouchEvent): void
}>()

const isLocked = computed(() => props.card.isLocked)
const isPending = computed(() => props.card.revealed && !props.card.isLocked)
const isDragging = computed(() => !isLocked.value && !props.card.revealed)

function onCardDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  emit('drag-over', event, props.index)
}
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-xl p-3"
    :class="isLocked
      ? 'mr-4 border border-yellow-500/30 bg-neutral-900'
      : isPending
        ? 'ml-4 border border-green-500/30 bg-neutral-900'
        : 'ml-4 cursor-grab border-2 border-dashed border-neutral-600 bg-neutral-900/80 active:cursor-grabbing'"
    :data-timeline-index="index"
    :draggable="isDragging"
    @dragover.stop.prevent="onCardDragOver"
    @dragstart="emit('drag-start', $event)"
    @dragend="emit('drag-end', $event)"
    @touchstart.passive="emit('touch-start', $event)"
  >
    <!-- Revealed or locked card -->
    <template v-if="card.revealed || card.isLocked">
      <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg shadow">
        <img
          :src="card.track.albumImageUrl"
          :alt="card.track.name"
          class="h-full w-full object-cover"
        >
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate font-semibold">
          {{ card.track.name }}
        </p>
        <p class="truncate text-sm text-neutral-500">
          {{ card.track.artist }}
        </p>
      </div>
      <div class="flex-shrink-0 text-right">
        <p
          class="text-lg font-bold"
          :class="card.isLocked ? 'text-yellow-400' : 'text-green-400'"
        >
          {{ card.track.releaseYear }}
        </p>
        <p
          class="text-xs"
          :class="card.isLocked ? 'text-yellow-400' : 'text-green-400'"
        >
          {{ card.isLocked ? '🔒' : '✓' }}
        </p>
      </div>
    </template>

    <!-- Hidden (current) card -->
    <template v-else>
      <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-2xl">
        🎵
      </div>
      <div class="min-w-0 flex-1">
        <p class="font-semibold">
          Hemligt kort
        </p>
        <p class="text-sm text-neutral-500">
          Dra kortet för att ändra placering
        </p>
      </div>
      <div class="flex-shrink-0 text-right">
        <p class="text-lg font-bold text-neutral-400">
          ?
        </p>
      </div>
    </template>
  </div>
</template>
