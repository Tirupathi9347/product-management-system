'use client'

import * as React from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { CategoryService, ReportService, GeneratedReport } from '@/lib/services'
import { Category, ReportType, StockStatus, ExpiryStatus } from '@/types'
import {
  FileText,
  Download,
  Printer,
  Package,
  Clock,
  ShoppingCart,
  Flame,
  Filter,
} from 'lucide-react'

export default function ReportsPage() {
  const [selectedType, setSelectedType] = React.useState<ReportType>('inventory')
  const [categories, setCategories] = React.useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = React.useState<string>('')
  const [selectedStock, setSelectedStock] = React.useState<StockStatus | 'ALL'>('ALL')
  const [selectedExpiry, setSelectedExpiry] = React.useState<ExpiryStatus | 'ALL'>('ALL')
  const [report, setReport] = React.useState<GeneratedReport | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    CategoryService.getCategories().then(setCategories).catch(() => {})
  }, [])

  React.useEffect(() => {
    let isCurrent = true
    ReportService.generateReport({
      type: selectedType,
      categoryId: selectedCategory || undefined,
      stockStatus: selectedStock,
      expiryStatus: selectedExpiry,
    })
      .then((data) => {
        if (isCurrent) {
          setReport(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [selectedType, selectedCategory, selectedStock, selectedExpiry])

  const handleExportCSV = () => {
    if (!report) return
    const rows = report.items.map((it) => {
      const vals: (string | number)[] = [it.col1, it.col2, it.col3, it.col4]
      if (it.col5) vals.push(it.col5)
      return vals
    })
    ReportService.exportToCSV(report.title, report.headers, rows)
  }

  const handlePrint = () => {
    window.print()
  }

  const reportTabs: { id: ReportType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'inventory', label: 'Inventory Valuation', icon: Package },
    { id: 'expiry', label: 'Expiry & Aging Audit', icon: Clock },
    { id: 'purchases', label: 'Procurement & Purchases', icon: ShoppingCart },
    { id: 'consumption', label: 'Consumption & Depletion', icon: Flame },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:m-0">
      <div className="print:hidden">
        <PageHeader
          title="Reports"
          description="Generate and export inventory valuations, expiration summaries, and purchase logs."
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="h-4 w-4" />}
              >
                Print / Save PDF
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportCSV}
                leftIcon={<Download className="h-4 w-4" />}
                disabled={!report || report.items.length === 0}
              >
                Export CSV
              </Button>
            </div>
          }
        />
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        {reportTabs.map((tab) => {
          const Icon = tab.icon
          const isSelected = selectedType === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs text-center">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="h-4 w-4" />
            <span>Filters:</span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter (for Inventory) */}
          {selectedType === 'inventory' && (
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value as StockStatus | 'ALL')}
              className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          )}

          {/* Expiry Filter (for Expiry) */}
          {selectedType === 'expiry' && (
            <select
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value as ExpiryStatus | 'ALL')}
              className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Expiry Statuses</option>
              <option value="SAFE">Safe (&gt;7 days)</option>
              <option value="EXPIRING_SOON">Expiring Soon (4-7 days)</option>
              <option value="URGENT">Urgent (1-3 days)</option>
              <option value="EXPIRED">Expired</option>
            </select>
          )}
        </div>
      </Card>

      {/* Generated Report Presentation Canvas */}
      {isLoading ? (
        <Card className="p-8">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-1/4 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl mt-6" />
          </div>
        </Card>
      ) : !report || report.items.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={FileText}
            title="No records matching filter"
            description="Adjust the filter parameters above or record more items to generate this report."
          />
        </Card>
      ) : (
        <Card className="p-6 print:border-none print:shadow-none space-y-6">
          {/* Report Header Metadata */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {report.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {report.subtitle}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Generated: <span className="font-semibold text-slate-700 dark:text-slate-300">{report.generatedAt}</span></p>
              <p>Records: <span className="font-semibold text-slate-700 dark:text-slate-300">{report.totalRecords}</span></p>
            </div>
          </div>

          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {report.summaryMetrics.map((met) => (
              <div
                key={met.label}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
              >
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {met.label}
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {met.value}
                </p>
              </div>
            ))}
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                <tr>
                  {report.headers.map((h, i) => (
                    <th key={i} className="px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {report.items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {it.col1}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{it.col2}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{it.col3}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{it.col4}</td>
                    {it.col5 && (
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {it.col5}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
