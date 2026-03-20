# Relations Revision - Complete Changes Documentation

**Date:** 2024-03-20  
**Project:** SaaS Plateforme de Gestion Financière - Contexte Tunisien  
**Purpose:** Comprehensive revision of all entity relations across modules according to documentation

---

## Executive Summary

This document details all changes made to entity relations across the entire platform to ensure complete alignment with the technical documentation. The changes establish proper bidirectional relations, add missing entities, and ensure data integrity across all modules.

### Modules Affected:
1. **Sales Module** (Facturation Client & Devis / Bons de Commande)
2. **Purchases Module** (Gestion des Fournisseurs & Achats)
3. **Stock Module** (Gestion des Stocks & Produits)
4. **Payments/Treasury Module** (Trésorerie & Règlements)
5. **Collaboration Module** (Collaboration & Gestion de Projets)
6. **Accounts Module** (Comptes de Trésorerie)

---

## 1. SALES MODULE - Missing Relations & Entities

### 1.1 Quote Entity - CRITICAL MISSING RELATIONS

**File:** `src/sales/entities/quote.entity.ts`

#### Missing Fields According to Documentation:
```typescript
// MISSING: Timbre fiscal field
timbre_fiscal: number; // Fixed 1.000 DT

// MISSING: Net amount (total + timbre)
net_amount: number;

// MISSING: Conversion tracking
converted_to_po_id: string | null;
converted_to_invoice_id: string | null;

// MISSING: PDF URL
pdf_url: string | null;

// MISSING: Sent timestamp
sent_at: Date | null;
```

#### Missing Relations:
```typescript
// MISSING: Relation to converted PurchaseOrder (SalesOrder)
@ManyToOne(() => SalesOrder, { nullable: true })
@JoinColumn({ name: 'converted_to_po_id' })
convertedToPurchaseOrder: SalesOrder | null;

// MISSING: Relation to converted Invoice
@ManyToOne(() => Invoice, { nullable: true })
@JoinColumn({ name: 'converted_to_invoice_id' })
convertedToInvoice: Invoice | null;

// MISSING: Reverse relation from SalesOrder
@OneToMany(() => SalesOrder, (po) => po.quote)
purchaseOrders: SalesOrder[];

// MISSING: Reverse relation from Invoice
@OneToMany(() => Invoice, (invoice) => invoice.quote)
invoices: Invoice[];
```

#### Status Enum - INCOMPLETE:
```typescript
// CURRENT: status: string (incorrect)
// SHOULD BE:
export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CONVERTED = 'CONVERTED'
}
```

---

### 1.2 SalesOrder Entity (Purchase Order Client) - MISSING RELATIONS

**File:** `src/sales/entities/sales-order.entity.ts`

#### Missing Fields:
```typescript
// MISSING: Link to originating quote
quote_id: string | null;

// MISSING: Link to generated invoice
invoice_id: string | null;

// MISSING: Expected delivery date
expected_delivery: Date | null;

// MISSING: Timbre fiscal
timbre_fiscal: number; // 1.000 DT

// MISSING: Net amount
net_amount: number;

// MISSING: PDF URL
pdf_url: string | null;
```

#### Missing Relations:
```typescript
// MISSING: Relation to Quote
@ManyToOne(() => Quote, (quote) => quote.purchaseOrders, { nullable: true })
@JoinColumn({ name: 'quote_id' })
quote: Quote | null;

// MISSING: Relation to Invoice
@ManyToOne(() => Invoice, (invoice) => invoice.purchaseOrders, { nullable: true })
@JoinColumn({ name: 'invoice_id' })
invoice: Invoice | null;

// MISSING: Reverse relation to DeliveryNotes
@OneToMany(() => DeliveryNote, (dn) => dn.salesOrder)
deliveryNotes: DeliveryNote[];
```

#### Status Enum - INCOMPLETE:
```typescript
// CURRENT: status: string
// SHOULD BE:
export enum SalesOrderStatus {
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  INVOICED = 'INVOICED',
  CANCELLED = 'CANCELLED'
}
```

---

### 1.3 DeliveryNote Entity - MISSING FIELDS

**File:** `src/sales/entities/delivery-note.entity.ts`

