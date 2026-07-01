import { InventoryRecord, PortalRecord, ReconciliationLog, Vendor, VendorRepairRecord, normalizeStatus } from './types';
import { hasSupabaseConfig, supabase } from './lib/supabaseClient';

const DB_NAME = 'omnipay-inventory-db';
const DB_VERSION = 1;

const STORES = {
  INVENTORY: 'inventory',
  LOGS: 'reconciliation_logs',
  BATCH_META: 'batch_metadata',
  VENDORS: 'vendors',
  VENDOR_REPAIRS: 'vendor_repairs',
  PORTAL: 'portal_records',
};

const remoteEnabled = hasSupabaseConfig && Boolean(supabase);
const SUPABASE_PAGE_SIZE = 1000;

const fetchAllSupabaseRows = async <T>(
  table: string,
  orderColumn: string,
  ascending = true
): Promise<T[]> => {
  if (!remoteEnabled || !supabase) {
    return [];
  }

  const allRows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderColumn, { ascending })
      .range(from, from + SUPABASE_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    allRows.push(...(data as T[]));

    if (data.length < SUPABASE_PAGE_SIZE) {
      break;
    }

    from += SUPABASE_PAGE_SIZE;
  }

  return allRows;
};

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const toInventoryRow = (record: InventoryRecord) => ({
  id: record.id || generateId(),
  sn: Number(record.sn || 0),
  device_serial_no: record.deviceSerialNo || '',
  terminal_id: record.terminalId ?? null,
  transacting_tid: record.transactingTid ?? null,
  merchant_name: record.merchantName ?? null,
  phone_no: record.phoneNo ?? null,
  date_mapped: record.dateMapped ?? null,
  sim_serial: record.simSerial ?? null,
  date_dispatched: record.dateDispatched ?? null,
  custodian: record.custodian ?? null,
  pickup_staff: record.pickupStaff ?? null,
  redispatch_mfc: record.redispatchMfc ?? null,
  location: record.location ?? null,
  status: normalizeStatus(record.status),
  fault: record.fault ?? null,
  category: record.category ?? null,
  manager: record.manager ?? null,
  region: record.region ?? null,
  terminal_id_assigned_at: record.terminalIdAssignedAt ?? null,
  created_at: record.createdAt || new Date().toISOString(),
  updated_at: record.updatedAt || new Date().toISOString(),
  last_reconciled_at: record.lastReconciledAt ?? null,
});

const fromInventoryRow = (row: any): InventoryRecord => ({
  id: row.id || generateId(),
  sn: Number(row.sn || 0),
  deviceSerialNo: row.device_serial_no || '',
  terminalId: row.terminal_id ?? null,
  transactingTid: row.transacting_tid ?? null,
  merchantName: row.merchant_name ?? null,
  phoneNo: row.phone_no ?? null,
  dateMapped: row.date_mapped ?? null,
  simSerial: row.sim_serial ?? null,
  dateDispatched: row.date_dispatched ?? null,
  custodian: row.custodian ?? null,
  pickupStaff: row.pickup_staff ?? null,
  redispatchMfc: row.redispatch_mfc ?? null,
  location: row.location ?? null,
  status: normalizeStatus(row.status),
  fault: row.fault ?? null,
  category: row.category ?? null,
  manager: row.manager ?? null,
  region: row.region ?? null,
  terminalIdAssignedAt: row.terminal_id_assigned_at ?? null,
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at || new Date().toISOString(),
  lastReconciledAt: row.last_reconciled_at ?? null,
});

const toPortalRow = (record: PortalRecord) => ({
  id: record.id || generateId(),
  batch_id: record.batchId,
  serial_number: record.serialNumber,
  terminal_id: record.terminalId ?? null,
  business_name: record.businessName ?? null,
  phone_number: record.phoneNumber ?? null,
  updated_at: record.updatedAt ?? null,
  transacting_tid: record.transactingTid ?? null,
  imported_at: record.importedAt || new Date().toISOString(),
  match_status: record.matchStatus,
});

const fromPortalRow = (row: any): PortalRecord => ({
  id: row.id || generateId(),
  batchId: row.batch_id,
  serialNumber: row.serial_number,
  terminalId: row.terminal_id ?? null,
  businessName: row.business_name ?? null,
  phoneNumber: row.phone_number ?? null,
  updatedAt: row.updated_at ?? null,
  transactingTid: row.transacting_tid ?? null,
  importedAt: row.imported_at || new Date().toISOString(),
  matchStatus: row.match_status || 'PENDING',
});

