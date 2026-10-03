# Smart Notifications Engine & Deduplication Architecture

## 1. Alert Types & Severity Matrix

| Notification Type | Severity | Condition Trigger | Example Title |
|---|---|---|---|
| `EXPIRED` | `danger` | Expiry Date $\le 0$ days | `Product Expired: Organic Greek Yogurt` |
| `URGENT_EXPIRY` | `urgent` | Expiry Date $\le 3$ days | `Urgent Expiry: Artisan Sourdough Loaf` |
| `EXPIRY` | `warning` | Expiry Date $\le 7$ days | `Expiring Soon: Whole Milk` |
| `OUT_OF_STOCK` | `danger` | Quantity = 0 units | `Out of Stock: Basmati Rice` |
| `LOW_STOCK` | `warning` | Quantity $\le$ minimum_stock_level | `Low Stock: Cold Brew Concentrate` |
| `SYSTEM` | `info` | System state / operational event | `Database Schema Synchronized` |

---

## 2. Deterministic Deduplication Engine

To eliminate duplicate alerts from repeatedly firing on page re-renders:
1. Each alert is assigned a deterministic identity key:
   - Expiry alert: `notif_exp_{product_id}_{status}_{expiry_date}`
   - Stock alert: `notif_stock_{product_id}_{zero_or_low}_{quantity}`
2. The notification service queries existing keys before insertion.
3. If an alert with the same key exists, generation is skipped.
4. If an item is replenished or expiry status changes, a new discrete alert key is evaluated.

---

## 3. UI Interactions & Persistence

- **Live Counter in Header:** Unread notification count badge in `Header.tsx` updates automatically.
- **Filter Tabs:** View `All` vs. `Unread` alerts in `/notifications`.
- **Direct Navigation:** Clicking `Inspect Product` immediately routes to `/products/[id]`.
- **State Persistence:** Marking an alert as read or dismissing it writes to `devStore` / Supabase table and persists across browser reloads.
