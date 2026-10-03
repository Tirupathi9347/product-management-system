import {
  ProductWithMeta,
  Category,
  Purchase,
  ConsumptionHistory,
  ActivityLog,
  ProductFilterOptions,
  NotificationItem,
} from '@/types'

const STORAGE_KEY_PRODUCTS = 'spms_dev_products_v1'
const STORAGE_KEY_PURCHASES = 'spms_dev_purchases_v1'
const STORAGE_KEY_CONSUMPTION = 'spms_dev_consumption_v1'
const STORAGE_KEY_ACTIVITIES = 'spms_dev_activities_v1'
const STORAGE_KEY_CATEGORIES = 'spms_dev_categories_v1'
const STORAGE_KEY_NOTIFICATIONS = 'spms_dev_notifications_v1'
const STORAGE_KEY_SETTINGS = 'spms_dev_settings_v1'

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Food & Groceries', icon: 'Utensils', color: '#10B981', description: 'Perishables, pantry items, dairy, and snacks', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-2', name: 'Beverages', icon: 'Coffee', color: '#3B82F6', description: 'Soft drinks, juices, coffee, tea, and spirits', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-3', name: 'Pantry & Spices', icon: 'Package', color: '#EF4444', description: 'Spices, seasonings, grains, flour, and baking essentials', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-4', name: 'Personal Care & Cosmetics', icon: 'Sparkles', color: '#EC4899', description: 'Skincare, haircare, hygiene, and grooming', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-5', name: 'Household & Cleaning', icon: 'Home', color: '#F59E0B', description: 'Cleaning supplies, detergents, paper products', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-6', name: 'Electronics & Gadgets', icon: 'Cpu', color: '#8B5CF6', description: 'Batteries, cables, tech accessories, small electronics', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-7', name: 'Other', icon: 'Package', color: '#64748B', description: 'Miscellaneous items', created_at: '2026-01-01T00:00:00Z' },
]

