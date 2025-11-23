import { Bell } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'

/**
 * 论坛活动/通知页面
 * 
 * TODO: 未来功能
 * - 显示别人对你帖子的评论
 * - 显示别人的点赞
 * - AI和NPC可以互相评论（楼中楼）
 * - AI可以维护用户（比如有人骂用户，AI会帮忙）
 */
const InstagramActivity = () => {
  return (
    <InstagramLayout showHeader={false}>
      {/* 顶部标题 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold">活动</h1>
        </div>
      </div>

      {/* 空状态 */}
      <div className="pb-20">
        <div className="py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">活动</h3>
          <p className="text-sm text-gray-500 px-8">
            当有人给你的帖子点赞或评论时，<br />你会在这里看到
          </p>
        </div>
      </div>
    </InstagramLayout>
  )
}

export default InstagramActivity
