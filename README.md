# Smart Product Management System (SPMS)

> **AI-Powered Personal Product & Inventory Management Platform**

A production-grade web application built with **Next.js 16 (App Router)**, **React 19**, **TypeScript strict mode**, and **Tailwind CSS**. Designed for comprehensive tracking of consumer goods, groceries, beverages, pantry items, household supplies, and personal care.

---

## Key Modules & Capabilities

### Module 1 — Foundation, Auth & UI Design System
* **Supabase Integration & RLS:** PostgreSQL architecture with Row Level Security and SSR auth guard.
* **Design System:** Custom UI components (Buttons, Cards, Modals, Inputs, Toasts, Skeletons, Empty States).
* **Responsive Layout:** Desktop sidebar, mobile navigation, glassmorphic headers, and theme sync (Light, Dark, System).

### Module 2 — Product, Inventory, Barcode, Purchases & Consumption
* **Product Catalog (`/products`):** Multi-filter search, multi-sort, active vs. archived tabs, and detailed item views.
* **Guided 3-Mode Creation (`/products/new`):** Manual Entry (Sections A–F), Barcode Scan, and AI Vision Scan.
* **Inventory Engine (`/inventory`):** Stock status classification (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`), inline stepper adjusters, and audit log tracking.
* **Perishable Expiry Engine:** Centralized calculation service (`SAFE`, `EXPIRING_SOON`, `URGENT`, `EXPIRED`).
* **Purchases Ledger (`/purchases`):** Restock orders, procurement analytics, and optional inventory synchronization.
* **Consumption Depletions (`/consumption`):** Itemized usage logging with stock constraint boundaries.

### Module 3 — AI Vision Extraction, Notifications, Analytics & Reports
* **AI Packaging OCR:** Multimodal Vision extraction pipeline (`/api/ai/extract`), date normalizer, and user verification screen.
* **Smart Notifications (`/notifications`):** Real-time expiration and stock alerts with deterministic deduplication.
* **Predictive Analytics (`/analytics`):** Real-time capital allocation, spend velocity, category breakdown, and item depletion trends.
* **Compliance Reports (`/reports`):** 4 report types (Inventory, Expiry, Purchases, Consumption) with RFC-4180 CSV export and Print-to-PDF formatting.
* **Omnisearch (`Ctrl + K`):** Global multi-field product search modal with arrow-key keyboard navigation.
* **Settings & Diagnostics (`/settings`):** Threshold sensitivity calibration, theme selection, and dev cache reset.

---

## Quick Start

### 1. Installation
```bash
npm install
```

### 2. Run Tests
```bash
node scripts/test-module2.mjs
node scripts/test-module3.mjs
```

### 3. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Documentation Index
- [Architecture & Boundaries](docs/architecture.md)
- [Database Schema & Models](docs/database.md)
- [AI Vision Pipeline & Custom Models](docs/ai-pipeline.md)
- [Notifications & Deduplication](docs/notifications.md)
- [Analytics Engine](docs/analytics.md)
- [Reports & CSV Export](docs/reports.md)
- [Local Setup & Cloud Activation](docs/setup.md)
