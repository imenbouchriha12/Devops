# Port Configuration Reference

## Current Setup

| Service | Port | URL |
|---------|------|-----|
| Backend (NestJS) | 3001 | http://localhost:3001 |
| Frontend (React/Vite) | 5173 | http://localhost:5173 |
| PostgreSQL | 5432 | localhost:5432 |

## Backend Configuration

**File:** `PI-DEV-BACKEND/src/main.ts`
```typescript
await app.listen(3001);
console.log('Backend running on http://localhost:3001');
```

**CORS Configuration:**
```typescript
app.enableCors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});
```

## Frontend Configuration

**File:** `PI-DEV-FRONT/.env`
```
VITE_API_URL=http://localhost:3001
```

**API Files Default:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

## Important Notes

1. **After changing `.env` file, you MUST restart the dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

2. **Vite only reads `.env` files at startup**, not during hot reload

3. **Check if backend is running:**
   ```bash
   curl http://localhost:3001
   # Should return: {"statusCode":404,"message":"Cannot GET /"}
   ```

4. **Check if frontend can reach backend:**
   - Open browser console
   - Check Network tab
   - API calls should go to `http://localhost:3001`

## Troubleshooting

### Backend won't start on port 3001
```bash
# Check if port is in use
netstat -ano | findstr :3001

# Kill process if needed (Windows)
taskkill /PID <PID> /F
```

### Frontend still calling port 3000
1. Check `.env` file exists in `PI-DEV-FRONT/`
2. Restart frontend dev server
3. Clear browser cache
4. Check browser console for actual URL being called

### CORS errors
- Verify backend CORS origin matches frontend URL
- Check credentials: true in both frontend and backend
- Verify cookies are being sent with requests

## Changing Ports

### To change backend port:
1. Edit `PI-DEV-BACKEND/src/main.ts`
2. Update `await app.listen(NEW_PORT)`
3. Update `PI-DEV-FRONT/.env` with new port
4. Restart both servers

### To change frontend port:
1. Edit `PI-DEV-FRONT/vite.config.ts`
2. Add/update server.port configuration
3. Update backend CORS origin
4. Restart both servers

## Quick Test

```bash
# Terminal 1 - Start Backend
cd PI-DEV-BACKEND
npm run start:dev
# Wait for: "Backend running on http://localhost:3001"

# Terminal 2 - Start Frontend
cd PI-DEV-FRONT
npm run dev
# Wait for: "Local: http://localhost:5173"

# Terminal 3 - Test API
curl http://localhost:3001/auth/me
# Should return 401 if not logged in (which is correct)
```

## Environment Variables Reference

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=saas_platform00

JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRY=60m
JWT_REFRESH_EXPIRY=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
```

## Production Considerations

In production, you'll likely:
- Backend: Use environment variable for port (e.g., `process.env.PORT || 3001`)
- Frontend: Build static files and serve from backend or CDN
- Use reverse proxy (nginx) to handle routing
- Use proper domain names instead of localhost
- Enable HTTPS/SSL certificates

