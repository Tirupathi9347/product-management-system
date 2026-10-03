'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Bell, Menu, Plus, User, LogOut, Settings } from 'lucide-react'
import { ThemeToggle } from '@/components/theme'
import { Dropdown } from '@/components/ui/Dropdown'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { GlobalSearchModal } from '@/features/search'
import { NotificationService } from '@/lib/services'

export interface HeaderProps {
  onOpenMobileMenu: () => void
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)

  // Listen for Ctrl+K / Cmd+K global shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Poll unread notification count
  React.useEffect(() => {
    const checkUnread = () => {
      NotificationService.getUnreadCount().then(setUnreadCount).catch(() => {})
    }
    checkUnread()
    const interval = setInterval(checkUnread, 10000)
    return () => clearInterval(interval)
  }, [])

  // Format page title from pathname
  const pageTitle = pathname.split('/')[1] || 'Dashboard'
  const capitalizedTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1)

  const userMenuItems = [
    {
      label: profile?.display_name || user?.email || 'User Account',
      icon: <User className="h-4 w-4" />,
      onClick: () => {},
    },
    {
      label: 'Account Settings',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => {
        router.push('/settings')
      },
    },
    {
      label: '',
      divider: true,
    },
    {
      label: 'Sign Out',
      icon: <LogOut className="h-4 w-4" />,
      danger: true,
      onClick: () => signOut(),
    },
  ]

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
        {/* Left: Mobile trigger & breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Open mobile menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {capitalizedTitle}
            </span>
          </div>
        </div>

        {/* Center: Global Search Bar trigger */}
        <div className="flex-1 max-w-md mx-4">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="relative flex items-center justify-between w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer text-left shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span>Search products, barcodes, locations...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Notifications, Theme, Profile */}
        <div className="flex items-center gap-2">
          <Link href="/products/new" className="hidden sm:inline-flex">
            <Button size="sm" variant="default" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              New Product
            </Button>
          </Link>

          {/* Notifications Icon with dynamic badge */}
          <Link
            href="/notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Profile Dropdown */}
          <Dropdown
            align="right"
            trigger={
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs hover:border-indigo-400 transition-colors cursor-pointer">
                {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'}
              </div>
            }
            items={userMenuItems}
          />
        </div>
      </header>

      {/* Omnisearch Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
