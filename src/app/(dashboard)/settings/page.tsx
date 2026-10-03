'use client'

import * as React from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/features/auth/AuthContext'
import { useTheme } from 'next-themes'
import { useToast } from '@/components/ui/Toast'
import { updateUserProfile, updateUserSettings, getUserSettings } from '@/lib/services'
import {
  User,
  Sun,
  Moon,
  Laptop,
  Database,
  Save,
  Bell,
  Sliders,
  LogOut,
  RotateCcw,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, profile, refreshProfile, isConfigured, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { success, error } = useToast()

  const [customName, setCustomName] = React.useState<string | null>(null)
  const [lowStockThreshold, setLowStockThreshold] = React.useState(2)
  const [expiryWarningDays, setExpiryWarningDays] = React.useState(14)
  const [notifyExpiry, setNotifyExpiry] = React.useState(true)
  const [notifyLowStock, setNotifyLowStock] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  const displayName = customName !== null ? customName : (profile?.display_name || user?.email?.split('@')[0] || '')

  React.useEffect(() => {
    let isCurrent = true
    const userId = user?.id || 'dev-user-001'
    getUserSettings(userId)
      .then((st) => {
        if (isCurrent && st) {
          if (st.low_stock_threshold !== undefined) setLowStockThreshold(st.low_stock_threshold)
          if (st.expiry_warning_days !== undefined) setExpiryWarningDays(st.expiry_warning_days)
          if (st.notification_preferences?.expiry_alerts !== undefined) {
            setNotifyExpiry(st.notification_preferences.expiry_alerts)
          }
          if (st.notification_preferences?.low_stock_alerts !== undefined) {
            setNotifyLowStock(st.notification_preferences.low_stock_alerts)
          }
        }
      })
      .catch(() => {})

    return () => {
      isCurrent = false
    }
  }, [user?.id])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const userId = user?.id || 'dev-user-001'
      if (isConfigured) {
        await updateUserProfile(userId, { display_name: displayName })
      }
      await updateUserSettings(userId, {
        low_stock_threshold: lowStockThreshold,
        expiry_warning_days: expiryWarningDays,
        notification_preferences: {
          email: notifyExpiry,
          push: notifyLowStock,
          expiry_alerts: notifyExpiry,
          low_stock_alerts: notifyLowStock,
        },
      })
      if (isConfigured) {
        await refreshProfile()
      }
      success('Settings Persisted', 'Your profile and system preferences have been saved.')
    } catch (err) {
      error('Update Failed', err instanceof Error ? err.message : 'Could not save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetDevData = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      success('Local Cache Cleared', 'Reloading with default seed state...')
      setTimeout(() => {
        window.location.reload()
      }, 800)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader
        title="Settings"
        description="Manage your profile, notification thresholds, theme, and database settings."
      />

      {/* Supabase Integration Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <CardTitle>Database Connection</CardTitle>
          </div>
          <CardDescription>
            PostgreSQL instance with Row Level Security (RLS) and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Connection Status</p>
              <p className="text-xs text-slate-500">
                {isConfigured ? 'Connected to live Supabase project' : 'Running in development mode with local persistence'}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isConfigured
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isConfigured ? 'Live Connection' : 'Local Dev Adapter'}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            To switch to your own Supabase instance, update <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">.env.local</code>.
          </p>
        </CardContent>
      </Card>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Identity and account metadata synced with Supabase Auth</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Your name"
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input
              label="Account Email"
              value={user?.email || 'authenticated-user@domain.com'}
              disabled
              helperText="Managed through Supabase Auth"
            />
          </div>
        </CardContent>
      </Card>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance & Theme</CardTitle>
          <CardDescription>Customize the visual ambiance across Light, Dark, or System Sync</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Laptop },
            ].map((t) => {
              const Icon = t.icon
              const isSelected = theme === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-2" />
                  <span className="text-xs">{t.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Expiry & Stock Thresholds */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-500" />
            <CardTitle>Alert Thresholds</CardTitle>
          </div>
          <CardDescription>Calibrate sensitivity for automated expiry countdowns and replenishment alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Low Stock Warning Threshold (units)"
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              helperText="Trigger warning badge when quantity drops to or below this number"
            />
            <Input
              label="Expiry Warning Window (days)"
              type="number"
              value={expiryWarningDays}
              onChange={(e) => setExpiryWarningDays(Number(e.target.value))}
              helperText="Days in advance to flag product as expiring soon"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-indigo-500" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>Select which automated inventory telemetry alerts you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Perishable Expiration Alerts
              </p>
              <p className="text-[11px] text-slate-500">
                Receive warnings when products enter the 7-day or 3-day urgent expiry window
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyExpiry}
              onChange={(e) => setNotifyExpiry(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Low Stock & Depletion Warnings
              </p>
              <p className="text-[11px] text-slate-500">
                Trigger alerts when items hit or drop below the minimum stock threshold
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyLowStock}
              onChange={(e) => setNotifyLowStock(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </CardContent>
      </Card>

      {/* Developer & Account Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Account & Diagnostic Controls</CardTitle>
          <CardDescription>Manage session state and local development cache</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDevData}
            leftIcon={<RotateCcw className="h-4 w-4 text-amber-500" />}
          >
            Reset Development Seed Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            leftIcon={<LogOut className="h-4 w-4 text-rose-500" />}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSaveProfile}
          isLoading={isSaving}
          leftIcon={<Save className="h-4 w-4" />}
        >
          Save All Changes
        </Button>
      </div>
    </div>
  )
}
