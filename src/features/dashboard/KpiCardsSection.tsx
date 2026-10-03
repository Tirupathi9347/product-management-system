'use client'

import * as React from 'react'
import { DataCard } from '@/components/ui/DataCard'
import { Package, AlertTriangle, Clock, IndianRupee } from 'lucide-react'

export interface KpiSummary {
  totalProducts: number
  lowStockCount: number
  expiringSoonCount: number
  totalValuation: number
}

export function KpiCardsSection({ summary }: { summary?: KpiSummary }) {
  const data = summary || {
    totalProducts: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
    totalValuation: 0,
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DataCard
        title="Total Products"
        value={data.totalProducts}
        change={data.totalProducts > 0 ? '+12% from last mo' : 'No items yet'}
        trend={data.totalProducts > 0 ? 'up' : 'neutral'}
        icon={<Package className="h-5 w-5" />}
        iconBgColor="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
      />

      <DataCard
        title="Expiring Soon (<14d)"
        value={data.expiringSoonCount}
        change={data.expiringSoonCount > 0 ? 'Action required' : 'All fresh'}
        trend={data.expiringSoonCount > 0 ? 'down' : 'neutral'}
        icon={<Clock className="h-5 w-5" />}
        iconBgColor="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
      />

      <DataCard
        title="Low Stock Alerts"
        value={data.lowStockCount}
        change={data.lowStockCount > 0 ? 'Reorder needed' : 'Optimal'}
        trend={data.lowStockCount > 0 ? 'down' : 'neutral'}
        icon={<AlertTriangle className="h-5 w-5" />}
        iconBgColor="bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
      />

      <DataCard
        title="Inventory Valuation"
        value={`₹${data.totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
        change="+4.5% vs budget"
        trend="up"
        icon={<IndianRupee className="h-5 w-5" />}
        iconBgColor="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
      />
    </div>
  )
}
