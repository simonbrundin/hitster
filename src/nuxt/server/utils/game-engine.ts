import type { GameAction, GameCard, GameRulesMode, GameState, Player, SpotifyTrack, Team } from '../../app/types'
import {
  getCurrentCard,
  getPlacedCards,
  getPendingCards,
  getTimelineCards,
  getCurrentTeam,
  getChallengerTeam
} from './game-queries'

const TEAM_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
const HIDDEN_TRACK: SpotifyTrack = {
  id: '',
  name: 'Hemligt kort',
  artist: '',
  album: '',
  albumImageUrl: '',
  previewUrl: null,
  releaseYear: 0,
  durationMs: 0,
  spotifyUrl: ''
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface GameActor {
  playerId: string
  teamId: string
}

export interface ActionResult {
  result?: 'correct' | 'wrong'
  message?: string
}

export function createGame(
  teamNames: string[],
  rulesMode: GameRulesMode,
  hostName = 'Host'
): { game: GameState & { players: Player[] }, hostPlayer: Player } {
  const teams: Team[] = teamNames.map((name, index) => ({
    id: generateId(),
    name: name.trim(),
    color: TEAM_COLORS[index % TEAM_COLORS.length] || '#FF6B6B',
    members: [],
    score: 0,
    hitsterCards: 3,
    isActive: true
  }))

  const hostPlayer: Player = {
    id: generateId(),
    name: hostName,
    teamId: teams[0]?.id ?? null
  }
  teams[0]?.members.push(hostPlayer.name)

  const game = {
    id: generateId(),
    code: generateGameCode(),
    status: 'lobby' as const,
    teams,
    players: [hostPlayer],
    currentRound: 0,
    totalRounds: 5,
    currentTurn: teams[0]?.id ?? '',
    rulesMode,
    turnPhase: 'placing' as const,
    lastResult: null,
    lastCheckedCardId: null,
    lastMessage: null,
    challengeTeamId: null,
    cards: [],
    goldenShotRevealed: false,
    winner: null
  }

  return { game, hostPlayer }
}

export function startGame(game: GameState, tracks: SpotifyTrack[], goldenShotCount = 1): void {
  if (tracks.length < 10) {
    throw createGameError(400, 'At least 10 usable tracks are required')
  }

  const selectedTracks = shuffle(tracks).slice(0, 50)
  game.cards = selectedTracks.map((track, index) => createCard(track, index < goldenShotCount))
  game.status = 'playing'
  game.currentRound = 1
  game.turnPhase = 'placing'
  game.lastResult = null
  game.lastCheckedCardId = null
  game.lastMessage = null
  game.challengeTeamId = null

  const referenceCard = [...game.cards]
    .filter(card => !card.isGoldenShot)
    .sort((a, b) => a.track.releaseYear - b.track.releaseYear)[0]

  if (!referenceCard) return

  referenceCard.isRevealed = true
  referenceCard.revealed = true
  referenceCard.isCorrect = true
  referenceCard.isLocked = true
  referenceCard.isReference = true
  referenceCard.position = 0
}

export function applyGameAction(
  game: GameState,
  actor: GameActor,
  action: GameAction
): ActionResult {
  assertGameIsPlaying(game)
  assertActorCanAct(game, actor, action)

  switch (action.type) {
    case 'place': return handlePlace(game, action.cardId, action.slot)
    case 'move': return handleMove(game, action.cardId, action.slot)
    case 'unplace': return handleUnplace(game, action.cardId)
    case 'check': return handleCheck(game)
    case 'lock-in': return handleLockIn(game)
    case 'continue': return handleContinue(game)
    case 'finish-turn': return handleFinishTurn(game)
    case 'challenge': return handleChallenge(game, actor.teamId, action.teamId)
    case 'skip': return handleSkip(game)
    case 'trade': return handleTrade(game)
  }
}

export function sanitizeGameForPlayer(game: GameState, playerId: string): GameState {
  const player = getPlayer(game, playerId)
  const visibleTeamId = player?.teamId ?? null
  const cards = game.cards.map(card => sanitizeCard(card, game, visibleTeamId))

  return {
    ...game,
    viewerTeamId: visibleTeamId,
    cards,
    teams: game.teams.map(team => ({ ...team, members: [...team.members] })),
    players: game.players.map(p => ({ ...p }))
  }
}

export function getPlayer(game: GameState, playerId: string): Player | undefined {
  const players = (game as GameState & { players?: Player[] }).players ?? []
  return players.find(p => p.id === playerId)
}

export function addPlayer(game: GameState, name: string, teamId: string): Player {
  if (game.status !== 'lobby') throw createGameError(400, 'Game has already started')

  const team = game.teams.find(item => item.id === teamId)
  if (!team) throw createGameError(404, 'Team not found')

  const player: Player = { id: generateId(), name: name.trim(), teamId }
  const players = (game as GameState & { players: Player[] }).players
  players.push(player)
  team.members.push(player.name)
  return player
}

export function createGameError(statusCode: number, message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number }
  error.statusCode = statusCode
  return error
}

