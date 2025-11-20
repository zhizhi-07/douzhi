/**
 * Character Card V2/V3 解析工具
 * 用于从 PNG 图片中提取嵌入的角色卡数据
 * 兼容 SillyTavern 和其他酒馆客户端的角色卡格式
 */

// Character Card V2 规范
export interface CharacterCardV2 {
  spec: 'chara_card_v2'
  spec_version: '2.0' | '3.0'
  data: {
    name: string
    description: string
    personality: string
    scenario: string
    first_mes: string
    mes_example: string
    
    // V2 扩展字段
    creator_notes?: string
    system_prompt?: string
    post_history_instructions?: string
    alternate_greetings?: string[]
    tags?: string[]
    creator?: string
    character_version?: string
    
    // Lorebook (世界书)
    character_book?: {
      name?: string
      description?: string
      scan_depth?: number
      token_budget?: number
      recursive_scanning?: boolean
      extensions?: Record<string, any>
      entries: Array<{
        keys: string[]
        content: string
        extensions?: Record<string, any>
        enabled: boolean
        insertion_order: number
        case_sensitive?: boolean
        name?: string
        priority?: number
        id?: number
        comment?: string
        selective?: boolean
        secondary_keys?: string[]
        constant?: boolean
        position?: 'before_char' | 'after_char'
      }>
    }
    
    // 其他扩展
    extensions?: Record<string, any>
  }
}

// 旧版 Character Card V1
interface CharacterCardV1 {
  name: string
  description: string
  personality: string
  scenario: string
  first_mes: string
  mes_example: string
  [key: string]: any
}

/**
 * 从 PNG 文件中提取 Character Card 数据
 */
export async function extractCharacterCardFromPNG(file: File): Promise<CharacterCardV2 | CharacterCardV1 | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        if (!arrayBuffer) {
          reject(new Error('文件读取失败'))
          return
        }
        
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // 检查 PNG 签名
        if (!isPNG(uint8Array)) {
          reject(new Error('不是有效的 PNG 文件'))
          return
        }
        
        // 查找 tEXt chunk 中的 'chara' 字段
        const charaData = extractTextChunk(uint8Array, 'chara')
        
        if (charaData) {
          try {
            // Base64 解码 - 正确处理 UTF-8
            const binaryString = atob(charaData)
            
            // 将二进制字符串转换为字节数组
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            
            // 使用 TextDecoder 正确解码 UTF-8
            const decoder = new TextDecoder('utf-8')
            const jsonString = decoder.decode(bytes)
            
            console.log('解码后 JSON 前200字符:', jsonString.substring(0, 200))
            
            const characterData = JSON.parse(jsonString)
            
            // 详细调试：查看完整结构
            console.log('=== Character Card 完整数据 ===')
            console.log('spec:', characterData.spec)
            console.log('data 对象:', characterData.data)
            if (characterData.data) {
              console.log('data 的所有键:', Object.keys(characterData.data))
              console.log('是否有 character_book:', 'character_book' in characterData.data)
              if (characterData.data.character_book) {
                console.log('character_book 条目数:', characterData.data.character_book.entries?.length || 0)
              }
            }
            
            // 验证基本结构
            if (!characterData || typeof characterData !== 'object') {
              reject(new Error('Character Card 数据格式无效'))
              return
            }
            
            // 检测版本
            if (characterData.spec === 'chara_card_v2') {
              // 验证 V2 格式
              if (!characterData.data || typeof characterData.data !== 'object') {
                reject(new Error('Character Card V2 格式错误'))
                return
              }
              resolve(characterData as CharacterCardV2)
            } else {
              // 旧版格式 - 验证必要字段
              if (!characterData.name) {
                reject(new Error('Character Card V1 缺少必要字段'))
                return
              }
              resolve(characterData as CharacterCardV1)
            }
          } catch (error) {
            console.error('解析 Character Card 失败:', error)
            if (error instanceof Error && error.message.includes('Character Card')) {
              reject(error)
            } else {
              reject(new Error('Character Card 数据格式错误或已损坏'))
            }
          }
        } else {
          reject(new Error('PNG 中未找到 Character Card 数据\n\n提示：请确保这是从 SillyTavern 等酒馆客户端导出的角色卡'))
        }
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 检查是否为 PNG 文件
 */
function isPNG(uint8Array: Uint8Array): boolean {
  // PNG 签名: 89 50 4E 47 0D 0A 1A 0A
  return (
    uint8Array[0] === 0x89 &&
    uint8Array[1] === 0x50 &&
    uint8Array[2] === 0x4e &&
    uint8Array[3] === 0x47 &&
    uint8Array[4] === 0x0d &&
    uint8Array[5] === 0x0a &&
    uint8Array[6] === 0x1a &&
    uint8Array[7] === 0x0a
  )
}

/**
 * 从 PNG 中提取指定的 tEXt chunk
 */
