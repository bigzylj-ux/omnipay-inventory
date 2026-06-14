import { InventoryRecord, normalizeStatus } from './types';

export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-NG');
};

export const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-NG');
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'In Stock': 'bg-green-100 text-green-800',
    'Dispatched': 'bg-blue-100 text-blue-800',
    'Yet To Deploy': 'bg-yellow-100 text-yellow-800',
    'Deployed': 'bg-emerald-100 text-emerald-800',
    'Faulty': 'bg-red-100 text-red-800',
    'Retrieved': 'bg-orange-100 text-orange-800',
    'Under Repair': 'bg-purple-100 text-purple-800',
    'Repaired': 'bg-emerald-100 text-emerald-800',
    'Cannibalised': 'bg-red-100 text-red-800',
    'Test Terminal': 'bg-cyan-100 text-cyan-800',
    'Lost': 'bg-gray-100 text-gray-800',
    'Damaged': 'bg-rose-100 text-rose-800',
    'Decommissioned': 'bg-slate-100 text-slate-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const calculateKPIs = (records: InventoryRecord[]) => {
  const total = records.length;
  const deployed = records.filter(r => normalizeStatus(r.status) === 'Deployed').length;
  const yetToDeploy = records.filter(r => normalizeStatus(r.status) === 'Yet To Deploy').length;
  const inStock = records.filter(r => {
    const status = normalizeStatus(r.status);
    const category = r.category ? r.category.trim().toLowerCase() : '';
    return status === 'In Stock' || status === 'In Stock' || category === 'stock';
  }).length;
  const faulty = records.filter(r => normalizeStatus(r.status) === 'Faulty').length;
  const test = records.filter(r => {
    const status = normalizeStatus(r.status);
    const category = r.category ? r.category.trim().toLowerCase() : '';
    return status === 'Test Terminal' || category === 'test terminal' || category === 'test';
  }).length;
  const retrieved = records.filter(r => normalizeStatus(r.status) === 'Retrieved').length;
  const underRepair = records.filter(r => normalizeStatus(r.status) === 'Under Repair').length;

  return {
    totalInventory: total,
    totalDeployed: deployed,
    totalYetToDeploy: yetToDeploy,
    totalInStock: inStock,
    totalFaulty: faulty,
    totalTest: test,
    totalRetrieved: retrieved,
    totalUnderRepair: underRepair,
    newDeploymentsToday: 0,
    pendingExceptions: 0,
  };
};

export const parseExcelDate = (excelDate: number | string | null): string | null => {
  if (!excelDate) return null;
  if (typeof excelDate === 'number') {
    const epoch = new Date(1899, 11, 30);
    const date = new Date(epoch.getTime() + excelDate * 86400000);
    return date.toISOString();
  }
  return new Date(excelDate).toISOString();
};
