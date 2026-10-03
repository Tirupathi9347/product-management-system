'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Product } from '@/types/database'
import { getDaysUntilExpiry } from '@/lib/utils/formatters'

export function ExpiryOverviewSection({ products = [] }: { products?: Product[] }) {
  // Filter for products that have an expiry date
  const expiringProducts = products
    .filter((p) => Boolean(p.expiry_date))
    .sort((a, b) => {
      const daysA = getDaysUntilExpiry(a.expiry_date) ?? 9999
      const daysB = getDaysUntilExpiry(b.expiry_date) ?? 9999
      return daysA - daysB
    })
    .slice(0, 4)

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Upcoming Expirations</CardTitle>
          <CardDescription>Products approaching or past expiration date</CardDescription>
        </div>
        <Link
          href="/inventory"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 inline-flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {expiringProducts.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Zero Expiry Alerts"
            description="All tracked items are fresh or no expiry dates have been entered."
          />
        ) : (
          <div className="space-y-2.5">
            {expiringProducts.map((p) => {
              const days = getDaysUntilExpiry(p.expiry_date)
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60"
                >
                  <div className="min-w-0 pr-2">
                    <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {p.name}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>{p.expiry_date}</span>
                      {p.storage_location && <span>• {p.storage_location}</span>}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge type="expiry" daysUntilExpiry={days} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
