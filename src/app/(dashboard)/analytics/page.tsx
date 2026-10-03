'use client'

import * as React from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { AnalyticsService, CompleteAnalyticsData } from '@/lib/services'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  TrendingUp,
  Package,
  IndianRupee,
  PieChart as PieIcon,
  Flame,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export default function AnalyticsPage() {
  const [data, setData] = React.useState<CompleteAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    AnalyticsService.getAnalytics()
      .then((res) => {
        setData(res)
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
  }, [])

  if (isLoading || !data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          title="Analytics & Insights"
          description="Insights into inventory trends, category distribution, and consumption velocity."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-80 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    )
  }

  const { summary, categoryDistribution, expiryDistribution, spending, consumption } = data

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Analytics & Insights"
        description="Insights into inventory trends, category distribution, and consumption velocity."
        action={
          <Link href="/reports">
            <Button variant="outline" size="sm" leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />}>
              View Reports
            </Button>
          </Link>
        }
      />

      {/* Top 4 Real Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Active Products
            </span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {summary.totalProducts}
            </h3>
            <span className="text-[11px] text-slate-500">{summary.totalQuantity} total units in stock</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Inventory Valuation
            </span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              ₹{summary.totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Portfolio capital asset
            </span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Procured Spend
            </span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              ₹{spending.totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[11px] text-slate-500">Across recorded purchases</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Depleted Units
            </span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {consumption.totalConsumedUnits}
            </h3>
            <span className="text-[11px] text-slate-500">Consumed or utilized</span>
          </div>
        </Card>
      </div>

      {/* Row 1: Category Distribution & Expiry Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Value Allocation */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-indigo-500" />
                  <span>Category Capital Allocation</span>
                </CardTitle>
                <CardDescription>Value distribution across product groups</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {categoryDistribution.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No categories"
                description="Add products to see category distribution."
              />
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="h-56 w-56 shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {categoryDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: unknown) => [
                          `₹${Number(val || 0).toLocaleString('en-IN')}`,
                          'Valuation',
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-2">
                  {categoryDistribution.slice(0, 5).map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px]">
                          {cat.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{cat.value.toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-400 ml-1.5 text-[11px]">({cat.count} items)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiry Risk Distribution */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Expiry Schedule & Aging Breakdown</span>
            </CardTitle>
            <CardDescription>Automated risk segmentation based on threshold countdowns</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-4 pt-2">
              {expiryDistribution.map((item) => (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{item.status}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {item.count} products ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Spend Intelligence & Consumption Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trends */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span>Procurement Spend by Month</span>
            </CardTitle>
            <CardDescription>Historical financial outflows based on recorded purchases</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!data.hasPurchases ? (
              <div className="p-8 text-center space-y-3">
                <EmptyState
                  icon={IndianRupee}
                  title="Not enough spend data yet"
                  description="Record a few purchase restocks in the Purchases module to unlock monthly spending trends."
                  action={
                    <Link href="/purchases">
                      <Button size="sm" variant="outline" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                        Record First Purchase
                      </Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spending.monthlySpend}>
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(val: unknown) => [
                        `₹${Number(val || 0).toLocaleString('en-IN')}`,
                        'Total Spend',
                      ]}
                    />
                    <Bar dataKey="amount" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Consumed Products */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-500" />
              <span>Highest Depletion Items</span>
            </CardTitle>
            <CardDescription>Top utilized inventory requiring proactive replenishment</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!data.hasConsumption ? (
              <div className="p-8 text-center space-y-3">
                <EmptyState
                  icon={Flame}
                  title="Not enough consumption data"
                  description="Log product consumption depletions to visualize usage velocity and high-burn items."
                  action={
                    <Link href="/consumption">
                      <Button size="sm" variant="outline" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                        Record Depletion
                      </Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {consumption.topConsumedProducts.map((prod, idx) => (
                  <div
                    key={prod.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {prod.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {prod.quantity} {prod.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
