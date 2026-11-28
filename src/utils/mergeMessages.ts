// Incoming messages replace matching IDs; a paginated view must never erase history.
export function mergeMessages<T extends { id: string | number; timestamp?: number }>(
  existing: T[], incoming: T[]
): T[] {
  const merged = new Map<string | number, T>()
  for (const message of existing) if (message?.id != null) merged.set(message.id, message)
  for (const message of incoming) if (message?.id != null) merged.set(message.id, message)
  return [...merged.values()].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
}

// Older unsafe numeric generators can leave two distinct records with the same ID.
// Repair within each stored list before merging; do not discard the second record.
export function repairDuplicateMessageIds<T extends { id: string | number }>(messages: T[], createId: () => T['id']): T[] {
  const used = new Set(messages.filter(Boolean).map(message => message.id))
  const seen = new Set<string | number>()
  let changed = false
  const result = messages.map(message => {
    if (!message || message.id == null) return message
    if (!seen.has(message.id)) { seen.add(message.id); return message }
    let id = createId()
    while (used.has(id)) id = createId()
    used.add(id)
    changed = true
    return { ...message, id }
  })
  return changed ? result : messages
}
