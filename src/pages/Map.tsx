import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import StatusBar from '../components/StatusBar'
import { locationService, LocationRecord, initDefaultAreas } from '../services/locationService'
import { characterService } from '../services/characterService'
import { addTestLocations } from '../utils/addTestLocations'

// 修复Leaflet图标
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const AIMap = () => {
  const navigate = useNavigate()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new globalThis.Map())
  const [locations, setLocations] = useState<LocationRecord[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [isAddingPlace, setIsAddingPlace] = useState(false)

  useEffect(() => {
    // 使用更长的延迟确保DOM完全加载
    const timer = setTimeout(() => {
      if (mapContainerRef.current) {
        console.log('地图容器已准备:', mapContainerRef.current)
        initMap()
        loadLocationData()
      } else {
        console.error('地图容器未找到')
      }
    }, 300)
    
    return () => {
      clearTimeout(timer)
      // 清理地图实例
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.error('清理地图失败:', e)
        }
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current && locations.length > 0) {
      updateMarkers()
    }
  }, [locations])

  // 处理地图点击
  const handleMapClick = useCallback((lat: number, lng: number) => {
    console.log(`🗺️ 点击地图: [${lat}, ${lng}]`)
    
    // TODO: 弹出对话框选择世界书条目
    const placeName = prompt('请输入地点名称（将来会从世界书选择）:')
    if (placeName) {
      // 临时添加到地图
      const map = mapInstanceRef.current
      if (map) {
        const icon = L.divIcon({
          html: `<div style="
            font-size: 14px;
            font-weight: 500;
            color: #2563eb;
            text-shadow: 
              -1px -1px 0 white,
              1px -1px 0 white,
              -1px 1px 0 white,
              1px 1px 0 white;
            white-space: nowrap;
          ">${placeName}</div>`,
          className: 'virtual-label',
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        })
        
        L.marker([lat, lng], { 
          icon: icon,
          zIndexOffset: 1000
        }).addTo(map)
        
        console.log(`✅ 添加地点: ${placeName} at [${lat}, ${lng}]`)
        setIsAddingPlace(false)
        
        // TODO: 保存到 locationService.saveArea()
        alert(`已添加"${placeName}"到地图\n坐标: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`)
      }
    } else {
      setIsAddingPlace(false)
    }
  }, [])

  // 监听添加地点模式
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const handleClick = (e: L.LeafletMouseEvent) => {
      console.log('🖱️ 地图被点击')
      if (isAddingPlace) {
        handleMapClick(e.latlng.lat, e.latlng.lng)
      }
    }

    map.on('click', handleClick)

    // 改变鼠标样式
    const container = map.getContainer()
    if (isAddingPlace) {
      container.style.cursor = 'crosshair'
      console.log('🎯 进入添加地点模式，点击地图任意位置')
    } else {
      container.style.cursor = ''
      console.log('❌ 退出添加地点模式')
    }

    return () => {
      map.off('click', handleClick)
    }
  }, [isAddingPlace, handleMapClick])

  // TODO: 世界书驱动的地图系统
  // 1. 从世界书读取地点定义
  // 2. 自动生成地图标注
  // 3. AI可以通过世界书了解可去的地点
  
  const addVirtualLabels = (map: L.Map) => {
    // 暂时只加几个核心地点用于测试
    const testPlaces = [
      { lat: 39.9042, lng: 116.4074, name: '星河广场', type: 'major', size: '18px' },
      { lat: 39.9002, lng: 116.4154, name: '中央公园', type: 'park', size: '16px' },
      { lat: 39.9122, lng: 116.4154, name: '市图书馆', type: 'culture', size: '15px' },
      { lat: 39.8902, lng: 116.4094, name: '城市站', type: 'transport', size: '16px' },
      { lat: 39.9142, lng: 116.4094, name: '希望中学', type: 'school', size: '15px' },
    ]

    testPlaces.forEach(place => {
      const icon = L.divIcon({
        html: `<div style="
          font-size: ${place.size};
          font-weight: ${place.type === 'major' ? '600' : '400'};
          color: ${getPlaceColor(place.type)};
          text-shadow: 
            -1px -1px 0 white,
            1px -1px 0 white,
            -1px 1px 0 white,
            1px 1px 0 white,
            0 0 3px white;
          white-space: nowrap;
          pointer-events: none;
        ">${place.name}</div>`,
        className: 'virtual-label',
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      })

      L.marker([place.lat, place.lng], { 
        icon: icon,
        interactive: false,
        zIndexOffset: 1000
      }).addTo(map)
    })

    console.log('✅ 已添加测试地名（5个核心地点）')
  }

  const getPlaceColor = (type: string): string => {
    const colors: Record<string, string> = {
      major: '#1a1a1a',
      commercial: '#2563eb',
      residential: '#059669',
      culture: '#7c3aed',
      school: '#dc2626',
      park: '#16a34a',
      street: '#4b5563',
      transport: '#ea580c',
      hospital: '#dc2626'
    }
    return colors[type] || '#374151'
  }

  const initMap = () => {
    if (!mapContainerRef.current) {
      console.error('地图容器未找到')
      return
    }
    
    if (mapInstanceRef.current) {
      console.log('地图实例已存在')
      return
    }

    try {
      console.log('开始初始化地图...')
      console.log('容器尺寸:', mapContainerRef.current.offsetWidth, 'x', mapContainerRef.current.offsetHeight)
      
      // 创建地图实例，中心设置为中国某城市坐标
      const map = L.map(mapContainerRef.current, {
        center: [39.9042, 116.4074], // 北京坐标
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true
      })

      console.log('地图实例已创建')

      // 使用无标注地图 + 自定义虚拟地名
      // 这样既有真实地图样式，又可以自由命名
      console.log('加载地图底图（无标注）...')
      const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        subdomains: ['a', 'b', 'c', 'd'],
        maxZoom: 19,
        minZoom: 3,
        attribution: '© OpenStreetMap, © CARTO'
      })
      
      let tileLoadSuccess = false
      
      tileLayer.on('tileload', () => {
        if (!tileLoadSuccess) {
          console.log('✅ 瓦片加载成功')
          tileLoadSuccess = true
        }
      })
      
      tileLayer.on('tileerror', (error: any) => {
        console.error('❌ 瓦片加载失败:', error)
      })
      
      tileLayer.addTo(map)
      console.log('瓦片层已添加到地图')

      // 添加完整的虚拟城市地名系统
      addVirtualLabels(map)

      // 添加缩放控件到右下角
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map)

      mapInstanceRef.current = map
      setMapReady(true)
      console.log('✅ 地图初始化成功')
      
      // 强制刷新地图多次确保瓦片正确加载
      setTimeout(() => {
        console.log('第1次刷新地图尺寸')
        map.invalidateSize(true)
      }, 100)
      
      setTimeout(() => {
        console.log('第2次刷新地图尺寸')
        map.invalidateSize(true)
        // 强制重绘
        map.panBy([0, 0])
      }, 500)
      
      setTimeout(() => {
        console.log('第3次刷新地图尺寸')
        map.invalidateSize(true)
      }, 1000)
    } catch (error) {
      console.error('地图初始化失败:', error)
      setMapReady(true) // 即使失败也显示内容
    }
  }

  const loadLocationData = async () => {
    try {
      await initDefaultAreas()
      const locationsData = await locationService.getAllCurrentLocations()
      setLocations(Array.from(locationsData.values()))
      console.log('📍 加载位置数据:', Array.from(locationsData.values()).length, '个AI')
    } catch (error) {
      console.error('加载位置数据失败:', error)
    }
  }

  const handleAddTestData = async () => {
    const count = await addTestLocations()
    if (count && count > 0) {
      alert(`已添加 ${count} 个测试位置，地图将刷新`)
      loadLocationData()
    } else {
      alert('添加失败，请先创建一些角色')
    }
  }

  const updateMarkers = () => {
    const map = mapInstanceRef.current
    if (!map) return

    // 清除旧标记
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current.clear()

    // 添加新标记
    locations.forEach(loc => {
      const character = characterService.getById(loc.characterId)
      if (!character) return

      // 使用真实的经纬度，如果没有则使用随机位置
      const lat = loc.lat || (39.9042 + (Math.random() - 0.5) * 0.1)
      const lng = loc.lng || (116.4074 + (Math.random() - 0.5) * 0.1)

      // 创建自定义图标
      const iconHtml = character.avatar && !character.avatar.startsWith('http')
        ? `<div style="font-size: 24px; text-align: center; line-height: 40px;">${character.avatar}</div>`
        : `<div style="width: 40px; height: 40px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-center; color: white; font-weight: bold; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${loc.characterName[0]}</div>`

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      })

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 150px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${loc.characterName}</h3>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">📍 ${loc.areaName}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #888;">${loc.activity || '在附近活动'}</p>
            <p style="margin: 4px 0; font-size: 11px; color: #aaa;">${new Date(loc.timestamp).toLocaleTimeString('zh-CN')}</p>
            <button 
              onclick="window.location.href='/#/location-history/${loc.characterId}'" 
              style="margin-top: 8px; width: 100%; padding: 6px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
            >
              查看足迹
            </button>
          </div>
        `)

      markersRef.current.set(loc.characterId, marker)
    })
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 状态栏 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">AI世界地图</h1>
          <div className="w-6"></div>
        </div>
      </div>

      {/* Leaflet地图容器 */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={mapContainerRef} 
          className="w-full h-full"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0
          }}
        />

        {/* 加载提示 */}
        {!mapReady && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-[2000]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-gray-600 text-sm">加载地图中...</p>
              <p className="text-gray-400 text-xs mt-2">请打开控制台查看详细日志</p>
            </div>
          </div>
        )}
        
        {/* 地点管理工具栏 */}
        {mapReady && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 p-3 z-[1000]">
            <p className="text-xs font-semibold text-gray-700 mb-2">地点管理</p>
            <button
              onClick={() => setIsAddingPlace(!isAddingPlace)}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-all ${
                isAddingPlace 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isAddingPlace ? '取消添加' : '📍 添加地点'}
            </button>
            {isAddingPlace && (
              <p className="text-xs text-gray-500 mt-2">
                点击地图选择位置
              </p>
            )}
          </div>
        )}

        {/* 图例 */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 p-3 z-[1000]">
          <p className="text-xs font-semibold text-gray-700 mb-2">图例</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
              <span className="text-xs text-gray-600">AI位置</span>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              点击标记查看详情
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
            共 {locations.length} 个AI
          </p>
        </div>

        {/* 提示信息 */}
        {locations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[999]">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200/50 p-6 text-center pointer-events-auto">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="text-gray-600 text-sm font-medium">暂无AI位置数据</p>
              <p className="text-gray-400 text-xs mt-2 mb-4">添加AI位置后将显示在地图上</p>
              <button
                onClick={handleAddTestData}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:scale-95 transition-all"
              >
                添加测试数据
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .virtual-label {
          background: transparent !important;
          border: none !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          padding: 0;
        }
        .leaflet-popup-content {
          margin: 12px;
        }
        .leaflet-container {
          font-family: inherit;
          background: #e5e7eb !important;
          width: 100% !important;
          height: 100% !important;
        }
        .leaflet-tile-container {
          background: transparent;
        }
        .leaflet-tile {
          opacity: 1 !important;
        }
        .leaflet-layer,
        .leaflet-pane,
        .leaflet-tile-pane {
          z-index: 1 !important;
        }
        .leaflet-control-zoom a {
          background-color: white;
          color: #374151;
        }
        .leaflet-control-zoom a:hover {
          background-color: #f3f4f6;
        }
      `}</style>
    </div>
  )
}

export default AIMap
