# Stock Module Testing Guide

## Quick Start

### 1. Reset Database (REQUIRED - First Time Only)

Choose one method:

**Option A: PowerShell Script (Recommended)**
```powershell
cd PI-DEV-BACKEND
.\reset-database.ps1
```

**Option B: SQL Script**
```bash
psql -U postgres -f QUICK_FIX.sql
```

**Option C: Manual**
```sql
DROP DATABASE IF EXISTS saas_platform00;
CREATE DATABASE saas_platform00;
```

### 2. Start Backend

```bash
cd PI-DEV-BACKEND
npm run start:dev
```

Wait for:
```
[Nest] INFO [TypeOrmModule] Successfully connected to the database
[Nest] INFO [NestApplication] Nest application successfully started
```

### 3. Start Frontend

```bash
cd PI-DEV-FRONT
npm run dev
```

### 4. Login to Application

1. Open browser: `http://localhost:5173`
2. Login with your credentials
3. Navigate to Stock Management section

---

## Testing Categories

### Access Categories Page
- Click on "Stock" in sidebar
- Click on "Categories" submenu
- URL should be: `http://localhost:5173/app/stock/categories`

### Create Category
1. Click "New Category" button
2. Fill in:
   - Name: "Electronics" (required)
   - Description: "Electronic devices and accessories" (optional)
3. Click "Create"
4. Verify category appears in table

### Edit Category
1. Click edit icon (pencil) on a category
2. Modify name or description
3. Click "Update"
4. Verify changes appear in table

### Toggle Active Status
1. Click on the status badge (Active/Inactive)
2. Verify status changes
3. Check "Active only" filter to hide inactive categories

### Search Categories
1. Type in search box
2. Verify filtered results

### Delete Category
1. Click delete icon (trash) on a category
2. Confirm deletion
3. Verify category is soft-deleted (is_active = false)

---

## Testing Products

### Access Products Page
- Click on "Stock" in sidebar
- Click on "Products" submenu
- URL should be: `http://localhost:5173/app/stock/products`

### Create Product
1. Click "New Product" button
2. Fill in required fields:
   - Name: "Laptop Dell XPS 15"
   - Reference: "DELL-XPS-15-001" (must be unique per business)
   - Category: Select from dropdown
   - Unit: "pièce"
   - Sale Price HT: 2500.000
   - Purchase Price HT: 2000.000
   - Current Stock: 10
   - Min Stock Threshold: 5
   - Check "Stockable Product"
3. Click "Create"
4. Verify product appears in table

### Edit Product
1. Click edit icon on a product
2. Modify any field
3. Click "Update"
4. Verify changes appear

### Toggle Active Status
1. Click on status badge
2. Verify status changes

### Test Low Stock Alert
1. Create/edit a product with:
   - Current Stock: 3
   - Min Stock Threshold: 5
2. Verify row has red background
3. Verify alert icon appears
4. Check "Low stock only" filter

### Search and Filter
1. Search by name or reference
2. Filter by category
3. Filter by active status
4. Filter by low stock

### Delete Product
1. Click delete icon
2. Confirm deletion
3. Verify soft delete

---

## API Testing (Optional)

### Using cURL

**Get Categories**
```bash
curl http://localhost:3000/businesses/{YOUR_BUSINESS_ID}/categories \
  -H "Cookie: {YOUR_AUTH_COOKIE}" \
  -H "Content-Type: application/json"
```

**Create Category**
```bash
curl -X POST http://localhost:3000/businesses/{YOUR_BUSINESS_ID}/categories \
  -H "Cookie: {YOUR_AUTH_COOKIE}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Category",
    "description": "Test description"
  }'
```

**Get Products**
```bash
curl http://localhost:3000/businesses/{YOUR_BUSINESS_ID}/products \
  -H "Cookie: {YOUR_AUTH_COOKIE}" \
  -H "Content-Type: application/json"
```

**Create Product**
```bash
curl -X POST http://localhost:3000/businesses/{YOUR_BUSINESS_ID}/products \
  -H "Cookie: {YOUR_AUTH_COOKIE}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "reference": "TEST-001",
    "category_id": "{CATEGORY_ID}",
    "unit": "pièce",
    "sale_price_ht": 100.000,
    "purchase_price_ht": 80.000,
    "current_stock": 50,
    "min_stock_threshold": 10,
    "is_stockable": true
  }'
```

### Using Postman/Insomnia

