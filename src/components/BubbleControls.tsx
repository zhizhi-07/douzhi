/**
 * 气泡可视化控制器 - 所有属性都可以调整
 */

import { BubbleStyle } from '../utils/cssParser'

interface Props {
  style: BubbleStyle
  onChange: (style: BubbleStyle) => void
}

const BubbleControls = ({ style, onChange }: Props) => {
  const update = (key: keyof BubbleStyle, value: any) => {
    onChange({ ...style, [key]: value })
  }

  return (
    <div className="space-y-4 max-h-[800px] overflow-y-auto">
      {/* 背景设置 */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-gray-900 mb-4">🎨 背景</h3>
        
        <div className="space-y-3">
          {/* 渐变开关 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">启用渐变</span>
            <button
              onClick={() => update('useGradient', !style.useGradient)}
              className={`w-12 h-6 rounded-full transition-colors ${
                style.useGradient ? 'bg-[#FF6B35]' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${
                style.useGradient ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          
          {style.useGradient ? (
            <>
              {/* 渐变色1 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">渐变起始色</span>
                <input
                  type="color"
                  value={style.gradientColor1}
                  onChange={(e) => update('gradientColor1', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                />
              </div>
              
              {/* 渐变色2 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">渐变结束色</span>
                <input
                  type="color"
                  value={style.gradientColor2}
                  onChange={(e) => update('gradientColor2', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                />
              </div>
              
              {/* 渐变角度 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">渐变角度</span>
                  <span className="text-sm font-bold text-gray-900">{style.gradientAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={style.gradientAngle}
                  onChange={(e) => update('gradientAngle', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          ) : (
            <>
              {/* 背景颜色 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">背景颜色</span>
                <input
                  type="color"
                  value={style.backgroundColor}
                  onChange={(e) => update('backgroundColor', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                />
              </div>
              
              {/* 背景透明度 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">背景透明度</span>
                  <span className="text-sm font-bold text-gray-900">{(style.backgroundOpacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={style.backgroundOpacity}
                  onChange={(e) => update('backgroundOpacity', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 文字设置 */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-gray-900 mb-4">📝 文字</h3>
        
        <div className="space-y-3">
          {/* 文字颜色 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">文字颜色</span>
            <input
              type="color"
              value={style.textColor}
              onChange={(e) => update('textColor', e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
            />
          </div>
          
          {/* 文字透明度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">文字透明度</span>
              <span className="text-sm font-bold text-gray-900">{(style.textOpacity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={style.textOpacity}
              onChange={(e) => update('textOpacity', Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* 字体大小 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">字体大小</span>
              <span className="text-sm font-bold text-gray-900">{style.fontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="24"
              value={style.fontSize}
              onChange={(e) => update('fontSize', Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* 字体粗细 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">字体粗细</span>
              <span className="text-sm font-bold text-gray-900">{style.fontWeight}</span>
            </div>
            <input
              type="range"
              min="300"
              max="700"
              step="100"
              value={style.fontWeight}
              onChange={(e) => update('fontWeight', Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 边框设置 */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-gray-900 mb-4">🔲 边框</h3>
        
        <div className="space-y-3">
          {/* 圆角大小 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">圆角大小</span>
              <span className="text-sm font-bold text-gray-900">{style.borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={style.borderRadius}
              onChange={(e) => update('borderRadius', Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* 边框宽度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">边框宽度</span>
              <span className="text-sm font-bold text-gray-900">{style.borderWidth}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={style.borderWidth}
              onChange={(e) => update('borderWidth', Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {style.borderWidth > 0 && (
            <>
              {/* 边框颜色 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">边框颜色</span>
                <input
                  type="color"
                  value={style.borderColor}
                  onChange={(e) => update('borderColor', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                />
              </div>
              
              {/* 边框透明度 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">边框透明度</span>
                  <span className="text-sm font-bold text-gray-900">{(style.borderOpacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={style.borderOpacity}
                  onChange={(e) => update('borderOpacity', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 间距设置 */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-gray-900 mb-4">📏 间距</h3>
        
        <div className="space-y-3">
          {/* 垂直内边距 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">垂直内边距</span>
              <span className="text-sm font-bold text-gray-900">{style.paddingVertical}px</span>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              value={style.paddingVertical}
              onChange={(e) => update('paddingVertical', Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* 水平内边距 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">水平内边距</span>
              <span className="text-sm font-bold text-gray-900">{style.paddingHorizontal}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="32"
              value={style.paddingHorizontal}
              onChange={(e) => update('paddingHorizontal', Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 阴影设置 */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-gray-900 mb-4">🌑 阴影</h3>
        
        <div className="space-y-3">
          {/* 水平偏移 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">水平偏移</span>
              <span className="text-sm font-bold text-gray-900">{style.shadowOffsetX}px</span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              value={style.shadowOffsetX}
              onChange={(e) => update('shadowOffsetX', Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* 垂直偏移 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">垂直偏移</span>
              <span className="text-sm font-bold text-gray-900">{style.shadowOffsetY}px</span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              value={style.shadowOffsetY}
              onChange={(e) => update('shadowOffsetY', Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* 模糊半径 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">模糊半径</span>
              <span className="text-sm font-bold text-gray-900">{style.shadowBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={style.shadowBlur}
              onChange={(e) => update('shadowBlur', Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* 扩展半径 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">扩展半径</span>
              <span className="text-sm font-bold text-gray-900">{style.shadowSpread}px</span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              value={style.shadowSpread}
              onChange={(e) => update('shadowSpread', Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* 阴影颜色 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">阴影颜色</span>
            <input
              type="color"
              value={style.shadowColor}
              onChange={(e) => update('shadowColor', e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
            />
          </div>
          
          {/* 阴影透明度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">阴影透明度</span>
              <span className="text-sm font-bold text-gray-900">{(style.shadowOpacity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={style.shadowOpacity}
              onChange={(e) => update('shadowOpacity', Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 其他设置 */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-gray-900 mb-4">⚙️ 其他</h3>
        
        <div className="space-y-3">
          {/* 整体透明度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">整体透明度</span>
              <span className="text-sm font-bold text-gray-900">{(style.opacity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={style.opacity}
              onChange={(e) => update('opacity', Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* Transform */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Transform</label>
            <input
              type="text"
              value={style.transform}
              onChange={(e) => update('transform', e.target.value)}
              placeholder="例如: scale(1.05) rotate(2deg)"
              className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BubbleControls
