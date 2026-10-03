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
import { ConsumptionService, ProductService } from '@/lib/services'
import { ConsumeModal } from '@/features/consumption'
import { ConsumptionHistory, ProductWithMeta } from '@/types'
import { formatDate } from '@/lib/utils/formatters'
import {
  TrendingDown,
  Plus,
  Search,
  Package,
  Calendar,
  Utensils,
  Eye,
  X,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

export default function ConsumptionPage() {
  const { error } = useToast()

  const [consumptionList, setConsumptionList] = React.useState<ConsumptionHistory[]>([])
  const [products, setProducts] = React.useState<ProductWithMeta[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Filter
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isConsumeModalOpen, setIsConsumeModalOpen] = React.useState(false)

  // Load data
  React.useEffect(() => {
    let isMounted = true
    Promise.all([
      ConsumptionService.getConsumption(),
      ProductService.getProducts(),
    ])
      .then(([consList, prodList]) => {
        if (isMounted) {
          setConsumptionList(consList)
          setProducts(prodList)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load consumption:', err)
          error('Failed to load usage', 'Could not retrieve consumption history.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [error])

  const refreshConsumption = React.useCallback(async () => {
    try {
      const [consList, prodList] = await Promise.all([
        ConsumptionService.getConsumption(),
        ProductService.getProducts(),
      ])
      setConsumptionList(consList)
      setProducts(prodList)
    } catch (err) {
      console.error('Failed to refresh consumption:', err)
    }
  }, [])

  // Fast product lookup map
  const productMap = React.useMemo(() => {
    const map = new Map<string, ProductWithMeta>()
    products.forEach((p) => map.set(p.id, p))
    return map
  }, [products])

  // Summary Metrics
  const metrics = React.useMemo(() => {
    let totalUnits = 0
    consumptionList.forEach((c) => {
      totalUnits += c.quantity
    })
    return {
      totalUnits,
      totalEvents: consumptionList.length,
    }
  }, [consumptionList])

  // Filtered list
  const filteredList = React.useMemo(() => {
    return consumptionList.filter((c) => {
      const prod = c.product_id ? productMap.get(c.product_id) : null
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matches =
          (prod && prod.name.toLowerCase().includes(q)) ||
          (c.note && c.note.toLowerCase().includes(q))
        if (!matches) return false
      }
      return true
    })
  }, [consumptionList, searchQuery, productMap])

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Consumption History"
        description="Track product consumption, depletion rates, and inventory reductions."
        action={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsConsumeModalOpen(true)}
          >
            Log Consumption
          </Button>
        }
      />

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Total Usage Events</span>
            <Utensils className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {metrics.totalEvents} <span className="text-xs font-normal text-slate-400">logged</span>
          </div>
          <span className="text-xs text-slate-400 mt-1">Lifecycle depletion records</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Total Units Consumed</span>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {metrics.totalUnits} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <span className="text-xs text-slate-400 mt-1">Deducted from available stock</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Last Consumed Item</span>
            <Clock className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {consumptionList[0]?.product_id
              ? productMap.get(consumptionList[0].product_id)?.name || 'Recently logged'
              : 'No items consumed yet'}
          </div>
          <span className="text-xs text-slate-400 mt-1">
            {consumptionList[0]?.consumed_at
              ? formatDate(consumptionList[0].consumed_at)
              : 'Ledger clean'}
          </span>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Input
            placeholder="Search by product or note..."
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
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl w-full" />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={TrendingDown}
            title={searchQuery ? 'No Usage Logs Matched' : 'No Consumption Recorded'}
            description={
              searchQuery
                ? 'Try adjusting your search query.'
                : 'Log item usage to track depletion rates, maintain accurate stock balances, and avoid stockouts.'
            }
            actionLabel="Log Item Usage"
            onAction={() => setIsConsumeModalOpen(true)}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Consumed Quantity</TableHead>
                <TableHead>Current Remaining Stock</TableHead>
                <TableHead>Note / Purpose</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((entry) => {
                const prod = entry.product_id ? productMap.get(entry.product_id) : null
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(entry.consumed_at)}</span>
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

                    <TableCell className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      -{entry.quantity} {prod?.unit || 'units'}
                    </TableCell>

                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {prod ? (
                        <span>
                          {prod.quantity} {prod.unit}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {entry.note || 'Regular usage'}
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

      {/* Log Consumption Modal */}
      <ConsumeModal
        isOpen={isConsumeModalOpen}
        onClose={() => setIsConsumeModalOpen(false)}
        onSuccess={() => {
          setIsConsumeModalOpen(false)
          refreshConsumption()
        }}
      />
    </div>
  )
}
