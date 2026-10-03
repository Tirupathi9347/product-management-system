'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ProductService } from '@/lib/services'
import { ProductWithMeta } from '@/types'
import { Search, Package, Tag, ArrowRight, CornerDownLeft, X } from 'lucide-react'

export interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [products, setProducts] = React.useState<ProductWithMeta[]>([])
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!isOpen) return

    let isCurrent = true
    ProductService.getProducts()
      .then((data) => {
        if (isCurrent) setProducts(data)
      })
      .catch(() => {})

    const timer = setTimeout(() => {
      inputRef.current?.focus()
      setSelectedIndex(0)
    }, 50)

    return () => {
      isCurrent = false
      clearTimeout(timer)
    }
  }, [isOpen])

  // Filter products across Name, Brand, Barcode, Category, Tags
  const q = query.trim().toLowerCase()
  const matchingProducts = React.useMemo(() => {
    if (!q) return products.slice(0, 6)
    return products
      .filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q)
        const brandMatch = (p.brand || '').toLowerCase().includes(q)
        const barcodeMatch = (p.barcode || '').toLowerCase().includes(q)
        const catMatch = (p.category?.name || '').toLowerCase().includes(q)
        const tagMatch = (p.tags || []).some((t) => t.toLowerCase().includes(q))
        return nameMatch || brandMatch || barcodeMatch || catMatch || tagMatch
      })
      .slice(0, 8)
  }, [products, q])

  // Keyboard navigation: Escape, ArrowDown, ArrowUp, Enter
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < matchingProducts.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : matchingProducts.length - 1
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = matchingProducts[selectedIndex]
        if (selected) {
          router.push(`/products/${selected.id}`)
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, matchingProducts, selectedIndex, router, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in-20">
      <div
        className="w-full max-w-xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Search products, brands, barcodes, categories, tags..."
            className="w-full py-4 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {matchingProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <Package className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold">No matching products found</p>
              <p className="text-xs">Try searching by title, brand, barcode, or category tag</p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {q ? `Matching Items (${matchingProducts.length})` : 'Recent Catalog Items'}
              </span>

              {matchingProducts.map((p, index) => {
                const isSelected = index === selectedIndex
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      router.push(`/products/${p.id}`)
                      onClose()
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{p.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          {p.brand && <span>{p.brand}</span>}
                          {p.category && (
                            <>
                              <span>•</span>
                              <span>{p.category.name}</span>
                            </>
                          )}
                          {p.barcode && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{p.barcode}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {p.tags && p.tags.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1">
                          <Tag className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] text-slate-500">{p.tags[0]}</span>
                        </div>
                      )}
                      <span className="text-xs font-semibold">
                        {p.quantity} {p.unit}
                      </span>
                      {isSelected ? (
                        <CornerDownLeft className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 ml-1" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 ml-1" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                ↑
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                ↵
              </kbd>{' '}
              Open Item
            </span>
          </div>
          <span>Omnisearch</span>
        </div>
      </div>
    </div>
  )
}
