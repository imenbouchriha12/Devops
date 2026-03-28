# Stock Movements Module Documentation

## Overview

The Stock Movements module is the **ONLY** way to update product stock levels. Direct updates to `Product.current_stock` are **FORBIDDEN**.

---

## Key Principles

### 🚨 CRITICAL RULE
**Stock must NEVER be updated directly in Product entity.**

All stock changes MUST go through StockMovement to ensure:
- Complete audit trail
- Data integrity
- Transaction safety
- Business logic consistency

---

## Architecture

### Entity: StockMovement

**Table:** `stock_movements`

**Fields:**
```typescript
{
  id: UUID                    // Primary key
  product_id: UUID            // Required - Product reference
  business_id: UUID           // Required - Multi-tenant isolation
  type: StockMovementType     // Required - Movement type enum
  quantity: number            // Required - Positive decimal (15,3)
  stock_before: number        // Calculated - Stock before movement
  stock_after: number         // Calculated - Stock after movement
  source_type: string | null  // Optional - Source entity type
  source_id: UUID | null      // Optional - Source entity ID
  note: string | null         // Optional - Additional notes
  created_by: UUID | null     // Optional - User who created
  created_at: timestamp       // Auto - Creation timestamp
}
```

### Enum: StockMovementType

```typescript
enum StockMovementType {
  ENTREE_ACHAT = 'ENTREE_ACHAT',                    // Purchase entry
  SORTIE_VENTE = 'SORTIE_VENTE',                    // Sale exit
  ENTREE_RETOUR_CLIENT = 'ENTREE_RETOUR_CLIENT',    // Customer return
  AJUSTEMENT_POSITIF = 'AJUSTEMENT_POSITIF',        // Manual increase
  AJUSTEMENT_NEGATIF = 'AJUSTEMENT_NEGATIF',        // Manual decrease
}
```

**Increment Types** (add to stock):
- `ENTREE_ACHAT`
- `ENTREE_RETOUR_CLIENT`
- `AJUSTEMENT_POSITIF`

**Decrement Types** (remove from stock):
- `SORTIE_VENTE`
- `AJUSTEMENT_NEGATIF`

---

## Business Logic

### Creating a Stock Movement

**Process Flow:**

1. **Fetch Product** (with pessimistic lock)
   ```typescript
   const product = await queryRunner.manager.findOne(Product, {
     where: { id: product_id, business_id },
     lock: { mode: 'pessimistic_write' }
   });
   ```

2. **Validate Product**
   - Product exists
   - Product belongs to business
   - Product is stockable (`is_stockable = true`)

3. **Validate Quantity**
   - Must be > 0
   - Decimal precision: 15,3

4. **Get Current Stock**
   ```typescript
   const stock_before = product.current_stock;
   ```

5. **Calculate New Stock**
   ```typescript
   if (isIncrementType(type)) {
     stock_after = stock_before + quantity;
   } else if (isDecrementType(type)) {
     stock_after = stock_before - quantity;
     
     // Prevent negative stock
     if (stock_after < 0) {
       throw new BadRequestException('Insufficient stock');
     }
   }
   ```

6. **Create Movement Record**
   ```typescript
   const movement = await queryRunner.manager.save(StockMovement, {
     product_id,
     business_id,
     type,
     quantity,
     stock_before,
     stock_after,
     source_type,
     source_id,
     note,
     created_by
   });
   ```

7. **Update Product Stock** (ONLY place where this happens)
   ```typescript
   product.current_stock = stock_after;
   await queryRunner.manager.save(product);
   ```

8. **Commit Transaction**

### Transaction Safety

All stock movements use database transactions:
- Pessimistic locking prevents race conditions
- Rollback on any error
- Atomic operations guaranteed

---

## API Endpoints

### Manual Movements (Frontend)

**POST** `/businesses/:businessId/stock-movements/manual`
- **Auth:** Required (JWT)
- **Roles:** BUSINESS_OWNER, BUSINESS_ADMIN
- **Body:**
  ```json
  {
    "product_id": "uuid",
    "type": "AJUSTEMENT_POSITIF",
    "quantity": 10.5,
    "note": "Manual adjustment"
  }
  ```