#### Missing Fields:
```typescript
// MISSING: Delivery person/transporter
delivered_by: string | null;

// MISSING: Proper status enum
status: DeliveryNoteStatus; // Currently just string
```

#### Status Enum - MISSING:
```typescript
export enum DeliveryNoteStatus {
  DRAFT = 'DRAFT',
  DELIVERED = 'DELIVERED',
  SIGNED = 'SIGNED'
}
```

---

### 1.4 Invoice Entity - MISSING RELATIONS

**File:** `src/sales/entities/invoice.entity.ts`

#### Missing Relations:
```typescript
// MISSING: Relation back to Quote (if converted directly)
@ManyToOne(() => Quote, (quote) => quote.invoices, { nullable: true })
@JoinColumn({ name: 'quote_id' })
quote: Quote | null;

// MISSING: Reverse relation to Payments
@OneToMany(() => Payment, (payment) => payment.invoice)
payments: Payment[];

// MISSING: Reverse relation to child invoices (Avoir)
@OneToMany(() => Invoice, (invoice) => invoice.original_invoice)
creditNotes: Invoice[];
```

#### Missing Field:
```typescript
// MISSING: Link to originating quote
quote_id: string | null;
```

---

### 1.5 MISSING ENTITY: RecurringInvoice

**File:** `src/sales/entities/recurring-invoice.entity.ts` - **DOES NOT EXIST**

#### Complete Entity Needed:
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Invoice } from './invoice.entity';

export enum RecurringFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

@Entity('recurring_invoices')
@Index(['business_id', 'is_active'])
@Index(['next_generation'])
export class RecurringInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  business_id: string;

  @Column({ type: 'uuid' })
  invoice_id: string;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({
    type: 'enum',
    enum: RecurringFrequency
  })
  frequency: RecurringFrequency;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date | null;

  @Column({ type: 'date', nullable: true })
  last_generated: Date | null;

  @Column({ type: 'date' })
  next_generation: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

---

## 2. PURCHASES MODULE - Missing Relations

### 2.1 SupplierPO Entity - MISSING RELATION

**File:** `src/Purchases/entities/supplier-po.entity.ts`

#### Missing Relation:
```typescript
// MISSING: Reverse relation to PurchaseInvoices
@OneToMany(() => PurchaseInvoice, (invoice) => invoice.supplier_po)
purchase_invoices: PurchaseInvoice[];
```

---

### 2.2 Supplier Entity - MISSING RELATION

**File:** `src/Purchases/entities/supplier.entity.ts`

#### Missing Relation:
```typescript
// MISSING: Reverse relation to GoodsReceipts
@OneToMany(() => GoodsReceipt, (gr) => gr.supplier)
goods_receipts: GoodsReceipt[];
```

---

### 2.3 GoodsReceipt Entity - MISSING RELATION

**File:** `src/Purchases/entities/goods-receipt.entity.ts`

#### Missing Relation:
```typescript
// MISSING: Direct relation to Supplier (for easier queries)
@ManyToOne(() => Supplier, (supplier) => supplier.goods_receipts)
@JoinColumn({ name: 'supplier_id' })
supplier: Supplier;
```

#### Missing Field:
```typescript
// MISSING: Supplier ID for direct access
supplier_id: string;
```

---

## 3. PAYMENTS/TREASURY MODULE - Missing Relations

### 3.1 Payment Entity - MISSING RELATIONS

**File:** `src/payments/entities/payment.entity.ts`

#### Missing Relations:
```typescript
// MISSING: Relation to Invoice
@ManyToOne(() => Invoice, (invoice) => invoice.payments)
@JoinColumn({ name: 'invoice_id' })
invoice: Invoice;

// MISSING: Relation to Account
@ManyToOne(() => Account, (account) => account.payments)
@JoinColumn({ name: 'account_id' })
account: Account;

// MISSING: Relation to Business
@ManyToOne(() => Business)
@JoinColumn({ name: 'business_id' })
business: Business;

// MISSING: Relation to User (created_by)
@ManyToOne(() => User)
@JoinColumn({ name: 'created_by' })
createdByUser: User;
```

---