const toVendorRow = (vendor: Vendor) => ({
  id: vendor.id || generateId(),
  name: vendor.name,
  email: vendor.email ?? null,
  phone: vendor.phone ?? null,
  address: vendor.address ?? null,
  created_at: vendor.createdAt || new Date().toISOString(),
  updated_at: vendor.updatedAt || new Date().toISOString(),
});

const fromVendorRow = (row: any): Vendor => ({
  id: row.id || generateId(),
  name: row.name,
  email: row.email ?? null,
  phone: row.phone ?? null,
  address: row.address ?? null,
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at || new Date().toISOString(),
});

const toVendorRepairRow = (record: VendorRepairRecord) => ({
  id: record.id || generateId(),
  vendor_id: record.vendorId,
  vendor_name: record.vendorName,
  serial_number: record.serialNumber,
  faults: record.faults,
  fault_costs: record.faultCosts,
  total_cost: record.totalCost,
  source_file_name: record.sourceFileName ?? null,
  uploaded_at: record.uploadedAt || new Date().toISOString(),
  notes: record.notes ?? null,
});

const fromVendorRepairRow = (row: any): VendorRepairRecord => ({
  id: row.id || generateId(),
  vendorId: row.vendor_id,
  vendorName: row.vendor_name,
  serialNumber: row.serial_number,
  faults: row.faults || [],
  faultCosts: row.fault_costs || [],
  totalCost: Number(row.total_cost || 0),
  sourceFileName: row.source_file_name ?? null,
  uploadedAt: row.uploaded_at || new Date().toISOString(),
  notes: row.notes ?? null,
});

const toLogRow = (log: ReconciliationLog) => ({
  id: log.id || generateId(),
  batch_id: log.batchId,
  serial_number: log.serialNumber,
  action_type: log.actionType,
  field_changed: log.fieldChanged,
  old_value: log.oldValue ?? null,
  new_value: log.newValue ?? null,
  performed_by: log.performedBy,
  performed_at: log.performedAt || new Date().toISOString(),
  notes: log.notes,
});

const fromLogRow = (row: any): ReconciliationLog => ({
  id: row.id || generateId(),
  batchId: row.batch_id,
  serialNumber: row.serial_number,
  actionType: row.action_type,
  fieldChanged: row.field_changed,
  oldValue: row.old_value ?? null,
  newValue: row.new_value ?? null,
  performedBy: row.performed_by,
  performedAt: row.performed_at || new Date().toISOString(),
  notes: row.notes,
});

const initDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
        const invStore = db.createObjectStore(STORES.INVENTORY, { keyPath: 'id' });
        invStore.createIndex('deviceSerialNo', 'deviceSerialNo', { unique: true });
      }
      if (!db.objectStoreNames.contains(STORES.LOGS)) {
        const logStore = db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
        logStore.createIndex('batchId', 'batchId');
        logStore.createIndex('serialNumber', 'serialNumber');
      }
      if (!db.objectStoreNames.contains(STORES.BATCH_META)) {
        db.createObjectStore(STORES.BATCH_META, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.VENDORS)) {
        const vendorStore = db.createObjectStore(STORES.VENDORS, { keyPath: 'id' });
        vendorStore.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.VENDOR_REPAIRS)) {
        const repairStore = db.createObjectStore(STORES.VENDOR_REPAIRS, { keyPath: 'id' });
        repairStore.createIndex('vendorId', 'vendorId', { unique: false });
        repairStore.createIndex('serialNumber', 'serialNumber', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.PORTAL)) {
        const portalStore = db.createObjectStore(STORES.PORTAL, { keyPath: 'id' });
        portalStore.createIndex('batchId', 'batchId', { unique: false });
        portalStore.createIndex('serialNumber', 'serialNumber', { unique: false });
      }
    };
  });
};

