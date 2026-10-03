# Packaging Dataset Guide

Follow these 2 simple steps to build your dataset:

### Step 1: Add Your Photos
Drop all your clicked photos (`.jpg` or `.png`) directly into this folder:
```
ml_model/dataset/images/
```
*(Example: `img_01.jpg`, `img_02.jpg`, `img_03.jpg`, etc.)*

---

### Step 2: Fill `annotations.json`
Open `ml_model/dataset/annotations.json` and add a block for each photo you took:

```json
{
  "image_filename": "img_01.jpg",
  "product_name": "Tata Tea Gold",
  "brand": "Tata Tea",
  "category": "Beverages",
  "mrp": 290.0,
  "purchase_price": 280.0,
  "weight": "500 g",
  "manufacturing_date": "2026-05-10",
  "expiry_date": "2027-05-10",
  "batch_number": "TTG-9921",
  "barcode": "8901030382902"
}
```

> **Tips:**
> - If a field is not printed or not visible in that photo, set it to `null`.
> - Dates should be in `YYYY-MM-DD` format (e.g. `2026-06-15`).
> - Keep photo filenames simple (`1.jpg`, `2.jpg`, etc.).
