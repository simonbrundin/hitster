import type { GameCard, GameState, Team } from '../../app/types'

export function getCurrentCard(game: GameState): GameCard | undefined {
  return game.cards.find(card => !card.isRevealed && !card.isDiscarded)
}

export function getPlacedCards(game: GameState): GameCard[] {
  return game.cards
    .filter(card => card.isRevealed && !card.revealed && !card.isDiscarded)
    .sort(sortByPosition)
}

export function getPendingCards(game: GameState): GameCard[] {
  return game.cards
    .filter(card => card.isRevealed && card.revealed && card.isCorrect && !card.isLocked && !card.isDiscarded)
    .sort(sortByPosition)
}

export function getTimelineCards(game: GameState): GameCard[] {
  return getTimelineCardsForTeam(game, game.currentTurn)
}

export function getTimelineCardsForTeam(game: GameState, teamId: string): GameCard[] {
  return game.cards
    .filter((card) => {
      if (!card.isRevealed || card.isDiscarded) return false
      if (card.isReference) return true
      return !card.isLocked || card.lockedByTeamId === teamId
    })
    .sort(sortByPosition)
}

export function getCurrentTeam(game: GameState): Team | undefined {
  const team = game.teams.find(item => item.id === game.currentTurn)
  if (!team) throw createError(400, 'Current team not found')
  return team
}

export function getLastCheckedCard(game: GameState): GameCard | undefined {
  return game.cards.find(card => card.id === game.lastCheckedCardId)
}

export function getChallengerTeam(game: GameState): Team | undefined {
  return game.challengeTeamId
    ? game.teams.find(team => team.id === game.challengeTeamId)
    : undefined
}

export function getDraggableCard(game: GameState): GameCard | null {
  const phase = game.turnPhase
  if (phase === 'checking') return getPlacedCards(game)[0] ?? null
  if (phase === 'placing') return getCurrentCard(game) ?? null
  return null
}

function sortByPosition(a: GameCard, b: GameCard): number {
  return (a.position ?? 0) - (b.position ?? 0)
}

function createError(statusCode: number, message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number }
  error.statusCode = statusCode
  return error
}
