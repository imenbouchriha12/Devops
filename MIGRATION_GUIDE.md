# Stock Module Migration Guide

## Problem
The error occurs because there's a conflict between the old `products` table and the new `stock_products` table. Both are trying to create foreign key constraints with the same name.

## Solution Options

### Option 1: Clean Database (Recommended for Development)

If you're in development and can afford to lose data:

1. **Stop your NestJS application**

2. **Connect to PostgreSQL** and run:
```sql
-- Drop the entire database and recreate it
DROP DATABASE your_database_name;
CREATE DATABASE your_database_name;
```

3. **Or use the cleanup script**:
```bash
psql -U your_username -d your_database_name -f cleanup-database.sql
```

4. **Restart your application** - TypeORM will create all tables fresh

### Option 2: Manual Cleanup (Keep Other Data)

If you want to keep other data:

1. **Connect to your database**:
```bash
psql -U your_username -d your_database_name
```

2. **Run these commands**:
```sql
-- Drop old stock tables
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;

-- Clean up any orphaned constraints
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints
        WHERE constraint_name LIKE 'FK_9a5f6868c96e0069e699f33e124'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || 
                ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;
```

3. **Restart your NestJS application**

### Option 3: Use a Fresh Database (Easiest)

1. **Create a new database**:
```sql
CREATE DATABASE saas_platform_new;
```

2. **Update your `.env` file**:
```env
DB_NAME=saas_platform_new
```

3. **Restart your application**

## What Changed

### Entity Names
- Old: `products` table → New: `stock_products` table
- Old: `categories` table → New: `stock_categories` table
- Old: `Product` entity → New: `StockProduct` entity

### Why the Change?
To avoid conflicts with the existing stock module and ensure clean separation between the old and new implementations.

## Verification

After migration, verify the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('stock_products', 'stock_categories');
```

You should see:
```
     table_name     
--------------------
 stock_categories
 stock_products
```

## Testing

1. Start your backend: `npm run start:dev`
2. Check logs for successful database connection
3. Test the API endpoints:
   - GET `/businesses/:businessId/categories`
   - GET `/businesses/:businessId/products`

## Rollback

If you need to rollback:

1. Remove the StocksModule from `app.module.ts`
2. Drop the new tables:
```sql
DROP TABLE IF EXISTS stock_products CASCADE;
DROP TABLE IF EXISTS stock_categories CASCADE;
```
3. Restart the application
