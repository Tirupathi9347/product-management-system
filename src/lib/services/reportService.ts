import { ProductService } from '@/lib/services/productService'
import { PurchaseService } from '@/lib/services/purchaseService'
import { ConsumptionService } from '@/lib/services/consumptionService'
import { ExpiryService } from '@/lib/services/expiryService'
import { ReportFilterOptions } from '@/types'

export interface ReportItem {
  id: string
  col1: string // Title / Item Name
  col2: string // Category / Brand / Store / User
  col3: string // Stock / Price / Expiry / Quantity
  col4: string // Valuation / Total / Status / Date
  col5?: string // Extra detail / note
  raw?: Record<string, unknown>
}

export interface GeneratedReport {
  title: string
  subtitle: string
  generatedAt: string
  totalRecords: number
  summaryMetrics: { label: string; value: string }[]
  headers: string[]
  items: ReportItem[]
}

export class ReportService {
  /**
   * Generates formatted report records based on filter criteria
   */
  public static async generateReport(options: ReportFilterOptions): Promise<GeneratedReport> {
    const nowStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

    switch (options.type) {
      case 'inventory': {
        const products = await ProductService.getProducts({
          categoryId: options.categoryId,
          stockStatus: options.stockStatus === 'ALL' ? undefined : options.stockStatus,
        })
        const active = products.filter((p) => !p.is_archived)
        const totalUnits = active.reduce((acc, p) => acc + p.quantity, 0)
        const totalValue = active.reduce(
          (acc, p) => acc + p.quantity * (p.purchase_price || p.mrp || 0),
          0
        )

        return {
          title: 'Inventory Valuation & Asset Ledger',
          subtitle: 'Active stock levels, unit quantities, and portfolio asset capital',
          generatedAt: nowStr,
          totalRecords: active.length,
          summaryMetrics: [
            { label: 'Total Catalog Products', value: String(active.length) },
            { label: 'Total In-Stock Units', value: String(totalUnits) },
            {
              label: 'Total Asset Value',
              value: `₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
            },
          ],
          headers: ['Product Name', 'Category', 'Stock Qty', 'Unit Price', 'Total Valuation', 'Storage'],
          items: active.map((p) => {
            const unitPrice = p.purchase_price || p.mrp || 0
            const val = p.quantity * unitPrice
            return {
              id: p.id,
              col1: p.name,
              col2: p.category?.name || 'General',
              col3: `${p.quantity} ${p.unit}`,
              col4: `₹${unitPrice.toFixed(2)}`,
              col5: `₹${val.toFixed(2)}`,
              raw: {
                name: p.name,
                category: p.category?.name || 'General',
                quantity: p.quantity,
                unit: p.unit,
                unitPrice,
                totalValuation: val,
                location: p.storage_location || 'N/A',
              },
            }
          }),
        }
      }

      case 'expiry': {
        const products = await ProductService.getProducts()
        const active = products.filter((p) => !p.is_archived && p.expiry_date)
        let filtered = active

        if (options.expiryStatus && options.expiryStatus !== 'ALL') {
          filtered = active.filter(
            (p) => ExpiryService.calculateExpiryStatus(p.expiry_date) === options.expiryStatus
          )
        }

        const expiredCount = filtered.filter(
          (p) => ExpiryService.calculateExpiryStatus(p.expiry_date) === 'EXPIRED'
        ).length
        const urgentCount = filtered.filter(
          (p) => ExpiryService.calculateExpiryStatus(p.expiry_date) === 'URGENT'
        ).length

        return {
          title: 'Perishable Expiry & Risk Audit',
          subtitle: 'Timeline countdowns, risk categorization, and itemized expiration schedule',
          generatedAt: nowStr,
          totalRecords: filtered.length,
          summaryMetrics: [
            { label: 'Tracked Perishables', value: String(filtered.length) },
            { label: 'Expired Items', value: String(expiredCount) },
            { label: 'Urgent (<3 Days)', value: String(urgentCount) },
          ],
          headers: ['Product Name', 'Brand', 'Expiry Date', 'Status', 'Days Remaining', 'Batch #'],
          items: filtered.map((p) => {
            const status = ExpiryService.calculateExpiryStatus(p.expiry_date)
            const days = ExpiryService.calculateDaysRemaining(p.expiry_date)
            const label = ExpiryService.getExpiryLabel(p.expiry_date)
            return {
              id: p.id,
              col1: p.name,
              col2: p.brand || 'N/A',
              col3: p.expiry_date || 'N/A',
              col4: status,
              col5: `${label} (${days ?? 0}d)`,
              raw: {
                name: p.name,
                brand: p.brand || '',
                expiry_date: p.expiry_date,
                status,
                daysRemaining: days,
                batch: p.batch_number || '',
              },
            }
          }),
        }
      }

      case 'purchases': {
        const [purchases, products] = await Promise.all([
          PurchaseService.getPurchases(),
          ProductService.getProducts(),
        ])
        const prodMap = new Map(products.map((pr) => [pr.id, pr]))
        let filtered = purchases

        if (options.dateFrom) {
          filtered = filtered.filter((p) => p.purchase_date >= options.dateFrom!)
        }
        if (options.dateTo) {
          filtered = filtered.filter((p) => p.purchase_date <= options.dateTo!)
        }

        const totalSpent = filtered.reduce((acc, p) => acc + p.total_amount, 0)
        const totalPurchasedUnits = filtered.reduce((acc, p) => acc + p.quantity, 0)

        return {
          title: 'Procurement & Purchase Order History',
          subtitle: 'Expenditure audit, vendor purchases, and restocking receipts',
          generatedAt: nowStr,
          totalRecords: filtered.length,
          summaryMetrics: [
            { label: 'Total Orders', value: String(filtered.length) },
            { label: 'Total Restocked Units', value: String(totalPurchasedUnits) },
            {
              label: 'Total Capital Outflow',
              value: `₹${totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
            },
          ],
          headers: ['Date', 'Product', 'Quantity', 'Unit Price', 'Total Spend', 'Vendor/Store'],
          items: filtered.map((p) => {
            const prod = p.product_id ? prodMap.get(p.product_id) : undefined
            const prodName = prod?.name || 'Inventory Item'
            return {
              id: p.id,
              col1: p.purchase_date,
              col2: prodName,
              col3: `${p.quantity} units`,
              col4: `₹${p.purchase_price.toFixed(2)}`,
              col5: `₹${p.total_amount.toFixed(2)} (${p.store_name || 'Vendor'})`,
              raw: {
                date: p.purchase_date,
                product: prodName,
                quantity: p.quantity,
                unitPrice: p.purchase_price,
                totalAmount: p.total_amount,
                store: p.store_name || '',
              },
            }
          }),
        }
      }

      case 'consumption': {
        const [consumption, products] = await Promise.all([
          ConsumptionService.getConsumption(),
          ProductService.getProducts(),
        ])
        const prodMap = new Map(products.map((pr) => [pr.id, pr]))
        let filtered = consumption

        if (options.dateFrom) {
          filtered = filtered.filter((c) => c.consumed_at.slice(0, 10) >= options.dateFrom!)
        }
        if (options.dateTo) {
          filtered = filtered.filter((c) => c.consumed_at.slice(0, 10) <= options.dateTo!)
        }

        const totalDepleted = filtered.reduce((acc, c) => acc + c.quantity, 0)

        return {
          title: 'Consumption & Usage Depletion Log',
          subtitle: 'Historical item depletions, consumption events, and burn velocity',
          generatedAt: nowStr,
          totalRecords: filtered.length,
          summaryMetrics: [
            { label: 'Depletion Events', value: String(filtered.length) },
            { label: 'Total Depleted Units', value: String(totalDepleted) },
          ],
          headers: ['Date', 'Product', 'Quantity Consumed', 'Note / Reason'],
          items: filtered.map((c) => {
            const prod = c.product_id ? prodMap.get(c.product_id) : undefined
            const prodName = prod?.name || 'Item'
            return {
              id: c.id,
              col1: c.consumed_at.slice(0, 10),
              col2: prodName,
              col3: `${c.quantity} units`,
              col4: c.note || 'Regular usage',
              raw: {
                date: c.consumed_at.slice(0, 10),
                product: prodName,
                quantity: c.quantity,
                note: c.note || '',
              },
            }
          }),
        }
      }
    }
  }

  /**
   * Generates and triggers browser download of RFC-4180 compliant CSV file
   */
  public static exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
    const escape = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""'
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return `"${str}"`
    }

    const csvContent = [
      headers.map(escape).join(','),
      ...rows.map((row) => row.map(escape).join(',')),
    ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
