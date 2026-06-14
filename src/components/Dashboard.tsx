import React, { useEffect, useState } from 'react';
import { getInventory, getLogs } from '../db';
import { InventoryRecord, ReconciliationLog, normalizeStatus } from '../types';
import { calculateKPIs } from '../utils';
import { KPIcards } from './KPIcards';
import { StatusChart, LocationChart, CategoryChart, RegionChart } from './Charts';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';
export const Dashboard: React.FC = () => {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [logs, setLogs] = useState<ReconciliationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const inv = await getInventory();
      const normalized = inv.map(record => ({
        ...record,
        status: normalizeStatus(record.status),
      }));
      const logData = await getLogs();
      setRecords(normalized);
      setLogs(logData.slice(-50).reverse());
      setLoading(false);
    };
    loadData();
  }, []);

  const kpis = calculateKPIs(records);

  const today = new Date().toISOString().split('T')[0];
  const newDeploymentsToday = records.filter(r => r.terminalIdAssignedAt?.startsWith(today)).length;
  const pendingExceptions = logs.filter(l => 
    l.actionType === 'FLAG_EXCEPTION' && 
    !l.notes.includes('RESOLVED')
  ).length;

  const enhancedKPIs = {
    ...kpis,
    newDeploymentsToday,
    pendingExceptions,
  };

  const months = [
    { value: 'All', label: 'All' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const getFilterDate = (record: InventoryRecord) => {
    return record.terminalIdAssignedAt || record.dateDispatched || record.dateMapped;
  };

  const categories = React.useMemo(() => {
    const setCats = new Set<string>();
    records.forEach(r => setCats.add(r.category?.trim() || 'Uncategorized'));
    return ['All', ...Array.from(setCats).filter(Boolean).sort()];
  }, [records]);

  const years = React.useMemo(() => {
    const setY = new Set<number>();
    records.forEach(r => {
      const dateForFilter = getFilterDate(r);
      if (dateForFilter) {
        const d = new Date(dateForFilter);
        if (!isNaN(d.getTime())) setY.add(d.getFullYear());
      }
    });
    return ['All', ...Array.from(setY).sort((a,b) => b - a).map(String)];
  }, [records]);

  const filteredRecords = records.filter(r => {
    if (selectedCategory !== 'All') {
      const cat = r.category?.trim() || 'Uncategorized';
      if (cat !== selectedCategory) return false;
    }
    const dateForFilter = getFilterDate(r);
    if (!dateForFilter) return false;
    const d = new Date(dateForFilter);
    if (isNaN(d.getTime())) return false;

    if (rangeStart) {
      const start = new Date(rangeStart + 'T00:00:00');
      if (d < start) return false;
    }
    if (rangeEnd) {
      const end = new Date(rangeEnd + 'T23:59:59');
      if (d > end) return false;
    }

    if (!rangeStart && !rangeEnd) {
      if (selectedMonth !== 'All') {
        if (String(d.getMonth() + 1) !== selectedMonth) return false;
      }
      if (selectedYear !== 'All') {
        if (String(d.getFullYear()) !== selectedYear) return false;
      }
    }
    return true;
  });

  const totalPosAssigned = filteredRecords.filter(r => r.dateDispatched).length;
  const totalDeployed = filteredRecords.filter(r => r.dateDispatched && normalizeStatus(r.status) === 'Deployed').length;
  const totalYetToDeploy = filteredRecords.filter(r => r.dateDispatched && normalizeStatus(r.status) === 'Yet To Deploy').length;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <KPIcards kpis={enhancedKPIs} />

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Dashboard Filters</p>
            <p className="text-xs text-slate-500">Using assignment date first, then dispatch date, then mapped date. Use the custom date range to filter by deployment/assignment period.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600">Category</span>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600">Month</span>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600">Year</span>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600">From</span>
              <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600">To</span>
              <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <p className="text-sm text-slate-500">POS Assigned</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totalPosAssigned}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm text-emerald-700">Deployed</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-900">{totalDeployed}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-yellow-50 p-5 shadow-sm">
          <p className="text-sm text-amber-700">Yet To Deploy</p>
          <p className="mt-3 text-3xl font-semibold text-amber-900">{totalYetToDeploy}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">New Deployments Today</p>
            <p className="text-xl font-bold text-emerald-600">{newDeploymentsToday}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-lg">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending Exceptions</p>
            <p className="text-xl font-bold text-amber-600">{pendingExceptions}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Reconciliation</p>
            <p className="text-xl font-bold text-blue-600">
              {logs.length > 0 ? new Date(logs[0].performedAt).toLocaleDateString('en-NG') : 'Never'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart records={filteredRecords} bgClass="bg-gradient-to-br from-emerald-50 to-white" />
        <LocationChart records={filteredRecords} bgClass="bg-gradient-to-br from-blue-50 to-white" />
        <CategoryChart records={filteredRecords} bgClass="bg-gradient-to-br from-purple-50 to-white" />
        <RegionChart records={filteredRecords} bgClass="bg-gradient-to-br from-amber-50 to-white" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="text-lg font-semibold mb-4">Recent Reconciliation Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Serial</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Field</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.slice(0, 10).map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(log.performedAt).toLocaleString('en-NG')}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.serialNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.actionType === 'FLAG_EXCEPTION' 
                        ? 'bg-red-100 text-red-700' 
                        : log.actionType === 'NEW_DEPLOYMENT'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{log.fieldChanged}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-md truncate">{log.notes}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No reconciliation activity yet. Run your first daily import.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
