'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Activity, Plus, RefreshCw, Trash2, ShoppingCart } from 'lucide-react'
import { ActivityLog } from '@/types/database'
import { formatDate } from '@/lib/utils/formatters'

export function RecentActivitySection({ logs = [] }: { logs?: ActivityLog[] }) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <Plus className="h-4 w-4 text-emerald-500" />
      case 'update':
        return <RefreshCw className="h-4 w-4 text-indigo-500" />
      case 'delete':
        return <Trash2 className="h-4 w-4 text-rose-500" />
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-amber-500" />
      default:
        return <Activity className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Recent product additions, updates, and inventory changes</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No Activity Logged"
            description="Your recent inventory and product operations will appear here automatically."
          />
        ) : (
          <div className="space-y-2.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {log.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
