# Predictive Analytics & Intelligence Engine

## 1. Real Data Principles

The Analytics Engine (`/analytics`) is built strictly on verified application state without mocked or artificial trends:
1. **Inventory Valuation:** Exact sum of `quantity * (purchase_price || mrp)` across active items.
2. **Category Capital Allocation:** Breakdown of inventory assets by category with color-coded interactive charts.
3. **Monthly Spending:** Extracted dynamically from the `purchases` ledger grouped by month.
4. **Consumption Velocity:** Calculated from historical item depletion records.
5. **Aging & Expiry Health:** Real-time breakdown of safe vs. urgent vs. expired inventory.

---

## 2. Meaningful Empty States

When insufficient transaction history exists (e.g. A newly created account with no recorded purchases), the UI does NOT display fabricated placeholder data. Instead, clean empty states explain what specific operation will unlock the predictive insight (e.g., *"Record purchase restocks in the Purchases module to unlock monthly spending trends"*).
