# Supabase Setup Guide — Smart Product Management System

This directory contains the database schema, Row Level Security (RLS) policies, triggers, and storage configurations for the complete application.

## 1. Apply Database Schema

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to the **SQL Editor**.
3. Copy the contents of [`supabase/schema.sql`](./schema.sql) and paste them into the SQL editor.
4. Click **Run**.

This script automatically creates:
- **`profiles`** table with automatic user creation trigger on `auth.users`
- **`categories`** table pre-populated with standard classifications
- **`products`** table with barcode, MRP, expiry, batch, and storage location fields
- **`purchases`** table for vendor and invoice transaction logs
- **`consumption_history`** table for usage tracking
- **`notifications`** table with severity and read status
- **`activity_logs`** table for immutable transactional audit streams
- **`user_settings`** table with low-stock and expiry thresholds
- **Storage bucket `product-images`** with RLS policies allowing authenticated users to manage their images
- **Row Level Security (RLS)** enabled on all user tables with strict `auth.uid() = user_id` policies

## 2. Configure Environment Variables

1. In your Supabase Dashboard, navigate to **Project Settings > API**.
2. Copy your **Project URL** and **anon public key**.
3. Create or update `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Restart your Next.js development server (`npm run dev`).
