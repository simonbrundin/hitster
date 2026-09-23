// Spotify Types
export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  album: string
  albumImageUrl: string
  previewUrl: string | null
  releaseYear: number
  durationMs: number
  spotifyUrl: string
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  imageUrl: string
  owner: string
  trackCount: number
}

// Game Types
export type GameRulesMode = 'original' | 'lock-in'

export type GameAction
  = | { type: 'place', cardId: string, slot: number }
    | { type: 'move', cardId: string, slot: number }
    | { type: 'unplace', cardId: string }
    | { type: 'check' }
    | { type: 'lock-in' }
    | { type: 'continue' }
    | { type: 'finish-turn' }
    | { type: 'challenge', teamId: string }
    | { type: 'skip' }
    | { type: 'trade' }

export interface GameCard {
  id: string
  track: SpotifyTrack
  isGoldenShot: boolean
  isRevealed: boolean // placed on timeline
  position: number | null
  revealed: boolean // year has been revealed
  isCorrect: boolean // was correctly placed
  isLocked: boolean // banked/reference card (safe from future mistakes)
  lockedByTeamId?: string | null
  isReference?: boolean
  isDiscarded?: boolean // removed after an incorrect guess or a failed run
  playbackUri?: string
}

export interface Team {
  id: string
  name: string
  color: string
  members: string[]
  score: number
  hitsterCards: number
  isActive: boolean
}

export interface GameState {
  id: string
  code: string
  status: 'lobby' | 'playing' | 'finished'
  teams: Team[]
  players: Player[]
  currentRound: number
  totalRounds: number
  currentTurn: string // team id
  viewerTeamId?: string | null
  rulesMode?: GameRulesMode
  turnPhase?: 'placing' | 'checking' | 'decision' | 'result'
  lastResult?: 'correct' | 'wrong' | null
  lastCheckedCardId?: string | null
  lastMessage?: string | null
  challengeTeamId?: string | null
  cards: GameCard[]
  goldenShotRevealed: boolean
  winner: Team | null
}

export interface Player {
  id: string
  name: string
  teamId: string | null
}

// API Response Types
export interface SpotifyAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface SpotifyPlaylistResponse {
  id: string
  name: string
  description: string
  images: { url: string }[]
  owner: { display_name: string }
  tracks: {
    total: number
  }
}
