/** Measured, variable-height window; scroll callbacks stay stable while typing. */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { GroupMessage } from '../../../utils/groupChatManager'
import { getVisibleRange } from '../../../utils/virtualMessageRange'

const ESTIMATED_HEIGHT = 100
const RENDER_ALL_LIMIT = 60

export const useGroupVirtualList = (allMessages: GroupMessage[], ready = true) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const heights = useRef(new Map<string, number>())
  const [measurementVersion, setMeasurementVersion] = useState(0)
  const [range, setRange] = useState({ start: 0, end: 30 })
  const followingBottom = useRef(true)
  const initialized = useRef(false)
  const autoScrollUntil = useRef(0)
  const frame = useRef(0)
  const anchor = useRef<{ id: string; offset: number } | null>(null)

  const offsets = useMemo(() => {
    const result = [0]
    for (const message of allMessages) result.push(result[result.length - 1] + (heights.current.get(message.id) ?? ESTIMATED_HEIGHT))
    return result
  }, [allMessages, measurementVersion])
  const layout = useRef({ allMessages, offsets })
  layout.current = { allMessages, offsets }

  const updateRange = useCallback(() => {
    const node = containerRef.current
    if (!node) return
    const { allMessages: messages, offsets: currentOffsets } = layout.current
    const next = messages.length <= RENDER_ALL_LIMIT ? { start: 0, end: messages.length }
      : getVisibleRange(currentOffsets, node.scrollTop, node.clientHeight)
    setRange(previous => previous.start === next.start && previous.end === next.end ? previous : next)
    const first = getVisibleRange(currentOffsets, node.scrollTop, 0, 0).start
    anchor.current = messages[first] ? { id: messages[first].id, offset: node.scrollTop - currentOffsets[first] } : null
  }, [])

  const isNearBottom = useCallback(() => {
    const node = containerRef.current
    return !node || node.scrollHeight - node.scrollTop - node.clientHeight < 100
  }, [])

  const scrollToBottom = useCallback((smooth = true) => {
    const node = containerRef.current
    if (!node) return
    followingBottom.current = true
    autoScrollUntil.current = performance.now() + (smooth ? 600 : 100)
    const current = layout.current
    const top = Math.max(0, current.offsets[current.offsets.length - 1] - node.clientHeight)
    const next = getVisibleRange(current.offsets, top, node.clientHeight)
    setRange(next)
    node.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
    setContainer(node)
  }, [])

  useEffect(() => {
    if (!container) return
    const onScroll = () => {
      if (performance.now() > autoScrollUntil.current) followingBottom.current = isNearBottom()
      if (frame.current) return
      frame.current = requestAnimationFrame(() => { frame.current = 0; updateRange() })
    }
    const onUserScroll = () => { autoScrollUntil.current = 0 }
    container.addEventListener('wheel', onUserScroll, { passive: true })
    container.addEventListener('touchmove', onUserScroll, { passive: true })
    container.addEventListener('pointerdown', onUserScroll, { passive: true })
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', onScroll)
      container.removeEventListener('wheel', onUserScroll)
      container.removeEventListener('touchmove', onUserScroll)
      container.removeEventListener('pointerdown', onUserScroll)
      cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [container, isNearBottom, updateRange])

  useLayoutEffect(() => {
    if (!container || !allMessages.length || !ready) return
    autoScrollUntil.current = performance.now() + 100
    if (!initialized.current || followingBottom.current) {
      container.scrollTop = Math.max(0, offsets[offsets.length - 1] - container.clientHeight)
      initialized.current = true
    } else if (anchor.current) {
      const index = allMessages.findIndex(message => message.id === anchor.current!.id)
      if (index >= 0) container.scrollTop = offsets[index] + anchor.current.offset
    }
    updateRange()
  }, [allMessages, offsets, container, ready, updateRange])

  useLayoutEffect(() => {
    if (!container || !ready) return
    const measure = () => {
      let changed = false
      container.querySelectorAll<HTMLElement>('[data-message-id]').forEach(element => {
        const id = element.dataset.messageId!
        const style = getComputedStyle(element)
        const height = element.getBoundingClientRect().height + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0)
        if (Math.abs((heights.current.get(id) ?? ESTIMATED_HEIGHT) - height) > 0.5) {
          heights.current.set(id, height)
          changed = true
        }
      })
      if (changed) setMeasurementVersion(version => version + 1)
      else updateRange()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    container.querySelectorAll('[data-message-id]').forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [container, ready, allMessages, range.start, range.end, updateRange])

  const resetVirtualList = useCallback(() => {
    heights.current.clear()
    initialized.current = false
    followingBottom.current = true
    anchor.current = null
    setMeasurementVersion(version => version + 1)
  }, [])

  const virtual = allMessages.length > RENDER_ALL_LIMIT
  const start = virtual ? Math.min(range.start, Math.max(0, allMessages.length - 1)) : 0
  const end = virtual ? Math.max(start + 1, Math.min(range.end, allMessages.length)) : allMessages.length
  const displayedMessages = useMemo(() => allMessages.slice(start, end), [allMessages, start, end])
  return {
    displayedMessages,
    virtualStyle: { paddingTop: offsets[start] || 0, paddingBottom: (offsets[allMessages.length] || 0) - (offsets[end] || 0) },
    scrollContainerRef, scrollToBottom, resetVirtualList, isNearBottom
  }
}
