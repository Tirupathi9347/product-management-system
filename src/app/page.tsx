'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ThemeToggle } from '@/components/theme'
import { siteConfig } from '@/lib/config/site'
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Clock,
  ScanBarcode,
  Layers,
  CheckCircle2,
  Package,
  Calendar,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white px-4 sm:px-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Package className="h-5 w-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-50">
              {siteConfig.shortName}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <Clock className="h-3.5 w-3.5" />
              <span>Smart Stock & Expiry Management</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.15]">
              Product Management,{' '}
              <span className="text-indigo-600 dark:text-indigo-400">
                Simple & Waste-Free.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Track expiry dates before items spoil, scan barcodes in seconds, organize inventory across rooms and shelves, and keep full control of your pantry.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Start Tracking Free
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Instant Barcode Scanning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Timely Expiry Alerts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Clean & Fast Interface</span>
              </div>
            </div>
          </div>

          {/* Clean & Simple Product Status Card */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Live Pantry Overview</h3>
                      <p className="text-xs text-slate-500">Updated in real-time</p>
                    </div>
                  </div>
                  <Badge variant="success" dot>
                    In Stock
                  </Badge>
                </div>

                {/* Tracked Sample Products */}
                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Organic Whole Milk</p>
                        <p className="text-[11px] text-slate-500">Dairy • Fridge Shelf 1</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                      Fresh (8 days left)
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                        !
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Whole Grain Bread</p>
                        <p className="text-[11px] text-slate-500">Bakery • Countertop</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                      Expiring Soon (3 days)
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Basmati Rice (5kg)</p>
                        <p className="text-[11px] text-slate-500">Grains • Lower Pantry</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Good (6 months)
                    </span>
                  </div>
                </div>

                {/* Health Metric */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Pantry Freshness Index</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">96% Optimal</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[96%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Simple Steps */}
      <section className="py-16 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              Simple Workflow
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              How It Works in 3 Quick Steps
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                1
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">Scan or Add Items</h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Scan barcodes with your camera or quickly type in details, category, purchase date, and expiration.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                2
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">Organize by Storage</h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Group items by Pantry, Refrigerator, Freezer, or Cabinets so you always know where things are located.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                3
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">Never Waste Food</h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Receive proactive alerts when items near their expiry date so you can consume them in time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
            Features
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Everything You Need for Clean Inventory Tracking
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              title: 'Barcode & SKU Scanning',
              desc: 'Point-and-shoot camera integration to look up product details, brands, and categories instantly.',
              icon: ScanBarcode,
            },
            {
              title: 'Expiry Countdown Alerts',
              desc: 'Color-coded badges notify you when products are fresh, approaching expiry, or expired.',
              icon: Clock,
            },
            {
              title: 'Location & Bin Mapping',
              desc: 'Organize stock across pantries, refrigerators, freezers, and storage cabinets.',
              icon: Layers,
            },
            {
              title: 'Consumption Log',
              desc: 'Record consumed and discarded items to understand household usage and reduce waste.',
              icon: BarChart3,
            },
            {
              title: 'Secure Cloud Sync',
              desc: 'Real-time database storage ensures your inventory data is synced and backed up safely.',
              icon: ShieldCheck,
            },
            {
              title: 'Dark & Light Mode',
              desc: 'Clean, distraction-free interface with instant toggle between dark and light themes.',
              icon: Zap,
            },
          ].map((feat) => {
            const Icon = feat.icon
            return (
              <div
                key={feat.title}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 hover:border-indigo-400/50 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{feat.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Clean Call To Action */}
      <section className="py-16 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/40">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Ready to Take Control of Your Products?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Join now to organize your pantry, track expiration dates, and stop wasting groceries.
          </p>
          <div className="pt-2">
            <Link href="/signup">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-4 sm:px-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">{siteConfig.name}</span>
            <span>— Product Management System</span>
          </div>
          <div>
            Built with Next.js, Supabase, Tailwind CSS & TypeScript.
          </div>
        </div>
      </footer>
    </div>
  )
}

