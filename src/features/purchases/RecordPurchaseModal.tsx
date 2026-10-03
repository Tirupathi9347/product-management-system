'use client'

import * as React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ProductWithMeta } from '@/types'
import { PurchaseService, ProductService } from '@/lib/services'
import { useToast } from '@/components/ui/Toast'
import { Calendar, Store, Plus } from 'lucide-react'

export interface RecordPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  product?: ProductWithMeta | null
  preselectedProduct?: ProductWithMeta | null
  onSuccess?: () => void
}

export function RecordPurchaseModal({
  isOpen,
  onClose,
  product,
  preselectedProduct,
  onSuccess,
}: RecordPurchaseModalProps) {
  const targetProduct = product || preselectedProduct
  const { success, error } = useToast()
  const [products, setProducts] = React.useState<ProductWithMeta[]>([])
  const [selectedProductId, setSelectedProductId] = React.useState<string>('')
  const [quantity, setQuantity] = React.useState<number>(1)
  const [purchasePrice, setPurchasePrice] = React.useState<number>(0)
  const [purchaseDate, setPurchaseDate] = React.useState<string>(new Date().toISOString().split('T')[0])
  const [storeName, setStoreName] = React.useState<string>('')
  const [notes, setNotes] = React.useState<string>('')
  const [addToInventory, setAddToInventory] = React.useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      let isMounted = true
      ProductService.getProducts().then((data) => {
        if (!isMounted) return
        setProducts(data)
        if (targetProduct) {
          setSelectedProductId(targetProduct.id)
          setPurchasePrice(targetProduct.purchase_price ?? targetProduct.mrp ?? 0)
        } else if (data.length > 0) {
          setSelectedProductId(data[0].id)
          setPurchasePrice(data[0].purchase_price ?? data[0].mrp ?? 0)
        }
      })
      return () => {
        isMounted = false
      }
    }
  }, [isOpen, targetProduct])

  const totalAmount = Math.round(quantity * purchasePrice * 100) / 100

  const handleProductChange = (id: string) => {
    setSelectedProductId(id)
    const prod = products.find((p) => p.id === id)
    if (prod) {
      setPurchasePrice(prod.purchase_price ?? prod.mrp ?? 0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId) {
      error('Selection Required', 'Please select a product to record purchase for.')
      return
    }
    if (quantity <= 0) {
      error('Invalid Quantity', 'Purchase quantity must be greater than zero.')
      return
    }

    setIsSubmitting(true)
    try {
      const selectedProd = products.find((p) => p.id === selectedProductId)
      await PurchaseService.recordPurchase(
        {
          user_id: selectedProd?.user_id || 'dev-user-001',
          product_id: selectedProductId,
          quantity,
          purchase_price: purchasePrice,
          purchase_date: purchaseDate,
          store_name: storeName.trim() || null,
          notes: notes.trim() || null,
        },
        addToInventory
      )

      success(
        'Purchase Recorded',
        `Logged purchase of ${quantity} units for $${totalAmount.toFixed(2)}${addToInventory ? ' and synchronized inventory' : ''}.`
      )
      onSuccess?.()
      onClose()
    } catch (err) {
      error('Failed to Record Purchase', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Record Product Purchase">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Selection */}
        <Select
          label="Target Product *"
          value={selectedProductId}
          onChange={(e) => handleProductChange(e.target.value)}
          required
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.brand || 'Unbranded'}) — Current: {p.quantity} {p.unit}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Quantity Purchased *"
            type="number"
            min={0.1}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            required
          />
          <Input
            label="Unit Purchase Price ($) *"
            type="number"
            min={0}
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        {/* Total Calculation Display */}
        <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Total Acquisition Spend:
          </span>
          <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
            ${totalAmount.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Purchase Date *"
            type="date"
            leftIcon={<Calendar className="h-4 w-4" />}
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
          />
          <Input
            label="Store / Vendor / Supermarket"
            placeholder="e.g. Costco, Whole Foods, Amazon"
            leftIcon={<Store className="h-4 w-4" />}
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
        </div>

        <Input
          label="Notes / Invoice Number (Optional)"
          placeholder="Receipt #48291, Bulk discount applied"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Add to inventory explicit checkbox */}
        <div className="flex items-center gap-2.5 pt-1">
          <input
            id="add-to-inventory-check"
            type="checkbox"
            checked={addToInventory}
            onChange={(e) => setAddToInventory(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="add-to-inventory-check" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            Add purchased quantity ({quantity}) to current inventory stock
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Save Purchase Record
          </Button>
        </div>
      </form>
    </Modal>
  )
}
