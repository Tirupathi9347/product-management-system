import * as React from 'react'
import { Metadata } from 'next'
import { SignupForm } from '@/features/auth/SignupForm'
import { Package } from 'lucide-react'
import Link from 'next/link'
import { siteConfig } from '@/lib/config/site'

export const metadata: Metadata = {
  title: 'Sign Up | Smart Product Management System',
  description: 'Create your inventory and product management account.',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 mx-auto">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {siteConfig.shortName}
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create an account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track products, batches, and shelf-life horizons with ease.
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <React.Suspense fallback={<div className="h-64 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />}>
            <SignupForm />
          </React.Suspense>
        </div>
      </div>
    </div>
  )
}