const runTransaction = async <T>(
  mode: 'readonly' | 'readwrite',
  stores: string[],
  fn: (tx: IDBTransaction) => Promise<T>
): Promise<T> => {
  const db = await initDB();
  const tx = db.transaction(stores, mode);

  let result: T;
  let hasResult = false;
  const resultPromise = fn(tx).then((res) => {
    result = res;
    hasResult = true;
    return res;
  });

  return new Promise<T>((resolve, reject) => {
    tx.oncomplete = () => {
      if (hasResult) {
        resolve(result);
      } else {
        resultPromise.then(resolve).catch(reject);
      }
    };
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
};

export const getBatchId = async (): Promise<string> => {
  return runTransaction('readwrite', [STORES.BATCH_META], async (tx) => {
    const store = tx.objectStore(STORES.BATCH_META);
    const request = store.get('batch_counter');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const data = request.result || { key: 'batch_counter', value: 0 };
        const newCounter = (data.value || 0) + 1;
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const batchId = `IMP-${date}-${String(newCounter).padStart(3, '0')}`;

        const updateRequest = store.put({ key: 'batch_counter', value: newCounter });
        updateRequest.onsuccess = () => resolve(batchId);
        updateRequest.onerror = () => resolve(batchId);
      };
    });
  });
};

export const getLastReconciliationInfo = async (): Promise<{ timestamp: string | null; date: string | null }> => {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('last_reconciliation');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.timestamp) {
          return {
            timestamp: parsed.timestamp,
            date: parsed.date || parsed.timestamp.split('T')[0],
          };
        }
      }
    } catch (err) {
      console.warn('Failed to read persisted reconciliation metadata from localStorage:', err);
    }
  }

  return runTransaction('readonly', [STORES.BATCH_META], async (tx) => {
    const store = tx.objectStore(STORES.BATCH_META);
    const request = store.get('last_reconciliation');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const data = request.result;
        if (!data?.value) {
          resolve({ timestamp: null, date: null });
          return;
        }

        resolve({
          timestamp: data.value.timestamp || null,
          date: data.value.date || null,
        });
      };
      request.onerror = () => {
        console.error('Failed to read last reconciliation metadata:', request.error);
        resolve({ timestamp: null, date: null });
      };
    });
  });
};

export const setLastReconciliationInfo = async (timestamp: string): Promise<void> => {
  const normalizedTimestamp = new Date(timestamp).toISOString();
  const normalizedDate = normalizedTimestamp.split('T')[0];

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      'last_reconciliation',
      JSON.stringify({ timestamp: normalizedTimestamp, date: normalizedDate })
    );
  }

  return runTransaction('readwrite', [STORES.BATCH_META], async (tx) => {
    const store = tx.objectStore(STORES.BATCH_META);
    return new Promise((resolve) => {
      const request = store.put({ key: 'last_reconciliation', value: { timestamp: normalizedTimestamp, date: normalizedDate } });
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to save last reconciliation metadata:', request.error);
        resolve();
      };
    });
  });
};

export const getInventory = async (): Promise<InventoryRecord[]> => {
  if (remoteEnabled && supabase) {
    try {
      const data = await fetchAllSupabaseRows<any>('inventory', 'sn', true);
      return data.map(fromInventoryRow).map((record) => ({
        ...record,
        status: normalizeStatus(record.status),
      }));
    } catch (err) {
      console.error('Failed to read inventory from Supabase:', err);
    }
  }

  return runTransaction('readonly', [STORES.INVENTORY], async (tx) => {
    const store = tx.objectStore(STORES.INVENTORY);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result || [];
        resolve(result.map((record: InventoryRecord) => ({
          ...record,
          status: normalizeStatus(record.status),
        })));
      };
      request.onerror = () => {
        console.error('Failed to read inventory:', request.error);
        resolve([]);
      };
    });
  });
};

export const getInventoryBySerial = async (serial: string): Promise<InventoryRecord | undefined> => {
  if (remoteEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('device_serial_no', serial)
        .maybeSingle();

      if (!error && data) {
        return fromInventoryRow(data);
      }
      if (error) {
        console.error('Failed to read inventory by serial from Supabase:', error);
      }
    } catch (err) {
      console.error('Unexpected error reading inventory by serial from Supabase:', err);
    }
  }

  return runTransaction('readonly', [STORES.INVENTORY], async (tx) => {
    const store = tx.objectStore(STORES.INVENTORY);
    const index = store.index('deviceSerialNo');
    const request = index.get(serial);

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error('Failed to read inventory by serial:', request.error);
        resolve(undefined);
      };
    });
  });
};

