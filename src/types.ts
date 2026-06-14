export interface InventoryRecord {
  id: string;
  sn: number;
  deviceSerialNo: string;
  terminalId: string | null;
  transactingTid: string | null;
  merchantName: string | null;
  phoneNo: string | null;
  dateMapped: string | null;
  simSerial: string | null;
  dateDispatched: string | null;
  custodian: string | null;
  pickupStaff: string | null;
  redispatchMfc: string | null;
  location: string | null;
  status: string;
  fault: string | null;
  category: string | null;
  manager: string | null;
  region: string | null;
  terminalIdAssignedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastReconciledAt: string | null;
}

export interface PortalRecord {
  id: string;
  batchId: string;
  serialNumber: string;
  terminalId: string | null;
  businessName: string | null;
  phoneNumber: string | null;
  updatedAt: string | null;
  transactingTid: string | null;
  importedAt: string;
  matchStatus: 'MATCHED' | 'UNMATCHED' | 'NEW' | 'EXCEPTION' | 'PENDING';
}

export interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorRepairRecord {
  id: string;
  vendorId: string;
  vendorName: string;
  serialNumber: string;
  faults: string[];
  faultCosts: number[];
  totalCost: number;
  sourceFileName: string | null;
  uploadedAt: string;
  notes: string | null;
}

export interface ReconciliationLog {
  id: string;
  batchId: string;
  serialNumber: string;
  actionType: 'UPDATE_MERCHANT' | 'UPDATE_TID' | 'STATUS_CHANGE' | 'NEW_DEPLOYMENT' | 'FLAG_EXCEPTION' | 'NO_CHANGE';
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  performedBy: string;
  performedAt: string;
  notes: string;
}

export interface DashboardKPI {
  totalInventory: number;
  totalDeployed: number;
  totalYetToDeploy: number;
  totalInStock: number;
  totalFaulty: number;
  totalTest: number;
  totalRetrieved: number;
  totalUnderRepair: number;
  newDeploymentsToday: number;
  pendingExceptions: number;
}

export interface ReconciliationResult {
  updated: number;
  newDeployments: number;
  exceptions: number;
  noChange: number;
  logs: ReconciliationLog[];
}

export type SystemStatus = 
  | 'In Stock' 
  | 'Dispatched' 
  | 'Yet To Deploy' 
  | 'Deployed' 
  | 'Faulty' 
  | 'Retrieved' 
  | 'Under Repair' 
  | 'Repaired' 
  | 'Cannibalised' 
  | 'Test Terminal' 
  | 'Lost' 
  | 'Damaged' 
  | 'Decommissioned';

export const SYSTEM_STATUSES: SystemStatus[] = [
  'In Stock',
  'Dispatched',
  'Yet To Deploy',
  'Deployed',
  'Faulty',
  'Retrieved',
  'Under Repair',
  'Repaired',
  'Cannibalised',
  'Test Terminal',
  'Lost',
  'Damaged',
  'Decommissioned',
];

export const normalizeStatus = (status: string | null): string => {
  if (!status || !status.trim()) return 'Yet To Deploy';
  const normalized = status.trim().toLowerCase();
  if (normalized.includes('mapped') && !normalized.includes('not')) return 'Deployed';
  if (normalized.includes('deployed')) return 'Deployed';
  if (normalized.includes('not mapped') || normalized.includes('not_mapped')) return 'Yet To Deploy';
  if (normalized.includes('yet') && normalized.includes('deploy')) return 'Yet To Deploy';
  if (normalized.includes('pending')) return 'Yet To Deploy';
  if ((normalized.includes('test') && !normalized.includes('terminal')) || normalized.includes('test terminal')) return 'Test Terminal';
  if (normalized.includes('in store') || normalized.includes('iddo') || normalized.includes('in stock') || normalized.includes('stock terminal')) return 'In Stock';
  if (normalized.includes('faulty')) return 'Faulty';
  if (normalized.includes('repair') || normalized.includes('repaired')) return 'Repaired';
  if (normalized.includes('cannibal')) return 'Cannibalised';
  return status.trim().charAt(0).toUpperCase() + status.trim().slice(1).toLowerCase();
};

export type SystemCategory = 
  | 'Distributor Merchant' 
  | 'Oracle Merchant' 
  | 'Legacy Merchant' 
  | 'Stock Terminal' 
  | 'Test Terminal' 
  | 'Membership' 
  | 'Financial Service' 
  | 'Non-Member Non-BNPL' 
  | 'HORECA';
