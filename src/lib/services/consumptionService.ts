import { ConsumptionHistory } from '@/types'
import { getSupabaseConfig } from '@/lib/supabase/config'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { devStore } from '@/lib/dev/devStore'
import { ProductService } from './productService'
import { InventoryService } from './inventoryService'

export class ConsumptionService {
  /**
   * Retrieves consumption logs, optionally filtered by product.
   */
  public static async getConsumption(productId?: string): Promise<ConsumptionHistory[]> {
    const { isConfigured } = getSupabaseConfig()

    if (!isConfigured) {
      return devStore.getConsumption(productId)
    }

    const supabase = getSupabaseBrowserClient()
    let query = supabase.from('consumption_history').select('*').order('consumed_at', { ascending: false })

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data, error } = await query
    if (error) {
      console.warn('Error fetching consumption from Supabase, falling back:', error.message)
      return devStore.getConsumption(productId)
    }

    return data || []
  }

  /**
   * Records product usage, ensuring quantity does not exceed available stock.
   */
  public static async recordConsumption(
    consumption: Omit<ConsumptionHistory, 'id'>
  ): Promise<ConsumptionHistory> {
    if (consumption.quantity <= 0) {
      throw new Error('Consumption quantity must be greater than zero')
    }

    // Verify stock availability
    if (consumption.product_id) {
      const product = await ProductService.getProduct(consumption.product_id)
      if (product && product.quantity < consumption.quantity) {
        throw new Error(
          `Insufficient stock. Available: ${product.quantity} ${product.unit}, requested: ${consumption.quantity}`
        )
      }
    }

    const { isConfigured } = getSupabaseConfig()

    if (!isConfigured) {
      return devStore.createConsumption(consumption)
    }

    const supabase = getSupabaseBrowserClient()

    // 1. Insert consumption event
    const { data, error } = await supabase
      .from('consumption_history')
      .insert(consumption)
      .select()
      .single()

    if (error) throw new Error(error.message)

    // 2. Decrement inventory
    if (consumption.product_id) {
      await InventoryService.adjustQuantity(consumption.product_id, -consumption.quantity)
    }

    return data as ConsumptionHistory
  }
}
