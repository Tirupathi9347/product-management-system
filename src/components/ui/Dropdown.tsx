'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface DropdownItem {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

export interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

interface MenuPosition {
  top?: number
  bottom?: number
  left?: number
  right?: number
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [menuPos, setMenuPos] = React.useState<MenuPosition>({})
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 224 // w-56 = 14rem = 224px
    // Estimate height: ~40px/item + 9px/divider + 8px padding
    const visibleItems = items.filter((i) => !i.divider).length
    const dividers = items.filter((i) => i.divider).length
    const estimatedMenuHeight = visibleItems * 40 + dividers * 9 + 8

    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUpward = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow

    const pos: MenuPosition = {}

    if (openUpward) {
      pos.bottom = window.innerHeight - rect.top + 4
    } else {
      pos.top = rect.bottom + 4
    }

    if (align === 'right') {
      pos.right = window.innerWidth - rect.right
    } else {
      pos.left = rect.left
    }

    // Ensure menu doesn't go off the left/right edge
    if (align === 'right' && pos.right !== undefined) {
      const rightEdge = window.innerWidth - (pos.right ?? 0)
      if (rightEdge - menuWidth < 0) {
        pos.right = window.innerWidth - menuWidth - 4
      }
    }

    setMenuPos(pos)
  }, [items, align])

  const handleOpen = React.useCallback(() => {
    calculatePosition()
    setIsOpen((prev) => !prev)
  }, [calculatePosition])

  // Close on outside click or scroll
  React.useEffect(() => {
    if (!isOpen) return

    const handleClose = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleScroll = () => setIsOpen(false)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClose)
    document.addEventListener('scroll', handleScroll, true)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClose)
      document.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const menu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12 }}
          style={{
            position: 'fixed',
            zIndex: 9999,
            width: 224,
            top: menuPos.top,
            bottom: menuPos.bottom,
            left: menuPos.left,
            right: menuPos.right,
          }}
          className={cn(
            'rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900',
            className
          )}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${idx}`}
                  className="my-1 h-px bg-slate-100 dark:bg-slate-800"
                />
              )
            }
            return (
              <button
                key={idx}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.()
                  setIsOpen(false)
                }}
                className={cn(
                  'flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors text-left cursor-pointer',
                  item.danger
                    ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
                  item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                )}
              >
                {item.icon && (
                  <span className="mr-2.5 h-4 w-4 shrink-0 text-current">{item.icon}</span>
                )}
                <span className="flex-1 font-medium">{item.label}</span>
              </button>
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="relative inline-block text-left">
      <div ref={triggerRef} onClick={handleOpen} className="cursor-pointer">
        {trigger}
      </div>
      {mounted ? createPortal(menu, document.body) : null}
    </div>
  )
}
