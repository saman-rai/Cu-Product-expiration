# CU Product Expiry Management System — AI Agent Project Document

This document contains everything an AI agent needs to understand this project, its current state, architecture, and future roadmap.

---

## 1. Project Overview

**Name:** CU 편의점 유통기한 관리 시스템 (CU Convenience Store Product Expiry Management System)  
**Purpose:** Track expiration dates of thousands of products in a Korean CU convenience store, with notifications for expiring items, barcode scanning, and Excel import/export.  
**Language:** Korean (UI) + English (code)  
**Target Users:** Store managers and staff at CU convenience stores in South Korea

---

## 2. Current Status

### ✅ Implemented Features

- **Authentication:** Session-based login (admin/staff roles), bcrypt password hashing
- **Product CRUD:** Full create/read/update/delete with soft delete, barcode, name, category, supplier, quantity, unit, shelf_location, expiry_date, manufactured_date, batch_number, cost_price, selling_price, notes
- **Categories:** Hierarchical (parent_id self-reference), soft delete, tree API, protection against deleting categories with children or products
- **Suppliers:** CRUD with contact info, protection against deleting suppliers with active products
- **Barcode Scanning:** Camera-based (html5-qrcode library) + USB keyboard wedge (debounce)
- **Quick Scan Page** (`/scan`): Camera opens immediately on page load, scan barcode → update expiry or add new product
- **Expiry Alerts Modal:** Login popup showing products expiring today/tomorrow/already expired, with "dismiss for today" (localStorage)
- **Expiring Soon Page** (`/expiring-soon`): Tabbed interface — expired/today/tomorrow/this_week/next_week, pagination, inline edit
- **Dashboard:** 4 summary cards (expired/critical/warning/ok) + nearest 20 expiring products table
- **Excel Import:** Template download → upload .xlsx → upsert by barcode, auto-create categories/suppliers
- **Excel Export:** Download all active products as .xlsx
- **Mobile Bottom Navigation:** 5-tab fixed bottom bar on mobile (홈/스캔/제품/소멸/더보기) with badge
- **Floating Action Button:** Camera icon on mobile → opens scan page
- **PWA Support:** manifest.json, service worker (network-first with cache fallback for static assets), SVG icons, apple-mobile-web-app meta tags
- **Mobile Responsive:** 768px/640px/400px breakpoints, sidebar → hamburger menu on mobile, modal slides up on mobile, 44px+ touch targets
- **Seed Data:** Admin user, 4 category groups with 3 sub-categories each, 5 suppliers

### 🏗️ Database Schema

**`users`** — id, username, password (bcrypt), store_name, role (admin/staff), created_at  
**`categories`** — id, name, parent_id (nullable, self-ref), sort_order, is_active (soft delete), created_at  
**`suppliers`** — id, name, contact_person, phone, email, notes, created_at  
**`products`** — id, barcode (nullable), name, category_id (FK), supplier_id (FK), quantity, unit, shelf_location, expiry_date (NOT NULL), manufactured_date, batch_number, cost_price, selling_price, notes, is_active (soft delete), created_by (FK), created_at, updated_at  
**`activity_log`** — id, user_id, action, details (JSON), created_at  

Indexes on products: expiry_date, barcode, category_id, is_active

### 🗺️ Route Structure

```
BrowserRouter
 └── /login → Login
 └── ProtectedRoute → Layout (sidebar/outlet)
      ├── / → redirect /dashboard
      ├── /dashboard → Dashboard (+ ExpiryAlertModal)
      ├── /products → Products (+ ProductForm modal)
      ├── /categories → Categories
      ├── /suppliers → Suppliers
      ├── /excel → ExcelImport
      ├── /expiring-soon → ExpiringSoon
      └── /scan → QuickScan
```

### 📡 Complete API Endpoints (24 total)

**Auth:**
- `POST /api/auth/login` — Login with username/password
- `POST /api/auth/logout` — Destroy session
- `GET /api/auth/me` — Current user info

