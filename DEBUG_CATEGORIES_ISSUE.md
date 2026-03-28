# Debugging Categories Not Showing Issue

## Current Situation
- ✅ POST request works (categories created in database)
- ❌ GET request doesn't show categories in frontend
- ❌ Even after page refresh, categories don't appear

## Debugging Steps

### Step 1: Check Database
Run this SQL query in pgAdmin or psql:

```sql
SELECT 
    id,
    business_id,
    name,
    description,
    is_active,
    created_at
FROM stock_categories
WHERE business_id = 'b48c82a2-c438-41c5-a47f-ac5dcfc87756'
ORDER BY created_at DESC;
```

**Expected Result:**
- You should see all the categories you created
- `is_active` should be `true` for all of them
- `business_id` should match your user's business_id

**If categories are missing or is_active is false:**
- Problem is in the backend create logic
- Check backend logs when creating

**If categories exist with is_active = true:**
- Problem is in the GET request or frontend display
- Continue to Step 2

---

### Step 2: Check Browser Console

1. Open browser (F12)
2. Go to Console tab
3. Click the "Refresh" button on the Categories page
4. Look for these console logs:

```
Loading categories for businessId: b48c82a2-c438-41c5-a47f-ac5dcfc87756
Query params: { search: undefined, is_active: true }
Categories API response: [...]
Number of categories: X
```

**Scenario A: You see "Categories API response: []" (empty array)**
- Backend is returning empty results
- Check if `is_active` filter is the problem
- Try unchecking "Active only" checkbox
- Go to Step 3

**Scenario B: You see "Categories API response: [{...}, {...}]" (with data)**
- Backend is returning data correctly
- Problem is in frontend rendering
- Go to Step 4

**Scenario C: You see error messages**
- Check the error details
- Common errors:
  - 401: Not authenticated
  - 403: No permission
  - 404: Wrong URL
  - 500: Backend error
- Go to Step 5

---

### Step 3: Test Without is_active Filter

1. Uncheck the "Active only" checkbox
2. Click "Refresh" button
3. Check console logs again

**If categories appear now:**
- Problem: Categories are being created with `is_active = false`
- Solution: Check backend create logic
- Run this SQL to verify:
  ```sql
  SELECT is_active, COUNT(*) 
  FROM stock_categories 
  WHERE business_id = 'b48c82a2-c438-41c5-a47f-ac5dcfc87756'
  GROUP BY is_active;
  ```

**If categories still don't appear:**
- Problem is not the filter
- Continue to Step 4

---

### Step 4: Check Network Tab

1. Open browser (F12)
2. Go to Network tab
3. Click "Refresh" button
4. Find the GET request to `/businesses/.../categories`
5. Click on it to see details

**Check Request:**
- URL: Should be `http://localhost:3001/businesses/b48c82a2-c438-41c5-a47f-ac5dcfc87756/categories?is_active=true`
- Method: GET
- Status: Should be 200
- Headers: Should include cookies

**Check Response:**
- Click "Response" tab
- Should see JSON array: `[{id: "...", name: "...", ...}, ...]`

**If Response is empty array `[]`:**
- Backend query is filtering out your categories
- Check backend logs
- Go to Step 6

**If Response has data:**
- Backend is working correctly
- Problem is in frontend state management
- Go to Step 7

---

### Step 5: Check Backend Logs

Look at your backend terminal for logs when you:
1. Create a category
2. Load categories (GET request)

**Expected logs when creating:**
```
[Nest] INFO [RouterExplorer] Mapped {/businesses/:businessId/categories, POST}
```

**Expected logs when loading:**
```
[Nest] INFO [RouterExplorer] Mapped {/businesses/:businessId/categories, GET}
```

**If you see errors:**
- Copy the full error message
- Check if it's a database query error
- Check if it's an authentication error

---

### Step 6: Test Backend Directly with cURL

