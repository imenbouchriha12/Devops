# Stock Module Relations Summary

## Overview
This document describes all the relations created for the stock module entities and their connections with other modules.

## Entity Relations

### 1. Product Entity (`src/stock/entities/product.entity.ts`)

#### Internal Relations
- **category** (ManyToOne → ProductCategory): Each product belongs to one category
- **stockMovements** (OneToMany → StockMovement): Track all inventory movements for this product

#### Cross-Module Relations
- **salesOrderItems** (OneToMany → SalesOrderItem): Products used in sales orders
- **quoteItems** (OneToMany → QuoteItem): Products included in quotes
- **deliveryNoteItems** (OneToMany → DeliveryNoteItem): Products in delivery notes
- **stockExitItems** (OneToMany → StockExitItem): Products in stock exits
- **supplierPOItems** (OneToMany → SupplierPOItem): Products in purchase orders
- **goodsReceiptItems** (OneToMany → GoodsReceiptItem): Products received from suppliers

#### Key Fields Added
- `business_id`: Multi-tenant isolation
- `category_id`: Link to product category
- `default_supplier_id`: Default supplier for reordering
- `unit`: Unit of measure (pcs, kg, L, m)
- `barcode`: For scanning and tracking
- `weight` & `dimensions`: For shipping calculations
- `tax_rate`: Product-specific tax rate
- `track_inventory`: Enable/disable inventory tracking
- `type`: product, service, or bundle

### 2. ProductCategory Entity (`src/stock/entities/product-category.entity.ts`)

#### Relations
- **parent** (ManyToOne → ProductCategory): Parent category for hierarchical structure
- **children** (OneToMany → ProductCategory): Child categories
- **products** (OneToMany → Product): All products in this category

#### Key Fields Added
- `business_id`: Multi-tenant isolation
- `parent_id`: For hierarchical categories
- `code`: Category code for reporting
- `sort_order`: Display order
- `image_url`: Category image/icon

### 3. StockMovement Entity (`src/stock/entities/stock-movement.entity.ts`)

#### Relations
- **product** (ManyToOne → Product): The product being moved

#### Key Fields Added
- `business_id`: Multi-tenant isolation
- `quantity_before`: Stock level before movement
- `quantity_after`: Stock level after movement
- `unit_cost`: Cost at time of movement
- `total_value`: Total value of movement
- `reference_type`: Type of source document (polymorphic)
- `reference_id`: ID of source document
- `created_by`: User who created the movement
- `location`: Warehouse/location identifier

## Cross-Module Updates

### Purchase Module

#### SupplierPOItem
- Added `product` relation (ManyToOne → Product)
- Added `product_id` index

#### GoodsReceiptItem
- Added `product` relation (ManyToOne → Product)

#### Supplier
- Added `products` relation (OneToMany → Product) for default supplier tracking

### Sales Module

#### SalesOrderItem
- Updated `product` relation with proper bidirectional mapping
- Added `@JoinColumn` for explicit column naming

#### QuoteItem
- Updated `product` relation with proper bidirectional mapping
- Added `@JoinColumn` for explicit column naming

#### DeliveryNoteItem
- Updated `product` relation with proper bidirectional mapping
- Added `@JoinColumn` for explicit column naming

#### StockExitItem
- Updated `product` relation with proper bidirectional mapping
- Added `@JoinColumn` for explicit column naming

## Database Indexes

### Product
- `business_id, isActive`: Fast filtering of active products per business
- `business_id, sku`: Quick SKU lookups per business
- `category_id`: Fast category filtering

### ProductCategory
- `business_id, isActive`: Active categories per business
- `business_id, name`: Category name searches
- `parent_id`: Hierarchical queries

### StockMovement
- `productId, createdAt`: Movement history per product
- `business_id, type`: Movement type filtering per business
- `reference_type, reference_id`: Source document lookups

## Multi-Tenant Isolation

All stock entities include `business_id` for proper multi-tenant isolation:
- Each business has its own products, categories, and stock movements
- Queries are automatically scoped by business_id
- Prevents data leakage between tenants

## Stock Valuation Flow

1. **Purchase**: GoodsReceiptItem → creates StockMovement (IN) → updates Product.quantity
2. **Sale**: SalesOrderItem → creates StockMovement (OUT) → updates Product.quantity
3. **Adjustment**: Manual StockMovement (ADJUSTMENT) → updates Product.quantity

Each movement tracks:
- Quantity before/after
- Unit cost at time of movement
- Total value for accounting
- Reference to source document

## Best Practices

1. **Always create StockMovement** when changing product quantities
2. **Use reference_type and reference_id** to link movements to source documents
3. **Track unit_cost** for accurate inventory valuation
4. **Set quantity_before and quantity_after** for audit trail
5. **Use business_id** in all queries for multi-tenant isolation
6. **Leverage indexes** for performance on large datasets
