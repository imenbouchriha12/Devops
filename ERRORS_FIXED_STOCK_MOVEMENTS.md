# Stock Movements Errors Fixed

## Summary
All TypeScript compilation errors have been resolved.

---

## Errors Fixed

### 1. Wrong Import Path (1 error)
**Error:** `Cannot find module '../../stock/services/stock-movements/stock-movements.service'`

**Location:** `src/Purchases/services/goods-receipts.service.ts`

**Cause:** Import path included non-existent `/stock-movements/` subdirectory

**Fix:** Updated import path
```typescript
// Before:
import { StockMovementsService } from '../../stock/services/stock-movements/stock-movements.service';

// After:
import { StockMovementsService } from '../../stock/services/stock-movements.service';
```

**File Changed:**
- `src/Purchases/services/goods-receipts.service.ts`

---

### 2. Type Mismatch - source_type (1 error)
**Error:** `Type 'string | undefined' is not assignable to type 'string'`

**Location:** `src/stock/services/stock-movements.service.ts:44`

**Cause:** DTO defined `source_type` as required, but service was passing optional value

**Fix:** Made `source_type` optional in DTO and handled undefined in service
```typescript
// DTO - Before:
@IsString()
source_type: string;

// DTO - After:
@IsOptional()
@IsString()
source_type?: string;

// Service - Before:
source_type: dto.source_type,

// Service - After:
source_type: dto.source_type || undefined,
```

**Files Changed:**
- `src/stock/dto/create-internal-stock-movement.dto.ts`
- `src/stock/services/stock-movements.service.ts`

---

### 3. Type Mismatch - source_id (1 error)
**Error:** `Type 'string | undefined' is not assignable to type 'string'`

**Location:** `src/stock/services/stock-movements.service.ts:45`

**Cause:** DTO defined `source_id` as required, but service was passing optional value

**Fix:** Made `source_id` optional in DTO and handled undefined in service
```typescript
// DTO - Before:
@IsUUID()
source_id: string;

// DTO - After:
@IsOptional()
@IsUUID()
source_id?: string;

// Service - Before:
source_id: dto.source_id,

// Service - After:
source_id: dto.source_id || undefined,
```

**Files Changed:**
- `src/stock/dto/create-internal-stock-movement.dto.ts`
- `src/stock/services/stock-movements.service.ts`

---

## Why These Changes Make Sense

### source_type and source_id Should Be Optional

**Reason:** Not all stock movements have a source:
- ✅ **Manual adjustments** - No source (user-initiated)
- ✅ **Initial stock** - No source (setup)
- ✅ **Inventory counts** - No source (physical count)
- ✅ **Sales/Purchases** - Has source (Invoice, PO, etc.)

**Design Decision:**
- `CreateStockMovementDto` (manual) - source is optional
- `CreateInternalStockMovementDto` (internal) - source is optional
- When source exists, both `source_type` and `source_id` should be provided
- When no source, both should be null/undefined

---

## Updated DTO

```typescript
export class CreateInternalStockMovementDto {
  @IsUUID()
  business_id: string;

  @IsUUID()
  product_id: string;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()  // ← Now optional
  @IsString()
  source_type?: string;

  @IsOptional()  // ← Now optional
  @IsUUID()
  source_id?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}
```

---

## Build Status

✅ **SUCCESS** - No TypeScript errors

```bash
npm run build
# Exit Code: 0
```

---

## Files Modified

1. `src/Purchases/services/goods-receipts.service.ts` - Fixed import path
2. `src/stock/dto/create-internal-stock-movement.dto.ts` - Made source fields optional
3. `src/stock/services/stock-movements.service.ts` - Handle undefined source fields

---

## Testing

### Test Case 1: Manual Movement (No Source)
```typescript
await stockMovementsService.createManual(businessId, {
  product_id: 'uuid',
  type: StockMovementType.AJUSTEMENT_POSITIF,
  quantity: 10,
  note: 'Manual adjustment',
  // No source_type or source_id
});
```
**Expected:** ✅ Works - source fields are null

### Test Case 2: Internal Movement (With Source)
```typescript
await stockMovementsService.createInternal({
  business_id: 'uuid',
  product_id: 'uuid',
  type: StockMovementType.SORTIE_VENTE,
  quantity: 5,
  source_type: 'Invoice',
  source_id: 'invoice-uuid',
  note: 'Sale',
});
```
**Expected:** ✅ Works - source fields are populated

### Test Case 3: Internal Movement (No Source)
```typescript
await stockMovementsService.createInternal({
  business_id: 'uuid',
  product_id: 'uuid',
  type: StockMovementType.AJUSTEMENT_POSITIF,
  quantity: 10,
  // No source fields
});
```
**Expected:** ✅ Works - source fields are null

---

## Summary

All errors fixed! The module now correctly handles:
- ✅ Optional source tracking
- ✅ Correct import paths
- ✅ Type safety
- ✅ Manual movements without source
- ✅ Internal movements with or without source

Ready to use! 🎉

