import type { 
  FragranceOil, 
  RawMaterial, 
  PerfumeFormula, 
  FormulaOilItem,
  ConcentrationTier,
  PriceRoundingMode
} from '../types';

export const CONCENTRATION_TIERS: Record<ConcentrationTier, { label: string; desc: string; defaultPercent: number }> = {
  edc: {
    label: 'أو دو كولونيا (Eau de Cologne)',
    desc: 'تركيز خفيف ومنعش (3% - 5%) - يدوم ساعتين تقريباً',
    defaultPercent: 5,
  },
  edt: {
    label: 'أو دو تواليت (Eau de Toilette)',
    desc: 'تركيز يومي معتدل (8% - 15%) - يدوم 3 - 5 ساعات',
    defaultPercent: 12,
  },
  edp: {
    label: 'أو دو بارفان (Eau de Parfum)',
    desc: 'التركيز الأكثر طلباً ومثالية (EDP) - ثبات 6 - 8 ساعات',
    defaultPercent: 22,
  },
  extrait: {
    label: 'إكستري دي بارفان (Extrait de Parfum)',
    desc: 'خلاصة عطرية مركزة ملكية (Extrait) - ثبات عالي جداً +12 ساعة',
    defaultPercent: 30,
  },
  pure_oil: {
    label: 'زيت مركز نقي 100% (Pure Oil / CPO)',
    desc: 'دهن عطر خام مركز خالص بدون كحول - ثبات أقصى',
    defaultPercent: 100,
  },
  custom: {
    label: 'تركيز مخصص (Custom)',
    desc: 'تحديد النسبة المئوية يدوياً حسب رغبة العميل',
    defaultPercent: 20,
  },
};

/**
 * Benchmark profit margins in ready-made bottles (العبوات الجاهزة):
 * - 30ml: Sells at $5.00 with ~$1.70 cost -> ~66% margin
 * - 50ml: Sells at $7.00 with ~$2.54 cost -> ~63.7% (~64%) margin
 * - 100ml: Sells at $12.00 with ~$4.50 cost -> ~62.5% margin
 */
export function getReadyBottleMargin(bottleCapacityMl: number): number {
  if (bottleCapacityMl <= 35) return 66;
  if (bottleCapacityMl <= 65) return 64;
  return 62.5;
}

/**
 * Rounds price decimals / fractions to clean commercial intervals ("تدوير الفواصل السعرية"):
 * - 'whole': nearest whole dollar ($7.00, $8.00, $12.00)
 * - 'ceil_whole': ceil to next whole dollar to ensure target margin ($7.20 -> $8.00)
 * - 'half': nearest 50 cents ($7.00, $7.50, $8.00)
 * - 'none': keep 2 decimal cents ($7.23)
 */
export function roundPriceFraction(price: number, mode: PriceRoundingMode = 'whole'): number {
  if (price <= 0 || !isFinite(price)) return 0;
  switch (mode) {
    case 'whole':
      return Math.round(price);
    case 'ceil_whole':
      return Math.ceil(price);
    case 'half':
      return Math.round(price * 2) / 2;
    case 'none':
    default:
      return Number(price.toFixed(2));
  }
}

export interface CalculationParams {
  bottleCapacityMl: number;
  concentrationPercent: number;
  concentrationTier: ConcentrationTier;
  oilSelections: { oilId: string; percentage: number; customUnitCost?: number }[];
  fixativePercent: number;
  availableOils: FragranceOil[];
  availableMaterials: RawMaterial[];
  selectedBottleId?: string;
  selectedSprayerId?: string;
  selectedPackagingId?: string;
  selectedAlcoholId?: string;
  selectedFixativeId?: string;
  profitMarginPercent: number;
  useReadyBottleMargin?: boolean;
  roundingMode?: PriceRoundingMode;
  customAlcoholUnitCost?: number;
  customFixativeUnitCost?: number;
  customBottleUnitCost?: number;
  customSprayerUnitCost?: number;
  customPackagingUnitCost?: number;
  name?: string;
  notes?: string;
}

