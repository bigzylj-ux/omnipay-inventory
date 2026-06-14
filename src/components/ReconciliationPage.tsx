import React, { useEffect, useState } from 'react';
import { getInventory, getPortalRecords, getLogs, clearPortalRecords, exportToExcel } from '../db';
import { InventoryRecord, PortalRecord, ReconciliationLog, ReconciliationResult } from '../types';
import { reconcileBatch } from '../reconciler';
import { Play, AlertTriangle, CheckCircle, RotateCcw, FileText, Loader2 } from 'lucide-react';

export const ReconciliationPage: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [logs, setLogs] = useState<ReconciliationLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [portalRecords, setPortalRecords] = useState<PortalRecord[]>([]);
  const [masterInventoryCount, setMasterInventoryCount] = useState<number>(0);

  const loadRecords = React.useCallback(async () => {
    const [records, inventory] = await Promise.all([getPortalRecords(), getInventory()]);
    setPortalRecords(records);
    setMasterInventoryCount(inventory.length);
  }, []);

  useEffect(() => {
    loadRecords();

    window.addEventListener('focus', loadRecords);
    return () => window.removeEventListener('focus', loadRecords);
  }, [loadRecords]);

  const runReconciliation = async () => {
    if (masterInventoryCount === 0) {
      alert('Master inventory is missing. Please import your master inventory before running reconciliation.');
      return;
    }
    if (portalRecords.length === 0) {
      alert('No portal records found. Please import the DB sheet first.');
      return;
    }

    setRunning(true);
    setProgress(0);
    setResult(null);
    setLogs([]);

    setTimeout(async () => {
      try {
        const reconciliationResult = await reconcileBatch(portalRecords, (p) => setProgress(p));
        setResult(reconciliationResult);
        setLogs(reconciliationResult.logs);
        setProgress(100);

        if (reconciliationResult.exceptions > 0) {
          const exceptionLogs = reconciliationResult.logs.filter((l) => l.actionType === 'FLAG_EXCEPTION').slice(0, 5);
          console.error('Reconciliation completed with exceptions:', exceptionLogs);
          alert(
            `Reconciliation completed with ${reconciliationResult.exceptions} exceptions.\n\nUpdated: ${reconciliationResult.updated}, New: ${reconciliationResult.newDeployments}, No Change: ${reconciliationResult.noChange}`
          );
        } else {
          alert(
            `Reconciliation successful!\n\nUpdated: ${reconciliationResult.updated}, New: ${reconciliationResult.newDeployments}, No Change: ${reconciliationResult.noChange}`
          );
        }
      } catch (err: any) {
        console.error('Reconciliation error:', err);
        alert(`Reconciliation error: ${err?.message || err}`);
      } finally {
        setRunning(false);
      }
    }, 100);
  };

  const exportLogs = async () => {
    const allLogs = await getLogs();
    const lastLogs = allLogs.slice(-100);
    const exportData = lastLogs.map((l) => ({
      Date: new Date(l.performedAt).toLocaleString('en-NG'),
      Batch: l.batchId,
      Serial: l.serialNumber,
      Action: l.actionType,
      Field: l.fieldChanged,
      OldValue: l.oldValue || '-',
      NewValue: l.newValue || '-',
      PerformedBy: l.performedBy,
      Notes: l.notes,
    }));

    exportToExcel(exportData, `Reconciliation_Log_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold">Daily Reconciliation</h2>
            <p className="text-gray-600 mt-1">
              Match portal DB records against inventory master and auto-update assignments.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <FileText className="w-4 h-4" />
              Export Logs
            </button>
            <button
              onClick={loadRecords}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${portalRecords.length > 0 ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <span className="font-medium">
                Portal Records Stored Locally: {portalRecords.length.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Master Inventory Loaded: {masterInventoryCount.toLocaleString()}
              </span>
              <button
                onClick={async () => {
                  await clearPortalRecords();
                  setPortalRecords([]);
                }}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Clear & Re-import
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Portal records are persisted in local IndexedDB after import. Reloading the page keeps the last imported portal DB until you clear or re-import.
          </p>
          {masterInventoryCount === 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No master inventory is loaded. Import your master inventory first before running reconciliation.
            </div>
          )}
        </div>

        <button
          onClick={runReconciliation}
          disabled={running || portalRecords.length === 0}
          className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
            running || portalRecords.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg'
          }`}
        >
          {running ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
          {running ? `Running Reconciliation... ${progress}%` : 'Run Daily Reconciliation'}
        </button>

        {running && progress > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
              <p className="text-3xl font-bold text-blue-600">{result.updated.toLocaleString()}</p>
              <p className="text-sm text-blue-700 mt-1">Records Updated</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-200">
              <p className="text-3xl font-bold text-emerald-600">{result.newDeployments.toLocaleString()}</p>
              <p className="text-sm text-emerald-700 mt-1">New Deployments</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-200">
              <p className="text-3xl font-bold text-amber-600">{result.noChange.toLocaleString()}</p>
              <p className="text-sm text-amber-700 mt-1">No Change</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
              <p className="text-3xl font-bold text-red-600">{result.exceptions.toLocaleString()}</p>
              <p className="text-sm text-red-700 mt-1">Exceptions Flagged</p>
            </div>
          </div>
        )}
      </div>

      {logs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Reconciliation Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Serial Number</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium">Field</th>
                  <th className="text-left px-4 py-3 font-medium">Old Value</th>
                  <th className="text-left px-4 py-3 font-medium">New Value</th>
                  <th className="text-left px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{log.serialNumber}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          log.actionType === 'FLAG_EXCEPTION'
                            ? 'bg-red-100 text-red-700'
                            : log.actionType === 'NEW_DEPLOYMENT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {log.actionType === 'FLAG_EXCEPTION' && <AlertTriangle className="w-3 h-3" />}
                        {log.actionType === 'NEW_DEPLOYMENT' && <CheckCircle className="w-3 h-3" />}
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.fieldChanged}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{log.oldValue || '-'}</td>
                    <td className="px-4 py-3 text-gray-800 max-w-xs truncate font-medium">{log.newValue || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-md">{log.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
