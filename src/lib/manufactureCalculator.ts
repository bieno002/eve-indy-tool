export type Inventory = Map<number, number>;

export type BlueprintInput = {
  blueprintTypeID: number;
  productTypeID: number;
  productName: string;
  materials: Array<{
    materialTypeID: number;
    materialName: string;
    baseQuantity: number;
  }>;
};

export type PerRunRequirement = {
  materialTypeID: number;
  materialName: string;
  requiredPerRun: number;
  have: number;
};

export type Shortfall = {
  materialTypeID: number;
  materialName: string;
  needForOneMore: number;
};

export type BuildableResult = {
  blueprintTypeID: number;
  productTypeID: number;
  productName: string;
  possibleRuns: number;
  perRunRequirements: PerRunRequirement[];
  bottleneckMaterialTypeID: number | null;
  bottleneckMaterialName: string | null;
  shortfalls: Shortfall[];
};

export function applyMe10(baseQty: number): number {
  return Math.max(1, Math.ceil(baseQty * 0.9));
}

export function computeBuildables(
  inventory: Inventory,
  blueprints: BlueprintInput[],
  options: { includeUnbuildable?: boolean } = {},
): BuildableResult[] {
  const { includeUnbuildable = false } = options;

  const results: BuildableResult[] = blueprints.map(bp => {
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

    const perRunRequirements: PerRunRequirement[] = bp.materials.map(mat => ({
      materialTypeID: mat.materialTypeID,
      materialName: mat.materialName,
      requiredPerRun: applyMe10(mat.baseQuantity),
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

    const shortfalls: Shortfall[] = perRunRequirements
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
    : results.filter(r => r.possibleRuns > 0);

  return filtered.sort((a, b) =>
    b.possibleRuns !== a.possibleRuns
      ? b.possibleRuns - a.possibleRuns
      : a.productName.localeCompare(b.productName),
  );
}
