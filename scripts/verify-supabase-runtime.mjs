/**
 * Comprehensive Live Supabase Runtime & RLS Verification Script
 * Tests:
 * 1. Auth Sign In / Up
 * 2. Categories Shared Read & Write-Restriction
 * 3. Products CRUD (INSERT, SELECT, UPDATE, DELETE)
 * 4. Storage Upload, Read, and Deletion
 * 5. Cross-user RLS isolation (User A vs User B)
 * 6. Unauthorized access blocking
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''

function getEnvVar(name) {
  if (process.env[name]) return process.env[name]
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'))
  return match ? match[1].trim() : ''
}

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')

console.log('='.repeat(70))
console.log('  SPMS LIVE SUPABASE RUNTIME & RLS VERIFICATION')
console.log('='.repeat(70))
console.log(`URL: ${supabaseUrl}`)
console.log(`Anon Key present: ${Boolean(supabaseAnonKey)}`)
console.log(`Service Role present: ${Boolean(serviceRoleKey)}`)

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder.supabase.co')) {
  console.error('\n❌ ERROR: Valid Supabase credentials not found in .env.local')
  console.error('Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const timestamp = Date.now()
const userAEmail = `test_user_a_${timestamp}@spms-verify.local`
const userBEmail = `test_user_b_${timestamp}@spms-verify.local`
const testPassword = `TestUserAuth99!_${timestamp}`

const clientA = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const clientB = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const results = {
  auth: false,
  categoriesRead: false,
  categoriesWriteBlocked: false,
  productInsert: false,
  productSelect: false,
  productUpdate: false,
  storageUpload: false,
  storageRead: false,
  storageDelete: false,
  rlsIsolationSelect: false,
  rlsIsolationUpdate: false,
  rlsIsolationDelete: false,
  unauthorizedBlocked: false,
  productDelete: false,
}

async function runVerification() {
  try {
    // -------------------------------------------------------------
    // Step 1: Create & Authenticate User A
    // -------------------------------------------------------------
    console.log(`\n[1/7] Authenticating User A (${userAEmail})...`)
    const { data: authAData, error: authAError } = await clientA.auth.signUp({
      email: userAEmail,
      password: testPassword,
      options: { data: { full_name: 'Test Commander A' } }
    })

    let userA = authAData?.user
    if (authAError) {
      // Try sign in in case user already exists
      const { data: signInA, error: signInAError } = await clientA.auth.signInWithPassword({
        email: userAEmail,
        password: testPassword
      })
      if (signInAError) throw new Error(`User A auth failed: ${signInAError.message}`)
      userA = signInA.user
    }

    if (!userA) throw new Error('User A creation returned no user object')
    console.log(`  ✓ User A Authenticated (ID: ${userA.id})`)
    results.auth = true

    // -------------------------------------------------------------
    // Step 2: Test Categories RLS (Shared Read, Write Restricted)
    // -------------------------------------------------------------
    console.log('\n[2/7] Verifying Categories RLS...')
    const { data: categories, error: catError } = await clientA
      .from('categories')
      .select('*')
      .limit(10)

    if (catError) {
      console.error(`  ❌ Categories SELECT failed: ${catError.message}`)
    } else {
      console.log(`  ✓ Categories SELECT successful (Loaded ${categories?.length || 0} categories)`)
      results.categoriesRead = true
    }

    // Verify User A CANNOT arbitrarily modify shared categories (Restricted)
    const { error: catWriteError } = await clientA
      .from('categories')
      .insert({ name: `Hack Category ${timestamp}` })

    if (catWriteError) {
      console.log(`  ✓ Categories INSERT properly restricted by RLS (${catWriteError.message})`)
      results.categoriesWriteBlocked = true
    } else {
      console.warn('  ⚠️ Categories INSERT was permitted for authenticated user. Should be restricted to admin/migrations.')
    }

    const categoryId = categories && categories.length > 0 ? categories[0].id : null

    // -------------------------------------------------------------
    // Step 3: Product CRUD as User A (INSERT, SELECT, UPDATE)
    // -------------------------------------------------------------
    console.log('\n[3/7] Testing Products CRUD operations as User A...')
    const testProductPayload = {
      user_id: userA.id,
      category_id: categoryId,
      name: `Ultra Organic Milk ${timestamp}`,
      brand: 'Dairy Pure',
      barcode: `890123${timestamp.toString().slice(-6)}`,
      quantity: 12,
      unit: 'liters',
      mrp: 4.99,
      purchase_price: 3.50,
      storage_location: 'Main Fridge Compartment',
      minimum_stock_level: 3,
      tags: ['dairy', 'breakfast'],
      expiry_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    }

    // INSERT
    const { data: insertedProduct, error: insertError } = await clientA
      .from('products')
      .insert(testProductPayload)
      .select()
      .single()

    if (insertError) {
      throw new Error(`Product INSERT failed: ${insertError.message}`)
    }
    console.log(`  ✓ Product INSERT successful (ID: ${insertedProduct.id})`)
    results.productInsert = true

    // SELECT
    const { data: selectedProduct, error: selectError } = await clientA
      .from('products')
      .select('*')
      .eq('id', insertedProduct.id)
      .single()

    if (selectError || !selectedProduct) {
      throw new Error(`Product SELECT failed: ${selectError?.message}`)
    }
    console.log(`  ✓ Product SELECT successful (Name: "${selectedProduct.name}", Qty: ${selectedProduct.quantity})`)
    results.productSelect = true

    // UPDATE
    const { data: updatedProduct, error: updateError } = await clientA
      .from('products')
      .update({ quantity: 18, purchase_price: 3.75 })
      .eq('id', insertedProduct.id)
      .select()
      .single()

    if (updateError || updatedProduct.quantity !== 18) {
      throw new Error(`Product UPDATE failed: ${updateError?.message}`)
    }
    console.log(`  ✓ Product UPDATE successful (Updated Qty: ${updatedProduct.quantity}, Price: $${updatedProduct.purchase_price})`)
    results.productUpdate = true

    // -------------------------------------------------------------
    // Step 4: Storage Upload, Read, and Deletion
    // -------------------------------------------------------------
    console.log('\n[4/7] Testing Supabase Storage for Product Images...')
    const sampleImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    )
    const storageFilePath = `${userA.id}/test_product_${timestamp}.png`

    const { data: uploadData, error: uploadError } = await clientA.storage
      .from('product-images')
      .upload(storageFilePath, sampleImageBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error(`  ❌ Storage upload failed: ${uploadError.message}`)
      console.error('  Ensure bucket "product-images" exists in Supabase Dashboard > Storage.')
    } else {
      console.log(`  ✓ Storage upload successful (Path: ${uploadData.path})`)
      results.storageUpload = true

      // Storage Public URL
      const { data: urlData } = clientA.storage
        .from('product-images')
        .getPublicUrl(storageFilePath)

      if (urlData?.publicUrl) {
        console.log(`  ✓ Storage public URL generated: ${urlData.publicUrl.slice(0, 60)}...`)
        results.storageRead = true
      }

      // Storage Delete
      const { error: deleteStorageError } = await clientA.storage
        .from('product-images')
        .remove([storageFilePath])

      if (deleteStorageError) {
        console.error(`  ❌ Storage deletion failed: ${deleteStorageError.message}`)
      } else {
        console.log('  ✓ Storage file deletion successful')
        results.storageDelete = true
      }
    }

    // -------------------------------------------------------------
    // Step 5: Test Cross-User RLS Isolation (User A vs User B)
    // -------------------------------------------------------------
    console.log(`\n[5/7] Testing Cross-User RLS Isolation with User B (${userBEmail})...`)
    const { data: authBData, error: authBError } = await clientB.auth.signUp({
      email: userBEmail,
      password: testPassword,
      options: { data: { full_name: 'Test Commander B' } }
    })

    let userB = authBData?.user
    if (authBError) {
      const { data: signInB, error: signInBError } = await clientB.auth.signInWithPassword({
        email: userBEmail,
        password: testPassword
      })
      if (signInBError) throw new Error(`User B auth failed: ${signInBError.message}`)
      userB = signInB.user
    }

    if (!userB) throw new Error('User B creation returned no user')
    console.log(`  ✓ User B Authenticated (ID: ${userB.id})`)

    // User B tries to SELECT User A's product
    const { data: bViewA } = await clientB
      .from('products')
      .select('*')
      .eq('id', insertedProduct.id)

    if (bViewA && bViewA.length === 0) {
      console.log('  ✓ RLS ISOLATION PASS: User B cannot SELECT User A\'s products (returned 0 rows)')
      results.rlsIsolationSelect = true
    } else {
      console.error('  ❌ RLS VIOLATION: User B was able to view User A\'s product!', bViewA)
    }

    // User B tries to UPDATE User A's product
    const { data: bUpdateA } = await clientB
      .from('products')
      .update({ name: 'Hacked by User B' })
      .eq('id', insertedProduct.id)
      .select()

    if (!bUpdateA || bUpdateA.length === 0) {
      console.log('  ✓ RLS ISOLATION PASS: User B cannot UPDATE User A\'s products (0 rows affected)')
      results.rlsIsolationUpdate = true
    } else {
      console.error('  ❌ RLS VIOLATION: User B was able to UPDATE User A\'s product!')
    }

    // User B tries to DELETE User A's product
    const { data: bDeleteA } = await clientB
      .from('products')
      .delete()
      .eq('id', insertedProduct.id)
      .select()

    if (!bDeleteA || bDeleteA.length === 0) {
      console.log('  ✓ RLS ISOLATION PASS: User B cannot DELETE User A\'s products (0 rows affected)')
      results.rlsIsolationDelete = true
    } else {
      console.error('  ❌ RLS VIOLATION: User B was able to DELETE User A\'s product!')
    }

    // -------------------------------------------------------------
    // Step 6: Test Unauthorized (Anon) Client
    // -------------------------------------------------------------
    console.log('\n[6/7] Testing Unauthorized Anonymous Access...')
    const { data: anonView } = await anonClient
      .from('products')
      .select('*')
      .eq('id', insertedProduct.id)

    if (!anonView || anonView.length === 0) {
      console.log('  ✓ RLS PASS: Anonymous unauthenticated client cannot access products')
      results.unauthorizedBlocked = true
    } else {
      console.error('  ❌ RLS VIOLATION: Anonymous client accessed protected products!', anonView)
    }

    // -------------------------------------------------------------
    // Step 7: Clean Up Test Records (DELETE as User A)
    // -------------------------------------------------------------
    console.log('\n[7/7] Cleaning up test records as User A...')
    const { data: deletedProduct, error: deleteProdError } = await clientA
      .from('products')
      .delete()
      .eq('id', insertedProduct.id)
      .select()
      .single()

    if (deleteProdError) {
      console.error(`  ❌ Product DELETE failed: ${deleteProdError.message}`)
    } else {
      console.log(`  ✓ Product DELETE successful (Cleaned ID: ${deletedProduct.id})`)
      results.productDelete = true
    }

  } catch (err) {
    console.error('\n❌ RUNTIME ERROR DURING VERIFICATION:', err.message)
  }

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('  VERIFICATION SUMMARY')
  console.log('='.repeat(70))
  console.log(`  Auth Sign In / Up:            ${results.auth ? 'PASS' : 'FAIL'}`)
  console.log(`  Categories Shared Read:       ${results.categoriesRead ? 'PASS' : 'FAIL'}`)
  console.log(`  Categories Write Restricted:  ${results.categoriesWriteBlocked ? 'PASS' : 'FAIL'}`)
  console.log(`  Product INSERT:               ${results.productInsert ? 'PASS' : 'FAIL'}`)
  console.log(`  Product SELECT:               ${results.productSelect ? 'PASS' : 'FAIL'}`)
  console.log(`  Product UPDATE:               ${results.productUpdate ? 'PASS' : 'FAIL'}`)
  console.log(`  Product DELETE:               ${results.productDelete ? 'PASS' : 'FAIL'}`)
  console.log(`  Storage Image Upload:         ${results.storageUpload ? 'PASS' : 'FAIL'}`)
  console.log(`  Storage Image Read URL:       ${results.storageRead ? 'PASS' : 'FAIL'}`)
  console.log(`  Storage Image Deletion:       ${results.storageDelete ? 'PASS' : 'FAIL'}`)
  console.log(`  RLS Isolation (SELECT):       ${results.rlsIsolationSelect ? 'PASS' : 'FAIL'}`)
  console.log(`  RLS Isolation (UPDATE):       ${results.rlsIsolationUpdate ? 'PASS' : 'FAIL'}`)
  console.log(`  RLS Isolation (DELETE):       ${results.rlsIsolationDelete ? 'PASS' : 'FAIL'}`)
  console.log(`  Unauthorized Blocked:         ${results.unauthorizedBlocked ? 'PASS' : 'FAIL'}`)
  console.log('='.repeat(70))

  const allPassed = Object.values(results).every(Boolean)
  if (allPassed) {
    console.log('\n🎉 ALL RUNTIME & RLS CHECKS PASSED!')
    process.exit(0)
  } else {
    console.log('\n⚠️ SOME CHECKS FAILED OR WERE SKIPPED. REVIEW LOG ABOVE.')
    process.exit(1)
  }
}

runVerification()
