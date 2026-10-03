# Smart Product Management System (SPMS) — System Architecture

## 1. High-Level Architecture

The Smart Product Management System (SPMS) is engineered as an enterprise-grade personal inventory intelligence platform built on Next.js 16 (App Router), React 19, TypeScript strict mode, and Tailwind CSS.

```text
[ Browser Client UI ]
        │
        ├── UI Design System (Button, Card, Modal, Input, Toast, Dropdown)
        ├── Route Layer (Products, Inventory, Purchases, Consumption, Reports, Analytics)
        └── Scanner Layer (HTML5-QRCode Camera, AI OCR Viewfinder, Omnisearch)
        │
[ Service & Facade Boundary ]
        │
        ├── ProductService (Catalog CRUD, search, filter, multi-sort)
        ├── InventoryService (Stock levels, valuation, health calculations)
        ├── ExpiryService (Centralized date threshold status & severity)
        ├── PurchaseService (Restock ledger & optional inventory sync)
        ├── ConsumptionService (Stock depletion & validation guards)
        ├── NotificationService (Telemetry deduplication & alerts)
        ├── AnalyticsService (Procurement, burn-rate, and category models)
        ├── ReportService (Itemized ledger rendering & RFC-4180 CSV export)
        └── ProductExtractionService (Image preprocessing & OCR pipeline)
        │
[ Dual-Adapter Persistence Layer ]
        │
        ├── Development Data Adapter (localStorage + in-memory store)
        └── Supabase PostgreSQL Adapter (Supabase SSR Client + PostgREST + RLS)
```

---

## 2. Decoupled Service Boundary Pattern

To ensure frictionless development without being blocked on live external cloud services:
1. All React components communicate strictly with domain service classes.
2. Services inspect configuration via `getSupabaseConfig().isConfigured`.
3. If cloud credentials are not active, the system automatically runs the `DevStore` adapter (`src/lib/dev/devStore.ts`), which mirrors the exact relational schema, constraints, and audit log events while persisting state to `localStorage`.
4. When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are provided, the services interact directly with Supabase with **zero UI rewrites**.

---

## 3. General Consumer Goods Scope Guard

SPMS is designed exclusively for retail packaging and general consumer items:
- **Food & Groceries:** Pantry goods, dairy, snacks, perishables, produce.
- **Beverages:** Juices, coffee beans, tea, bottled drinks.
- **Pantry & Spices:** Whole spices, seasonings, grains, flour, baking staples.
- **Personal Care & Cosmetics:** Hygiene, skincare, haircare, toiletries.
- **Household & Cleaning:** Detergents, paper products, disinfectants.
- **Electronics & Gadgets:** Accessories, cables, batteries, consumables.
- **Other:** Miscellaneous packaged goods.

*Note:* Medical, prescription drugs, pharmaceuticals, or clinical inventory features are strictly omitted.
