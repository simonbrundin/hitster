import { describe, expect, it } from 'vitest'
import type { GameCard, Player, SpotifyTrack } from '../app/types'
import {
  applyGameAction,
  createGame,
  sanitizeGameForPlayer,
  startGame,
  getPlayer
} from '../server/utils/game-engine'

const tracks = createTracks(20)

function createPlayingGame(rulesMode: 'original' | 'lock-in' = 'original') {
  const result = createGame(['Team 1', 'Team 2'], rulesMode)
  startGame(result.game, tracks)
  return result
}

function placeCurrentCardCorrectly(game: ReturnType<typeof createPlayingGame>['game'], playerId: string): GameCard {
  const card = game.cards.find(item => !item.isRevealed && !item.isDiscarded)
  if (!card) throw new Error('No current card')

  const reference = game.cards.find(item => item.isReference)
  if (!reference) throw new Error('No reference card')

  const slot = card.track.releaseYear >= reference.track.releaseYear ? 1 : 0
  applyGameAction(game, { playerId, teamId: game.currentTurn }, {
    type: 'place',
    cardId: card.id,
    slot
  })
  return card
}

function createTracks(count: number): SpotifyTrack[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `track-${index}`,
    name: `Track ${index}`,
    artist: 'Test artist',
    album: 'Test album',
    albumImageUrl: '',
    previewUrl: null,
    releaseYear: 1950 + index * 5,
    durationMs: 180000,
    spotifyUrl: `https://open.spotify.com/track/track-${index}`
  }))
}

describe('server game engine', () => {
  it('keeps correct cards pending in the lock-in variant', () => {
    const { game, hostPlayer } = createPlayingGame('lock-in')
    const card = placeCurrentCardCorrectly(game, hostPlayer.id)

    const result = applyGameAction(game, { playerId: hostPlayer.id, teamId: game.currentTurn }, { type: 'check' })

    expect(result.result).toBe('correct')
    expect(game.turnPhase).toBe('decision')
    expect(card.isLocked).toBe(false)
    expect(game.teams[0]?.score).toBe(0)
  })

  it('locks the pending card and passes the turn', () => {
    const { game, hostPlayer } = createPlayingGame('lock-in')
    const firstTeamId = game.currentTurn
    const card = placeCurrentCardCorrectly(game, hostPlayer.id)
    applyGameAction(game, { playerId: hostPlayer.id, teamId: firstTeamId }, { type: 'check' })
    applyGameAction(game, { playerId: hostPlayer.id, teamId: firstTeamId }, { type: 'lock-in' })

    expect(card.isLocked).toBe(true)
    expect(card.lockedByTeamId).toBe(firstTeamId)
    expect(game.teams.find(team => team.id === firstTeamId)?.score).toBe(1)
    expect(game.currentTurn).not.toBe(firstTeamId)
  })

  it('locks correct cards immediately in Original mode', () => {
    const { game, hostPlayer } = createPlayingGame('original')
    const firstTeamId = game.currentTurn
    const card = placeCurrentCardCorrectly(game, hostPlayer.id)
    applyGameAction(game, { playerId: hostPlayer.id, teamId: firstTeamId }, { type: 'check' })

    expect(game.turnPhase).toBe('result')
    expect(card.isLocked).toBe(true)
    expect(game.teams.find(team => team.id === firstTeamId)?.score).toBe(1)
  })

  it('does not expose hidden card metadata to another team', () => {
    const { game } = createPlayingGame('original')
    const hostPlayer = getPlayer(game, game.players[0].id)!
    const otherPlayerId = 'other-player'
    const otherPlayer: Player = {
      id: otherPlayerId,
      name: 'Other player',
      teamId: game.teams[1]?.id ?? null
    }
    game.players.push(otherPlayer)

    const hostView = sanitizeGameForPlayer(game, hostPlayer.id)
    const otherView = sanitizeGameForPlayer(game, otherPlayerId)
    const currentCardId = game.cards.find(card => !card.isRevealed)?.id

    const hostCard = hostView.cards.find(card => card.id === currentCardId)
    const otherCard = otherView.cards.find(card => card.id === currentCardId)

    expect(hostCard?.playbackUri).toContain('spotify:track:')
    expect(hostCard?.track.name).toBe('Hemligt kort')
    expect(otherCard?.playbackUri).toBeUndefined()
    expect(otherCard?.track.name).toBe('Hemligt kort')
  })
})
