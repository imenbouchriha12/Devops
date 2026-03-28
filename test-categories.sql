-- Quick test to check categories in database
-- Run this in pgAdmin or psql

-- Check all categories
SELECT 
    id,
    business_id,
    name,
    description,
    is_active,
    created_at
FROM stock_categories
ORDER BY created_at DESC;

-- Check categories by business
SELECT 
    id,
    name,
    description,
    is_active,
    created_at
FROM stock_categories
WHERE business_id = 'b48c82a2-c438-41c5-a47f-ac5dcfc87756'
ORDER BY created_at DESC;

-- Count active vs inactive
SELECT 
    is_active,
    COUNT(*) as count
FROM stock_categories
WHERE business_id = 'b48c82a2-c438-41c5-a47f-ac5dcfc87756'
GROUP BY is_active;
