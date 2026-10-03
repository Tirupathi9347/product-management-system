'use client'

import * as React from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { PurchaseService, ProductService } from '@/lib/services'
import { RecordPurchaseModal } from '@/features/purchases'
import { Purchase, ProductWithMeta } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import {
  ShoppingBag,
  Plus,
  Search,
  IndianRupee,
  Package,
  Calendar,
  Store,
  Eye,
  X,
} from 'lucide-react'
import Link from 'next/link'

export default function PurchasesPage() {
  const { error } = useToast()

  const [purchases, setPurchases] = React.useState<Purchase[]>([])
  const [products, setProducts] = React.useState<ProductWithMeta[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedVendor, setSelectedVendor] = React.useState('')
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = React.useState(false)

  // Load data
  React.useEffect(() => {
    let isMounted = true
    Promise.all([
      PurchaseService.getPurchases(),
      ProductService.getProducts(),
    ])
      .then(([purchList, prodList]) => {
        if (isMounted) {
          setPurchases(purchList)
          setProducts(prodList)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load purchases:', err)
          error('Failed to load purchases', 'Could not retrieve acquisition records.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [error])

  const refreshPurchases = React.useCallback(async () => {
    try {
      const [purchList, prodList] = await Promise.all([
        PurchaseService.getPurchases(),
        ProductService.getProducts(),
      ])
      setPurchases(purchList)
      setProducts(prodList)
    } catch (err) {
      console.error('Failed to refresh purchases:', err)
    }
  }, [])

  // Map product to purchase for fast lookup
  const productMap = React.useMemo(() => {
    const map = new Map<string, ProductWithMeta>()
    products.forEach((p) => map.set(p.id, p))
    return map
  }, [products])

  // Distinct vendors
  const vendors = React.useMemo(() => {
    const set = new Set<string>()
    purchases.forEach((p) => {
      if (p.store_name?.trim()) set.add(p.store_name.trim())
    })
    return Array.from(set)
  }, [purchases])

  // Summary Metrics
  const metrics = React.useMemo(() => {
    let totalSpend = 0
    let totalUnits = 0
    purchases.forEach((p) => {
      totalSpend += p.total_amount
      totalUnits += p.quantity
    })
    return {
      totalSpend,
      totalUnits,
      transactionCount: purchases.length,
    }
  }, [purchases])

  // Filtered purchases
  const filteredPurchases = React.useMemo(() => {
    return purchases.filter((p) => {
      const prod = p.product_id ? productMap.get(p.product_id) : null

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matches =
          (prod && prod.name.toLowerCase().includes(q)) ||
          (p.store_name && p.store_name.toLowerCase().includes(q)) ||
          (p.notes && p.notes.toLowerCase().includes(q))
        if (!matches) return false
      }

      if (selectedVendor && p.store_name?.trim() !== selectedVendor) {
        return false
      }

      return true
    })
  }, [purchases, searchQuery, selectedVendor, productMap])

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Purchases & Invoices"
        description="Track purchase orders, store receipts, unit costs, and restocking history."
        action={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsPurchaseModalOpen(true)}
          >
            Record Purchase
          </Button>
        }
      />

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Total Spend</span>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(metrics.totalSpend)}
          </div>
          <span className="text-xs text-slate-400 mt-1">Across all logged purchases</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Total Units Procured</span>
            <Package className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {metrics.totalUnits} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <span className="text-xs text-slate-400 mt-1">Total items added to inventory</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Purchase Invoices</span>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {metrics.transactionCount}{' '}
            <span className="text-xs font-normal text-slate-400">transactions</span>
          </div>
          <span className="text-xs text-slate-400 mt-1">{vendors.length} vendors indexed</span>
        </Card>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Input
            placeholder="Search by product, vendor, note..."
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

        {/* Vendors Filter */}
        {vendors.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedVendor('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedVendor === ''
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              All Vendors
            </button>
            {vendors.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSelectedVendor(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedVendor === v
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Purchases Table */}
      {isLoading ? (
        <div className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl w-full" />
          ))}
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={ShoppingBag}
            title={searchQuery || selectedVendor ? 'No Purchases Matched' : 'No Purchases Recorded'}
            description={
              searchQuery || selectedVendor
                ? 'Try adjusting your vendor filter or search keywords.'
                : 'Start recording restock batches and invoices to keep your inventory valuation and pricing metrics accurate.'
            }
            actionLabel="Record First Purchase"
            onAction={() => setIsPurchaseModalOpen(true)}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Store / Vendor</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((purchase) => {
                const prod = purchase.product_id ? productMap.get(purchase.product_id) : null
                return (
                  <TableRow key={purchase.id}>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(purchase.purchase_date)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {prod ? (
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                            {prod.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={prod.image_url} alt={prod.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/products/${prod.id}`}
                              className="font-semibold text-xs text-slate-900 dark:text-slate-100 hover:text-indigo-600"
                            >
                              {prod.name}
                            </Link>
                            <div className="text-[10px] text-slate-400">{prod.brand || 'Unbranded'}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Unknown Product</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {purchase.store_name ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <Store className="h-3 w-3 text-slate-400" />
                          {purchase.store_name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      +{purchase.quantity} {prod?.unit || 'units'}
                    </TableCell>

                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {formatCurrency(purchase.purchase_price)}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(purchase.total_amount)}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {purchase.notes || '—'}
                    </TableCell>

                    <TableCell className="text-right">
                      {prod && (
                        <Link href={`/products/${prod.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Product Details">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Record Purchase Modal */}
      <RecordPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={() => {
          setIsPurchaseModalOpen(false)
          refreshPurchases()
        }}
      />
    </div>
  )
}
