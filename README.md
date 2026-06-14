# OmniPay POS Inventory Management System

A complete React-based POS Terminal Inventory Management System for OmniPay Limited, designed to replace manual Excel-based VLOOKUP reconciliation with an automated daily import and reconciliation engine.

## Features

- **Dashboard** — Real-time KPIs with status, location, category, and regional distribution charts
- **Daily Import** — Upload Excel Data sheet (master inventory) and DB sheet (portal download)
- **Automated Reconciliation** — Match serial numbers, auto-update TerminalIDs, merchant info, and status
- **Inventory Search** — Multi-field search with filters by status, location, and category
- **Exception Handling** — Auto-flag EXC-001 to EXC-008 for manual review
- **Audit Trail** — Complete log of all reconciliation actions
- **Export** — Download inventory or reconciliation logs to Excel

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open http://localhost:5173 in your browser
```

## Daily Workflow

1. **Import Master Inventory** (first time only, or when new stock arrives)
   - Go to **Daily Import** → **Import Master Inventory**
   - Upload your `OmniPay_Inventory_System_v2.xlsx` file
   - The system reads the `Data` sheet

2. **Import Portal DB** (daily)
   - Switch to **Import Portal DB**
   - Upload your daily portal download
   - The system reads the `db` sheet and stages the records

3. **Run Reconciliation** (daily)
   - Go to **Reconciliation**
   - Click **Run Daily Reconciliation**
   - Review auto-updates and exceptions

4. **Review Dashboard**
   - Go to **Dashboard** to see updated KPIs and charts

## Data Storage

All data is stored in the browser's **LocalStorage** for local operation. This means:
- Data persists across browser sessions
- No backend server required
- Data is private to your browser
- For team use, each user must import the files independently

## Technology Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Recharts (charts)
- SheetJS/xlsx (Excel parsing)
- Lucide React (icons)

## File Structure

```
omnipay-inventory/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Sidebar navigation
│   │   ├── Dashboard.tsx         # KPIs and charts
│   │   ├── ImportPage.tsx      # Excel upload
│   │   ├── ReconciliationPage.tsx # Reconciliation engine
│   │   ├── InventoryPage.tsx     # Searchable inventory table
│   │   ├── KPIcards.tsx          # KPI card components
│   │   └── Charts.tsx            # Chart components
│   ├── types.ts                # TypeScript interfaces
│   ├── db.ts                   # LocalStorage database layer
│   ├── reconciler.ts           # Reconciliation engine
│   ├── utils.ts                # Helper functions
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind imports
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── index.html
```

## Reconciliation Rules

| Rule | Condition | Action |
|------|-----------|--------|
| R1 | DB has TerminalID, Master has none | Auto-update TerminalID + Merchant + Phone + Status→Mapped |
| R2 | TerminalID mismatch | Flag exception EXC-003 |
| R3 | Merchant info changed | Auto-update Business Name + Phone |
| R4 | TransactingTID present | Confirm deployment, update status |
| R5 | Serial in DB but not in Master | Flag exception EXC-001 |
| R6 | Serial in Master but not in DB | Flag exception EXC-002 |

## Future Enhancements

- Backend API with PostgreSQL
- Automated portal download (scheduled job)
- User authentication and role-based access
- Email alerts for daily exceptions
- Mobile app for field agents
- Barcode/QR scanning

## License

Internal use only — OmniPay Limited
