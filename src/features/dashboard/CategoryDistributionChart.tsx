'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { EmptyState } from '@/components/ui/EmptyState'
import { PieChart as PieChartIcon } from 'lucide-react'
import { useMounted } from '@/lib/hooks/useMounted'

export interface CategoryDataPoint {
  name: string
  value: number
  color: string
}

export function CategoryDistributionChart({ data }: { data?: CategoryDataPoint[] }) {
  const mounted = useMounted()

  const defaultData: CategoryDataPoint[] = [
    { name: 'Food & Groceries', value: 35, color: '#10B981' },
    { name: 'Beverages', value: 20, color: '#3B82F6' },
    { name: 'Personal Care', value: 18, color: '#EC4899' },
    { name: 'Household', value: 15, color: '#F59E0B' },
    { name: 'Snacks & Confectionery', value: 12, color: '#8B5CF6' },
  ]

  const chartData = data && data.length > 0 ? data : defaultData
  const hasData = chartData.some((d) => d.value > 0)

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>Category Distribution</CardTitle>
        <CardDescription>Breakdown of items across product classifications</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            icon={PieChartIcon}
            title="No Category Data"
            description="Add products to visualize your inventory category distribution."
          />
        ) : !mounted ? (
          <div className="h-64 w-full flex items-center justify-center animate-pulse bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