1. Import the following endpoints:
   - GET `/businesses/:businessId/categories`
   - POST `/businesses/:businessId/categories`
   - GET `/businesses/:businessId/categories/:id`
   - PATCH `/businesses/:businessId/categories/:id`
   - DELETE `/businesses/:businessId/categories/:id`
   - GET `/businesses/:businessId/products`
   - POST `/businesses/:businessId/products`
   - GET `/businesses/:businessId/products/:id`
   - PATCH `/businesses/:businessId/products/:id`
   - DELETE `/businesses/:businessId/products/:id`
   - GET `/businesses/:businessId/products/alerts`

2. Set authentication cookie from browser

---

## Verification Checklist

### Backend
- [ ] Database reset successful
- [ ] Backend starts without errors
- [ ] No dependency injection errors
- [ ] Tables created: `stock_categories`, `stock_products`

### Frontend - Categories
- [ ] Page loads without errors
- [ ] businessId is not undefined
- [ ] Can create category
- [ ] Can edit category
- [ ] Can toggle active status
- [ ] Can search categories
- [ ] Can delete category (soft delete)
- [ ] Active filter works

### Frontend - Products
- [ ] Page loads without errors
- [ ] businessId is not undefined
- [ ] Categories dropdown populated
- [ ] Can create product
- [ ] Can edit product
- [ ] Can toggle active status
- [ ] Low stock alert shows (red background + icon)
- [ ] Can search products
- [ ] Can filter by category
- [ ] Can filter by active status
- [ ] Can filter by low stock
- [ ] Can delete product (soft delete)
- [ ] Stockable checkbox works

### Business Logic
- [ ] Product reference is unique per business
- [ ] All data filtered by business_id
- [ ] Soft delete works (is_active = false)
- [ ] Role-based access control works
- [ ] Category-Product relationship works

---

## Common Issues

### Issue: "No business associated with your account"
**Solution:** Your user account doesn't have a business_id. This happens if:
- You're logged in as PLATFORM_ADMIN
- Your account was created before business assignment
- Contact administrator to assign you to a business

### Issue: "ERR_CONNECTION_REFUSED"
**Solution:** Backend is not running or wrong URL
- Check backend is running on `http://localhost:3001`
- Check frontend `.env` has `VITE_API_URL=http://localhost:3001`

### Issue: "401 Unauthorized"
**Solution:** Not logged in or session expired
- Login again
- Check authentication cookies

### Issue: "403 Forbidden"
**Solution:** Insufficient permissions
- Check your role (need OWNER, ADMIN, or ACCOUNTANT for write operations)
- TEAM_MEMBER has read-only access

### Issue: "Duplicate key value violates unique constraint"
**Solution:** Product reference already exists
- Product references must be unique per business
- Use a different reference code

### Issue: Categories dropdown empty in Products
**Solution:** No active categories exist
- Create at least one category first
- Make sure category is active

---

## Database Queries for Verification

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'stock_%';
```

### View Categories
```sql
SELECT * FROM stock_categories 
WHERE business_id = 'YOUR_BUSINESS_ID'
ORDER BY created_at DESC;
```

### View Products
```sql
SELECT 
  p.id,
  p.name,
  p.reference,
  c.name as category_name,
  p.current_stock,
  p.min_stock_threshold,
  p.is_active
FROM stock_products p
LEFT JOIN stock_categories c ON p.category_id = c.id
WHERE p.business_id = 'YOUR_BUSINESS_ID'
ORDER BY p.created_at DESC;
```

### Check Low Stock Products
```sql
SELECT 
  name,
  reference,
  current_stock,
  min_stock_threshold
FROM stock_products
WHERE business_id = 'YOUR_BUSINESS_ID'
  AND is_stockable = true
  AND current_stock < min_stock_threshold
  AND is_active = true;
```

---

## Next Steps After Testing

Once basic CRUD is working, you can proceed with:

1. **Stock Movements Module**
   - Track stock in/out
   - Adjustment reasons
   - Movement history

2. **Stock Reports**
   - Stock valuation
   - Movement reports
   - Low stock alerts dashboard

3. **Barcode Integration**
   - Barcode scanning
   - Label printing

4. **Multi-warehouse Support**
   - Multiple locations
   - Stock transfers

---

## Support

If you encounter issues not covered here:
1. Check browser console for errors
2. Check backend logs
3. Verify database state with SQL queries
4. Review `FIXES_APPLIED.md` for known issues
5. Check `MIGRATION_GUIDE.md` for setup steps

