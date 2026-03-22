# Database Migration Guide

**Complete guide for migrating the database to support new relations**

---

## Overview

This guide provides step-by-step instructions for creating and running database migrations to implement all the new relations and entities.

---

## Prerequisites

- Backup your database before running migrations
- Ensure TypeORM is configured correctly
- Test migrations on development environment first
- Have rollback plan ready

---

## Migration Order

Migrations must be run in this specific order to avoid foreign key constraint errors:

1. Create new tables (no dependencies)
2. Add new columns to existing tables
3. Add foreign key constraints
4. Add indexes
5. Migrate data (if needed)
6. Add NOT NULL constraints (if applicable)

---

## Step 1: Create New Tables

### Migration 1: Create RecurringInvoices Table

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRecurringInvoicesTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'recurring_invoices',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'business_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'invoice_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'frequency',
            type: 'enum',
            enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
            isNullable: false,
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'last_generated',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'next_generation',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add indexes
    await queryRunner.createIndex(
      'recurring_invoices',
      new TableIndex({
        name: 'IDX_recurring_invoices_business_active',
        columnNames: ['business_id', 'is_active'],
      }),
    );

    await queryRunner.createIndex(
      'recurring_invoices',
      new TableIndex({
        name: 'IDX_recurring_invoices_next_generation',
        columnNames: ['next_generation'],
      }),
    );

    // Add foreign key
    await queryRunner.query(`
      ALTER TABLE recurring_invoices
      ADD CONSTRAINT FK_recurring_invoices_invoice
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('recurring_invoices');
  }
}
```

### Migration 2: Create SupplierPayments Table

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSupplierPaymentsTable1234567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'supplier_payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'business_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'purchase_invoice_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'account_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'payment_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'method',
            type: 'enum',
            enum: ['VIREMENT', 'CHEQUE', 'ESPECES', 'TRAITE', 'CARTE'],
            isNullable: false,
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add indexes
    await queryRunner.createIndex(
      'supplier_payments',
      new TableIndex({
        name: 'IDX_supplier_payments_business_date',
        columnNames: ['business_id', 'payment_date'],
      }),
    );

    await queryRunner.createIndex(
      'supplier_payments',
      new TableIndex({
        name: 'IDX_supplier_payments_invoice',
        columnNames: ['purchase_invoice_id'],
      }),
    );

    await queryRunner.createIndex(
      'supplier_payments',
      new TableIndex({
        name: 'IDX_supplier_payments_account',
        columnNames: ['account_id'],
      }),
    );

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE supplier_payments
      ADD CONSTRAINT FK_supplier_payments_purchase_invoice
      FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id)
      ON DELETE RESTRICT,
      ADD CONSTRAINT FK_supplier_payments_account
      FOREIGN KEY (account_id) REFERENCES accounts(id)
      ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('supplier_payments');
  }
}
```

### Migration 3: Create Transactions Table

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTransactionsTable1234567890125 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'business_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'account_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['ENCAISSEMENT', 'DECAISSEMENT', 'VIREMENT_INTERNE'],
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'transaction_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'related_entity_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'related_entity_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_reconciled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add indexes
    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_transactions_business_date',
        columnNames: ['business_id', 'transaction_date'],
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_transactions_account_date',
        columnNames: ['account_id', 'transaction_date'],
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_transactions_reconciled',
        columnNames: ['is_reconciled'],
      }),
    );

    // Add foreign key
    await queryRunner.query(`
      ALTER TABLE transactions
      ADD CONSTRAINT FK_transactions_account
      FOREIGN KEY (account_id) REFERENCES accounts(id)
      ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transactions');
  }
}
```

---

## Step 2: Add Columns to Existing Tables

### Migration 4: Add Columns to Quotes Table

```typescript
import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddColumnsToQuotes1234567890126 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns
    await queryRunner.addColumns('quotes', [
      new TableColumn({
        name: 'timbreFiscal',
        type: 'decimal',
        precision: 12,
        scale: 3,
        default: 1.000,
      }),
      new TableColumn({
        name: 'netAmount',
        type: 'decimal',
        precision: 12,
        scale: 3,
        default: 0,
      }),
      new TableColumn({
        name: 'convertedToPoId',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'convertedToInvoiceId',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'pdfUrl',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
      new TableColumn({
        name: 'sentAt',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);

    // Update status column to enum (if it's currently string)
    await queryRunner.query(`
      ALTER TABLE quotes
      ALTER COLUMN status TYPE varchar(20);
      
      -- Update existing values to match enum
      UPDATE quotes SET status = 'DRAFT' WHERE status = 'draft';
      UPDATE quotes SET status = 'SENT' WHERE status = 'sent';
      
      -- Create enum type
      CREATE TYPE quote_status_enum AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');
      
      -- Change column to enum
      ALTER TABLE quotes
      ALTER COLUMN status TYPE quote_status_enum USING status::quote_status_enum;
    `);

    // Add indexes
    await queryRunner.createIndex(
      'quotes',
      new TableIndex({
        name: 'IDX_quotes_business_status',
        columnNames: ['businessId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'quotes',
      new TableIndex({
        name: 'IDX_quotes_business_client',
        columnNames: ['businessId', 'clientId'],
      }),
    );

    await queryRunner.createIndex(
      'quotes',
      new TableIndex({
        name: 'IDX_quotes_business_valid_until',
        columnNames: ['businessId', 'validUntil'],
      }),
    );

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE quotes
      ADD CONSTRAINT FK_quotes_converted_po
      FOREIGN KEY (convertedToPoId) REFERENCES sales_orders(id)
      ON DELETE SET NULL,
      ADD CONSTRAINT FK_quotes_converted_invoice
      FOREIGN KEY (convertedToInvoiceId) REFERENCES invoices(id)
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('quotes', [
      'timbreFiscal',
      'netAmount',
      'convertedToPoId',
      'convertedToInvoiceId',
      'pdfUrl',
      'sentAt',
    ]);
    
    // Revert status to string
    await queryRunner.query(`
      ALTER TABLE quotes
      ALTER COLUMN status TYPE varchar(50);
      
      DROP TYPE quote_status_enum;
    `);
  }
}
```

### Migration 5: Add Columns to SalesOrders Table

```typescript
import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddColumnsToSalesOrders1234567890127 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('sales_orders', [
      new TableColumn({
        name: 'expectedDelivery',
        type: 'date',
        isNullable: true,
      }),
      new TableColumn({
        name: 'timbreFiscal',
        type: 'decimal',
        precision: 12,
        scale: 3,
        default: 1.000,
      }),
      new TableColumn({
        name: 'netAmount',
        type: 'decimal',
        precision: 12,
        scale: 3,
        default: 0,
      }),
      new TableColumn({
        name: 'quoteId',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'invoiceId',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'pdfUrl',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    ]);

    // Update status to enum
    await queryRunner.query(`
      CREATE TYPE sales_order_status_enum AS ENUM ('CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'INVOICED', 'CANCELLED');
      
      ALTER TABLE sales_orders
      ALTER COLUMN status TYPE sales_order_status_enum USING 
        CASE 
          WHEN status = 'pending' THEN 'CONFIRMED'::sales_order_status_enum
          WHEN status = 'completed' THEN 'DELIVERED'::sales_order_status_enum
          ELSE 'CONFIRMED'::sales_order_status_enum
        END;
    `);

    // Add indexes
    await queryRunner.createIndex(
      'sales_orders',
      new TableIndex({
        name: 'IDX_sales_orders_business_status',
        columnNames: ['businessId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'sales_orders',
      new TableIndex({
        name: 'IDX_sales_orders_quote',
        columnNames: ['quoteId'],
      }),
    );

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE sales_orders
      ADD CONSTRAINT FK_sales_orders_quote
      FOREIGN KEY (quoteId) REFERENCES quotes(id)
      ON DELETE SET NULL,
      ADD CONSTRAINT FK_sales_orders_invoice
      FOREIGN KEY (invoiceId) REFERENCES invoices(id)
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('sales_orders', [
      'expectedDelivery',
      'timbreFiscal',
      'netAmount',
      'quoteId',
      'invoiceId',
      'pdfUrl',
    ]);
  }
}
```

### Migration 6: Add Columns to DeliveryNotes Table

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnsToDeliveryNotes1234567890128 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'delivery_notes',
      new TableColumn({
        name: 'deliveredBy',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Update status to enum
    await queryRunner.query(`
      CREATE TYPE delivery_note_status_enum AS ENUM ('DRAFT', 'DELIVERED', 'SIGNED');
      
      ALTER TABLE delivery_notes
      ALTER COLUMN status TYPE delivery_note_status_enum USING 
        CASE 
          WHEN status = 'pending' THEN 'DRAFT'::delivery_note_status_enum
          WHEN status = 'completed' THEN 'DELIVERED'::delivery_note_status_enum
          ELSE 'DRAFT'::delivery_note_status_enum
        END;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('delivery_notes', 'deliveredBy');
  }
}
```

### Migration 7: Add Columns to Invoices Table

```typescript
import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddColumnsToInvoices1234567890129 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'quote_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_quote',
        columnNames: ['quote_id'],
      }),
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_business_status',
        columnNames: ['business_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_business_due_date',
        columnNames: ['business_id', 'due_date'],
      }),
    );

    // Add foreign key
    await queryRunner.query(`
      ALTER TABLE invoices
      ADD CONSTRAINT FK_invoices_quote
      FOREIGN KEY (quote_id) REFERENCES quotes(id)
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invoices', 'quote_id');
  }
}
```

### Migration 8: Add Columns to GoodsReceipts Table

```typescript
import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddColumnsToGoodsReceipts1234567890130 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add supplier_id column
    await queryRunner.addColumn(
      'goods_receipts',
      new TableColumn({
        name: 'supplier_id',
        type: 'uuid',
        isNullable: true, // Nullable initially for data migration
      }),
    );

    // Populate supplier_id from supplier_po
    await queryRunner.query(`
      UPDATE goods_receipts gr
      SET supplier_id = sp.supplier_id
      FROM supplier_pos sp
      WHERE gr.supplier_po_id = sp.id
    `);

    // Make it NOT NULL after data migration
    await queryRunner.query(`
      ALTER TABLE goods_receipts
      ALTER COLUMN supplier_id SET NOT NULL
    `);

    // Add index
    await queryRunner.createIndex(
      'goods_receipts',
      new TableIndex({
        name: 'IDX_goods_receipts_supplier',
        columnNames: ['supplier_id'],
      }),
    );

    // Add foreign key
    await queryRunner.query(`
      ALTER TABLE goods_receipts
      ADD CONSTRAINT FK_goods_receipts_supplier
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('goods_receipts', 'supplier_id');
  }
}
```

---

## Step 3: Generate TypeORM Migrations

If you're using TypeORM CLI, you can generate migrations automatically:

```bash
# Generate migration for all changes
npm run typeorm migration:generate -- -n AddRelationsRevision

# Run migrations
npm run typeorm migration:run

# Revert last migration if needed
npm run typeorm migration:revert
```

---

## Step 4: Verify Migrations

After running migrations, verify:

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('recurring_invoices', 'supplier_payments', 'transactions');

-- Check new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quotes' 
AND column_name IN ('timbreFiscal', 'netAmount', 'convertedToPoId');

-- Check foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('quotes', 'sales_orders', 'invoices', 'goods_receipts');

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('quotes', 'sales_orders', 'invoices', 'payments');
```

---

## Step 5: Data Migration (if needed)

### Update existing Quote statuses
```sql
UPDATE quotes 
SET status = 'DRAFT' 
WHERE status IN ('draft', 'pending', NULL);

UPDATE quotes 
SET status = 'SENT' 
WHERE status = 'sent';
```

### Calculate netAmount for existing quotes
```sql
UPDATE quotes 
SET netAmount = total + timbreFiscal 
WHERE netAmount = 0;
```

### Similar updates for sales_orders and invoices
```sql
UPDATE sales_orders 
SET netAmount = total + timbreFiscal 
WHERE netAmount = 0;
```

---

## Rollback Plan

If migrations fail or cause issues:

```bash
# Revert last migration
npm run typeorm migration:revert

# Revert multiple migrations
npm run typeorm migration:revert
npm run typeorm migration:revert
npm run typeorm migration:revert
```

Or manually:

```sql
-- Drop new tables
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS supplier_payments CASCADE;
DROP TABLE IF EXISTS recurring_invoices CASCADE;

-- Drop new columns
ALTER TABLE quotes DROP COLUMN IF EXISTS timbreFiscal;
ALTER TABLE quotes DROP COLUMN IF EXISTS netAmount;
-- ... etc

-- Drop enum types
DROP TYPE IF EXISTS quote_status_enum CASCADE;
DROP TYPE IF EXISTS sales_order_status_enum CASCADE;
DROP TYPE IF EXISTS delivery_note_status_enum CASCADE;
```

---

## Testing Checklist

After migrations:

- [ ] All tables created successfully
- [ ] All columns added successfully
- [ ] All foreign keys working
- [ ] All indexes created
- [ ] No orphaned records
- [ ] Application starts without errors
- [ ] Can create new Quote
- [ ] Can convert Quote to SalesOrder
- [ ] Can convert SalesOrder to Invoice
- [ ] Can create Payment
- [ ] Can create SupplierPayment
- [ ] Can create Transaction
- [ ] Can create RecurringInvoice
- [ ] All relations load correctly
- [ ] Query performance acceptable

---

## Performance Monitoring

After deployment, monitor:

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM quotes 
WHERE businessId = 'xxx' AND status = 'SENT';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('quotes', 'sales_orders', 'invoices', 'payments')
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Troubleshooting

### Issue: Foreign key constraint violation
**Solution:** Ensure referenced records exist before adding constraints

### Issue: Enum type already exists
**Solution:** Drop existing enum type first or use IF NOT EXISTS

### Issue: Column already exists
**Solution:** Check if migration was partially run, use IF NOT EXISTS

### Issue: Performance degradation
**Solution:** Analyze queries, add missing indexes, vacuum tables

---

**Last Updated:** 2024-03-20  
**Version:** 1.0  
**Status:** Ready for Implementation
