import { BarcodeLookupResult } from '@/types'

export class BarcodeService {
  /**
   * Validates standard barcode string format (EAN-13, EAN-8, UPC-A, UPC-E, Code 128, etc.).
   */
  public static validateBarcode(barcode: string): boolean {
    if (!barcode) return false
    const clean = barcode.trim()
    // Standard barcodes are numeric between 8 and 14 digits or alphanumeric SKU
    return /^[0-9A-Za-z-]{6,16}$/.test(clean)
  }

  /**
   * Looks up product metadata from public barcode registry (Open Food Facts API).
   * Gracefully tolerates:
   * - Product Found
   * - Product Not Found
   * - API Error / Rate limit
   * - Network failure
   */
  public static async lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
    const cleanCode = barcode.trim()

    if (!cleanCode) {
      return {
        barcode: '',
        name: null,
        brand: null,
        category: null,
        mrp: null,
        purchase_price: null,
        weight: null,
        unit: 'pcs',
        description: null,
        image_url: null,
        found: false,
      }
    }

    try {
      // Query Open Food Facts API (world public registry)
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${cleanCode}.json`, {
        headers: {
          'User-Agent': 'SmartProductManagementSystem/1.0',
        },
      })

      if (!res.ok) {
        return this.fallbackNotFound(cleanCode)
      }

      const json = await res.json()
      if (json.status === 1 && json.product) {
        const prod = json.product
        return {
          barcode: cleanCode,
          name: prod.product_name || prod.product_name_en || null,
          brand: prod.brands || null,
          category: prod.categories_tags?.[0]?.replace(/^[a-z]+:/, '').replace(/-/g, ' ') || null,
          mrp: null,
          purchase_price: null,
          weight: prod.quantity || null,
          unit: 'pcs',
          description: prod.generic_name || prod.generic_name_en || null,
          image_url: prod.image_front_url || prod.image_url || null,
          found: true,
          source: 'Open Food Facts Public Registry',
        }
      }

      return this.fallbackNotFound(cleanCode)
    } catch (err) {
      console.warn('Barcode lookup network/registry exception:', err)
      return this.fallbackNotFound(cleanCode)
    }
  }

  private static fallbackNotFound(barcode: string): BarcodeLookupResult {
    return {
      barcode,
      name: null,
      brand: null,
      category: null,
      mrp: null,
      purchase_price: null,
      weight: null,
      unit: 'pcs',
      description: null,
      image_url: null,
      found: false,
    }
  }
}
