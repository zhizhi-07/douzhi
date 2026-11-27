import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import EmojiPanel from '../src/components/EmojiPanel'
import '../src/index.css'

const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="orange"/></svg>')
const request = indexedDB.open('EmojiDB', 3)
request.onupgradeneeded = () => request.result.createObjectStore('emojis')
request.onsuccess = () => {
  const db = request.result
  const transaction = db.transaction('emojis', 'readwrite')
  transaction.objectStore('emojis').put(Array.from({ length: 5000 }, (_, i) => ({ id: i + 1, url: image, name: `emoji ${i}`, description: `emoji ${i}`, useCount: 0, tag: i % 2 ? 'odd' : 'even', addTime: '2026-11-27' })), 'custom_emojis')
  transaction.oncomplete = () => { db.close(); createRoot(document.getElementById('root')!).render(<Harness />) }
}
function Harness() {
  const [show, setShow] = useState(false)
  const [selected, setSelected] = useState('')
  return <><button onClick={() => setShow(true)}>Open emojis</button><output>{selected}</output><EmojiPanel show={show} onClose={() => setShow(false)} onSelect={emoji => setSelected(emoji.name)} /></>
}