**GET** `/businesses/:businessId/stock-movements`
- **Auth:** Required (JWT)
- **Query Params:**
  - `product_id` (optional)
  - `type` (optional)
  - `start_date` (optional)
  - `end_date` (optional)
  - `limit` (optional, default: 50)
  - `offset` (optional, default: 0)

**GET** `/businesses/:businessId/stock-movements/:id`
- **Auth:** Required (JWT)
- **Returns:** Single movement details

**GET** `/businesses/:businessId/stock-movements/product/:productId/history`
- **Auth:** Required (JWT)
- **Returns:** Movement history for a product

**GET** `/businesses/:businessId/stock-movements/product/:productId/summary`
- **Auth:** Required (JWT)
- **Returns:**
  ```json
  {
    "current_stock": 100,
    "total_entries": 150,
    "total_exits": 50,
    "last_movement": { ... }
  }
  ```

**GET** `/businesses/:businessId/stock-movements/source/:sourceType/:sourceId`
- **Auth:** Required (JWT)
- **Returns:** All movements from a specific source

### Internal Movements (Backend)

**POST** `/internal/stock-movements`
- **Auth:** None (internal use only)
- **Body:**
  ```json
  {
    "business_id": "uuid",
    "product_id": "uuid",
    "type": "SORTIE_VENTE",
    "quantity": 5,
    "source_type": "Invoice",
    "source_id": "uuid",
    "note": "Sold via invoice #INV-001",
    "created_by": "uuid"
  }
  ```

---

## Integration with Other Modules

### Example: Sales Module

When an invoice is created:

```typescript
// In InvoiceService
async createInvoice(data: CreateInvoiceDto) {
  // 1. Create invoice
  const invoice = await this.invoiceRepo.save(invoiceData);
  
  // 2. For each item with a product
  for (const item of data.items) {
    if (item.product_id) {
      // 3. Create stock movement
      await this.stockMovementsService.createInternal({
        business_id: invoice.business_id,
        product_id: item.product_id,
        type: StockMovementType.SORTIE_VENTE,
        quantity: item.quantity,
        source_type: 'Invoice',
        source_id: invoice.id,
        note: `Sale via invoice ${invoice.invoice_number}`,
        created_by: invoice.created_by,
      });
    }
  }
  
  return invoice;
}
```

### Example: Purchases Module

When goods are received:

```typescript
// In GoodsReceiptService
async receiveGoods(data: CreateGoodsReceiptDto) {
  // 1. Create goods receipt
  const receipt = await this.receiptRepo.save(receiptData);
  
  // 2. For each item
  for (const item of data.items) {
    // 3. Create stock movement
    await this.stockMovementsService.createInternal({
      business_id: receipt.business_id,
      product_id: item.product_id,
      type: StockMovementType.ENTREE_ACHAT,
      quantity: item.quantity_received,
      source_type: 'GoodsReceipt',
      source_id: receipt.id,
      note: `Received from PO ${receipt.po_number}`,
      created_by: receipt.created_by,
    });
  }
  
  return receipt;
}
```

---

## Frontend Usage

### Creating a Manual Movement

```typescript
import { stockMovementsApi } from '@/api/stock-movements.api';
import { StockMovementType } from '@/types/stock-movement';

// Create adjustment
await stockMovementsApi.createManual(businessId, {
  product_id: 'product-uuid',
  type: StockMovementType.AJUSTEMENT_POSITIF,
  quantity: 10,
  note: 'Inventory count adjustment',
});
```

### Viewing Movement History

```typescript
// Get all movements for a product
const history = await stockMovementsApi.getProductHistory(
  businessId,
  productId,
  50 // limit
);

// Get stock summary
const summary = await stockMovementsApi.getProductSummary(
  businessId,
  productId
);

console.log(`Current stock: ${summary.current_stock}`);
console.log(`Total entries: ${summary.total_entries}`);
console.log(`Total exits: ${summary.total_exits}`);
```

