import { InventoryRecord, PortalRecord, ReconciliationLog, Vendor, VendorRepairRecord, normalizeStatus } from './types';

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

// Initialize IndexedDB
const initDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Inventory store
      if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
        const invStore = db.createObjectStore(STORES.INVENTORY, { keyPath: 'id' });
        invStore.createIndex('deviceSerialNo', 'deviceSerialNo', { unique: true });
      }

      // Logs store
      if (!db.objectStoreNames.contains(STORES.LOGS)) {
        const logStore = db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
        logStore.createIndex('batchId', 'batchId');
        logStore.createIndex('serialNumber', 'serialNumber');
      }

      // Batch metadata store
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

// Utility to run a transaction and wait for completion
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

// === BATCH COUNTER ===
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
        updateRequest.onerror = () => resolve(batchId); // Fallback, still return batch ID
      };
    });
  });
};

// === INVENTORY MASTER ===
export const getInventory = async (): Promise<InventoryRecord[]> => {
  return runTransaction('readonly', [STORES.INVENTORY], async (tx) => {
    const store = tx.objectStore(STORES.INVENTORY);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result || [];
        const normalized = result.map((record: InventoryRecord) => ({
          ...record,
          status: normalizeStatus(record.status),
        }));
        resolve(normalized);
      };
      request.onerror = () => {
        console.error('Failed to read inventory:', request.error);
        resolve([]);
      };
    });
  });
};

export const getInventoryBySerial = async (serial: string): Promise<InventoryRecord | undefined> => {
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

// === PORTAL RECORDS (PERSISTENT LOCAL STORAGE) ===
// Stored in IndexedDB so daily imports remain available after reload.
export const getPortalRecords = async (): Promise<PortalRecord[]> => {
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

// === RECONCILIATION LOGS ===
export const getLogs = async (): Promise<ReconciliationLog[]> => {
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

    // Keep only last 500 logs (cleanup)
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

// === UTILITIES ===
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

// === EXPORT TO EXCEL ===
export const exportToExcel = (data: any[], filename: string): void => {
  import('xlsx').then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, filename);
  });
};

// === STORAGE INFO ===
export const getStorageInfo = async (): Promise<{ message: string }> => {
  const inv = await getInventory();
  const logs = await getLogs();
  const portal = await getPortalRecords();
  return {
    message: `IndexedDB: ${inv.length} inventory records, ${logs.length} logs, ${portal.length} portal records.`,
  };
};
