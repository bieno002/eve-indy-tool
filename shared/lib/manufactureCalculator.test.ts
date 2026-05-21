import { describe, it, expect } from 'vitest';
import {
  applyMe,
  computeBuildables,
  type BlueprintInput,
  type Inventory,
} from './manufactureCalculator.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function inv(entries: [number, number][]): Inventory {
  return new Map(entries);
}

function bp(
  id: number,
  name: string,
  materials: Array<[typeID: number, matName: string, baseQty: number]>,
  meLevel = 10,
): BlueprintInput {
  return {
    blueprintTypeID: id,
    productTypeID: id + 1000,
    productName: name,
    meLevel,
    materials: materials.map(([materialTypeID, materialName, baseQuantity]) => ({
      materialTypeID,
      materialName,
      baseQuantity,
    })),
  };
}

// ── applyMe ───────────────────────────────────────────────────────────────────

describe('applyMe', () => {
  describe('ME 10 (T1 max research)', () => {
    it('clamps to 1 for zero input', () => expect(applyMe(0, 10)).toBe(1));
    it('clamps to 1 for qty 1', () => expect(applyMe(1, 10)).toBe(1));
    it('returns 9 for qty 10', () => expect(applyMe(10, 10)).toBe(9));
    it('ceils fractional results — qty 11 → 10', () => expect(applyMe(11, 10)).toBe(10));
    it('handles large quantities', () => expect(applyMe(1_000_000, 10)).toBe(900_000));
  });

  describe('ME 2 (T2 default from invention)', () => {
    it('clamps to 1 for qty 1', () => expect(applyMe(1, 2)).toBe(1));
    it('returns 98 for qty 100', () => expect(applyMe(100, 2)).toBe(98));
    it('ceils fractional results — qty 50 → 49', () => expect(applyMe(50, 2)).toBe(49));
    it('handles large quantities', () => expect(applyMe(1_000_000, 2)).toBe(980_000));
  });
});

// ── computeBuildables ─────────────────────────────────────────────────────────

