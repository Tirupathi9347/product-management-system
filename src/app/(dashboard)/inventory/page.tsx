'use client'

import * as React from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { ProductService, InventoryService, getCategories } from '@/lib/services'
import { ConsumeModal } from '@/features/consumption'
import { RecordPurchaseModal } from '@/features/purchases'
import { ProductWithMeta, Category, StockStatus } from '@/types'
import { formatCurrency } from '@/lib/utils/formatters'
import {
  Layers,
  Search,
  Plus,
  Minus,
  Sliders,
  Utensils,
  ShoppingCart,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Package,
} from 'lucide-react'
import Link from 'next/link'

export default function InventoryPage() {
  const { success, error } = useToast()

  // Data states
  const [products, setProducts] = React.useState<ProductWithMeta[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Filter states
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<'ALL' | StockStatus>('ALL')

  // Modals
  const [consumeProduct, setConsumeProduct] = React.useState<ProductWithMeta | null>(null)
  const [purchaseProduct, setPurchaseProduct] = React.useState<ProductWithMeta | null>(null)
  const [adjustProduct, setAdjustProduct] = React.useState<ProductWithMeta | null>(null)
  const [adjustDelta, setAdjustDelta] = React.useState<number>(0)
  const [isAdjusting, setIsAdjusting] = React.useState(false)

  // Load data
  React.useEffect(() => {
    let isMounted = true
    Promise.all([
      getCategories(),
      ProductService.getProducts({ isArchived: false }),
    ])
      .then(([cats, prods]) => {
        if (isMounted) {
          setCategories(cats)
          setProducts(prods)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error loading inventory:', err)
          error('Failed to load inventory', 'Could not retrieve inventory levels.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [error])

  const refreshInventory = React.useCallback(async () => {
    try {
      const [cats, prods] = await Promise.all([
        getCategories(),
        ProductService.getProducts({ isArchived: false }),
      ])
      setCategories(cats)
      setProducts(prods)
    } catch (err) {
      console.error('Error refreshing inventory:', err)
    }
  }, [])

  // Centralized calculations
  const summary = React.useMemo(() => {
    return InventoryService.calculateSummary(products)
  }, [products])

  // Filtered products list
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matches =
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.storage_location && p.storage_location.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(q))
        if (!matches) return false
      }

      // Category filter
      if (selectedCategory && p.category_id !== selectedCategory) {
        return false
      }

      // Stock status tab
      if (activeTab !== 'ALL') {
        const status = InventoryService.calculateStockStatus(p.quantity, p.minimum_stock_level)
        if (status !== activeTab) return false
      }

      return true
    })
  }, [products, searchQuery, selectedCategory, activeTab])

  // Handlers
  const handleQuickAdjust = async (product: ProductWithMeta, delta: number) => {
    try {
      const updated = await InventoryService.adjustQuantity(product.id, delta)
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      success('Stock Updated', `${updated.name} quantity is now ${updated.quantity} ${updated.unit}.`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Adjustment failed'
      error('Adjustment Error', message)
    }
  }

  const handleCustomAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustProduct || adjustDelta === 0) return
    setIsAdjusting(true)
    try {
      const updated = await InventoryService.adjustQuantity(adjustProduct.id, adjustDelta)
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setAdjustProduct(null)
      setAdjustDelta(0)
      success('Quantity Adjusted', `${updated.name} stock adjusted to ${updated.quantity} ${updated.unit}.`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Adjustment failed'
      error('Adjustment Error', message)
    } finally {
      setIsAdjusting(false)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Inventory Management"
        description="Monitor current stock levels, storage locations, low stock alerts, and adjust quantities."
        action={
          <div className="flex items-center gap-2">
            <Link href="/products/new">
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Add Product
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cataloged Items
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {summary.totalItems} <span className="text-xs font-normal text-slate-400">SKUs</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Units
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {summary.totalQuantity} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Inventory Value
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(summary.totalValue)}
          </div>
        </Card>

        <Card
          onClick={() => setActiveTab('LOW_STOCK')}
          className={`p-4 flex flex-col justify-between cursor-pointer transition-all ${
            activeTab === 'LOW_STOCK'
              ? 'ring-2 ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20'
              : 'hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
            <span className="font-semibold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {summary.lowStockItems}
          </div>
        </Card>

        <Card
          onClick={() => setActiveTab('OUT_OF_STOCK')}
          className={`p-4 flex flex-col justify-between cursor-pointer transition-all ${
            activeTab === 'OUT_OF_STOCK'
              ? 'ring-2 ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
              : 'hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
            <span className="font-semibold uppercase tracking-wider">Out of Stock</span>
            <XCircle className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {summary.outOfStockItems}
          </div>
        </Card>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            All Stock ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('IN_STOCK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeTab === 'IN_STOCK'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            In Stock ({summary.inStockItems})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LOW_STOCK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeTab === 'LOW_STOCK'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            Low Stock ({summary.lowStockItems})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('OUT_OF_STOCK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeTab === 'OUT_OF_STOCK'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <XCircle className="h-3 w-3" />
            Out of Stock ({summary.outOfStockItems})
          </button>
        </div>

        {/* Search & Category */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Input
              placeholder="Filter by name, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-3.5 w-3.5 text-slate-400" />}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="w-40">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      {isLoading ? (
        <div className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl w-full" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Layers}
            title="No Items Found"
            description="No inventory items match the current stock filter or search parameters."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery('')
              setSelectedCategory('')
              setActiveTab('ALL')
            }}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Identity</TableHead>
                <TableHead>Storage Location</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Quick Balance Adjustment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => {
                const isOutOfStock = p.quantity <= 0
                return (
                  <TableRow key={p.id}>
                    {/* Identity */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/products/${p.id}`}
                            className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors"
                          >
                            {p.name}
                          </Link>
                          <div className="text-xs text-slate-400">
                            {p.brand || 'Unbranded'} • {p.category?.name || 'Uncategorized'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Location */}
                    <TableCell>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {p.storage_location || 'Not Assigned'}
                      </span>
                    </TableCell>

                    {/* Threshold */}
                    <TableCell>
                      <span className="text-xs text-slate-500">
                        {p.minimum_stock_level} {p.unit}
                      </span>
                    </TableCell>

                    {/* Stock status badge & count */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          type="stock"
                          quantity={p.quantity}
                          threshold={p.minimum_stock_level}
                        />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {p.quantity} {p.unit}
                        </span>
                      </div>
                    </TableCell>

                    {/* Inline Quick adjustments */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={isOutOfStock}
                          title="Decrease 1 unit"
                          onClick={() => handleQuickAdjust(p, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Increase 1 unit"
                          onClick={() => handleQuickAdjust(p, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-500"
                          title="Custom adjustment"
                          onClick={() => {
                            setAdjustProduct(p)
                            setAdjustDelta(0)
                          }}
                        >
                          <Sliders className="h-3 w-3 mr-1" /> Custom
                        </Button>
                      </div>
                    </TableCell>

                    {/* Action buttons */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-indigo-600 dark:text-indigo-400"
                          title="Record Purchase / Restock"
                          onClick={() => setPurchaseProduct(p)}
                        >
                          <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Restock
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-emerald-600 dark:text-emerald-400"
                          title="Consume Units"
                          disabled={isOutOfStock}
                          onClick={() => setConsumeProduct(p)}
                        >
                          <Utensils className="h-3.5 w-3.5 mr-1" /> Consume
                        </Button>
                        <Link href={`/products/${p.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Quick Consume Modal */}
      <ConsumeModal
        isOpen={Boolean(consumeProduct)}
        onClose={() => setConsumeProduct(null)}
        product={consumeProduct}
        onSuccess={() => {
          setConsumeProduct(null)
          refreshInventory()
        }}
      />

      {/* Quick Record Purchase Modal */}
      <RecordPurchaseModal
        isOpen={Boolean(purchaseProduct)}
        onClose={() => setPurchaseProduct(null)}
        product={purchaseProduct}
        onSuccess={() => {
          setPurchaseProduct(null)
          refreshInventory()
        }}
      />

      {/* Adjust Quantity Modal */}
      <Modal
        isOpen={Boolean(adjustProduct)}
        onClose={() => setAdjustProduct(null)}
        title="Adjust Inventory Quantity"
        size="sm"
      >
        {adjustProduct && (
          <form onSubmit={handleCustomAdjustSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              Enter quantity delta for{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {adjustProduct.name}
              </span>
              . Current stock: {adjustProduct.quantity} {adjustProduct.unit}.
            </p>

            <Input
              label="Adjustment Delta"
              type="number"
              step="any"
              placeholder="+5 or -2"
              value={adjustDelta || ''}
              onChange={(e) => setAdjustDelta(parseFloat(e.target.value) || 0)}
            />

            <div className="text-xs text-slate-400">
              Projected stock after adjustment:{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {Math.max(0, adjustProduct.quantity + adjustDelta)} {adjustProduct.unit}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustProduct(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={isAdjusting}
                disabled={adjustDelta === 0}
              >
                Save Adjustment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
