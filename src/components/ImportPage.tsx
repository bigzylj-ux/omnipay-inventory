import React, { useState, useCallback } from 'react';
import { getInventory, saveInventory, savePortalRecords, clearPortalRecords, generateId, getStorageInfo } from '../db';
import { InventoryRecord, PortalRecord, normalizeStatus } from '../types';
import { parseExcelDate } from '../utils';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Info, Database, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const MASTER_TEMPLATE_HEADERS = [
  'SN',
  'Device Serial No.',
  'TerminalID',
  'TransactingTid',
  'MerchantName',
  'PhoneNo',
  'DateMapped',
  'SimSerial',
  'DateDispatched',
  'Custodian',
  'PickupStaff',
  'RedispatchMfc',
  'Location',
  'Status',
  'Fault',
  'Category',
  'Manager',
  'Region',
];

const normalizeHeader = (value: any): string => {
  if (value == null) return '';
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
};

const headerIndex = (headers: any[]): Map<string, number> => {
  const map = new Map<string, number>();
  headers.forEach((value, index) => {
    const normalized = normalizeHeader(value);
    if (normalized) {
      map.set(normalized, index);
    }
  });
  return map;
};

const findHeaderRow = (rows: any[][], searchKeys: string[], maxRows = 10): number => {
  for (let i = 0; i < Math.min(maxRows, rows.length); i++) {
    const row = rows[i] || [];
    if (row.some((cell) => {
      const normalized = normalizeHeader(cell);
      return searchKeys.some((key) => normalized.includes(key));
    })) {
      return i;
    }
  }
  return 0;
};

const getColumn = (map: Map<string, number>, keys: string[], fallbackIndex: number): number => {
  for (const key of keys) {
    if (map.has(key)) return map.get(key)!;
  }
  return fallbackIndex;
};

