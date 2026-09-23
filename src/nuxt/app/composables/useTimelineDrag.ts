import type { GameCard } from '~/types'
import { useGame } from './useGame'

/**
 * Encapsulates all drag-and-drop state and handlers for the game timeline.
 * Works with both pointer drag events and touch events.
 */
export function useTimelineDrag() {
  const { placeCard, moveCard, unplaceCard } = useGame()

  const draggedCardId = ref<string | null>(null)
  const dragStartedNewCard = ref(false)
  const dropHandled = ref(false)
  const touchDragCardId = ref<string | null>(null)
  const touchMoved = ref(false)
  const suppressClick = ref(false)

  // ── Query helpers ─────────────────────────────────────────────────────────

  const getCurrentCard = (): GameCard | undefined => {
    const state = useGame().gameState.value
    if (!state) return undefined
    return state.cards.find(card => !card.isRevealed && !card.isDiscarded)
  }

  const getPlacedCards = (): GameCard[] => {
    const state = useGame().gameState.value
    if (!state) return []
    return state.cards
      .filter(card => card.isRevealed && !card.revealed && !card.isDiscarded)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }

  const getDraggableCard = (): GameCard | null => {
    const phase = useGame().gameState.value?.turnPhase
    if (phase === 'checking') return getPlacedCards()[0] ?? null
    if (phase === 'placing') return getCurrentCard() ?? null
    return null
  }

  const getCurrentPhase = (): string => {
    return useGame().gameState.value?.turnPhase ?? 'placing'
  }

  // ── Pointer drag ─────────────────────────────────────────────────────────

  const onDragStart = (event: DragEvent, timelineLength: number) => {
    const phase = getCurrentPhase()
    if (phase === 'checking') {
      draggedCardId.value = getPlacedCards()[0]?.id ?? null
    } else if (phase === 'placing') {
      draggedCardId.value = getCurrentCard()?.id ?? null
    }

    if (!draggedCardId.value || !event.dataTransfer) return

    dragStartedNewCard.value = phase === 'placing'
    dropHandled.value = false
    event.dataTransfer.setData('text/plain', draggedCardId.value)
    event.dataTransfer.effectAllowed = 'move'

    if (dragStartedNewCard.value) {
      placeCard(draggedCardId.value, timelineLength)
    }
  }

  const onDragOver = (event: DragEvent, index: number) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'

    const cardId = draggedCardId.value
    if (!cardId) return

    const target = event.currentTarget as HTMLElement
    const rect = target?.getBoundingClientRect()
    if (!rect || !target) return

    const slot = event.clientY < rect.top + rect.height / 2 ? index : index + 1
    moveCard(cardId, slot)
  }

  const onDrop = (event: DragEvent, timelineLength: number) => {
    event.preventDefault()
    const cardId = draggedCardId.value || event.dataTransfer?.getData('text/plain')
    if (!cardId) return

    const target = event.target as Element | null
    const droppedOnRow = target?.closest('[data-timeline-index]')
    if (!droppedOnRow) {
      if (getCurrentPhase() === 'checking') {
        moveCard(cardId, timelineLength)
      } else {
        placeCard(cardId, timelineLength)
      }
    }
    dropHandled.value = true
  }

  const onDragEnd = (_event?: DragEvent) => {
    if (dragStartedNewCard.value && !dropHandled.value && draggedCardId.value) {
      unplaceCard(draggedCardId.value)
    }
    draggedCardId.value = null
    dragStartedNewCard.value = false
    dropHandled.value = false
  }

  // ── Touch drag ────────────────────────────────────────────────────────────

  const getTouchSlot = (touch: Touch, timelineLength: number) => {
    const target = document.elementFromPoint(touch.clientX, touch.clientY)
    const cardElement = target?.closest<HTMLElement>('[data-timeline-index]')
    if (!cardElement) return timelineLength

    const index = Number(cardElement.dataset.timelineIndex)
    const rect = cardElement.getBoundingClientRect()
    return touch.clientY < rect.top + rect.height / 2 ? index : index + 1
  }

  let _touchMoveHandler: ((e: TouchEvent) => void) | null = null
  let _touchEndHandler: ((e: TouchEvent) => void) | null = null

  const onTouchStart = (timelineLength: number) => {
    const card = getDraggableCard()
    if (!card) return

    touchDragCardId.value = card.id
    touchMoved.value = false

    _touchMoveHandler = (event: TouchEvent) => {
      const touch = event.touches[0]
      const cardId = touchDragCardId.value
      if (!touch || !cardId) return
      event.preventDefault()
      touchMoved.value = true

      if (getCurrentPhase() === 'placing') {
        const currentCard = getCurrentCard()
        if (currentCard && currentCard.id === cardId) {
          placeCard(currentCard.id, timelineLength)
        }
      } else {
        moveCard(cardId, getTouchSlot(touch, timelineLength))
      }
    }

    _touchEndHandler = (event: TouchEvent) => {
      if (!touchMoved.value) {
        touchDragCardId.value = null
        return
      }
      const touch = event.changedTouches[0]
      if (touch && touchDragCardId.value) {
        moveCard(touchDragCardId.value, getTouchSlot(touch, timelineLength))
      }
      touchDragCardId.value = null
      suppressClick.value = true
      const clearSuppress = () => {
        suppressClick.value = false
      }
      window.setTimeout(clearSuppress, 0)
    }

    document.addEventListener('touchmove', _touchMoveHandler, { passive: false })
    document.addEventListener('touchend', _touchEndHandler, { once: true })
  }

  onUnmounted(() => {
    if (_touchMoveHandler) document.removeEventListener('touchmove', _touchMoveHandler)
    if (_touchEndHandler) document.removeEventListener('touchend', _touchEndHandler)
  })

  return {
    draggedCardId,
    suppressClick,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onTouchStart,
    getDraggableCard
  }
}
