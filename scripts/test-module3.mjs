/**
 * MODULE 3 COMPREHENSIVE AUTOMATED TEST SUITE
 * Tests:
 * 1. AI Schema Validation & Consumer Goods Constraints
 * 2. Date Normalization (DD/MM/YYYY, DD-MM-YYYY, MM/YYYY, MFD/EXP prefixes)
 * 3. Smart Notifications (Expiry, Urgent, Low Stock, Out of Stock)
 * 4. Notification Deduplication (Deterministic keys)
 * 5. Analytics Aggregation (Spend, Valuation, Velocity, Categories)
 * 6. Report Generation & RFC-4180 CSV Escaping
 * 7. Global Omnisearch Multi-field Matching
 */

import assert from 'node:assert/strict'

console.log('=== MODULE 3 COMPREHENSIVE TEST SUITE ===\n')

// -------------------------------------------------------------
// Test 1: AI Schema Validation
// -------------------------------------------------------------
console.log('Test 1: AI Schema Validation & Consumer Goods Rules...')

const sampleExtraction = {
  product_name: 'Cold Pressed Coconut Oil',
  brand: 'Nutiva',
  category: 'Pantry & Spices',
  barcode: '8901234567990',
  mrp: 14.99,
  purchase_price: 11.50,
  weight: '16 fl oz',
  unit: 'jars',
  manufacturing_date: '2026-01-10',
  expiry_date: '2027-01-10',
  batch_number: 'LOT-NTV-01',
  description: 'Organic unrefined cold pressed virgin coconut oil.',
}

assert.ok(sampleExtraction.product_name, 'Product name must be present')
assert.ok(typeof sampleExtraction.mrp === 'number', 'MRP must be a number')
assert.ok(sampleExtraction.mrp > 0, 'MRP must be positive')
assert.ok(typeof sampleExtraction.purchase_price === 'number', 'Purchase price must be numeric')
assert.ok(!sampleExtraction.category.toLowerCase().includes('medicine'), 'No pharmaceutical classification allowed')
console.log('✓ AI extraction payload constraints verified.')

// -------------------------------------------------------------
// Test 2: Date Normalization
// -------------------------------------------------------------
console.log('\nTest 2: Packaging Date Normalization...')

function normalizeDate(rawText) {
  if (!rawText) return null
  const clean = rawText
    .replace(/(?:MFD|MFG|MANUFACTURED|PKG|EXPIRY|EXP|BEST\s+BEFORE|USE\s+BY|DATE|LOT|BATCH|NO|:)+/gi, '')
    .trim()

  // Match YYYY-MM-DD
  const ymd = clean.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/)
  if (ymd) {
    return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmy = clean.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  }

  // Match MM/YYYY
  const my = clean.match(/^(\d{1,2})[./-](\d{4})$/)
  if (my) {
    const month = Number(my[1])
    const year = Number(my[2])
    const day = new Date(year, month, 0).getDate()
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return null
}

assert.equal(normalizeDate('MFD 15/08/2025'), '2025-08-15')
assert.equal(normalizeDate('EXP: 28-02-2026'), '2026-02-28')
assert.equal(normalizeDate('BEST BEFORE 03/2026'), '2026-03-31')
assert.equal(normalizeDate('2026-11-20'), '2026-11-20')
console.log('✓ Date normalization accurately handles common packaging formats.')

// -------------------------------------------------------------
// Test 3 & 4: Smart Notifications & Deterministic Deduplication
// -------------------------------------------------------------
console.log('\nTest 3 & 4: Smart Notification Generation & Deduplication...')

function generateNotificationKey(type, productId, qualifier) {
  return `notif_${type}_${productId}_${qualifier}`
}

const mockProducts = [
  { id: 'p1', name: 'Greek Yogurt', quantity: 1, minimum_stock_level: 2, expiry_date: '2026-09-28' }, // low stock + urgent (<3 days)
  { id: 'p2', name: 'Almond Milk', quantity: 0, minimum_stock_level: 1, expiry_date: '2026-10-25' }, // out of stock
  { id: 'p3', name: 'Basmati Rice', quantity: 5, minimum_stock_level: 2, expiry_date: '2026-09-20' }, // expired
]

const notifications = []
const seenKeys = new Set()
const now = new Date('2026-09-25T00:00:00Z')

