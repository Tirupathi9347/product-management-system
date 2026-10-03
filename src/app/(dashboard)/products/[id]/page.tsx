'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import {
  ProductService,
  InventoryService,
  PurchaseService,
  ConsumptionService,
  ActivityService,
  ExpiryService,
} from '@/lib/services'
import { ConsumeModal } from '@/features/consumption'
import { RecordPurchaseModal } from '@/features/purchases'
import { ProductWithMeta, Purchase, ConsumptionHistory, ActivityLog } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import {
  ArrowLeft,
  Edit3,
  Utensils,
  ShoppingCart,
  Archive,
  RotateCcw,
  Trash2,
  Package,
  Calendar,
  Layers,
  IndianRupee,
  Plus,
  Minus,
  Sliders,
  Activity,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { success, error } = useToast()
  const id = params?.id as string

  // State
  const [product, setProduct] = React.useState<ProductWithMeta | null>(null)
  const [purchases, setPurchases] = React.useState<Purchase[]>([])
  const [consumption, setConsumption] = React.useState<ConsumptionHistory[]>([])
  const [activities, setActivities] = React.useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Modals
  const [consumeOpen, setConsumeOpen] = React.useState(false)
  const [purchaseOpen, setPurchaseOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Quantity adjust modal
  const [adjustModalOpen, setAdjustModalOpen] = React.useState(false)
  const [adjustDelta, setAdjustDelta] = React.useState<number>(0)
  const [isAdjusting, setIsAdjusting] = React.useState(false)

  // Load data
  React.useEffect(() => {
    if (!id) return
    let isMounted = true

    ProductService.getProduct(id)
      .then(async (prod) => {
        if (!isMounted) return
        setProduct(prod)

        if (prod) {
          const [purchList, consList, actList] = await Promise.all([
            PurchaseService.getPurchases(id),
            ConsumptionService.getConsumption(id),
            ActivityService.getActivities(20, id),
          ])
          if (isMounted) {
            setPurchases(purchList)
            setConsumption(consList)
            setActivities(actList)
          }
        }
        if (isMounted) setIsLoading(false)
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error loading product details:', err)
          error('Failed to load item', 'Could not retrieve product record.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id, error])

  const refreshProductData = React.useCallback(async () => {
    if (!id) return
    try {
      const prod = await ProductService.getProduct(id)
      setProduct(prod)
      if (prod) {
        const [purchList, consList, actList] = await Promise.all([
          PurchaseService.getPurchases(id),
          ConsumptionService.getConsumption(id),
          ActivityService.getActivities(20, id),
        ])
        setPurchases(purchList)
        setConsumption(consList)
        setActivities(actList)
      }
    } catch (err) {
      console.error('Error refreshing product details:', err)
    }
  }, [id])

  // Handlers
  const handleQuickAdjust = async (delta: number) => {
    if (!product) return
    try {
      const updated = await InventoryService.adjustQuantity(product.id, delta)
      setProduct(updated)
      success(
        'Stock Updated',
        `Quantity is now ${updated.quantity} ${updated.unit}.`
      )
      refreshProductData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to adjust stock'
      error('Adjustment Error', message)
    }
  }

  const handleCustomAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || adjustDelta === 0) return
    setIsAdjusting(true)
    try {
      const updated = await InventoryService.adjustQuantity(product.id, adjustDelta)
      setProduct(updated)
      setAdjustModalOpen(false)
      setAdjustDelta(0)
      success('Quantity Adjusted', `Stock adjusted to ${updated.quantity} ${updated.unit}.`)
      refreshProductData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Adjustment failed'
      error('Adjustment Error', message)
    } finally {
      setIsAdjusting(false)
    }
  }

  const handleArchiveToggle = async () => {
    if (!product) return
    try {
      if (product.is_archived) {
        await ProductService.restoreProduct(product.id)
        success('Item Restored', `"${product.name}" is now active.`)
      } else {
        await ProductService.archiveProduct(product.id)
        success('Item Archived', `"${product.name}" was moved to archive.`)
      }
      refreshProductData()
    } catch {
      error('Operation Failed', 'Could not update archive state.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!product) return
    setIsDeleting(true)
    try {
      await ProductService.deleteProduct(product.id)
      success('Item Removed', `"${product.name}" was permanently deleted.`)
      router.push('/products')
    } catch {
      error('Delete Failed', 'Could not delete product.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <EmptyState
          icon={AlertTriangle}
          title="Product Not Found"
          description="The requested product record does not exist or has been removed from your catalog."
          actionLabel="Return to Catalog"
          onAction={() => router.push('/products')}
        />
      </div>
    )
  }

  const daysRemaining = ExpiryService.calculateDaysRemaining(product.expiry_date)
  const expiryLabel = ExpiryService.getExpiryLabel(product.expiry_date)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title={product.name}
        description={`Catalog item in ${product.category?.name || 'General Inventory'} • Brand: ${product.brand || 'Unbranded'}`}
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: product.name },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/products">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Catalog
              </Button>
            </Link>
            <Link href={`/products/${product.id}/edit`}>
              <Button variant="outline" size="sm" leftIcon={<Edit3 className="h-4 w-4" />}>
                Edit Details
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ShoppingCart className="h-4 w-4 text-indigo-500" />}
              onClick={() => setPurchaseOpen(true)}
            >
              Add Purchase
            </Button>
            {product.quantity > 0 && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Utensils className="h-4 w-4 text-emerald-500" />}
                onClick={() => setConsumeOpen(true)}
              >
                Consume
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={
                product.is_archived ? (
                  <RotateCcw className="h-4 w-4 text-amber-500" />
                ) : (
                  <Archive className="h-4 w-4 text-amber-500" />
                )
              }
              onClick={handleArchiveToggle}
            >
              {product.is_archived ? 'Restore' : 'Archive'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        }
      />

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Quantity & Stock Level */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Current Stock</span>
            <StatusBadge
              type="stock"
              quantity={product.quantity}
              threshold={product.minimum_stock_level}
            />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {product.quantity}{' '}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                {product.unit}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Min Threshold: {product.minimum_stock_level} {product.unit}
            </div>
          </div>
          {/* Quick inline increment/decrement */}
          <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs flex-1"
              disabled={product.quantity <= 0}
              onClick={() => handleQuickAdjust(-1)}
            >
              <Minus className="h-3 w-3 mr-1" /> -1
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs flex-1"
              onClick={() => handleQuickAdjust(1)}
            >
              <Plus className="h-3 w-3 mr-1" /> +1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              title="Custom adjustment"
              onClick={() => setAdjustModalOpen(true)}
            >
              <Sliders className="h-3 w-3" />
            </Button>
          </div>
        </Card>

        {/* Expiry Life Cycle */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Expiry Schedule</span>
            <StatusBadge type="expiry" daysUntilExpiry={daysRemaining} />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {expiryLabel}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {product.expiry_date ? `Exp: ${formatDate(product.expiry_date)}` : 'No Expiry Set'}
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Mfg: {product.manufacturing_date ? formatDate(product.manufacturing_date) : 'N/A'}</span>
          </div>
        </Card>

        {/* Financial Valuation */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Valuation</span>
            <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency((product.purchase_price ?? product.mrp ?? 0) * product.quantity)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Unit Cost: {formatCurrency(product.purchase_price ?? 0)} • MRP: {formatCurrency(product.mrp ?? 0)}
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            Total Inventory Holding
          </div>
        </Card>

        {/* Storage & Lot */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Storage & Lot</span>
            <Layers className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
              {product.storage_location || 'Not Specified'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono">
              Lot: {product.batch_number || 'N/A'}
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 truncate">
            Barcode: {product.barcode || 'None'}
          </div>
        </Card>
      </div>

      {/* Main Grid: Details + Histories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Media & Core Specs */}
        <div className="space-y-6 lg:col-span-1">
          {/* Photo Card */}
          <Card className="overflow-hidden">
            <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                  <Package className="h-16 w-16 mb-2" />
                  <span className="text-xs">No image provided</span>
                </div>
              )}
            </div>
            {product.description && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </h5>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </Card>

          {/* Detailed Specs List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Product Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Brand</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {product.brand || 'Unbranded'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {product.category?.name || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Barcode / UPC</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {product.barcode || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Net Weight / Vol</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {product.weight || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Purchase Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {product.purchase_date ? formatDate(product.purchase_date) : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Archived Status</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {product.is_archived ? 'Archived' : 'Active'}
                </span>
              </div>
              {product.tags && product.tags.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1.5">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {product.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {product.notes && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Operational Notes</span>
                  <p className="text-slate-600 dark:text-slate-300 italic">{product.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: History Streams (Purchases, Consumption, Activity) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Purchase History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-indigo-500" />
                  Purchase History
                </CardTitle>
                <CardDescription>Log of stock replenishments and vendor invoices</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setPurchaseOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No purchases recorded yet for this product.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor / Store</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs">{formatDate(p.purchase_date)}</TableCell>
                        <TableCell className="text-xs font-medium">{p.store_name || '—'}</TableCell>
                        <TableCell className="text-xs">
                          {p.quantity} {product.unit}
                        </TableCell>
                        <TableCell className="text-xs">{formatCurrency(p.purchase_price)}</TableCell>
                        <TableCell className="text-xs font-semibold text-right">
                          {formatCurrency(p.total_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Consumption History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-emerald-500" />
                  Consumption History
                </CardTitle>
                <CardDescription>Historical logs of utilized and depleted quantities</CardDescription>
              </div>
              {product.quantity > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setConsumeOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Log Usage
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {consumption.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No consumption events logged yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Quantity Used</TableHead>
                      <TableHead>Purpose / Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumption.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs">{formatDate(c.consumed_at)}</TableCell>
                        <TableCell className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          -{c.quantity} {product.unit}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {c.note || 'Regular usage'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Audit / Activity Stream */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" />
                Audit Trail & Life-Cycle Activity
              </CardTitle>
              <CardDescription>System log of all state mutations for this item</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No audit events recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {act.description}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(act.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Consume Modal */}
      <ConsumeModal
        isOpen={consumeOpen}
        onClose={() => setConsumeOpen(false)}
        product={product}
        onSuccess={() => {
          setConsumeOpen(false)
          refreshProductData()
        }}
      />

      {/* Quick Record Purchase Modal */}
      <RecordPurchaseModal
        isOpen={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        product={product}
        onSuccess={() => {
          setPurchaseOpen(false)
          refreshProductData()
        }}
      />

      {/* Adjust Quantity Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Adjust Inventory Quantity"
        size="sm"
      >
        <form onSubmit={handleCustomAdjustSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Enter the quantity delta to add (e.g. +5) or remove (e.g. -2) from{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {product.name}
            </span>
            . Current stock: {product.quantity} {product.unit}.
          </p>

          <Input
            label="Adjustment Delta"
            type="number"
            step="any"
            placeholder="+1 or -1"
            value={adjustDelta || ''}
            onChange={(e) => setAdjustDelta(parseFloat(e.target.value) || 0)}
          />

          <div className="text-xs text-slate-400">
            Projected stock after adjustment:{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.max(0, product.quantity + adjustDelta)} {product.unit}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAdjustModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isAdjusting}
              disabled={adjustDelta === 0}
            >
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Permanently Delete Item?"
        message={`Are you sure you want to delete "${product.name}"? This removes the product record from the catalog permanently.`}
        confirmText="Delete Item"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
