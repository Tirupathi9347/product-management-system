'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, ProductFormData } from '@/lib/validators'
import { UploadCloud, Save, ArrowLeft, Barcode, Calendar, Layers, X, RefreshCw, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import { getCategories, ProductService } from '@/lib/services'
import { uploadProductImage } from '@/lib/supabase/storage'
import { Category, ProductWithMeta } from '@/types'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const { success, error } = useToast()
  const id = params?.id as string

  const [categories, setCategories] = React.useState<Category[]>([])
  const [product, setProduct] = React.useState<ProductWithMeta | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Image Upload states
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = React.useState(false)

  // Tags
  const [tagInput, setTagInput] = React.useState('')
  const [tags, setTags] = React.useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  // Load initial product and categories
  React.useEffect(() => {
    let isMounted = true
    async function loadData() {
      if (!id) return
      try {
        const [cats, prod] = await Promise.all([
          getCategories(),
          ProductService.getProduct(id),
        ])
        if (!isMounted) return
        setCategories(cats)
        setProduct(prod)

        if (prod) {
          reset({
            name: prod.name,
            brand: prod.brand || '',
            barcode: prod.barcode || '',
            categoryId: prod.category_id || '',
            description: prod.description || '',
            quantity: prod.quantity,
            unit: prod.unit,
            mrp: prod.mrp ?? 0,
            purchasePrice: prod.purchase_price ?? 0,
            weight: prod.weight || '',
            manufacturingDate: prod.manufacturing_date || '',
            expiryDate: prod.expiry_date || '',
            purchaseDate: prod.purchase_date || '',
            batchNumber: prod.batch_number || '',
            storageLocation: prod.storage_location || '',
            minimumStockLevel: prod.minimum_stock_level,
            notes: prod.notes || '',
            tags: prod.tags || [],
          })
          setTags(prod.tags || [])
          setImagePreview(prod.image_url)
        }
      } catch (err) {
        console.error('Failed to load item for editing:', err)
        error('Loading Error', 'Could not retrieve product record.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [id, reset, error])

  // Image handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      error('Invalid File Type', 'Please upload a valid image file.')
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

  // Tags handlers
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

  const onSubmit = async (data: ProductFormData) => {
    if (!product) return
    setIsSubmitting(true)
    try {
      let finalImageUrl: string | null = imagePreview

      if (imageFile) {
        setIsUploadingImage(true)
        try {
          const uploadRes = await uploadProductImage(product.user_id, imageFile)
          finalImageUrl = uploadRes.publicUrl
        } catch (uploadErr) {
          console.warn('Storage upload error, using local fallback:', uploadErr)
        } finally {
          setIsUploadingImage(false)
        }
      }

      await ProductService.updateProduct(product.id, {
        name: data.name,
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
      })

      success('Product Updated', `Changes to "${data.name}" have been saved.`)
      router.push(`/products/${product.id}`)
    } catch (err: unknown) {
      console.error('Error updating product:', err)
      const message = err instanceof Error ? err.message : 'Failed to update product'
      error('Update Error', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <EmptyState
          icon={AlertTriangle}
          title="Product Not Found"
          description="The item you wish to edit does not exist or has been removed."
          actionLabel="Return to Catalog"
          onAction={() => router.push('/products')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <PageHeader
        title={`Edit ${product.name}`}
        description="Update inventory quantities, pricing valuation, batch numbers, or lifecycle schedules."
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: product.name, href: `/products/${product.id}` },
          { label: 'Edit' },
        ]}
        action={
          <Link href={`/products/${product.id}`}>
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Details
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SECTION A — BASIC INFORMATION */}
        <Card>
          <CardHeader>
            <CardTitle>Section A — Basic Information</CardTitle>
            <CardDescription>Primary identification, brand, and universal product codes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product Name *"
                placeholder="Product name"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Brand / Manufacturer"
                placeholder="Brand name"
                error={errors.brand?.message}
                {...register('brand')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Barcode / UPC / EAN"
                placeholder="Barcode"
                leftIcon={<Barcode className="h-4 w-4" />}
                error={errors.barcode?.message}
                {...register('barcode')}
              />

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
              placeholder="Product description and specifications..."
              {...register('description')}
            />
          </CardContent>
        </Card>

        {/* SECTION B — INVENTORY */}
        <Card>
          <CardHeader>
            <CardTitle>Section B — Inventory & Storage Configuration</CardTitle>
            <CardDescription>Stock levels, unit metrics, and minimum threshold alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Quantity in Stock *"
                type="number"
                step="any"
                error={errors.quantity?.message}
                {...register('quantity', { valueAsNumber: true })}
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
                {...register('minimumStockLevel', { valueAsNumber: true })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Storage Location"
                placeholder="e.g. Kitchen Pantry Shelf B"
                leftIcon={<Layers className="h-4 w-4" />}
                {...register('storageLocation')}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION C — PRICING */}
        <Card>
          <CardHeader>
            <CardTitle>Section C — Valuation & Pricing</CardTitle>
            <CardDescription>Track acquisition cost and retail prices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Purchase Price ($)"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.purchasePrice?.message}
                {...register('purchasePrice', { valueAsNumber: true })}
              />
              <Input
                label="MRP / Retail Value ($)"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.mrp?.message}
                {...register('mrp', { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION D — DATES */}
        <Card>
          <CardHeader>
            <CardTitle>Section D — Lifecycle & Expiry Schedule</CardTitle>
            <CardDescription>Timeline milestones used to calculate freshness</CardDescription>
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
            <CardTitle>Section E — Lot Identification & Metadata</CardTitle>
            <CardDescription>Weight measurements, batch tracking, and indexing tags</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Net Weight / Volume"
                placeholder="e.g. 500g, 1.5L"
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
                  placeholder="e.g. organic, breakfast (Press Add)"
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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
              label="Operational Notes & Specifications"
              placeholder="Allergen notices, refrigeration constraints..."
              {...register('notes')}
            />
          </CardContent>
        </Card>

        {/* SECTION F — IMAGE */}
        <Card>
          <CardHeader>
            <CardTitle>Section F — Product Photography</CardTitle>
            <CardDescription>Replace or update visual assets stored in storage</CardDescription>
          </CardHeader>
          <CardContent>
            {imagePreview ? (
              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 flex flex-col items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="max-h-64 rounded-xl object-contain shadow-xs"
                />
                <div className="mt-4 flex items-center gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors">
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
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-indigo-500/50 cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex flex-col items-center text-center">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-xs">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to upload product image
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Link href={`/products/${product.id}`}>
            <Button variant="outline" type="button" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            isLoading={isSubmitting || isUploadingImage}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
