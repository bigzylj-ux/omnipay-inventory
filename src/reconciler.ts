import { InventoryRecord, PortalRecord, ReconciliationLog, ReconciliationResult, normalizeStatus } from './types';
import { getInventory, updateInventoryRecord, generateId, getBatchId, addLogs } from './db';

export const reconcileBatch = async (
  portalRecords: PortalRecord[],
  onProgress?: (progress: number) => void
): Promise<ReconciliationResult> => {
  console.log(`[Reconciliation] Starting with ${portalRecords.length} portal records`);

  const batchId = await getBatchId();
  const inventory = await getInventory();
  const inventoryMap = new Map(inventory.map((r) => [r.deviceSerialNo, r]));

  const logs: ReconciliationLog[] = [];
  let updated = 0;
  let newDeployments = 0;
  let exceptions = 0;
  let noChange = 0;

  const total = portalRecords.length;
  const now = new Date().toISOString();

  // Step 1: Validate and process each portal record
  for (let i = 0; i < total; i++) {
    try {
      const portal = portalRecords[i];

      // Progress callback every 100 records
      if (i % 100 === 0 && onProgress) {
        onProgress(Math.floor((i / total) * 80)); // 80% for processing
      }

      // Validate portal record has required field
      if (!portal.serialNumber) {
        console.warn(`[Reconciliation] Skipping portal record ${i}: no serialNumber`);
        exceptions++;
        continue;
      }

      // Look up in inventory
      const master = inventoryMap.get(portal.serialNumber);

      if (!master) {
        // Serial not found in master inventory
        logs.push({
          id: generateId(),
          batchId,
          serialNumber: portal.serialNumber,
          actionType: 'FLAG_EXCEPTION',
          fieldChanged: 'SERIAL_NOT_FOUND',
          oldValue: null,
          newValue: null,
          performedBy: 'SYSTEM_AUTO',
          performedAt: now,
          notes: `EXC-001: Serial not in master inventory. Portal TID: ${portal.terminalId || 'N/A'}`,
        });
        exceptions++;
        continue;
      }

      // Process record: check for updates
      const updates: Partial<InventoryRecord> = {};
      const recordLogs: ReconciliationLog[] = [];
      let recordChanged = false;

      const portalHasTerminal = Boolean(portal.terminalId?.trim());
      const portalHasMerchant = Boolean(portal.businessName?.trim());
      const portalHasPhone = Boolean(portal.phoneNumber?.trim());
      const portalHasFullDeploymentData = portalHasTerminal && portalHasMerchant && portalHasPhone;
      const desiredStatus = portalHasFullDeploymentData ? 'Deployed' : 'Yet To Deploy';
      const portalAssignmentDate = portal.updatedAt || now;

      const updateStatus = () => {
        if (normalizeStatus(master.status) !== desiredStatus) {
          updates.status = desiredStatus;
          if (desiredStatus === 'Deployed') {
            updates.terminalIdAssignedAt = portalAssignmentDate;
          }
          recordLogs.push({
            id: generateId(),
            batchId,
            serialNumber: portal.serialNumber,
            actionType: 'STATUS_CHANGE',
            fieldChanged: 'status',
            oldValue: master.status,
            newValue: desiredStatus,
            performedBy: 'SYSTEM_AUTO',
            performedAt: now,
            notes: desiredStatus === 'Deployed'
              ? 'Auto-promoted to Deployed due to full portal deployment data'
              : 'Auto-demoted to Yet To Deploy due to missing portal deployment data',
          });

          if (desiredStatus === 'Deployed') {
            logs.push({
              id: generateId(),
              batchId,
              serialNumber: portal.serialNumber,
              actionType: 'NEW_DEPLOYMENT',
              fieldChanged: 'status',
              oldValue: master.status,
              newValue: 'Deployed',
              performedBy: 'SYSTEM_AUTO',
              performedAt: now,
              notes: 'New deployment from portal record',
            });
            newDeployments++;
          }

          recordChanged = true;
        }
      };

      // Case 1: Portal has TerminalID and master doesn't — assign it
      if (portal.terminalId && !master.terminalId) {
        updates.terminalId = portal.terminalId;
        if (portal.transactingTid) {
          updates.transactingTid = portal.transactingTid;
        }
        if (portal.updatedAt) {
          updates.dateMapped = portal.updatedAt;
        }
        updates.terminalIdAssignedAt = portalAssignmentDate;
        recordLogs.push({
          id: generateId(),
          batchId,
          serialNumber: portal.serialNumber,
          actionType: 'UPDATE_TID',
          fieldChanged: 'terminalId',
          oldValue: null,
          newValue: portal.terminalId,
          performedBy: 'SYSTEM_AUTO',
          performedAt: now,
          notes: 'Auto-assigned TerminalID from portal',
        });

        if (portal.businessName) {
          updates.merchantName = portal.businessName;
          recordLogs.push({
            id: generateId(),
            batchId,
            serialNumber: portal.serialNumber,
            actionType: 'UPDATE_MERCHANT',
            fieldChanged: 'merchantName',
            oldValue: master.merchantName || null,
            newValue: portal.businessName,
            performedBy: 'SYSTEM_AUTO',
            performedAt: now,
            notes: 'Auto-updated merchant name from portal',
          });
        }

        if (portal.phoneNumber) {
          updates.phoneNo = portal.phoneNumber;
          recordLogs.push({
            id: generateId(),
            batchId,
            serialNumber: portal.serialNumber,
            actionType: 'UPDATE_MERCHANT',
            fieldChanged: 'phoneNo',
            oldValue: master.phoneNo || null,
            newValue: portal.phoneNumber,
            performedBy: 'SYSTEM_AUTO',
            performedAt: now,
            notes: 'Auto-updated phone from portal',
          });
        }

        if (portal.updatedAt && portal.updatedAt !== master.dateMapped) {
          updates.dateMapped = portal.updatedAt;
          recordLogs.push({
            id: generateId(),
            batchId,
            serialNumber: portal.serialNumber,
            actionType: 'STATUS_CHANGE',
            fieldChanged: 'dateMapped',
            oldValue: master.dateMapped || null,
            newValue: portal.updatedAt,
            performedBy: 'SYSTEM_AUTO',
            performedAt: now,
            notes: 'Updated mapped date from portal Updated At',
          });
          recordChanged = true;
        }

        updateStatus();
        recordChanged = true;
      }
      // Case 2: TerminalID mismatch — flag as exception
      else if (portal.terminalId && master.terminalId && portal.terminalId !== master.terminalId) {
        logs.push({
          id: generateId(),
          batchId,
          serialNumber: portal.serialNumber,
          actionType: 'FLAG_EXCEPTION',
          fieldChanged: 'terminalId',
          oldValue: master.terminalId,
          newValue: portal.terminalId,
          performedBy: 'SYSTEM_AUTO',
          performedAt: now,
          notes: `EXC-003: TerminalID mismatch. Master: ${master.terminalId}, Portal: ${portal.terminalId}`,
        });
        exceptions++;
        continue;
      }
      // Case 3: IDs match — update other fields if different
      else if (portal.terminalId && master.terminalId === portal.terminalId) {
        if (portal.transactingTid && portal.transactingTid !== master.transactingTid) {
          updates.transactingTid = portal.transactingTid;
          recordLogs.push({
            id: generateId(),
            batchId,
            serialNumber: portal.serialNumber,
            actionType: 'UPDATE_TID',
            fieldChanged: 'transactingTid',
            oldValue: master.transactingTid || null,
            newValue: portal.transactingTid,
            performedBy: 'SYSTEM_AUTO',
            performedAt: now,
            notes: 'Updated Transacting TID from portal',
          });
          recordChanged = true;
        }

        if (portal.businessName && portal.businessName !== master.merchantName) {
          updates.merchantName = portal.businessName;
          recordLogs.push({
            id: generateId(),
            batchId,
            serialNumber: portal.serialNumber,
            actionType: 'UPDATE_MERCHANT',
            fieldChanged: 'merchantName',
            oldValue: master.merchantName || null,
            newValue: portal.businessName,
            performedBy: 'SYSTEM_AUTO',
            performedAt: now,
            notes: 'Updated merchant name from portal',
          });
          recordChanged = true;
        }

        if (portal.phoneNumber && portal.phoneNumber !== master.phoneNo) {
          updates.phoneNo = portal.phoneNumber;
          recordLogs.push({
            id: generateId(),
            batchId,
            serialNumber: portal.serialNumber,
            actionType: 'UPDATE_MERCHANT',
            fieldChanged: 'phoneNo',
            oldValue: master.phoneNo || null,
            newValue: portal.phoneNumber,
            performedBy: 'SYSTEM_AUTO',
            performedAt: now,
            notes: 'Updated phone from portal',
          });
          recordChanged = true;
        }

        if (portal.updatedAt && portal.updatedAt !== master.dateMapped) {
          updates.dateMapped = portal.updatedAt;
          recordLogs.push({
            id: generateId(),
            batchId,
            serialNumber: portal.serialNumber,
            actionType: 'STATUS_CHANGE',
            fieldChanged: 'dateMapped',
            oldValue: master.dateMapped || null,
            newValue: portal.updatedAt,
            performedBy: 'SYSTEM_AUTO',
            performedAt: now,
            notes: 'Updated mapped date from portal Updated At',
          });
          recordChanged = true;
        }
      }

      // Persist changes
      if (recordChanged) {
        const updatedRecord: InventoryRecord = {
          ...master,
          ...updates,
          updatedAt: now,
          lastReconciledAt: now,
        };
        await updateInventoryRecord(updatedRecord);
        logs.push(...recordLogs);
        updated++;
      } else {
        noChange++;
      }
    } catch (err: any) {
      console.error(`[Reconciliation] Error at index ${i}:`, err);
      logs.push({
        id: generateId(),
        batchId,
        serialNumber: `ERROR-${i}`,
        actionType: 'FLAG_EXCEPTION',
        fieldChanged: 'RECONCILE_ERROR',
        oldValue: null,
        newValue: null,
        performedBy: 'SYSTEM_AUTO',
        performedAt: now,
        notes: `EXC-999: ${err?.message || String(err)}`,
      });
      exceptions++;
    }
  }

  // Step 2: Check for orphaned deployed records
  if (onProgress) onProgress(85);
  const portalSerials = new Set(portalRecords.map((p) => p.serialNumber));
  for (const master of inventory) {
    if (!portalSerials.has(master.deviceSerialNo) && (master.status === 'Mapped' || master.status === 'Deployed')) {
      logs.push({
        id: generateId(),
        batchId,
        serialNumber: master.deviceSerialNo,
        actionType: 'FLAG_EXCEPTION',
        fieldChanged: 'PORTAL_ABSENCE',
        oldValue: master.status,
        newValue: null,
        performedBy: 'SYSTEM_AUTO',
        performedAt: now,
        notes: `EXC-002: Deployed terminal not in portal DB — possible retrieval/retirement`,
      });
      exceptions++;
    }
  }

  // Step 3: Save logs
  if (onProgress) onProgress(90);
  await addLogs(logs);

  if (onProgress) onProgress(100);
  console.log(`[Reconciliation] Complete. Updated: ${updated}, New: ${newDeployments}, Exceptions: ${exceptions}, No Change: ${noChange}`);

  return { updated, newDeployments, exceptions, noChange, logs };
};

export const standardizeStatus = (excelStatus: string): string => {
  const map: Record<string, string> = {
    'In Store (Iddo)': 'In Stock',
    Mapped: 'Deployed',
    'Not Mapped': 'Yet To Deploy',
    Test: 'Test Terminal',
    Faulty: 'Faulty',
  };
  return map[excelStatus] || excelStatus;
};
