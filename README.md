# StockMatrix - Modern Node.js & PostgreSQL Inventory System

An enterprise-grade, high-performance inventory management system built with **Node.js**, **Express**, **PostgreSQL**, and a modern **cross-device responsive UI** (Mobile, Tablet, Desktop, and A4 Paper Print).

---

## 🚀 Key Features & Capabilities

- **Strict FIFO Accounting Engine**: Automated First-In, First-Out queue tracking and Cost of Goods Sold (COGS) valuation for precise profit margins.
- **Cross-Device Responsive Experience**:
  - 📱 **Mobile**: Slide-over drawer navigation, touch-optimized targets (&ge; 44px), card layouts, and responsive horizontal table scrollers.
  - 💻 **Desktop & Tablet**: High-density operational dashboards, KPI summary metrics, and side-by-side operational grids.
  - 🖨️ **A4 Paper Print**: Dedicated `@media print` styling for purchase requisitions with custom header banners, signature lines, and zero-waste layout.
- **Multi-Branch Network Support**: Global inventory monitoring with granular role-based branch assignments.
- **Role-Based Security Matrix**:
  - `Admin`: Full global configuration, branch provisioning, account management, executive reports, and product catalog controls.
  - `Manager`: Inventory receipt, sales dispatches, catalog management, branch operations hub, and reports for assigned branches.
  - `Staff`: Daily Stock In receiving and FIFO Stock Out dispatching for assigned operational branch facilities.
- **Product Catalog Management**: Dynamic search by nomenclature and brand, category filtering, measuring unit conversions, soft-delete archiving, and restoration safeguards.
- **Branch Operations Hub**: Real-time shelf inventory monitoring, timeline-scoped revenue analytics, low-stock alerts (&lt; 5 units), and transactional log modifications with inventory rollback protections.
- **Purchasing Requisition Manifest Compiler**: Multi-branch combiner with automated low-stock scanning and print-ready A4 export.
- **Dark / Light Theme Visualizer**: Dynamic theme toggling with smooth transitions and persistent browser storage.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express 5, Express-Session, BcryptJS, PG (node-postgres)
- **Database**: PostgreSQL 12+ (Relational schema with foreign keys, checks, indexes, and ACID transactions)
- **Frontend**: Vanilla ES6+ JavaScript SPA, CSS Custom Properties (Design Tokens), Glassmorphism, Chart.js
- **Fonts**: Google Fonts (`Outfit` for display headings, `Inter` for data density)

---

## 📦 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or higher)
- [PostgreSQL](https://www.postgresql.org/) (v12 or higher)

### 2. Configure Database Environment
Copy `.env.example` to `.env` (or configure your existing `.env` file):

```env
PORT=3000
NODE_ENV=development

# PostgreSQL Connection Credentials
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=inventory_db

# Session Secret Key
SESSION_SECRET=stockmatrix_enterprise_secret_key_2026
```

### 3. Install Dependencies & Initialize Database
Run the following commands in the project root:

```bash
# Install node packages
npm install

# Initialize database schema and populate seed data
npm run db:init
```

### 4. Start the Application Server
```bash
npm start
```
The application will launch and be accessible at: **[http://localhost:3000](http://localhost:3000)**

---

## 👥 Default Test Accounts

| Username | Password | Security Role | Operational Scope |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | **ADMIN** | Global Access (All Branches & Controls) |
| `manager` | `admin123` | **MANAGER** | Branches 2 & 3 (Operations, Catalog & Reports) |
| `staff` | `admin123` | **STAFF** | Branch 2 (Stock In & FIFO Stock Out) |

*Quick-fill test buttons are conveniently available on the login page for rapid one-click testing.*

---

## 🗄️ Database Architecture

The relational schema resides in [`db/schema.sql`](file:///c:/Users/user/Desktop/inventory_system/db/schema.sql) and includes:

- `units`: Measurement units (`pcs`, `box`, `kg`, `meter`, etc.).
- `branches`: Operational store and warehouse nodes.
- `accounts`: User authentication and role definitions (`admin`, `manager`, `staff`).
- `account_branches`: Many-to-many user-to-branch permission mapping.
- `products`: Catalog items with categories (`1` = Electronics, `2` = Construction), brands, color swatches, and soft-delete flags (`is_deleted`).
- `unit_conversions`: Multi-unit base conversion multipliers.
- `branch_inventory`: Live on-shelf physical quantity tracker per product per branch.
- `stock_in`: Inbound delivery records with purchase cost and quantity in base units.
- `stock_out`: Outbound sales transactions with sold price.
- `stock_out_batches`: FIFO traceability ledger linking outbound sales directly to source `stock_in` inbound batches for exact COGS auditing.

---

## 🌐 REST API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /api/auth/login`: User authentication with session initiation.
- `POST /api/auth/logout`: Terminate active session.
- `GET  /api/auth/me`: Fetch authenticated user profile and assigned branch scopes.

### Products (`/api/products`)
- `GET    /api/products`: Filterable, searchable, and sortable product list.
- `GET    /api/products/:id`: Fetch single product by ID.
- `POST   /api/products`: Create catalog product profile (*Admin/Manager*).
- `PUT    /api/products/:id`: Update product profile (*Admin/Manager*).
- `DELETE /api/products/:id`: Soft-delete/archive product with inventory safeguard (*Admin/Manager*).
- `POST   /api/products/:id/restore`: Restore archived product (*Admin/Manager*).

### Stock Management (`/api/stock`)
- `GET  /api/stock/in/init`: Load branch inventory and units for receiving.
- `POST /api/stock/in`: Record inbound shipment batch.
- `GET  /api/stock/out/init`: Load branch inventory for dispatching.
- `POST /api/stock/out`: Execute FIFO sales dispatch with automatic COGS computation.
- `GET  /api/stock/conversions/:productId`: Fetch conversion rates for multi-unit selection.

### Dashboard & Operations (`/api/dashboard`)
- `GET    /api/dashboard/overview`: High-level multi-branch health cards.
- `GET    /api/dashboard/branch/:id`: Operational branch hub (live stock, timeline filters, activity logs).
- `PUT    /api/dashboard/stock-in/:id`: Modify inbound delivery with inventory checks.
- `DELETE /api/dashboard/stock-in/:id`: Rollback inbound delivery.
- `PUT    /api/dashboard/stock-out/:id`: Modify sales transaction.
- `DELETE /api/dashboard/stock-out/:id`: Rollback sales dispatch and restore stock.

### Executive Reports (`/api/reports`)
- `GET /api/reports`: Comprehensive FIFO yields, topline revenues, COGS, on-hand valuations, daily sales trends, facility performance matrix, and ledgers.

### Branches & Accounts (`/api/branches`, `/api/accounts`)
- Full CRUD operations with protection against self-deletion and deletion of branches containing active physical stock.
