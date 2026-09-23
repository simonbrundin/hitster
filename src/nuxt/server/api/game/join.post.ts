import { addPlayer, sanitizeGameForPlayer } from '../../utils/game-engine'
import { getGame, setGame } from './create.post'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ code?: unknown, playerName?: unknown, teamId?: unknown }>(event)
  const code = normalizeCode(body.code)
  const playerName = normalizePlayerName(body.playerName)
  const game = await getGame(code)

  if (!game) {
    throw createError({ statusCode: 404, message: 'Game not found' })
  }

  const teamId = resolveTeamId(game.teams, body.teamId)
  const player = addPlayer(game, playerName, teamId)
  await setGame(code, game)

  return {
    success: true,
    playerId: player.id,
    teamId: player.teamId,
    game: sanitizeGameForPlayer(game, player.id)
  }
})

function normalizeCode(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({ statusCode: 400, message: 'Game code is required' })
  }
  return value.trim().toUpperCase()
}

function normalizePlayerName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({ statusCode: 400, message: 'Player name is required' })
  }
  return value.trim().slice(0, 40)
}

function resolveTeamId(teams: { id: string, members: string[] }[], requestedTeamId: unknown): string {
  if (typeof requestedTeamId === 'string') {
    const requestedTeam = teams.find(team => team.id === requestedTeamId)
    if (!requestedTeam) throw createError({ statusCode: 404, message: 'Team not found' })
    return requestedTeam.id
  }

  return [...teams].sort((a, b) => a.members.length - b.members.length)[0]?.id ?? ''
}