const chunkArray = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export const saveInventory = async (records: InventoryRecord[]): Promise<void> => {
  if (remoteEnabled && supabase) {
    try {
      const payload = records.map(toInventoryRow);
      const writeChunks = chunkArray(payload, 1000);
      for (const chunk of writeChunks) {
        const { error } = await supabase.from('inventory').upsert(chunk, { onConflict: 'device_serial_no' });
        if (error) {
          throw error;
        }
      }
      return;
    } catch (err) {
      console.error('Unexpected error saving inventory to Supabase:', err);
    }
  }

  const CHUNK_SIZE = 500;
  await runTransaction('readwrite', [STORES.INVENTORY], async (tx) => {
    const store = tx.objectStore(STORES.INVENTORY);
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  });

  const chunks = chunkArray(records, CHUNK_SIZE);
  for (const chunk of chunks) {
    await runTransaction('readwrite', [STORES.INVENTORY], async (tx) => {
      const store = tx.objectStore(STORES.INVENTORY);
      for (const record of chunk) {
        await new Promise<void>((resolve, reject) => {
          const request = store.put(record);
          request.onsuccess = () => resolve();
          request.onerror = () => {
            console.error('Failed to save inventory record:', record.deviceSerialNo, request.error);
            reject(request.error);
          };
        });
      }
    });
  }
};

export const getVendors = async (): Promise<Vendor[]> => {
  if (remoteEnabled && supabase) {
    try {
      const data = await fetchAllSupabaseRows<any>('vendors', 'created_at', false);
      return data.map(fromVendorRow);
    } catch (err) {
      console.error('Failed to read vendors from Supabase:', err);
    }
  }

  return runTransaction('readonly', [STORES.VENDORS], async (tx) => {
    const store = tx.objectStore(STORES.VENDORS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Failed to read vendors:', request.error);
        resolve([]);
      };
    });
  });
};

export const saveVendors = async (vendors: Vendor[]): Promise<void> => {
  if (remoteEnabled && supabase) {
    try {
      const payload = vendors.map(toVendorRow);
      const { error } = await supabase.from('vendors').upsert(payload, { onConflict: 'id' });
      if (!error) {
        return;
      }
      console.error('Failed to save vendors to Supabase:', error);
    } catch (err) {
      console.error('Unexpected error saving vendors to Supabase:', err);
    }
  }

  return runTransaction('readwrite', [STORES.VENDORS], async (tx) => {
    const store = tx.objectStore(STORES.VENDORS);
    await new Promise<void>((resolve) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => resolve();
    });

    for (const vendor of vendors) {
      await new Promise<void>((resolve) => {
        const request = store.put(vendor);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to save vendor:', vendor.name, request.error);
          resolve();
        };
      });
    }
  });
};

export const updateVendor = async (vendor: Vendor): Promise<void> => {
  if (remoteEnabled && supabase) {
    try {
      const payload = toVendorRow(vendor);
      const { error } = await supabase.from('vendors').upsert(payload, { onConflict: 'id' });
      if (!error) {
        return;
      }
      console.error('Failed to update vendor in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error updating vendor in Supabase:', err);
    }
  }

  return runTransaction('readwrite', [STORES.VENDORS], async (tx) => {
    const store = tx.objectStore(STORES.VENDORS);
    return new Promise((resolve) => {
      const request = store.put(vendor);
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to update vendor:', vendor.id, request.error);
        resolve();
      };
    });
  });
};

export const deleteVendor = async (id: string): Promise<void> => {
  if (remoteEnabled && supabase) {
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', id);
      if (!error) {
        return;
      }
      console.error('Failed to delete vendor in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error deleting vendor in Supabase:', err);
    }
  }

  return runTransaction('readwrite', [STORES.VENDORS], async (tx) => {
    const store = tx.objectStore(STORES.VENDORS);
    return new Promise((resolve) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to delete vendor:', id, request.error);
        resolve();
      };
    });
  });
};

export const getVendorRepairs = async (): Promise<VendorRepairRecord[]> => {
  if (remoteEnabled && supabase) {
    try {
      const data = await fetchAllSupabaseRows<any>('vendor_repairs', 'uploaded_at', false);
      return data.map(fromVendorRepairRow);
    } catch (err) {
      console.error('Failed to read vendor repairs from Supabase:', err);
    }
  }

  return runTransaction('readonly', [STORES.VENDOR_REPAIRS], async (tx) => {
    const store = tx.objectStore(STORES.VENDOR_REPAIRS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Failed to read vendor repairs:', request.error);
        resolve([]);
      };
    });
  });
};

