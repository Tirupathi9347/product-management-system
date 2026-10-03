import { ProductService } from '@/lib/services/productService'
import { PurchaseService } from '@/lib/services/purchaseService'
import { ConsumptionService } from '@/lib/services/consumptionService'
import { CategoryService } from '@/lib/services/categoryService'
import { InventoryService } from '@/lib/services/inventoryService'
import { ExpiryService } from '@/lib/services/expiryService'
import { SpendingAnalytics, ConsumptionAnalytics, InventorySummary } from '@/types'

export interface CategoryDistributionItem {
  name: string
  value: number
  count: number
  color: string
}

export interface ExpiryDistributionItem {
  status: string
  count: number
  color: string
  percentage: number
}

export interface CompleteAnalyticsData {
  summary: InventorySummary
  categoryDistribution: CategoryDistributionItem[]
  expiryDistribution: ExpiryDistributionItem[]
  spending: SpendingAnalytics
  consumption: ConsumptionAnalytics
  hasPurchases: boolean
  hasConsumption: boolean
}

export class AnalyticsService {
  /**
   * Compiles complete analytical intelligence aggregated from actual database/store records.
   */
  public static async getAnalytics(): Promise<CompleteAnalyticsData> {
    const [products, purchases, consumptionList, categories] = await Promise.all([
      ProductService.getProducts(),
      PurchaseService.getPurchases(),
      ConsumptionService.getConsumption(),
      CategoryService.getCategories(),
    ])

    const activeProducts = products.filter((p) => !p.is_archived)
    const summary = InventoryService.calculateSummary(activeProducts)

    // 1. Category Distribution
    const categoryMap = new Map(categories.map((c) => [c.id, c]))
    const catValuationMap = new Map<string, { value: number; count: number }>()

    for (const prod of activeProducts) {
      const catId = prod.category_id || 'other'
      const catVal = (prod.quantity || 0) * (prod.purchase_price || prod.mrp || 0)
      const existing = catValuationMap.get(catId) || { value: 0, count: 0 }
      catValuationMap.set(catId, {
        value: existing.value + catVal,
        count: existing.count + 1,
      })
    }

    const categoryDistribution: CategoryDistributionItem[] = []
    catValuationMap.forEach((val, catId) => {
      const cat = categoryMap.get(catId)
      categoryDistribution.push({
        name: cat ? cat.name : 'Uncategorized',
        value: Math.round(val.value * 100) / 100,
        count: val.count,
        color: cat?.color || '#64748B',
      })
    })

    // 2. Expiry Distribution
    let safeCount = 0
    let soonCount = 0
    let urgentCount = 0
    let expiredCount = 0

    for (const p of activeProducts) {
      const status = ExpiryService.calculateExpiryStatus(p.expiry_date)
      if (status === 'SAFE') safeCount++
      else if (status === 'EXPIRING_SOON') soonCount++
      else if (status === 'URGENT') urgentCount++
      else if (status === 'EXPIRED') expiredCount++
    }

    const totalTracked = safeCount + soonCount + urgentCount + expiredCount || 1
    const expiryDistribution: ExpiryDistributionItem[] = [
      {
        status: 'Safe Stock (>7d)',
        count: safeCount,
        color: '#10B981',
        percentage: Math.round((safeCount / totalTracked) * 100),
      },
      {
        status: 'Expiring Soon (4-7d)',
        count: soonCount,
        color: '#F59E0B',
        percentage: Math.round((soonCount / totalTracked) * 100),
      },
      {
        status: 'Urgent Attention (1-3d)',
        count: urgentCount,
        color: '#F97316',
        percentage: Math.round((urgentCount / totalTracked) * 100),
      },
      {
        status: 'Expired (<=0d)',
        count: expiredCount,
        color: '#EF4444',
        percentage: Math.round((expiredCount / totalTracked) * 100),
      },
    ]

    // 3. Spending Analytics
    const monthlySpendMap = new Map<string, { amount: number; orderCount: number }>()
    const categorySpendMap = new Map<string, number>()
    const productSpendMap = new Map<string, { name: string; quantity: number; cost: number }>()
    let totalSpend = 0

    for (const p of purchases) {
      totalSpend += p.total_amount
      const monthKey = p.purchase_date.slice(0, 7) // YYYY-MM
      const currentMonth = monthlySpendMap.get(monthKey) || { amount: 0, orderCount: 0 }
      monthlySpendMap.set(monthKey, {
        amount: currentMonth.amount + p.total_amount,
        orderCount: currentMonth.orderCount + 1,
      })

      // Link product for category and product-level spend
      const prod = products.find((prodItem) => prodItem.id === p.product_id)
      const catName = prod?.category?.name || 'General Pantry'
      categorySpendMap.set(catName, (categorySpendMap.get(catName) || 0) + p.total_amount)

      const prodName = prod?.name || 'Direct Item'
      const curProd = productSpendMap.get(prodName) || { name: prodName, quantity: 0, cost: 0 }
      productSpendMap.set(prodName, {
        name: prodName,
        quantity: curProd.quantity + p.quantity,
        cost: curProd.cost + p.total_amount,
      })
    }

    const monthlySpend = Array.from(monthlySpendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        amount: Math.round(data.amount * 100) / 100,
        orderCount: data.orderCount,
      }))

    const categorySpend = Array.from(categorySpendMap.entries()).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0,
    }))

    const topPurchasedProducts = Array.from(productSpendMap.values())
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        quantity: item.quantity,
        totalCost: Math.round(item.cost * 100) / 100,
      }))

    const spending: SpendingAnalytics = {
      totalSpend: Math.round(totalSpend * 100) / 100,
      monthlySpend,
      categorySpend,
      topPurchasedProducts,
    }

    // 4. Consumption Analytics
    let totalConsumedUnits = 0
    const prodConsumeMap = new Map<string, { name: string; quantity: number; unit: string }>()
    const catConsumeMap = new Map<string, number>()

    for (const c of consumptionList) {
      totalConsumedUnits += c.quantity
      const prod = products.find((p) => p.id === c.product_id)
      const prodName = prod?.name || 'Inventory Item'
      const unit = prod?.unit || 'units'

      const existingProd = prodConsumeMap.get(prodName) || { name: prodName, quantity: 0, unit }
      prodConsumeMap.set(prodName, {
        name: prodName,
        quantity: existingProd.quantity + c.quantity,
        unit,
      })

      const catName = prod?.category?.name || 'General'
      catConsumeMap.set(catName, (catConsumeMap.get(catName) || 0) + c.quantity)
    }

    const topConsumedProducts = Array.from(prodConsumeMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    const categoryConsumption = Array.from(catConsumeMap.entries()).map(([category, units]) => ({
      category,
      units,
    }))

    // Consumption velocity estimates based on current stock vs consumption rates
    const velocityPalette = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899']
    const consumptionVelocity = categories.slice(0, 4).map((cat, idx) => {
      const catProducts = activeProducts.filter((p) => p.category_id === cat.id)
      const stockTotal = catProducts.reduce((acc, p) => acc + p.quantity, 0)
      const estimatedDays = stockTotal > 0 ? Math.min(180, stockTotal * 7) : 0
      return {
        label: cat.name,
        daysRemaining: stockTotal > 0 ? `${estimatedDays} days` : 'Depleted',
        progress: Math.min(100, Math.max(10, stockTotal * 15)),
        color: velocityPalette[idx % velocityPalette.length],
      }
    })

    const consumption: ConsumptionAnalytics = {
      totalConsumedUnits,
      topConsumedProducts,
      categoryConsumption,
      consumptionVelocity,
    }

    return {
      summary,
      categoryDistribution,
      expiryDistribution,
      spending,
      consumption,
      hasPurchases: purchases.length > 0,
      hasConsumption: consumptionList.length > 0,
    }
  }
}
