# Migration to Stock Folder (Without 's')

## What Changed

We've consolidated the stock management implementation into the existing `stock` folder (without 's') and updated table names to be cleaner.

### Before:
- Folder: `src/stocks/` (with 's')
- Tables: `stock_categories`, `stock_products`
- Entities: `Category`, `StockProduct`

### After:
- Folder: `src/stock/` (without 's')
- Tables: `categories`, `products`
- Entities: `Category`, `Product`

---

## Changes Made

### 1. Updated Entities

**`src/stock/entities/product-category.entity.ts`:**
- Renamed class from `ProductCategory` to `Category`
- Changed table name from `product_categories` to `categories`
- Removed hierarchical fields (parent_id, code, sort_order, image_url)
- Simplified to match stock management needs

**`src/stock/entities/product.entity.ts`:**
- Kept class name as `Product`
- Table name remains `products`
- Updated fields to match stock management:
  - `sku` → `reference`
  - `price` → `sale_price_ht`
  - `cost` → `purchase_price_ht`
  - `quantity` → `current_stock`
  - `min_quantity` → `min_stock_threshold`
- Added `is_stockable` field
- Removed supplier-related fields (moved to purchases module)

### 2. Added Controllers

**`src/stock/controllers/categories.controller.ts`:**
- Routes: `/businesses/:businessId/categories`
- Full CRUD operations
- Role-based access control

**`src/stock/controllers/products.controller.ts`:**
- Routes: `/businesses/:businessId/products`
- Full CRUD operations
- Low stock alerts endpoint

### 3. Added Services

**`src/stock/services/categories.service.ts`:**
- Business logic for categories
- Search and filtering
- Soft delete
- Validation

**`src/stock/services/products.service.ts`:**
- Business logic for products
- Search and filtering
- Low stock alerts
- Reference uniqueness validation
- Soft delete

### 4. Added DTOs

- `create-category.dto.ts`
- `update-category.dto.ts`
- `query-categories.dto.ts`
- `query-products.dto.ts`
- Updated existing `create-product.dto.ts` and `update-product.dto.ts`

### 5. Updated Module

**`src/stock/stock.module.ts`:**
- Added controllers and services
- Imported `BusinessesModule` for guards
- Exported services for use in other modules

### 6. Updated App Module

**`src/app.module.ts`:**
- Changed from `StocksModule` to `StockModule`

### 7. Removed Old Folder

- Deleted `src/stocks/` folder entirely

---

## Database Migration Required

### IMPORTANT: You MUST reset your database!

The table names have changed:
- `stock_categories` → `categories`
- `stock_products` → `products`

### Steps:

1. **Stop the backend** (Ctrl+C)

2. **Reset database:**
   ```powershell
   cd PI-DEV-BACKEND
   .\reset-database.ps1
   ```
   
   OR manually:
   ```sql
   DROP DATABASE IF EXISTS saas_platform00;
   CREATE DATABASE saas_platform00;
   ```

3. **Start backend:**
   ```bash
   npm run start:dev
   ```
   
   TypeORM will automatically create the new tables with correct names.

4. **Verify tables created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name IN ('categories', 'products');
   ```

---

## Frontend - No Changes Needed!

The frontend doesn't need any changes because:
- API routes remain the same: `/businesses/:businessId/categories` and `/businesses/:businessId/products`
- Response structure is identical
- All functionality works the same

---

## New Table Structure

### `categories` table:
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_business_active ON categories(business_id, is_active);
CREATE INDEX idx_categories_business_name ON categories(business_id, name);
```

### `products` table:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  reference VARCHAR(100) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit VARCHAR(50) DEFAULT 'pièce',
  sale_price_ht DECIMAL(12,3) DEFAULT 0,
  purchase_price_ht DECIMAL(12,3) DEFAULT 0,
  tax_rate_id UUID,
  current_stock DECIMAL(15,3) DEFAULT 0,
  min_stock_threshold DECIMAL(15,3) DEFAULT 0,
  is_stockable BOOLEAN DEFAULT true,
  barcode VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, reference)
);

CREATE INDEX idx_products_business_active ON products(business_id, is_active);
CREATE INDEX idx_products_business_reference ON products(business_id, reference);
CREATE INDEX idx_products_category ON products(category_id);
```

---

## Benefits of This Change

1. **Cleaner table names:** `categories` and `products` instead of `stock_categories` and `stock_products`
2. **Single source of truth:** One `stock` folder instead of two (`stock` and `stocks`)
3. **Consistent naming:** Matches existing project structure
4. **Simpler entities:** Removed unnecessary fields for stock management
5. **Better organization:** All stock-related code in one place

---

## Verification Steps

After resetting database and restarting backend:

1. **Check backend logs:**
   ```
   [Nest] INFO [TypeOrmModule] Successfully connected to the database
   [Nest] INFO [InstanceLoader] StockModule dependencies initialized
   [Nest] INFO [RoutesResolver] CategoriesController {/businesses/:businessId/categories}
   [Nest] INFO [RoutesResolver] ProductsController {/businesses/:businessId/products}
   ```

2. **Check tables exist:**
   ```sql
   SELECT * FROM categories LIMIT 1;
   SELECT * FROM products LIMIT 1;
   ```

3. **Test frontend:**
   - Go to Stock → Categories
   - Create a category
   - Go to Stock → Products
   - Create a product

---

## Rollback (If Needed)

If you need to rollback:

1. Restore the `stocks` folder from git history
2. Update `app.module.ts` to import `StocksModule`
3. Reset database
4. Restart backend

---

## Summary

✅ Migrated from `stocks` folder to `stock` folder
✅ Changed table names to `categories` and `products`
✅ Simplified entity structure
✅ All functionality preserved
✅ Frontend requires no changes
✅ Database reset required

The stock management module is now properly integrated into the existing `stock` folder with clean, simple table names.

