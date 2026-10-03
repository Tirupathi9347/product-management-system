'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { PlusCircle, ShoppingCart, SlidersHorizontal, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export function QuickActionsSection() {
  const actions = [
    {
      title: 'Catalog Product',
      desc: 'Add product specs, image & stock details',
      href: '/products/new',
      icon: PlusCircle,
      color: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
    },
    {
      title: 'Log Purchase',
      desc: 'Record invoice, price, and store acquisition',
      href: '/purchases',
      icon: ShoppingCart,
      color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    },
    {
      title: 'Stock Adjustment',
      desc: 'Perform manual counts and depletion audits',
      href: '/inventory',
      icon: SlidersHorizontal,
      color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common shortcuts for everyday inventory operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actions.map((act) => {
            const Icon = act.icon
            return (
              <Link
                key={act.title}
                href={act.href}
                className="group flex flex-col justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-md shrink-0 ${act.color}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{act.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
