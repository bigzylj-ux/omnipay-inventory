-- Copy and paste this into the Supabase SQL Editor.
-- This schema keeps the inventory fields used by the UI and adds shared tables for the app.

create extension if not exists "uuid-ossp";

-- 1) Auth profile table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'user',
  approved boolean not null default false,
  vendor_access boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Inventory table (keeps the UI field names in a DB-friendly form)
create table if not exists public.inventory (
  id uuid primary key default uuid_generate_v4(),
  sn integer,
  device_serial_no text not null unique,
  terminal_id text,
  transacting_tid text,
  merchant_name text,
  phone_no text,
  date_mapped date,
  sim_serial text,
  date_dispatched date,
  custodian text,
  pickup_staff text,
  redispatch_mfc text,
  location text,
  status text not null default 'Yet To Deploy',
  fault text,
  category text,
  manager text,
  region text,
  terminal_id_assigned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_reconciled_at timestamptz
);

create index if not exists inventory_status_idx on public.inventory (status);
create index if not exists inventory_location_idx on public.inventory (location);
create index if not exists inventory_category_idx on public.inventory (category);

-- 3) Portal records table
create table if not exists public.portal_records (
  id uuid primary key default uuid_generate_v4(),
  batch_id text not null,
  serial_number text not null,
  terminal_id text,
  business_name text,
  phone_number text,
  updated_at timestamptz,
  transacting_tid text,
  imported_at timestamptz not null default now(),
  match_status text not null default 'PENDING'
);

create index if not exists portal_records_batch_idx on public.portal_records (batch_id);
create index if not exists portal_records_serial_idx on public.portal_records (serial_number);

-- 4) Reconciliation logs table
create table if not exists public.reconciliation_logs (
  id uuid primary key default uuid_generate_v4(),
  batch_id text not null,
  serial_number text not null,
  action_type text not null,
  field_changed text not null,
  old_value text,
  new_value text,
  performed_by text not null,
  performed_at timestamptz not null default now(),
  notes text not null default ''
);

create index if not exists logs_batch_idx on public.reconciliation_logs (batch_id);
create index if not exists logs_serial_idx on public.reconciliation_logs (serial_number);

-- 5) Vendors table
create table if not exists public.vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6) Vendor repairs table
create table if not exists public.vendor_repairs (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  vendor_name text not null,
  serial_number text not null,
  faults text[] not null default '{}',
  fault_costs numeric[] not null default '{}',
  total_cost numeric not null default 0,
  source_file_name text,
  uploaded_at timestamptz not null default now(),
  notes text
);

create index if not exists vendor_repairs_vendor_idx on public.vendor_repairs (vendor_id);
create index if not exists vendor_repairs_serial_idx on public.vendor_repairs (serial_number);

-- 7) Enable RLS
alter table public.profiles enable row level security;
alter table public.inventory enable row level security;
alter table public.portal_records enable row level security;
alter table public.reconciliation_logs enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_repairs enable row level security;

-- 8) Policies
-- Note: CREATE POLICY does not support IF NOT EXISTS in Postgres.
-- Run this block once as-is, or drop the policies first if you rerun it.

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
  on public.profiles
  for select
  using ((auth.uid())::text = (id)::text);

drop policy if exists "inventory_read_all_auth" on public.inventory;
create policy "inventory_read_all_auth"
  on public.inventory
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "portal_records_read_all_auth" on public.portal_records;
create policy "portal_records_read_all_auth"
  on public.portal_records
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "reconciliation_logs_read_all_auth" on public.reconciliation_logs;
create policy "reconciliation_logs_read_all_auth"
  on public.reconciliation_logs
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "vendors_read_all_auth" on public.vendors;
create policy "vendors_read_all_auth"
  on public.vendors
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "vendor_repairs_read_all_auth" on public.vendor_repairs;
create policy "vendor_repairs_read_all_auth"
  on public.vendor_repairs
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "inventory_write_admin" on public.inventory;
create policy "inventory_write_admin"
  on public.inventory
  for all
  using (
    exists (
      select 1 from public.profiles p
      where (p.id)::text = (auth.uid())::text and p.role = 'admin' and p.approved = true
    )
  );

drop policy if exists "portal_records_write_admin" on public.portal_records;
create policy "portal_records_write_admin"
  on public.portal_records
  for all
  using (
    exists (
      select 1 from public.profiles p
      where (p.id)::text = (auth.uid())::text and p.role = 'admin' and p.approved = true
    )
  );

drop policy if exists "reconciliation_logs_write_admin" on public.reconciliation_logs;
create policy "reconciliation_logs_write_admin"
  on public.reconciliation_logs
  for all
  using (
    exists (
      select 1 from public.profiles p
      where (p.id)::text = (auth.uid())::text and p.role = 'admin' and p.approved = true
    )
  );

drop policy if exists "vendors_write_admin" on public.vendors;
create policy "vendors_write_admin"
  on public.vendors
  for all
  using (
    exists (
      select 1 from public.profiles p
      where (p.id)::text = (auth.uid())::text and p.role = 'admin' and p.approved = true
    )
  );

drop policy if exists "vendor_repairs_write_admin" on public.vendor_repairs;
create policy "vendor_repairs_write_admin"
  on public.vendor_repairs
  for all
  using (
    exists (
      select 1 from public.profiles p
      where (p.id)::text = (auth.uid())::text and p.role = 'admin' and p.approved = true
    )
  );