describe('computeBuildables', () => {
  describe('single-material blueprint', () => {
    it('returns the correct run count for an exact divisor', () => {
      const inventory = inv([[10, 90]]);
      const blueprint = bp(1, 'Widget', [[10, 'Iron', 100]]);
      const [result] = computeBuildables(inventory, [blueprint], { includeUnbuildable: true });
      // applyMe(100, 10) = 90; 90 / 90 = 1 run
      expect(result.possibleRuns).toBe(1);
    });

    it('floors partial runs', () => {
      const inventory = inv([[10, 200]]);
      const blueprint = bp(1, 'Widget', [[10, 'Iron', 100]]);
      const [result] = computeBuildables(inventory, [blueprint], { includeUnbuildable: true });
      // applyMe(100, 10) = 90; floor(200/90) = 2
      expect(result.possibleRuns).toBe(2);
    });

    it('returns possibleRuns 0 when inventory is empty', () => {
      const [result] = computeBuildables(inv([]), [bp(1, 'Widget', [[10, 'Iron', 100]])], {
        includeUnbuildable: true,
      });
      expect(result.possibleRuns).toBe(0);
    });
  });

  describe('multi-material blueprint', () => {
    it('identifies the bottleneck material', () => {
      const inventory = inv([
        [10, 900], // Iron:  applyMe(100, 10)=90 → 10 runs
        [20, 8],   // Silk:  applyMe(5, 10)=5   → 1 run  ← bottleneck
      ]);
      const blueprint = bp(1, 'Widget', [
        [10, 'Iron', 100],
        [20, 'Silk', 5],
      ]);
      const [result] = computeBuildables(inventory, [blueprint], { includeUnbuildable: true });
      expect(result.possibleRuns).toBe(1);
      expect(result.bottleneckMaterialTypeID).toBe(20);
    });

    it('returns possibleRuns limited by the scarcest material', () => {
      const inventory = inv([
        [10, 270], // applyMe(100, 10)=90 → 3 runs
        [20, 18],  // applyMe(10, 10)=9  → 2 runs  ← limits
        [30, 900], // applyMe(100, 10)=90 → 10 runs
      ]);
      const blueprint = bp(1, 'Gadget', [
        [10, 'Iron', 100],
        [20, 'Silk', 10],
        [30, 'Gel', 100],
      ]);
      const [result] = computeBuildables(inventory, [blueprint], { includeUnbuildable: true });
      expect(result.possibleRuns).toBe(2);
      expect(result.bottleneckMaterialTypeID).toBe(20);
    });
  });

  describe('missing materials', () => {
    it('returns possibleRuns 0 when a required material is absent', () => {
      const inventory = inv([[10, 900]]); // has Iron, missing Silk
      const blueprint = bp(1, 'Widget', [
        [10, 'Iron', 100],
        [20, 'Silk', 5],
      ]);
      const [result] = computeBuildables(inventory, [blueprint], { includeUnbuildable: true });
      expect(result.possibleRuns).toBe(0);
    });

    it('lists the missing material in shortfalls', () => {
      const inventory = inv([[10, 900]]);
      const blueprint = bp(1, 'Widget', [
        [10, 'Iron', 100],
        [20, 'Silk', 5],
      ]);
      const [result] = computeBuildables(inventory, [blueprint], { includeUnbuildable: true });
      const silkShortfall = result.shortfalls.find(s => s.materialTypeID === 20);
      expect(silkShortfall).toBeDefined();
      // applyMe(5, 10) = 5; need 5, have 0 → needForOneMore = 5
      expect(silkShortfall?.needForOneMore).toBe(5);
    });
  });

  describe('exact inventory', () => {
    it('shows a shortfall of exactly requiredPerRun when inventory is fully depleted', () => {
      // applyMe(100, 10) = 90; 3 runs = 270 used; need 90 more for run 4
      const inventory = inv([[10, 270]]);
      const blueprint = bp(1, 'Widget', [[10, 'Iron', 100]]);
      const [result] = computeBuildables(inventory, [blueprint], { includeUnbuildable: true });
      expect(result.possibleRuns).toBe(3);
      expect(result.shortfalls[0]?.needForOneMore).toBe(90);
    });

    it('calculates correct needForOneMore when partially stocked', () => {
      // applyMe(100, 10) = 90; have 200 → 2 runs, leftover 20
      // needForOneMore = 3*90 - 200 = 70
      const inventory = inv([[10, 200]]);
      const blueprint = bp(1, 'Widget', [[10, 'Iron', 100]]);
      const [result] = computeBuildables(inventory, [blueprint], { includeUnbuildable: true });
      expect(result.possibleRuns).toBe(2);
      expect(result.shortfalls[0]?.needForOneMore).toBe(70);
    });

    it('excludes non-bottleneck materials from shortfalls when they cover extra runs', () => {
      // Iron: applyMe(100, 10)=90, have=540 → 6 runs
      // Silk: applyMe(5, 10)=5,   have=25  → 5 runs (bottleneck)
      // possibleRuns=5; Iron needForOneMore = 6*90-540 = 0 → not a shortfall
      const inventory = inv([[10, 540], [20, 25]]);
      const blueprint = bp(1, 'Widget', [[10, 'Iron', 100], [20, 'Silk', 5]]);
      const [result] = computeBuildables(inventory, [blueprint], { includeUnbuildable: true });
      expect(result.possibleRuns).toBe(5);
      expect(result.shortfalls).toHaveLength(1);
      expect(result.shortfalls[0]?.materialTypeID).toBe(20);
    });
  });

  describe('perRunRequirements', () => {
    it('reflects ME10-adjusted quantities and current stock', () => {
      const inventory = inv([[10, 500]]);
      const blueprint = bp(1, 'Widget', [[10, 'Iron', 100]]);
      const [result] = computeBuildables(inventory, [blueprint], { includeUnbuildable: true });
      expect(result.perRunRequirements[0]).toEqual({
        materialTypeID: 10,
        materialName: 'Iron',
        requiredPerRun: 90, // applyMe(100, 10)
        have: 500,
      });
    });
  });

  describe('sorting', () => {
    it('sorts by possibleRuns descending', () => {
      const inventory = inv([
        [10, 90],  // enough for 1 run of Widget
        [20, 900], // enough for 10 runs of Gadget
      ]);
      const blueprints = [
        bp(1, 'Widget', [[10, 'Iron', 100]]),
        bp(2, 'Gadget', [[20, 'Silk', 100]]),
      ];
      const results = computeBuildables(inventory, blueprints, { includeUnbuildable: true });
      expect(results[0].productName).toBe('Gadget');
      expect(results[1].productName).toBe('Widget');
    });

    it('sorts alphabetically by productName when possibleRuns are equal', () => {
      const inventory = inv([[10, 90], [20, 90]]);
      const blueprints = [
        bp(2, 'Zephyr', [[20, 'Silk', 100]]),
        bp(1, 'Alpha', [[10, 'Iron', 100]]),
      ];
      const results = computeBuildables(inventory, blueprints, { includeUnbuildable: true });
      expect(results[0].productName).toBe('Alpha');
      expect(results[1].productName).toBe('Zephyr');
    });
  });

  describe('includeUnbuildable option', () => {
    const inventory = inv([[10, 90]]);
    const blueprints = [
      bp(1, 'Buildable', [[10, 'Iron', 100]]),   // 1 run
      bp(2, 'Unbuildable', [[20, 'Silk', 100]]), // 0 runs (missing material)
    ];

    it('excludes zero-run blueprints by default', () => {
      const results = computeBuildables(inventory, blueprints);
      expect(results).toHaveLength(1);
      expect(results[0].productName).toBe('Buildable');
    });

    it('excludes zero-run blueprints when includeUnbuildable is false', () => {
      const results = computeBuildables(inventory, blueprints, { includeUnbuildable: false });
      expect(results).toHaveLength(1);
    });

    it('includes zero-run blueprints when includeUnbuildable is true', () => {
      const results = computeBuildables(inventory, blueprints, { includeUnbuildable: true });
      expect(results).toHaveLength(2);
    });
  });

  describe('empty inputs', () => {
    it('returns empty array for no blueprints', () => {
      expect(computeBuildables(inv([[10, 1000]]), [])).toEqual([]);
    });

    it('returns empty array for empty inventory with default options', () => {
      const results = computeBuildables(inv([]), [bp(1, 'Widget', [[10, 'Iron', 100]])]);
      expect(results).toEqual([]);
    });
  });
});
