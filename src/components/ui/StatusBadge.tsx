import * as React from 'react'
import { Badge } from './Badge'

export interface StatusBadgeProps {
  type: 'stock' | 'expiry'
  quantity?: number
  threshold?: number
  daysUntilExpiry?: number | null
}

export function StatusBadge({ type, quantity = 0, threshold = 2, daysUntilExpiry }: StatusBadgeProps) {
  if (type === 'stock') {
    if (quantity <= 0) {
      return (
        <Badge variant="danger" dot>
          Out of Stock
        </Badge>
      )
    }
    if (quantity <= threshold) {
      return (
        <Badge variant="warning" dot>
          Low Stock ({quantity})
        </Badge>
      )
    }
    return (
      <Badge variant="success" dot>
        In Stock ({quantity})
      </Badge>
    )
  }

  // Expiry badge
  if (daysUntilExpiry === null || daysUntilExpiry === undefined) {
    return <Badge variant="outline">No Expiry</Badge>
  }

  if (daysUntilExpiry < 0) {
    return (
      <Badge variant="danger" dot>
        Expired ({Math.abs(daysUntilExpiry)}d ago)
      </Badge>
    )
  }

  if (daysUntilExpiry <= 7) {
    return (
      <Badge variant="warning" dot>
        Expiring in {daysUntilExpiry}d
      </Badge>
    )
  }

  return (
    <Badge variant="secondary">
      {daysUntilExpiry}d remaining
    </Badge>
  )
}