export const addVendorRepairRecords = async (records: VendorRepairRecord[]): Promise<void> => {
  if (remoteEnabled && supabase) {
    try {
      const payload = records.map(toVendorRepairRow);
      const { error } = await supabase.from('vendor_repairs').upsert(payload, { onConflict: 'id' });
      if (!error) {
        return;
      }
      console.error('Failed to add vendor repair records to Supabase:', error);
    } catch (err) {
      console.error('Unexpected error adding vendor repairs to Supabase:', err);
    }
  }

  return runTransaction('readwrite', [STORES.VENDOR_REPAIRS], async (tx) => {
    const store = tx.objectStore(STORES.VENDOR_REPAIRS);
    for (const record of records) {
      await new Promise<void>((resolve) => {
        const request = store.add(record);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to add vendor repair record:', record.id, request.error);
          resolve();
        };
      });
    }
  });
};

export const clearVendorRepairs = async (): Promise<void> => {
  if (remoteEnabled && supabase) {
    try {
      const { error } = await supabase.from('vendor_repairs').delete().neq('id', '');
      if (!error) {
        return;
      }
      console.error('Failed to clear vendor repairs in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error clearing vendor repairs in Supabase:', err);
    }
  }

  return runTransaction('readwrite', [STORES.VENDOR_REPAIRS], async (tx) => {
    const store = tx.objectStore(STORES.VENDOR_REPAIRS);
    return new Promise((resolve) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to clear vendor repairs:', request.error);
        resolve();
      };
    });
  });
};

export const updateInventoryRecord = async (record: InventoryRecord): Promise<void> => {
  if (remoteEnabled && supabase) {
    try {
      const payload = toInventoryRow(record);
      const { error } = await supabase.from('inventory').upsert(payload, { onConflict: 'device_serial_no' });
      if (!error) {
        return;
      }
      console.error('Failed to update inventory record in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error updating inventory record in Supabase:', err);
    }
  }

  return runTransaction('readwrite', [STORES.INVENTORY], async (tx) => {
    const store = tx.objectStore(STORES.INVENTORY);
    const updated = { ...record, updatedAt: new Date().toISOString() };

    return new Promise((resolve) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to update inventory record:', record.id, request.error);
        resolve();
      };
    });
  });
};

export const addInventoryRecord = async (record: InventoryRecord): Promise<void> => {
  if (remoteEnabled && supabase) {
    try {
      const payload = toInventoryRow(record);
      const { error } = await supabase.from('inventory').upsert(payload, { onConflict: 'device_serial_no' });
      if (!error) {
        return;
      }
      console.error('Failed to add inventory record in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error adding inventory record in Supabase:', err);
    }
  }

  return runTransaction('readwrite', [STORES.INVENTORY], async (tx) => {
    const store = tx.objectStore(STORES.INVENTORY);
    return new Promise((resolve) => {
      const request = store.add(record);
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to add inventory record:', record.id, request.error);
        resolve();
      };
    });
  });
};

export const getPortalRecords = async (): Promise<PortalRecord[]> => {
  if (remoteEnabled && supabase) {
    try {
      const data = await fetchAllSupabaseRows<any>('portal_records', 'imported_at', false);
      return data.map(fromPortalRow);
    } catch (err) {
      console.error('Failed to read portal records from Supabase:', err);
    }
  }

  return runTransaction('readonly', [STORES.PORTAL], async (tx) => {
    const store = tx.objectStore(STORES.PORTAL);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Failed to read portal records:', request.error);
        resolve([]);
      };
    });
  });
};

export const savePortalRecords = async (records: PortalRecord[]): Promise<void> => {
  if (remoteEnabled && supabase) {
    try {
      const payload = records.map(toPortalRow);
      const writeChunks = chunkArray(payload, 1000);
      for (const chunk of writeChunks) {
        const { error } = await supabase.from('portal_records').upsert(chunk, { onConflict: 'id' });
        if (error) {
          throw error;
        }
      }
      return;
    } catch (err) {
      console.error('Unexpected error saving portal records to Supabase:', err);
    }
  }

  const CHUNK_SIZE = 500;
  await runTransaction('readwrite', [STORES.PORTAL], async (tx) => {
    const store = tx.objectStore(STORES.PORTAL);
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  });

  const chunks = chunkArray(records, CHUNK_SIZE);
  for (const chunk of chunks) {
    await runTransaction('readwrite', [STORES.PORTAL], async (tx) => {
      const store = tx.objectStore(STORES.PORTAL);
      for (const record of chunk) {
        await new Promise<void>((resolve, reject) => {
          const request = store.put(record);
          request.onsuccess = () => resolve();
          request.onerror = () => {
            console.error('Failed to save portal record:', record.serialNumber, request.error);
            reject(request.error);
          };
        });
      }
    });
  }
};

