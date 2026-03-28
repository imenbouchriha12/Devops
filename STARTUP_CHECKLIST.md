# Stock Module Startup Checklist

## ✅ One-Time Setup (Do This First)

### 1. Reset Database
```powershell
cd PI-DEV-BACKEND
.\reset-database.ps1
```
OR manually:
```sql
DROP DATABASE IF EXISTS saas_platform00;
CREATE DATABASE saas_platform00;
```

### 2. Verify Frontend .env File
Check that `PI-DEV-FRONT/.env` exists with:
```
VITE_API_URL=http://localhost:3001
```

### 3. Install Dependencies (if not done)
```bash
# Backend
cd PI-DEV-BACKEND
npm install

# Frontend
cd PI-DEV-FRONT
npm install
```

---

## 🚀 Every Time You Start Development

### Step 1: Start Backend
```bash
cd PI-DEV-BACKEND
npm run start:dev
```

**Wait for these messages:**
```
[Nest] INFO [TypeOrmModule] Successfully connected to the database
[Nest] INFO [NestApplication] Nest application successfully started
Backend running on http://localhost:3001
```

**If you see errors:**
- ❌ Database connection error → Check PostgreSQL is running
- ❌ Port already in use → Kill process on port 3001
- ❌ Module dependency error → Check FIXES_APPLIED.md

### Step 2: Start Frontend
```bash
cd PI-DEV-FRONT
npm run dev
```

**Wait for:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

**If you see errors:**
- ❌ Port already in use → Kill process on port 5173
- ❌ Module not found → Run `npm install`

### Step 3: Open Browser
1. Navigate to: `http://localhost:5173`
2. Login with your credentials
3. Go to: Stock → Categories or Stock → Products

---

## 🧪 Quick Test

### Test 1: Backend is Running
```bash
curl http://localhost:3001
```
**Expected:** `{"statusCode":404,"message":"Cannot GET /"}`
✅ This is correct! It means backend is running.

### Test 2: Frontend Can Reach Backend
1. Open browser console (F12)
2. Go to Network tab
3. Try to create a category
4. Check the request URL

**Expected:** `POST http://localhost:3001/businesses/{uuid}/categories`
❌ If you see port 3000 → Restart frontend after creating .env

### Test 3: Create a Category
1. Go to Stock → Categories
2. Click "New Category"
3. Enter:
   - Name: "Test Category"
   - Description: "Testing"
4. Click "Create"

**Expected:** Category appears in table
❌ If error → Check browser console and backend logs

---

## 🔍 Troubleshooting Quick Reference

| Error | Solution |
|-------|----------|
| `ERR_CONNECTION_REFUSED` | Backend not running or wrong port |
| `businessId is undefined` | Not logged in or no business assigned |
| `401 Unauthorized` | Session expired, login again |
| `403 Forbidden` | Insufficient permissions (need OWNER/ADMIN/ACCOUNTANT) |
| `Duplicate key constraint` | Product reference already exists |
| `Cannot resolve dependencies` | Run database reset, restart backend |
| Network tab shows port 3000 | Restart frontend after creating .env |

---

## 📋 Pre-Flight Checklist

Before reporting issues, verify:

- [ ] PostgreSQL is running
- [ ] Database `saas_platform00` exists and is reset
- [ ] Backend is running on port 3001
- [ ] Frontend is running on port 5173
- [ ] `.env` file exists in `PI-DEV-FRONT/` with correct port
- [ ] You're logged in to the application
- [ ] Your user has a business_id assigned
- [ ] Your role is OWNER, ADMIN, or ACCOUNTANT (for write operations)
- [ ] Browser console shows no errors
- [ ] Backend logs show no errors

---

## 🎯 Success Indicators

You know everything is working when:

✅ Backend starts without errors
✅ Frontend starts without errors
✅ You can login successfully
✅ Stock menu appears in sidebar
✅ Categories page loads
✅ Products page loads
✅ You can create a category
✅ You can create a product
✅ API calls go to `localhost:3001` (check Network tab)
✅ No console errors in browser
✅ No errors in backend logs

---

## 📞 Need Help?

1. Check `FIXES_APPLIED.md` for known issues
2. Check `TESTING_GUIDE.md` for detailed testing steps
3. Check `PORT_CONFIGURATION.md` for port setup
4. Check browser console for frontend errors
5. Check backend terminal for backend errors
6. Verify database state with SQL queries

---

## 🔄 Clean Restart (Nuclear Option)

If nothing works, try this:

```bash
# 1. Stop all servers (Ctrl+C in all terminals)

# 2. Reset database
cd PI-DEV-BACKEND
.\reset-database.ps1

# 3. Clean and reinstall backend
rm -rf node_modules
rm package-lock.json
npm install

# 4. Clean and reinstall frontend
cd ../PI-DEV-FRONT
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# 5. Verify .env exists
cat .env
# Should show: VITE_API_URL=http://localhost:3001

# 6. Start backend
cd ../PI-DEV-BACKEND
npm run start:dev

# 7. Start frontend (in new terminal)
cd PI-DEV-FRONT
npm run dev

# 8. Test in browser
```

---

## 📝 Daily Development Workflow

```bash
# Morning startup
cd PI-DEV-BACKEND && npm run start:dev
# New terminal
cd PI-DEV-FRONT && npm run dev

# Work on features...

# End of day
# Ctrl+C in both terminals
# Commit your changes
git add .
git commit -m "Your changes"
git push
```

