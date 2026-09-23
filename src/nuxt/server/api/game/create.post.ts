import type { GameState, Player } from '~/types'
import { createGame } from '../../utils/game-engine'

type StoredGame = GameState & { players: Player[] }
const STORAGE_KEY = 'games'

export async function getGame(code: string): Promise<StoredGame | null> {
  return await useStorage(STORAGE_KEY).getItem<StoredGame>(code) ?? null
}

export async function setGame(code: string, game: StoredGame): Promise<void> {
  await useStorage(STORAGE_KEY).setItem(code, game)
}

export async function deleteGame(code: string): Promise<void> {
  await useStorage(STORAGE_KEY).removeItem(code)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ teams?: unknown, rulesMode?: unknown }>(event)
  const teamNames = validateTeamNames(body.teams)
  const rulesMode = body.rulesMode === 'lock-in' ? 'lock-in' : 'original'
  const { game, hostPlayer } = createGame(teamNames, rulesMode)

  await setGame(game.code, game)

  return {
    game,
    playerId: hostPlayer.id,
    teamId: hostPlayer.teamId,
    isHost: true
  }
})

function validateTeamNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw createError({ statusCode: 400, message: 'At least 2 teams are required' })
  }

  const teamNames = value
    .filter((name): name is string => typeof name === 'string')
    .map(name => name.trim())
    .filter(Boolean)

  if (teamNames.length < 2 || teamNames.length > 4) {
    throw createError({ statusCode: 400, message: 'Between 2 and 4 teams are required' })
  }

  return teamNames
}
