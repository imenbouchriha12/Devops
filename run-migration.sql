-- Run this in pgAdmin or your PostgreSQL client
-- Database: saas_platform

-- Add missing columns to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS converted_to_invoice_id UUID REFERENCES invoices(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS converted_to_po_id UUID REFERENCES sales_orders(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add missing column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sales_order_id UUID REFERENCES sales_orders(id);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quotes' 
  AND column_name IN ('converted_to_invoice_id', 'converted_to_po_id', 'accepted_at', 'rejected_at', 'rejection_reason');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
  AND column_name = 'sales_order_id';
