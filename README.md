# 🏪 CU Convenience Store — Product Expiry Management System

Track expiration dates of thousands of products, scan barcodes, get alerts for expiring items, and export data to Excel. Built for Korean CU convenience stores.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Product Management** | Full CRUD — barcode, name, expiry date, shelf location, quantity, prices, etc. |
| **Barcode Scanning** | Camera scan (phone) + USB scanner support with auto-lookup |
| **Quick Scan** | `/scan` page opens camera immediately → scan barcode → update expiry in 2 taps |
| **Expiry Alerts** | Popup on login showing products expiring today / tomorrow / already expired |
| **Expiring Soon Page** | Tabbed view: expired / today / tomorrow / this week / next week |
| **Category Tree** | Hierarchical parent/child categories |
| **Supplier Management** | Supplier CRUD with contact info |
| **Excel Import** | Download template → fill in Excel → bulk upload (upserts by barcode) |
| **Excel Export** | Download all products as `.xlsx` |
| **Dashboard** | Summary cards (expired/critical/warning/ok) + nearest expiring products table |
| **Mobile Optimized** | Bottom navigation, floating action button, responsive design, PWA support |
| **PWA** | "Add to Home Screen" support, service worker, app icons |

---

## 🚀 Quick Start

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install
cd .. && npm install

# Seed database (creates admin user + sample data)
npm run seed

# Run in development mode
npm run dev
```

**Default login:** `admin` / `admin123`

---

## 📱 Access from Your Phone

### Development mode (hot reload)
```bash
npm run dev
```
Then open `http://<YOUR-COMPUTER-IP>:5173` on your phone (same Wi-Fi network).

### Production mode (faster, standalone)
```bash
npm run prod
```
Then open `http://<YOUR-COMPUTER-IP>:3001` on your phone.

Find your IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router 7, Vite 6 |
| **Backend** | Express 4, sql.js (SQLite via WebAssembly) |
| **Auth** | Session-based (express-session + file-store) |
| **Excel** | SheetJS (xlsx) |
| **Barcode** | html5-qrcode (camera), USB keyboard wedge |

---

## 📁 Project Structure

```
CuProductExpiry/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Shared components (Layout, BottomNav, etc.)
│   │   ├── pages/             # Page components (Dashboard, Products, etc.)
│   │   ├── services/          # API client
│   │   ├── context/           # Auth context
│   │   └── styles/            # CSS
│   ├── public/                # Static files (PWA manifest, icons, service worker)
│   └── index.html
├── server/                    # Express backend
│   ├── routes/                # API route handlers
│   ├── middleware/            # Auth middleware
│   ├── db.js                  # SQLite database abstraction
│   ├── seed.js                # Seed data script
│   └── index.js               # Server entry point
├── package.json               # Root scripts
├── .env                       # Environment variables
├── README.md
└── PROJECT.md                 # Comprehensive project doc for AI agents
```

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/auth/me` | Current user info |
| `GET` | `/api/products` | List products (search/filter) |
| `GET` | `/api/products/expiring` | Products grouped by timeframe |
| `GET` | `/api/products/barcode/:code` | Lookup by barcode |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Soft delete |
| `GET` | `/api/categories/tree` | Category hierarchy tree |
| `GET` | `/api/dashboard/summary` | Dashboard summary |
| `GET` | `/api/dashboard/expiry-alerts` | Expiry alert data |
| `GET` | `/api/excel/export` | Export all products to Excel |
| `POST` | `/api/excel/import` | Import products from Excel |

---

## ⏰ Expiry Status Levels

| Status | Condition | Color |
|--------|-----------|-------|
| Expired | Past expiry date | `#dc3545` |
| Critical | 0–3 days remaining | `#fd7e14` |
| Warning | 4–14 days remaining | `#ffc107` |
| Normal | 15–60 days remaining | `#28a745` |
| Fresh | 60+ days remaining | `#17a2b8` |

---

## 🧪 Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both server + client in dev mode |
| `npm run dev:server` | Start backend only (port 3001) |
| `npm run dev:client` | Start frontend only (port 5173) |
| `npm run build` | Build frontend for production |
| `npm run seed` | Seed database with sample data |
| `npm run start` | Start server in current mode |
| `npm run prod` | Build + start in production mode |

---

## 📄 License

MIT