export const ImportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'master' | 'portal'>('master');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>(null);
  const [importStats, setImportStats] = useState({ total: 0, new: 0, updated: 0, skipped: 0, deduped: 0 });

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'master' | 'portal') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = type === 'master' ? 'Data' : 'db';
        const worksheet = workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (type === 'master') {
          await processMasterImport(jsonData as any[][]);
        } else {
          await processPortalImport(jsonData as any[][]);
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: `Error reading file: ${err.message || err}` });
        setUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const processMasterImport = async (rows: any[][]) => {
    const headerRow = findHeaderRow(rows, ['device serial no', 'serial number', 'serial']);
    const headerCells = rows[headerRow] || [];
    const headerMap = headerIndex(headerCells);
    const dataRows = rows.slice(headerRow + 1);

    const records: InventoryRecord[] = [];
    const existing = await getInventory();
    const existingMap = new Map(existing.map((r) => [r.deviceSerialNo, r]));

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of dataRows) {
      const serialIndex = getColumn(headerMap, ['device serial no.', 'serial number', 'serial'], 1);
      const serial = String(row[serialIndex] || '').trim();
      if (!serial) continue;

      const now = new Date().toISOString();
      const record: InventoryRecord = {
        id: existingMap.get(serial)?.id || generateId(),
        sn: Number(row[getColumn(headerMap, ['sn'], 0)]) || 0,
        deviceSerialNo: serial,
        terminalId: row[getColumn(headerMap, ['terminalid', 'terminal id'], 2)] ? String(row[getColumn(headerMap, ['terminalid', 'terminal id'], 2)]) : null,
        transactingTid: row[getColumn(headerMap, ['transactingtid', 'transacting tid'], 3)] ? String(row[getColumn(headerMap, ['transactingtid', 'transacting tid'], 3)]) : null,
        merchantName: row[getColumn(headerMap, ['merchantname', 'merchant name'], 4)] ? String(row[getColumn(headerMap, ['merchantname', 'merchant name'], 4)]) : null,
        phoneNo: row[getColumn(headerMap, ['phoneno', 'phone no', 'phone number'], 5)] ? String(row[getColumn(headerMap, ['phoneno', 'phone no', 'phone number'], 5)]) : null,
        dateMapped: parseExcelDate(row[getColumn(headerMap, ['datemapped', 'date mapped'], 6)]),
        simSerial: row[getColumn(headerMap, ['simserial', 'sim serial'], 7)] ? String(row[getColumn(headerMap, ['simserial', 'sim serial'], 7)]) : null,
        dateDispatched: parseExcelDate(row[getColumn(headerMap, ['datedispatched', 'date dispatched'], 8)]),
        custodian: row[getColumn(headerMap, ['custodian'], 9)] ? String(row[getColumn(headerMap, ['custodian'], 9)]) : null,
        pickupStaff: row[getColumn(headerMap, ['pickupstaff', 'pickup staff'], 10)] ? String(row[getColumn(headerMap, ['pickupstaff', 'pickup staff'], 10)]) : null,
        redispatchMfc: row[getColumn(headerMap, ['redispatchmfc', 'redispatch mfc'], 11)] ? String(row[getColumn(headerMap, ['redispatchmfc', 'redispatch mfc'], 11)]) : null,
        location: row[getColumn(headerMap, ['location'], 12)] ? String(row[getColumn(headerMap, ['location'], 12)]) : null,
        status: normalizeStatus(row[getColumn(headerMap, ['status'], 13)] ? String(row[getColumn(headerMap, ['status'], 13)]) : null),
        fault: row[getColumn(headerMap, ['fault'], 14)] ? String(row[getColumn(headerMap, ['fault'], 14)]) : null,
        category: row[getColumn(headerMap, ['category'], 15)] ? String(row[getColumn(headerMap, ['category'], 15)]) : null,
        manager: row[getColumn(headerMap, ['manager'], 16)] ? String(row[getColumn(headerMap, ['manager'], 16)]) : null,
        region: row[getColumn(headerMap, ['region'], 17)] ? String(row[getColumn(headerMap, ['region'], 17)]) : null,
        terminalIdAssignedAt: (row[getColumn(headerMap, ['terminalid', 'terminal id'], 2)] && !existingMap.get(serial)?.terminalId)
          ? now
          : existingMap.get(serial)?.terminalIdAssignedAt || null,
        createdAt: existingMap.get(serial)?.createdAt || now,
        updatedAt: now,
        lastReconciledAt: existingMap.get(serial)?.lastReconciledAt || null,
      };

      if (existingMap.has(serial)) {
        updatedCount++;
      } else {
        newCount++;
      }
      records.push(record);
    }

    if (records.length === 0) {
      setMessage({
        type: 'warning',
        text: 'No valid inventory records found in the uploaded file. Existing inventory has not been changed.',
      });
      setImportStats({ total: 0, new: 0, updated: 0, skipped: 0, deduped: 0 });
      setUploading(false);
      return;
    }

    await saveInventory(records);
    const storageInfo = await getStorageInfo();
    setImportStats({ total: records.length, new: newCount, updated: updatedCount, skipped: skippedCount, deduped: 0 });
    setPreview(records.slice(0, 5));
    setMessage({
      type: 'success',
      text: `Successfully imported ${records.length} records. New: ${newCount}, Updated: ${updatedCount}. ${storageInfo.message}`,
    });
    setUploading(false);
  };

  const downloadMasterTemplate = () => {
    const csvRows = [MASTER_TEMPLATE_HEADERS, MASTER_TEMPLATE_HEADERS.map(() => '')];
    const csvContent = csvRows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'omnipay-master-inventory-template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const processPortalImport = async (rows: any[][]) => {
    const headerRow = findHeaderRow(rows, ['serial number', 'device serial no', 'serial']);
    const dataRows = rows.slice(headerRow + 1);

    const batchId = `PORTAL-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;

    // Step 1: Parse all rows
    const allParsed: PortalRecord[] = [];
    const headerCells = rows[headerRow] || [];
    const headerMap = headerIndex(headerCells);

    for (const row of dataRows) {
      const serialIndex = getColumn(headerMap, ['serial number', 'device serial no.', 'serial'], 0);
      const serial = String(row[serialIndex] || '').trim();
      if (!serial) continue;

      const now = new Date().toISOString();
      allParsed.push({
        id: generateId(),
        batchId,
        serialNumber: serial,
        terminalId: row[getColumn(headerMap, ['terminalid', 'terminal id'], 1)] ? String(row[getColumn(headerMap, ['terminalid', 'terminal id'], 1)]) : null,
        businessName: row[getColumn(headerMap, ['businessname', 'business name'], 2)] ? String(row[getColumn(headerMap, ['businessname', 'business name'], 2)]) : null,
        phoneNumber: row[getColumn(headerMap, ['phonenumber', 'phone number', 'phone'], 3)] ? String(row[getColumn(headerMap, ['phonenumber', 'phone number', 'phone'], 3)]) : null,
        updatedAt: parseExcelDate(row[getColumn(headerMap, ['updatedat', 'updated at', 'date'], 4)]),
        transactingTid: row[getColumn(headerMap, ['transactingtid', 'transacting tid'], 5)] ? String(row[getColumn(headerMap, ['transactingtid', 'transacting tid'], 5)]) : null,
        importedAt: now,
        matchStatus: 'PENDING',
      });
    }

    // Step 2: Deduplicate by Serial Number — keep the one with most data
    const serialMap = new Map<string, PortalRecord>();
    for (const record of allParsed) {
      const existing = serialMap.get(record.serialNumber);
      if (!existing) {
        serialMap.set(record.serialNumber, record);
      } else {
        // Keep the record with more information (TerminalID > BusinessName > Phone)
        const existingScore = (existing.terminalId ? 4 : 0) + (existing.businessName ? 2 : 0) + (existing.phoneNumber ? 1 : 0);
        const newScore = (record.terminalId ? 4 : 0) + (record.businessName ? 2 : 0) + (record.phoneNumber ? 1 : 0);
        if (newScore > existingScore) {
          serialMap.set(record.serialNumber, record);
        }
      }
    }

    // Step 3: Filter — only keep records that have SOME meaningful data
    // (This removes the thousands of empty placeholder rows)
    const meaningfulRecords = Array.from(serialMap.values()).filter(r => 
      (r.terminalId && r.terminalId.trim() !== '') || 
      (r.businessName && r.businessName.trim() !== '') || 
      (r.phoneNumber && r.phoneNumber.trim() !== '') ||
      (r.transactingTid && r.transactingTid.trim() !== '')
    );

    if (allParsed.length === 0) {
      setMessage({
        type: 'warning',
        text: 'No rows were parsed from the portal file. Existing portal records have not been changed.',
      });
      setUploading(false);
      return;
    }

    const dedupedCount = allParsed.length - meaningfulRecords.length;

    if (meaningfulRecords.length === 0) {
      setMessage({
        type: 'warning',
        text: 'No meaningful portal records were found. Existing portal data has not been changed.',
      });
      setUploading(false);
      return;
    }

    // Step 4: Clear old portal batch and persist the latest cleaned portal records.
    await clearPortalRecords();
    await savePortalRecords(meaningfulRecords);

    // Check storage after save
    const storageInfo = await getStorageInfo();

    setImportStats({ 
      total: allParsed.length, 
      new: meaningfulRecords.length, 
      updated: 0, 
      skipped: 0, 
      deduped: dedupedCount 
    });
    setPreview(meaningfulRecords.slice(0, 5));

    if (meaningfulRecords.length === 0) {
      setMessage({ 
        type: 'warning', 
        text: `Parsed ${allParsed.length} rows but found 0 meaningful records. Check that your db sheet has TerminalID, Business Name, or Phone Number data.` 
      });
    } else {
      setMessage({ 
        type: 'success', 
        text: `Parsed ${allParsed.length} rows → Kept ${meaningfulRecords.length} unique meaningful records (${dedupedCount} duplicates/empty rows removed). ${storageInfo.message}` 
      });
    }
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Daily Data Import</h2>
        <p className="text-gray-600 mb-6">
          Upload your Excel files to update the inventory system. Import the <strong>Data</strong> sheet for the master inventory 
          and the <strong>DB</strong> sheet from the portal for daily reconciliation.
        </p>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('master')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'master' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Import Master Inventory (Data Sheet)
            </button>
            <button
              onClick={() => setActiveTab('portal')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'portal' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Import Portal DB (Daily Download)
            </button>
          </div>

          <button
            onClick={downloadMasterTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <Download className="w-4 h-4" />
            Download Master Inventory Template
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-400 transition-colors">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => handleFileUpload(e, activeTab)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {uploading ? 'Processing...' : 'Click to upload Excel file'}
            </p>
            <p className="text-sm text-gray-500">
              Supports .xlsx, .xls, .csv | Max 50MB
            </p>
          </label>
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
            message.type === 'error' ? 'bg-red-50 text-red-700' :
            message.type === 'warning' ? 'bg-amber-50 text-amber-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
             message.type === 'error' ? <AlertTriangle className="w-5 h-5" /> :
             message.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
             <Info className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {importStats.total > 0 && (
          <div className="mt-6 grid grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{importStats.total}</p>
              <p className="text-sm text-gray-500">Total Rows Parsed</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{importStats.new}</p>
              <p className="text-sm text-gray-500">Unique Records Kept</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{importStats.updated}</p>
              <p className="text-sm text-gray-500">Updated</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{importStats.deduped}</p>
              <p className="text-sm text-gray-500">Duplicates/Empty Removed</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{importStats.skipped}</p>
              <p className="text-sm text-gray-500">Skipped</p>
            </div>
          </div>
        )}

        {preview.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Preview (First 5 records)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(preview[0]).slice(0, 6).map(key => (
                      <th key={key} className="text-left px-3 py-2 font-medium text-gray-600">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {Object.values(row).slice(0, 6).map((val: any, i) => (
                        <td key={i} className="px-3 py-2 text-gray-700 truncate max-w-xs">
                          {val?.toString() || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Portal DB Import — How It Works
        </h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li><strong>Step 1:</strong> Parses ALL rows from your db sheet (including duplicates)</li>
          <li><strong>Step 2:</strong> Deduplicates by Serial Number — keeps the record with the most data</li>
          <li><strong>Step 3:</strong> Filters out empty rows (no TerminalID, no Business Name, no Phone)</li>
          <li><strong>Step 4:</strong> Stores only the meaningful records (~1,800 instead of 10,000)</li>
          <li><strong>Result:</strong> Fits easily in browser storage without quota errors</li>
        </ul>
      </div>

      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Import Instructions
        </h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li><strong>Master Inventory:</strong> Upload the Excel file containing your <em>Data</em> sheet with all current inventory records</li>
          <li><strong>Portal DB:</strong> Upload the daily portal download containing the <em>db</em> sheet with TerminalID assignments</li>
          <li>After importing both files, go to <strong>Reconciliation</strong> to run the automated matching engine</li>
          <li>The system will auto-update merchant info, TerminalIDs, and status based on portal data</li>
        </ul>
      </div>
    </div>
  );
};
