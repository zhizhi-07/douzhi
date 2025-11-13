/**
 * 路由动画包装组件
 * 为页面切换添加微信风格的滑动动画
 */

import { useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'

interface AnimatedRoutesProps {
  children: React.ReactNode
}

// 定义路由层级，用于判断前进还是后退
const routeLevels: Record<string, number> = {
  '/': 0,
  '/wechat': 1,
  '/contacts': 1,
  '/discover': 1,
  '/me': 1,
  '/chat': 2,
  '/group': 2,
  '/character': 2,
  '/moments': 2,
  '/couple-space': 2,
  '/wallet': 2,
  '/music-player': 2,
  '/forum': 2,
  '/map': 2,
  '/settings': 3,
  '/customize': 3,
  '/api-list': 3,
}

// 获取路由层级
const getRouteLevel = (pathname: string): number => {
  for (const [route, level] of Object.entries(routeLevels)) {
    if (pathname.startsWith(route)) {
      return level
    }
  }
  return 1 // 默认层级
}

const AnimatedRoutes: React.FC<AnimatedRoutesProps> = ({ children }) => {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter')
  const prevLocationRef = useRef(location)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')

  useEffect(() => {
    if (location !== prevLocationRef.current) {
      // 判断是前进还是后退
      const prevLevel = getRouteLevel(prevLocationRef.current.pathname)
      const currentLevel = getRouteLevel(location.pathname)
      
      if (currentLevel > prevLevel) {
        setDirection('forward')
      } else {
        setDirection('backward')
      }

      setTransitionStage('exit')
      
      // 延迟更新显示的location，等待退出动画完成
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage('enter')
        prevLocationRef.current = location
      }, 150) // 退出动画时长的一半

      return () => clearTimeout(timer)
    }
  }, [location])

  // 根据方向和阶段决定动画类名
  const getAnimationClass = () => {
    if (transitionStage === 'enter') {
      return direction === 'forward' 
        ? 'route-enter-forward' 
        : 'route-enter-backward'
    } else {
      return direction === 'forward'
        ? 'route-exit-forward'
        : 'route-exit-backward'
    }
  }

  return (
    <div 
      className={`route-transition ${getAnimationClass()}`}
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)' // GPU加速
      }}
    >
      {children}
    </div>
  )
}

export default AnimatedRoutes

