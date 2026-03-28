# Database Table Structure Explanation

## Overview

Your database has **two separate product/category systems**. This document explains why and what each is for.

---

## System 1: Old/Alternative Product System

### Tables:
- `product_categories`
- `products` (if it exists)

### Location in Code:
- `src/stock/entities/product-category.entity.ts` (note: `stock` without 's')
- `src/stock/entities/product.entity.ts`

### Structure:
```sql
product_categories:
- id
- business_id
- name
- description
- parent_id          ← Supports hierarchical categories
- code               ← Category code/SKU
- sort_order         ← Display order
- image_url          ← Category image
- is_active
- created_at
- updated_at
```

### Purpose:
This appears to be an **older or alternative** product categorization system that supports:
- **Hierarchical categories** (parent-child relationships)
- **Category codes** for identification
- **Custom sorting** order
- **Category images**

### Status:
- ❓ May be from a previous implementation
- ❓ May be for a different module
- ❓ Not currently used by the Stock Management UI we just created

---

## System 2: New Stock Management System (Current)

### Tables:
- `stock_categories`
- `stock_products`

### Location in Code:
- `src/stocks/entities/category.entity.ts` (note: `stocks` with 's')
- `src/stocks/entities/product.entity.ts`

### Structure:
```sql
stock_categories:
- id
- business_id
- name
- description
- is_active
- created_at
- updated_at

stock_products:
- id
- business_id
- name
- reference           ← Product reference/SKU
- description
- category_id         ← Links to stock_categories
- unit
- sale_price_ht
- purchase_price_ht
- current_stock
- min_stock_threshold
- is_stockable
- is_active
- barcode
- created_at
- updated_at
```

### Purpose:
This is the **NEW Stock Management module** we just implemented with:
- **Simple, flat categories** (no hierarchy)
- **Stock tracking** (current_stock, min_threshold)
- **Pricing** (sale and purchase prices)
- **Business isolation** (multi-tenant)
- **Full CRUD operations** via the UI

### Status:
- ✅ Currently active and working
- ✅ Used by the Categories and Products pages
- ✅ Integrated with your SaaS platform

---

## Why Two Systems?

### Reason 1: Naming Conflict
When we started implementing the Stock Management module, there was a foreign key constraint conflict with existing tables. To avoid breaking existing functionality, we created new tables with the `stock_` prefix.

From `FIXES_APPLIED.md`:
> **Issue 1: Foreign Key Constraint Conflict**
> Error: `constraint "FK_9a5f6868c96e0069e699f33e124" for relation "products" already exists`
> 
> Solution:
> - Renamed `products` table → `stock_products`
> - Renamed `categories` table → `stock_categories`

### Reason 2: Different Requirements
The two systems serve different purposes:
- **Old system:** Complex hierarchical categories with images and codes
- **New system:** Simple stock management with inventory tracking

---

## Which System Should You Use?

### For Stock Management (Inventory, Products, Categories):
✅ **Use `stock_categories` and `stock_products`**
- This is what the UI currently uses
- Has stock tracking features
- Integrated with the Stock Management pages

### For the Old System:
❓ **Check if it's still needed**
- If it's from an old implementation → Consider removing it
- If it's for a different module → Keep it separate
- If you're not sure → Leave it for now

---

## How to Check What's Using Each System

### Check for `product_categories` usage:
```bash
# In PI-DEV-BACKEND folder
grep -r "product_categories" src/
grep -r "ProductCategory" src/
```

### Check for `stock_categories` usage:
```bash
# In PI-DEV-BACKEND folder
grep -r "stock_categories" src/
grep -r "Category" src/stocks/
```

---

## Current Working System

Your **Stock Management module** is working correctly:

### Backend:
- ✅ Categories API: `/businesses/:businessId/categories`
- ✅ Products API: `/businesses/:businessId/products`
- ✅ Database tables: `stock_categories`, `stock_products`

### Frontend:
- ✅ Categories page: `/app/stock/categories`
- ✅ Products page: `/app/stock/products`
- ✅ Full CRUD operations working

### Database:
```sql
-- Check your stock categories
SELECT * FROM stock_categories 
WHERE business_id = 'b48c82a2-c438-41c5-a47f-ac5dcfc87756';

-- Check your stock products
SELECT * FROM stock_products 
WHERE business_id = 'b48c82a2-c438-41c5-a47f-ac5dcfc87756';
```

---

## Recommendations

### Option 1: Keep Both Systems Separate (Current State)
- ✅ No risk of breaking existing functionality
- ✅ Clear separation of concerns
- ❌ Potential confusion (like you just experienced)
- ❌ Duplicate code/logic

### Option 2: Migrate to Single System
If `product_categories` is not being used:
1. Verify nothing uses it (grep search)
2. Drop the old tables
3. Rename `stock_categories` → `categories`
4. Rename `stock_products` → `products`
5. Update all code references

### Option 3: Use Old System for New Features
If you prefer the old system's structure:
1. Migrate new Stock Management to use `product_categories`
2. Add stock tracking fields to old `products` table
3. Update controllers/services to use old entities

---

## Quick Reference

| Feature | Old System | New System |
|---------|-----------|------------|
| **Table Names** | `product_categories`, `products` | `stock_categories`, `stock_products` |
| **Code Location** | `src/stock/` | `src/stocks/` |
| **Hierarchy** | ✅ Yes (parent_id) | ❌ No (flat) |
| **Stock Tracking** | ❓ Unknown | ✅ Yes |
| **Current UI** | ❌ No | ✅ Yes |
| **Status** | ❓ Unknown | ✅ Active |

---

## Summary

- ✅ Your Stock Management module is **working correctly**
- ✅ Categories are being saved to `stock_categories` (the right table)
- ✅ The frontend is displaying data from `stock_categories`
- ❌ You were checking `product_categories` (wrong table)
- 📝 You have two separate systems - decide if you need both

The confusion was understandable - having two similar table names is confusing! But everything is working as designed.

