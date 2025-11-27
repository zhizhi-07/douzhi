/**
 * CSS解析器 - 将CSS字符串解析为可编辑的属性
 */

export interface BubbleStyle {
  // 背景
  backgroundColor: string
  backgroundOpacity: number
  useGradient: boolean
  gradientColor1: string
  gradientColor2: string
  gradientAngle: number
  
  // 文字
  textColor: string
  textOpacity: number
  fontSize: number
  fontWeight: number
  
  // 边框
  borderWidth: number
  borderColor: string
  borderOpacity: number
  borderRadius: number
  
  // 间距
  paddingVertical: number
  paddingHorizontal: number
  
  // 阴影
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  shadowSpread: number
  shadowColor: string
  shadowOpacity: number
  
  // 其他
  transform: string
  opacity: number
}

export const defaultBubbleStyle: BubbleStyle = {
  backgroundColor: '#1F2937',
  backgroundOpacity: 1,
  useGradient: false,
  gradientColor1: '#667eea',
  gradientColor2: '#764ba2',
  gradientAngle: 135,
  
  textColor: '#FFFFFF',
  textOpacity: 1,
  fontSize: 14,
  fontWeight: 400,
  
  borderWidth: 0,
  borderColor: '#000000',
  borderOpacity: 0.05,
  borderRadius: 18,
  
  paddingVertical: 10,
  paddingHorizontal: 14,
  
  shadowOffsetX: 0,
  shadowOffsetY: 2,
  shadowBlur: 8,
  shadowSpread: 0,
  shadowColor: '#000000',
  shadowOpacity: 0.08,
  
  transform: '',
  opacity: 1
}

// 解析CSS字符串
export function parseCSS(cssString: string): Partial<BubbleStyle> {
  const style: Partial<BubbleStyle> = {}
  
  // 提取background
  const bgMatch = cssString.match(/background:\s*([^;!]+)/i)
  if (bgMatch) {
    const bg = bgMatch[1].trim()
    if (bg.includes('gradient')) {
      style.useGradient = true
      const colors = bg.match(/#[0-9a-f]{6}/gi)
      if (colors && colors.length >= 2) {
        style.gradientColor1 = colors[0]
        style.gradientColor2 = colors[1]
      }
      const angleMatch = bg.match(/(\d+)deg/)
      if (angleMatch) {
        style.gradientAngle = parseInt(angleMatch[1])
      }
    } else {
      style.useGradient = false
      const colorMatch = bg.match(/#[0-9a-f]{6}/i)
      if (colorMatch) {
        style.backgroundColor = colorMatch[0]
      }
    }
  }
  
  // 提取color
  const colorMatch = cssString.match(/color:\s*([^;!]+)/i)
  if (colorMatch) {
    const color = colorMatch[1].trim()
    const hexMatch = color.match(/#[0-9a-f]{6}/i)
    if (hexMatch) {
      style.textColor = hexMatch[0]
    }
  }
  
  // 提取border-radius
  const radiusMatch = cssString.match(/border-radius:\s*(\d+)px/i)
  if (radiusMatch) {
    style.borderRadius = parseInt(radiusMatch[1])
  }
  
  // 提取padding
  const paddingMatch = cssString.match(/padding:\s*(\d+)px\s+(\d+)px/i)
  if (paddingMatch) {
    style.paddingVertical = parseInt(paddingMatch[1])
    style.paddingHorizontal = parseInt(paddingMatch[2])
  }
  
  // 提取box-shadow
  const shadowMatch = cssString.match(/box-shadow:\s*([^;!]+)/i)
  if (shadowMatch) {
    const shadow = shadowMatch[1].trim()
    const parts = shadow.match(/(-?\d+)px/g)
    if (parts && parts.length >= 3) {
      style.shadowOffsetX = parseInt(parts[0])
      style.shadowOffsetY = parseInt(parts[1])
      style.shadowBlur = parseInt(parts[2])
      if (parts[3]) {
        style.shadowSpread = parseInt(parts[3])
      }
    }
    const rgbaMatch = shadow.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1])
      const g = parseInt(rgbaMatch[2])
      const b = parseInt(rgbaMatch[3])
      style.shadowColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      style.shadowOpacity = parseFloat(rgbaMatch[4])
    }
  }
  
  // 提取border
  const borderMatch = cssString.match(/border:\s*(\d+)px\s+solid\s+([^;!]+)/i)
  if (borderMatch) {
    style.borderWidth = parseInt(borderMatch[1])
    const borderColor = borderMatch[2].trim()
    const rgbaMatch = borderColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1])
      const g = parseInt(rgbaMatch[2])
      const b = parseInt(rgbaMatch[3])
      style.borderColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      style.borderOpacity = parseFloat(rgbaMatch[4])
    }
  }
  
  return style
}

// 生成CSS字符串
export function generateCSS(style: BubbleStyle, isUser: boolean): string {
  const selector = isUser ? '.message-container.sent .message-bubble' : '.message-container.received .message-bubble'
  
  let background = ''
  if (style.useGradient) {
    background = `linear-gradient(${style.gradientAngle}deg, ${style.gradientColor1}, ${style.gradientColor2})`
  } else {
    const r = parseInt(style.backgroundColor.slice(1, 3), 16)
    const g = parseInt(style.backgroundColor.slice(3, 5), 16)
    const b = parseInt(style.backgroundColor.slice(5, 7), 16)
    background = `rgba(${r}, ${g}, ${b}, ${style.backgroundOpacity})`
  }
  
  const textR = parseInt(style.textColor.slice(1, 3), 16)
  const textG = parseInt(style.textColor.slice(3, 5), 16)
  const textB = parseInt(style.textColor.slice(5, 7), 16)
  const textColor = `rgba(${textR}, ${textG}, ${textB}, ${style.textOpacity})`
  
  const shadowR = parseInt(style.shadowColor.slice(1, 3), 16)
  const shadowG = parseInt(style.shadowColor.slice(3, 5), 16)
  const shadowB = parseInt(style.shadowColor.slice(5, 7), 16)
  const boxShadow = `${style.shadowOffsetX}px ${style.shadowOffsetY}px ${style.shadowBlur}px ${style.shadowSpread}px rgba(${shadowR}, ${shadowG}, ${shadowB}, ${style.shadowOpacity})`
  
  let border = ''
  if (style.borderWidth > 0) {
    const borderR = parseInt(style.borderColor.slice(1, 3), 16)
    const borderG = parseInt(style.borderColor.slice(3, 5), 16)
    const borderB = parseInt(style.borderColor.slice(5, 7), 16)
    border = `  border: ${style.borderWidth}px solid rgba(${borderR}, ${borderG}, ${borderB}, ${style.borderOpacity}) !important;\n`
  }
  
  // 水滴形状：sent右下角小圆角，received左下角小圆角
  const borderRadiusValue = isUser 
    ? `${style.borderRadius}px ${style.borderRadius}px 4px ${style.borderRadius}px`
    : `${style.borderRadius}px ${style.borderRadius}px ${style.borderRadius}px 4px`
  
  return `${selector} {
  background: ${background} !important;
  color: ${textColor} !important;
  border-radius: ${borderRadiusValue} !important;
  padding: ${style.paddingVertical}px ${style.paddingHorizontal}px !important;
  box-shadow: ${boxShadow} !important;
${border}  font-size: ${style.fontSize}px !important;
  font-weight: ${style.fontWeight} !important;
  opacity: ${style.opacity} !important;
${style.transform ? `  transform: ${style.transform} !important;\n` : ''}}`
}
