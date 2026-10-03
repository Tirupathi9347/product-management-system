import { ExpiryStatus } from '@/types'

export class ExpiryService {
  /**
   * Calculates the integer number of calendar days remaining until expiry.
   * Positive = future, 0 = today, negative = expired.
   */
  public static calculateDaysRemaining(expiryDate: string | null | undefined): number | null {
    if (!expiryDate) return null
    try {
      const parts = expiryDate.split('-')
      if (parts.length === 3) {
        const exp = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime()
        const today = new Date().setHours(0, 0, 0, 0)
        return Math.ceil((exp - today) / (1000 * 60 * 60 * 24))
      }
      const exp = new Date(expiryDate).getTime()
      const today = new Date().setHours(0, 0, 0, 0)
      return Math.ceil((exp - today) / (1000 * 60 * 60 * 24))
    } catch {
      return null
    }
  }

  /**
   * Evaluates the expiry status based on days remaining.
   * urgentThreshold defaults to 3 days.
   * warningThreshold defaults to 14 days (or user setting).
   */
  public static calculateExpiryStatus(
    expiryDate: string | null | undefined,
    warningThreshold = 14,
    urgentThreshold = 3
  ): ExpiryStatus {
    const days = this.calculateDaysRemaining(expiryDate)
    if (days === null) return 'NO_EXPIRY'

    if (days < 0) return 'EXPIRED'
    if (days <= urgentThreshold) return 'URGENT'
    if (days <= warningThreshold) return 'EXPIRING_SOON'
    return 'SAFE'
  }

  /**
   * Returns UI severity indicator variant.
   */
  public static getExpirySeverity(
    status: ExpiryStatus
  ): 'danger' | 'warning' | 'default' | 'success' | 'outline' {
    switch (status) {
      case 'EXPIRED':
        return 'danger'
      case 'URGENT':
        return 'danger'
      case 'EXPIRING_SOON':
        return 'warning'
      case 'SAFE':
        return 'success'
      case 'NO_EXPIRY':
      default:
        return 'outline'
    }
  }

  /**
   * Returns human-readable label.
   */
  public static getExpiryLabel(expiryDate: string | null | undefined): string {
    const days = this.calculateDaysRemaining(expiryDate)
    if (days === null) return 'No Expiry'
    if (days < 0) return `Expired (${Math.abs(days)}d ago)`
    if (days === 0) return 'Expires Today'
    if (days === 1) return 'Expires Tomorrow'
    if (days <= 14) return `Expires in ${days} days`
    return `${days} days left`
  }
}
