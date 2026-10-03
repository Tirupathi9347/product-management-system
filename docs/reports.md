# Reports & Compliance Engine

## 1. Supported Report Types

1. **Inventory Valuation & Asset Ledger (`inventory`):**
   - Active stock count, unit costs, valuation, and storage locations.
   - Summaries: Total Products, Total In-Stock Units, Total Asset Valuation (₹).
2. **Perishable Expiry & Risk Audit (`expiry`):**
   - Items with expiration dates, days remaining, severity status, and batch numbers.
   - Summaries: Tracked Perishables, Expired Count, Urgent Count.
3. **Procurement & Purchase History (`purchases`):**
   - Historical purchase orders, quantities, unit prices, total expenditures, and vendor names.
   - Summaries: Total Orders, Total Units Restocked, Total Capital Outflow (₹).
4. **Consumption & Usage Depletion Log (`consumption`):**
   - Usage events, depleted quantities, timestamps, and optional user notes.
   - Summaries: Depletion Events, Total Depleted Units.

---

## 2. Real CSV & Printable PDF Export

- **RFC-4180 CSV Export:** Values containing commas, double quotes, or newlines are properly escaped and wrapped in double quotes. Triggers immediate browser file download.
- **Print to PDF:** The report layout is styled with `@media print` rules, suppressing navigation sidebars and headers for clean print previews and PDF exports.
