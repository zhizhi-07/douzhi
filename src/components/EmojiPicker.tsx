import { createPortal } from 'react-dom'
import { forwardRef, memo, useCallback, useImperativeHandle, useState } from 'react'
import EmojiPanel from './EmojiPanel'
import type { Emoji } from '../utils/emojiStorage'

export interface EmojiPickerHandle { open: () => void }

// Opening an overlay must not rerender the conversation behind it.
const EmojiPicker = memo(forwardRef<EmojiPickerHandle, { onSelect: (emoji: Emoji) => void }>(({ onSelect }, ref) => {
  const [show, setShow] = useState(false)
  useImperativeHandle(ref, () => ({ open: () => setShow(true) }), [])
  const close = useCallback(() => setShow(false), [])
  return createPortal(<EmojiPanel show={show} onClose={close} onSelect={onSelect} />, document.body)
}))
export default EmojiPicker
