# Local Setup & Cloud Activation Guide

## 1. Local Development Mode (Immediate Out-of-the-Box)

The application includes an isolated development adapter (`src/lib/dev/devStore.ts`) that persists state to `localStorage`. You can run and test the complete system locally without configuring external credentials:

```bash
# Install dependencies
npm install

# Run automated test suites
node scripts/test-module2.mjs
node scripts/test-module3.mjs

# Start development server
npm run dev
```

Visit `http://localhost:3000`.

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Environment Keys:
```env
# Supabase Project Credentials (from Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Google Gemini Vision API Key for packaging OCR
GEMINI_API_KEY=your-gemini-api-key-here
```

---

## 3. Activating Live Supabase Cloud

When you are ready to connect your live Supabase project:
1. Run the database migration script in `supabase/migrations/01_initial_schema.sql` inside the Supabase SQL Editor.
2. Ensure the `product-images` storage bucket is created with public read access.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
4. The service layer detects the configuration and routes all operations directly to your cloud PostgreSQL database.
