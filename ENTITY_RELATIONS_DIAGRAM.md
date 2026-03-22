# Entity Relations Diagram

**Visual representation of all entity relations**

---

## Sales Module - Document Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SALES DOCUMENT FLOW                       │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────┐
                    │  Client  │
                    └────┬─────┘
                         │
                         │ has many
                         ▼
    ┌────────────────────────────────────────────────┐
    │                                                 │
    ▼                                                 ▼
┌─────────┐                                    ┌──────────┐
│  Quote  │──────converted_to_po_id───────────▶│SalesOrder│
│ (Devis) │                                    │   (BC)   │
└────┬────┘                                    └────┬─────┘
     │                                              │
     │ converted_to_invoice_id                     │ invoice_id
     │                                              │
     └──────────────────┬───────────────────────────┘
                        ▼
                  ┌──────────┐
                  │ Invoice  │
                  │(Facture) │
                  └────┬─────┘
                       │
                       │ has many
                       ▼
                  ┌──────────┐
                  │ Payment  │
                  └──────────┘

REVERSE RELATIONS:
Quote.purchaseOrders ← SalesOrder[]
Quote.invoices ← Invoice[]
SalesOrder.deliveryNotes ← DeliveryNote[]
Invoice.payments ← Payment[]
Invoice.creditNotes ← Invoice[] (Avoir)
```

---

## Sales Module - Detailed Relations

```
┌──────────────────────────────────────────────────────────────────┐
│                         QUOTE ENTITY                              │
├──────────────────────────────────────────────────────────────────┤
│ Fields:                                                           │
│  - id, quoteNumber, quoteDate, validUntil                        │
│  - subtotal, taxAmount, total, timbreFiscal, netAmount           │
│  - status (DRAFT|SENT|ACCEPTED|REJECTED|EXPIRED|CONVERTED)      │
│  - convertedToPoId, convertedToInvoiceId                         │
│  - pdfUrl, sentAt                                                │
├──────────────────────────────────────────────────────────────────┤
│ Relations:                                                        │
│  → Business (ManyToOne)                                          │
│  → Client (ManyToOne)                                            │
│  → SalesOrder (ManyToOne) [convertedToPurchaseOrder]            │
│  → Invoice (ManyToOne) [convertedToInvoice]                     │
│  ← QuoteItem[] (OneToMany)                                       │
│  ← SalesOrder[] (OneToMany) [purchaseOrders]                    │
│  ← Invoice[] (OneToMany) [invoices]                             │
└──────────────────────────────────────────────────────────────────┘
                    │                    │
                    ▼                    ▼
        ┌─────────────────┐    ┌─────────────────┐
        │  SalesOrder     │    │    Invoice      │
        ├─────────────────┤    ├─────────────────┤
        │ - quoteId       │    │ - quote_id      │
        │ - invoiceId     │    │ - purchase_     │
        │ - timbreFiscal  │    │   order_id      │
        │ - netAmount     │    │ - original_     │
        │ - status        │    │   invoice_id    │
        │   (CONFIRMED|   │    │ - timbre_fiscal │
        │    IN_PROGRESS| │    │ - net_amount    │
        │    DELIVERED|   │    │ - paid_amount   │
        │    INVOICED|    │    │ - status        │
        │    CANCELLED)   │    │   (DRAFT|SENT|  │
        │                 │    │    PARTIALLY_   │
        │ → Quote         │    │    PAID|PAID|   │
        │ → Invoice       │    │    OVERDUE|     │
        │ → Business      │    │    CANCELLED)   │
        │ → Client        │    │                 │
        │ ← DeliveryNote[]│    │ → Quote         │
        │ ← SalesOrderItem│    │ → SalesOrder    │
        └─────────────────┘    │ → Business      │
                               │ → Client        │
                               │ ← Payment[]     │
                               │ ← InvoiceItem[] │
                               │ ← SalesOrder[]  │
                               │ ← Invoice[]     │
                               │   [creditNotes] │
                               └─────────────────┘
```

---

## Purchases Module - Document Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      PURCHASES DOCUMENT FLOW                     │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────┐
                    │ Supplier │
                    │(Fourniss)│
                    └────┬─────┘
                         │
                         │ has many
                         ▼
    ┌────────────────────────────────────────────────┐
    │                                                 │
    ▼                                                 ▼
┌────────────┐                              ┌──────────────┐
│SupplierPO  │──────────────────────────────│GoodsReceipt  │
│(BC Fourn.) │                              │(Bon Récept.) │
└─────┬──────┘                              └──────┬───────┘
      │                                            │
      │ has many                                   │ triggers
      ▼                                            ▼
┌──────────────┐                          ┌──────────────┐
│PurchaseInvoice│                         │StockMovement │
│(Fact. Fourn.) │                         │(ENTREE_ACHAT)│
└──────┬────────┘                         └──────────────┘
       │
       │ has many
       ▼
┌────────────────┐
│SupplierPayment │
│(Règl. Fourn.)  │
└────────────────┘

REVERSE RELATIONS:
Supplier.supplier_pos ← SupplierPO[]
Supplier.purchase_invoices ← PurchaseInvoice[]
Supplier.goods_receipts ← GoodsReceipt[]
SupplierPO.goods_receipts ← GoodsReceipt[]
SupplierPO.purchase_invoices ← PurchaseInvoice[]
```