// Pre-seeded high quality products with realistic expiry dates and quantities
const today = new Date()
const addDays = (days: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export const SEED_PRODUCTS: ProductWithMeta[] = [
  {
    id: 'prod-1',
    user_id: 'dev-user-001',
    category_id: 'cat-1',
    name: 'Organic Greek Yogurt 32oz',
    brand: 'Chobani',
    barcode: '8901234567890',
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
    description: 'Plain whole milk Greek yogurt with probiotic cultures.',
    quantity: 1,
    unit: 'tubs',
    mrp: 6.49,
    purchase_price: 5.29,
    weight: '32 oz',
    manufacturing_date: addDays(-14),
    expiry_date: addDays(4), // Expiring soon (<7 days)
    batch_number: 'BATCH-CHOB-98',
    purchase_date: addDays(-10),
    storage_location: 'Refrigerator - Top Shelf',
    minimum_stock_level: 2,
    tags: ['dairy', 'breakfast', 'probiotic'],
    notes: 'Low stock threshold triggered. Reorder before weekend.',
    is_archived: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'prod-2',
    user_id: 'dev-user-001',
    category_id: 'cat-1',
    name: 'Artisan Sourdough Loaf',
    brand: 'Local Bakery',
    barcode: '8901234567891',
    image_url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=600&auto=format&fit=crop&q=80',
    description: 'Slow-fermented wild yeast sourdough batard.',
    quantity: 0,
    unit: 'loaves',
    mrp: 7.99,
    purchase_price: 6.50,
    weight: '750 g',
    manufacturing_date: addDays(-6),
    expiry_date: addDays(-1), // Expired!
    batch_number: 'LOT-SD-12',
    purchase_date: addDays(-5),
    storage_location: 'Kitchen Bread Box',
    minimum_stock_level: 1,
    tags: ['bakery', 'organic'],
    notes: 'Consumed yesterday. Need to reorder.',
    is_archived: false,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'prod-3',
    user_id: 'dev-user-001',
    category_id: 'cat-2',
    name: 'Single Origin Whole Bean Coffee',
    brand: 'Blue Bottle',
    barcode: '8901234567892',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80',
    description: 'Ethiopian Yirgacheffe washed process, floral and citrus notes.',
    quantity: 4,
    unit: 'bags',
    mrp: 18.50,
    purchase_price: 15.00,
    weight: '340 g',
    manufacturing_date: addDays(-20),
    expiry_date: addDays(60), // Safe
    batch_number: 'ETH-2026-03',
    purchase_date: addDays(-15),
    storage_location: 'Coffee Station Pantry',
    minimum_stock_level: 2,
    tags: ['coffee', 'beverage', 'morning'],
    notes: 'Stock level optimal.',
    is_archived: false,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'prod-4',
    user_id: 'dev-user-001',
    category_id: 'cat-3',
    name: 'Organic Tellicherry Black Pepper',
    brand: 'Frontier Co-op',
    barcode: '8901234567893',
    image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80',
    description: 'Whole organic black peppercorns with robust, floral heat.',
    quantity: 2,
    unit: 'jars',
    mrp: 12.99,
    purchase_price: 9.95,
    weight: '16 oz (453g)',
    manufacturing_date: addDays(-90),
    expiry_date: addDays(365), // Safe
    batch_number: 'FC-9921',
    purchase_date: addDays(-40),
    storage_location: 'Kitchen Spice Rack',
    minimum_stock_level: 1,
    tags: ['spice', 'pantry', 'seasoning'],
    notes: '',
    is_archived: false,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'prod-5',
    user_id: 'dev-user-001',
    category_id: 'cat-5',
    name: 'Plant-Based Laundry Detergent',
    brand: 'Seventh Generation',
    barcode: '8901234567894',
    image_url: 'https://images.unsplash.com/photo-1585832770485-e68a5dbfad52?w=600&auto=format&fit=crop&q=80',
    description: 'Hypoallergenic fragrance-free concentrated laundry detergent.',
    quantity: 1,
    unit: 'jugs',
    mrp: 14.99,
    purchase_price: 11.50,
    weight: '90 fl oz',
    manufacturing_date: addDays(-60),
    expiry_date: addDays(500),
    batch_number: 'SG-819',
    purchase_date: addDays(-30),
    storage_location: 'Laundry Room Shelf',
    minimum_stock_level: 1,
    tags: ['cleaning', 'household', 'eco'],
    notes: 'Last unit in stock.',
    is_archived: false,
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prod-6',
    user_id: 'dev-user-001',
    category_id: 'cat-4',
    name: 'Hydrating Face Moisturizer',
    brand: 'CeraVe',
    barcode: '8901234567895',
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
    description: 'Daily moisturizing lotion with ceramides and hyaluronic acid.',
    quantity: 3,
    unit: 'bottles',
    mrp: 16.99,
    purchase_price: 13.20,
    weight: '355 ml',
    manufacturing_date: addDays(-100),
    expiry_date: addDays(180),
    batch_number: 'CRV-4421',
    purchase_date: addDays(-20),
    storage_location: 'Bathroom Vanity',
    minimum_stock_level: 1,
    tags: ['skincare', 'hygiene'],
    notes: '',
    is_archived: false,
    created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
]

export const SEED_PURCHASES: Purchase[] = [
  {
    id: 'purch-1',
    user_id: 'dev-user-001',
    product_id: 'prod-1',
    quantity: 2,
    purchase_price: 5.29,
    total_amount: 10.58,
    purchase_date: addDays(-10),
    store_name: 'Whole Foods Market',
    notes: 'Weekly grocery run',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'purch-2',
    user_id: 'dev-user-001',
    product_id: 'prod-3',
    quantity: 4,
    purchase_price: 15.00,
    total_amount: 60.00,
    purchase_date: addDays(-15),
    store_name: 'Blue Bottle Online',
    notes: 'Monthly coffee subscription batch',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'purch-3',
    user_id: 'dev-user-001',
    product_id: 'prod-4',
    quantity: 2,
    purchase_price: 19.95,
    total_amount: 39.90,
    purchase_date: addDays(-40),
    store_name: 'Spice Bazaar',
    notes: 'Pantry spices restocking',
    created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
  },
]

export const SEED_CONSUMPTION: ConsumptionHistory[] = [
  {
    id: 'cons-1',
    user_id: 'dev-user-001',
    product_id: 'prod-1',
    quantity: 1,
    consumed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    note: 'Used for morning breakfast bowl',
  },
  {
    id: 'cons-2',
    user_id: 'dev-user-001',
    product_id: 'prod-2',
    quantity: 1,
    consumed_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    note: 'Finished loaf with dinner',
  },
]

export const SEED_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    user_id: 'dev-user-001',
    product_id: 'prod-1',
    action: 'consume',
    description: 'Consumed 1 tubs of Organic Greek Yogurt 32oz',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'act-2',
    user_id: 'dev-user-001',
    product_id: 'prod-2',
    action: 'consume',
    description: 'Consumed 1 loaves of Artisan Sourdough Loaf (Now Out of Stock)',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'act-3',
    user_id: 'dev-user-001',
    product_id: 'prod-3',
    action: 'purchase',
    description: 'Recorded purchase of 4 bags of Single Origin Whole Bean Coffee ($60.00)',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'act-4',
    user_id: 'dev-user-001',
    product_id: 'prod-1',
    action: 'create',
    description: 'Added new product Organic Greek Yogurt 32oz to catalog',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
]

// In-Memory cache for SSR & client synchronization
class DevStore {
  private products: ProductWithMeta[] = []
  private purchases: Purchase[] = []
  private consumption: ConsumptionHistory[] = []
  private activities: ActivityLog[] = []
  private categories: Category[] = SEED_CATEGORIES
  private notifications: NotificationItem[] = []
  private settings: Record<string, unknown> = {
    low_stock_threshold: 2,
    expiry_warning_days: 14,
    notify_expiry: true,
    notify_low_stock: true,
    notify_purchases: true,
  }
  private isInitialized = false

  private init() {
    if (this.isInitialized) return

    if (typeof window !== 'undefined') {
      try {
        const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS)
        this.products = storedProducts ? JSON.parse(storedProducts) : [...SEED_PRODUCTS]

        const storedPurchases = localStorage.getItem(STORAGE_KEY_PURCHASES)
        this.purchases = storedPurchases ? JSON.parse(storedPurchases) : [...SEED_PURCHASES]

        const storedConsumption = localStorage.getItem(STORAGE_KEY_CONSUMPTION)
        this.consumption = storedConsumption ? JSON.parse(storedConsumption) : [...SEED_CONSUMPTION]

        const storedActivities = localStorage.getItem(STORAGE_KEY_ACTIVITIES)
        this.activities = storedActivities ? JSON.parse(storedActivities) : [...SEED_ACTIVITIES]

        const storedCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES)
        this.categories = storedCategories ? JSON.parse(storedCategories) : [...SEED_CATEGORIES]

        const storedNotifications = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS)
        this.notifications = storedNotifications ? JSON.parse(storedNotifications) : []

        const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS)
        if (storedSettings) {
          this.settings = { ...this.settings, ...JSON.parse(storedSettings) }
        }
      } catch (err) {
        console.warn('DevStore localStorage init error, using memory defaults:', err)
        this.products = [...SEED_PRODUCTS]
        this.purchases = [...SEED_PURCHASES]
        this.consumption = [...SEED_CONSUMPTION]
        this.activities = [...SEED_ACTIVITIES]
        this.categories = [...SEED_CATEGORIES]
        this.notifications = []
      }
    } else {
      this.products = [...SEED_PRODUCTS]
      this.purchases = [...SEED_PURCHASES]
      this.consumption = [...SEED_CONSUMPTION]
      this.activities = [...SEED_ACTIVITIES]
      this.categories = [...SEED_CATEGORIES]
      this.notifications = []
    }

    this.isInitialized = true
    this.syncNotificationsFromProductState()
  }

  private persist(key: string, data: unknown) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch (e) {
        console.warn('Could not persist to localStorage:', e)
      }
    }
  }

  // --- Categories ---
  public getCategories(): Category[] {
    this.init()
    return [...this.categories]
  }

  // --- Products ---
  public getProducts(filter?: ProductFilterOptions): ProductWithMeta[] {
    this.init()
    let list = this.products.map((p) => {
      const category = this.categories.find((c) => c.id === p.category_id) || null
      return { ...p, category }
    })

    // Filter: Archived
    if (filter?.isArchived !== undefined) {
      list = list.filter((p) => Boolean(p.is_archived) === filter.isArchived)
    } else {
      // By default show only unarchived
      list = list.filter((p) => !p.is_archived)
    }

    // Filter: Search
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Filter: Category
    if (filter?.categoryId) {
      list = list.filter((p) => p.category_id === filter.categoryId)
    }

    // Filter: Brand
    if (filter?.brand) {
      list = list.filter((p) => p.brand?.toLowerCase() === filter.brand?.toLowerCase())
    }

    // Filter: Stock Status
    if (filter?.stockStatus) {
      list = list.filter((p) => {
        if (filter.stockStatus === 'OUT_OF_STOCK') return p.quantity <= 0
        if (filter.stockStatus === 'LOW_STOCK') return p.quantity > 0 && p.quantity <= p.minimum_stock_level
        if (filter.stockStatus === 'IN_STOCK') return p.quantity > p.minimum_stock_level
        return true
      })
    }

    // Filter: Expiry Status
    if (filter?.expiryStatus) {
      const now = new Date().setHours(0, 0, 0, 0)
      list = list.filter((p) => {
        if (!p.expiry_date) return filter.expiryStatus === 'NO_EXPIRY'
        const exp = new Date(p.expiry_date).getTime()
        const days = Math.ceil((exp - now) / 86400000)

        if (filter.expiryStatus === 'EXPIRED') return days < 0
        if (filter.expiryStatus === 'URGENT') return days >= 0 && days <= 3
        if (filter.expiryStatus === 'EXPIRING_SOON') return days > 3 && days <= 14
        if (filter.expiryStatus === 'SAFE') return days > 14
        return true
      })
    }

    // Filter: Price Range
    if (filter?.minPrice !== undefined) {
      list = list.filter((p) => (p.purchase_price ?? p.mrp ?? 0) >= filter.minPrice!)
    }
    if (filter?.maxPrice !== undefined) {
      list = list.filter((p) => (p.purchase_price ?? p.mrp ?? 0) <= filter.maxPrice!)
    }

    // Sorting
    if (filter?.sortBy) {
      switch (filter.sortBy) {
        case 'name_asc':
          list.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'name_desc':
          list.sort((a, b) => b.name.localeCompare(a.name))
          break
        case 'price_asc':
          list.sort((a, b) => (a.purchase_price ?? a.mrp ?? 0) - (b.purchase_price ?? b.mrp ?? 0))
          break
        case 'price_desc':
          list.sort((a, b) => (b.purchase_price ?? b.mrp ?? 0) - (a.purchase_price ?? a.mrp ?? 0))
          break
        case 'qty_asc':
          list.sort((a, b) => a.quantity - b.quantity)
          break
        case 'qty_desc':
          list.sort((a, b) => b.quantity - a.quantity)
          break
        case 'expiry_asc':
          list.sort((a, b) => {
            if (!a.expiry_date) return 1
            if (!b.expiry_date) return -1
            return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
          })
          break
        case 'expiry_desc':
          list.sort((a, b) => {
            if (!a.expiry_date) return 1
            if (!b.expiry_date) return -1
            return new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime()
          })
          break
        case 'oldest':
          list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          break
        case 'newest':
        default:
          list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          break
      }
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return list
  }

  public getProductById(id: string): ProductWithMeta | null {
    this.init()
    const p = this.products.find((item) => item.id === id)
    if (!p) return null
    const category = this.categories.find((c) => c.id === p.category_id) || null
    return { ...p, category }
  }

  public createProduct(data: Omit<ProductWithMeta, 'id' | 'created_at' | 'updated_at'>): ProductWithMeta {
    this.init()
    const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()
    const newProduct: ProductWithMeta = {
      ...data,
      id,
      is_archived: false,
      created_at: now,
      updated_at: now,
    }
    this.products.unshift(newProduct)
    this.persist(STORAGE_KEY_PRODUCTS, this.products)

    this.createActivity({
      user_id: data.user_id,
      product_id: id,
      action: 'create',
      description: `Added product "${newProduct.name}" to inventory (${newProduct.quantity} ${newProduct.unit})`,
    })

    return this.getProductById(id)!
  }

  public updateProduct(id: string, updates: Partial<ProductWithMeta>): ProductWithMeta {
    this.init()
    const index = this.products.findIndex((p) => p.id === id)
    if (index === -1) throw new Error(`Product ${id} not found`)

    const existing = this.products[index]
    const updated: ProductWithMeta = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    }
    this.products[index] = updated
    this.persist(STORAGE_KEY_PRODUCTS, this.products)

    this.createActivity({
      user_id: existing.user_id,
      product_id: id,
      action: 'update',
      description: `Updated details for product "${updated.name}"`,
    })

    return this.getProductById(id)!
  }

  public archiveProduct(id: string): ProductWithMeta {
    return this.updateProduct(id, { is_archived: true })
  }

  public restoreProduct(id: string): ProductWithMeta {
    return this.updateProduct(id, { is_archived: false })
  }

  public deleteProduct(id: string): boolean {
    this.init()
    const index = this.products.findIndex((p) => p.id === id)
    if (index === -1) return false

    const p = this.products[index]
    this.products.splice(index, 1)
    this.persist(STORAGE_KEY_PRODUCTS, this.products)

    this.createActivity({
      user_id: p.user_id,
      product_id: null,
      action: 'delete',
      description: `Permanently removed product "${p.name}" from catalog`,
    })

    return true
  }

  public adjustQuantity(id: string, delta: number): ProductWithMeta {
    this.init()
    const p = this.getProductById(id)
    if (!p) throw new Error(`Product ${id} not found`)

    const newQty = Math.max(0, p.quantity + delta)
    const updated = this.updateProduct(id, { quantity: newQty })

    this.createActivity({
      user_id: p.user_id,
      product_id: id,
      action: 'update',
      description: `${delta >= 0 ? 'Increased' : 'Decreased'} quantity of "${p.name}" by ${Math.abs(delta)} (New: ${newQty} ${p.unit})`,
    })

    return updated
  }

  // --- Purchases ---
  public getPurchases(productId?: string): Purchase[] {
    this.init()
    let list = [...this.purchases]
    if (productId) {
      list = list.filter((item) => item.product_id === productId)
    }
    return list.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
  }

  public createPurchase(data: Omit<Purchase, 'id' | 'created_at'>, addToInventory = true): Purchase {
    this.init()
    const id = `purch-${Date.now()}`
    const newPurchase: Purchase = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    }
    this.purchases.unshift(newPurchase)
    this.persist(STORAGE_KEY_PURCHASES, this.purchases)

    // Optional stock update
    if (addToInventory && data.product_id) {
      try {
        const prod = this.getProductById(data.product_id)
        if (prod) {
          this.updateProduct(prod.id, { quantity: prod.quantity + data.quantity })
        }
      } catch (err) {
        console.warn('Could not auto-add purchased quantity to inventory:', err)
      }
    }

    const prod = data.product_id ? this.getProductById(data.product_id) : null
    this.createActivity({
      user_id: data.user_id,
      product_id: data.product_id,
      action: 'purchase',
      description: `Recorded purchase of ${data.quantity} units of ${prod?.name || 'product'} for $${data.total_amount.toFixed(2)}${data.store_name ? ` at ${data.store_name}` : ''}`,
    })

    return newPurchase
  }

  // --- Consumption ---
  public getConsumption(productId?: string): ConsumptionHistory[] {
    this.init()
    let list = [...this.consumption]
    if (productId) {
      list = list.filter((item) => item.product_id === productId)
    }
    return list.sort((a, b) => new Date(b.consumed_at).getTime() - new Date(a.consumed_at).getTime())
  }

  public createConsumption(data: Omit<ConsumptionHistory, 'id'>): ConsumptionHistory {
    this.init()
    const prod = data.product_id ? this.getProductById(data.product_id) : null
    if (prod && prod.quantity < data.quantity) {
      throw new Error(`Insufficient stock. Current quantity is ${prod.quantity} ${prod.unit}, but tried to consume ${data.quantity}.`)
    }

    const id = `cons-${Date.now()}`
    const record: ConsumptionHistory = {
      ...data,
      id,
    }
    this.consumption.unshift(record)
    this.persist(STORAGE_KEY_CONSUMPTION, this.consumption)

    // Deplete inventory
    if (prod) {
      const newQty = Math.max(0, prod.quantity - data.quantity)
      this.updateProduct(prod.id, { quantity: newQty })
    }

    this.createActivity({
      user_id: data.user_id,
      product_id: data.product_id,
      action: 'consume',
      description: `Consumed ${data.quantity} units of ${prod?.name || 'item'}${data.note ? ` ("${data.note}")` : ''}`,
    })

    return record
  }

  // --- Activities ---
  public getActivities(limit = 10, productId?: string): ActivityLog[] {
    this.init()
    let list = [...this.activities]
    if (productId) {
      list = list.filter((act) => act.product_id === productId)
    }
    return list
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  }

  public createActivity(data: Omit<ActivityLog, 'id' | 'created_at'>): ActivityLog {
    this.init()
    const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const record: ActivityLog = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    }
    this.activities.unshift(record)
    this.persist(STORAGE_KEY_ACTIVITIES, this.activities)
    return record
  }

  // --- Notifications ---
  public getNotifications(unreadOnly = false): NotificationItem[] {
    this.init()
    this.syncNotificationsFromProductState()
    let list = [...this.notifications]
    if (unreadOnly) {
      list = list.filter((n) => !n.is_read)
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  public markNotificationRead(id: string): void {
    this.init()
    const notif = this.notifications.find((n) => n.id === id)
    if (notif) {
      notif.is_read = true
      this.persist(STORAGE_KEY_NOTIFICATIONS, this.notifications)
    }
  }

  public markAllNotificationsRead(): void {
    this.init()
    this.notifications.forEach((n) => {
      n.is_read = true
    })
    this.persist(STORAGE_KEY_NOTIFICATIONS, this.notifications)
  }

  public clearNotification(id: string): void {
    this.init()
    this.notifications = this.notifications.filter((n) => n.id !== id)
    this.persist(STORAGE_KEY_NOTIFICATIONS, this.notifications)
  }

  public syncNotificationsFromProductState(): void {
    const existingKeys = new Set(this.notifications.map((n) => n.deterministic_key).filter(Boolean))
    let changed = false
    const now = new Date()

    for (const prod of this.products) {
      if (prod.is_archived) continue

      // Expiry alerts
      if (prod.expiry_date) {
        const expDate = new Date(prod.expiry_date)
        const diffMs = expDate.getTime() - now.getTime()
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        if (days <= 0) {
          const key = `notif_exp_${prod.id}_expired_${prod.expiry_date}`
          if (!existingKeys.has(key)) {
            existingKeys.add(key)
            this.notifications.unshift({
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: `Product Expired: ${prod.name}`,
              message: `${prod.name} (${prod.brand || 'Item'}) reached expiration date on ${prod.expiry_date}.`,
              type: 'EXPIRED',
              severity: 'danger',
              product_id: prod.id,
              product_name: prod.name,
              created_at: new Date().toISOString(),
              is_read: false,
              deterministic_key: key,
            })
            changed = true
          }
        } else if (days <= 3) {
          const key = `notif_exp_${prod.id}_urgent_${prod.expiry_date}`
          if (!existingKeys.has(key)) {
            existingKeys.add(key)
            this.notifications.unshift({
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: `Urgent Expiry: ${prod.name}`,
              message: `${prod.name} expires in ${days} day${days === 1 ? '' : 's'} (${prod.expiry_date}).`,
              type: 'URGENT_EXPIRY',
              severity: 'urgent',
              product_id: prod.id,
              product_name: prod.name,
              created_at: new Date().toISOString(),
              is_read: false,
              deterministic_key: key,
            })
            changed = true
          }
        } else if (days <= 7) {
          const key = `notif_exp_${prod.id}_soon_${prod.expiry_date}`
          if (!existingKeys.has(key)) {
            existingKeys.add(key)
            this.notifications.unshift({
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: `Expiring Soon: ${prod.name}`,
              message: `${prod.name} expires in ${days} days on ${prod.expiry_date}.`,
              type: 'EXPIRY',
              severity: 'warning',
              product_id: prod.id,
              product_name: prod.name,
              created_at: new Date().toISOString(),
              is_read: false,
              deterministic_key: key,
            })
            changed = true
          }
        }
      }

      // Stock alerts
      const threshold = prod.minimum_stock_level ?? 2
      if (prod.quantity === 0) {
        const key = `notif_stock_${prod.id}_zero`
        if (!existingKeys.has(key)) {
          existingKeys.add(key)
          this.notifications.unshift({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: `Out of Stock: ${prod.name}`,
            message: `${prod.name} has 0 ${prod.unit} left. Depleted from inventory.`,
            type: 'OUT_OF_STOCK',
            severity: 'danger',
            product_id: prod.id,
            product_name: prod.name,
            created_at: new Date().toISOString(),
            is_read: false,
            deterministic_key: key,
          })
          changed = true
        }
      } else if (prod.quantity <= threshold) {
        const key = `notif_stock_${prod.id}_low_${prod.quantity}`
        if (!existingKeys.has(key)) {
          existingKeys.add(key)
          this.notifications.unshift({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: `Low Stock: ${prod.name}`,
            message: `${prod.name} is down to ${prod.quantity} ${prod.unit} (threshold: ${threshold}).`,
            type: 'LOW_STOCK',
            severity: 'warning',
            product_id: prod.id,
            product_name: prod.name,
            created_at: new Date().toISOString(),
            is_read: false,
            deterministic_key: key,
          })
          changed = true
        }
      }
    }

    if (changed) {
      this.persist(STORAGE_KEY_NOTIFICATIONS, this.notifications)
    }
  }

  // --- Settings ---
  public getDevSettings(): Record<string, unknown> {
    this.init()
    return { ...this.settings }
  }

  public updateDevSettings(data: Record<string, unknown>): Record<string, unknown> {
    this.init()
    this.settings = { ...this.settings, ...data }
    this.persist(STORAGE_KEY_SETTINGS, this.settings)
    return { ...this.settings }
  }
}

export const devStore = new DevStore()
