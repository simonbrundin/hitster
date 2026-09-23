import type { GameAction } from '~/types'
import { applyGameAction, getPlayer, sanitizeGameForPlayer } from '../../../utils/game-engine'
import { getGame, setGame } from '../create.post'

export default defineEventHandler(async (event) => {
  const code = normalizeCode(getRouterParam(event, 'code'))
  const body = await readBody<{ playerId?: unknown, action?: unknown }>(event)
  const playerId = requireString(body.playerId, 'Player ID is required')
  const action = parseAction(body.action)
  const game = await getGame(code)

  if (!game) throw createError({ statusCode: 404, message: 'Game not found' })

  const player = getPlayer(game, playerId)
  if (!player || !player.teamId) {
    throw createError({ statusCode: 403, message: 'Player is not part of this game' })
  }

  try {
    const result = applyGameAction(game, { playerId, teamId: player.teamId }, action)
    await setGame(code, game)
    return {
      ...result,
      game: sanitizeGameForPlayer(game, playerId)
    }
  } catch (error) {
    if (isGameError(error)) {
      throw createError({ statusCode: error.statusCode, message: error.message })
    }
    throw error
  }
})

function parseAction(value: unknown): GameAction {
  if (!value || typeof value !== 'object' || !('type' in value) || typeof value.type !== 'string') {
    throw createError({ statusCode: 400, message: 'A valid game action is required' })
  }

  const action = value as Record<string, unknown>
  switch (action.type) {
    case 'place':
    case 'move':
      return {
        type: action.type,
        cardId: requireString(action.cardId, 'Card ID is required'),
        slot: requireNumber(action.slot, 'Timeline slot is required')
      }
    case 'unplace':
      return { type: 'unplace', cardId: requireString(action.cardId, 'Card ID is required') }
    case 'challenge':
      return { type: 'challenge', teamId: requireString(action.teamId, 'Challenge team is required') }
    case 'check':
    case 'lock-in':
    case 'continue':
    case 'finish-turn':
    case 'skip':
    case 'trade':
      return { type: action.type }
    default:
      throw createError({ statusCode: 400, message: 'Unknown game action' })
  }
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== 'string' || !value.trim()) throw createError({ statusCode: 400, message })
  return value.trim()
}

function requireNumber(value: unknown, message: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw createError({ statusCode: 400, message })
  return value
}

function normalizeCode(value: unknown): string {
  return requireString(value, 'Game code is required').toUpperCase()
}

function isGameError(error: unknown): error is Error & { statusCode: number } {
  return error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number'
}
