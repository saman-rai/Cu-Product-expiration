# CU Product Expiry Management System — AI Agent Project Document

Everything an AI agent needs to understand this project: architecture, current state, future roadmap.

---

## 1. Project Overview

- **Name:** CU Convenience Store Product Expiry Management System
- **Purpose:** Track expiration dates of thousands of products in a Korean CU convenience store, with barcode scanning, expiry notifications, and Excel import/export.
- **UI Language:** Korean (for store staff in South Korea)
- **Code/Documentation:** English
- **Target Users:** Store managers and staff at CU convenience stores

---

## 2. Current Status — What's Implemented

### ✅ Authentication
- Session-based login (cookie with httpOnly flag)
- bcrypt password hashing
- Two roles: `admin` and `staff`
- Sessions stored as files in `server/data/sessions/`

### ✅ Product CRUD
- Full create/read/update/delete with soft delete (`is_active = 0`)
- Fields: barcode, name, category, supplier, quantity, unit, shelf_location, expiry_date (required), manufactured_date, batch_number, cost_price, selling_price, notes
- Barcode uniqueness enforced at DB level

### ✅ Barcode Scanning
- **Camera:** Uses `html5-qrcode` library with `facingMode: 'environment'` (rear camera)
- **USB Scanner:** Keyboard wedge emulation with 100ms debounce to distinguish scanner from human typing
- On scan: auto-lookup existing product → pre-fill form
- Quick Scan page (`/scan`): camera opens immediately on page load

### ✅ Expiry Alert Modal
- Shown on login when products expire today, tomorrow, or are already expired
- "Don't show again today" checkbox (stored in localStorage)
- Links to `/expiring-soon` page for full view

### ✅ Expiring Soon Page (`/expiring-soon`)
- 5 tabs: expired / today / tomorrow / this week / next week
- Each tab has product table with status badge, name, barcode, expiry, days left, shelf, quantity, edit button
- Pagination (50 per page)

### ✅ Dashboard (`/dashboard`)
- 4 summary cards with counts: expired, critical (3 days), warning (14 days), normal+fresh
- Table of nearest 20 expiring products (within 14 days)

