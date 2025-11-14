/**
 * AI图片生成工具
 * 使用 Pollinations.ai 免费生图API
 */

/**
 * 使用 Pollinations.ai 生成图片
 * @param description 图片描述（中文或英文）
 * @param width 图片宽度，默认512
 * @param height 图片高度，默认512
 * @returns base64格式的图片数据
 */
export async function generateImage(
  description: string,
  width: number = 512,
  height: number = 512
): Promise<string | null> {
  try {
    console.log('🎨 [生图] 开始生成图片:', description)
    
    // 简单中英翻译（避免中文导致生成错误）
    const translateMap: Record<string, string> = {
      // 动物 & 角色
      '猫咪': 'cute cat ', '小猫': 'kitten ', '猫': 'cat ',
      '狗': 'dog ', '狗狗': 'cute dog ',
      '兔子': 'rabbit ', '小兔': 'bunny ',
      '少女': 'girl ', '女孩': 'girl ', '女生': 'girl ',
      '男孩': 'boy ', '男生': 'boy ', '小孩': 'child ',
      '机器人': 'robot ',

      // 水果 & 食物
      '苹果': 'apple ', '香蕉': 'banana ', '草莓': 'strawberry ', '西瓜': 'watermelon ',

      // 情绪 & 状态
      '愤怒的': 'angry ', '生气的': 'angry ', '生气': 'angry ',

      // 动作
      '拿着': 'holding ', '举着': 'holding up ',

      // 风格 & 画风
      '粉发': 'pink hair ', '黑发': 'black hair ', '金发': 'blonde hair ',
      '二次元': 'anime style ', '动漫': 'anime ',
      '赛博朋克': 'cyberpunk ',

      // 形容词
      '可爱': 'cute ', '酷酷的': 'cool ', '帅气': 'handsome ',
      '真实': 'realistic ', '照片': 'photo ',
      '母亲': 'mother ', '妈妈': 'mother ', '宝宝': 'baby ',
      '温柔': 'gentle ', '优雅': 'elegant ', '活泼': 'lively ',
      '神秘': 'mysterious ', '梦幻': 'dreamy ', '清新': 'fresh ',

      // 杂项（去掉口语赘词）
      '呢': ' ', '好看': ' ', '多爱': 'love ', '比较': 'compare ',
      '符合': 'match ', '沉稳': 'calm ', '气质': 'elegant ', '喵喵': 'meow '
    }
    
    let translatedDesc = description
    for (const [cn, en] of Object.entries(translateMap)) {
      translatedDesc = translatedDesc.replace(new RegExp(cn, 'g'), en)
    }

    // 去掉残留中文字符，避免干扰英文提示词
    translatedDesc = translatedDesc.replace(/[\u4e00-\u9fa5]+/g, ' ')
    // 压缩多余空格
    translatedDesc = translatedDesc.replace(/\s+/g, ' ').trim()
    
    // 强化提示词：添加更多关键词确保生成正确
    const enhancedPrompt = `portrait avatar of ${translatedDesc}, centered composition, profile picture style, high quality, detailed, professional digital art, 4k`
    
    console.log('📝 [生图] 翻译后的提示词:', enhancedPrompt)
    
    // 使用 Pollinations.ai API（免费且稳定）
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux`
    
    console.log('🌐 [生图] 请求URL:', imageUrl)
    
    // 下载图片
    const imgResponse = await fetch(imageUrl)
    if (!imgResponse.ok) {
      throw new Error(`生图API返回错误: ${imgResponse.status}`)
    }
    
    const blob = await imgResponse.blob()
    
    // 转换为base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    
    console.log('✅ [生图] 生成成功，大小:', (base64.length / 1024).toFixed(2), 'KB')
    
    return base64
    
  } catch (error) {
    console.error('❌ [生图] 生成失败:', error)
    return null
  }
}

/**
 * 为AI生成新头像
 * 这里在原有描述基础上：
 * - 固定偏可爱的头像风格（避免生成过于成熟的形象）
 * - 加入一个轻量级随机seed标签，减少同一描述反复返回完全相同头像的情况
 */
export async function generateAvatarForAI(description: string): Promise<string | null> {
  // 简单随机标签，用于打破模型对同一提示词的完全复现
  const seedTag = `seed-${Math.random().toString(36).slice(2, 8)}`

  // 多种可选的漫画/卡通风格 preset，避免所有头像风格完全一致
  const stylePresets = [
    'kawaii chibi 2d anime, flat pastel illustration, minimal shading, ',
    'soft manga style portrait, clean lineart, flat colors, ',
    'cute cartoon avatar, icon-style, simple shapes, bold outline, ',
    'stylized anime profile picture, vibrant colors, gentle shading, ',
    // 像素风/8bit 线条
    'pixel art avatar, 8-bit style, sharp pixels, limited color palette, simple outlines, '
  ]

  const preset = stylePresets[Math.floor(Math.random() * stylePresets.length)]

  // 让原始描述放在中间，风格只是辅助，不盖住描述语义
  const avatarDescription = `${preset}${description}, character portrait, ${seedTag}`

  return generateImage(avatarDescription, 512, 512)
}

/**
 * 生成小红书风格图片
 * @param description 图片描述
 * @returns base64格式的图片数据
 */
export async function generateXiaohongshuImage(description: string): Promise<string | null> {
  // 小红书风格：更大尺寸，更精美
  return generateImage(description, 768, 1024)
}

