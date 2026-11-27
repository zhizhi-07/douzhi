import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useGroupVirtualList } from '../src/pages/GroupChatDetail/hooks/useGroupVirtualList'
import type { GroupMessage } from '../src/utils/groupChatManager'

const makeMessage = (i: number): GroupMessage => ({ id: String(i), groupId: 'test', userId: 'user', userName: 'test', userAvatar: '', type: 'text', content: `row ${i}`, time: '12:00', timestamp: i })
function Harness() {
  const [messages, setMessages] = useState(() => Array.from({ length: 5000 }, (_, i) => makeMessage(i)))
  const [input, setInput] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [refChanges, setRefChanges] = useState(0)
  const { displayedMessages, virtualStyle, scrollContainerRef, scrollToBottom } = useGroupVirtualList(messages)
  useEffect(() => setRefChanges(count => count + 1), [scrollContainerRef])
  return <>
    <input aria-label="input" value={input} onChange={event => setInput(event.target.value)} />
    <button onClick={() => setMessages(previous => [...previous, makeMessage(previous.length)])}>Append</button>
    <button onClick={() => setExpanded(value => !value)}>Resize rows</button>
    <button onClick={() => scrollToBottom(false)}>Bottom</button>
    <output aria-label="ref changes">{refChanges}</output>
    <div data-testid="scroller" ref={scrollContainerRef} style={{ overflowY: 'auto', overflowAnchor: 'none', height: 480, width: 600 }}>
      <div style={{ height: virtualStyle.paddingTop }} />
      {displayedMessages.map(message => <div key={message.id} data-message-id={message.id} style={{ height: (Number(message.id) % 7) * 30 + 30 + (expanded ? 80 : 0), boxSizing: 'border-box', border: '1px solid gray' }}>{message.content}</div>)}
      <div style={{ height: virtualStyle.paddingBottom }} />
    </div>
  </>
}
createRoot(document.getElementById('root')!).render(<Harness />)
