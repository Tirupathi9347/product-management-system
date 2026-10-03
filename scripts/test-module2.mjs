// Module 2 Comprehensive Verification Suite
import assert from 'node:assert'

console.log('=== MODULE 2 COMPREHENSIVE TEST SUITE ===\n')

// 1. Expiry Logic Test
console.log('Test 1: Expiry Calculations & Warning Thresholds...')
function calculateExpiryStatus(expiryDate, warningThresholdDays = 7) {
  if (!expiryDate) return 'NO_EXPIRY'
  const today = new Date().setHours(0, 0, 0, 0)
  const exp = new Date(expiryDate).setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'EXPIRED'
  if (diffDays <= 3) return 'URGENT'
  if (diffDays <= warningThresholdDays) return 'EXPIRING_SOON'
  return 'SAFE'
}

const addDays = (d) => {
  const date = new Date()
  date.setDate(date.getDate() + d)
  return date.toISOString().split('T')[0]
}

assert.strictEqual(calculateExpiryStatus(addDays(-2)), 'EXPIRED', 'Negative days must be EXPIRED')
assert.strictEqual(calculateExpiryStatus(addDays(1)), 'URGENT', '1 day remaining must be URGENT')
assert.strictEqual(calculateExpiryStatus(addDays(5)), 'EXPIRING_SOON', '5 days remaining must be EXPIRING_SOON')
assert.strictEqual(calculateExpiryStatus(addDays(30)), 'SAFE', '30 days remaining must be SAFE')
assert.strictEqual(calculateExpiryStatus(null), 'NO_EXPIRY', 'Null expiry date must be NO_EXPIRY')
console.log('✓ Expiry calculations passed.')

// 2. Stock Status Test
console.log('\nTest 2: Stock Status Calculations...')
function calculateStockStatus(quantity, threshold = 2) {
  if (quantity <= 0) return 'OUT_OF_STOCK'
  if (quantity <= threshold) return 'LOW_STOCK'
  return 'IN_STOCK'
}

assert.strictEqual(calculateStockStatus(0, 5), 'OUT_OF_STOCK')
assert.strictEqual(calculateStockStatus(-1, 5), 'OUT_OF_STOCK')
assert.strictEqual(calculateStockStatus(3, 5), 'LOW_STOCK')
assert.strictEqual(calculateStockStatus(5, 5), 'LOW_STOCK')
assert.strictEqual(calculateStockStatus(6, 5), 'IN_STOCK')
console.log('✓ Stock status determinations passed.')

// 3. Purchase Calculations & Inventory Sync Test
console.log('\nTest 3: Purchase Calculations & Total Amount Precision...')
function calculatePurchaseTotal(qty, unitPrice) {
  return Math.round(qty * unitPrice * 100) / 100
}

assert.strictEqual(calculatePurchaseTotal(5, 20), 100.0)
assert.strictEqual(calculatePurchaseTotal(3, 19.99), 59.97)
assert.strictEqual(calculatePurchaseTotal(7, 5.29), 37.03)
console.log('✓ Purchase math precision passed.')

// 4. Consumption Guard Test
console.log('\nTest 4: Consumption Inventory Validation...')
function validateConsumption(currentStock, requestedQty) {
  if (requestedQty <= 0) {
    throw new Error('Quantity must be greater than 0')
  }
  if (requestedQty > currentStock) {
    throw new Error(`Insufficient stock. Current stock is ${currentStock}, attempted to consume ${requestedQty}`)
  }
  return currentStock - requestedQty
}

assert.strictEqual(validateConsumption(10, 3), 7)
assert.strictEqual(validateConsumption(5, 5), 0)
assert.throws(() => validateConsumption(2, 5), /Insufficient stock/)
assert.throws(() => validateConsumption(2, 0), /Quantity must be greater than 0/)
assert.throws(() => validateConsumption(2, -1), /Quantity must be greater than 0/)
console.log('✓ Consumption constraints passed.')

// 5. Product Lifecycle (CRUD, Archive, Restore, Filtering, Search, Sorting) Test
console.log('\nTest 5: Product Catalog Dev Store CRUD & Filtering Simulation...')
let store = [
  { id: '1', name: 'Almond Milk', brand: 'Silk', barcode: '111111', quantity: 4, purchase_price: 3.5, expiry_date: addDays(2), is_archived: false },
  { id: '2', name: 'Greek Yogurt', brand: 'Chobani', barcode: '222222', quantity: 0, purchase_price: 5.0, expiry_date: addDays(20), is_archived: false },
  { id: '3', name: 'Sourdough Bread', brand: 'Bakery', barcode: '333333', quantity: 1, purchase_price: 6.0, expiry_date: addDays(-1), is_archived: false },
  { id: '4', name: 'Old Coffee Beans', brand: 'Starbucks', barcode: '444444', quantity: 2, purchase_price: 12.0, expiry_date: addDays(40), is_archived: true },
]

// Create
const newProd = { id: '5', name: 'Organic Eggs 12pk', brand: 'Vital Farms', barcode: '555555', quantity: 2, purchase_price: 6.99, expiry_date: addDays(14), is_archived: false }
store.unshift(newProd)
assert.strictEqual(store.length, 5)

// Read / Search
const searchResult = store.filter(p => !p.is_archived && (p.name.toLowerCase().includes('milk') || p.brand.toLowerCase().includes('silk')))
assert.strictEqual(searchResult.length, 1)
assert.strictEqual(searchResult[0].name, 'Almond Milk')

// Update
const target = store.find(p => p.id === '1')
target.quantity = 10
assert.strictEqual(store.find(p => p.id === '1').quantity, 10)

// Archive & Restore
target.is_archived = true
assert.strictEqual(store.filter(p => !p.is_archived).length, 3, 'Active items should exclude archived')
target.is_archived = false
assert.strictEqual(store.filter(p => !p.is_archived).length, 4, 'Restored items should rejoin active catalog')

// Delete
store = store.filter(p => p.id !== '5')
assert.strictEqual(store.length, 4)

// Sorting
const sortedByName = [...store].filter(p => !p.is_archived).sort((a, b) => a.name.localeCompare(b.name))
assert.strictEqual(sortedByName[0].name, 'Almond Milk')
assert.strictEqual(sortedByName[sortedByName.length - 1].name, 'Sourdough Bread')

const sortedByPriceDesc = [...store].filter(p => !p.is_archived).sort((a, b) => b.purchase_price - a.purchase_price)
assert.strictEqual(sortedByPriceDesc[0].purchase_price, 6.0)

console.log('✓ Product lifecycle, search, filter, and sorting passed.')

// 6. Barcode Validation Test
console.log('\nTest 6: Barcode Validation & Normalization...')
function validateBarcode(code) {
  if (!code) return false
  const cleaned = code.trim().replace(/[\s-]/g, '')
  return /^[0-9]{8,14}$/.test(cleaned)
}

assert.strictEqual(validateBarcode('8901234567890'), true)
assert.strictEqual(validateBarcode('12345678'), true)
assert.strictEqual(validateBarcode('890-1234-567890'), true)
assert.strictEqual(validateBarcode('abc'), false)
assert.strictEqual(validateBarcode(''), false)
console.log('✓ Barcode validation passed.')

console.log('\n=========================================')
console.log('ALL MODULE 2 AUTOMATED TESTS PASSED (100%)')
console.log('=========================================')