---

## Security

### Business Isolation
- All queries filtered by `business_id`
- Users can only access their business data
- Enforced at database and service level

### Role-Based Access
- **Manual movements:** BUSINESS_OWNER, BUSINESS_ADMIN only
- **View movements:** All authenticated users
- **Internal movements:** Backend services only (no frontend access)

### Validation
- Product must exist and belong to business
- Product must be stockable
- Quantity must be positive
- Negative stock prevented (configurable)

---

## Database Schema

```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  stock_before DECIMAL(15,3) NOT NULL,
  stock_after DECIMAL(15,3) NOT NULL,
  source_type VARCHAR(100),
  source_id UUID,
  note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_business_product 
  ON stock_movements(business_id, product_id);
  
CREATE INDEX idx_stock_movements_business_date 
  ON stock_movements(business_id, created_at);
  
CREATE INDEX idx_stock_movements_source 
  ON stock_movements(source_type, source_id);
```

---

## Testing

### Manual Testing

1. **Create a product** with initial stock
2. **Create a positive adjustment** → Stock increases
3. **Create a negative adjustment** → Stock decreases
4. **Try to remove more than available** → Should fail
5. **Check movement history** → All movements logged
6. **Check stock summary** → Totals match

### Integration Testing

```typescript
describe('StockMovements', () => {
  it('should update stock on movement creation', async () => {
    const product = await createProduct({ current_stock: 10 });
    
    await stockMovementsService.createManual(businessId, {
      product_id: product.id,
      type: StockMovementType.AJUSTEMENT_POSITIF,
      quantity: 5,
    });
    
    const updated = await productRepo.findOne(product.id);
    expect(updated.current_stock).toBe(15);
  });
  
  it('should prevent negative stock', async () => {
    const product = await createProduct({ current_stock: 5 });
    
    await expect(
      stockMovementsService.createManual(businessId, {
        product_id: product.id,
        type: StockMovementType.AJUSTEMENT_NEGATIF,
        quantity: 10,
      })
    ).rejects.toThrow('Insufficient stock');
  });
});
```

---

## Best Practices

### DO ✅
- Always use StockMovementsService to change stock
- Provide meaningful notes for manual adjustments
- Use appropriate movement types
- Include source_type and source_id for traceability
- Handle errors gracefully

### DON'T ❌
- Never update Product.current_stock directly
- Don't skip validation
- Don't create movements without transactions
- Don't allow negative quantities
- Don't bypass business_id filtering

---

## Troubleshooting

### Stock Mismatch
If product stock doesn't match movement history:
```sql
-- Check movement totals
SELECT 
  product_id,
  SUM(CASE WHEN type IN ('ENTREE_ACHAT', 'ENTREE_RETOUR_CLIENT', 'AJUSTEMENT_POSITIF') 
      THEN quantity ELSE 0 END) as total_in,
  SUM(CASE WHEN type IN ('SORTIE_VENTE', 'AJUSTEMENT_NEGATIF') 
      THEN quantity ELSE 0 END) as total_out
FROM stock_movements
WHERE business_id = 'your-business-id'
GROUP BY product_id;

-- Compare with product stock
SELECT id, name, current_stock 
FROM products 
WHERE business_id = 'your-business-id';
```

### Race Conditions
If experiencing race conditions:
- Ensure pessimistic locking is enabled
- Check transaction isolation level
- Verify queryRunner is being used

### Performance Issues
If movements are slow:
- Check database indexes
- Optimize queries with proper filters
- Consider archiving old movements

---

## Summary

The Stock Movements module provides:
- ✅ Complete audit trail
- ✅ Transaction safety
- ✅ Business logic enforcement
- ✅ Multi-tenant isolation
- ✅ Integration-ready API
- ✅ Frontend UI
- ✅ Comprehensive validation

**Remember:** Stock movements are the ONLY way to update product stock!