export function calculateFormula(params: CalculationParams): PerfumeFormula {
  const {
    bottleCapacityMl,
    concentrationPercent,
    concentrationTier,
    oilSelections,
    fixativePercent,
    availableOils,
    availableMaterials,
    selectedBottleId,
    selectedSprayerId,
    selectedPackagingId,
    selectedAlcoholId,
    selectedFixativeId,
    profitMarginPercent,
    useReadyBottleMargin = true,
    roundingMode = 'whole',
    customAlcoholUnitCost,
    customFixativeUnitCost,
    customBottleUnitCost,
    customSprayerUnitCost,
    customPackagingUnitCost,
    name = '',
    notes = '',
  } = params;

  // 1. Calculations of Volumes
  // Total fragrance oil volume in ml
  const totalOilVolumeMl = Number((bottleCapacityMl * (concentrationPercent / 100)).toFixed(2));
  
  // Fixative volume in ml
  const fixativeVolumeMl = Number((bottleCapacityMl * (fixativePercent / 100)).toFixed(2));
  
  // Alcohol volume in ml (remainder)
  const rawAlcoholVolume = bottleCapacityMl - totalOilVolumeMl - fixativeVolumeMl;
  const alcoholVolumeMl = Number(Math.max(0, rawAlcoholVolume).toFixed(2));

  // 2. Calculate breakdown for each oil in the blend
  let totalOilWeightG = 0;
  let totalOilCost = 0;

  const calculatedOils: FormulaOilItem[] = oilSelections.map((sel) => {
    const oil = availableOils.find((o) => o.id === sel.oilId);
    const fraction = sel.percentage / 100;
    const volMl = Number((totalOilVolumeMl * fraction).toFixed(2));
    const density = oil?.density || 0.95;
    const weightG = Number((volMl * density).toFixed(2));
    const unitCost = sel.customUnitCost !== undefined ? sel.customUnitCost : (oil ? oil.unitCost : 0.07);
    const cost = Number((volMl * unitCost).toFixed(2));

    totalOilWeightG += weightG;
    totalOilCost += cost;

    return {
      oilId: sel.oilId,
      percentage: sel.percentage,
      volumeMl: volMl,
      weightG,
      cost,
      unitCost,
    };
  });

  totalOilWeightG = Number(totalOilWeightG.toFixed(2));
  totalOilCost = Number(totalOilCost.toFixed(2));

  // 3. Materials cost
  const alcoholMat = availableMaterials.find((m) => m.id === selectedAlcoholId);
  const fixativeMat = availableMaterials.find((m) => m.id === selectedFixativeId);
  const bottleMat = availableMaterials.find((m) => m.id === selectedBottleId);
  const sprayerMat = availableMaterials.find((m) => m.id === selectedSprayerId);
  const packagingMat = availableMaterials.find((m) => m.id === selectedPackagingId);

  // Alcohol cost (unitCost is per ml)
  const effectiveAlcoholUnitCost = customAlcoholUnitCost !== undefined 
    ? customAlcoholUnitCost 
    : (alcoholMat ? alcoholMat.unitCost : 0.05);
  const alcoholCost = Number((alcoholVolumeMl * effectiveAlcoholUnitCost).toFixed(2));

  // Fixative cost (unitCost is per ml)
  const effectiveFixativeUnitCost = customFixativeUnitCost !== undefined 
    ? customFixativeUnitCost 
    : (fixativeMat ? fixativeMat.unitCost : 0.18);
  const fixativeCost = Number((fixativeVolumeMl * effectiveFixativeUnitCost).toFixed(2));

  // Packaging items cost (per piece)
  const effectiveBottleCost = customBottleUnitCost !== undefined 
    ? customBottleUnitCost 
    : (bottleMat ? bottleMat.unitCost : 0);
  const effectiveSprayerCost = customSprayerUnitCost !== undefined 
    ? customSprayerUnitCost 
    : (sprayerMat ? sprayerMat.unitCost : 0);
  const effectivePackagingCost = customPackagingUnitCost !== undefined 
    ? customPackagingUnitCost 
    : (packagingMat ? packagingMat.unitCost : 0);

  const bottleCost = Number(effectiveBottleCost.toFixed(2));
  const sprayerCost = Number(effectiveSprayerCost.toFixed(2));
  const packagingCost = Number(effectivePackagingCost.toFixed(2));

  // Total cost per single bottle
  const totalCostPerBottle = Number(
    (totalOilCost + alcoholCost + fixativeCost + bottleCost + sprayerCost + packagingCost).toFixed(2)
  );

  // Target Profit Margin Benchmark:
  // Ready-bottle margin for 50ml is ~64%, 30ml is ~66%, 100ml is ~62.5%
  const benchmarkMarginPercent = getReadyBottleMargin(bottleCapacityMl);
  const targetMargin = useReadyBottleMargin ? benchmarkMarginPercent : profitMarginPercent;
  const safeMargin = Math.min(95, Math.max(5, targetMargin));

  // Unrounded raw selling price based on raw materials cost: Price = Cost / (1 - Margin/100)
  const unroundedPrice = totalCostPerBottle > 0 
    ? Number((totalCostPerBottle / (1 - safeMargin / 100)).toFixed(2))
    : 0;

  // Price Decimal Rounding ("تدوير الفواصل السعرية")
  const suggestedRetailPrice = roundPriceFraction(unroundedPrice, roundingMode);

  const profitPerBottle = Number((suggestedRetailPrice - totalCostPerBottle).toFixed(2));
  const calculatedMargin = suggestedRetailPrice > 0 
    ? Number(((profitPerBottle / suggestedRetailPrice) * 100).toFixed(1))
    : 0;

  return {
    id: `formula-${Date.now()}`,
    name: name || `تركيبة ${bottleCapacityMl} مل (${concentrationPercent}%)`,
    bottleCapacityMl,
    concentrationPercent,
    concentrationTier,
    totalOilVolumeMl,
    totalOilWeightG,
    oils: calculatedOils,
    fixativePercent,
    fixativeVolumeMl,
    fixativeMaterialId: selectedFixativeId,
    alcoholVolumeMl,
    alcoholMaterialId: selectedAlcoholId,
    bottleMaterialId: selectedBottleId,
    sprayerMaterialId: selectedSprayerId,
    packagingMaterialId: selectedPackagingId,
    
    oilCost: totalOilCost,
    alcoholCost,
    fixativeCost,
    bottleCost,
    sprayerCost,
    packagingCost,
    extraCost: 0,
    totalCostPerBottle,

    suggestedRetailPrice,
    unroundedPrice,
    profitPerBottle,
    profitMarginPercent: calculatedMargin,
    roundingMode,
    benchmarkMarginPercent,
    notes,
  };
}