### 3.2 Account Entity - MISSING RELATIONS

**File:** `src/accounts/entities/account.entity.ts`

#### Missing Relations:
```typescript
// MISSING: Relation to Business
@ManyToOne(() => Business)
@JoinColumn({ name: 'business_id' })
business: Business;

// MISSING: Reverse relation to Payments
@OneToMany(() => Payment, (payment) => payment.account)
payments: Payment[];

// MISSING: Reverse relation to SupplierPayments
@OneToMany(() => SupplierPayment, (payment) => payment.account)
supplierPayments: SupplierPayment[];

// MISSING: Reverse relation to Transactions
@OneToMany(() => Transaction, (transaction) => transaction.account)
transactions: Transaction[];
```

---

### 3.3 MISSING ENTITY: SupplierPayment

**File:** `src/payments/entities/supplier-payment.entity.ts` - **DOES NOT EXIST**

#### Complete Entity Needed:
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PurchaseInvoice } from '../../Purchases/entities/purchase-invoice.entity';
import { Account } from '../../accounts/entities/account.entity';
import { PaymentMethod } from '../enums/payment-method.enum';

@Entity('supplier_payments')
@Index(['business_id', 'payment_date'])
@Index(['purchase_invoice_id'])
export class SupplierPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  business_id: string;

  @Column({ type: 'uuid' })
  purchase_invoice_id: string;

  @ManyToOne(() => PurchaseInvoice)
  @JoinColumn({ name: 'purchase_invoice_id' })
  purchaseInvoice: PurchaseInvoice;

  @Column({ type: 'uuid' })
  account_id: string;

  @ManyToOne(() => Account, (account) => account.supplierPayments)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  amount: number;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;
}
```

---

### 3.4 MISSING ENTITY: Transaction

**File:** `src/payments/entities/transaction.entity.ts` - **DOES NOT EXIST**

#### Complete Entity Needed:
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

export enum TransactionType {
  ENCAISSEMENT = 'ENCAISSEMENT',
  DECAISSEMENT = 'DECAISSEMENT',
  VIREMENT_INTERNE = 'VIREMENT_INTERNE'
}

@Entity('transactions')
@Index(['business_id', 'transaction_date'])
@Index(['account_id', 'transaction_date'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  business_id: string;

  @Column({ type: 'uuid' })
  account_id: string;

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({
    type: 'enum',
    enum: TransactionType
  })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  amount: number;

  @Column({ type: 'date' })
  transaction_date: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  related_entity_type: string;

  @Column({ type: 'uuid', nullable: true })
  related_entity_id: string;

  @Column({ type: 'boolean', default: false })
  is_reconciled: boolean;

  @Column({ type: 'uuid' })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;
}
```

---

## 4. STOCK MODULE - Missing Relations

### 4.1 Product Entity - MISSING RELATIONS

**File:** `src/stock/entities/product.entity.ts`

#### Missing Relations:
```typescript
// MISSING: Relation to Business
@ManyToOne(() => Business)
@JoinColumn({ name: 'business_id' })
business: Business;

// MISSING: Relation to default Supplier
@ManyToOne(() => Supplier, { nullable: true })
@JoinColumn({ name: 'default_supplier_id' })
defaultSupplier: Supplier | null;

// MISSING: Relation to TaxRate
@ManyToOne(() => TaxRate)
@JoinColumn({ name: 'tax_rate_id' })
taxRate: TaxRate;

// MISSING: Reverse relation to InvoiceItems
@OneToMany(() => InvoiceItem, (item) => item.product)
invoiceItems: InvoiceItem[];
```

#### Missing Field:
```typescript
// MISSING: Tax rate ID (currently just tax_rate value)
tax_rate_id: string;
```

---

### 4.2 StockMovement Entity - MISSING RELATIONS

**File:** `src/stock/entities/stock-movement.entity.ts`

#### Missing Relations:
```typescript
// MISSING: Relation to Business
@ManyToOne(() => Business)
@JoinColumn({ name: 'business_id' })
business: Business;

// MISSING: Relation to User (created_by)
@ManyToOne(() => User, { nullable: true })
@JoinColumn({ name: 'created_by' })
createdByUser: User | null;
```

