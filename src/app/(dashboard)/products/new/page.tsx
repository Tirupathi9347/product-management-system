'use client'

import * as React from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, ProductFormData } from '@/lib/validators'
import { UploadCloud, Save, ArrowLeft, Calendar, Layers, X, Hash, RefreshCw, Cpu } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { getCategories, ProductService } from '@/lib/services'
import { uploadProductImage } from '@/lib/supabase/storage'
import { AIScannerModal } from '@/features/scanner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/features/auth/AuthContext'
import { Category, AIExtractionResult } from '@/types'

function NewProductContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success, error } = useToast()
  const { user } = useAuth()

  // Entry Mode: Manual vs AI Scan
  const [entryMode, setEntryMode] = React.useState<'manual' | 'ai'>('manual')
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(() => user?.id || null)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Image Upload states - initialize from query params if available
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(
    () => searchParams.get('image_url')
  )
  const [isUploadingImage, setIsUploadingImage] = React.useState(false)

  // AI Scanner Modal
  const [aiModalOpen, setAiModalOpen] = React.useState(false)

  // Tags input
  const [tagInput, setTagInput] = React.useState('')
  const [tags, setTags] = React.useState<string[]>([])

  // Load categories and current auth user
  React.useEffect(() => {
    let active = true
    getCategories().then((cats) => {
      if (active) setCategories(cats)
    }).catch(console.error)

    if (user?.id) {
      setCurrentUserId(user.id)
    }

    // Fetch the real authenticated user ID from Supabase if not in context
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (active && data?.user?.id) {
        setCurrentUserId(data.user.id)
      }
    }).catch(() => {})

    return () => {
      active = false
    }
  }, [user])

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: searchParams.get('name') || '',
      brand: searchParams.get('brand') || '',
      barcode: searchParams.get('barcode') || '',
      categoryId: searchParams.get('categoryId') || searchParams.get('category_id') || '',
      description: searchParams.get('description') || '',
      quantity: searchParams.get('quantity') ? Number(searchParams.get('quantity')) : 1,
      unit: searchParams.get('unit') || 'pcs',
      mrp: searchParams.get('mrp') ? Number(searchParams.get('mrp')) : 0,
      purchasePrice: searchParams.get('purchase_price') || searchParams.get('purchasePrice') ? Number(searchParams.get('purchase_price') || searchParams.get('purchasePrice')) : 0,
      weight: searchParams.get('weight') || '',
      manufacturingDate: searchParams.get('manufacturing_date') || searchParams.get('manufacturingDate') || '',
      expiryDate: searchParams.get('expiry_date') || searchParams.get('expiryDate') || '',
      purchaseDate: searchParams.get('purchase_date') || searchParams.get('purchaseDate') || new Date().toISOString().split('T')[0],
      batchNumber: searchParams.get('batch_number') || searchParams.get('batchNumber') || '',
      storageLocation: searchParams.get('storageLocation') || '',
      minimumStockLevel: searchParams.get('minimumStockLevel') ? Number(searchParams.get('minimumStockLevel')) : 1,
      notes: searchParams.get('notes') || '',
      tags: [],
    },
  })

  // Handle image selection
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      error('Invalid File Type', 'Please upload a valid image file (PNG, JPG, WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      error('File Too Large', 'Maximum image upload size is 5MB.')
      return
    }

    setImageFile(file)
    const localUrl = URL.createObjectURL(file)
    setImagePreview(localUrl)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  // Tags management
  const handleAddTag = () => {
    if (!tagInput.trim()) return
    const trimmed = tagInput.trim().toLowerCase()
    if (!tags.includes(trimmed)) {
      const nextTags = [...tags, trimmed]
      setTags(nextTags)
      setValue('tags', nextTags)
    }
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove)
    setTags(nextTags)
    setValue('tags', nextTags)
  }

  // Handle AI extraction apply
  const handleApplyAIResult = (result: AIExtractionResult, file?: File) => {
    const opts = { shouldDirty: true, shouldTouch: true } as const

    if (result.product_name) setValue('name', result.product_name, opts)
    if (result.brand) setValue('brand', result.brand, opts)
    if (result.barcode) setValue('barcode', result.barcode, opts)
    if (result.mrp !== null && result.mrp !== undefined) setValue('mrp', Number(result.mrp), opts)
    if (result.purchase_price !== null && result.purchase_price !== undefined) setValue('purchasePrice', Number(result.purchase_price), opts)
    if (result.weight) setValue('weight', result.weight, opts)
    if (result.unit) setValue('unit', result.unit, opts)
    if (result.expiry_date) setValue('expiryDate', result.expiry_date, opts)
    if (result.manufacturing_date) setValue('manufacturingDate', result.manufacturing_date, opts)
    if (result.batch_number) setValue('batchNumber', result.batch_number, opts)
    if (result.description) setValue('description', result.description, opts)

    // Store scanned image file and preview
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }

    // Category matching if possible
    if (result.category) {
      const match = categories.find((c) =>
        c.name.toLowerCase().includes(result.category?.toLowerCase() || '')
      )
      if (match) setValue('categoryId', match.id, opts)
    }

    setEntryMode('manual')

    // If name was not extracted, warn user they must fill it manually
    if (!result.product_name) {
      error(
        'Product Name Required',
        'AI extracted details, but Product Name is blank. Please enter the Product Name in the form before saving.'
      )
    } else {
      success('AI Extraction Applied', 'Fields populated into form! Review and click "Save Product to Catalog".')
    }

    // Scroll the name field into view so user sees it immediately
    setTimeout(() => {
      const nameField = document.querySelector<HTMLElement>('input[name="name"]')
      if (nameField) {
        nameField.scrollIntoView({ behavior: 'smooth', block: 'center' })
        nameField.focus()
      }
    }, 200)
  }

  // Handle direct save from the AI Scanner modal review card
  const handleDirectSaveFromModal = async (result: AIExtractionResult, file?: File) => {
    if (!result.product_name?.trim()) {
      error('Product Name Required', 'Please enter a product name in the review card before saving.')
      return
    }

    const finalUserId = currentUserId || user?.id || '00000000-0000-0000-0000-000000000001'
    let finalImageUrl: string | null = null

    if (file) {
      try {
        const uploadRes = await uploadProductImage(finalUserId, file)
        finalImageUrl = uploadRes.publicUrl
      } catch {
        finalImageUrl = URL.createObjectURL(file)
      }
    }

    let categoryId: string | null = null
    if (result.category) {
      const match = categories.find((c) =>
        c.name.toLowerCase().includes(result.category?.toLowerCase() || '')
      )
      if (match) categoryId = match.id
    }

    await ProductService.createProduct({
      user_id: finalUserId,
      name: result.product_name.trim(),
      brand: result.brand || null,
      category_id: categoryId,
      barcode: result.barcode || null,
      image_url: finalImageUrl,
      description: result.description || null,
      quantity: 1,
      unit: result.unit || 'pcs',
      mrp: result.mrp ? Number(result.mrp) : null,
      purchase_price: result.purchase_price ? Number(result.purchase_price) : null,
      weight: result.weight || null,
      manufacturing_date: result.manufacturing_date || null,
      expiry_date: result.expiry_date || null,
      purchase_date: new Date().toISOString().split('T')[0],
      batch_number: result.batch_number || null,
      storage_location: null,
      minimum_stock_level: 1,
      tags: [],
      notes: null,
      is_archived: false,
    })

    setAiModalOpen(false)
    success('Product Created', `"${result.product_name}" was successfully saved to your catalog.`)
    router.push('/products')
  }

  // Called when react-hook-form validation fails (e.g. name is empty)
  const onValidationError = () => {
    error(
      'Missing Required Fields',
      'Please fill in the Product Name (and any starred fields) before saving.'
    )
    // Scroll to the first visible error field
    setTimeout(() => {
      const firstError = document.querySelector<HTMLElement>('[data-rhf-error], input:invalid, .border-red-500, [aria-invalid="true"]')
      const nameField = document.querySelector<HTMLElement>('input[name="name"]')
      const target = firstError || nameField
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        target.focus()
      }
    }, 100)
  }

  // Submit Handler
  const onSubmit = async (data: ProductFormData) => {
    const finalUserId = currentUserId || user?.id || '00000000-0000-0000-0000-000000000001'

    setIsSubmitting(true)
    try {
      let finalImageUrl: string | null = imagePreview

      // If user selected a new file, upload to storage
      if (imageFile) {
        setIsUploadingImage(true)
        try {
          const uploadRes = await uploadProductImage(finalUserId, imageFile)
          finalImageUrl = uploadRes.publicUrl
        } catch (uploadErr) {
          console.warn('Storage upload error, using local fallback:', uploadErr)
        } finally {
          setIsUploadingImage(false)
        }
      }

      await ProductService.createProduct({
        user_id: finalUserId,
        name: data.name.trim(),
        brand: data.brand || null,
        category_id: data.categoryId || null,
        barcode: data.barcode || null,
        image_url: finalImageUrl,
        description: data.description || null,
        quantity: data.quantity,
        unit: data.unit,
        mrp: data.mrp ?? null,
        purchase_price: data.purchasePrice ?? null,
        weight: data.weight || null,
        manufacturing_date: data.manufacturingDate || null,
        expiry_date: data.expiryDate || null,
        purchase_date: data.purchaseDate || null,
        batch_number: data.batchNumber || null,
        storage_location: data.storageLocation || null,
        minimum_stock_level: data.minimumStockLevel,
        tags: tags,
        notes: data.notes || null,
        is_archived: false,
      })

      success('Product Created', `"${data.name}" was successfully added to your catalog.`)
      router.push('/products')
    } catch (err: unknown) {
      console.error('Error saving product:', err)
      const message = err instanceof Error ? err.message : 'Failed to register product.'
      error('Creation Error', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <PageHeader
        title="Add New Product"
        description="Add a new item to your catalog, set stock thresholds, and configure expiration tracking."
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: 'New Product' },
        ]}
        action={
          <Link href="/products">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Catalog
            </Button>
          </Link>
        }
      />

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setEntryMode('manual')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            entryMode === 'manual'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Manual Entry</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEntryMode('ai')
            setAiModalOpen(true)
          }}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            entryMode === 'ai'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <div className="flex flex-col items-start leading-tight text-left">
            <span className="font-semibold text-xs">OCR Extraction</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">by model YOLOv8</span>
          </div>
        </button>
      </div>

      {/* Guided Banner for OCR Extraction mode */}
      {entryMode === 'ai' && (
        <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Cpu className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>OCR Extraction</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">by model YOLOv8</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan or upload product packaging to extract printed manufacturing dates and expiration dates.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setAiModalOpen(true)} leftIcon={<Cpu className="h-4 w-4" />}>
            Open OCR Scanner
          </Button>
        </div>
      )}

      {/* MANUAL ENTRY FORM */}
      <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-6">
        {/* BASIC INFORMATION */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Product name, brand, category, and barcode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product Name *"
                placeholder="e.g. Organic Almond Milk 1L"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Brand / Manufacturer"
                placeholder="e.g. Silk, Nestle, Chobani"
                error={errors.brand?.message}
                {...register('brand')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Input
                  label="Barcode / UPC / EAN"
                  placeholder="Scan or enter code"
                  leftIcon={<Hash className="h-4 w-4" />}
                  error={errors.barcode?.message}
                  {...register('barcode')}
                />
              </div>

              <Select
                label="Product Category"
                {...register('categoryId')}
                options={[
                  { value: '', label: 'Select Category...' },
                  ...categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                ]}
              />
            </div>

            <Textarea
              label="Description"
              placeholder="Flavor profile, packaging format, organic certification, allergens..."
              {...register('description')}
            />
          </CardContent>
        </Card>

        {/* SECTION B — INVENTORY */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory & Storage</CardTitle>
            <CardDescription>Stock count, unit of measurement, and threshold alerting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Quantity in Stock *"
                type="number"
                step="any"
                error={errors.quantity?.message}
                {...register('quantity', {
                  setValueAs: (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? 1 : Number(v)),
                })}
              />
              <Input
                label="Unit of Measure *"
                placeholder="pcs, bottles, kg, tubs, boxes"
                error={errors.unit?.message}
                {...register('unit')}
              />
              <Input
                label="Min Stock Threshold *"
                type="number"
                error={errors.minimumStockLevel?.message}
                {...register('minimumStockLevel', {
                  setValueAs: (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? 1 : Number(v)),
                })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Storage Location"
                placeholder="e.g. Pantry Shelf B, Top Refrigerator Shelf, Kitchen Cabinet"
                leftIcon={<Layers className="h-4 w-4" />}
                {...register('storageLocation')}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION C — PRICING */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Acquisition cost and retail price</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Purchase Price (₹)"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.purchasePrice?.message}
                {...register('purchasePrice', {
                  setValueAs: (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v)),
                })}
              />
              <Input
                label="MRP / Retail Value (₹)"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.mrp?.message}
                {...register('mrp', {
                  setValueAs: (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v)),
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION D — DATES */}
        <Card>
          <CardHeader>
            <CardTitle>Dates & Expiry</CardTitle>
            <CardDescription>Purchase, manufacturing, and expiration dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Purchase Date"
                type="date"
                leftIcon={<Calendar className="h-4 w-4" />}
                {...register('purchaseDate')}
              />
              <Input
                label="Manufacturing Date"
                type="date"
                leftIcon={<Calendar className="h-4 w-4" />}
                {...register('manufacturingDate')}
              />
              <Input
                label="Expiry Date"
                type="date"
                leftIcon={<Calendar className="h-4 w-4" />}
                {...register('expiryDate')}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION E — IDENTIFICATION & TAGS */}
        <Card>
          <CardHeader>
            <CardTitle>Batch & Details</CardTitle>
            <CardDescription>Weight measurements, batch tracking, and indexing tags</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Net Weight / Volume"
                placeholder="e.g. 500g, 1.5L, 32oz, 120 capsules"
                {...register('weight')}
              />
              <Input
                label="Batch / Lot Number"
                placeholder="e.g. LOT-2026-X89"
                {...register('batchNumber')}
              />
            </div>

            {/* Tags input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Product Tags
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. organic, breakfast, gluten-free (Press Add)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add Tag
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      #{tag}
                      <X
                        className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Textarea
              label="Notes & Remarks"
              placeholder="Allergen notices, refrigeration constraints, reorder notes..."
              {...register('notes')}
            />
          </CardContent>
        </Card>

        {/* SECTION F — IMAGE */}
        <Card>
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
            <CardDescription>
              Upload or attach a photo of the product packaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            {imagePreview ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 flex flex-col items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="max-h-64 rounded-lg object-contain shadow-xs"
                />
                <div className="mt-4 flex items-center gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Replace Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex flex-col items-center text-center">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-3">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to upload product image
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    PNG, JPG, WebP up to 5MB
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Link href="/products">
            <Button variant="outline" type="button" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            isLoading={isSubmitting || isUploadingImage}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Product
          </Button>
        </div>
      </form>


      {/* AI Scanner Viewport Modal */}
      <AIScannerModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onApplyExtraction={handleApplyAIResult}
        onSaveDirectly={handleDirectSaveFromModal}
      />
    </div>
  )
}

export default function NewProductPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-slate-400">Loading catalog authoring form...</div>
      }
    >
      <NewProductContent />
    </React.Suspense>
  )
}
