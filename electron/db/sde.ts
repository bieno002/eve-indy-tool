import type Database from 'better-sqlite3';

export type ManufacturableBlueprint = {
  blueprintTypeID: number;
  productTypeID: number;
  productName: string;
};

export type BlueprintMaterial = {
  materialTypeID: number;
  materialName: string;
  baseQuantity: number;
};

// ── Type lookups ──────────────────────────────────────────────────────────────

export function findTypeIdByName(db: Database.Database, name: string): number | null {
  const row = db
    .prepare('SELECT typeID FROM invTypes WHERE LOWER(typeName) = LOWER(?)')
    .get(name) as { typeID: number } | undefined;
  return row?.typeID ?? null;
}

export function findManyTypeIdsByName(
  db: Database.Database,
  names: string[],
): Map<string, number> {
  if (names.length === 0) return new Map();

  const placeholders = names.map(() => '?').join(', ');
  const lowerNames = names.map(n => n.toLowerCase());
  const rows = db
    .prepare(
      `SELECT typeID, typeName FROM invTypes WHERE LOWER(typeName) IN (${placeholders})`,
    )
    .all(...lowerNames) as Array<{ typeID: number; typeName: string }>;

  const result = new Map<string, number>();
  for (const row of rows) {
    result.set(row.typeName.toLowerCase(), row.typeID);
  }
  return result;
}

// ── Blueprint queries ─────────────────────────────────────────────────────────

export function listManufacturableBlueprints(
  db: Database.Database,
): ManufacturableBlueprint[] {
  return db
    .prepare(
      `SELECT iap.typeID AS blueprintTypeID, iap.productTypeID, it.typeName AS productName
       FROM   industryActivityProducts iap
       JOIN   invTypes it ON it.typeID = iap.productTypeID
       WHERE  iap.activityID = 1`,
    )
    .all() as ManufacturableBlueprint[];
}

export function getBlueprintMaterials(
  db: Database.Database,
  blueprintTypeID: number,
): BlueprintMaterial[] {
  return db
    .prepare(
      `SELECT iam.materialTypeID, it.typeName AS materialName, iam.quantity AS baseQuantity
       FROM   industryActivityMaterials iam
       JOIN   invTypes it ON it.typeID = iam.materialTypeID
       WHERE  iam.typeID = ? AND iam.activityID = 1`,
    )
    .all(blueprintTypeID) as BlueprintMaterial[];
}

export type MaterialRow = {
  blueprintTypeID: number;
  materialTypeID: number;
  materialName: string;
  baseQuantity: number;
};

export function getAllManufacturingMaterials(db: Database.Database): MaterialRow[] {
  return db
    .prepare(
      `SELECT iam.typeID AS blueprintTypeID, iam.materialTypeID,
              it.typeName AS materialName, iam.quantity AS baseQuantity
       FROM   industryActivityMaterials iam
       JOIN   invTypes it ON it.typeID = iam.materialTypeID
       WHERE  iam.activityID = 1`,
    )
    .all() as MaterialRow[];
}
