import { createRoot } from 'react-dom/client'
import DataManager from './pages/DataManager'
import './index.css'

// Deliberately do not import App/providers/services: their live connections and caches
// must be gone before database replacement or full reset.
createRoot(document.getElementById('root')!).render(<DataManager />)
