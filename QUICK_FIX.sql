-- ═══════════════════════════════════════════════════════════════
-- QUICK FIX: Run this in your PostgreSQL client (pgAdmin or psql)
-- Database: saas_platform00
-- ═══════════════════════════════════════════════════════════════

-- Connect to postgres database first
\c postgres

-- Drop and recreate the database (THIS WILL DELETE ALL DATA!)
DROP DATABASE IF EXISTS saas_platform00;
CREATE DATABASE saas_platform00;

-- Connect to the new database
\c saas_platform00

-- Done! Now restart your NestJS application
-- TypeORM will automatically create all tables fresh

-- ═══════════════════════════════════════════════════════════════
-- Alternative: If you want to keep data, run this instead:
-- ═══════════════════════════════════════════════════════════════

-- \c saas_platform00
-- 
-- -- Drop only the conflicting tables
-- DROP TABLE IF EXISTS stock_movements CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS product_categories CASCADE;
-- 
-- -- Clean up orphaned constraints
-- DO $$ 
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN (
--         SELECT constraint_name, table_name
--         FROM information_schema.table_constraints
--         WHERE constraint_name LIKE '%9a5f6868c96e0069e699f33e124%'
--     ) LOOP
--         EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || 
--                 ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
--     END LOOP;
-- END $$;
