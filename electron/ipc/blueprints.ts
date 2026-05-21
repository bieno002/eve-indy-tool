import { existsSync } from 'node:fs';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import {
  IPC_CHANNELS,
  type IpcMainLike,
  type SdeStatusResponse,
  type ComputeBuildablesRequest,
  type ComputeBuildablesResponse,
  type SdeProgressData,
} from './contract.js';
import { getDb, getSdePath } from '../db/client.js';
import { downloadSde } from './sdeDownload.js';
import {
  findManyTypeIdsByName,
  listManufacturableBlueprints,
  getAllManufacturingMaterials,
  type MaterialRow,
} from '../db/sde.js';
import { parseMaterials } from '../../shared/lib/materialParser.js';
import { computeBuildables, type Inventory } from '../../shared/lib/manufactureCalculator.js';

type BpWithMaterials = {
  blueprintTypeID: number;
  productTypeID: number;
  productName: string;
  meLevel: number;
  materials: MaterialRow[];
};

let blueprintCache: BpWithMaterials[] | null = null;

export function clearBlueprintCache(): void {
  blueprintCache = null;
}

function getBlueprintData(db: DatabaseSync): BpWithMaterials[] {
  if (blueprintCache) return blueprintCache;

  const materialRows = getAllManufacturingMaterials(db);
  const materialsByBp = new Map<number, MaterialRow[]>();
  for (const row of materialRows) {
    const bucket = materialsByBp.get(row.blueprintTypeID);
    if (bucket) bucket.push(row);
    else materialsByBp.set(row.blueprintTypeID, [row]);
  }

  blueprintCache = listManufacturableBlueprints(db)
    .filter(bp => materialsByBp.has(bp.blueprintTypeID))
    .map(bp => ({
      blueprintTypeID: bp.blueprintTypeID,
      productTypeID: bp.productTypeID,
      productName: bp.productName,
      meLevel: bp.meLevel,
      materials: materialsByBp.get(bp.blueprintTypeID)!,
    }));

  return blueprintCache;
}

export function getSdeStatus(sdePath: string): SdeStatusResponse {
  return existsSync(sdePath)
    ? { present: true, path: sdePath }
    : { present: false, path: null };
}

export function computeBuildablesFromDb(
  db: DatabaseSync,
  rawPaste: string,
): ComputeBuildablesResponse {
  const { items: parsedMaterials, errors: parseErrors } = parseMaterials(rawPaste);

  const typeIdMap = findManyTypeIdsByName(db, parsedMaterials.map(m => m.name));
  const inventory: Inventory = new Map();
  for (const mat of parsedMaterials) {
    const typeID = typeIdMap.get(mat.name.toLowerCase());
    if (typeID !== undefined) inventory.set(typeID, mat.quantity);
  }

  if (inventory.size === 0) return { items: [], parseErrors };

  return { items: computeBuildables(inventory, getBlueprintData(db)), parseErrors };
}

export function registerBlueprintHandlers(ipcMainInstance: IpcMainLike): void {
  ipcMainInstance.handle(
    IPC_CHANNELS.SDE_STATUS,
    (): SdeStatusResponse => getSdeStatus(getSdePath()),
  );

  ipcMainInstance.handle(IPC_CHANNELS.SDE_DOWNLOAD, (event) => {
    const sender = (event as { sender: { send(ch: string, d: SdeProgressData): void } }).sender;
    const dataDir = path.dirname(getSdePath());
    void downloadSde(dataDir, (progress) => {
      sender.send(IPC_CHANNELS.SDE_PROGRESS, progress);
    }).catch((err: unknown) => {
      sender.send(IPC_CHANNELS.SDE_PROGRESS, {
        percent: 0,
        done: true,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  });

  ipcMainInstance.handle(
    IPC_CHANNELS.BLUEPRINTS_COMPUTE,
    (_event: unknown, request: ComputeBuildablesRequest): ComputeBuildablesResponse =>
      computeBuildablesFromDb(getDb(), request.rawPaste),
  );
}
