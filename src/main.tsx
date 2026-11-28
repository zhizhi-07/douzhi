import { createRoot } from 'react-dom/client'
import { hasPendingImport } from './utils/dataManager'
import './index.css'
import './styles/animations.css'
import './styles/bubble-default.css'
import 'leaflet/dist/leaflet.css'

const root = createRoot(document.getElementById('root')!)
async function start() {
  if (await hasPendingImport()) {
    window.location.replace('/data-manager.html')
    return
  }
  const { initializeUserProfile } = await import('./utils/userProfileStorage')
  await initializeUserProfile()
  const { mountApplication } = await import('./appRoot')
  mountApplication(root)
}
void start().catch(error => {
  root.render(<div role="alert" className="p-6">启动失败：{String(error)}。<a href="/data-manager.html">进入数据管理恢复备份</a></div>)
})
