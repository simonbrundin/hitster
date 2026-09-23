import type { GameAction, GameCard, GameRulesMode, GameState, SpotifyTrack, Team } from '~/types'

export type TurnPhase = 'placing' | 'checking' | 'decision' | 'result'
export type CheckResult = 'correct' | 'wrong'

type GameResponse = {
  game: GameState
  success?: boolean
  result?: CheckResult
  message?: string
  isHost?: boolean
}

type ActionResponse = { success: boolean, result?: CheckResult }

const PLAYER_ID_KEY = 'hitster_player_id'
const IS_HOST_KEY = 'hitster_is_host'
const POLL_INTERVAL_MS = 1000

export function useGame() {
  const gameState = useState<GameState | null>('game_state', () => null)
  const playerId = useState<string>('player_id', () => getStoredPlayerId())
  const isHost = useState<boolean>('game_is_host', () => getStoredIsHost())
  const syncError = useState<string | null>('game_sync_error', () => null)
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let actionQueue = Promise.resolve()

  const getTurnPhase = (): TurnPhase => gameState.value?.turnPhase ?? 'placing'

  const createGame = async (
    teamNames: string[],
    rulesMode: GameRulesMode = 'original'
  ): Promise<GameState | null> => {
    const response = await request<GameResponse & { playerId: string }>('/api/game/create', {
      method: 'POST',
      body: { teams: teamNames, rulesMode }
    })
    if (!response) return null

    playerId.value = response.playerId
    savePlayerId(response.playerId)
    const isHostResponse = !!(response as GameResponse & { isHost?: boolean }).isHost
    isHost.value = isHostResponse
    saveIsHost(isHostResponse)
    applyGameResponse(response)
    return response.game
  }

  const startGame = async (tracks: SpotifyTrack[]): Promise<boolean> => {
    const state = gameState.value
    if (!state || tracks.length < 10) return false

    // Guard: if stored playerId doesn't match any player in the game, it's stale
    const players = state.players
    if (players?.length && !players.some(p => p.id === playerId.value)) {
      console.warn('[startGame] Stored playerId does not belong to this game — clearing stale state')
      clearGameState()
      return false
    }

    const response = await request<GameResponse>('/api/game/start', {
      method: 'POST',
      body: { code: state.code, playerId: playerId.value, tracks }
    })
    if (!response) return false

    applyGameResponse(response)
    return true
  }

  const joinGame = async (code: string, name: string, teamId: string): Promise<boolean> => {
    const response = await request<GameResponse & { playerId: string }>('/api/game/join', {
      method: 'POST',
      body: { code, playerName: name, teamId }
    })
    if (!response) return false

    playerId.value = response.playerId
    savePlayerId(response.playerId)
    isHost.value = false
    saveIsHost(false)
    applyGameResponse(response)
    return true
  }

  const getGameByCode = async (code: string): Promise<GameState | null> => {
    const response = await request<GameResponse>(`/api/game/${encodeURIComponent(code)}`, {
      query: { playerId: playerId.value }
    })
    if (!response) return null

    const gamePlayers = response.game.players
    if (gamePlayers?.length && !gamePlayers.some(p => p.id === playerId.value)) {
      console.warn('[getGameByCode] Stored playerId not in game — clearing stale state')
      clearGameState()
      return null
    }

    applyGameResponse(response)
    return response.game
  }

  const clearGameState = () => {
    gameState.value = null
    isHost.value = false
    localStorage.removeItem('hitster_game_state')
    localStorage.removeItem('hitster_player_id')
    localStorage.removeItem('hitster_is_host')
  }

  const refreshGame = async (): Promise<GameState | null> => {
    if (!gameState.value?.code) return null
    return getGameByCode(gameState.value.code)
  }

  const startPolling = () => {
    stopPolling()
    void refreshGame()
    pollTimer = setInterval(() => {
      void refreshGame()
    }, POLL_INTERVAL_MS)
  }

  const stopPolling = () => {
    if (!pollTimer) return
    clearInterval(pollTimer)
    pollTimer = null
  }

  const isCurrentViewerTurn = (): boolean => {
    if (!gameState.value) return false
    return !gameState.value.viewerTeamId || gameState.value.viewerTeamId === gameState.value.currentTurn
  }

  const getCurrentCard = (): GameCard | null => {
    if (!gameState.value || !isCurrentViewerTurn()) return null
    return gameState.value.cards.find(card => !card.isRevealed && !card.isDiscarded) ?? null
  }

  const getPlacedCards = (): GameCard[] => {
    if (!gameState.value) return []
    return gameState.value.cards
      .filter(card => card.isRevealed && !card.revealed && !card.isDiscarded)
      .sort(sortByPosition)
  }

  const getPendingCards = (): GameCard[] => {
    if (!gameState.value || !isCurrentViewerTurn()) return []
    return gameState.value.cards
      .filter(card => card.isRevealed && card.revealed && card.isCorrect && !card.isLocked && !card.isDiscarded)
      .sort(sortByPosition)
  }

  const getTimelineCards = (): GameCard[] => {
    const state = gameState.value
    if (!state) return []
    const viewerTeamId = state.viewerTeamId ?? state.currentTurn
    return state.cards
      .filter(card => isVisibleOnCurrentTimeline(card, viewerTeamId, state.currentTurn))
      .sort(sortByPosition)
  }

  const placeCard = (cardId: string, slot: number): Promise<ActionResponse> =>
    dispatch({ type: 'place', cardId, slot })

  const moveCard = (cardId: string, slot: number): Promise<ActionResponse> =>
    dispatch({ type: 'move', cardId, slot })

  const unplaceCard = (cardId: string): Promise<ActionResponse> =>
    dispatch({ type: 'unplace', cardId })

  const checkPlacedCard = (): Promise<ActionResponse> => dispatch({ type: 'check' })
  const lockPendingCards = (): Promise<ActionResponse> => dispatch({ type: 'lock-in' })
  const continueTurn = (): Promise<ActionResponse> => dispatch({ type: 'continue' })
  const finishTurn = (): Promise<ActionResponse> => dispatch({ type: 'finish-turn' })
  const challengePlacedCard = (teamId: string): Promise<ActionResponse> => dispatch({ type: 'challenge', teamId })
  const skipCurrentCard = (): Promise<ActionResponse> => dispatch({ type: 'skip' })
  const tradeTokensForCard = (): Promise<ActionResponse> => dispatch({ type: 'trade' })

  const getLeaderboard = (): Team[] => {
    if (!gameState.value) return []
    return [...gameState.value.teams].sort((a, b) => b.score - a.score)
  }

  async function dispatch(action: GameAction): Promise<ActionResponse> {
    const requestPromise = actionQueue.then(async () => {
      const state = gameState.value
      if (!state) return { success: false }

      const response = await request<GameResponse>(`/api/game/${state.code}/action`, {
        method: 'POST',
        body: { playerId: playerId.value, action }
      })
      if (!response) return { success: false }

      applyGameResponse(response)
      return {
        success: true,
        result: response.result
      }
    })

    actionQueue = requestPromise.then(() => undefined, () => undefined)
    return requestPromise
  }

  async function request<T>(url: string, options: Record<string, unknown> = {}): Promise<T | null> {
    syncError.value = null
    try {
      return await $fetch<T>(url, options) as T
    } catch (error: unknown) {
      syncError.value = getRequestErrorMessage(error)
      return null
    }
  }

  function applyGameResponse(response: GameResponse): void {
    gameState.value = response.game
    if (response.game.status === 'finished') stopPolling()
  }

  return {
    gameState,
    playerId,
    syncError,
    createGame,
    startGame,
    joinGame,
    getGameByCode,
    refreshGame,
    startPolling,
    stopPolling,
    getCurrentCard,
    getPlacedCards,
    getPendingCards,
    getTimelineCards,
    isCurrentViewerTurn,
    getTurnPhase,
    placeCard,
    moveCard,
    unplaceCard,
    checkPlacedCard,
    lockPendingCards,
    continueTurn,
    challengePlacedCard,
    skipCurrentCard,
    tradeTokensForCard,
    finishTurn,
    getLeaderboard,
    clearGameState,
    isHost
  }
}

