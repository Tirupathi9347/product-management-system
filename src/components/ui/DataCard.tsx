import * as React from 'react'
import { Card } from './Card'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface DataCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  icon: React.ReactNode
  iconBgColor?: string
  className?: string
}

export function DataCard({
  title,
  value,
  change,
  trend = 'neutral',
  description,
  icon,
  iconBgColor = 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  className,
}: DataCardProps) {
  return (
    <Card className={cn('relative overflow-hidden transition-colors', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {value}
            </span>
            {change && (
              <span
                className={cn(
                  'inline-flex items-center text-xs font-medium',
                  trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
                  trend === 'down' && 'text-rose-600 dark:text-rose-400',
                  trend === 'neutral' && 'text-slate-500 dark:text-slate-400'
                )}
              >
                {trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />}
                {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />}
                {trend === 'neutral' && <Minus className="h-3.5 w-3.5 mr-0.5" />}
                {change}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-400 dark:text-slate-500 pt-0.5">{description}</p>
          )}
        </div>

        <div className={cn('p-2.5 rounded-lg shrink-0', iconBgColor)}>
          {icon}
        </div>
      </div>
    </Card>
  )
}
