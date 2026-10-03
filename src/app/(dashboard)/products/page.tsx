'use client'

import * as React from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ProductCard } from '@/features/products'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Dropdown } from '@/components/ui/Dropdown'
import { useToast } from '@/components/ui/Toast'
import { ProductService, getCategories } from '@/lib/services'
import { ConsumeModal } from '@/features/consumption'
import { RecordPurchaseModal } from '@/features/purchases'
import { ProductWithMeta, Category, ProductSortOption, StockStatus, ExpiryStatus } from '@/types'
import { formatCurrency, getDaysUntilExpiry } from '@/lib/utils/formatters'
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  RotateCcw,
  X,
  MoreVertical,
  Eye,
  Edit3,
  Utensils,
  ShoppingCart,
  Archive,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProductsPage() {
  const router = useRouter()
  const { success, error } = useToast()

  // Data states
  const [products, setProducts] = React.useState<ProductWithMeta[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Filter & Search states
  const [searchQuery, setSearchQuery] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('')
  const [selectedStock, setSelectedStock] = React.useState<string>('')
  const [selectedExpiry, setSelectedExpiry] = React.useState<string>('')
  const [sortBy, setSortBy] = React.useState<ProductSortOption>('newest')
  const [activeTab, setActiveTab] = React.useState<'active' | 'archived'>('active')
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid')

  // Modals
  const [consumeProduct, setConsumeProduct] = React.useState<ProductWithMeta | null>(null)
  const [purchaseProduct, setPurchaseProduct] = React.useState<ProductWithMeta | null>(null)
  const [deleteProduct, setDeleteProduct] = React.useState<ProductWithMeta | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch categories on mount
  React.useEffect(() => {
    let isMounted = true
    getCategories()
      .then((data) => {
        if (isMounted) setCategories(data)
      })
      .catch((err) => console.error('Failed to load categories:', err))
    return () => {
      isMounted = false
    }
  }, [])

  // Load products based on filters
  React.useEffect(() => {
    let isMounted = true
    ProductService.getProducts({
      search: debouncedSearch || undefined,
      categoryId: selectedCategory || undefined,
      stockStatus: (selectedStock as StockStatus) || undefined,
      expiryStatus: (selectedExpiry as ExpiryStatus) || undefined,
      sortBy: sortBy,
      isArchived: activeTab === 'archived',
    })
      .then((data) => {
        if (isMounted) {
          setProducts(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error loading products:', err)
          error('Failed to load products', 'Could not retrieve catalog records.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [debouncedSearch, selectedCategory, selectedStock, selectedExpiry, sortBy, activeTab, error])

  const refreshProducts = React.useCallback(async () => {
    try {
      const data = await ProductService.getProducts({
        search: debouncedSearch || undefined,
        categoryId: selectedCategory || undefined,
        stockStatus: (selectedStock as StockStatus) || undefined,
        expiryStatus: (selectedExpiry as ExpiryStatus) || undefined,
        sortBy: sortBy,
        isArchived: activeTab === 'archived',
      })
      setProducts(data)
    } catch (err) {
      console.error('Error refreshing products:', err)
    }
  }, [debouncedSearch, selectedCategory, selectedStock, selectedExpiry, sortBy, activeTab])

  // Action handlers
  const handleArchive = async (id: string, name: string) => {
    try {
      await ProductService.archiveProduct(id)
      success('Product Archived', `"${name}" has been moved to the archive.`)
      refreshProducts()
    } catch {
      error('Archive Failed', 'Could not archive this item.')
    }
  }

  const handleRestore = async (id: string, name: string) => {
    try {
      await ProductService.restoreProduct(id)
      success('Product Restored', `"${name}" is now active in your catalog.`)
      refreshProducts()
    } catch {
      error('Restore Failed', 'Could not restore this item.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return
    setIsDeleting(true)
    try {
      await ProductService.deleteProduct(deleteProduct.id)
      success('Product Deleted', `"${deleteProduct.name}" has been permanently removed.`)
      setDeleteProduct(null)
      refreshProducts()
    } catch {
      error('Delete Failed', 'Could not delete the product.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setDebouncedSearch('')
    setSelectedCategory('')
    setSelectedStock('')
    setSelectedExpiry('')
    setSortBy('newest')
  }

  const hasActiveFilters = Boolean(
    debouncedSearch || selectedCategory || selectedStock || selectedExpiry || sortBy !== 'newest'
  )

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Product Catalog"
        description="Manage your inventory catalog, barcodes, categories, and stock."
        action={
          <Link href="/products/new">
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Add Product
            </Button>
          </Link>
        }
      />

      {/* Active vs Archived Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Active Products {!isLoading && activeTab === 'active' && `(${products.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('archived')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'archived'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Archived {!isLoading && activeTab === 'archived' && `(${products.length})`}
          </button>
        </div>

        {/* View Toggle (Grid / Table) */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Grid View"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            title="Table View"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Input
            placeholder="Search by name, brand, barcode, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Category Filter */}
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          {/* Stock Filter */}
          <Select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            options={[
              { value: '', label: 'All Stock Levels' },
              { value: 'IN_STOCK', label: 'In Stock' },
              { value: 'LOW_STOCK', label: 'Low Stock' },
              { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
            ]}
          />

          {/* Expiry Filter */}
          <Select
            value={selectedExpiry}
            onChange={(e) => setSelectedExpiry(e.target.value)}
            options={[
              { value: '', label: 'All Expiry States' },
              { value: 'SAFE', label: 'Safe' },
              { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
              { value: 'URGENT', label: 'Urgent (≤3d)' },
              { value: 'EXPIRED', label: 'Expired' },
            ]}
          />

          {/* Sort Dropdown */}
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
            options={[
              { value: 'newest', label: 'Sort: Newest First' },
              { value: 'oldest', label: 'Sort: Oldest First' },
              { value: 'name_asc', label: 'Sort: Name (A-Z)' },
              { value: 'name_desc', label: 'Sort: Name (Z-A)' },
              { value: 'price_asc', label: 'Price: Low to High' },
              { value: 'price_desc', label: 'Price: High to Low' },
              { value: 'qty_asc', label: 'Quantity: Low to High' },
              { value: 'qty_desc', label: 'Quantity: High to Low' },
              { value: 'expiry_asc', label: 'Expiry: Soonest' },
              { value: 'expiry_desc', label: 'Expiry: Latest' },
            ]}
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            className="text-slate-500 shrink-0"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-medium">Active Filters:</span>
          {debouncedSearch && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: &quot;{debouncedSearch}&quot;
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {categories.find((c) => c.id === selectedCategory)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
            </Badge>
          )}
          {selectedStock && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Stock: {selectedStock.replace('_', ' ')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedStock('')} />
            </Badge>
          )}
          {selectedExpiry && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Expiry: {selectedExpiry.replace('_', ' ')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedExpiry('')} />
            </Badge>
          )}
        </div>
      )}

      {/* Products Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <div className="pt-2 flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Filter}
            title={hasActiveFilters ? 'No Matching Products' : 'No Products Cataloged'}
            description={
              hasActiveFilters
                ? 'Try broadening your search query or removing active status and category filters.'
                : 'Your catalog is empty. Start adding items to track quantities, expiry schedules, and purchase histories.'
            }
            actionLabel={hasActiveFilters ? 'Clear All Filters' : 'Add First Product'}
            onAction={hasActiveFilters ? handleClearFilters : () => router.push('/products/new')}
          />
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => router.push(`/products/${product.id}`)}
              onEdit={() => router.push(`/products/${product.id}/edit`)}
              onConsume={() => setConsumeProduct(product)}
              onPurchase={() => setPurchaseProduct(product)}
              onArchive={() => handleArchive(product.id, product.name)}
              onRestore={() => handleRestore(product.id, product.name)}
              onDelete={() => setDeleteProduct(product)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Expiry Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const daysUntilExpiry = getDaysUntilExpiry(product.expiry_date)
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                          {product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              {product.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/products/${product.id}`}
                            className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors"
                          >
                            {product.name}
                          </Link>
                          <div className="text-xs text-slate-400">
                            {product.brand || 'Unbranded'}{' '}
                            {product.barcode && `• ${product.barcode}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category?.name ? (
                        <Badge variant="secondary">{product.category.name}</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Uncategorized</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          type="stock"
                          quantity={product.quantity}
                          threshold={product.minimum_stock_level}
                        />
                        <span className="text-xs text-slate-500">
                          ({product.quantity} {product.unit})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(product.purchase_price ?? product.mrp ?? 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.expiry_date ? (
                        <div className="space-y-0.5">
                          <StatusBadge type="expiry" daysUntilExpiry={daysUntilExpiry} />
                          <div className="text-[10px] text-slate-400">{product.expiry_date}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No Expiry</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dropdown
                        align="right"
                        trigger={
                          <button
                            type="button"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                        items={[
                          {
                            label: 'View Specifications',
                            icon: <Eye className="h-4 w-4" />,
                            onClick: () => router.push(`/products/${product.id}`),
                          },
                          {
                            label: 'Edit Details',
                            icon: <Edit3 className="h-4 w-4" />,
                            onClick: () => router.push(`/products/${product.id}/edit`),
                          },
                          ...(product.quantity > 0
                            ? [
                                {
                                  label: 'Consume Units',
                                  icon: <Utensils className="h-4 w-4 text-emerald-500" />,
                                  onClick: () => setConsumeProduct(product),
                                },
                              ]
                            : []),
                          {
                            label: 'Record Purchase',
                            icon: <ShoppingCart className="h-4 w-4 text-indigo-500" />,
                            onClick: () => setPurchaseProduct(product),
                          },
                          { label: '', divider: true },
                          product.is_archived
                            ? {
                                label: 'Restore Item',
                                icon: <RotateCcw className="h-4 w-4 text-amber-500" />,
                                onClick: () => handleRestore(product.id, product.name),
                              }
                            : {
                                label: 'Archive Item',
                                icon: <Archive className="h-4 w-4 text-amber-500" />,
                                onClick: () => handleArchive(product.id, product.name),
                              },
                          {
                            label: 'Delete Permanently',
                            icon: <Trash2 className="h-4 w-4" />,
                            danger: true,
                            onClick: () => setDeleteProduct(product),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Quick Consume Modal */}
      <ConsumeModal
        isOpen={Boolean(consumeProduct)}
        onClose={() => setConsumeProduct(null)}
        product={consumeProduct}
        onSuccess={() => {
          setConsumeProduct(null)
          refreshProducts()
        }}
      />

      {/* Quick Record Purchase Modal */}
      <RecordPurchaseModal
        isOpen={Boolean(purchaseProduct)}
        onClose={() => setPurchaseProduct(null)}
        product={purchaseProduct}
        onSuccess={() => {
          setPurchaseProduct(null)
          refreshProducts()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteProduct)}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product?"
        message={
          deleteProduct
            ? `Are you sure you want to permanently delete "${deleteProduct.name}"? This action cannot be undone and will purge its stock levels and associations.`
            : ''
        }
        confirmText="Delete Product"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
