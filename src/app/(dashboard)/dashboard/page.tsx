'use client'

import * as React from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import {
  KpiCardsSection,
  QuickActionsSection,
  CategoryDistributionChart,
  ExpiryOverviewSection,
  RecentActivitySection,
} from '@/features/dashboard'
import type { CategoryDataPoint } from '@/features/dashboard/CategoryDistributionChart'
import { Plus, RefreshCw, ScanLine, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/features/auth/AuthContext'
import {
  ProductService,
  InventoryService,
  ActivityService,
  ExpiryService,
  getCategories,
} from '@/lib/services'
import { AIScannerModal } from '@/features/scanner'
import { ProductWithMeta, ActivityLog, Category } from '@/types'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { success } = useToast()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [aiScannerOpen, setAiScannerOpen] = React.useState(false)

  // Real data states
  const [products, setProducts] = React.useState<ProductWithMeta[]>([])
  const [activities, setActivities] = React.useState<ActivityLog[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])

  React.useEffect(() => {
    let isMounted = true
    Promise.all([
      ProductService.getProducts({ isArchived: false }),
      ActivityService.getActivities(10),
      getCategories(),
    ])
      .then(([prods, acts, cats]) => {
        if (isMounted) {
          setProducts(prods)
          setActivities(acts)
          setCategories(cats)
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard metrics:', err)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const [prods, acts, cats] = await Promise.all([
        ProductService.getProducts({ isArchived: false }),
        ActivityService.getActivities(10),
        getCategories(),
      ])
      setProducts(prods)
      setActivities(acts)
      setCategories(cats)
      success('Ledger Synchronized', 'Latest inventory counts and audit trails loaded.')
    } catch (err) {
      console.error('Failed to refresh dashboard metrics:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculate live KPI summary & intelligent health counts
  const { kpiSummary, attentionCount, expiredCount, urgentCount, lowStockCount } = React.useMemo(() => {
    const invSummary = InventoryService.calculateSummary(products)
    let expiringSoon = 0
    let urgent = 0
    let expired = 0

    products.forEach((p) => {
      const status = ExpiryService.calculateExpiryStatus(p.expiry_date)
      if (status === 'EXPIRING_SOON') expiringSoon++
      else if (status === 'URGENT') urgent++
      else if (status === 'EXPIRED') expired++
    })

    const lowStock = invSummary.lowStockItems + invSummary.outOfStockItems
    const attention = lowStock + expired + urgent

    return {
      kpiSummary: {
        totalProducts: invSummary.totalItems,
        lowStockCount: invSummary.lowStockItems,
        expiringSoonCount: expiringSoon + urgent,
        totalValuation: invSummary.totalValue,
      },
      attentionCount: attention,
      expiredCount: expired,
      urgentCount: urgent,
      lowStockCount: lowStock,
    }
  }, [products])

  // Category distribution data points
  const categoryChartData: CategoryDataPoint[] = React.useMemo(() => {
    if (categories.length === 0 || products.length === 0) return []

    const map = new Map<string, number>()
    products.forEach((p) => {
      const catId = p.category_id || 'other'
      map.set(catId, (map.get(catId) || 0) + 1)
    })

    const colors = ['#10B981', '#3B82F6', '#EF4444', '#EC4899', '#F59E0B', '#8B5CF6', '#64748B']
    return categories
      .map((cat, idx) => ({
        name: cat.name,
        value: map.get(cat.id) || 0,
        color: cat.color || colors[idx % colors.length],
      }))
      .filter((item) => item.value > 0)
  }, [categories, products])

  const welcomeName = profile?.display_name || user?.email?.split('@')[0] || 'User'

  // Generate dynamic smart summary text from real data
  const smartSummaryText = React.useMemo(() => {
    if (products.length === 0) {
      return 'Your catalog is empty. Add your first product to activate inventory intelligence.'
    }
    const parts: string[] = []
    if (expiredCount > 0) {
      parts.push(`${expiredCount} product${expiredCount === 1 ? ' has' : 's have'} expired`)
    }
    if (urgentCount > 0) {
      parts.push(`${urgentCount} item${urgentCount === 1 ? ' requires' : 's require'} urgent consumption (<3 days)`)
    }
    if (lowStockCount > 0) {
      parts.push(`${lowStockCount} item${lowStockCount === 1 ? ' is' : 's are'} below minimum threshold`)
    }
    if (parts.length === 0) {
      return 'All inventory levels are healthy with zero critical expiration alerts this week.'
    }
    return parts.join(', and ') + '.'
  }, [products.length, expiredCount, urgentCount, lowStockCount])

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={`Welcome back, ${welcomeName}`}
        description="Overview of your product catalog, current stock levels, and upcoming expirations."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ScanLine className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
              onClick={() => setAiScannerOpen(true)}
            >
              Scan Package
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Link href="/products/new">
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Add Product
              </Button>
            </Link>
          </div>
        }
      />

      {/* Dynamic Inventory Status Banner */}
      <div
        className={`p-3.5 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          attentionCount > 0
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-md ${
              attentionCount > 0
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <AlertCircle className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider">
              {attentionCount > 0 ? 'Action Required' : 'Inventory Healthy'}
            </h4>
            <p className="text-xs mt-0.5 leading-relaxed">{smartSummaryText}</p>
          </div>
        </div>

        {attentionCount > 0 && (
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
          >
            <span>Review Alerts</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* KPI Metrics Summary */}
      <KpiCardsSection summary={kpiSummary} />

      {/* Quick Tactical Operations */}
      <QuickActionsSection />

      {/* Analytics & Expiry Horizon Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryDistributionChart data={categoryChartData} />
        <ExpiryOverviewSection products={products} />
      </div>

      {/* Recent Activity Audit Ledger */}
      <RecentActivitySection logs={activities} />



      {/* AI Vision Scanner Modal */}
      <AIScannerModal
        isOpen={aiScannerOpen}
        onClose={() => setAiScannerOpen(false)}
        onApplyExtraction={(result) => {
          setAiScannerOpen(false)
          const query = new URLSearchParams()
          if (result.product_name) query.set('name', result.product_name)
          if (result.brand) query.set('brand', result.brand)
          if (result.category) query.set('category', result.category)
          if (result.barcode) query.set('barcode', result.barcode)
          if (result.mrp) query.set('mrp', String(result.mrp))
          if (result.purchase_price) query.set('purchase_price', String(result.purchase_price))
          if (result.expiry_date) query.set('expiry_date', result.expiry_date)
          if (result.manufacturing_date) query.set('manufacturing_date', result.manufacturing_date)
          if (result.batch_number) query.set('batch_number', result.batch_number)
          if (result.weight) query.set('weight', result.weight)
          if (result.unit) query.set('unit', result.unit)
          if (result.description) query.set('description', result.description)
          router.push(`/products/new?${query.toString()}`)
        }}
        onSaveDirectly={async (result, file) => {
          if (!result.product_name?.trim()) {
            return
          }
          const finalUserId = user?.id || '00000000-0000-0000-0000-000000000001'
          let categoryId: string | null = null
          if (result.category) {
            const match = categories.find((c) =>
              c.name.toLowerCase().includes(result.category?.toLowerCase() || '')
            )
            if (match) categoryId = match.id
          }
          await ProductService.createProduct({
            user_id: finalUserId,
            name: result.product_name.trim(),
            brand: result.brand || null,
            category_id: categoryId,
            barcode: result.barcode || null,
            image_url: file ? URL.createObjectURL(file) : null,
            description: result.description || null,
            quantity: 1,
            unit: result.unit || 'pcs',
            mrp: result.mrp ? Number(result.mrp) : null,
            purchase_price: result.purchase_price ? Number(result.purchase_price) : null,
            weight: result.weight || null,
            manufacturing_date: result.manufacturing_date || null,
            expiry_date: result.expiry_date || null,
            purchase_date: new Date().toISOString().split('T')[0],
            batch_number: result.batch_number || null,
            storage_location: null,
            minimum_stock_level: 1,
            tags: [],
            notes: null,
            is_archived: false,
          })
          setAiScannerOpen(false)
          success('Product Created', `"${result.product_name}" was successfully added to your catalog.`)
          await handleRefresh()
        }}
      />
    </div>
  )
}