export const clearPortalRecords = async (): Promise<void> => {
  if (remoteEnabled && supabase) {
    try {
      const { error } = await supabase.from('portal_records').delete().neq('id', '');
      if (!error) {
        return;
      }
      console.error('Failed to clear portal records in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error clearing portal records in Supabase:', err);
    }
  }

  return runTransaction('readwrite', [STORES.PORTAL], async (tx) => {
    const store = tx.objectStore(STORES.PORTAL);
    return new Promise((resolve) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to clear portal records:', request.error);
        resolve();
      };
    });
  });
};

export const getLogs = async (): Promise<ReconciliationLog[]> => {
  if (remoteEnabled && supabase) {
    try {
      const data = await fetchAllSupabaseRows<any>('reconciliation_logs', 'performed_at', false);
      return data.map(fromLogRow);
    } catch (err) {
      console.error('Failed to read logs from Supabase:', err);
    }
  }

  return runTransaction('readonly', [STORES.LOGS], async (tx) => {
    const store = tx.objectStore(STORES.LOGS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Failed to read logs:', request.error);
        resolve([]);
      };
    });
  });
};

export const addLogs = async (logs: ReconciliationLog[]): Promise<void> => {
  if (remoteEnabled && supabase) {
    try {
      const payload = logs.map(toLogRow);
      const writeChunks = chunkArray(payload, 1000);
      for (const chunk of writeChunks) {
        const { error } = await supabase.from('reconciliation_logs').upsert(chunk, { onConflict: 'id' });
        if (error) {
          throw error;
        }
      }
      return;
    } catch (err) {
      console.error('Unexpected error adding logs to Supabase:', err);
    }
  }

  return runTransaction('readwrite', [STORES.LOGS], async (tx) => {
    const store = tx.objectStore(STORES.LOGS);
    for (const log of logs) {
      await new Promise<void>((resolve) => {
        const request = store.add(log);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to add log:', log.id, request.error);
          resolve();
        };
      });
    }

    const allRequest = store.getAll();
    allRequest.onsuccess = () => {
      const all = allRequest.result;
      if (all.length > 500) {
        const toDelete = all.slice(0, all.length - 500);
        for (const log of toDelete) {
          const deleteRequest = store.delete(log.id);
          deleteRequest.onerror = () =>
            console.error('Failed to delete old log:', log.id, deleteRequest.error);
        }
      }
    };
  });
};

export const clearLogs = async (): Promise<void> => {
  if (remoteEnabled && supabase) {
    try {
      const { error } = await supabase.from('reconciliation_logs').delete().neq('id', '');
      if (!error) {
        return;
      }
      console.error('Failed to clear logs in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error clearing logs in Supabase:', err);
    }
  }

  return runTransaction('readwrite', [STORES.LOGS], async (tx) => {
    const store = tx.objectStore(STORES.LOGS);
    return new Promise((resolve) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to clear logs:', request.error);
        resolve();
      };
    });
  });
};

export const clearAllData = async (): Promise<void> => {
  return new Promise((resolve) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    deleteRequest.onsuccess = () => {
      console.log('All data cleared');
      resolve();
    };
    deleteRequest.onerror = () => {
      console.error('Failed to clear all data:', deleteRequest.error);
      resolve();
    };
  });
};

export const exportToExcel = (data: any[], filename: string): void => {
  import('xlsx').then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, filename);
  });
};

export const getStorageInfo = async (): Promise<{ message: string }> => {
  const inv = await getInventory();
  const logs = await getLogs();
  const portal = await getPortalRecords();
  return {
    message: `${remoteEnabled ? 'Supabase' : 'IndexedDB'}: ${inv.length} inventory records, ${logs.length} logs, ${portal.length} portal records.`,
  };
};
