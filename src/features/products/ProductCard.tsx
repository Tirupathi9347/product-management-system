import * as React from 'react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Dropdown } from '@/components/ui/Dropdown'
import { ProductWithMeta } from '@/types'
import { formatCurrency, getDaysUntilExpiry } from '@/lib/utils/formatters'
import { Package, MapPin, Calendar, MoreVertical, Eye, Edit3, Utensils, ShoppingCart, Archive, RotateCcw, Trash2 } from 'lucide-react'

export interface ProductCardProps {
  product: ProductWithMeta
  categoryName?: string
  onClick?: () => void
  onEdit?: () => void
  onConsume?: () => void
  onPurchase?: () => void
  onArchive?: () => void
  onRestore?: () => void
  onDelete?: () => void
}

export function ProductCard({
  product,
  categoryName,
  onClick,
  onEdit,
  onConsume,
  onPurchase,
  onArchive,
  onRestore,
  onDelete,
}: ProductCardProps) {
  const daysUntilExpiry = getDaysUntilExpiry(product.expiry_date)
  const categoryDisplay = categoryName || product.category?.name

  const menuItems = React.useMemo(() => {
    const items = []
    if (onClick) {
      items.push({
        label: 'View Specifications',
        icon: <Eye className="h-4 w-4" />,
        onClick: onClick,
      })
    }
    if (onEdit) {
      items.push({
        label: 'Edit Details',
        icon: <Edit3 className="h-4 w-4" />,
        onClick: onEdit,
      })
    }
    if (onConsume && product.quantity > 0) {
      items.push({
        label: 'Consume Units',
        icon: <Utensils className="h-4 w-4 text-emerald-500" />,
        onClick: onConsume,
      })
    }
    if (onPurchase) {
      items.push({
        label: 'Record Purchase',
        icon: <ShoppingCart className="h-4 w-4 text-indigo-500" />,
        onClick: onPurchase,
      })
    }
    items.push({ label: '', divider: true })
    if (product.is_archived) {
      if (onRestore) {
        items.push({
          label: 'Restore Item',
          icon: <RotateCcw className="h-4 w-4 text-amber-500" />,
          onClick: onRestore,
        })
      }
    } else {
      if (onArchive) {
        items.push({
          label: 'Archive Item',
          icon: <Archive className="h-4 w-4 text-amber-500" />,
          onClick: onArchive,
        })
      }
    }
    if (onDelete) {
      items.push({
        label: 'Delete Permanently',
        icon: <Trash2 className="h-4 w-4" />,
        danger: true,
        onClick: onDelete,
      })
    }
    return items
  }, [onClick, onEdit, onConsume, onPurchase, onArchive, onRestore, onDelete, product.is_archived, product.quantity])

  return (
    <Card
      className="group hover:border-slate-400 dark:hover:border-slate-600 transition-colors overflow-hidden flex flex-col justify-between relative"
    >
      <div>
        {/* Image / Thumbnail placeholder */}
        <div
          onClick={onClick}
          className="relative aspect-video w-full rounded-lg bg-slate-100 dark:bg-slate-800 mb-3 overflow-hidden flex items-center justify-center cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
        >
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-8 w-8 text-slate-400 dark:text-slate-600" />
          )}

          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            <StatusBadge
              type="stock"
              quantity={product.quantity}
              threshold={product.minimum_stock_level}
            />
            {product.is_archived && (
              <Badge variant="warning" className="text-[10px]">
                Archived
              </Badge>
            )}
          </div>
        </div>

        {/* Brand & Category & Menu */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
              {product.brand || 'Unbranded'}
            </span>
            {categoryDisplay && (
              <Badge variant="secondary" className="text-[10px] py-0 px-2 shrink-0">
                {categoryDisplay}
              </Badge>
            )}
          </div>

          {menuItems.length > 0 && (
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <Dropdown
                align="right"
                trigger={
                  <button
                    type="button"
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                }
                items={menuItems}
              />
            </div>
          )}
        </div>

        {/* Product Name */}
        <h4
          onClick={onClick}
          className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 cursor-pointer"
        >
          {product.name}
        </h4>

        {/* Expiry & Location details */}
        <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          {product.storage_location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{product.storage_location}</span>
            </div>
          )}
          {product.expiry_date && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>Exp: {product.expiry_date}</span>
              </span>
              <StatusBadge type="expiry" daysUntilExpiry={daysUntilExpiry} />
            </div>
          )}
        </div>
      </div>

      {/* Footer details */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <div className="text-xs">
          <span className="text-slate-400">Qty: </span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {product.quantity} {product.unit}
          </span>
        </div>
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(product.purchase_price ?? product.mrp ?? 0)}
        </div>
      </div>
    </Card>
  )
}
