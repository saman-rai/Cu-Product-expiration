# CU Product Expiry — Development Guide

Everything you need to develop, debug, and extend this project.

---

## 🚀 Quick Start

```bash
# First time
cd server && npm install
cd ../client && npm install
cd .. && npm install
npm run seed           # creates admin/admin123 + sample data

# Dev mode (hot reload)
npm run dev            # server:3001 + client:5173

# Production mode
npm run prod           # build client → serve on :3001
```

**Login:** `admin` / `admin123`

**Phone access (same Wi-Fi):**
- Dev: `http://<YOUR-IP>:5173`
- Prod: `http://<YOUR-IP>:3001`
- Find IP with `ipconfig` (Windows) or `ifconfig` (Mac)

---

## 📁 Project Structure

```
CuProductExpiry/
├── client/                        # React frontend
│   ├── src/
│   │   ├── i18n/                  # Translation files
│   │   │   └── translations.js    # KO + EN dictionaries (200+ keys)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Session state + login/logout
│   │   │   └── LanguageContext.jsx # Language state + t() function
│   │   ├── services/
│   │   │   └── api.js             # All API calls (fetch-based)
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Sidebar + BottomNav + FAB + Outlet
│   │   │   ├── ProtectedRoute.jsx # Auth guard → /login
│   │   │   ├── BottomNav.jsx      # Mobile bottom nav (5 tabs)
│   │   │   └── ExpiryAlertModal.jsx # Login alert popup
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Login form + language toggle
│   │   │   ├── Dashboard.jsx      # Summary cards + nearest expiry + alert
│   │   │   ├── Products.jsx       # Product list + search + filter
│   │   │   ├── ProductForm.jsx    # Modal form: barcode scan → CRUD
│   │   │   ├── Categories.jsx     # Category tree + CRUD
│   │   │   ├── Suppliers.jsx      # Supplier table + CRUD
│   │   │   ├── ExcelImport.jsx    # Excel upload/download/import
│   │   │   ├── ExpiringSoon.jsx   # Tabbed: expired/today/tomorrow/week
│   │   │   └── QuickScan.jsx      # Camera-first barcode scan
│   │   └── styles/
│   │       └── App.css            # All styles (800+ lines)
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   ├── sw.js                  # Service worker
│   │   └── icons/                 # SVG app icons
│   └── index.html
├── server/                        # Express backend
│   ├── index.js                   # Server entry (port 3001, 0.0.0.0)
│   ├── db.js                      # SQLite via sql.js (WASM)
│   ├── seed.js                    # Admin user + sample data
│   ├── middleware/
│   │   └── auth.js                # requireAuth middleware
│   └── routes/
│       ├── auth.js                # POST login/logout + GET me
│       ├── products.js            # CRUD + expiring endpoint
│       ├── categories.js          # CRUD + tree
│       ├── suppliers.js           # CRUD
│       ├── dashboard.js           # Summary + expiry-alerts
│       └── excel.js               # Import/export/template
├── package.json                   # Root scripts (dev, prod, seed, build)
├── .env                           # SESSION_SECRET, PORT
├── PROJECT.md                     # Full AI agent project doc
├── README.md                      # Project overview
└── DEVELOPMENT.md                 # This file
```

---

## 🔧 Common Tasks

### Add a new page

1. **Create the page component** → `client/src/pages/YourPage.jsx`
2. **Add translation keys** → `client/src/i18n/translations.js` (both `ko` and `en`)
3. **Add the route** → `client/src/App.jsx` (inside `<Layout>`)
4. **Add nav item** → `client/src/components/Layout.jsx` (`navItems` array)
5. **Add bottom nav item** → `client/src/components/BottomNav.jsx` (if needed)
6. **Add API methods** → `client/src/services/api.js` (if new endpoints needed)
7. **Add server routes** → `server/routes/your-route.js` (if new endpoints needed)
8. **Mount in server** → `server/index.js`

### Add a new API endpoint

1. Create route file in `server/routes/` or add to existing
2. All routes use `requireAuth` middleware (except login/logout)
3. Use `query(sql, params)` for SELECT (returns array)
4. Use `queryOne(sql, params)` for single row (returns object or null)
5. Use `execute(sql, params)` for INSERT/UPDATE/DELETE (returns `{ lastInsertRowid, changes }`)
6. Call `saveDb()` is automatic — every write saves to disk
7. Mount in `server/index.js`

### Add a new translation

1. Open `client/src/i18n/translations.js`
2. Add the key to both `ko` and `en` objects
3. Use dot-notation keys: `'page.section.element'`
4. For dynamic values use `{placeholder}` syntax
5. In components: `const { t } = useLanguage()` then `t('your.key')`
6. Pass params: `t('your.key', { count: 5 })`

### Modify the database schema

1. Edit `server/db.js` — `initTables()` function
2. Add or modify CREATE TABLE statements
3. Delete `server/data/cu-store.db` → it will be recreated on next start
4. Re-run `npm run seed`

---

## 🐛 Debugging Guide

### "Blank page / not loading"