function isVisibleOnCurrentTimeline(card: GameCard, viewerTeamId: string, activeTeamId: string): boolean {
  if (!card.isRevealed || card.isDiscarded) return false
  if (card.isReference) return true
  if (!card.isLocked) return viewerTeamId === activeTeamId
  return card.lockedByTeamId === viewerTeamId
}

function sortByPosition(a: GameCard, b: GameCard): number {
  return (a.position ?? 0) - (b.position ?? 0)
}

function getStoredPlayerId(): string {
  if (import.meta.client) {
    const stored = localStorage.getItem(PLAYER_ID_KEY)
    if (stored) return stored
  }
  return createClientId()
}

function savePlayerId(id: string): void {
  if (import.meta.client) localStorage.setItem(PLAYER_ID_KEY, id)
}

function getStoredIsHost(): boolean {
  if (!import.meta.client) return false
  return localStorage.getItem(IS_HOST_KEY) === 'true'
}

function saveIsHost(value: boolean): void {
  if (import.meta.client) localStorage.setItem(IS_HOST_KEY, String(value))
}

function createClientId(): string {
  return Math.random().toString(36).slice(2, 15)
}

function getRequestErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Game request failed.'
  const requestError = error as { data?: { message?: string }, statusMessage?: string }
  return requestError.data?.message ?? requestError.statusMessage ?? 'Game request failed.'
}
