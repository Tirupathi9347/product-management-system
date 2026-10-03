import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
        secondary: 'border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
        success: 'border-emerald-200/50 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/50 dark:text-emerald-300',
        warning: 'border-amber-200/50 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/50 dark:text-amber-300',
        danger: 'border-rose-200/50 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/50 dark:text-rose-300',
        outline: 'border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full shrink-0',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'danger' && 'bg-rose-500',
            variant === 'default' && 'bg-indigo-500',
            variant === 'secondary' && 'bg-slate-500'
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