**Products:**
- `GET /api/products` — List (search, category_id, expiry_status filters)
- `GET /api/products/expiring?group=&limit=&offset=` — Grouped by timeframe
- `GET /api/products/barcode/:code` — Lookup by barcode
- `GET /api/products/:id` — Lookup by ID
- `POST /api/products` — Create
- `PUT /api/products/:id` — Update
- `DELETE /api/products/:id` — Soft delete

**Categories:**
- `GET /api/categories` — Flat list
- `GET /api/categories/tree` — Nested tree
- `POST /api/categories` — Create
- `PUT /api/categories/:id` — Update
- `DELETE /api/categories/:id` — Soft delete (protected)

**Suppliers:**
- `GET /api/suppliers` — List
- `POST /api/suppliers` — Create
- `PUT /api/suppliers/:id` — Update
- `DELETE /api/suppliers/:id` — Hard delete (protected)

**Dashboard:**
- `GET /api/dashboard/summary` — Counts per status + nearest 20 expiring
- `GET /api/dashboard/expiry-alerts` — Today/tomorrow/expired alerts

**Excel:**
- `GET /api/excel/template` — Download blank template
- `GET /api/excel/export` — Export all products
- `POST /api/excel/import` — Import .xlsx file

### 📁 File Structure

```
CuProductExpiry/
├── .env                           # SESSION_SECRET, PORT
├── .gitignore
├── package.json                   # Scripts: dev, dev:server, dev:client, build, seed
├── plan.md                        # Original implementation plan
├── README.md                      # Project overview
├── PROJECT.md                     # This document
│
├── server/
│   ├── package.json               # express, sql.js, bcryptjs, xlsx, multer, etc.
│   ├── index.js                   # Express server entry (port 3001)
│   ├── db.js                      # SQLite via sql.js (WASM), query/queryOne/execute helpers
│   ├── seed.js                    # Admin user + sample categories/suppliers
│   ├── middleware/
│   │   └── auth.js                # requireAuth middleware
│   ├── routes/
│   │   ├── auth.js                # Login/logout/me
│   │   ├── products.js            # Product CRUD + expiring endpoint
│   │   ├── categories.js          # Category CRUD + tree
│   │   ├── suppliers.js           # Supplier CRUD
│   │   ├── dashboard.js           # Summary + expiry-alerts
│   │   └── excel.js               # Excel import/export/template
│   └── data/
│       ├── cu-store.db            # SQLite database file
│       ├── sessions/              # File-based session store
│       └── uploads/               # Multer temp uploads
│
├── client/
│   ├── package.json               # react, react-router-dom, html5-qrcode, vite
│   ├── vite.config.js             # Proxy /api → localhost:3001
│   ├── index.html                 # PWA meta tags, manifest
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   ├── sw.js                  # Service worker (network-first)
│   │   └── icons/
│   │       ├── icon-192.svg       # App icon 192x192
│   │       └── icon-512.svg       # App icon 512x512
│   └── src/
│       ├── main.jsx               # Entry point + SW registration
│       ├── App.jsx                # Routes
│       ├── services/
│       │   └── api.js             # Centralized fetch-based API client
│       ├── context/
│       │   └── AuthContext.jsx    # Auth state management
│       ├── components/
│       │   ├── Layout.jsx         # Sidebar + BottomNav + FAB + Outlet
│       │   ├── ProtectedRoute.jsx # Auth guard
│       │   ├── BottomNav.jsx      # Mobile bottom navigation (5 tabs)
│       │   └── ExpiryAlertModal.jsx # Login alert popup
│       ├── pages/
│       │   ├── Login.jsx          # Login form
│       │   ├── Dashboard.jsx      # Summary cards + nearest expiring + alert modal
│       │   ├── Products.jsx       # Product list + search + filter
│       │   ├── ProductForm.jsx    # Modal form with barcode scan (camera + USB)
│       │   ├── Categories.jsx     # Category tree CRUD
│       │   ├── Suppliers.jsx      # Supplier CRUD
│       │   ├── ExcelImport.jsx    # Excel upload/download/import results
│       │   ├── ExpiringSoon.jsx   # Tabbed expiring products (expired/today/tomorrow/this_week/next_week)
│       │   └── QuickScan.jsx      # Camera-first barcode scan with quick expiry update
│       └── styles/
│           └── App.css            # All styles (mobile-first, Korean-friendly)
```

