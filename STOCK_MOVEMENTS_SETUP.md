# Stock Movements Module - Quick Setup Guide

## ✅ What Was Created

### Backend
- ✅ `StockMovementType` enum with 5 movement types
- ✅ `StockMovement` entity with decimal transformers
- ✅ `StockMovementsService` with transaction-safe logic
- ✅ `StockMovementsController` for manual movements
- ✅ `InternalStockMovementsController` for module integration
- ✅ DTOs for create and query operations
- ✅ Complete validation and error handling

### Frontend
- ✅ `StockMovement` types and interfaces
- ✅ `stockMovementsApi` service
- ✅ `StockMovements` page with full UI
- ✅ Filters, pagination, and modal forms

---

## 🚀 Setup Steps

### 1. Reset Database (REQUIRED)

The `stock_movements` table structure has changed:

```powershell
cd PI-DEV-BACKEND
.\reset-database.ps1
```

OR manually:
```sql
DROP DATABASE IF EXISTS saas_platform00;
CREATE DATABASE saas_platform00;
```

### 2. Start Backend

```bash
cd PI-DEV-BACKEND
npm run start:dev
```

**Verify:**
```
[Nest] INFO [RoutesResolver] StockMovementsController {/businesses/:businessId/stock-movements}
[Nest] INFO [RoutesResolver] InternalStockMovementsController {/internal/stock-movements}
```

### 3. Start Frontend

```bash
cd PI-DEV-FRONT
npm run dev
```

### 4. Test It Out