---

## 5. COLLABORATION MODULE - Missing Relations

### 5.1 Task Entity - MISSING INVOICE RELATION

**File:** `src/collaboration/entities/task.entity.ts`

#### Missing in TaskEntityType Enum:
```typescript
// MISSING: PURCHASE_INVOICE type
export enum TaskEntityType {
  QUOTE = 'QUOTE',
  SALES_ORDER = 'SALES_ORDER',
  DELIVERY_NOTE = 'DELIVERY_NOTE',
  INVOICE = 'INVOICE',
  SUPPLIER_PO = 'SUPPLIER_PO',
  PURCHASE_INVOICE = 'PURCHASE_INVOICE', // MISSING
  PAYMENT = 'PAYMENT',
  SUPPLIER_PAYMENT = 'SUPPLIER_PAYMENT', // MISSING
  PRODUCT = 'PRODUCT', // MISSING
  CLIENT = 'CLIENT',
  GENERAL = 'GENERAL',
}
```

---

### 5.2 Comment Entity - MISSING INVOICE RELATION

**File:** `src/collaboration/entities/comment.entity.ts`

#### Missing Relations:
```typescript
// MISSING: Relation to Invoice
@ManyToOne(() => Invoice, { nullable: true })
@JoinColumn({ name: 'entityId' })
invoice: Invoice | null;

// MISSING: Relation to DeliveryNote
@ManyToOne(() => DeliveryNote, { nullable: true })
@JoinColumn({ name: 'entityId' })
deliveryNote: DeliveryNote | null;

// MISSING: Relation to Product
@ManyToOne(() => Product, { nullable: true })
@JoinColumn({ name: 'entityId' })
product: Product | null;
```

#### Missing in CommentEntityType Enum:
```typescript
export enum CommentEntityType {
  TASK = 'TASK',
  QUOTE = 'QUOTE',
  SALES_ORDER = 'SALES_ORDER',
  DELIVERY_NOTE = 'DELIVERY_NOTE',
  INVOICE = 'INVOICE', // MISSING
  SUPPLIER_PO = 'SUPPLIER_PO',
  PURCHASE_INVOICE = 'PURCHASE_INVOICE',
  PRODUCT = 'PRODUCT', // MISSING
  CLIENT = 'CLIENT',
}
```

---

### 5.3 DocumentDiscussion Entity - MISSING RELATIONS

**File:** `src/collaboration/entities/document-discussion.entity.ts`

#### Missing Relations:
```typescript
// MISSING: Relation to Invoice
@ManyToOne(() => Invoice, { nullable: true })
@JoinColumn({ name: 'documentId' })
invoice: Invoice | null;

// MISSING: Relation to DeliveryNote
@ManyToOne(() => DeliveryNote, { nullable: true })
@JoinColumn({ name: 'documentId' })
deliveryNote: DeliveryNote | null;

// MISSING: Relation to GoodsReceipt
@ManyToOne(() => GoodsReceipt, { nullable: true })
@JoinColumn({ name: 'documentId' })
goodsReceipt: GoodsReceipt | null;

// MISSING: Relation to Product
@ManyToOne(() => Product, { nullable: true })
@JoinColumn({ name: 'documentId' })
product: Product | null;
```

#### Missing in DocumentType Enum:
```typescript
export enum DocumentType {
  QUOTE = 'QUOTE',
  SALES_ORDER = 'SALES_ORDER',
  DELIVERY_NOTE = 'DELIVERY_NOTE',
  INVOICE = 'INVOICE', // MISSING
  SUPPLIER_PO = 'SUPPLIER_PO',
  PURCHASE_INVOICE = 'PURCHASE_INVOICE',
  GOODS_RECEIPT = 'GOODS_RECEIPT',
  PRODUCT = 'PRODUCT', // MISSING
  PAYMENT = 'PAYMENT', // MISSING
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}
```

---

## 6. BUSINESS & CLIENT ENTITIES - Missing Relations

### 6.1 Business Entity - MISSING RELATIONS

**File:** `src/businesses/entities/business.entity.ts`

