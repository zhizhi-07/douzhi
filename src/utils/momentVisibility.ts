import type { Moment } from '../types/moments'
export function canViewMoment(moment: Moment, characterId: string): boolean {
  if (moment.userId === characterId) return true
  if (!moment.privacy || moment.privacy === 'public') return true
  if (moment.privacy === 'private') return false
  return moment.visibleTo?.includes(characterId) === true
}