// ── Private handlers ─────────────────────────────────────────────────────────

function handlePlace(game: GameState, cardId: string, requestedSlot: number): ActionResult {
  assertPhase(game, 'placing')
  const card = getCurrentCard(game)
  if (!card || card.id !== cardId) throw createGameError(400, 'Card cannot be placed')

  const timeline = getTimelineCards(game)
  const slot = clamp(Math.round(requestedSlot), 0, timeline.length)
  timeline.forEach((item) => {
    if ((item.position ?? 0) >= slot) item.position = (item.position ?? 0) + 1
  })

  card.position = slot
  card.isRevealed = true
  card.revealed = false
  card.isCorrect = false
  card.isLocked = false
  card.lockedByTeamId = null
  card.isDiscarded = false
  game.turnPhase = 'checking'
  clearResult(game)

  return {}
}

function handleMove(game: GameState, cardId: string, requestedSlot: number): ActionResult {
  assertPhase(game, 'checking')
  const card = getPlacedCards(game)[0]
  if (!card || card.id !== cardId) throw createGameError(400, 'Card cannot be moved')

  const timeline = getTimelineCards(game)
  const oldIndex = timeline.findIndex(item => item.id === card.id)
  const remaining = timeline.filter(item => item.id !== card.id)
  let slot = Math.round(requestedSlot)
  if (slot > oldIndex) slot -= 1
  slot = clamp(slot, 0, remaining.length)
  remaining.splice(slot, 0, card)
  reindexTimeline(remaining)

  return {}
}

function handleUnplace(game: GameState, cardId: string): ActionResult {
  assertPhase(game, 'checking')
  const card = getPlacedCards(game)[0]
  if (!card || card.id !== cardId) throw createGameError(400, 'Card cannot be unplaced')

  card.isRevealed = false
  card.revealed = false
  card.position = null
  game.turnPhase = 'placing'
  clearResult(game)

  return {}
}

function handleCheck(game: GameState): ActionResult {
  assertPhase(game, 'checking')
  const card = getPlacedCards(game)[0]
  if (!card) throw createGameError(400, 'No card is waiting to be checked')

  const correct = isCorrectPlacement(game, card)
  card.revealed = true
  card.isCorrect = correct
  game.lastCheckedCardId = card.id
  game.lastResult = correct ? 'correct' : 'wrong'

  if (!correct) return handleWrongPlacement(game, card.id)

  if (game.rulesMode === 'lock-in') {
    game.lastMessage = 'Rätt placering! Lås in kortet eller ta nästa låt.'
    game.turnPhase = 'decision'
    return { result: 'correct', message: game.lastMessage }
  }

  lockCardsForTeam(game, [card], game.currentTurn)
  game.lastMessage = 'Rätt placering! Kortet stannar på lagets tidslinje.'
  game.turnPhase = 'result'
  return { result: 'correct', message: game.lastMessage }
}

function handleWrongPlacement(game: GameState, cardId: string): ActionResult {
  const challenger = getChallengerTeam(game)

  if (challenger) {
    discardPendingCards(game, cardId)
    const card = game.cards.find(c => c.id === cardId)
    if (card) {
      card.isLocked = true
      card.isCorrect = true
      card.lockedByTeamId = challenger.id
      card.isDiscarded = false
    }
    challenger.score += 1
    reindexTimeline(getTimelineCardsForTeam(game, challenger.id))
    game.lastMessage = `${challenger.name} vann utmaningen och tog kortet.`
  } else {
    discardPendingCards(game)
    game.lastMessage = 'Fel placering. Alla obankade kort försvann.'
  }

  game.challengeTeamId = null
  game.turnPhase = 'result'
  return { result: 'wrong', message: game.lastMessage }
}

