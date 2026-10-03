'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MAIN_NAVIGATION, QUICK_ACTIONS } from '@/lib/config/navigation'
import { siteConfig } from '@/lib/config/site'
import { cn } from '@/lib/utils/cn'
import { useAuth } from '@/features/auth/AuthContext'
import {
  Package,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react'

export interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()

  return (
    <aside
      className={cn(
        'relative hidden md:flex flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-200 z-30 h-screen sticky top-0 shrink-0',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Package className="h-4.5 w-4.5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                {siteConfig.shortName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Inventory System
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-18 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-xs hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100 transition-colors cursor-pointer z-40"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Quick Action Button */}
      <div className="p-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 transition-colors',
                isCollapsed && 'px-0 h-9 w-9 mx-auto'
              )}
              title={action.title}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>{action.title}</span>}
            </Link>
          )
        })}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {MAIN_NAVIGATION.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                isCollapsed && 'justify-center px-0 h-10 w-10 mx-auto'
              )}
              title={item.title}
            >
              <Icon
                className={cn(
                  'h-4.5 w-4.5 shrink-0',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                )}
              />

              {!isCollapsed && <span className="truncate">{item.title}</span>}

              {!isCollapsed && item.badge && (
                <span className="ml-auto flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer User Info */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800">
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-lg p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60',
            isCollapsed && 'justify-center p-1'
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
            {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                {profile?.display_name || user?.email?.split('@')[0] || 'User'}
              </span>
              <span className="text-[10px] text-slate-500 truncate">{user?.email || 'Authenticated'}</span>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={() => signOut()}
              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