---

## 3. Key Technical Decisions

- **No CSS framework** — plain CSS with custom properties for maintainability. Mobile-first breakpoints at 768px/640px/400px.
- **No state management library** — React Context + useState/useEffect is sufficient for this scale (single store, single user session).
- **SQLite via sql.js** — WebAssembly-based, zero native dependencies, single-file database. Good for single-store deployment.
- **Session auth** — Cookie-based (httpOnly), sessions stored as files. Simple and secure for this use case.
- **Barcode scanning** — Dual approach: camera (html5-qrcode with `facingMode: 'environment'`) + USB keyboard wedge (debounce timer).
- **Excel => upsert by barcode** — Import matches existing products by barcode and updates them. New barcodes create new products. Categories/suppliers auto-created by name.

---

## 4. How to Run

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install
cd .. && npm install

# Seed database (admin/admin123 + sample data)
npm run seed

# Development (server:3001 + client:5173 concurrently)
npm run dev
```

---

## 5. Future Tasks / Roadmap

### 🔴 High Priority

| Task | Description | Rationale |
|------|-------------|-----------|
| **Push/Email notifications** | Browser push notifications or email alerts for today's expiring products | Current alert only shows on login — store staff may not check often enough |
| **Bulk expiry update** | Select multiple products → set same expiry date (for shipment arrivals) | Currently must edit one-by-one in ExpiringSoon page |
| **Activity history/audit log** | Show import history, recent changes, who deleted what | Currently activity_log table exists but no UI for it |
| **Multi-store support** | Allow switching between stores or manager viewing multiple stores | Current session tied to single store_name |

### 🟡 Medium Priority

| Task | Description |
|------|-------------|
| **Dashboard date range filter** | Custom date range for viewing expiring products |
| **Quick stock-count mode** | Scan barcode to increment/decrement quantity for inventory audits |
| **Product images** | Allow attaching photos of products (useful for identifying items on shelves) |
| **Discount/promotion tracking** | Add sale price, promotion period, discount rate fields |
| **Printable shelf labels** | Generate A4/label paper sheets with product name + expiry date for shelf display |
| **Dark mode** | CSS dark theme toggle |

### 🟢 Low Priority / Nice-to-Have

| Task | Description |
|------|-------------|
| **Barcode label printing** | Print barcode labels for products that don't have them |
| **iOS/Android WebShare API** | Share product info via native share sheet |
| **Offline mode** | Full offline support via IndexedDB + service worker sync |
| **Receipt scanning** | Parse convenience store receipts to auto-add products |
| **Multiple languages** | English/Chinese language toggle alongside Korean |

---

## 6. Architecture Constraints & Notes

- **Database is single-file SQLite** — every write calls `saveDb()` (full file export). Not suitable for concurrent writes at scale but fine for single-store usage.
- **Sessions are file-based** — not suitable for multi-server deployment without shared filesystem.
- **No real foreign key constraints** in SQLite — relationships are application-level only.
- **Excel import supports both Korean and English column headers** — handles 바코드/barcode, 제품명/name, etc.
- **The `expiry_status` is computed at query time** (not stored in DB) — 5 levels: expired / critical (0-3d) / warning (4-14d) / normal (15-60d) / fresh (>60d).
- **Soft deletes** for products (`is_active=0`) and categories. Hard deletes for suppliers.
- **ProductForm's USB scanner support** uses a 100ms debounce timer to distinguish scanner input from human typing.

---

## 7. Running Tests

Currently there are **no automated tests**. The project is tested manually via `npm run dev`.  
Test files would go in:
- `server/__tests__/` for API tests
- `client/src/__tests__/` for component tests (Vitest)

---

## 8. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_SECRET` | `cu-store-change-this-in-production` | Express session secret |
| `PORT` | `3001` | Backend server port |
| `NODE_ENV` | (none) | Set to `production` to serve client build from Express |
