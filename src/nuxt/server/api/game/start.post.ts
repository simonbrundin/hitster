import type { SpotifyTrack } from '~/types'
import { getPlayer, sanitizeGameForPlayer, startGame } from '../../utils/game-engine'
import { getGame, setGame } from './create.post'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ code?: unknown, playerId?: unknown, tracks?: unknown }>(event)
  const code = normalizeCode(body.code)
  const playerId = requireString(body.playerId, 'Player ID is required')
  const game = await getGame(code)

  if (!game) throw createError({ statusCode: 404, message: 'Game not found' })
  if (game.status !== 'lobby') throw createError({ statusCode: 400, message: 'Game has already started' })

  const player = getPlayer(game, playerId)
  if (!player || player.id !== game.players[0]?.id) {
    throw createError({ statusCode: 403, message: 'Only the game host can start the game' })
  }

  const tracks = parseTracks(body.tracks)
  try {
    startGame(game, tracks)
  } catch (error) {
    if (isGameError(error)) {
      throw createError({ statusCode: error.statusCode, message: error.message })
    }
    throw error
  }

  await setGame(code, game)
  return { success: true, game: sanitizeGameForPlayer(game, playerId) }
})

function parseTracks(value: unknown): SpotifyTrack[] {
  if (!Array.isArray(value)) {
    throw createError({ statusCode: 400, message: 'At least 10 tracks are required' })
  }

  const tracks = value.filter(isSpotifyTrack)
  if (tracks.length < 10) {
    throw createError({ statusCode: 400, message: 'At least 10 usable tracks are required' })
  }
  return tracks
}

function isSpotifyTrack(value: unknown): value is SpotifyTrack {
  if (!value || typeof value !== 'object') return false
  const track = value as Partial<SpotifyTrack>
  return typeof track.id === 'string'
    && typeof track.name === 'string'
    && typeof track.artist === 'string'
    && typeof track.album === 'string'
    && typeof track.releaseYear === 'number'
    && typeof track.spotifyUrl === 'string'
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== 'string' || !value.trim()) throw createError({ statusCode: 400, message })
  return value.trim()
}

function normalizeCode(value: unknown): string {
  return requireString(value, 'Game code is required').toUpperCase()
}

function isGameError(error: unknown): error is Error & { statusCode: number } {
  return error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number'
}
