'use client'

import * as React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ProductWithMeta } from '@/types'
import { ConsumptionService, ProductService } from '@/lib/services'
import { useToast } from '@/components/ui/Toast'
import { TrendingDown, AlertCircle } from 'lucide-react'

export interface ConsumeModalProps {
  isOpen: boolean
  onClose: () => void
  product?: ProductWithMeta | null
  onSuccess?: () => void
}

export function ConsumeModal({ isOpen, onClose, product, onSuccess }: ConsumeModalProps) {
  const { success, error } = useToast()
  const [availableProducts, setAvailableProducts] = React.useState<ProductWithMeta[]>([])
  const [selectedProductId, setSelectedProductId] = React.useState<string>('')
  const [quantity, setQuantity] = React.useState<number>(1)
  const [note, setNote] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)

  // Load products if none preselected
  React.useEffect(() => {
    if (isOpen && !product) {
      let isMounted = true
      ProductService.getProducts({ stockStatus: 'IN_STOCK', isArchived: false }).then((items) => {
        if (!isMounted) return
        setAvailableProducts(items)
        if (items.length > 0) {
          setSelectedProductId(items[0].id)
        }
      })
      return () => {
        isMounted = false
      }
    }
  }, [isOpen, product])

  const activeProduct = product || availableProducts.find((p) => p.id === selectedProductId) || null

  const handleClose = () => {
    setQuantity(1)
    setNote('')
    setValidationError(null)
    onClose()
  }

  if (!isOpen) return null

  const handleConsume = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProduct) {
      setValidationError('Please select a product to consume')
      return
    }
    if (quantity <= 0) {
      setValidationError('Quantity must be greater than 0')
      return
    }
    if (quantity > activeProduct.quantity) {
      setValidationError(
        `Cannot consume more than available stock (${activeProduct.quantity} ${activeProduct.unit})`
      )
      return
    }

    setIsSubmitting(true)
    setValidationError(null)

    try {
      await ConsumptionService.recordConsumption({
        user_id: activeProduct.user_id,
        product_id: activeProduct.id,
        quantity,
        note: note.trim() || null,
        consumed_at: new Date().toISOString(),
      })

      success(
        'Consumption Recorded',
        `Successfully logged ${quantity} ${activeProduct.unit} of ${activeProduct.name}. Inventory updated.`
      )
      onSuccess?.()
      handleClose()
    } catch (err) {
      error('Failed to Record Consumption', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" title="Log Product Consumption">
      <form onSubmit={handleConsume} className="space-y-4">
        {/* Product selector if not preselected */}
        {!product && (
          <Select
            label="Select Item from Inventory *"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            options={availableProducts.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.quantity} ${p.unit} in stock)`,
            }))}
          />
        )}

        {/* Product Summary Header */}
        {activeProduct && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {activeProduct.name}
            </h4>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Current In Stock:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {activeProduct.quantity} {activeProduct.unit}
              </span>
            </div>
          </div>
        )}

        {validationError && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{validationError}</span>
          </div>
        )}

        <Input
          label={`Quantity to Consume ${activeProduct ? `(${activeProduct.unit})` : ''} *`}
          type="number"
          step="any"
          min={0.1}
          max={activeProduct ? activeProduct.quantity : undefined}
          value={quantity}
          onChange={(e) => {
            const val = parseFloat(e.target.value) || 0
            setQuantity(val)
            if (activeProduct && val > activeProduct.quantity) {
              setValidationError(`Max available: ${activeProduct.quantity} ${activeProduct.unit}`)
            } else {
              setValidationError(null)
            }
          }}
          required
        />

        <Input
          label="Consumption Note / Reason (Optional)"
          placeholder="e.g. Prepared for lunch, shared with team"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<TrendingDown className="h-4 w-4" />}
            disabled={!activeProduct || activeProduct.quantity <= 0}
          >
            Confirm Depletion
          </Button>
        </div>
      </form>
    </Modal>
  )
}
