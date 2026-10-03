# Database Schema & Relational Models

## 1. Relational Entities

### `products`
The core inventory product catalog entity.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `auth.users`)
- `category_id` (UUID, Foreign Key -> `categories.id`)
- `name` (TEXT, Not Null)
- `brand` (TEXT)
- `barcode` (TEXT)
- `image_url` (TEXT)
- `description` (TEXT)
- `quantity` (NUMERIC, Default 0, Constraint >= 0)
- `unit` (TEXT, Default 'units')
- `mrp` (NUMERIC, Max Retail Price)
- `purchase_price` (NUMERIC, Acquisition Cost)
- `weight` (TEXT, e.g. "500g", "1L")
- `manufacturing_date` (DATE)
- `expiry_date` (DATE)
- `batch_number` (TEXT)
- `purchase_date` (DATE)
- `storage_location` (TEXT)
- `minimum_stock_level` (NUMERIC, Default 2)
- `tags` (TEXT[])
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### `categories`
Standard consumer categories with UI styling tokens.
- `id` (UUID, Primary Key)
- `name` (TEXT, Unique)
- `icon` (TEXT, Lucide icon token)
- `color` (TEXT, Hex color token)
- `description` (TEXT)
- `created_at` (TIMESTAMPTZ)

### `purchases`
Procurement order ledger.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `auth.users`)
- `product_id` (UUID, Foreign Key -> `products.id`)
- `quantity` (NUMERIC, Not Null, > 0)
- `purchase_price` (NUMERIC, Unit Cost)
- `total_amount` (NUMERIC, Quantity * Purchase Price)
- `purchase_date` (DATE, Not Null)
- `store_name` (TEXT)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)

### `consumption_history`
Stock depletion events.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `auth.users`)
- `product_id` (UUID, Foreign Key -> `products.id`)
- `quantity` (NUMERIC, Not Null, > 0)
- `consumed_at` (TIMESTAMPTZ, Not Null)
- `note` (TEXT)

### `activity_logs`
Chronological audit stream of user transactions.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `auth.users`)
- `product_id` (UUID, Foreign Key -> `products.id`, Nullable)
- `action` (TEXT: 'create' | 'update' | 'delete' | 'consume' | 'purchase' | 'archive' | 'restore')
- `description` (TEXT)
- `created_at` (TIMESTAMPTZ)

### `user_settings`
Personal alerts and sensitivity calibration.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `auth.users`)
- `theme` ('system' | 'light' | 'dark')
- `low_stock_threshold` (NUMERIC, Default 2)
- `expiry_warning_days` (NUMERIC, Default 14)
- `notification_preferences` (JSONB)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

## 2. Row Level Security (RLS)

All user tables enforce Postgres RLS:
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own products"
  ON products FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
Categories are publicly viewable by authenticated users.
