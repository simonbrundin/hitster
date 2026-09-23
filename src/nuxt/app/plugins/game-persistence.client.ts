import { watch } from 'vue'
import type { GameState } from '~/types'

const GAME_STATE_KEY = 'hitster_game_state'
const PLAYER_ID_KEY = 'hitster_player_id'
const IS_HOST_KEY = 'hitster_is_host'

type PersistedGameSession = {
  game: GameState
  playerId: string
  isHost: boolean
}

/**
 * Persists the complete local game session, including the player identity.
 * The identity must be restored together with the game it belongs to.
 */
export default defineNuxtPlugin({
  name: 'game-persistence',
  enforce: 'pre',
  setup() {
    if (!import.meta.client) return

    const { gameState, playerId, isHost, clearGameState, syncError } = useGame()
    restoreSession(gameState, playerId, isHost, clearGameState)

    watch(syncError, (error) => {
      if (!error?.includes('not found')) return
      console.warn('[Game Persistence] Game not found on server — clearing stale session')
      clearGameState()
    })

    watch(
      [gameState, playerId, isHost],
      ([state, currentPlayerId, currentIsHost]) => {
        if (!state || state.status === 'finished') {
          localStorage.removeItem(GAME_STATE_KEY)
          if (state?.status === 'finished') localStorage.removeItem(IS_HOST_KEY)
          return
        }

        const session: PersistedGameSession = {
          game: state,
          playerId: currentPlayerId,
          isHost: currentIsHost
        }

        try {
          localStorage.setItem(GAME_STATE_KEY, JSON.stringify(session))
        } catch {
          // Storage quota exceeded — ignore
        }
      },
      { deep: true }
    )
  }
})

function restoreSession(
  gameState: Ref<GameState | null>,
  playerId: Ref<string>,
  isHost: Ref<boolean>,
  clearGameState: () => void
): void {
  const raw = localStorage.getItem(GAME_STATE_KEY)
  if (!raw) return

  try {
    const parsed: unknown = JSON.parse(raw)
    if (isPersistedSession(parsed)) {
      if (parsed.game.status === 'finished'
        || !parsed.game.players.some(player => player.id === parsed.playerId)) {
        clearGameState()
        return
      }

      playerId.value = parsed.playerId
      isHost.value = parsed.isHost
      localStorage.setItem(PLAYER_ID_KEY, parsed.playerId)
      localStorage.setItem(IS_HOST_KEY, String(parsed.isHost))
      gameState.value = parsed.game
      console.log('[Game Persistence] Restored game:', parsed.game.code, parsed.game.status)
      return
    }

    if (isGameState(parsed) && parsed.status !== 'finished') {
      const storedPlayerId = localStorage.getItem(PLAYER_ID_KEY)
      const belongsToGame = parsed.players.some(player => player.id === storedPlayerId)
      if (storedPlayerId && belongsToGame) {
        gameState.value = parsed
        console.log('[Game Persistence] Restored legacy game:', parsed.code, parsed.status)
        return
      }
    }

    clearGameState()
  } catch {
    clearGameState()
  }
}

function isPersistedSession(value: unknown): value is PersistedGameSession {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PersistedGameSession>
  return isGameState(candidate.game)
    && typeof candidate.playerId === 'string'
    && typeof candidate.isHost === 'boolean'
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GameState>
  return typeof candidate.code === 'string'
    && typeof candidate.status === 'string'
    && Array.isArray(candidate.players)
}
