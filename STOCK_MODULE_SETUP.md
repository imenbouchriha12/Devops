# Stock Module Setup & Fix Guide

## 🔴 Current Issue
You're getting a foreign key constraint error because there's a conflict between the old `products` table and the new `stock_products` table.

## ✅ Quick Fix (Choose ONE option)

### Option 1: Automated Reset (Easiest) ⭐

Run this PowerShell script:
```powershell
cd PI-DEV-BACKEND
.\reset-database.ps1
```

Then restart your app:
```bash
npm run start:dev
```

### Option 2: Manual Reset via pgAdmin

1. Open **pgAdmin**
2. Right-click on `saas_platform00` database
3. Select **Delete/Drop**
4. Right-click on **Databases** → **Create** → **Database**
5. Name it: `saas_platform00`
6. Restart your NestJS app

### Option 3: Manual Reset via psql

```bash
psql -U postgres
```

Then run:
```sql
DROP DATABASE saas_platform00;
CREATE DATABASE saas_platform00;
\q
```

Restart your app:
```bash
npm run start:dev
```

### Option 4: Use SQL Script

```bash
psql -U postgres -f QUICK_FIX.sql
```

Then restart your app.

## 📋 What Was Implemented

### Backend Structure
```
PI-DEV-BACKEND/src/stocks/
├── entities/
│   ├── category.entity.ts       (stock_categories table)
│   └── product.entity.ts        (stock_products table)
├── dto/
│   ├── create-category.dto.ts
│   ├── update-category.dto.ts
│   ├── query-categories.dto.ts
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   └── query-products.dto.ts
├── services/
│   ├── categories.service.ts
│   └── products.service.ts
├── controllers/
│   ├── categories.controller.ts
│   └── products.controller.ts
└── stocks.module.ts
```

### Frontend Structure
```
PI-DEV-FRONT/src/
├── types/
│   ├── category.ts
│   └── product.ts
├── api/
│   ├── categories.api.ts
│   └── products.api.ts
└── pages/backoffice/
    ├── Categories.tsx
    └── Products.tsx
```

## 🔌 API Endpoints

### Categories
- `GET    /businesses/:businessId/categories` - List all categories
- `GET    /businesses/:businessId/categories/:id` - Get one category
- `POST   /businesses/:businessId/categories` - Create category
- `PATCH  /businesses/:businessId/categories/:id` - Update category
- `DELETE /businesses/:businessId/categories/:id` - Delete category (soft)

### Products
- `GET    /businesses/:businessId/products` - List all products
- `GET    /businesses/:businessId/products/:id` - Get one product
- `GET    /businesses/:businessId/products/alerts` - Get low stock alerts
- `POST   /businesses/:businessId/products` - Create product
- `PATCH  /businesses/:businessId/products/:id` - Update product
- `DELETE /businesses/:businessId/products/:id` - Delete product (soft)

## 🎯 Features Implemented

### Categories
- ✅ CRUD operations
- ✅ Business isolation (multi-tenant)
- ✅ Soft delete (is_active flag)
- ✅ Search by name
- ✅ Filter by active status
- ✅ Validation on delete (checks for active products)

### Products
- ✅ CRUD operations
- ✅ Business isolation (multi-tenant)
- ✅ Soft delete (is_active flag)
- ✅ Reference uniqueness per business
- ✅ Category relation
- ✅ Stock tracking (current_stock, min_threshold)
- ✅ Low stock alerts
- ✅ Search by name or reference
- ✅ Filter by category, active status, low stock
- ✅ Stockable/Non-stockable products (for services)
- ✅ Barcode support

## 🔐 Permissions

### Categories
- **Create/Update**: OWNER, ADMIN, ACCOUNTANT
- **Read**: All authenticated users
- **Delete**: OWNER, ADMIN

### Products
- **Create/Update**: OWNER, ADMIN, ACCOUNTANT
- **Read**: All authenticated users
- **Delete**: OWNER, ADMIN
- **Alerts**: OWNER, ACCOUNTANT

## 🗄️ Database Schema

### stock_categories
```sql
- id (UUID, PK)
- business_id (UUID, FK → businesses)
- name (VARCHAR 255)
- description (TEXT, nullable)
- is_active (BOOLEAN, default true)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### stock_products
```sql
- id (UUID, PK)
- business_id (UUID, FK → businesses)
- name (VARCHAR 255)
- reference (VARCHAR 100, unique per business)
- description (TEXT, nullable)
- category_id (UUID, FK → stock_categories, nullable)
- unit (VARCHAR 50, default 'pièce')
- sale_price_ht (DECIMAL 12,3)
- purchase_price_ht (DECIMAL 12,3)
- tax_rate_id (UUID, nullable)
- current_stock (DECIMAL 12,3, default 0)
- min_stock_threshold (DECIMAL 12,3, default 0)
- is_stockable (BOOLEAN, default true)
- is_active (BOOLEAN, default true)
- barcode (VARCHAR 100, nullable)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## 🔗 Integrations

### Invoice Items
- Added optional `product_id` field
- Links to `stock_products` table
- Allows tracking which product was sold

### Sales Order Items
- Added optional `stock_product_id` field
- Links to `stock_products` table
- Allows tracking which product was ordered

## 🧪 Testing

After setup, test with:

```bash
# Get categories
curl http://localhost:3000/businesses/{businessId}/categories \
  -H "Cookie: your-auth-cookie"

# Create category
curl -X POST http://localhost:3000/businesses/{businessId}/categories \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"name":"Electronics","description":"Electronic products"}'

# Get products
curl http://localhost:3000/businesses/{businessId}/products \
  -H "Cookie: your-auth-cookie"

# Create product
curl -X POST http://localhost:3000/businesses/{businessId}/products \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "name":"Laptop",
    "reference":"PROD-001",
    "category_id":"category-uuid",
    "sale_price_ht":1500,
    "purchase_price_ht":1200,
    "current_stock":10,
    "min_stock_threshold":5
  }'
```

## 📱 Frontend Routes

Add these routes to your React Router:

```tsx
<Route path="/businesses/:businessId/categories" element={<Categories />} />
<Route path="/businesses/:businessId/products" element={<Products />} />
```

## 🚀 Next Steps

After the database is reset and working:

1. **Test the API endpoints** using Postman or curl
2. **Add the frontend routes** to your React app
3. **Test the UI** - create categories and products
4. **Implement Stock Movements** (next phase)
5. **Connect to Sales/Purchases** for automatic stock updates

## 📝 Notes

- All queries are filtered by `business_id` for multi-tenancy
- Soft delete is used (is_active flag) instead of hard delete
- Product references must be unique per business
- Low stock alerts trigger when `current_stock < min_stock_threshold`
- Services can be marked as non-stockable (`is_stockable = false`)

## ❓ Troubleshooting

### Still getting constraint errors?
1. Make sure you dropped the old database completely
2. Check for any running migrations
3. Verify `synchronize: true` in TypeORM config
4. Clear node_modules and reinstall: `npm ci`

### Can't connect to database?
1. Verify PostgreSQL is running
2. Check credentials in `.env`
3. Test connection: `psql -U postgres -d saas_platform00`

### Frontend not showing data?
1. Check browser console for errors
2. Verify API URL in `.env`: `VITE_API_URL=http://localhost:3000`
3. Check authentication cookies
4. Verify businessId in URL params
