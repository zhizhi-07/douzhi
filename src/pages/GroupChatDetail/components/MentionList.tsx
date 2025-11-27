/**
 * @成员列表组件
 */

import React from 'react'

interface Member {
  id: string
  name: string
}

interface MentionListProps {
  show: boolean
  members: Member[]
  onSelect: (memberName: string) => void
}

const MentionList: React.FC<MentionListProps> = ({
  show,
  members,
  onSelect
}) => {
  if (!show) return null

  return (
    <div className="px-4 pb-2 max-h-40 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => onSelect(member.name)}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0 border-gray-100"
          >
            <span className="text-sm text-gray-900">{member.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default MentionList
