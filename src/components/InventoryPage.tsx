import React, { useState, useMemo, useEffect } from 'react';
import { getInventory, exportToExcel, updateInventoryRecord } from '../db';
import { InventoryRecord, normalizeStatus, SYSTEM_STATUSES } from '../types';
import { formatDate, getStatusColor } from '../utils';
import { Search, Download, ChevronDown, ChevronUp, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from './LoadingState';

export const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const isApprovedAdmin = user?.role === 'admin' && user?.approved === true;
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 100;
  const [sortField, setSortField] = useState<keyof InventoryRecord>('sn');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<InventoryRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<InventoryRecord>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadRecords = async () => {
      const data = await getInventory();
      const normalized = data.map(record => ({
        ...record,
        status: normalizeStatus(record.status),
      }));
      setRecords(normalized);
      setLoading(false);
    };
    loadRecords();
  }, []);

  const statuses = useMemo(
    () => [...new Set([
      ...SYSTEM_STATUSES,
      ...records.map(r => normalizeStatus(r.status)),
    ].filter(Boolean))].sort() as string[],
    [records]
  );
  const locations = useMemo(() => [...new Set(records.map(r => r.location).filter(Boolean))] as string[], [records]);
  const categories = useMemo(() => [...new Set(records.map(r => r.category).filter(Boolean))] as string[], [records]);

  const filtered = useMemo(() => {
    let data = [...records];

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(r => 
        r.deviceSerialNo?.toLowerCase().includes(q) ||
        r.terminalId?.toLowerCase().includes(q) ||
        r.merchantName?.toLowerCase().includes(q) ||
        r.phoneNo?.toLowerCase().includes(q) ||
        r.custodian?.toLowerCase().includes(q) ||
        r.simSerial?.toLowerCase().includes(q)
      );
    }

    if (statusFilter) data = data.filter(r => normalizeStatus(r.status) === normalizeStatus(statusFilter));
    if (locationFilter) data = data.filter(r => r.location === locationFilter);
    if (categoryFilter) data = data.filter(r => r.category === categoryFilter);

    data.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return data;
  }, [records, search, statusFilter, locationFilter, categoryFilter, sortField, sortAsc]);

  // Reset to first page whenever filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, locationFilter, categoryFilter]);

  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, totalRecords);
  const pagedRecords = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field: keyof InventoryRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const exportData = () => {
    const exportRecords = filtered.map(r => ({
      SN: r.sn,
      'Device Serial No.': r.deviceSerialNo,
      'Terminal ID': r.terminalId,
      'Transacting TID': r.transactingTid,
      'Merchant Name': r.merchantName,
      'Phone No.': r.phoneNo,
      'Date Mapped': formatDate(r.dateMapped),
      'SIM Serial': r.simSerial,
      'Date Dispatched': formatDate(r.dateDispatched),
      Custodian: r.custodian,
      'Pickup Staff': r.pickupStaff,
      Location: r.location,
      Status: r.status,
      Fault: r.fault,
      Category: r.category,
      Manager: r.manager,
      Region: r.region,
    }));
    exportToExcel(exportRecords, `Inventory_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleEditClick = () => {
    if (selectedRecord && isApprovedAdmin) {
      setEditData(selectedRecord);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord || !editData.id || !isApprovedAdmin) return;
    setSaving(true);
    try {
      const normalizedStatus = normalizeStatus(editData.status || null);
      const updatedRecord: InventoryRecord = {
        ...selectedRecord,
        ...editData,
        status: normalizedStatus,
        updatedAt: new Date().toISOString(),
      };
      await updateInventoryRecord(updatedRecord);
      
      setRecords((prev) => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
      setSelectedRecord(updatedRecord);
      setIsEditing(false);
      setEditData({});
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Failed to save record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Serial, TerminalID, Merchant, Phone..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Locations</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-3">
          Showing {totalRecords === 0 ? 0 : startIndex} - {endIndex} of {records.length.toLocaleString()} records
        </p>
      </div>

      {loading ? (
        <LoadingState label="Loading inventory" subLabel="Preparing the latest terminal records and statuses." />
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 flex items-center justify-center">
          <div className="text-center text-gray-500">No inventory records found. Please import data first.</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: 'sn', label: 'SN' },
                  { key: 'deviceSerialNo', label: 'Device Serial' },
                  { key: 'terminalId', label: 'Terminal ID' },
                  { key: 'merchantName', label: 'Merchant' },
                  { key: 'phoneNo', label: 'Phone' },
                  { key: 'location', label: 'Location' },
                  { key: 'status', label: 'Status' },
                  { key: 'category', label: 'Category' },
                  { key: 'custodian', label: 'Custodian' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key as keyof InventoryRecord)}
                    className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortField === col.key && (
                        sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagedRecords.map(record => (
                <tr 
                  key={record.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedRecord(record)}
                >
                  <td className="px-4 py-3 text-gray-500">{record.sn}</td>
                  <td className="px-4 py-3 font-mono text-xs">{record.deviceSerialNo}</td>
                  <td className="px-4 py-3 text-gray-700">{record.terminalId || '-'}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{record.merchantName || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{record.phoneNo || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{record.location || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{record.category || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{record.custodian || '-'}</td>
                </tr>
              ))}
              {totalRecords === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    No records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
          {/* Pagination controls */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
      </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">Terminal Details</h3>
                  <p className="text-gray-500 font-mono text-sm mt-1">{selectedRecord.deviceSerialNo}</p>
                </div>
                <div className="flex gap-2">
                  {!isEditing && isApprovedAdmin && (
                    <button 
                      onClick={handleEditClick}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedRecord(null);
                      setIsEditing(false);
                      setEditData({});
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {!isEditing ? (
                [
                  { label: 'Serial Number', value: selectedRecord.deviceSerialNo },
                  { label: 'Terminal ID', value: selectedRecord.terminalId },
                  { label: 'Transacting TID', value: selectedRecord.transactingTid },
                  { label: 'Merchant Name', value: selectedRecord.merchantName },
                  { label: 'Phone Number', value: selectedRecord.phoneNo },
                  { label: 'SIM Serial', value: selectedRecord.simSerial },
                  { label: 'Date Mapped', value: formatDate(selectedRecord.dateMapped) },
                  { label: 'Date Dispatched', value: formatDate(selectedRecord.dateDispatched) },
                  { label: 'Location', value: selectedRecord.location },
                  { label: 'Status', value: selectedRecord.status },
                  { label: 'Category', value: selectedRecord.category },
                  { label: 'Fault', value: selectedRecord.fault },
                  { label: 'Custodian', value: selectedRecord.custodian },
                  { label: 'Pickup Staff', value: selectedRecord.pickupStaff },
                  { label: 'Manager', value: selectedRecord.manager },
                  { label: 'Region', value: selectedRecord.region },
                  { label: 'Last Updated', value: formatDate(selectedRecord.updatedAt) },
                  { label: 'Last Reconciled', value: formatDate(selectedRecord.lastReconciledAt) },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-gray-800">{item.value || '-'}</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">Merchant Name</label>
                    <input
                      type="text"
                      value={editData.merchantName || ''}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Terminal ID</label>
                    <input
                      type="text"
                      value={editData.terminalId || ''}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Transaction Terminal ID (TID)</label>
                    <input
                      type="text"
                      value={editData.transactingTid || ''}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">SIM Serial Number</label>
                    <input
                      type="text"
                      value={editData.simSerial || ''}
                      onChange={e => setEditData({...editData, simSerial: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Phone Number</label>
                    <input
                      type="text"
                      value={editData.phoneNo || ''}
                      onChange={e => setEditData({...editData, phoneNo: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Status</label>
                    <select
                      value={editData.status || ''}
                      onChange={e => setEditData({...editData, status: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select Status</option>
                      {SYSTEM_STATUSES.map(statusOption => (
                        <option key={statusOption} value={statusOption}>{statusOption}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Category</label>
                    <select
                      value={editData.category || ''}
                      onChange={e => setEditData({...editData, category: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(categoryOption => (
                        <option key={categoryOption} value={categoryOption}>{categoryOption}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Location</label>
                    <input
                      type="text"
                      value={editData.location || ''}
                      onChange={e => setEditData({...editData, location: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Custodian</label>
                    <input
                      type="text"
                      value={editData.custodian || ''}
                      onChange={e => setEditData({...editData, custodian: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Manager</label>
                    <input
                      type="text"
                      value={editData.manager || ''}
                      onChange={e => setEditData({...editData, manager: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Region</label>
                    <input
                      type="text"
                      value={editData.region || ''}
                      onChange={e => setEditData({...editData, region: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Fault</label>
                    <input
                      type="text"
                      value={editData.fault || ''}
                      onChange={e => setEditData({...editData, fault: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Pickup Staff</label>
                    <input
                      type="text"
                      value={editData.pickupStaff || ''}
                      onChange={e => setEditData({...editData, pickupStaff: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}
            </div>
            {isEditing && (
              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
