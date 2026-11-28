// Numeric IDs stay compatible with old message actions and below MAX_SAFE_INTEGER.
let lastId = 0
export function nextMessageId(): number {
  lastId = Math.max(Date.now() * 1000, lastId + 1)
  return lastId
}
