# OmniPay POS Inventory Management System

A React + TypeScript inventory workflow for OmniPay Limited that replaces manual reconciliation with a shared, role-aware system for importing, reconciling, tracking, and reviewing POS terminal records.

## Highlights

- **Shared data access** — inventory, portal records, logs, and vendor data are now read/written through Supabase where available.
- **Role-based access** — admins and approved users can access the right pages and actions.
- **Large import support** — bulk uploads are handled in paged/chunked reads and writes so the system can process thousands of rows.
- **Dashboard + analytics** — KPI cards, status summaries, and charts update from live records.
- **Tracking + vendor workflows** — serial history, lifecycle tracking, and vendor repair uploads are available.
- **Export and audit trail** — inventory and reconciliation data can be exported for reporting.

## Core Features

- **Dashboard** — KPI cards, status summaries, charts, and recent reconciliation activity
- **Daily Import** — Upload the master inventory (`Data`) sheet and the daily portal DB (`db`) sheet
- **Reconciliation** — Match serials, update merchant/terminal details, and flag exceptions
- **Inventory Management** — Search, filter, paginate, and edit inventory records
- **Tracking** — View serial-based lifecycle history and audit trail
- **Vendors** — Manage vendor records and upload fault/cost repair information
- **Admin Controls** — Manage user approvals and access levels

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# Create a .env.local file with:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# 3. Start the development server
npm run dev

# 4. Open http://localhost:5173
```

## Daily Workflow

1. **Import Master Inventory**
   - Go to **Daily Import** → **Import Master Inventory**
   - Upload the Excel file containing the master `Data` sheet
   - The system validates rows and persists them for use across sessions

2. **Import Portal DB**
   - Switch to **Import Portal DB**
   - Upload the portal download containing the `db` sheet
   - Duplicate/empty placeholders are filtered out before saving

3. **Run Reconciliation**
   - Go to **Reconciliation**
   - Run the reconciliation flow to update records and capture audit logs

4. **Review Results**
   - Use **Dashboard**, **Inventory**, **Tracking**, and **Vendors** to review updates

## Data Storage

The application now prefers **Supabase** for shared cross-user visibility and uses IndexedDB as a fallback when remote access is unavailable. This means:
- multiple users can see updated records when they are allowed to access the shared tables
- uploads and reconciliations are persisted beyond a single browser session
- the app still remains usable offline when fallback storage is available

## Authentication and Roles

- **Admin** — can import data, run reconciliation, manage user approvals, and access admin tools
- **Approved user** — can use dashboard, inventory, tracking, and vendor pages depending on access
- **Pending / unauthorized users** — are routed to approval or access restriction flows

## Technology Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Recharts
- SheetJS / XLSX
- Supabase (shared storage + auth)
- Lucide React

## File Structure

```
omnipay-inventory/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── ImportPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── ReconciliationPage.tsx
│   │   ├── TrackingPage.tsx
│   │   ├── VendorsPage.tsx
│   │   ├── AdminUsersPage.tsx
│   │   └── Layout.tsx
│   ├── contexts/
│   ├── lib/
│   ├── db.ts
│   ├── reconciler.ts
│   ├── types.ts
│   └── utils.ts
├── supabase-schema.sql
├── generate_documentation.py
├── generate_presentation.py
└── package.json
```

## Reconciliation Notes

| Rule | Condition | Action |
|------|-----------|--------|
| R1 | Portal has terminal ID but master is missing it | Auto-update terminal assignment |
| R2 | Serial mismatch or missing record | Flag exception for review |
| R3 | Merchant / phone data changes | Update records automatically |
| R4 | New deployment appears in portal data | Count as new deployment |
| R5 | Inventory is updated manually | Preserve audit trail in logs |

## License

Internal use only — OmniPay Limited