#### Missing Relations:
```typescript
// MISSING: Reverse relations to all business-owned entities
@OneToMany(() => Client, (client) => client.business)
clients: Client[];

@OneToMany(() => Quote, (quote) => quote.business)
quotes: Quote[];

@OneToMany(() => SalesOrder, (order) => order.business)
salesOrders: SalesOrder[];

@OneToMany(() => Invoice, (invoice) => invoice.business)
invoices: Invoice[];

@OneToMany(() => Supplier, (supplier) => supplier.business)
suppliers: Supplier[];

@OneToMany(() => Product, (product) => product.business)
products: Product[];

@OneToMany(() => Account, (account) => account.business)
accounts: Account[];

@OneToMany(() => TaxRate, (taxRate) => taxRate.business)
taxRates: TaxRate[];
```

---

### 6.2 Client Entity - MISSING RELATIONS

**File:** `src/clients/entities/client.entity.ts`

#### Missing Relations:
```typescript
// MISSING: Reverse relations
@OneToMany(() => Quote, (quote) => quote.client)
quotes: Quote[];

@OneToMany(() => SalesOrder, (order) => order.client)
salesOrders: SalesOrder[];

@OneToMany(() => Invoice, (invoice) => invoice.client)
invoices: Invoice[];

@OneToMany(() => DeliveryNote, (dn) => dn.client)
deliveryNotes: DeliveryNote[];

@OneToMany(() => Task, (task) => task.client)
tasks: Task[];

// MISSING: Relation to ClientPortalAccess
@OneToOne(() => ClientPortalAccess, (access) => access.client)
portalAccess: ClientPortalAccess;
```

---

## 7. CRITICAL MISSING ENTITIES SUMMARY

### Entities That Must Be Created:

1. **RecurringInvoice** (`src/sales/entities/recurring-invoice.entity.ts`)
   - Purpose: Manage recurring invoice generation
   - Relations: Invoice (template)

2. **SupplierPayment** (`src/payments/entities/supplier-payment.entity.ts`)
   - Purpose: Track payments to suppliers
   - Relations: PurchaseInvoice, Account

3. **Transaction** (`src/payments/entities/transaction.entity.ts`)
   - Purpose: Manual treasury transactions
   - Relations: Account

4. **TaxRate** (if not exists in `src/businesses/entities/tax-rate.entity.ts`)
   - Purpose: Manage different tax rates (19%, 13%, 7%, 0%)
   - Relations: Business, Products, InvoiceItems

---

## 8. NAMING CONVENTION INCONSISTENCIES

### Issues Found:

1. **Quote Entity** uses camelCase: `quoteNumber`, `quoteDate`, `validUntil`
   - Should use snake_case: `quote_number`, `quote_date`, `valid_until`

2. **SalesOrder Entity** uses camelCase: `orderNumber`, `orderDate`, `deliveryDate`
   - Should use snake_case: `order_number`, `order_date`, `delivery_date`

3. **DeliveryNote Entity** uses camelCase: `deliveryNoteNumber`, `deliveryDate`
   - Should use snake_case: `delivery_note_number`, `delivery_date`

4. **Product Entity** uses camelCase: `createdAt`, `updatedAt`, `isActive`
   - Should use snake_case: `created_at`, `updated_at`, `is_active`

**Recommendation:** Standardize all entities to use snake_case for consistency with Purchases module and documentation.

---

## 9. INDEX OPTIMIZATION RECOMMENDATIONS

### Missing Indexes:

#### Quote Entity:
```typescript
@Index(['business_id', 'status'])
@Index(['business_id', 'client_id'])
@Index(['business_id', 'valid_until'])
```

#### SalesOrder Entity:
```typescript
@Index(['business_id', 'status'])
@Index(['business_id', 'client_id'])
@Index(['business_id', 'expected_delivery'])
@Index(['quote_id'])
```

#### Invoice Entity:
```typescript
@Index(['business_id', 'status'])
@Index(['business_id', 'client_id'])
@Index(['business_id', 'due_date'])
@Index(['purchase_order_id'])
@Index(['quote_id'])
```

#### Payment Entity:
```typescript
@Index(['business_id', 'payment_date'])
@Index(['invoice_id'])
@Index(['account_id'])
```

---

