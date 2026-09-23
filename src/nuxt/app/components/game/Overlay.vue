<script setup lang="ts">
import type { Team } from '~/types'

defineProps<{
  winner: Team | null
}>()

defineEmits<{ (e: 'show-results'): void }>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
    <div class="w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900 p-6 text-center">
      <div class="mb-3 text-5xl">
        🎉
      </div>
      <h2 class="text-2xl font-bold">
        Game Over!
      </h2>
      <p class="mt-1 text-neutral-400">
        {{ winner?.name }} vinner!
      </p>
      <UButton
        size="lg"
        color="primary"
        class="mt-5 w-full"
        @click="$emit('show-results')"
      >
        <Icon
          name="i-lucide-trophy"
          class="mr-2 h-5 w-5"
        />
        Se resultat
      </UButton>
    </div>
  </div>
</template>