```bash
# Get your auth cookie from browser:
# 1. Open DevTools (F12)
# 2. Go to Application tab
# 3. Click Cookies → http://localhost:5173
# 4. Copy the value of the auth cookie

# Test GET request
curl -X GET "http://localhost:3001/businesses/b48c82a2-c438-41c5-a47f-ac5dcfc87756/categories" \
  -H "Cookie: your-cookie-here" \
  -H "Content-Type: application/json"

# Test without is_active filter
curl -X GET "http://localhost:3001/businesses/b48c82a2-c438-41c5-a47f-ac5dcfc87756/categories" \
  -H "Cookie: your-cookie-here" \
  -H "Content-Type: application/json"

# Test with is_active=false
curl -X GET "http://localhost:3001/businesses/b48c82a2-c438-41c5-a47f-ac5dcfc87756/categories?is_active=false" \
  -H "Cookie: your-cookie-here" \
  -H "Content-Type: application/json"
```

**If cURL returns data:**
- Backend is working
- Problem is in frontend

**If cURL returns empty array:**
- Backend query logic issue
- Check the service code

---

### Step 7: Check React State

Add this temporary code to Categories.tsx after the `setCategories(data)` line:

```typescript
console.log('State updated, categories:', categories);
console.log('Categories length:', categories.length);
```

**If console shows old data:**
- State update timing issue
- React hasn't re-rendered yet
- This is normal, check after render

**If console shows new data but UI doesn't update:**
- React rendering issue
- Check if key prop is correct
- Check if conditional rendering is hiding data

---

## Quick Fixes to Try

### Fix 1: Disable is_active Filter Temporarily

In `Categories.tsx`, change:
```typescript
const [showActiveOnly, setShowActiveOnly] = useState(false); // Changed from true
```

This will load ALL categories regardless of status.

### Fix 2: Add Delay Before Reload

In `handleSubmit`, add a small delay:
```typescript
await categoriesApi.create(businessId!, formData);
await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
await loadCategories();
```

### Fix 3: Force Re-render

Add a key to force component re-render:
```typescript
const [refreshKey, setRefreshKey] = useState(0);

// In handleSubmit after loadCategories:
setRefreshKey(prev => prev + 1);

// In return statement:
<div key={refreshKey} className="p-6">
```

---

## Common Issues and Solutions

### Issue: Categories created with is_active = false

**Check:** Run SQL query to verify
```sql
SELECT is_active FROM stock_categories 
WHERE business_id = 'b48c82a2-c438-41c5-a47f-ac5dcfc87756';
```

**Fix:** Update existing categories
```sql
UPDATE stock_categories 
SET is_active = true 
WHERE business_id = 'b48c82a2-c438-41c5-a47f-ac5dcfc87756';
```

### Issue: Wrong business_id

**Check:** Verify your user's business_id
```sql
SELECT id, email, business_id FROM users WHERE email = 'your-email@example.com';
```

**Check:** Verify categories business_id
```sql
SELECT DISTINCT business_id FROM stock_categories;
```

### Issue: CORS or Cookie Problem

**Symptoms:**
- Network tab shows request but no cookies
- 401 Unauthorized errors

**Fix:**
1. Check backend CORS configuration in `main.ts`
2. Verify `credentials: true` in frontend API calls
3. Check cookies in browser DevTools

### Issue: TypeORM Query Not Working

**Test:** Add logging to backend service
```typescript
async findAll(businessId: string, query: QueryCategoriesDto): Promise<Category[]> {
  const where: any = { business_id: businessId };
  
  if (query.is_active !== undefined) {
    where.is_active = query.is_active;
  }
  
  console.log('Query where clause:', where);
  
  const result = await this.categoryRepo.find({
    where,
    order: { name: 'ASC' },
  });
  
  console.log('Query result count:', result.length);
  console.log('Query result:', result);
  
  return result;
}
```

---

## What to Report

If none of the above fixes work, provide:

1. **Database query result:**
   ```sql
   SELECT * FROM stock_categories 
   WHERE business_id = 'b48c82a2-c438-41c5-a47f-ac5dcfc87756';
   ```

2. **Browser console logs** (all of them)

3. **Network tab screenshot** showing:
   - Request URL
   - Request headers
   - Response data

4. **Backend terminal logs** when:
   - Creating a category
   - Loading categories

5. **Your user's business_id:**
   ```sql
   SELECT business_id FROM users WHERE email = 'your-email';
   ```

---

## Next Steps

1. Run through Steps 1-7 above
2. Try Quick Fixes 1-3
3. Check Common Issues
4. Report findings with the information requested above

