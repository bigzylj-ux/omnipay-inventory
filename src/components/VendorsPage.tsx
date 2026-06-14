import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Edit3, Save, X, Upload, Download } from 'lucide-react';
import { getInventory, getVendors, saveVendors, updateVendor, deleteVendor, getVendorRepairs, addVendorRepairRecords, clearVendorRepairs, exportToExcel, updateInventoryRecord } from '../db';
import { InventoryRecord, Vendor, VendorRepairRecord, normalizeStatus } from '../types';
import { formatDate } from '../utils';
import * as XLSX from 'xlsx';

const defaultVendors: Vendor[] = [
  {
    id: 'raotech-technologies',
    name: 'Raotech Technologies Ltd',
    email: null,
    phone: null,
    address: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'blessed-light-technologies',
    name: 'Blessed Light Technologies',
    email: null,
    phone: null,
    address: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kunle-global',
    name: 'Kunle Global',
    email: null,
    phone: null,
    address: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialVendorForm = { name: '', email: '', phone: '', address: '' };

export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [vendorForm, setVendorForm] = useState(initialVendorForm);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [repairRecords, setRepairRecords] = useState<VendorRepairRecord[]>([]);
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const savedVendors = await getVendors();
      if (savedVendors.length === 0) {
        await saveVendors(defaultVendors);
        setVendors(defaultVendors);
      } else {
        setVendors(savedVendors);
      }
      setRepairRecords(await getVendorRepairs());
      const inventory = await getInventory();
      setInventoryRecords(inventory);
    };
    load();
  }, []);

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === selectedVendorId) || null,
    [vendors, selectedVendorId]
  );

  const selectedVendorRepairRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const records = selectedVendor
      ? repairRecords.filter((record) => record.vendorId === selectedVendor.id)
      : repairRecords;

    if (!search) return records;

    return records.filter((record) => {
      return (
        record.vendorName.toLowerCase().includes(search) ||
        record.serialNumber.toLowerCase().includes(search) ||
        record.faults.join(' ').toLowerCase().includes(search) ||
        (record.sourceFileName || '').toLowerCase().includes(search)
      );
    });
  }, [repairRecords, selectedVendor, searchTerm]);

  const repairInventoryRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const repairs = inventoryRecords.filter((record) => {
      const status = normalizeStatus(record.status);
      return status === 'Under Repair' || status === 'Faulty';
    });

    if (!term) return repairs;

    return repairs.filter((record) => {
      return (
        record.deviceSerialNo?.toLowerCase().includes(term) ||
        record.terminalId?.toLowerCase().includes(term) ||
        record.merchantName?.toLowerCase().includes(term) ||
        record.fault?.toLowerCase().includes(term) ||
        record.location?.toLowerCase().includes(term)
      );
    });
  }, [inventoryRecords, searchTerm]);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleSelectVendor = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setEditingVendorId(null);
    setVendorForm(initialVendorForm);
    setUploadMessage(null);
  };

  const handleChange = (key: keyof typeof initialVendorForm, value: string) => {
    setVendorForm((current) => ({ ...current, [key]: value }));
  };

  const handleAddVendor = async () => {
    const trimmedName = vendorForm.name.trim();
    if (!trimmedName) {
      setUploadMessage('Vendor name is required.');
      return;
    }

    const id = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const now = new Date().toISOString();
    const newVendor: Vendor = {
      id: `${id}-${now.slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmedName,
      email: vendorForm.email.trim() || null,
      phone: vendorForm.phone.trim() || null,
      address: vendorForm.address.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...vendors, newVendor];
    await saveVendors(updated);
    setVendors(updated);
    setVendorForm(initialVendorForm);
    showToast('success', 'Vendor added successfully.');
  };

  const handleEditVendor = async () => {
    if (!editingVendorId) return;
    const trimmedName = vendorForm.name.trim();
    if (!trimmedName) {
      setUploadMessage('Vendor name is required.');
      return;
    }

    const vendor = vendors.find((v) => v.id === editingVendorId);
    if (!vendor) return;

    const updatedVendor: Vendor = {
      ...vendor,
      name: trimmedName,
      email: vendorForm.email.trim() || null,
      phone: vendorForm.phone.trim() || null,
      address: vendorForm.address.trim() || null,
      updatedAt: new Date().toISOString(),
    };

    await updateVendor(updatedVendor);
    const updated = vendors.map((v) => (v.id === updatedVendor.id ? updatedVendor : v));
    setVendors(updated);
    setSelectedVendorId(updatedVendor.id);
    setEditingVendorId(null);
    setVendorForm(initialVendorForm);
    showToast('success', 'Vendor updated successfully.');
  };

  const handleStartEdit = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);
    setSelectedVendorId(vendor.id);
    setVendorForm({
      name: vendor.name,
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
    });
    setUploadMessage(null);
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!window.confirm('Delete this vendor?')) return;
    await deleteVendor(vendorId);
    const updated = vendors.filter((vendor) => vendor.id !== vendorId);
    setVendors(updated);
    if (selectedVendorId === vendorId) {
      setSelectedVendorId(null);
    }
    showToast('info', 'Vendor deleted successfully.');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedVendor) return;

    setUploadMessage('Parsing file...');
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1, raw: false });

        if (rows.length === 0) {
          setUploadMessage('Uploaded file is empty.');
          return;
        }

        const header = rows[0].map((cell: any) => String(cell || '').trim().toLowerCase());
        const serialIndex = header.findIndex((key: string) => key.includes('serial'));
        const costIndex = header.findIndex((key: string) => key.includes('cost'));
        const faultIndices = header
          .map((key: string, index: number) => ({ key, index }))
          .filter((item: { key: string; index: number }) => item.key.includes('fault'))
          .map((item: { key: string; index: number }) => item.index);

        if (serialIndex === -1 || faultIndices.length === 0 || costIndex === -1) {
          setUploadMessage('File must include Serial Number, at least one Fault column, and Cost column.');
          return;
        }

        const newRecords: VendorRepairRecord[] = [];
        for (let i = 1; i < rows.length; i += 1) {
          const row = rows[i] as any[];
          const serial = String(row[serialIndex] || '').trim();
          if (!serial) continue;

          const faults = faultIndices
            .map((index: number) => String(row[index] || '').trim())
            .filter(Boolean);
          const costCell = String(row[costIndex] || '').replace(/[^0-9.\-]/g, '').trim();
          const cost = Number(costCell) || 0;
          if (faults.length === 0 || cost <= 0) continue;

          const record: VendorRepairRecord = {
            id: `${selectedVendor.id}-${serial}-${i}-${Math.random().toString(36).slice(2, 8)}`,
            vendorId: selectedVendor.id,
            vendorName: selectedVendor.name,
            serialNumber: serial,
            faults,
            faultCosts: [cost],
            totalCost: cost,
            sourceFileName: file.name,
            uploadedAt: new Date().toISOString(),
            notes: `Imported for ${selectedVendor.name}`,
          };
          newRecords.push(record);
        }

        if (newRecords.length === 0) {
          setUploadMessage('No valid vendor repair rows were found in the uploaded file.');
          return;
        }

        await addVendorRepairRecords(newRecords);
        setRepairRecords(await getVendorRepairs());
        setUploadMessage(null);
        showToast('success', `Imported ${newRecords.length} repair rows for ${selectedVendor.name}.`);
      } catch (error) {
        console.error(error);
        setUploadMessage('Unable to parse the uploaded file.');
        showToast('error', 'Unable to parse the uploaded file. Check your file format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportRepairs = () => {
    const exportData = repairRecords.map((record) => ({
      Vendor: record.vendorName,
      'Serial Number': record.serialNumber,
      Faults: record.faults.join(', '),
      'Total Cost': record.totalCost,
      'Uploaded At': formatDate(record.uploadedAt),
      'Source File': record.sourceFileName || '-',
    }));
    exportToExcel(exportData, `Vendor_Repairs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleInventoryStatusChange = async (record: InventoryRecord, newStatus: string) => {
    const updatedRecord: InventoryRecord = {
      ...record,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    await updateInventoryRecord(updatedRecord);
    setInventoryRecords((current) =>
      current.map((item) => (item.id === record.id ? updatedRecord : item))
    );
    showToast('success', `Status updated for ${record.deviceSerialNo} to ${newStatus}.`);
  };

  const handleResetRepairs = async () => {
    if (!window.confirm('Clear all imported repair records?')) return;
    await clearVendorRepairs();
    setRepairRecords([]);
    setUploadMessage(null);
    showToast('info', 'Vendor repair history cleared.');
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 w-[320px] rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className={`mt-1 h-2.5 w-2.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-sky-500'}`} />
            <div>
              <p className="text-sm font-semibold text-slate-900 capitalize">{toast.type}</p>
              <p className="mt-1 text-sm text-slate-600">{toast.text}</p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">POS Vendor Management</h2>
            <p className="text-sm text-slate-500 mt-1">
              Manage repair vendors, upload their POS fault files, and track repair totals per terminal.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportRepairs}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Download className="w-4 h-4" />
              Export Repair History
            </button>
            <button
              onClick={handleResetRepairs}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Trash2 className="w-4 h-4" />
              Clear Repair Records
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Vendors</h3>
              <span className="text-xs text-slate-500">{vendors.length} vendors</span>
            </div>
            <div className="space-y-3">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => handleSelectVendor(vendor.id)}
                  className={`cursor-pointer rounded-2xl border px-4 py-3 transition ${
                    selectedVendorId === vendor.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{vendor.name}</p>
                      <p className="text-xs text-slate-500">
                        {vendor.email || 'No email'} • {vendor.phone || 'No phone'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(vendor);
                        }}
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVendor(vendor.id);
                        }}
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{editingVendorId ? 'Edit Vendor' : 'Add Vendor'}</h3>
                <p className="text-sm text-slate-500">Update contact details for both new and existing vendors.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                <Plus className="w-3.5 h-3.5" />
                Fault-Based Repair Costs
              </span>
            </div>

            <div className="space-y-4">
              <label className="block text-sm text-slate-600">
                Vendor Name
                <input
                  value={vendorForm.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-emerald-500"
                  placeholder="e.g. Raotech Technologies Ltd"
                />
              </label>

              <label className="block text-sm text-slate-600">
                Email Address
                <input
                  value={vendorForm.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-emerald-500"
                  placeholder="Email"
                  type="email"
                />
              </label>

              <label className="block text-sm text-slate-600">
                Phone Number
                <input
                  value={vendorForm.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-emerald-500"
                  placeholder="Phone"
                />
              </label>

              <label className="block text-sm text-slate-600">
                Business Address
                <textarea
                  value={vendorForm.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-emerald-500"
                  rows={3}
                  placeholder="Business address"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={editingVendorId ? handleEditVendor : handleAddVendor}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  {editingVendorId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingVendorId ? 'Save Changes' : 'Add Vendor'}
                </button>

                {editingVendorId && (
                  <button
                    onClick={() => {
                      setEditingVendorId(null);
                      setVendorForm(initialVendorForm);
                      setUploadMessage(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {uploadMessage && (
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {uploadMessage}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Vendor Repair Upload</h3>
                <p className="text-sm text-slate-500">Upload the Excel sheet from the selected vendor.</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.15em] text-slate-600">
                Fault-based cost report
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700">Search Vendor Repair & Inventory</label>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by serial, vendor, faults, location..."
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  {selectedVendor
                    ? `Selected vendor: ${selectedVendor.name}`
                    : 'Select a vendor from the list to import a repair file.'}
                </p>

                <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-center">
                  <Upload className="mx-auto mb-4 h-10 w-10 text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-900">Upload Excel file</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Your file should include Serial Number, Fault columns, and Cost per line.
                  </p>
                  <label className="mt-4 inline-flex cursor-pointer items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                    Browse file
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Upload Template</p>
                  <p className="mt-2">Use a file with at least:</p>
                  <ul className="mt-3 space-y-2 text-slate-600">
                    <li>• Serial Number</li>
                    <li>• Fault1, Fault2, ...</li>
                    <li>• Cost</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Historical repair totals</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{repairRecords.length}</p>
                  <p className="text-sm text-slate-500">Imported fault rows across all vendors.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Repair History</h3>
                <p className="text-sm text-slate-500">Review imported fault costs by vendor and serial number.</p>
              </div>
              <div className="text-xs text-slate-500">Most recent first</div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Vendor</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Serial</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Faults</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Total Cost</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Uploaded</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedVendorRepairRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No matching repair rows found.
                      </td>
                    </tr>
                  ) : (
                    [...selectedVendorRepairRecords]
                      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                      .slice(0, 20)
                      .map((repair) => (
                        <tr key={repair.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-700">{repair.vendorName}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{repair.serialNumber}</td>
                          <td className="px-4 py-3 text-slate-600 max-w-[240px] truncate">{repair.faults.join(', ')}</td>
                          <td className="px-4 py-3 text-slate-700">₦{repair.totalCost.toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(repair.uploadedAt)}</td>
                          <td className="px-4 py-3 text-slate-600">{repair.sourceFileName || '-'}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Faulty & Under Repair Inventory</h3>
                <p className="text-sm text-slate-500">Search and update inventory items that are under repair or faulty.</p>
              </div>
              <div className="text-xs text-slate-500">{repairInventoryRecords.length} items</div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Serial</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Merchant</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Fault</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {repairInventoryRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No matching inventory items found.
                      </td>
                    </tr>
                  ) : (
                    repairInventoryRecords.slice(0, 20).map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{record.deviceSerialNo}</td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{record.merchantName || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{normalizeStatus(record.status)}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate">{record.fault || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{record.location || '-'}</td>
                        <td className="px-4 py-3">
                          <select
                            value={normalizeStatus(record.status)}
                            onChange={(e) => handleInventoryStatusChange(record, e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500"
                          >
                            <option value="Under Repair">Under Repair</option>
                            <option value="Faulty">Faulty</option>
                            <option value="Repaired">Repaired</option>
                            <option value="Cannibalised">Cannibalised</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
