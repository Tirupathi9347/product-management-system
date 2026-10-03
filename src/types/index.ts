import { User as SupabaseUser } from '@supabase/supabase-js'
import { Profile, UserSettings, Product, Category } from './database'

export * from './database'

export interface AuthUser extends SupabaseUser {
  profile?: Profile | null
  settings?: UserSettings | null
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface NavItem {
  title: string
  href: string
  icon: string
  badge?: string | number
  description?: string
}

export interface KpiMetric {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  icon: string
  color: string
}

// Module 2 Domain Types
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export type ExpiryStatus = 'SAFE' | 'EXPIRING_SOON' | 'URGENT' | 'EXPIRED' | 'NO_EXPIRY'

export interface ProductWithMeta extends Product {
  category?: Category | null
  is_archived?: boolean
}

export type ProductSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'qty_asc'
  | 'qty_desc'
  | 'expiry_asc'
  | 'expiry_desc'
  | 'newest'
  | 'oldest'

export interface ProductFilterOptions {
  search?: string
  categoryId?: string
  brand?: string
  stockStatus?: StockStatus
  expiryStatus?: ExpiryStatus
  isArchived?: boolean
  minPrice?: number
  maxPrice?: number
  sortBy?: ProductSortOption
}

export interface BarcodeLookupResult {
  barcode: string
  name: string | null
  brand: string | null
  category: string | null
  mrp: number | null
  purchase_price: number | null
  weight: string | null
  unit: string | null
  description: string | null
  image_url: string | null
  found: boolean
  source?: string
}

export interface KeywordOcrMatch {
  keyword: string
  extracted_value: string
  field: 'manufacturing_date' | 'expiry_date' | 'batch_number'
  confidence: number
}

export interface AIExtractionResult {
  product_name: string | null
  brand: string | null
  category: string | null
  barcode: string | null
  mrp: number | null
  purchase_price: number | null
  weight: string | null
  unit: string | null
  manufacturing_date: string | null
  expiry_date: string | null
  batch_number: string | null
  description: string | null
  confidence?: number
  review_state?: 'HIGH_REVIEW_CONFIDENCE' | 'REVIEW_RECOMMENDED' | 'MANUAL_REVIEW'
  uncertain_fields?: string[]
  detected_keywords?: string[]
  ocr_raw_text?: string
  date_extraction_method?: string
  keyword_matches?: KeywordOcrMatch[]
  source?: string
}

export type AIReviewConfidence = 'HIGH_REVIEW_CONFIDENCE' | 'REVIEW_RECOMMENDED' | 'MANUAL_REVIEW'

export type NotificationType =
  | 'EXPIRY'
  | 'URGENT_EXPIRY'
  | 'EXPIRED'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'SYSTEM'

export type NotificationSeverity = 'info' | 'warning' | 'urgent' | 'danger'

export interface NotificationItem {
  id: string
  user_id?: string
  title: string
  message: string
  type: NotificationType
  severity: NotificationSeverity
  product_id?: string | null
  product_name?: string | null
  created_at: string
  is_read: boolean
  deterministic_key?: string
  metadata?: Record<string, unknown>
}

export interface InventorySummary {
  totalProducts: number
  totalQuantity: number
  totalValuation: number
  inStockCount: number
  lowStockCount: number
  outOfStockCount: number
  expiringSoonCount: number
  urgentExpiryCount: number
  expiredCount: number
  // Aliases for convenience
  totalItems: number
  totalValue: number
  inStockItems: number
  lowStockItems: number
  outOfStockItems: number
}

export interface SpendingAnalytics {
  totalSpend: number
  monthlySpend: { month: string; amount: number; orderCount: number }[]
  categorySpend: { category: string; amount: number; percentage: number }[]
  topPurchasedProducts: { name: string; quantity: number; totalCost: number }[]
}

export interface ConsumptionAnalytics {
  totalConsumedUnits: number
  topConsumedProducts: { name: string; quantity: number; unit: string }[]
  categoryConsumption: { category: string; units: number }[]
  consumptionVelocity: { label: string; daysRemaining: string; progress: number; color: string }[]
}

export type ReportType = 'inventory' | 'expiry' | 'purchases' | 'consumption'

export interface ReportFilterOptions {
  type: ReportType
  dateFrom?: string
  dateTo?: string
  categoryId?: string
  stockStatus?: StockStatus | 'ALL'
  expiryStatus?: ExpiryStatus | 'ALL'
}