function handleLockIn(game: GameState): ActionResult {
  assertPhase(game, 'decision')
  const pending = getPendingCards(game)
  if (!pending.length) throw createGameError(400, 'No pending cards to lock')

  lockCardsForTeam(game, pending, game.currentTurn)
  clearResult(game)
  advanceTurn(game)

  return {}
}

function handleContinue(game: GameState): ActionResult {
  assertPhase(game, 'decision')
  if (!getPendingCards(game).length) throw createGameError(400, 'No pending cards to carry forward')
  game.turnPhase = 'placing'
  game.lastMessage = null

  return {}
}

function handleFinishTurn(game: GameState): ActionResult {
  assertPhase(game, 'result')
  clearResult(game)
  advanceTurn(game)

  return {}
}

function handleChallenge(game: GameState, challengerTeamId: string, challengedTeamId: string): ActionResult {
  assertPhase(game, 'checking')
  if (challengerTeamId === game.currentTurn || challengedTeamId !== game.currentTurn) {
    throw createGameError(400, 'Invalid challenge team')
  }

  const challenger = game.teams.find(team => team.id === challengerTeamId)
  if (!challenger || (challenger.hitsterCards ?? 0) <= 0) {
    throw createGameError(400, 'Team has no Hitster cards left')
  }

  challenger.hitsterCards -= 1
  game.challengeTeamId = challengerTeamId
  game.lastMessage = `${challenger.name} utmanar placeringen.`

  return {}
}

function handleSkip(game: GameState): ActionResult {
  assertPhase(game, 'placing')
  const team = getCurrentTeam(game)
  if (!team) throw createGameError(400, 'Current team not found')
  const card = getCurrentCard(game)
  if (!card || team.hitsterCards <= 0) throw createGameError(400, 'Cannot skip this card')

  team.hitsterCards -= 1
  card.isRevealed = true
  card.isDiscarded = true
  card.position = null
  clearResult(game)
  endGameIfNeeded(game)

  return {}
}

function handleTrade(game: GameState): ActionResult {
  assertPhase(game, 'placing')
  const team = getCurrentTeam(game)
  if (!team) throw createGameError(400, 'Current team not found')
  const card = getCurrentCard(game)
  if (!card || team.hitsterCards < 3) throw createGameError(400, 'Not enough Hitster cards')

  team.hitsterCards -= 3
  card.isRevealed = true
  card.revealed = true
  card.isCorrect = true
  card.isLocked = true
  card.lockedByTeamId = team.id
  card.isDiscarded = false
  reindexTimeline(getTimelineCardsForTeam(game, team.id))
  team.score += 1
  game.lastMessage = `${team.name} bytte tre Hitsterkort mot en låst låt.`
  endGameIfNeeded(game)

  return {}
}

// ── Private helpers ─────────────────────────────────────────────────────────

function getTimelineCardsForTeam(game: GameState, teamId: string): GameCard[] {
  return game.cards
    .filter((card) => {
      if (!card.isRevealed || card.isDiscarded) return false
      if (card.isReference) return true
      return !card.isLocked || card.lockedByTeamId === teamId
    })
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
}

function lockCardsForTeam(game: GameState, cards: GameCard[], teamId: string): void {
  const team = game.teams.find(item => item.id === teamId)
  if (!team) throw createGameError(400, 'Current team not found')

  cards.forEach((card) => {
    card.isLocked = true
    card.isCorrect = true
    card.lockedByTeamId = team.id
    team.score += 1
  })
  reindexTimeline(getTimelineCardsForTeam(game, team.id))
}

function discardPendingCards(game: GameState, exceptCardId?: string): void {
  getTimelineCards(game)
    .filter(card => !card.isLocked && card.id !== exceptCardId)
    .forEach((card) => {
      card.isDiscarded = true
      card.position = null
    })

  const currentCard = exceptCardId ? game.cards.find(card => card.id === exceptCardId) : undefined
  if (currentCard && !currentCard.isLocked) {
    currentCard.isDiscarded = true
    currentCard.position = null
  }
}

