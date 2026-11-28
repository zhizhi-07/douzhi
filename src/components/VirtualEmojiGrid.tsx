import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Emoji } from '../utils/emojiStorage'

export default function VirtualEmojiGrid({ emojis, category, onSelect, onAdd }: {
  emojis: Emoji[]; category: string; onSelect: (emoji: Emoji) => void; onAdd: () => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 320, height: 280, top: 0 })
  const frame = useRef(0)
  useLayoutEffect(() => {
    const node = container.current!
    const measure = () => setViewport(previous => ({ ...previous, width: node.clientWidth - 32, height: node.clientHeight }))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  useLayoutEffect(() => {
    if (container.current) container.current.scrollTop = 0
    setViewport(previous => ({ ...previous, top: 0 }))
  }, [category])
  useEffect(() => () => cancelAnimationFrame(frame.current), [])
  const columns = Math.max(4, Math.floor((viewport.width + 12) / 108))
  const tileHeight = Math.max(24, (viewport.width - (columns - 1) * 12) / columns)
  const rowHeight = tileHeight + 12
  const rows = Math.ceil((emojis.length + 1) / columns)
  const firstRow = Math.max(0, Math.floor(viewport.top / rowHeight) - 2)
  const lastRow = Math.min(rows, Math.ceil((viewport.top + viewport.height) / rowHeight) + 2)
  const indices = Array.from({ length: Math.max(0, Math.min(emojis.length + 1, lastRow * columns) - firstRow * columns) }, (_, i) => firstRow * columns + i)
  return <div ref={container} data-testid="emoji-grid" tabIndex={0} aria-label="表情包列表" className="overflow-y-auto p-4" style={{ height: 'min(38vh, 360px)', flexShrink: 0, overflowAnchor: 'none' }} onScroll={() => {
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      if (container.current) setViewport(previous => ({ ...previous, top: container.current!.scrollTop }))
    })
  }}>
    <div style={{ height: rows * rowHeight, position: 'relative' }}>
      {indices.map(index => {
        const emoji = emojis[index - 1]
        return <button key={index === 0 ? 'add' : emoji.id} type="button" aria-label={index === 0 ? '添加表情包' : emoji.description || emoji.name}
          data-emoji-id={emoji?.id} onClick={() => index === 0 ? onAdd() : onSelect(emoji)}
          className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200 active:scale-95"
          style={{ position: 'absolute', top: Math.floor(index / columns) * rowHeight, left: (index % columns) * (tileHeight + 12), width: tileHeight, height: tileHeight }}>
          {index === 0 ? <span className="text-3xl text-gray-400">＋</span> : <>
            <img src={emoji.url} alt={emoji.description} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            {category === 'frequent' && <span className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 rounded">{emoji.useCount}</span>}
            <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] truncate px-1">{emoji.description || emoji.name}</span>
          </>}
        </button>
      })}
    </div>
  </div>
}
