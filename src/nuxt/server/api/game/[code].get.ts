import { getGame } from './create.post'
import { sanitizeGameForPlayer } from '../../utils/game-engine'

export default defineEventHandler(async (event) => {
  const code = normalizeCode(getRouterParam(event, 'code'))
  const game = await getGame(code)

  if (!game) {
    throw createError({ statusCode: 404, message: 'Game not found' })
  }

  const playerId = getQuery(event).playerId
  const sanitized = sanitizeGameForPlayer(game, typeof playerId === 'string' ? playerId : '')

  return { game: sanitized }
})

function normalizeCode(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({ statusCode: 400, message: 'Game code is required' })
  }
  return value.trim().toUpperCase()
}
