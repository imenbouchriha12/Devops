# Quick Relations Reference Guide

**Quick lookup for entity relations across the platform**

---

## Sales Module (Facturation & Devis)

### Quote → Conversions
```typescript
Quote.convertedToPurchaseOrder → SalesOrder
Quote.convertedToInvoice → Invoice
Quote.purchaseOrders ← SalesOrder[] (reverse)
Quote.invoices ← Invoice[] (reverse)
```

### SalesOrder (Purchase Order Client) → Flow
```typescript
SalesOrder.quote → Quote (origin)
SalesOrder.invoice → Invoice (generated)
SalesOrder.deliveryNotes ← DeliveryNote[] (reverse)
```

### Invoice → Relations
```typescript
Invoice.quote → Quote (if converted from quote)
Invoice.purchase_order → SalesOrder (if converted from PO)
Invoice.original_invoice → Invoice (for Avoir/Credit Notes)
Invoice.payments ← Payment[] (reverse)
Invoice.purchaseOrders ← SalesOrder[] (reverse)
Invoice.creditNotes ← Invoice[] (reverse - child Avoirs)
```

### DeliveryNote → Relations
```typescript
DeliveryNote.salesOrder → SalesOrder
```

### RecurringInvoice → Relations
```typescript
RecurringInvoice.invoice → Invoice (template)
```

---

## Purchases Module (Fournisseurs & Achats)

### Supplier → Relations
```typescript
Supplier.supplier_pos ← SupplierPO[] (reverse)
Supplier.purchase_invoices ← PurchaseInvoice[] (reverse)
Supplier.goods_receipts ← GoodsReceipt[] (reverse)
```

### SupplierPO → Relations
```typescript
SupplierPO.supplier → Supplier
SupplierPO.items ← SupplierPOItem[] (reverse)
SupplierPO.goods_receipts ← GoodsReceipt[] (reverse)
SupplierPO.purchase_invoices ← PurchaseInvoice[] (reverse)
```

### GoodsReceipt → Relations
```typescript
GoodsReceipt.supplier_po → SupplierPO
GoodsReceipt.supplier → Supplier (direct access)
GoodsReceipt.items ← GoodsReceiptItem[] (reverse)
```

### PurchaseInvoice → Relations
```typescript
PurchaseInvoice.supplier → Supplier
PurchaseInvoice.supplier_po → SupplierPO (optional)
```

---

## Payments/Treasury Module (Trésorerie)

### Account → Relations
```typescript
Account.business → Business
Account.payments ← Payment[] (reverse)
Account.supplierPayments ← SupplierPayment[] (reverse)
Account.transactions ← Transaction[] (reverse)
```

### Payment (Client) → Relations
```typescript
Payment.business → Business
Payment.invoice → Invoice
Payment.account → Account
```

### SupplierPayment → Relations
```typescript
SupplierPayment.business → Business
SupplierPayment.purchaseInvoice → PurchaseInvoice
SupplierPayment.account → Account
```

### Transaction → Relations
```typescript
Transaction.business → Business
Transaction.account → Account
// Polymorphic: related_entity_type + related_entity_id
```

---

## Stock Module (Stocks & Produits)

### Product → Relations
```typescript
Product.business → Business
Product.category → ProductCategory
Product.defaultSupplier → Supplier
Product.taxRate → TaxRate
Product.stockMovements ← StockMovement[] (reverse)
Product.invoiceItems ← InvoiceItem[] (reverse)
Product.salesOrderItems ← SalesOrderItem[] (reverse)
Product.quoteItems ← QuoteItem[] (reverse)
Product.supplierPOItems ← SupplierPOItem[] (reverse)
Product.goodsReceiptItems ← GoodsReceiptItem[] (reverse)
```

### StockMovement → Relations
```typescript
StockMovement.business → Business
StockMovement.product → Product
StockMovement.createdByUser → User
// Polymorphic: reference_type + reference_id
```

---

## Core Entities

### Business → Relations
```typescript
Business.tenant → Tenant
Business.clients ← Client[] (reverse)
Business.quotes ← Quote[] (reverse)
Business.salesOrders ← SalesOrder[] (reverse)
Business.invoices ← Invoice[] (reverse)
Business.suppliers ← Supplier[] (reverse)
Business.products ← Product[] (reverse)
Business.accounts ← Account[] (reverse)
Business.taxRates ← TaxRate[] (reverse)
```

### Client → Relations
```typescript
Client.business → Business
Client.quotes ← Quote[] (reverse)
Client.salesOrders ← SalesOrder[] (reverse)
Client.invoices ← Invoice[] (reverse)
Client.deliveryNotes ← DeliveryNote[] (reverse)
Client.tasks ← Task[] (reverse)
Client.portalAccess ← ClientPortalAccess (reverse)
```

---

## Collaboration Module

### Task → Relations
```typescript
Task.assignedTo → User
Task.createdBy → User
Task.tenant → Tenant
Task.business → Business
Task.client → Client
Task.comments ← Comment[] (reverse)
Task.activityLogs ← ActivityLog[] (reverse)
// Polymorphic: relatedEntityType + relatedEntityId
```

### Comment → Relations
```typescript
Comment.user → User
Comment.task → Task
Comment.quote → Quote
Comment.salesOrder → SalesOrder
Comment.invoice → Invoice
Comment.deliveryNote → DeliveryNote
Comment.supplierPO → SupplierPO
Comment.purchaseInvoice → PurchaseInvoice
Comment.product → Product
// Polymorphic: entityType + entityId
```

