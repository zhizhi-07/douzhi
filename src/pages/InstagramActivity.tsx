import { Heart } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'

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
            <Heart className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">活动</h3>
          <p className="text-sm text-gray-500">
            当NPC互动或评论时，你会在这里看到
          </p>
        </div>
      </div>
    </InstagramLayout>
  )
}

export default InstagramActivity
