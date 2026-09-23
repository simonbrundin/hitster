import type { GameCard, GameState } from '~/types'
import { useGame } from './useGame'

/**
 * Provides timeline-specific queries and computed values for the game UI.
 * Acts as the presentation layer between the raw game state and the view.
 */
export function useTimeline() {
  const { gameState, isCurrentViewerTurn } = useGame()

  // ── Selectors ────────────────────────────────────────────────────────────

  const timelineCards = computed<GameCard[]>(() => {
    const state = gameState.value
    if (!state) return []
    const teamId = state.currentTurn
    return state.cards
      .filter((card) => {
        if (!card.isRevealed || card.isDiscarded) return false
        if (card.isReference) return true
        return !card.isLocked || card.lockedByTeamId === teamId
      })
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  })

  const currentCard = computed<GameCard | undefined>(() => {
    const state = gameState.value
    if (!state) return undefined
    return state.cards.find(card => !card.isRevealed && !card.isDiscarded)
  })

  const placedCards = computed<GameCard[]>(() => {
    const state = gameState.value
    if (!state) return []
    return state.cards
      .filter(card => card.isRevealed && !card.revealed && !card.isDiscarded)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  })

  const pendingCards = computed<GameCard[]>(() => {
    const state = gameState.value
    if (!state) return []
    return state.cards
      .filter(card => card.isRevealed && card.revealed && card.isCorrect && !card.isLocked && !card.isDiscarded)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  })

  const lastCheckedCard = computed<GameCard | undefined>(() => {
    const state = gameState.value
    if (!state?.lastCheckedCardId) return undefined
    return state.cards.find(card => card.id === state.lastCheckedCardId)
  })

  const currentTeam = computed(() => {
    const state = gameState.value
    if (!state) return null
    return state.teams.find(team => team.id === state.currentTurn) ?? null
  })

  const turnPhase = computed<NonNullable<GameState['turnPhase']>>(() => {
    return gameState.value?.turnPhase ?? 'placing'
  })

  const isLockInVariant = computed(() => gameState.value?.rulesMode === 'lock-in')

  const isViewerTurn = computed(() => isCurrentViewerTurn())

  const lastResult = computed<'correct' | 'wrong' | null>(() => {
    return gameState.value?.lastResult ?? null
  })

  const lastMessage = computed<string | null>(() => {
    return gameState.value?.lastMessage ?? null
  })

  const challengeTeamId = computed<string | null>(() => {
    return gameState.value?.challengeTeamId ?? null
  })

  const currentTeamHitsterCards = computed(() => {
    return currentTeam.value?.hitsterCards ?? 3
  })

  const isGameFinished = computed(() => gameState.value?.status === 'finished')

  const opponentTeams = computed(() => {
    const state = gameState.value
    if (!state) return []
    return state.teams.filter(team => team.id !== state.currentTurn)
  })

  const spotifyUri = computed<string>(() => {
    const card = currentCard.value
    const url = card?.playbackUri ?? card?.track.spotifyUrl
    if (!url) return ''
    return url
      .replace('https://open.spotify.com/track/', 'spotify:track:')
      .split('?')[0] ?? ''
  })

  return {
    // State
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
    opponentTeams,
    spotifyUri
  }
}