1. **Login** to your application
2. **Go to Stock → Products**
3. **Create a product** with initial stock (e.g., 100)
4. **Go to Stock → Movements** (you'll need to add this route)
5. **Create a movement:**
   - Select the product
   - Choose "Ajustement +" type
   - Enter quantity (e.g., 50)
   - Add a note
   - Submit
6. **Verify:**
   - Movement appears in table
   - Product stock updated to 150
   - Stock before/after values correct

---

## 📝 Add Route to Frontend

Update `PI-DEV-FRONT/src/App.tsx`:

```typescript
import StockMovements from './pages/backoffice/StockMovements';

// In the routes:
<Route path="stock/movements" element={<StockMovements />} />
```

---

## 🔍 Verify Database

```sql
-- Check stock_movements table
SELECT * FROM stock_movements 
WHERE business_id = 'your-business-id'
ORDER BY created_at DESC;

-- Check product stock
SELECT id, name, reference, current_stock 
FROM products 
WHERE business_id = 'your-business-id';

-- Verify stock calculations
SELECT 
  p.name,
  p.current_stock,
  SUM(CASE WHEN sm.type IN ('ENTREE_ACHAT', 'ENTREE_RETOUR_CLIENT', 'AJUSTEMENT_POSITIF') 
      THEN sm.quantity ELSE 0 END) as total_in,
  SUM(CASE WHEN sm.type IN ('SORTIE_VENTE', 'AJUSTEMENT_NEGATIF') 
      THEN sm.quantity ELSE 0 END) as total_out
FROM products p
LEFT JOIN stock_movements sm ON p.id = sm.product_id
WHERE p.business_id = 'your-business-id'
GROUP BY p.id, p.name, p.current_stock;
```

---

## 🧪 Test Scenarios

### Scenario 1: Positive Adjustment
1. Product has 100 units
2. Create movement: AJUSTEMENT_POSITIF, quantity 50
3. **Expected:** Stock becomes 150

### Scenario 2: Negative Adjustment
1. Product has 100 units
2. Create movement: AJUSTEMENT_NEGATIF, quantity 30
3. **Expected:** Stock becomes 70

### Scenario 3: Insufficient Stock
1. Product has 10 units
2. Try to create: AJUSTEMENT_NEGATIF, quantity 20
3. **Expected:** Error "Insufficient stock"

### Scenario 4: Purchase Entry
1. Product has 50 units
2. Create movement: ENTREE_ACHAT, quantity 100
3. **Expected:** Stock becomes 150

### Scenario 5: Sale Exit
1. Product has 100 units
2. Create movement: SORTIE_VENTE, quantity 25
3. **Expected:** Stock becomes 75

---

## 🔗 Integration Example

### From Sales Module

```typescript
// In your invoice service
import { StockMovementsService } from '../stock/services/stock-movements.service';
import { StockMovementType } from '../stock/enums/stock-movement-type.enum';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  async createInvoice(businessId: string, data: CreateInvoiceDto) {
    // 1. Create invoice
    const invoice = await this.invoiceRepo.save({
      ...data,
      business_id: businessId,
    });

    // 2. Create stock movements for products
    for (const item of data.items) {
      if (item.product_id) {
        await this.stockMovementsService.createInternal({
          business_id: businessId,
          product_id: item.product_id,
          type: StockMovementType.SORTIE_VENTE,
          quantity: item.quantity,
          source_type: 'Invoice',
          source_id: invoice.id,
          note: `Sale via invoice ${invoice.invoice_number}`,
        });
      }
    }

    return invoice;
  }
}
```

---

## 📊 API Examples

### Create Manual Movement

```bash
curl -X POST http://localhost:3001/businesses/{businessId}/stock-movements/manual \
  -H "Cookie: your-auth-cookie" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "product-uuid",
    "type": "AJUSTEMENT_POSITIF",
    "quantity": 10,
    "note": "Inventory count adjustment"
  }'
```

### Get Movements

```bash
curl http://localhost:3001/businesses/{businessId}/stock-movements \
  -H "Cookie: your-auth-cookie"
```

### Get Product History

```bash
curl http://localhost:3001/businesses/{businessId}/stock-movements/product/{productId}/history \
  -H "Cookie: your-auth-cookie"
```

### Create Internal Movement (Backend Only)

```bash
curl -X POST http://localhost:3001/internal/stock-movements \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "business-uuid",
    "product_id": "product-uuid",
    "type": "SORTIE_VENTE",
    "quantity": 5,
    "source_type": "Invoice",
    "source_id": "invoice-uuid",
    "note": "Sold via invoice #INV-001"
  }'
```

---

## ⚠️ Important Rules

### DO ✅
- Always use StockMovementsService to update stock
- Use transactions for all stock changes
- Provide source_type and source_id for traceability
- Add meaningful notes
- Handle errors properly

### DON'T ❌
- **NEVER** update `Product.current_stock` directly
- Don't skip validation
- Don't allow negative stock (unless configured)
- Don't bypass business_id filtering
- Don't create movements without proper types

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check for TypeScript errors
npm run build

# If errors, check:
# - All imports are correct
# - StockMovement entity is in stock.module.ts
# - Enum file exists
```

### Movements not creating
- Check user has BUSINESS_OWNER or BUSINESS_ADMIN role
- Verify product exists and is stockable
- Check quantity is positive
- Look at backend logs for errors

### Stock not updating
- Verify transaction completed successfully
- Check database for movement record
- Look for rollback in logs
- Ensure no direct Product updates elsewhere

### Frontend errors
- Check businessId is not undefined
- Verify API URL is correct (port 3001)
- Check authentication cookies
- Look at browser console for errors

---

## 📚 Documentation

- **Full Documentation:** `STOCK_MOVEMENTS_MODULE.md`
- **API Reference:** See controllers for all endpoints
- **Integration Guide:** See documentation for examples

---

## ✨ Features

- ✅ Complete audit trail
- ✅ Transaction safety
- ✅ Negative stock prevention
- ✅ Multi-tenant isolation
- ✅ Role-based access
- ✅ Decimal precision (15,3)
- ✅ Source tracking
- ✅ Pagination
- ✅ Filtering
- ✅ Product history
- ✅ Stock summary
- ✅ Integration-ready

---

## 🎯 Next Steps

1. **Test basic movements** manually
2. **Integrate with Sales module** for automatic stock updates on sales
3. **Integrate with Purchases module** for stock entries on goods receipt
4. **Add stock reports** and analytics
5. **Implement stock alerts** for low stock
6. **Add barcode scanning** for movements

---

## Summary

The Stock Movements module is now fully functional and ready to use. It provides the ONLY way to update product stock, ensuring data integrity and complete audit trails.

**Remember:** All stock changes MUST go through StockMovement!

