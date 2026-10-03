import { StockStatus, ProductWithMeta, InventorySummary } from '@/types'
import { getSupabaseConfig } from '@/lib/supabase/config'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { devStore } from '@/lib/dev/devStore'
import { ExpiryService } from './expiryService'

export class InventoryService {
  /**
   * Evaluates stock status:
   * Qty <= 0 -> OUT_OF_STOCK
   * Qty <= threshold -> LOW_STOCK
   * Qty > threshold -> IN_STOCK
   */
  public static calculateStockStatus(quantity: number, threshold = 1): StockStatus {
    if (quantity <= 0) return 'OUT_OF_STOCK'
    if (quantity <= threshold) return 'LOW_STOCK'
    return 'IN_STOCK'
  }

  /**
   * Calculates total valuation for a set of products.
   * Uses purchase_price or mrp.
   */
  public static calculateInventoryValue(products: ProductWithMeta[]): number {
    return products.reduce((acc, p) => {
      const price = p.purchase_price ?? p.mrp ?? 0
      return acc + price * p.quantity
    }, 0)
  }

  /**
   * Generates comprehensive inventory summary KPI metrics.
   */
  public static calculateSummary(products: ProductWithMeta[]): InventorySummary {
    let totalQty = 0
    let valuation = 0
    let inStock = 0
    let lowStock = 0
    let outOfStock = 0
    let expiringSoon = 0
    let urgentExpiry = 0
    let expired = 0

    for (const p of products) {
      if (p.is_archived) continue

      totalQty += p.quantity
      const price = p.purchase_price ?? p.mrp ?? 0
      valuation += price * p.quantity

      const stockStatus = this.calculateStockStatus(p.quantity, p.minimum_stock_level)
      if (stockStatus === 'OUT_OF_STOCK') outOfStock++
      else if (stockStatus === 'LOW_STOCK') lowStock++
      else inStock++

      const expStatus = ExpiryService.calculateExpiryStatus(p.expiry_date)
      if (expStatus === 'EXPIRED') expired++
      else if (expStatus === 'URGENT') urgentExpiry++
      else if (expStatus === 'EXPIRING_SOON') expiringSoon++
    }

    const activeCount = products.filter((p) => !p.is_archived).length
    const roundedValuation = Math.round(valuation * 100) / 100

    return {
      totalProducts: activeCount,
      totalItems: activeCount,
      totalQuantity: totalQty,
      totalValuation: roundedValuation,
      totalValue: roundedValuation,
      inStockCount: inStock,
      inStockItems: inStock,
      lowStockCount: lowStock,
      lowStockItems: lowStock,
      outOfStockCount: outOfStock,
      outOfStockItems: outOfStock,
      expiringSoonCount: expiringSoon,
      urgentExpiryCount: urgentExpiry,
      expiredCount: expired,
    }
  }

  /**
   * Adjusts product quantity by a delta (+ or -), preventing negative inventory.
   */
  public static async adjustQuantity(id: string, delta: number): Promise<ProductWithMeta> {
    const { isConfigured } = getSupabaseConfig()

    if (!isConfigured) {
      return devStore.adjustQuantity(id, delta)
    }

    const supabase = getSupabaseBrowserClient()
    const { data: current, error: fetchErr } = await supabase
      .from('products')
      .select('quantity, user_id, name, unit')
      .eq('id', id)
      .single()

    if (fetchErr || !current) throw new Error(fetchErr?.message || 'Product not found')

    const newQty = Math.max(0, current.quantity + delta)

    const { data: updated, error: updateErr } = await supabase
      .from('products')
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, category:categories(*)')
      .single()

    if (updateErr) throw new Error(updateErr.message)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: current.user_id,
      product_id: id,
      action: delta >= 0 ? 'update' : 'consume',
      description: `${delta >= 0 ? 'Increased' : 'Decreased'} quantity of "${current.name}" by ${Math.abs(delta)} (New: ${newQty} ${current.unit})`,
    })

    return updated as unknown as ProductWithMeta
  }
}
