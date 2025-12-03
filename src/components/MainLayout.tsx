import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import WechatTabBar from './WechatTabBar'
import { getAllUIIcons } from '../utils/iconStorage'
import { getImage } from '../utils/unifiedStorage'

const MainLayout = () => {
    const [wechatBg, setWechatBg] = useState(() => {
        const preloaded = sessionStorage.getItem('__preloaded_backgrounds__')
        if (preloaded) {
            try {
                const backgrounds = JSON.parse(preloaded)
                return backgrounds.wechat_bg || ''
            } catch { return '' }
        }
        return ''
    })
    const [customIcons, setCustomIcons] = useState<Record<string, string>>({})

    // 加载自定义图标
    useEffect(() => {
        const loadCustomIcons = async () => {
            try {
                // 优先从 sessionStorage 读取预加载的图标
                const preloaded = sessionStorage.getItem('__preloaded_icons__')
                if (preloaded) {
                    const icons = JSON.parse(preloaded)
                    setCustomIcons(icons)

                    // 如果有全局背景，使用全局背景
                    if (icons['global-background']) {
                        setWechatBg(icons['global-background'])
                        return
                    }
                }

                let icons = await getAllUIIcons()
                if (Object.keys(icons).length === 0) {
                    const saved = localStorage.getItem('ui_custom_icons')
                    if (saved) {
                        icons = JSON.parse(saved)
                    }
                }
                setCustomIcons(icons)

                if (icons['global-background']) {
                    setWechatBg(icons['global-background'])
                }
            } catch (error) {
                console.error('加载自定义图标失败:', error)
            }
        }

        loadCustomIcons()

        const handleIconsChange = () => {
            loadCustomIcons()
        }
        window.addEventListener('uiIconsChanged', handleIconsChange)

        return () => {
            window.removeEventListener('uiIconsChanged', handleIconsChange)
        }
    }, [])

    // 加载微信背景（如果没有全局背景）
    useEffect(() => {
        const loadWechatBg = async () => {
            // 如果已经有全局背景（在 loadCustomIcons 中设置），就不加载单独的微信背景
            const icons = await getAllUIIcons()
            if (icons['global-background']) return

            if (wechatBg && !wechatBg.startsWith('blob:')) return // 如果已有背景且不是blob（可能是预加载的），暂不重复加载

            const bg = await getImage('wechat_bg')
            if (bg) setWechatBg(bg)
        }
        loadWechatBg()

        const handleBgUpdate = async () => {
            console.log('📡 MainLayout: 收到背景更新事件')
            const icons = await getAllUIIcons()
            if (!icons['global-background']) {
                const bg = await getImage('wechat_bg')
                setWechatBg(bg || '')
            }
        }
        window.addEventListener('wechatBackgroundUpdate', handleBgUpdate)
        return () => window.removeEventListener('wechatBackgroundUpdate', handleBgUpdate)
    }, [])

    return (
        <div
            className="h-screen flex flex-col font-serif bg-[#EDEDED]"
            data-main-layout
            style={wechatBg ? {
                backgroundImage: `url(${wechatBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed', // 保持背景固定
            } : {}}
        >
            {/* 页面内容 - 继承背景避免闪烁 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Outlet context={{ customIcons, wechatBg }} />
            </div>

            {/* 底部导航栏 */}
            <WechatTabBar customIcons={customIcons} />
        </div>
    )
}

export default MainLayout