export interface InventoryCheckResult {
  canProduce: boolean;
  warnings: string[];
  deductions: {
    oils: { oilId: string; name: string; amountNeeded: number; available: number }[];
    materials: { materialId: string; name: string; amountNeeded: number; available: number; unit: string }[];
  };
}

export function validateInventoryForProduction(
  formula: PerfumeFormula,
  bottlesCount: number,
  oils: FragranceOil[],
  materials: RawMaterial[]
): InventoryCheckResult {
  const warnings: string[] = [];
  const oilDeductions: { oilId: string; name: string; amountNeeded: number; available: number }[] = [];
  const matDeductions: { materialId: string; name: string; amountNeeded: number; available: number; unit: string }[] = [];

  let canProduce = true;

  // Check oils
  for (const item of formula.oils) {
    const oil = oils.find((o) => o.id === item.oilId);
    const amountNeeded = Number((item.volumeMl * bottlesCount).toFixed(2));
    const available = oil ? oil.currentQuantity : 0;
    const name = oil ? oil.name : 'زيت غير معروف';

    oilDeductions.push({ oilId: item.oilId, name, amountNeeded, available });

    if (amountNeeded > available) {
      canProduce = false;
      warnings.push(`الكمية المتبقية من زيت "${name}" (${available} مل) غير كافية لإنتاج ${bottlesCount} زجاجة (المطلوب: ${amountNeeded} مل)`);
    }
  }

  // Check alcohol
  if (formula.alcoholMaterialId && formula.alcoholVolumeMl > 0) {
    const alcoholMat = materials.find((m) => m.id === formula.alcoholMaterialId);
    const amountNeeded = Number((formula.alcoholVolumeMl * bottlesCount).toFixed(2));
    const available = alcoholMat ? alcoholMat.currentQuantity : 0;
    const name = alcoholMat ? alcoholMat.name : 'الكحول';

    matDeductions.push({ materialId: formula.alcoholMaterialId, name, amountNeeded, available, unit: 'مل' });

    if (amountNeeded > available) {
      canProduce = false;
      warnings.push(`كمية الكحول المتبقية (${available} مل) غير كافية (المطلوب: ${amountNeeded} مل)`);
    }
  }

  // Check fixative
  if (formula.fixativeMaterialId && formula.fixativeVolumeMl > 0) {
    const fixMat = materials.find((m) => m.id === formula.fixativeMaterialId);
    const amountNeeded = Number((formula.fixativeVolumeMl * bottlesCount).toFixed(2));
    const available = fixMat ? fixMat.currentQuantity : 0;
    const name = fixMat ? fixMat.name : 'المثبت';

    matDeductions.push({ materialId: formula.fixativeMaterialId, name, amountNeeded, available, unit: 'مل' });

    if (amountNeeded > available) {
      canProduce = false;
      warnings.push(`كمية المثبت المتبقية (${available} مل) غير كافية (المطلوب: ${amountNeeded} مل)`);
    }
  }

  // Check bottle
  if (formula.bottleMaterialId) {
    const bottleMat = materials.find((m) => m.id === formula.bottleMaterialId);
    const amountNeeded = bottlesCount;
    const available = bottleMat ? bottleMat.currentQuantity : 0;
    const name = bottleMat ? bottleMat.name : 'الزجاجات';

    matDeductions.push({ materialId: formula.bottleMaterialId, name, amountNeeded, available, unit: 'قطعة' });

    if (amountNeeded > available) {
      canProduce = false;
      warnings.push(`عدد الزجاجات المتوفرة (${available} قطعة) غير كافٍ (المطلوب: ${amountNeeded} قطعة)`);
    }
  }

  // Check sprayer
  if (formula.sprayerMaterialId) {
    const spMat = materials.find((m) => m.id === formula.sprayerMaterialId);
    const amountNeeded = bottlesCount;
    const available = spMat ? spMat.currentQuantity : 0;
    const name = spMat ? spMat.name : 'البخاخات';

    matDeductions.push({ materialId: formula.sprayerMaterialId, name, amountNeeded, available, unit: 'قطعة' });

    if (amountNeeded > available) {
      canProduce = false;
      warnings.push(`عدد البخاخات المتوفرة (${available} قطعة) غير كافٍ (المطلوب: ${amountNeeded} قطعة)`);
    }
  }

  // Check packaging box
  if (formula.packagingMaterialId) {
    const pkgMat = materials.find((m) => m.id === formula.packagingMaterialId);
    const amountNeeded = bottlesCount;
    const available = pkgMat ? pkgMat.currentQuantity : 0;
    const name = pkgMat ? pkgMat.name : 'علب التغليف';

    matDeductions.push({ materialId: formula.packagingMaterialId, name, amountNeeded, available, unit: 'قطعة' });

    if (amountNeeded > available) {
      canProduce = false;
      warnings.push(`عدد علب التغليف المتوفرة (${available} قطعة) غير كافٍ (المطلوب: ${amountNeeded} قطعة)`);
    }
  }

  return {
    canProduce,
    warnings,
    deductions: {
      oils: oilDeductions,
      materials: matDeductions,
    },
  };
}
