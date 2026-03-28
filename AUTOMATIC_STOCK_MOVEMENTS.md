# Automatic Stock Movements Integration

## Overview
This document describes the automatic stock movement integration that was implemented to synchronize stock levels with purchase orders and sales orders.

## Changes Made

### 1. Stock Movement Types Updated
**File:** `src/stock/enums/stock-movement-type.enum.ts`

- **Removed:** `ENTREE_RETOUR_CLIENT` (client return entry) - not necessary for the current workflow
- **Kept:** `SORTIE_VENTE` (sales exit) - now available for both manual and automatic stock movements
- **Available Types:**
  - `ENTREE_ACHAT` - Purchase entry (increment)
  - `SORTIE_VENTE` - Sales exit (decrement)
  - `AJUSTEMENT_POSITIF` - Positive adjustment (increment)
  - `AJUSTEMENT_NEGATIF` - Negative adjustment (decrement)

### 2. Purchase Orders Integration
**File:** `src/Purchases/services/supplier-pos.service.ts`

**Changes:**
- Injected `StockMovementsService` into the service
- Modified `updateStatusAfterReceipt()` method to detect status changes
- Added `createStockMovementsForPO()` private method

**Behavior:**
- Stock movements are automatically created when a purchase order status changes to:
  - `PARTIALLY_RECEIVED` - When some items have been received
  - `FULLY_RECEIVED` - When all items have been received
- For each item in the purchase order that has a `product_id` and `quantity_received > 0`:
  - Creates a stock movement of type `ENTREE_ACHAT`
  - Increases the product's `current_stock` by the received quantity
  - Links the movement to the purchase order via `source_type: 'SUPPLIER_PO'` and `source_id`
  - Adds a note: `"Réception bon de commande {po_number}"`

**Error Handling:**
- If a stock movement fails for one product, the process continues with other products
- Errors are logged to the console for debugging

### 3. Sales Orders Integration
**File:** `src/sales/services/sales-orders.service.ts`

**Changes:**
- Injected `StockMovementsService` and `Product` repository into the service
- Modified `create()` method to call stock movement creation after order creation
- Added `createStockMovementsForSalesOrder()` private method

**Behavior:**
- Stock movements are automatically created when a sales order is created with status `CONFIRMED`
- For each item in the sales order that has a `stock_product_id`:
  - Verifies the product exists and is stockable
  - Creates a stock movement of type `SORTIE_VENTE`
  - Decreases the product's `current_stock` by the ordered quantity
  - Links the movement to the sales order via `source_type: 'SALES_ORDER'` and `source_id`
  - Adds a note: `"Vente commande {orderNumber}"`

**Error Handling:**
- If a stock movement fails for one product, the process continues with other products
- Errors are logged to the console for debugging
- If insufficient stock is available, the stock movement service will throw an error preventing negative stock

### 4. Module Dependencies
**Files:** 
- `src/Purchases/purchases.module.ts`
- `src/sales/sales.module.ts`

**Changes:**
- Both modules now import `StockModule` to access stock movement services
- This allows the purchase and sales services to create stock movements automatically

## Data Flow

### Purchase Order Flow
```
1. Purchase Order created (status: DRAFT)
2. Purchase Order sent to supplier (status: SENT)
3. Purchase Order confirmed (status: CONFIRMED)
4. Goods Receipt created → Updates quantity_received on PO items
5. updateStatusAfterReceipt() called
6. Status changes to PARTIALLY_RECEIVED or FULLY_RECEIVED
7. ✅ Stock movements automatically created (ENTREE_ACHAT)
8. Product current_stock increased
```

### Sales Order Flow
```
1. Sales Order created (status: CONFIRMED)
2. ✅ Stock movements automatically created (SORTIE_VENTE)
3. Product current_stock decreased
4. Sales Order progresses through workflow (IN_PROGRESS → DELIVERED → INVOICED)
```

## Manual Stock Movements
Manual stock movements are still available through the stock management interface with the following types:
- `ENTREE_ACHAT` - Manual purchase entry
- `SORTIE_VENTE` - Manual sales exit
- `AJUSTEMENT_POSITIF` - Positive adjustment (for corrections, inventory counts, etc.)
- `AJUSTEMENT_NEGATIF` - Negative adjustment (for corrections, damaged goods, etc.)

## Important Notes

1. **Stock Product ID:** Sales order items must have a `stock_product_id` field populated for automatic stock movements to work. This field links the sales order item to a product in the stock module.

2. **Stockable Products:** Only products with `is_stockable = true` will have stock movements created automatically.

3. **Transaction Safety:** All stock movements are created within database transactions to ensure data consistency.

4. **Negative Stock Prevention:** The stock movement service prevents negative stock by checking available quantity before creating decrement movements.

5. **Audit Trail:** All automatic stock movements are linked to their source (purchase order or sales order) via `source_type` and `source_id` fields, providing a complete audit trail.

6. **Idempotency:** The system checks the previous status before creating stock movements to avoid duplicate entries if the method is called multiple times.

## Testing Recommendations

1. **Purchase Order Testing:**
   - Create a purchase order with multiple items
   - Create a goods receipt for partial quantities
   - Verify stock movements are created with correct quantities
   - Verify product stock levels are updated correctly
   - Complete the goods receipt
   - Verify final stock movements and levels

2. **Sales Order Testing:**
   - Create a sales order with products that have sufficient stock
   - Verify stock movements are created immediately
   - Verify product stock levels are decreased
   - Try creating a sales order with insufficient stock
   - Verify the system prevents negative stock

3. **Error Handling Testing:**
   - Create orders with non-stockable products
   - Create orders with invalid product IDs
   - Verify the system continues processing other items when one fails

## Future Enhancements

1. **Stock Reservations:** Consider implementing stock reservations when sales orders are created, with actual stock deduction on delivery.

2. **Batch Operations:** Optimize stock movement creation for large orders with many items.

3. **Notifications:** Add notifications when stock movements fail or when stock levels fall below thresholds.

4. **Rollback Mechanism:** Implement automatic rollback of stock movements when orders are cancelled.