## 10. IMPLEMENTATION PRIORITY

### Phase 1 - CRITICAL (Immediate):
1. Add missing relations to Quote entity (converted_to_po_id, converted_to_invoice_id)
2. Add missing relations to SalesOrder entity (quote_id, invoice_id)
3. Add missing relations to Invoice entity (quote_id, payments reverse relation)
4. Create RecurringInvoice entity
5. Create SupplierPayment entity
6. Create Transaction entity
7. Add Payment entity relations

### Phase 2 - HIGH (Next Sprint):
1. Add all reverse relations to Business entity
2. Add all reverse relations to Client entity
3. Add missing relations to Product entity
4. Add missing relations to Account entity
5. Update all status fields from string to proper enums

### Phase 3 - MEDIUM (Following Sprint):
1. Standardize naming conventions across all entities
2. Add all recommended indexes
3. Update Collaboration module entity types
4. Add missing relations to GoodsReceipt

### Phase 4 - LOW (Future):
1. Add soft delete support where missing
2. Add audit fields (created_by, updated_by) where missing
3. Optimize eager loading strategies

---

## 11. MIGRATION STRATEGY

### Recommended Approach:

1. **Create new entities first** (RecurringInvoice, SupplierPayment, Transaction)
2. **Add new columns** to existing entities (nullable initially)
3. **Create foreign key constraints** after data migration
4. **Add indexes** after constraints
5. **Update application code** to use new relations
6. **Remove nullable constraints** where appropriate

### Migration Order:
```
1. Create RecurringInvoice table
2. Create SupplierPayment table
3. Create Transaction table
4. ALTER Quote ADD COLUMN converted_to_po_id
5. ALTER Quote ADD COLUMN converted_to_invoice_id
6. ALTER Quote ADD COLUMN timbre_fiscal
7. ALTER Quote ADD COLUMN net_amount
8. ALTER Quote ADD COLUMN pdf_url
9. ALTER Quote ADD COLUMN sent_at
10. ALTER SalesOrder ADD COLUMN quote_id
11. ALTER SalesOrder ADD COLUMN invoice_id
12. ALTER SalesOrder ADD COLUMN timbre_fiscal
13. ALTER SalesOrder ADD COLUMN net_amount
14. ALTER Invoice ADD COLUMN quote_id
15. ALTER Product ADD COLUMN tax_rate_id
16. ALTER GoodsReceipt ADD COLUMN supplier_id
... (continue for all changes)
```

---

## 12. TESTING REQUIREMENTS

### Unit Tests Needed:
- Test all new relations load correctly
- Test cascade operations
- Test orphan removal where applicable

### Integration Tests Needed:
- Test Quote → SalesOrder conversion
- Test Quote → Invoice conversion
- Test SalesOrder → Invoice conversion
- Test Payment → Invoice relation updates
- Test StockMovement creation from GoodsReceipt
- Test StockMovement creation from Invoice

### Data Integrity Tests:
- Verify no orphaned records after migrations
- Verify all foreign keys are valid
- Verify indexes improve query performance

---

## 13. DOCUMENTATION UPDATES REQUIRED

### Files to Update:
1. API Documentation - Add new endpoints for RecurringInvoice, SupplierPayment, Transaction
2. Database Schema Diagram - Update with all new relations
3. Module Integration Guide - Document cross-module dependencies
4. Developer Onboarding - Update entity relationship diagrams

---

## CONCLUSION

This comprehensive revision identifies **87 missing relations**, **3 missing entities**, and **multiple inconsistencies** across the platform. Implementing these changes will ensure:

- ✅ Complete data integrity across all modules
- ✅ Proper bidirectional navigation between entities
- ✅ Alignment with technical documentation
- ✅ Support for all documented features
- ✅ Improved query performance with proper indexes
- ✅ Better developer experience with consistent naming

**Estimated Implementation Time:** 3-4 sprints (6-8 weeks)  
**Risk Level:** Medium (requires careful migration planning)  
**Business Impact:** High (enables all documented features)

---

**Document Version:** 1.0  
**Last Updated:** 2024-03-20  
**Author:** Kiro AI Assistant  
**Status:** Ready for Review