function extractTextChunk(uint8Array: Uint8Array, keyword: string): string | null {
  let offset = 8 // 跳过 PNG 签名
  
  while (offset < uint8Array.length) {
    // 读取 chunk 长度（4 字节，大端序）
    const length = readUint32BE(uint8Array, offset)
    offset += 4
    
    // 读取 chunk 类型（4 字节）- 使用 latin1 解码 ASCII
    const typeDecoder = new TextDecoder('latin1')
    const type = typeDecoder.decode(uint8Array.slice(offset, offset + 4))
    offset += 4
    
    // 如果是 tEXt chunk
    if (type === 'tEXt') {
      const chunkData = uint8Array.slice(offset, offset + length)
      
      // 查找 null 分隔符
      const nullIndex = chunkData.indexOf(0)
      if (nullIndex !== -1) {
        // 关键词使用 latin1 (ASCII)
        const keyDecoder = new TextDecoder('latin1')
        const key = keyDecoder.decode(chunkData.slice(0, nullIndex))
        
        if (key === keyword) {
          // 找到了！Base64 数据使用 latin1 解码
          const valueDecoder = new TextDecoder('latin1')
          const value = valueDecoder.decode(chunkData.slice(nullIndex + 1))
          return value
        }
      }
    }
    
    // 跳过 chunk 数据和 CRC（4 字节）
    offset += length + 4
    
    // 如果遇到 IEND chunk，停止
    if (type === 'IEND') break
  }
  
  return null
}

/**
 * 读取 32 位大端序整数
 */
function readUint32BE(uint8Array: Uint8Array, offset: number): number {
  return (
    (uint8Array[offset] << 24) |
    (uint8Array[offset + 1] << 16) |
    (uint8Array[offset + 2] << 8) |
    uint8Array[offset + 3]
  )
}

/**
 * 清理对象中的循环引用和不必要的字段
 */
function cleanObject(obj: any, maxDepth: number = 10, currentDepth: number = 0, seen = new WeakSet()): any {
  // 防止无限递归
  if (currentDepth > maxDepth) {
    return undefined
  }
  
  // 处理 null 和基本类型
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  // 检测循环引用
  if (seen.has(obj)) {
    return undefined
  }
  
  seen.add(obj)
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item, maxDepth, currentDepth + 1, seen)).filter(item => item !== undefined)
  }
  
  // 处理对象
  const cleaned: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // 跳过 extensions 等可能包含循环引用的字段
      if (key === 'extensions' && currentDepth > 2) {
        continue
      }
      const value = cleanObject(obj[key], maxDepth, currentDepth + 1, seen)
      if (value !== undefined) {
        cleaned[key] = value
      }
    }
  }
  
  return cleaned
}

/**
 * 将 Character Card 转换为应用内部格式
 */
export function convertCharacterCardToInternal(
  card: CharacterCardV2 | CharacterCardV1,
  imageDataUrl: string
): {
  name: string
  username: string
  avatar: string
  signature: string
  description: string
  personality?: string
  scenario?: string
  firstMessage?: string
  exampleMessages?: string
  systemPrompt?: string
  characterBook?: any
  alternateGreetings?: string[]
  tags?: string[]
  creator?: string
} {
  // 检测是否为 V2/V3 格式
  const isV2OrV3 = 'spec' in card && 'data' in card && card.spec === 'chara_card_v2'
  const data = isV2OrV3 ? (card as CharacterCardV2).data : (card as CharacterCardV1)
  
  console.log('🔍 检测格式:', isV2OrV3 ? 'V2/V3' : 'V1')
  
  // 验证必要字段
  if (!data.name || !data.name.trim()) {
    throw new Error('Character Card 缺少角色名称')
  }
  
  // 构建完整描述
  const fullDescription = [
    data.description,
    data.personality ? `\n\n【性格】\n${data.personality}` : '',
    data.scenario ? `\n\n【场景】\n${data.scenario}` : '',
  ].filter(Boolean).join('').trim()
  
  // 清理 character_book 中的循环引用
  // 支持多种命名方式：character_book、characterBook、extensions.character_book
  let cleanedCharacterBook = undefined
  let characterBook = null
  
  // 尝试多种可能的字段名
  if ('character_book' in data && data.character_book) {
    characterBook = data.character_book
  } else if ('characterBook' in data && (data as any).characterBook) {
    characterBook = (data as any).characterBook
  } else if ('extensions' in data && (data as any).extensions?.character_book) {
    characterBook = (data as any).extensions.character_book
  }
  
  if (characterBook && Array.isArray(characterBook.entries) && characterBook.entries.length > 0) {
    console.log('✅ 检测到世界书，条目数:', characterBook.entries.length)
    try {
      cleanedCharacterBook = cleanObject(characterBook, 15)
    } catch (error) {
      console.warn('清理世界书失败，使用原始数据:', error)
      cleanedCharacterBook = characterBook
    }
  } else {
    const reason = !characterBook ? '未找到世界书字段' : 
                   !Array.isArray(characterBook.entries) ? 'entries不是数组' :
                   'entries为空数组'
    console.log('❌ 未导入世界书:', reason)
  }
  
  const result = {
    name: data.name.trim(),
    username: `wxid_${Date.now().toString().slice(-8)}`,
    avatar: imageDataUrl,
    signature: data.personality?.slice(0, 100) || '来自 Character Card',
    description: fullDescription || '这个角色还没有描述',
    personality: data.personality,
    scenario: data.scenario,
    firstMessage: data.first_mes,
    exampleMessages: data.mes_example,
    systemPrompt: 'system_prompt' in data ? data.system_prompt : undefined,
    characterBook: cleanedCharacterBook,
    alternateGreetings: 'alternate_greetings' in data ? data.alternate_greetings : undefined,
    tags: 'tags' in data ? data.tags : undefined,
    creator: 'creator' in data ? data.creator : undefined,
  }
  
  return result
}
