import type { GameCard } from '~/types'
import { useGame } from './useGame'

/**
 * Encapsulates all drag-and-drop state and handlers for the game timeline.
 * Works with both pointer drag events and touch events.
 */
export function useTimelineDrag() {
  const {
    placeCard,
    moveCard,
    unplaceCard,
    getTimelineCards,
    isCurrentViewerTurn,
    isHost,
    gameState
  } = useGame()

  // ── Local drag state (separate from server) ──────────────────────────────

  /** Card being dragged (its hidden original + a revealed local copy) */
  const _dragCard = ref<{
    id: string
    revealed: GameCard // local copy with isRevealed=true for timeline display
    slot: number // last intended slot position
    startedNew: boolean // whether this was a new (hidden) card
  } | null>(null)

  const suppressClick = ref(false)

  const dragPreviewSlot = computed(() => _dragCard.value?.slot ?? null)
  const draggedCardId = computed(() => _dragCard.value?.id ?? null)

  // ── Query helpers ─────────────────────────────────────────────────────────

  const getCurrentCard = (): GameCard | undefined => {
    const state = gameState.value
    if (!state) return undefined
    return state.cards.find(card => !card.isRevealed && !card.isDiscarded)
  }

  const getPlacedCards = (): GameCard[] => {
    const state = gameState.value
    if (!state) return []
    return state.cards
      .filter(card => card.isRevealed && !card.revealed && !card.isDiscarded)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }

  const canControlTimeline = () => isCurrentViewerTurn() || isHost.value

  const getDraggableCard = (): GameCard | null => {
    if (!canControlTimeline()) return null
    const phase = gameState.value?.turnPhase
    if (phase === 'checking') return getPlacedCards()[0] ?? null
    if (phase === 'placing') return getCurrentCard() ?? null
    return null
  }

  const getCurrentPhase = (): string => {
    return gameState.value?.turnPhase ?? 'placing'
  }

  // ── Shared helpers ───────────────────────────────────────────────────────

  const getSlotFromPointer = (clientX: number, clientY: number, timelineLength: number) => {
    const target = document.elementFromPoint(clientX, clientY)
    const row = target?.closest<HTMLElement>('[data-timeline-index]')
    if (!row) return timelineLength
    const index = Number(row.dataset.timelineIndex)
    const rect = row.getBoundingClientRect()
    return clientY < rect.top + rect.height / 2 ? index : index + 1
  }

  const beginDrag = (card: GameCard, timelineLength: number, isNewCard: boolean) => {
    const slot = isNewCard ? timelineLength : getTimelineCards().findIndex(c => c.id === card.id)
    _dragCard.value = {
      id: card.id,
      revealed: {
        ...card,
        isRevealed: true,
        position: slot,
        revealed: false,
        isCorrect: false,
        isLocked: false,
        lockedByTeamId: null
      },
      slot,
      startedNew: isNewCard
    }
  }

  const updateDragSlot = (slot: number) => {
    if (!_dragCard.value) return
    _dragCard.value.slot = slot
    // Also update the revealed card's position for correct ordering
    _dragCard.value.revealed = {
      ..._dragCard.value.revealed,
      position: slot
    }
  }

  const endDrag = () => {
    _dragCard.value = null
  }

  // ── Pointer drag ─────────────────────────────────────────────────────────

  const onDragStart = (event: DragEvent, timelineLength: number) => {
    if (!canControlTimeline()) return
    const phase = getCurrentPhase()
    const card = phase === 'checking'
      ? getPlacedCards()[0]
      : getCurrentCard()

    if (!card || !event.dataTransfer) return

    beginDrag(card, timelineLength, phase === 'placing')
    event.dataTransfer.setData('text/plain', card.id)
    event.dataTransfer.effectAllowed = 'move'

    if (_dragCard.value?.startedNew) {
      placeCard(card.id, timelineLength)
    }
  }

  const onDragOver = (event: DragEvent, index: number) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'

    const target = event.target as Element | null
    const row = target?.closest<HTMLElement>('[data-timeline-index]')
    const slot = row
      ? (event.clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2 ? index : index + 1)
      : index

    updateDragSlot(slot)
  }

  const onDrop = (event: DragEvent, timelineLength: number) => {
    event.preventDefault()
    const cardId = draggedCardId.value || event.dataTransfer?.getData('text/plain')
    if (!cardId) return

    const target = event.target as Element | null
    const row = target?.closest<HTMLElement>('[data-timeline-index]')
    const slot = row
      ? (event.clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2
          ? Number(row.dataset.timelineIndex)
          : Number(row.dataset.timelineIndex) + 1)
      : timelineLength

    if (_dragCard.value?.startedNew) {
      if (getCurrentPhase() === 'checking') {
        moveCard(cardId, slot)
      } else {
        placeCard(cardId, slot)
      }
    } else if (getCurrentPhase() === 'checking') {
      moveCard(cardId, slot)
    }

    endDrag()
  }

  const onDragEnd = (_event?: DragEvent) => {
    if (_dragCard.value?.startedNew && !draggedCardId.value) {
      unplaceCard(_dragCard.value.id)
    }
    endDrag()
  }

  // ── Touch drag ──────────────────────────────────────────────────────────

  let _touchMoveHandler: ((e: TouchEvent) => void) | null = null
  let _touchEndHandler: ((e: TouchEvent) => void) | null = null

  const onTouchStart = (timelineLength: number) => {
    const card = getDraggableCard()
    if (!card) return

    beginDrag(card, timelineLength, getCurrentPhase() === 'placing')

    _touchMoveHandler = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch || !_dragCard.value) return
      event.preventDefault()
      const slot = getSlotFromPointer(touch.clientX, touch.clientY, timelineLength)
      updateDragSlot(slot)

      // Place the new card on the first movement
      if (_dragCard.value.startedNew && getCurrentPhase() === 'placing') {
        placeCard(_dragCard.value.id, timelineLength)
      }
    }

    _touchEndHandler = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (touch && _dragCard.value && getCurrentPhase() === 'checking') {
        const slot = getSlotFromPointer(touch.clientX, touch.clientY, timelineLength)
        moveCard(_dragCard.value.id, slot)
      }
      endDrag()
      suppressClick.value = true
      window.setTimeout(() => {
        suppressClick.value = false
      }, 0)
    }

    document.addEventListener('touchmove', _touchMoveHandler, { passive: false })
    document.addEventListener('touchend', _touchEndHandler, { once: true })
  }

  onUnmounted(() => {
    if (_touchMoveHandler) document.removeEventListener('touchmove', _touchMoveHandler)
    if (_touchEndHandler) document.removeEventListener('touchend', _touchEndHandler)
  })

  return {
    dragPreviewSlot,
    draggedCardId,
    suppressClick,
    getDragRevealedCard: () => _dragCard.value?.revealed ?? null,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onTouchStart,
    getDraggableCard
  }
}
