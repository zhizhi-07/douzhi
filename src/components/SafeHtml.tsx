import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { HTML_SANDBOX, safeHtmlDocument } from '../utils/safeHtmlDocument'

export default function SafeHtml({ html, className, style }: { html: string; className?: string; style?: CSSProperties }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(180)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== 'douzhi-html-height') return
      const size = event.data.height
      if (typeof size === 'number' && Number.isFinite(size)) setHeight(Math.max(40, Math.min(2000, size)))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])
  return <iframe ref={frame} title="消息卡片" className={className} sandbox={HTML_SANDBOX} referrerPolicy="no-referrer" srcDoc={safeHtmlDocument(html)} style={{ width: '100%', height, border: 0, ...style }} />
}