---

## Payments/Treasury Module

```
┌─────────────────────────────────────────────────────────────────┐
│                      TREASURY STRUCTURE                          │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────┐
                    │ Business │
                    └────┬─────┘
                         │
                         │ has many
                         ▼
                    ┌──────────┐
                    │ Account  │
                    │(Compte)  │
                    └────┬─────┘
                         │
                         │ has many
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌─────────┐   ┌──────────────┐  ┌─────────────┐
    │ Payment │   │SupplierPayment│  │Transaction  │
    │(Client) │   │(Fournisseur)  │  │(Manuel)     │
    └────┬────┘   └───────┬───────┘  └──────┬──────┘
         │                │                  │
         │ belongs to     │ belongs to       │ polymorphic
         ▼                ▼                  ▼
    ┌─────────┐   ┌──────────────┐  ┌─────────────┐
    │ Invoice │   │PurchaseInvoice│  │   Any       │
    └─────────┘   └───────────────┘  │  Entity     │
                                      └─────────────┘

ACCOUNT RELATIONS:
Account → Business (ManyToOne)
Account ← Payment[] (OneToMany)
Account ← SupplierPayment[] (OneToMany)
Account ← Transaction[] (OneToMany)

PAYMENT RELATIONS:
Payment → Business (ManyToOne)
Payment → Invoice (ManyToOne)
Payment → Account (ManyToOne)

SUPPLIER PAYMENT RELATIONS:
SupplierPayment → Business (ManyToOne)
SupplierPayment → PurchaseInvoice (ManyToOne)
SupplierPayment → Account (ManyToOne)

TRANSACTION RELATIONS:
Transaction → Business (ManyToOne)
Transaction → Account (ManyToOne)
Transaction → Any Entity (Polymorphic)
```

---

## Stock Module Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                      STOCK MANAGEMENT                            │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────┐
                    │ Product  │
                    └────┬─────┘
                         │
                         │ has many
                         ▼
                ┌──────────────────┐
                │  StockMovement   │
                └────────┬─────────┘
                         │
                         │ triggered by
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │GoodsReceipt│  │ Invoice  │   │ Manual   │
    │(ENTREE)   │   │(SORTIE)  │   │Adjustment│
    └───────────┘   └──────────┘   └──────────┘

PRODUCT RELATIONS:
Product → Business (ManyToOne)
Product → ProductCategory (ManyToOne)
Product → Supplier (ManyToOne) [defaultSupplier]
Product → TaxRate (ManyToOne)
Product ← StockMovement[] (OneToMany)
Product ← InvoiceItem[] (OneToMany)
Product ← QuoteItem[] (OneToMany)
Product ← SalesOrderItem[] (OneToMany)
Product ← SupplierPOItem[] (OneToMany)
Product ← GoodsReceiptItem[] (OneToMany)

STOCK MOVEMENT TYPES:
- ENTREE_ACHAT (from GoodsReceipt)
- SORTIE_VENTE (from Invoice)
- ENTREE_RETOUR_CLIENT (from Credit Note)
- SORTIE_RETOUR_FOURNISSEUR (to Supplier)
- AJUSTEMENT_MANUEL_POSITIF
- AJUSTEMENT_MANUEL_NEGATIF
- INVENTAIRE
```

---

## Collaboration Module

```
┌─────────────────────────────────────────────────────────────────┐
│                    COLLABORATION STRUCTURE                       │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────┐
                    │  Tenant  │
                    └────┬─────┘
                         │
                         │ has many
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌─────────┐   ┌──────────┐   ┌─────────────┐
    │  Task   │   │ Comment  │   │Notification │
    └────┬────┘   └────┬─────┘   └──────┬──────┘
         │             │                 │
         │ linked to   │ on              │ about
         ▼             ▼                 ▼
    ┌──────────────────────────────────────┐
    │         Any Document Entity          │
    │  (Quote, Invoice, SalesOrder, etc.)  │
    └──────────────────────────────────────┘

TASK RELATIONS:
Task → User (ManyToOne) [assignedTo]
Task → User (ManyToOne) [createdBy]
Task → Tenant (ManyToOne)
Task → Business (ManyToOne)
Task → Client (ManyToOne)
Task → Any Entity (Polymorphic) [relatedEntity]
Task ← Comment[] (OneToMany)
Task ← ActivityLog[] (OneToMany)

COMMENT RELATIONS:
Comment → User (ManyToOne)
Comment → Task (ManyToOne)
Comment → Quote (ManyToOne)
Comment → SalesOrder (ManyToOne)
Comment → Invoice (ManyToOne)
Comment → SupplierPO (ManyToOne)
Comment → PurchaseInvoice (ManyToOne)
Comment → Product (ManyToOne)