| Cause | Check |
|-------|-------|
| Vite not running | `npm run dev` → check terminal for errors |
| Server not running | Check port 3001 is listening |
| Build error | `cd client && npx vite build` — fix errors |
| Proxy not working | Open DevTools Network tab → `/api/*` requests should go to `localhost:3001` |

### "Page keeps refreshing"

**If it's the login page:** `window.location.href` in `api.js` causes hard reloads. Fixed in commit `5222023`. If it's happening again, check that the 401 handler in `api.js` doesn't have `window.location.href`.

### "Language isn't switching"

1. Check `localStorage.getItem('appLanguage')` in DevTools
2. If missing, the LanguageProvider didn't wrap correctly
3. Check `client/src/App.jsx` — `<LanguageProvider>` must wrap `<AuthProvider>`

### "Barcode scanner not working"

- **USB scanner:** Try typing a barcode manually then pressing Enter. If that works, the scanner is sending the wrong key sequence.
- **Camera:** Open `chrome://settings/content/camera` → ensure camera is allowed. Try on HTTPS or localhost (camera requires secure context).

### "npm run prod fails on Windows"

`NODE_ENV=production` syntax doesn't work in Windows CMD. Fixed with `cross-env` (commit `6eda8f7`). Use `npm run prod` which uses `cross-env NODE_ENV=production`.

### "Database errors"

1. Delete `server/data/cu-store.db`
2. Run `npm run seed` to recreate
3. Session files in `server/data/sessions/` are safe to delete

### "Translation key showing instead of text"

The key wasn't added to both `ko` and `en` objects in `translations.js`, or there's a typo. The `t()` function returns the key itself if not found.

### "CORS errors in dev mode"

CORS is set to `origin: true` in dev (allows any origin). If you changed the Vite port or IP, it should still work. Check `server/index.js` — `app.use(cors({ origin: isDev ? true : false, credentials: true }))`.

---

## 🧪 Quick Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Server + Vite concurrently |
| `npm run dev:server` | Backend only (port 3001) |
| `npm run dev:client` | Frontend only (port 5173) |
| `npm run build` | Build frontend for production |
| `npm run prod` | Build + serve in production mode |
| `npm run seed` | Seed DB with sample data |
| `npm start` | Start server only (current mode) |

---

## 🗄️ Database

- **Engine:** sql.js (SQLite compiled to WebAssembly)
- **File:** `server/data/cu-store.db`
- **No native dependencies** — pure JS/WASM
- **Every write saves the entire DB** to disk (`saveDb()`)
- **Foreign keys** are NOT enforced at DB level (application-level only)

### Tables

| Table | Key Fields | Notes |
|-------|-----------|-------|
| `users` | id, username, password (bcrypt), store_name, role | admin/staff roles |
| `categories` | id, name, parent_id (self-ref), sort_order, is_active | Hierarchical, soft-delete |
| `suppliers` | id, name, contact_person, phone, email, notes | Hard delete |
| `products` | id, barcode (unique), name, category_id, supplier_id, quantity, unit, shelf_location, expiry_date, manufactured_date, batch_number, cost_price, selling_price, notes, is_active | Soft delete, indexes on expiry/barcode/category/active |
| `activity_log` | id, user_id, action, details (JSON), created_at | Logs import results |

### Expiry Status (computed, not stored)

```
expired:  past expiry date
critical: 0–3 days remaining
warning:  4–14 days remaining
normal:   15–60 days remaining
fresh:    60+ days remaining
```

---

## 🌐 Translation System

```jsx
// In any component:
import { useLanguage } from '../context/LanguageContext';

function MyComponent() {
  const { t, lang, toggleLang } = useLanguage();

  return (
    <div>
      <h1>{t('my.page.title')}</h1>
      <p>{t('my.page.count', { items: 5 })}</p>
      <button onClick={toggleLang}>
        {lang === 'ko' ? 'English' : '한국어'}
      </button>
    </div>
  );
}
```

### Key structure
- Use dot-notation: `'page.section.element'`
- Add to both `ko` and `en` in `translations.js`
- Use `{placeholder}` for dynamic values → pass as second arg to `t()`

---

## 🏗️ Architecture Notes

- **No CSS framework** — plain CSS with custom properties. Mobile-first breakpoints at 768px, 640px, 400px.
- **No state management library** — React Context + useState/useEffect is sufficient.
- **Sessions are file-based** — stored in `server/data/sessions/`. Not suitable for multi-server.
- **Soft deletes** for products and categories. Hard deletes for suppliers.
- **ProductForm.**jsx is the most complex component (301 lines) — handles camera scanning, USB scanner debounce, and full CRUD form.
- **The `expiry_status` is computed** at query time using `getExpiryStatus()` helper in both server routes.

---

## 🔜 Future Tasks

See `PROJECT.md` → "Future Roadmap" section for the prioritized list.

Highlights:
- Push notifications for daily expiry alerts
- Bulk expiry update (select multiple → set one date)
- Activity log UI
- Product images
- Stock count mode (scan to increment/decrement)
