/**
 * 商城管理工具
 * 用于管理用户的店铺和商品
 */

export interface Product {
    id: string              // 商品ID
    shopId: string          // 所属店铺ID
    name: string            // 商品名称
    description: string     // 商品描述
    price: number           // 商品价格
    image: string           // 商品图片URL (base64)
    stock: number           // 库存数量
    category: string        // 商品类别（互动、道具等）
    createdAt: number       // 创建时间
}

export interface Shop {
    id: string              // 店铺ID
    userId: string          // 店主用户ID
    name: string            // 店铺名称
    description: string     // 店铺描述
    products: Product[]     // 商品列表
    createdAt: number       // 创建时间
}

// 默认的情侣互动商品模板（示例）
export const DEFAULT_INTERACTION_PRODUCTS = [
    {
        name: '亲亲',
        description: '这是一个示例商品，你可以删除它并添加自己的商品💕',
        price: 99.99,
        category: '互动',
        image: '' // 用户可以自定义图片
    }
]

/**
 * 创建店铺
 */
export function createShop(userId: string, name: string, description: string): Shop {
    const shopId = `shop_${userId}_${Date.now()}`
    const shop: Shop = {
        id: shopId,
        userId,
        name,
        description,
        products: [],
        createdAt: Date.now()
    }

    // 保存到localStorage
    localStorage.setItem(`shop_${userId}`, JSON.stringify(shop))
    return shop
}

/**
 * 获取店铺
 */
export function getShop(userId: string): Shop | null {
    const shopData = localStorage.getItem(`shop_${userId}`)
    if (!shopData) return null
    
    const shop: Shop = JSON.parse(shopData)
    
    // 🔧 数据迁移：修复旧的重复 ID
    let needsUpdate = false
    const seenIds = new Set<string>()
    
    shop.products = shop.products.map(product => {
        // 检查是否是旧格式 ID（只有时间戳，没有随机后缀）
        const isOldFormat = /^product_\d+$/.test(product.id)
        const isDuplicate = seenIds.has(product.id)
        
        if (isOldFormat || isDuplicate) {
            needsUpdate = true
            const newId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            seenIds.add(newId)
            return { ...product, id: newId }
        }
        
        seenIds.add(product.id)
        return product
    })
    
    // 如果有更新，保存回 localStorage
    if (needsUpdate) {
        localStorage.setItem(`shop_${userId}`, JSON.stringify(shop))
        console.log('🔧 [商城] 已自动修复重复的商品 ID')
    }
    
    return shop
}

/**
 * 添加商品
 */
export function addProduct(
    userId: string,
    name: string,
    description: string,
    price: number,
    image: string,
    stock: number = 999,
    category: string = '互动'
): Product | null {
    const shop = getShop(userId)
    if (!shop) return null

    // 生成唯一ID：时间戳 + 随机数，避免重复
    const uniqueId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const product: Product = {
        id: uniqueId,
        shopId: shop.id,
        name,
        description,
        price,
        image,
        stock,
        category,
        createdAt: Date.now()
    }

    shop.products.push(product)
    localStorage.setItem(`shop_${userId}`, JSON.stringify(shop))
    return product
}

/**
 * 更新商品
 */
export function updateProduct(
    userId: string,
    productId: string,
    updates: Partial<Omit<Product, 'id' | 'shopId' | 'createdAt'>>
): boolean {
    const shop = getShop(userId)
    if (!shop) return false

    const productIndex = shop.products.findIndex(p => p.id === productId)
    if (productIndex === -1) return false

    shop.products[productIndex] = {
        ...shop.products[productIndex],
        ...updates
    }

    localStorage.setItem(`shop_${userId}`, JSON.stringify(shop))
    return true
}

/**
 * 删除商品
 */
export function deleteProduct(userId: string, productId: string): boolean {
    const shop = getShop(userId)
    if (!shop) return false

    const productIndex = shop.products.findIndex(p => p.id === productId)
    if (productIndex === -1) return false

    shop.products.splice(productIndex, 1)
    localStorage.setItem(`shop_${userId}`, JSON.stringify(shop))
    return true
}

/**
 * 生成分享数据
 */
export function generateShareData(userId: string) {
    const shop = getShop(userId)
    if (!shop) return null

    // 取前3个商品作为预览（用于卡片显示）
    const previewProducts = shop.products.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image
    }))

    // 完整商品列表（用于AI读取）
    const allProducts = shop.products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description,
        category: p.category,
        stock: p.stock
    }))

    return {
        shopId: shop.id,
        shopName: shop.name,
        productCount: shop.products.length,
        previewProducts,
        allProducts  // 完整商品列表
    }
}

/**
 * 购买商品（用于AI回复）
 */
export function purchaseProduct(shopId: string, productId: string): {
    success: boolean
    message: string
    product?: Product
} {
    // 从shopId中提取userId
    const userId = shopId.split('_')[1]
    const shop = getShop(userId)

    if (!shop) {
        return { success: false, message: '店铺不存在' }
    }

    const product = shop.products.find(p => p.id === productId)
    if (!product) {
        return { success: false, message: '商品不存在' }
    }

    if (product.stock <= 0) {
        return { success: false, message: '商品已售罄' }
    }

    // 减少库存
    product.stock -= 1
    localStorage.setItem(`shop_${userId}`, JSON.stringify(shop))

    return {
        success: true,
        message: `成功购买 ${product.name}`,
        product
    }
}
