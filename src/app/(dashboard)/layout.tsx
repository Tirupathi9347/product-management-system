'use client'

import * as React from 'react'
import { Sidebar, Header, MobileNav } from '@/components/layout'
import { useAuth } from '@/features/auth/AuthContext'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const { isConfigured } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-foreground transition-colors duration-200">
      {/* Sidebar (Desktop) */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Supabase connection alert banner if placeholders are active */}
        {!isConfigured && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  Supabase backend is using development placeholders. Provide your project URL & Anon Key in <code className="bg-amber-500/15 px-1 py-0.5 rounded font-mono text-[11px]">.env.local</code> to enable live database persistence.
                </span>
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:underline"
              >
                <span>View Configuration</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-300">
          {children}
        </main>
      </div>
    </div>
  )
}
