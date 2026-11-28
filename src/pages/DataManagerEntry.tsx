import { useEffect } from 'react'

export default function DataManagerEntry() {
  useEffect(() => { window.location.replace('/data-manager.html') }, [])
  return <div role="status" className="p-6">正在关闭聊天连接，进入独立数据管理页...</div>
}
