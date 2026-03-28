-- ═══════════════════════════════════════════════════════════════
-- Database Cleanup Script for Stock Module Migration
-- Run this if you want to clean up old stock tables
-- ═══════════════════════════════════════════════════════════════

-- WARNING: This will delete all data in the old stock tables!
-- Make sure to backup your database before running this script.

-- Drop old foreign key constraints if they exist
DO $$ 
BEGIN
    -- Drop constraints from sales_order_items if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_9a5f6868c96e0069e699f33e124' 
        AND table_name = 'sales_order_items'
    ) THEN
        ALTER TABLE sales_order_items DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124";
    END IF;

    -- Drop constraints from invoice_items if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE 'FK_%' 
        AND table_name = 'invoice_items'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Get all FK constraints and drop them
        FOR r IN (
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'invoice_items' 
            AND constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE 'ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
        END LOOP;
    END IF;
END $$;

-- Drop old stock tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;

-- Verify new tables exist
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND table_name IN ('stock_products', 'stock_categories')
ORDER BY 
    table_name;

-- Show all constraints on new tables
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM
    information_schema.table_constraints tc
WHERE
    tc.table_schema = 'public'
    AND tc.table_name IN ('stock_products', 'stock_categories')
ORDER BY
    tc.table_name,
    tc.constraint_type;