DOCUMENT DISCUSSION RELATIONS:
DocumentDiscussion → Tenant (ManyToOne)
DocumentDiscussion → Business (ManyToOne)
DocumentDiscussion → User (ManyToOne) [createdBy]
DocumentDiscussion → User (ManyToOne) [resolvedBy]
DocumentDiscussion → Any Document (Polymorphic)
```

---

## Core Entities - Business & Client

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORE ENTITY STRUCTURE                         │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────┐
                    │  Tenant  │
                    └────┬─────┘
                         │
                         │ has many
                         ▼
                    ┌──────────┐
                    │ Business │
                    └────┬─────┘
                         │
                         │ has many
         ┌───────────────┼───────────────┬──────────────┐
         ▼               ▼               ▼              ▼
    ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Client  │   │ Supplier │   │ Product  │   │ Account  │
    └────┬────┘   └──────────┘   └──────────┘   └──────────┘
         │
         │ has many
         ▼
    ┌──────────────────────────────────────┐
    │  Quote, SalesOrder, Invoice, etc.    │
    └──────────────────────────────────────┘

BUSINESS REVERSE RELATIONS:
Business ← Client[] (OneToMany)
Business ← Quote[] (OneToMany)
Business ← SalesOrder[] (OneToMany)
Business ← Invoice[] (OneToMany)
Business ← Supplier[] (OneToMany)
Business ← Product[] (OneToMany)
Business ← Account[] (OneToMany)
Business ← TaxRate[] (OneToMany)

CLIENT REVERSE RELATIONS:
Client ← Quote[] (OneToMany)
Client ← SalesOrder[] (OneToMany)
Client ← Invoice[] (OneToMany)
Client ← DeliveryNote[] (OneToMany)
Client ← Task[] (OneToMany)
Client ← ClientPortalAccess (OneToOne)
```

---

## Recurring Invoices

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECURRING INVOICE FLOW                        │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │     Invoice      │
    │   (Template)     │
    └────────┬─────────┘
             │
             │ used by
             ▼
    ┌──────────────────┐
    │RecurringInvoice  │
    │                  │
    │ - frequency      │
    │   (MONTHLY|      │
    │    QUARTERLY|    │
    │    YEARLY)       │
    │ - start_date     │
    │ - end_date       │
    │ - next_generation│
    │ - is_active      │
    └────────┬─────────┘
             │
             │ generates
             ▼
    ┌──────────────────┐
    │  New Invoice     │
    │  (Auto-created)  │
    └──────────────────┘

CRON JOB PROCESS:
1. Check RecurringInvoice where next_generation <= TODAY
2. Clone template Invoice
3. Update dates and invoice_number
4. Set status to DRAFT
5. Update RecurringInvoice.last_generated
6. Calculate next_generation based on frequency
```

---

## Complete Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  COMPLETE SYSTEM OVERVIEW                        │
└─────────────────────────────────────────────────────────────────┘

                         ┌──────────┐
                         │  Tenant  │
                         └────┬─────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
          ┌──────────┐              ┌──────────────┐
          │ Business │              │ TeamMember   │
          └────┬─────┘              └──────────────┘
               │
    ┌──────────┼──────────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Client  │ │Supplier│ │Product │ │Account │ │TaxRate │
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └────────┘
    │          │          │          │
    │          │          │          │
    ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────┐
│         SALES DOCUMENTS                      │
│  Quote → SalesOrder → DeliveryNote → Invoice│
└────────────────┬────────────────────────────┘
                 │
                 ▼
         ┌──────────────┐
         │   Payment    │
         └──────────────┘

┌─────────────────────────────────────────────┐
│       PURCHASE DOCUMENTS                     │
│  SupplierPO → GoodsReceipt → PurchaseInvoice│
└────────────────┬────────────────────────────┘
                 │
                 ▼
         ┌──────────────────┐
         │ SupplierPayment  │
         └──────────────────┘

┌─────────────────────────────────────────────┐
│         STOCK MANAGEMENT                     │
│  Product → StockMovement                     │
└──────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        COLLABORATION                         │
│  Task, Comment, Notification, ActivityLog   │
└──────────────────────────────────────────────┘
```

---

## Legend

```
Symbols Used:
─────────────
→  ManyToOne relation (belongs to)
←  OneToMany relation (has many)
↔  ManyToMany relation
▼  Flow direction
┌─┐ Entity box
│  │ Entity content
└─┘ Entity box end

Relation Types:
───────────────
ManyToOne:  Child → Parent (e.g., Invoice → Client)
OneToMany:  Parent ← Child[] (e.g., Client ← Invoice[])
OneToOne:   Entity ↔ Entity (e.g., Client ↔ ClientPortalAccess)
Polymorphic: Entity → Any (e.g., Comment → Any Document)

Cascade Options:
────────────────
cascade: true     - Save/delete children with parent
eager: true       - Always load relation
lazy (default)    - Load relation on demand
nullable: true    - Relation is optional
```

---

**Last Updated:** 2024-03-20  
**Version:** 1.0  
**Purpose:** Visual reference for entity relations