### ✅ Categories
- Hierarchical (self-referencing `parent_id`)
- Soft delete with protection (can't delete categories that have children or products)
- Tree API returns nested structure

### ✅ Suppliers
- CRUD with contact person, phone, email, notes
- Hard delete with protection (can't delete if products reference it)

### ✅ Excel Import
- Download blank template → fill data → upload `.xlsx`
- Upserts by barcode (existing → update, new → create)
- Auto-creates categories and suppliers by name
- Logs import results to `activity_log` table

### ✅ Excel Export
- Download all active products as `.xlsx`

### ✅ Mobile UI
- Responsive CSS with breakpoints at 768px, 640px, 400px
- Bottom navigation bar (5 tabs: Home / Scan / Products / Expiring / More)
- Floating Action Button (camera icon → scan page)
- Modal slides up from bottom on mobile
- Touch targets minimum 44px (Apple HIG)
- `font-size: 16px` on mobile inputs (prevents iOS auto-zoom)

### ✅ PWA Support
- `manifest.json` — app name, icons, display: standalone
- Service worker — network-first strategy for static assets
- SVG app icons (192x192, 512x512)
- apple-mobile-web-app meta tags
- Registered in `main.jsx`

### ✅ Seed Data
- Admin user: `admin` / `admin123`, store name "CU 편의점"
- 4 category groups with 3 sub-categories each (beverages, snacks, dairy, instant foods)
- 5 suppliers (Seoul Milk, Binggrae, Nongshim, Orion, Coca-Cola)

---

## 3. Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | PK AUTOINCREMENT |
| username | TEXT | NOT NULL, UNIQUE |
| password | TEXT | NOT NULL (bcrypt hash) |
| store_name | TEXT | DEFAULT 'CU 편의점' |
| role | TEXT | DEFAULT 'staff' |
| created_at | TEXT | DEFAULT datetime('now','localtime') |

### `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | PK AUTOINCREMENT |
| name | TEXT | NOT NULL |
| parent_id | INTEGER | nullable, self-referencing FK |
| sort_order | INTEGER | DEFAULT 0 |
| is_active | INTEGER | DEFAULT 1 (soft delete) |
| created_at | TEXT | |

### `suppliers`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | PK AUTOINCREMENT |
| name | TEXT | NOT NULL |
| contact_person | TEXT | nullable |
| phone | TEXT | nullable |
| email | TEXT | nullable |
| notes | TEXT | nullable |
| created_at | TEXT | |

### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | PK AUTOINCREMENT |
| barcode | TEXT | nullable, UNIQUE |
| name | TEXT | NOT NULL |
| category_id | INTEGER | nullable FK → categories |
| supplier_id | INTEGER | nullable FK → suppliers |
| quantity | INTEGER | DEFAULT 1 |
| unit | TEXT | DEFAULT '개' (unit) |
| shelf_location | TEXT | nullable (aisle/shelf number) |
| expiry_date | TEXT | NOT NULL |
| manufactured_date | TEXT | nullable |
| batch_number | TEXT | nullable |
| cost_price | REAL | nullable |
| selling_price | REAL | nullable |
| notes | TEXT | nullable |
| is_active | INTEGER | DEFAULT 1 (soft delete) |
| created_by | INTEGER | nullable FK → users |
| created_at | TEXT | |
| updated_at | TEXT | |

### `activity_log`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | PK AUTOINCREMENT |
| user_id | INTEGER | nullable FK |
| action | TEXT | e.g., 'import' |
| details | TEXT | JSON string |
| created_at | TEXT | |

**Indexes:** `products(expiry_date)`, `products(barcode)`, `products(category_id)`, `products(is_active)`

---

## 4. File Structure

```
CuProductExpiry/
├── .env                           # SESSION_SECRET, PORT
├── .gitignore
├── package.json                   # Root scripts
├── plan.md                        # Implementation plan
├── README.md                      # This file
├── PROJECT.md                     # AI agent project doc (you are here)
│
├── server/
│   ├── package.json
│   ├── index.js                   # Express server entry (port 3001, listens on 0.0.0.0)
│   ├── db.js                      # SQLite via sql.js (WASM), query/queryOne/execute
│   ├── seed.js                    # Admin user + sample data
│   ├── middleware/
│   │   └── auth.js                # requireAuth middleware
│   ├── routes/
│   │   ├── auth.js                # Login/logout/me
│   │   ├── products.js            # Product CRUD + expiring endpoint
│   │   ├── categories.js          # Category CRUD + tree
│   │   ├── suppliers.js           # Supplier CRUD
│   │   ├── dashboard.js           # Summary + expiry alerts
│   │   └── excel.js               # Excel import/export/template
│   └── data/
│       ├── cu-store.db            # SQLite database file
│       ├── sessions/              # File-based session store
│       └── uploads/               # Multer temp uploads
│
├── client/
│   ├── package.json
│   ├── vite.config.js             # Proxy /api → localhost:3001, host: 0.0.0.0
│   ├── index.html                 # PWA meta tags
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   ├── sw.js                  # Service worker
│   │   └── icons/                 # App icons (SVG)
│   └── src/
│       ├── main.jsx               # Entry + SW registration
│       ├── App.jsx                # Routes
│       ├── services/api.js        # API client
│       ├── context/AuthContext.jsx # Auth state
│       ├── components/
│       │   ├── Layout.jsx         # Sidebar + BottomNav + FAB + Outlet
│       │   ├── ProtectedRoute.jsx # Auth guard
│       │   ├── BottomNav.jsx      # Mobile bottom nav (5 tabs)
│       │   └── ExpiryAlertModal.jsx # Login alert popup
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Products.jsx
│       │   ├── ProductForm.jsx    # Modal form with barcode scan
│       │   ├── Categories.jsx
│       │   ├── Suppliers.jsx
│       │   ├── ExcelImport.jsx
│       │   ├── ExpiringSoon.jsx   # Tabbed expiring products
│       │   └── QuickScan.jsx      # Camera-first scan page
│       └── styles/App.css         # All styles (728+ lines)
```

---

## 5. Complete API Reference (24 endpoints)

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login with username/password |
| POST | `/api/auth/logout` | No | Destroy session |
| GET | `/api/auth/me` | Yes | Current user info |

### Products
| Method | Path | Auth | Query Params | Description |
|--------|------|------|-------------|-------------|
| GET | `/api/products` | Yes | `search`, `category_id`, `expiry_status`, `sort` | List active products |
| GET | `/api/products/expiring` | Yes | `group` (expired/today/tomorrow/this_week/next_week), `limit` (50), `offset` (0) | Products by timeframe |
| GET | `/api/products/barcode/:code` | Yes | — | Lookup by barcode |
| GET | `/api/products/:id` | Yes | — | Lookup by ID |
| POST | `/api/products` | Yes | — | Create product |
| PUT | `/api/products/:id` | Yes | — | Update product |
| DELETE | `/api/products/:id` | Yes | — | Soft delete |

### Categories
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/categories` | Yes | Flat list, ordered by sort_order |
| GET | `/api/categories/tree` | Yes | Nested tree structure |
| POST | `/api/categories` | Yes | Create (name, parent_id, sort_order) |
| PUT | `/api/categories/:id` | Yes | Update |
| DELETE | `/api/categories/:id` | Yes | Soft delete (protected) |

### Suppliers
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/suppliers` | Yes | List all suppliers |
| POST | `/api/suppliers` | Yes | Create (name, contact_person, phone, email, notes) |
| PUT | `/api/suppliers/:id` | Yes | Update |
| DELETE | `/api/suppliers/:id` | Yes | Hard delete (protected) |

### Dashboard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard/summary` | Yes | Counts per level + nearest 20 expiring products |
| GET | `/api/dashboard/expiry-alerts` | Yes | Today/tomorrow/expired alerts |

### Excel
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/excel/template` | Yes | Download blank Excel template |
| GET | `/api/excel/export` | Yes | Export all active products as .xlsx |
| POST | `/api/excel/import` | Yes | Upload .xlsx file (multipart/form-data, field: `file`) |

---

## 6. How to Run

```bash
# First time setup
cd server && npm install
cd ../client && npm install
cd .. && npm install
npm run seed

# Development (hot reload, accessible on network)
npm run dev

# Production (build + serve on port 3001)
npm run prod

# Find your network IP
# Windows: ipconfig | Mac/Linux: ifconfig
# Then open http://<IP>:5173 (dev) or http://<IP>:3001 (prod)
```

---

## 7. Technical Architecture Notes

- **Database engine:** sql.js — SQLite compiled to WebAssembly, runs in-process, zero native dependencies. Every write triggers `saveDb()` which serializes the entire DB to disk.
- **Session storage:** File-based via `session-file-store`. Sessions are JSON files in `server/data/sessions/`. Not suitable for multi-server deployments.
- **Foreign keys:** Not enforced at the database level (SQLite doesn't enforce FK without `PRAGMA foreign_keys = ON`). Relationships are application-level only.
- **Soft deletes:** Products and categories use `is_active = 0`. Suppliers use hard `DELETE`.
- **Expiry status:** Computed at query time (not stored). 5 levels based on `today - expiry_date`:
  - `expired` (< 0), `critical` (0–3d), `warning` (4–14d), `normal` (15–60d), `fresh` (> 60d)

---

## 8. Key Libraries & Versions

### Server (`server/package.json`)
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.21.2 | HTTP server |
| express-session | ^1.18.1 | Session management |
| session-file-store | ^1.5.0 | File-based session store |
| sql.js | ^1.11.0 | SQLite via WebAssembly |
| bcryptjs | ^2.4.3 | Password hashing (pure JS) |
| multer | ^1.4.5-lts.1 | File upload handling |
| xlsx | ^0.18.5 | Excel read/write |
| cors | ^2.8.5 | CORS headers |
| dotenv | ^16.4.7 | Environment variables |

### Client (`client/package.json`)
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.0.0 | UI framework |
| react-dom | ^19.0.0 | DOM rendering |
| react-router-dom | ^7.1.3 | Client-side routing |
| html5-qrcode | ^2.3.8 | Camera-based barcode scanning |
| vite | ^6.0.7 | Build tool |
| @vitejs/plugin-react | ^4.3.4 | React plugin |

---

## 9. Future Roadmap

### 🔴 High Priority
| Task | Description |
|------|-------------|
| **Push notifications** | Browser push or email alerts for daily expiry summary |
| **Bulk expiry update** | Select multiple products → set same expiry date |
| **Activity log UI** | Visual history of imports, changes, deletions |
| **Multi-store support** | Switch between stores or manager dashboard |

### 🟡 Medium Priority
| Task | Description |
|------|-------------|
| **Dashboard date filter** | Custom date range for expiring products view |
| **Stock count mode** | Scan barcode to increment/decrement quantity |
| **Product images** | Attach photos for visual identification |
| **Discount tracking** | Sale price, promotion period fields |
| **Printable shelf labels** | Generate label sheets for shelf display |
| **Dark mode** | Theme toggle |

### 🟢 Low Priority
| Task | Description |
|------|-------------|
| **Barcode label printing** | Print barcodes for products without them |
| **WebShare API** | Native share sheet for product info |
| **Full offline mode** | IndexedDB sync with service worker |
| **Receipt scanning** | Parse CU store receipts |
| **Multi-language** | English/Chinese UI toggle |

---

## 10. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_SECRET` | `cu-store-change-this-in-production` | Express session secret |
| `PORT` | `3001` | Backend server port |
| `NODE_ENV` | (none) | Set to `production` to serve client build |

---

## 11. Testing

**No automated tests exist yet.** The project is tested manually. Test files would go in:
- `server/__tests__/` — API route tests (recommended: Vitest + supertest)
- `client/src/__tests__/` — Component tests (recommended: Vitest + Testing Library)

---

## 12. Design Decisions

- **No CSS framework** — Plain CSS with custom properties for full control, zero dependency weight
- **No state management library** — React Context + local state is sufficient for single-store, single-session usage
- **Mobile-first CSS** — Breakpoints at 768px (tablet), 640px (phone landscape), 400px (small phone)
- **SQLite over PostgreSQL/MySQL** — Zero setup, single-file deployment, sufficient for single convenience store
- **Session auth over JWT** — Simpler for this use case, httpOnly cookies more secure against XSS
- **Dual barcode input** — Camera for phone users, USB keyboard wedge for desktop users with physical scanners
- **Excel upsert by barcode** — Matches existing products on barcode, updates them; new barcodes create new records
