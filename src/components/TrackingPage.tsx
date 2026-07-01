import React, { useState } from 'react';
import { getInventoryBySerial, getLogs, addLogs, generateId } from '../db';
import { InventoryRecord, ReconciliationLog } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from './LoadingState';

export const TrackingPage: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [record, setRecord] = useState<InventoryRecord | null>(null);
  const [history, setHistory] = useState<ReconciliationLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [eventType, setEventType] = useState<ReconciliationLog['actionType']>('STATUS_CHANGE');
  const [fieldChanged, setFieldChanged] = useState('');
  const [previousValue, setPreviousValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [notes, setNotes] = useState('');
  const [performedBy, setPerformedBy] = useState('');

  const buildInitialTimeline = (inventory: InventoryRecord): ReconciliationLog[] => {
    const initialLog: ReconciliationLog = {
      id: `initial-${inventory.id}`,
      batchId: 'INITIAL',
      serialNumber: inventory.deviceSerialNo,
      actionType: 'INITIAL_REGISTRATION',
      fieldChanged: 'Record Created',
      oldValue: null,
      newValue: inventory.createdAt || null,
      performedBy: 'System',
      performedAt: inventory.createdAt || inventory.updatedAt || new Date().toISOString(),
      notes: 'Terminal record created in inventory.',
    };

    return [initialLog];
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const inv = await getInventoryBySerial(query.trim());
    const logs = await getLogs();
    const related = logs.filter(l => l.serialNumber === query.trim()).sort((a,b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
    setRecord(inv || null);
    setHistory(inv ? [...buildInitialTimeline(inv), ...related] : related as ReconciliationLog[]);
    setLoading(false);
  };

  const submitEvent = async () => {
    if (!query.trim()) return alert('Search a serial first');
    const id = generateId();
    const now = new Date().toISOString();
    const log: ReconciliationLog = {
      id,
      batchId: `TRACK-${now.split('T')[0].replace(/-/g, '')}`,
      serialNumber: query.trim(),
      actionType: eventType,
      fieldChanged: fieldChanged || '-',
      oldValue: previousValue || null,
      newValue: newValue || null,
      performedBy: performedBy || user?.email || 'manual',
      performedAt: now,
      notes: notes || '',
    };
    await addLogs([log]);
    const logs = await getLogs();
    const related = logs.filter(l => l.serialNumber === query.trim()).sort((a,b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
    setHistory(record ? [...buildInitialTimeline(record), ...related] : related);
    setFieldChanged('');
    setPreviousValue('');
    setNewValue('');
    setNotes('');
    setPerformedBy('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="text-lg font-semibold mb-3">Tracking</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-sm text-gray-600">Serial Number</label>
            <input value={query} onChange={e => setQuery(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" placeholder="Enter device serial number" />
          </div>
          <div>
            <button onClick={runSearch} className="px-4 py-2 bg-emerald-600 text-white rounded">Search</button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading audit trail" subLabel="Gathering the full lifecycle history for this terminal." />
      ) : record ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h4 className="font-semibold mb-3">Current Record</h4>
            <p className="text-sm text-gray-500">Serial: <span className="font-mono">{record.deviceSerialNo}</span></p>
            <p className="text-sm text-gray-500">Terminal ID: {record.terminalId || '-'}</p>
            <p className="text-sm text-gray-500">Merchant: {record.merchantName || '-'}</p>
            <p className="text-sm text-gray-500">Category: {record.category || '-'}</p>
            <p className="text-sm text-gray-500">Status: {record.status}</p>
            <p className="text-sm text-gray-500">Last Updated: {new Date(record.updatedAt).toLocaleString()}</p>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h4 className="font-semibold mb-3">Add Tracking Event</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <label className="block">
                  <span className="block text-xs text-gray-600">Event Type</span>
                  <select value={eventType} onChange={e => setEventType(e.target.value as ReconciliationLog['actionType'])} className="mt-1 block w-full rounded border px-3 py-2">
                    <option value="STATUS_CHANGE">Status Change</option>
                    <option value="CATEGORY_CHANGE">Category Change</option>
                    <option value="INVENTORY_EDIT">Inventory Edit</option>
                    <option value="SIM_REPLACEMENT">SIM Replacement</option>
                    <option value="DISPATCH">Dispatch</option>
                    <option value="DEPLOYMENT">Deployment</option>
                    <option value="REPAIR">Repair</option>
                    <option value="FAULT_REPORTED">Fault Reported</option>
                    <option value="RETRIEVAL">Retrieval</option>
                    <option value="RETURN">Return</option>
                    <option value="NEW_DEPLOYMENT">New Deployment</option>
                    <option value="UPDATE_TID">Update TID</option>
                    <option value="UPDATE_MERCHANT">Update Merchant</option>
                    <option value="FLAG_EXCEPTION">Flag Exception</option>
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs text-gray-600">Field Changed</span>
                  <input value={fieldChanged} onChange={e => setFieldChanged(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
                </label>
                <label className="block">
                  <span className="block text-xs text-gray-600">Previous Value</span>
                  <input value={previousValue} onChange={e => setPreviousValue(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
                </label>
                <label className="block">
                  <span className="block text-xs text-gray-600">New Value</span>
                  <input value={newValue} onChange={e => setNewValue(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
                </label>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs text-gray-600">Performed By</span>
                  <input value={performedBy} onChange={e => setPerformedBy(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
                </label>
                <label className="block">
                  <span className="block text-xs text-gray-600">Notes</span>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full mt-1 border rounded px-3 py-2" rows={3} />
                </label>
              </div>
              <div className="mt-3">
                <button onClick={submitEvent} className="px-4 py-2 bg-emerald-600 text-white rounded">Add Event</button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h4 className="font-semibold mb-3">History</h4>
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">No history found for this serial.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2">When</th>
                        <th className="text-left px-4 py-2">Action</th>
                        <th className="text-left px-4 py-2">Field</th>
                        <th className="text-left px-4 py-2">Previous</th>
                        <th className="text-left px-4 py-2">New</th>
                        <th className="text-left px-4 py-2">By</th>
                        <th className="text-left px-4 py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {history.map(h => (
                        <tr key={h.id}>
                          <td className="px-4 py-2 text-gray-600">{new Date(h.performedAt).toLocaleString()}</td>
                          <td className="px-4 py-2 font-medium">{h.actionType}</td>
                          <td className="px-4 py-2">{h.fieldChanged}</td>
                          <td className="px-4 py-2 text-gray-600">{h.oldValue || '-'}</td>
                          <td className="px-4 py-2 text-gray-800">{h.newValue || '-'}</td>
                          <td className="px-4 py-2">{h.performedBy}</td>
                          <td className="px-4 py-2 text-gray-500">{h.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-8">Search for a serial to view tracking history.</div>
      )}
    </div>
  );
};

export default TrackingPage;
