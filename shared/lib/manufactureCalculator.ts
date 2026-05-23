import type {
  PerRunRequirementData,
  ShortfallData,
  BuildableResultData,
} from '../types.js';

export type Inventory = Map<number, number>;

export type BlueprintInput = {
  blueprintTypeID: number;
  productTypeID: number;
  productName: string;
  meLevel: number;
  materials: Array<{
    materialTypeID: number;
    materialName: string;
    baseQuantity: number;
  }>;
};

export function applyMe(baseQty: number, meLevel: number): number {
  return Math.max(1, Math.ceil(baseQty * (1 - meLevel / 100)));
}

export function completionFraction(reqs: PerRunRequirementData[]): number {
  if (reqs.length === 0) return 0;
  return Math.min(...reqs.map(r => r.have / r.requiredPerRun));
}

export function computeBuildables(
  inventory: Inventory,
  blueprints: BlueprintInput[],
  options: { includeUnbuildable?: boolean } = {},
): BuildableResultData[] {
  const { includeUnbuildable = false } = options;

  const results: BuildableResultData[] = blueprints.map(bp => {
    if (bp.materials.length === 0) {
      return {
        blueprintTypeID: bp.blueprintTypeID,
        productTypeID: bp.productTypeID,
        productName: bp.productName,
        possibleRuns: 0,
        perRunRequirements: [],
        bottleneckMaterialTypeID: null,
        bottleneckMaterialName: null,
        shortfalls: [],
      };
    }

    const perRunRequirements: PerRunRequirementData[] = bp.materials.map(mat => ({
      materialTypeID: mat.materialTypeID,
      materialName: mat.materialName,
      requiredPerRun: applyMe(mat.baseQuantity, bp.meLevel),
      have: inventory.get(mat.materialTypeID) ?? 0,
    }));

    const possibleRuns = Math.min(
      ...perRunRequirements.map(r => Math.floor(r.have / r.requiredPerRun)),
    );

    let bottleneckMaterialTypeID: number | null = null;
    let bottleneckMaterialName: string | null = null;
    let minRatio = Infinity;
    for (const r of perRunRequirements) {
      const ratio = r.have / r.requiredPerRun;
      if (ratio < minRatio) {
        minRatio = ratio;
        bottleneckMaterialTypeID = r.materialTypeID;
        bottleneckMaterialName = r.materialName;
      }
    }

    const shortfalls: ShortfallData[] = perRunRequirements
      .map(r => ({
        materialTypeID: r.materialTypeID,
        materialName: r.materialName,
        needForOneMore: Math.max(0, (possibleRuns + 1) * r.requiredPerRun - r.have),
      }))
      .filter(s => s.needForOneMore > 0);

    return {
      blueprintTypeID: bp.blueprintTypeID,
      productTypeID: bp.productTypeID,
      productName: bp.productName,
      possibleRuns,
      perRunRequirements,
      bottleneckMaterialTypeID,
      bottleneckMaterialName,
      shortfalls,
    };
  });

  const filtered = includeUnbuildable
    ? results
    : results.filter(r => {
        if (r.possibleRuns > 0) return true;
        const reqs = r.perRunRequirements;
        return reqs.length > 0 && reqs.filter(req => req.have > 0).length * 2 >= reqs.length;
      });

  return filtered.sort((a, b) => {
    if (b.possibleRuns !== a.possibleRuns) return b.possibleRuns - a.possibleRuns;
    const fracA = completionFraction(a.perRunRequirements);
    const fracB = completionFraction(b.perRunRequirements);
    if (fracB !== fracA) return fracB - fracA;
    return a.productName.localeCompare(b.productName);
  });
}
