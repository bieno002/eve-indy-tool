import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  findTypeIdByName,
  findManyTypeIdsByName,
  listManufacturableBlueprints,
  getBlueprintMaterials,
  getAllManufacturingMaterials,
} from '../../electron/db/sde.js';

const SDE_PATH = path.join(process.cwd(), 'data', 'sde.sqlite');
const sdeMissing = !existsSync(SDE_PATH);

describe.skipIf(sdeMissing)('SDE integration (requires data/sde.sqlite)', () => {
  let db: DatabaseSync;

  beforeAll(() => {
    db = new DatabaseSync(SDE_PATH, { readOnly: true });
  });

  afterAll(() => {
    db?.close();
  });

  describe('findTypeIdByName', () => {
    it('returns 34 for Tritanium', () => {
      expect(findTypeIdByName(db, 'Tritanium')).toBe(34);
    });

    it('is case-insensitive', () => {
      expect(findTypeIdByName(db, 'tritanium')).toBe(34);
      expect(findTypeIdByName(db, 'TRITANIUM')).toBe(34);
    });

    it('returns null for an unknown item', () => {
      expect(findTypeIdByName(db, 'NotARealItemXYZ123')).toBeNull();
    });
  });

  describe('findManyTypeIdsByName', () => {
    it('resolves multiple names in one call', () => {
      const result = findManyTypeIdsByName(db, ['Tritanium', 'Pyerite']);
      expect(result.get('tritanium')).toBe(34);
      expect(result.get('pyerite')).toBe(35);
    });

    it('returns an empty map for an empty input', () => {
      expect(findManyTypeIdsByName(db, [])).toEqual(new Map());
    });

    it('silently omits names that do not exist', () => {
      const result = findManyTypeIdsByName(db, ['Tritanium', 'NotReal']);
      expect(result.size).toBe(1);
      expect(result.has('tritanium')).toBe(true);
    });
  });

  describe('listManufacturableBlueprints', () => {
    it('returns a non-empty array', () => {
      const blueprints = listManufacturableBlueprints(db);
      expect(blueprints.length).toBeGreaterThan(0);
    });

    it('each entry has the expected shape', () => {
      const [first] = listManufacturableBlueprints(db);
      expect(first).toMatchObject({
        blueprintTypeID: expect.any(Number),
        productTypeID: expect.any(Number),
        productName: expect.any(String),
      });
    });

    it('Tritanium (a raw material) has no blueprint entry', () => {
      const blueprints = listManufacturableBlueprints(db);
      const tritaniumAsProduct = blueprints.find(b => b.productTypeID === 34);
      expect(tritaniumAsProduct).toBeUndefined();
    });

    it('excludes unpublished items such as NPC faction variants', () => {
      const blueprints = listManufacturableBlueprints(db);
      const npcVariant = blueprints.find(b => b.productName === 'InterBus Catalyst');
      expect(npcVariant).toBeUndefined();
    });
  });

  describe('getBlueprintMaterials', () => {
    it('returns materials with the expected shape', () => {
      const blueprints = listManufacturableBlueprints(db);
      const bp = blueprints.find(b => b.productName.toLowerCase().includes('rifter'));
      expect(bp).toBeDefined();
      if (!bp) return;

      const materials = getBlueprintMaterials(db, bp.blueprintTypeID);
      expect(materials.length).toBeGreaterThan(0);
      expect(materials[0]).toMatchObject({
        materialTypeID: expect.any(Number),
        materialName: expect.any(String),
        baseQuantity: expect.any(Number),
      });
    });

    it('returns an empty array for a blueprint ID that has no materials', () => {
      expect(getBlueprintMaterials(db, -1)).toEqual([]);
    });
  });

  describe('getAllManufacturingMaterials', () => {
    it('returns a large result set covering all manufacturing blueprints', () => {
      const rows = getAllManufacturingMaterials(db);
      expect(rows.length).toBeGreaterThan(1000);
    });

    it('each row has the expected shape', () => {
      const [first] = getAllManufacturingMaterials(db);
      expect(first).toMatchObject({
        blueprintTypeID: expect.any(Number),
        materialTypeID: expect.any(Number),
        materialName: expect.any(String),
        baseQuantity: expect.any(Number),
      });
    });
  });
});