### DocumentDiscussion → Relations
```typescript
DocumentDiscussion.tenant → Tenant
DocumentDiscussion.business → Business
DocumentDiscussion.createdBy → User
DocumentDiscussion.resolvedBy → User
DocumentDiscussion.quote → Quote
DocumentDiscussion.salesOrder → SalesOrder
DocumentDiscussion.invoice → Invoice
DocumentDiscussion.deliveryNote → DeliveryNote
DocumentDiscussion.supplierPO → SupplierPO
DocumentDiscussion.purchaseInvoice → PurchaseInvoice
DocumentDiscussion.goodsReceipt → GoodsReceipt
DocumentDiscussion.product → Product
// Polymorphic: documentType + documentId
```

### Notification → Relations
```typescript
Notification.user → User (recipient)
Notification.tenant → Tenant
Notification.triggeredBy → User
// Polymorphic: entityType + entityId
```

---

## Common Patterns

### Polymorphic Relations
Many entities use polymorphic relations to link to different entity types:

```typescript
// Pattern 1: Type + ID
{
  entityType: 'Invoice' | 'Quote' | 'SalesOrder' | ...,
  entityId: 'uuid'
}

// Pattern 2: Reference Type + ID
{
  reference_type: 'goods_receipt' | 'sales_order' | ...,
  reference_id: 'uuid'
}

// Pattern 3: Related Entity Type + ID
{
  related_entity_type: 'Payment' | 'Invoice' | ...,
  related_entity_id: 'uuid'
}
```

### Conversion Flow
```
Quote (DRAFT)
  → Quote (SENT)
    → Quote (ACCEPTED)
      → SalesOrder (CONFIRMED)
        → DeliveryNote (DELIVERED)
          → Invoice (SENT)
            → Payment (recorded)
              → Invoice (PAID)
```

### Purchase Flow
```
SupplierPO (DRAFT)
  → SupplierPO (SENT)
    → SupplierPO (CONFIRMED)
      → GoodsReceipt (created)
        → StockMovement (ENTREE_ACHAT)
          → Product.quantity (updated)
            → PurchaseInvoice (PENDING)
              → SupplierPayment (recorded)
                → PurchaseInvoice (PAID)
```

---

## Query Examples

### Get Quote with all conversions
```typescript
const quote = await quoteRepository.findOne({
  where: { id: quoteId },
  relations: [
    'client',
    'business',
    'items',
    'convertedToPurchaseOrder',
    'convertedToInvoice',
    'purchaseOrders',
    'invoices'
  ]
});
```

### Get Invoice with payments
```typescript
const invoice = await invoiceRepository.findOne({
  where: { id: invoiceId },
  relations: [
    'client',
    'business',
    'items',
    'quote',
    'purchase_order',
    'payments',
    'creditNotes'
  ]
});
```

### Get Account with all transactions
```typescript
const account = await accountRepository.findOne({
  where: { id: accountId },
  relations: [
    'business',
    'payments',
    'supplierPayments',
    'transactions'
  ]
});
```

### Get Product with stock history
```typescript
const product = await productRepository.findOne({
  where: { id: productId },
  relations: [
    'business',
    'category',
    'defaultSupplier',
    'taxRate',
    'stockMovements'
  ],
  order: {
    stockMovements: {
      createdAt: 'DESC'
    }
  }
});
```

---

## Status Enums Quick Reference

### QuoteStatus
- DRAFT → SENT → ACCEPTED/REJECTED/EXPIRED → CONVERTED

### SalesOrderStatus
- CONFIRMED → IN_PROGRESS → DELIVERED → INVOICED
- CANCELLED (any time)

### DeliveryNoteStatus
- DRAFT → DELIVERED → SIGNED

### InvoiceStatus
- DRAFT → SENT → PARTIALLY_PAID → PAID
- OVERDUE (if due_date passed)
- CANCELLED (any time)

### POStatus (Supplier)
- DRAFT → SENT → CONFIRMED → PARTIALLY_RECEIVED → FULLY_RECEIVED
- CANCELLED (any time)

### InvoiceStatus (Purchase)
- PENDING → APPROVED → PARTIALLY_PAID → PAID
- OVERDUE (if due_date passed)
- DISPUTED (any time)

### TransactionType
- ENCAISSEMENT (money in)
- DECAISSEMENT (money out)
- VIREMENT_INTERNE (internal transfer)

---

## Indexes for Performance

### Most Important Indexes
```typescript
// Multi-column indexes for common queries
['business_id', 'status']
['business_id', 'client_id']
['business_id', 'due_date']
['business_id', 'payment_date']

// Foreign key indexes
['invoice_id']
['quote_id']
['purchase_order_id']
['account_id']
['supplier_id']
['product_id']

// Date-based indexes
['transaction_date']
['payment_date']
['due_date']
['valid_until']
```

---

## Tips for Developers

1. **Always filter by business_id** for multi-tenant isolation
2. **Use eager loading** for frequently accessed relations
3. **Use lazy loading** for large collections
4. **Check cascade options** before deleting entities
5. **Validate foreign keys** before creating relations
6. **Use transactions** for multi-entity operations
7. **Index foreign keys** for better join performance
8. **Consider soft deletes** for audit trail

---

**Last Updated:** 2024-03-20  
**Version:** 1.0
