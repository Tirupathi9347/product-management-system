import { Purchase } from '@/types'
import { getSupabaseConfig } from '@/lib/supabase/config'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { devStore } from '@/lib/dev/devStore'
import { InventoryService } from './inventoryService'

export class PurchaseService {
  /**
   * Retrieves purchase transactions, optionally filtered by product.
   */
  public static async getPurchases(productId?: string): Promise<Purchase[]> {
    const { isConfigured } = getSupabaseConfig()

    if (!isConfigured) {
      return devStore.getPurchases(productId)
    }

    const supabase = getSupabaseBrowserClient()
    let query = supabase.from('purchases').select('*').order('purchase_date', { ascending: false })

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data, error } = await query
    if (error) {
      console.warn('Error fetching purchases from Supabase, falling back:', error.message)
      return devStore.getPurchases(productId)
    }

    return data || []
  }

  /**
   * Records a new purchase transaction.
   * Total is strictly calculated: quantity * purchase_price.
   * If addToInventory is true, automatically updates product inventory level.
   */
  public static async recordPurchase(
    purchase: Omit<Purchase, 'id' | 'created_at' | 'total_amount'>,
    addToInventory = true
  ): Promise<Purchase> {
    const totalAmount = Math.round(purchase.quantity * purchase.purchase_price * 100) / 100
    const fullPurchase = {
      ...purchase,
      total_amount: totalAmount,
    }

    const { isConfigured } = getSupabaseConfig()

    if (!isConfigured) {
      return devStore.createPurchase(fullPurchase, addToInventory)
    }

    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('purchases')
      .insert({
        ...fullPurchase,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Optionally increment inventory
    if (addToInventory && purchase.product_id) {
      await InventoryService.adjustQuantity(purchase.product_id, purchase.quantity)
    }

    return data as Purchase
  }
}
