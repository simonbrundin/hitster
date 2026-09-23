<script setup lang="ts">
defineProps<{
  code: string
  size?: 'sm' | 'md' | 'lg'
}>()

const copied = ref(false)

const copyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <div class="inline-flex items-center gap-2">
    <code
      :class="[
        'font-mono font-bold tracking-wider rounded-lg px-4 py-2',
        'bg-neutral-800 text-white border-2 border-neutral-700',
        size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'
      ]"
    >
      {{ code }}
    </code>

    <UButton
      :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
      :color="copied ? 'primary' : 'neutral'"
      variant="ghost"
      size="sm"
      :aria-label="copied ? 'Copied!' : 'Copy code'"
      @click="copyCode(code)"
    />
  </div>
</template>
