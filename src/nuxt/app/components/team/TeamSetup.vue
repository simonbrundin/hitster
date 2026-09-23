<script setup lang="ts">
const props = defineProps<{
  initialTeams?: string[]
  minTeams?: number
  maxTeams?: number
}>()

const emit = defineEmits<{
  (e: 'update:teams' | 'start', teams: string[]): void
}>()

const teams = ref<string[]>(props.initialTeams?.length ? [...props.initialTeams] : ['Team 1', 'Team 2'])
const min = props.minTeams ?? 2
const max = props.maxTeams ?? 4

const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']

const addTeam = () => {
  if (teams.value.length < max) {
    teams.value.push(`Team ${teams.value.length + 1}`)
  }
}

const removeTeam = (index: number) => {
  if (teams.value.length > min) {
    teams.value.splice(index, 1)
  }
}

const updateTeamName = (index: number, name: string) => {
  teams.value[index] = name
}

watch(teams, (newTeams) => {
  emit('update:teams', newTeams)
}, { deep: true })

const handleStart = () => {
  emit('start', teams.value)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-2xl font-semibold tracking-tight text-[#17211d]">
        Setup your teams
      </h3>
      <UButton
        v-if="teams.length < max"
        icon="i-lucide-plus"
        variant="outline"
        size="sm"
        @click="addTeam"
      >
        Add Team
      </UButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="(team, index) in teams"
        :key="index"
        class="flex items-center gap-3"
      >
        <div
          class="w-4 h-4 rounded-full shrink-0"
          :style="{ backgroundColor: colors[index % colors.length] }"
        />

        <UInput
          :model-value="team"
          :placeholder="`Team ${index + 1}`"
          color="neutral"
          variant="outline"
          class="flex-1"
          @update:model-value="(val) => updateTeamName(index, val as string)"
        />

        <UButton
          v-if="teams.length > min"
          icon="i-lucide-trash-2"
          variant="ghost"
          color="error"
          size="sm"
          @click="removeTeam(index)"
        />
      </div>
    </div>

    <div class="border-t border-[#17211d]/10 pt-5">
      <UButton
        size="lg"
        class="w-full"
        :disabled="teams.some(t => !t.trim())"
        @click="handleStart"
      >
        <Icon
          name="i-lucide-play"
          class="w-5 h-5 mr-2"
        />
        Start Game
      </UButton>
    </div>
  </div>
</template>