function advanceTurn(game: GameState): void {
  const currentIndex = game.teams.findIndex(team => team.id === game.currentTurn)
  const nextTeam = game.teams[(currentIndex + 1) % game.teams.length]
  if (nextTeam) game.currentTurn = nextTeam.id
  game.currentRound += 1
  game.turnPhase = 'placing'
  endGameIfNeeded(game)
}

function endGameIfNeeded(game: GameState): void {
  const winningTeam = game.teams.find(team => team.score >= 10)
  const hasCards = game.cards.some(card => !card.isRevealed && !card.isDiscarded)
  if (!winningTeam && hasCards) return

  game.status = 'finished'
  game.winner = winningTeam
    ?? [...game.teams].sort((a, b) => b.score - a.score)[0]
    ?? null
}

function isCorrectPlacement(game: GameState, card: GameCard): boolean {
  const timeline = getTimelineCards(game)
  const index = timeline.findIndex(item => item.id === card.id)
  if (index < 0) return false

  const previous = timeline[index - 1]
  const next = timeline[index + 1]
  return (!previous || previous.track.releaseYear <= card.track.releaseYear)
    && (!next || card.track.releaseYear <= next.track.releaseYear)
}

function clearResult(game: GameState): void {
  game.lastResult = null
  game.lastCheckedCardId = null
  game.lastMessage = null
}

function assertPhase(game: GameState, phase: NonNullable<GameState['turnPhase']>): void {
  if (game.turnPhase !== phase) {
    throw createGameError(400, `Action is not valid during ${game.turnPhase} phase`)
  }
}

function assertGameIsPlaying(game: GameState): void {
  if (game.status !== 'playing') throw createGameError(400, 'Game is not playing')
}

function assertActorCanAct(
  game: GameState,
  actor: GameActor,
  action: GameAction
): void {
  const players = (game as GameState & { players?: Player[] }).players ?? []
  const player = players.find(p => p.id === actor.playerId)
  if (!player || player.teamId !== actor.teamId) {
    throw createGameError(403, 'Player is not a member of this team')
  }

  const isChallenge = action.type === 'challenge'
  if (!isChallenge && game.currentTurn !== actor.teamId) {
    throw createGameError(403, 'It is not this team\'s turn')
  }
}

function reindexTimeline(cards: GameCard[]): void {
  cards.forEach((card, index) => {
    card.position = index
  })
}

function toSpotifyUri(spotifyUrl: string, trackId?: string): string {
  const value = spotifyUrl.trim()
  if (value.startsWith('spotify:track:')) return value.split('?')[0] ?? ''

  const trackIdFromUrl = value.match(/(?:open\.spotify\.com\/(?:intl-[^/]+\/)?track\/)([A-Za-z0-9]+)/)?.[1]
  const id = trackIdFromUrl ?? trackId?.trim()
  return id ? `spotify:track:${id}` : ''
}

function sanitizeCard(card: GameCard, game: GameState, visibleTeamId: string | null): GameCard {
  const canSeeMetadata = card.isReference
    || card.revealed
    || (card.isLocked && card.lockedByTeamId === visibleTeamId)
  const isCurrentCard = !card.isRevealed && !card.isDiscarded && game.currentTurn === visibleTeamId

  if (canSeeMetadata) return { ...card, track: { ...card.track } }
  if (isCurrentCard) {
    return {
      ...card,
      track: { ...HIDDEN_TRACK },
      playbackUri: toSpotifyUri(card.track.spotifyUrl, card.track.id)
    }
  }

  return { ...card, track: { ...HIDDEN_TRACK } }
}

function createCard(track: SpotifyTrack, isGoldenShot: boolean): GameCard {
  return {
    id: generateId(),
    track,
    isGoldenShot,
    isRevealed: false,
    position: null,
    revealed: false,
    isCorrect: false,
    isLocked: false,
    lockedByTeamId: null,
    isReference: false,
    isDiscarded: false
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(value, maximum))
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function generateId(): string {
  return crypto.randomUUID()
}
