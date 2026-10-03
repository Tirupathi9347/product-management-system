'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MAIN_NAVIGATION, QUICK_ACTIONS } from '@/lib/config/navigation'
import { siteConfig } from '@/lib/config/site'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Drawer } from '@/components/ui/Drawer'

export interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="left" title="Navigation">
      <div className="flex flex-col h-full space-y-5">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100">
              {siteConfig.shortName}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Inventory System
            </p>
          </div>
        </div>

        {/* Quick Action */}
        <div>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <Icon className="h-4 w-4" />
                <span>{action.title}</span>
              </Link>
            )
          })}
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {MAIN_NAVIGATION.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
                {item.badge && (
                  <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </Drawer>
  )
}