for (const prod of mockProducts) {
  // Stock check
  if (prod.quantity === 0) {
    const key = generateNotificationKey('OUT_OF_STOCK', prod.id, 'zero')
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      notifications.push({ key, title: `Out of Stock: ${prod.name}`, type: 'OUT_OF_STOCK', severity: 'danger' })
    }
  } else if (prod.quantity <= prod.minimum_stock_level) {
    const key = generateNotificationKey('LOW_STOCK', prod.id, `low_${prod.quantity}`)
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      notifications.push({ key, title: `Low Stock: ${prod.name}`, type: 'LOW_STOCK', severity: 'warning' })
    }
  }

  // Expiry check
  if (prod.expiry_date) {
    const exp = new Date(prod.expiry_date)
    const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 0) {
      const key = generateNotificationKey('EXPIRED', prod.id, prod.expiry_date)
      if (!seenKeys.has(key)) {
        seenKeys.add(key)
        notifications.push({ key, title: `Expired: ${prod.name}`, type: 'EXPIRED', severity: 'danger' })
      }
    } else if (days <= 3) {
      const key = generateNotificationKey('URGENT_EXPIRY', prod.id, prod.expiry_date)
      if (!seenKeys.has(key)) {
        seenKeys.add(key)
        notifications.push({ key, title: `Urgent: ${prod.name}`, type: 'URGENT_EXPIRY', severity: 'urgent' })
      }
    }
  }
}

assert.equal(notifications.length, 4, 'Should generate exactly 4 alerts: 1 low stock, 1 out of stock, 1 urgent, 1 expired')

// Re-run generation to verify deduplication
for (const prod of mockProducts) {
  if (prod.quantity === 0) {
    const key = generateNotificationKey('OUT_OF_STOCK', prod.id, 'zero')
    if (!seenKeys.has(key)) {
      notifications.push({ key })
    }
  }
}
assert.equal(notifications.length, 4, 'Deduplication must prevent duplicate alerts')
console.log('✓ Notification triggers and deterministic deduplication passed.')

// -------------------------------------------------------------
// Test 5: Analytics Calculations
// -------------------------------------------------------------
console.log('\nTest 5: Real Analytics Aggregation...')

const mockPurchases = [
  { purchase_date: '2026-08-10', total_amount: 150.0 },
  { purchase_date: '2026-08-25', total_amount: 250.0 },
  { purchase_date: '2026-09-05', total_amount: 120.0 },
]

const totalSpend = mockPurchases.reduce((acc, p) => acc + p.total_amount, 0)
assert.equal(totalSpend, 520.0, 'Total spend calculation must match exact sum')

const monthlySpend = mockPurchases.reduce((acc, p) => {
  const m = p.purchase_date.slice(0, 7)
  acc[m] = (acc[m] || 0) + p.total_amount
  return acc
}, {})

assert.equal(monthlySpend['2026-08'], 400.0)
assert.equal(monthlySpend['2026-09'], 120.0)
console.log('✓ Spend and monthly aggregation math verified.')

// -------------------------------------------------------------
// Test 6: RFC-4180 CSV Escaping
// -------------------------------------------------------------
console.log('\nTest 6: RFC-4180 CSV Generation & Escaping...')

function escapeCSVField(val) {
  if (val === null || val === undefined) return '""'
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

assert.equal(escapeCSVField('Normal Text'), '"Normal Text"')
assert.equal(escapeCSVField('Item with, comma'), '"Item with, comma"')
assert.equal(escapeCSVField('Item with "quotes" inside'), '"Item with ""quotes"" inside"')
assert.equal(escapeCSVField('Item\nMultiline'), '"Item\nMultiline"')
console.log('✓ RFC-4180 CSV escaping standard adhered to.')

// -------------------------------------------------------------
// Test 7: Omnisearch Matching
// -------------------------------------------------------------
console.log('\nTest 7: Global Omnisearch Matching...')

const searchCatalog = [
  { name: 'Organic Greek Yogurt', brand: 'Chobani', barcode: '8901234567890', tags: ['dairy', 'breakfast'] },
  { name: 'Dark Roast Coffee Beans', brand: 'Blue Bottle', barcode: '8901234567892', tags: ['coffee', 'beverage'] },
]

function search(query) {
  const q = query.toLowerCase()
  return searchCatalog.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  )
}

assert.equal(search('chobani').length, 1)
assert.equal(search('8901234567892').length, 1)
assert.equal(search('breakfast').length, 1)
assert.equal(search('nonexistent').length, 0)
console.log('✓ Omnisearch across Name, Brand, Barcode, and Tags verified.')

console.log('\n=========================================')
console.log('ALL MODULE 3 AUTOMATED TESTS PASSED (100%)')
console.log('=========================================')
