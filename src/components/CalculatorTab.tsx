import React, { useState, useMemo } from 'react';
import { 
  FlaskConical, 
  Droplet, 
  DollarSign, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Check, 
  Bookmark, 
  X,
  Sparkles,
  RotateCcw,
  Sliders,
  Percent
} from './icons';
import type { 
  FragranceOil, 
  RawMaterial, 
  AppSettings, 
  ProductionBatch, 
  ConcentrationTier,
  SavedRecipe, 
  RecipeCategory,
  PriceRoundingMode
} from '../types';
import { 
  calculateFormula, 
  validateInventoryForProduction, 
  CONCENTRATION_TIERS,
  getReadyBottleMargin,
  roundPriceFraction
} from '../utils/calculator';
import { useLanguage } from '../context/LanguageContext';
import { 
  getLocalizedTier, 
  getLocalizedOilName, 
  getLocalizedMaterialName 
} from '../utils/i18n';
import { PerfumeCaliberCalculatorModal } from './PerfumeCaliberCalculatorModal';

interface CalculatorTabProps {
  oils: FragranceOil[];
  materials: RawMaterial[];
  settings: AppSettings;
  recipes?: SavedRecipe[];
  initialSelectedOilId?: string;
  initialRecipe?: SavedRecipe | null;
  onExecuteProduction: (batch: ProductionBatch, deductions: {
    oils: { id: string; amount: number }[];
    materials: { id: string; amount: number }[];
  }) => void;
  onPrintRecipe: (batch: ProductionBatch) => void;
  onSaveRecipe?: (recipe: SavedRecipe) => void;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  oils,
  materials,
  settings,
  recipes = [],
  initialSelectedOilId,
  initialRecipe,
  onExecuteProduction,
  onPrintRecipe,
  onSaveRecipe,
}) => {
  const { language, t } = useLanguage();

  // Bottle capacity in ml
  const [bottleCapacityMl, setBottleCapacityMl] = useState<number>(50);
  const [customCapacity, setCustomCapacity] = useState<string>('');
  const [isCustomCapacity, setIsCustomCapacity] = useState<boolean>(false);

  // Concentration
  const [tier, setTier] = useState<ConcentrationTier>('edp');
  const [concentrationPercent, setConcentrationPercent] = useState<number>(22);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState<boolean>(false);

  // Manual Input Mode ('percent' vs 'direct_amount')
  const [calcInputMode, setCalcInputMode] = useState<'percent' | 'direct_amount'>('percent');
  const [directOilAmountInput, setDirectOilAmountInput] = useState<string>('11');
  const [directAmountUnit, setDirectAmountUnit] = useState<'ml' | 'grams'>('ml');

  // Fixative
  const [fixativePercent, setFixativePercent] = useState<number>(settings.defaultFixativePercent || 1.5);

  // Oil selection (one or multiple for blends) with custom raw material pricing
  const [oilSelections, setOilSelections] = useState<{ oilId: string; percentage: number; customUnitCost?: number | '' }[]>([
    { oilId: initialSelectedOilId || oils[0]?.id || '', percentage: 100 }
  ]);

  // In-place raw material price overrides ("وضع أسعار المواد الأولية")
  const [customAlcoholCost, setCustomAlcoholCost] = useState<string>('');
  const [customFixativeCost, setCustomFixativeCost] = useState<string>('');
  const [customBottleCost, setCustomBottleCost] = useState<string>('');
  const [customSprayerCost, setCustomSprayerCost] = useState<string>('');
  const [customPackagingCost, setCustomPackagingCost] = useState<string>('');

  // Ready bottle margin benchmark & decimal rounding ("بنسبة ربح كما هي في العبوات الجاهزة مع تدوير الفواصل السعرية")
  const [useReadyBottleMargin, setUseReadyBottleMargin] = useState<boolean>(true);
  const [roundingMode, setRoundingMode] = useState<PriceRoundingMode>('whole');

  // Sync with initialSelectedOilId if passed from Smart Search
  React.useEffect(() => {
    if (initialSelectedOilId) {
      setOilSelections([{ oilId: initialSelectedOilId, percentage: 100 }]);
    }
  }, [initialSelectedOilId]);

  // Saved Recipe Loading & Modal State
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [isSaveRecipeModalOpen, setIsSaveRecipeModalOpen] = useState<boolean>(false);
  const [recipeSuccessMessage, setRecipeSuccessMessage] = useState<string | null>(null);

  // New Recipe Draft for "Save as Recipe" modal
  const [recipeDraftName, setRecipeDraftName] = useState<string>('');
  const [recipeDraftNameEn, setRecipeDraftNameEn] = useState<string>('');
  const [recipeDraftCategory, setRecipeDraftCategory] = useState<RecipeCategory>('signature');
  const [recipeDraftGender, setRecipeDraftGender] = useState<'unisex' | 'men' | 'women'>('unisex');
  const [recipeDraftSeason, setRecipeDraftSeason] = useState<'all' | 'summer' | 'winter' | 'autumn' | 'spring'>('all');
  const [recipeDraftPrice, setRecipeDraftPrice] = useState<number>(18);
  const [recipeDraftNotes, setRecipeDraftNotes] = useState<string>('');

  // Selected Packaging Materials
  const bottlesList = useMemo(() => materials.filter((m) => m.category === 'bottle'), [materials]);
  const sprayersList = useMemo(() => materials.filter((m) => m.category === 'sprayer'), [materials]);
  const alcoholList = useMemo(() => materials.filter((m) => m.category === 'alcohol'), [materials]);
  const fixativesList = useMemo(() => materials.filter((m) => m.category === 'fixative'), [materials]);
  const packagingList = useMemo(() => materials.filter((m) => m.category === 'packaging'), [materials]);

  // Default selections based on bottle capacity
  const matchedBottle = useMemo(() => {
    return bottlesList.find((b) => b.bottleCapacityMl === bottleCapacityMl) || bottlesList[0];
  }, [bottlesList, bottleCapacityMl]);

  const [selectedBottleId, setSelectedBottleId] = useState<string>(matchedBottle?.id || '');
  const [selectedSprayerId, setSelectedSprayerId] = useState<string>(sprayersList[0]?.id || '');
  const [selectedAlcoholId, setSelectedAlcoholId] = useState<string>(alcoholList[0]?.id || '');
  const [selectedFixativeId, setSelectedFixativeId] = useState<string>(fixativesList[0]?.id || '');
  const [selectedPackagingId, setSelectedPackagingId] = useState<string>(packagingList[0]?.id || '');

  // Profit Margin & Batch count
  const [profitMargin, setProfitMargin] = useState<number>(settings.defaultProfitMargin || 65);
  const [formulaName, setFormulaName] = useState<string>('');
  const [bottlesToProduce, setBottlesToProduce] = useState<number>(1);
  const [productionSuccess, setProductionSuccess] = useState<string | null>(null);

  // Update capacity
  const handleSelectCapacity = (ml: number) => {
    setBottleCapacityMl(ml);
    setIsCustomCapacity(false);
    // Auto match bottle
    const found = bottlesList.find((b) => b.bottleCapacityMl === ml);
    if (found) setSelectedBottleId(found.id);
  };

  const handleCustomCapacityChange = (val: string) => {
    setCustomCapacity(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setBottleCapacityMl(num);
    }
  };

  // Function to load a SavedRecipe into the calculator
  const applyRecipe = (recipe: SavedRecipe) => {
    if (recipe.bottleCapacityMl) {
      setBottleCapacityMl(recipe.bottleCapacityMl);
      setIsCustomCapacity(false);
      const foundBottle = bottlesList.find((b) => b.bottleCapacityMl === recipe.bottleCapacityMl);
      if (foundBottle) setSelectedBottleId(foundBottle.id);
    }
    if (recipe.concentrationTier) setTier(recipe.concentrationTier);
    if (recipe.concentrationPercent) setConcentrationPercent(recipe.concentrationPercent);
    if (recipe.fixativePercent !== undefined) setFixativePercent(recipe.fixativePercent);
    if (recipe.oils && recipe.oils.length > 0) {
      setOilSelections(recipe.oils.map((o) => ({ oilId: o.oilId, percentage: o.percentage })));
    }
    if (recipe.name) setFormulaName(recipe.name);
    setSelectedRecipeId(recipe.id);
    setRecipeSuccessMessage(
      language === 'ar' 
        ? `تم تحميل خلطة "${recipe.name}" بنجاح!` 
        : `Recipe "${recipe.nameEn || recipe.name}" loaded successfully!`
    );
    setTimeout(() => setRecipeSuccessMessage(null), 4000);
  };

  // Sync with initialRecipe prop if passed
  React.useEffect(() => {
    if (initialRecipe) {
      applyRecipe(initialRecipe);
    }
  }, [initialRecipe]);

  // Change tier
  const handleTierSelect = (selectedTier: ConcentrationTier) => {
    setTier(selectedTier);
    if (selectedTier !== 'custom') {
      setConcentrationPercent(CONCENTRATION_TIERS[selectedTier].defaultPercent);
    }
  };

  // Add / Remove oils for blend
  const handleAddOil = () => {
    if (oils.length === 0) return;
    const remainingPercent = Math.max(0, 100 - oilSelections.reduce((acc, curr) => acc + curr.percentage, 0));
    setOilSelections([
      ...oilSelections,
      { oilId: oils[0].id, percentage: remainingPercent || 10 }
    ]);
  };

  const handleRemoveOil = (index: number) => {
    if (oilSelections.length <= 1) return;
    const next = [...oilSelections];
    next.splice(index, 1);
    setOilSelections(next);
  };

  const handleUpdateOilId = (index: number, newId: string) => {
    const next = [...oilSelections];
    next[index] = { ...next[index], oilId: newId, customUnitCost: undefined };
    setOilSelections(next);
  };

  const handleUpdateOilPercentage = (index: number, newPercent: number) => {
    const next = [...oilSelections];
    next[index] = { ...next[index], percentage: Math.max(0, Math.min(100, newPercent)) };
    setOilSelections(next);
  };

  const handleUpdateOilUnitCost = (index: number, val: string) => {
    const next = [...oilSelections];
    if (val === '') {
      next[index] = { ...next[index], customUnitCost: '' };
    } else {
      const num = parseFloat(val);
      next[index] = { ...next[index], customUnitCost: isNaN(num) ? 0 : num };
    }
    setOilSelections(next);
  };

  // Calculate formula live with raw material costs, ready-bottle margin benchmark, and decimal rounding
  const formula = useMemo(() => {
    const parsedOilSelections = oilSelections.map((sel) => ({
      oilId: sel.oilId,
      percentage: sel.percentage,
      customUnitCost: typeof sel.customUnitCost === 'number' ? sel.customUnitCost : undefined,
    }));

    const parsedAlcoholCost = customAlcoholCost !== '' ? parseFloat(customAlcoholCost) : undefined;
    const parsedFixativeCost = customFixativeCost !== '' ? parseFloat(customFixativeCost) : undefined;
    const parsedBottleCost = customBottleCost !== '' ? parseFloat(customBottleCost) : undefined;
    const parsedSprayerCost = customSprayerCost !== '' ? parseFloat(customSprayerCost) : undefined;
    const parsedPackagingCost = customPackagingCost !== '' ? parseFloat(customPackagingCost) : undefined;

    return calculateFormula({
      bottleCapacityMl,
      concentrationPercent,
      concentrationTier: tier,
      oilSelections: parsedOilSelections,
      fixativePercent,
      availableOils: oils,
      availableMaterials: materials,
      selectedBottleId,
      selectedSprayerId,
      selectedPackagingId,
      selectedAlcoholId,
      selectedFixativeId,
      profitMarginPercent: profitMargin,
      useReadyBottleMargin,
      roundingMode,
      customAlcoholUnitCost: !isNaN(Number(parsedAlcoholCost)) ? parsedAlcoholCost : undefined,
      customFixativeUnitCost: !isNaN(Number(parsedFixativeCost)) ? parsedFixativeCost : undefined,
      customBottleUnitCost: !isNaN(Number(parsedBottleCost)) ? parsedBottleCost : undefined,
      customSprayerUnitCost: !isNaN(Number(parsedSprayerCost)) ? parsedSprayerCost : undefined,
      customPackagingUnitCost: !isNaN(Number(parsedPackagingCost)) ? parsedPackagingCost : undefined,
      name: formulaName || (oils.find((o) => o.id === oilSelections[0]?.oilId)?.name 
        ? `${oils.find((o) => o.id === oilSelections[0]?.oilId)?.name} ${bottleCapacityMl}ml (${concentrationPercent}%)`
        : `Formula ${bottleCapacityMl}ml`),
    });
  }, [
    bottleCapacityMl,
    concentrationPercent,
    tier,
    oilSelections,
    fixativePercent,
    oils,
    materials,
    selectedBottleId,
    selectedSprayerId,
    selectedPackagingId,
    selectedAlcoholId,
    selectedFixativeId,
    profitMargin,
    useReadyBottleMargin,
    roundingMode,
    customAlcoholCost,
    customFixativeCost,
    customBottleCost,
    customSprayerCost,
    customPackagingCost,
    formulaName,
  ]);

  // Inventory validation for current batch
  const inventoryCheck = useMemo(() => {
    return validateInventoryForProduction(formula, bottlesToProduce, oils, materials);
  }, [formula, bottlesToProduce, oils, materials]);

  // Selected primary oil for preview
  const primaryOil = useMemo(() => {
    return oils.find((o) => o.id === oilSelections[0]?.oilId);
  }, [oils, oilSelections]);

  // Weighted ready-bottle catalog price from all oils in the blend
  const weightedCatalogPrice = useMemo(() => {
    if (oilSelections.length === 0) return 7;
    let sumPrice = 0;
    let sumWeight = 0;
    oilSelections.forEach((sel) => {
      const o = oils.find((item) => item.id === sel.oilId);
      if (!o) return;
      let price = 7;
      if (bottleCapacityMl <= 35) price = o.retailPrice30ml || 5;
      else if (bottleCapacityMl <= 60) price = o.retailPrice50ml || 7;
      else price = o.retailPrice100ml || 12;

      sumPrice += (sel.percentage / 100) * price;
      sumWeight += sel.percentage;
    });
    if (sumWeight === 0) return 7;
    return Number((sumPrice * (100 / sumWeight)).toFixed(2));
  }, [oils, oilSelections, bottleCapacityMl]);

  const actualProfit = formula.profitPerBottle;
  const actualProfitMargin = formula.profitMarginPercent.toFixed(1);

  // Sum of oil blend percentages
  const totalBlendPercent = oilSelections.reduce((sum, item) => sum + item.percentage, 0);

  // Handle Production Confirmation
  const handleConfirmProduction = () => {
    if (!inventoryCheck.canProduce) return;

    const batchNumber = `BATCH-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const batchCost = Number((formula.totalCostPerBottle * bottlesToProduce).toFixed(2));
    const batchRevenue = Number((formula.suggestedRetailPrice * bottlesToProduce).toFixed(2));
    const batchProfit = Number((batchRevenue - batchCost).toFixed(2));

    const newBatch: ProductionBatch = {
      id: `batch-${Date.now()}`,
      batchNumber,
      formula,
      bottlesCount: bottlesToProduce,
      totalBatchCost: batchCost,
      totalExpectedRevenue: batchRevenue,
      totalExpectedProfit: batchProfit,
      createdAt: new Date().toISOString(),
      notes: language === 'ar' 
        ? `تم إنتاج ${bottlesToProduce} زجاجة بحجم ${bottleCapacityMl} مل بنسبة تركيز ${concentrationPercent}%`
        : `Produced ${bottlesToProduce} bottles of ${bottleCapacityMl}ml at ${concentrationPercent}% concentration`,
    };

    const oilDeductions = formula.oils.map((o) => ({
      id: o.oilId,
      amount: Number((o.volumeMl * bottlesToProduce).toFixed(2)),
    }));

    const matDeductions: { id: string; amount: number }[] = [];
    if (formula.alcoholMaterialId && formula.alcoholVolumeMl > 0) {
      matDeductions.push({ id: formula.alcoholMaterialId, amount: Number((formula.alcoholVolumeMl * bottlesToProduce).toFixed(2)) });
    }
    if (formula.fixativeMaterialId && formula.fixativeVolumeMl > 0) {
      matDeductions.push({ id: formula.fixativeMaterialId, amount: Number((formula.fixativeVolumeMl * bottlesToProduce).toFixed(2)) });
    }
    if (formula.bottleMaterialId) {
      matDeductions.push({ id: formula.bottleMaterialId, amount: bottlesToProduce });
    }
    if (formula.sprayerMaterialId) {
      matDeductions.push({ id: formula.sprayerMaterialId, amount: bottlesToProduce });
    }
    if (formula.packagingMaterialId) {
      matDeductions.push({ id: formula.packagingMaterialId, amount: bottlesToProduce });
    }

    onExecuteProduction(newBatch, { oils: oilDeductions, materials: matDeductions });
    setProductionSuccess(
      language === 'ar'
        ? `تم تسجيل التشغيلة رقم ${batchNumber} وخصم المواد من المخزون بنجاح!`
        : `Batch ${batchNumber} successfully recorded & deducted from stock!`
    );
    setTimeout(() => setProductionSuccess(null), 6000);
  };

  // Open modal to save formula as recipe
  const handleOpenSaveRecipeModal = () => {
    const defaultName = formulaName || (oilSelections.length > 1 
      ? (language === 'ar' ? 'خلطة نسمات الخاصة' : 'Nasamat Custom Blend')
      : (oils.find(o => o.id === oilSelections[0]?.oilId)?.name || (language === 'ar' ? 'وصفة جديدة' : 'New Recipe')));
    setRecipeDraftName(defaultName);
    setRecipeDraftNameEn('');
    setRecipeDraftCategory('signature');
    setRecipeDraftGender('unisex');
    setRecipeDraftSeason('all');
    setRecipeDraftPrice(formula.suggestedRetailPrice || 18);
    setRecipeDraftNotes('');
    setIsSaveRecipeModalOpen(true);
  };

  // Submit save formula as recipe
  const handleConfirmSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeDraftName.trim() || !onSaveRecipe) return;

    const codeNum = String(Math.floor(100 + Math.random() * 900));
    const newRecipe: SavedRecipe = {
      id: `rec-custom-${Date.now()}`,
      code: `NAS-REC-${codeNum}`,
      name: recipeDraftName.trim(),
      nameEn: recipeDraftNameEn.trim() || undefined,
      description: language === 'ar' 
        ? `خلطة عطرية مميزة مركبة في حاسبة نسمات بنسبة تركيز ${concentrationPercent}%` 
        : `Signature perfume formulated in Nasamat Lab with ${concentrationPercent}% concentration`,
      category: recipeDraftCategory,
      bottleCapacityMl,
      concentrationPercent,
      concentrationTier: tier,
      fixativePercent,
      oils: oilSelections.map((sel) => ({
        oilId: sel.oilId,
        percentage: sel.percentage,
        notes: oils.find((o) => o.id === sel.oilId)?.name,
      })),
      suggestedRetailPrice: recipeDraftPrice,
      targetGender: recipeDraftGender,
      season: recipeDraftSeason,
      scentNotes: recipeDraftNotes.trim() || undefined,
      imageUrl: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=400&q=80',
      isSignature: true,
      isMaster: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveRecipe(newRecipe);
    setIsSaveRecipeModalOpen(false);
    setSelectedRecipeId(newRecipe.id);
    setRecipeSuccessMessage(
      language === 'ar' 
        ? `تم حفظ خلطة "${newRecipe.name}" بنجاح في مكتبة الوصفات!` 
        : `Recipe "${newRecipe.name}" successfully saved to library!`
    );
    setTimeout(() => setRecipeSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {productionSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-4 flex items-center gap-3 text-emerald-200 shadow-xl shadow-emerald-500/10 animate-in fade-in slide-in-from-top-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm lg:text-base">{productionSuccess}</p>
            <p className="text-xs text-emerald-300/80">
              {language === 'ar' 
                ? 'تم تحديث الأرصدة المتبقية لجميع الزيوت والمواد والزجاجات فورياً.' 
                : 'Stock balances updated immediately for all oils, solvents, and packaging.'}
            </p>
          </div>
          <button
            onClick={() => setProductionSuccess(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-1 bg-emerald-900/50 rounded-lg cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      )}

      {/* Advanced Interactive Calibers & Formulations Launcher Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-neutral-900 to-black border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
            <Sliders className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>{language === 'ar' ? 'آلة حاسبة العيارات والنسب المتقدمة' : 'Advanced Calibers & Formulation Calculator'}</span>
              <span className="text-[10px] font-mono font-bold bg-amber-400 text-black px-1.5 py-0.2 rounded">
                10ml - 1000ml
              </span>
            </h3>
            <p className="text-xs text-amber-200/80">
              {language === 'ar' 
                ? 'تحكم فوري ودقيق في أحجام الزجاجات والعيارات العالمية المعيارية والمقادير بالميزان بالغرامات' 
                : 'Fine-tuned control over bottle sizes, international calibers and exact scale gram measures'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAdvancedModalOpen(true)}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition shadow-sm cursor-pointer whitespace-nowrap self-end sm:self-center"
        >
          🧪 {language === 'ar' ? 'فتح الحاسبة التفاعلية الشاملة' : 'Open Interactive Calculator'}
        </button>
      </div>

      {/* Main Grid: Left Controls (Formulation inputs) & Right Live Visualizer/Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= LEFT SECTION: FORMULATION INPUTS (7 COLS) ================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* STEP 1: Bottle Capacity */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">1</span>
                <h3 className="text-base font-bold text-slate-100">
                  {language === 'ar' ? 'حجم عبوة العطر (السعة الإجمالية بالمل)' : 'Bottle Capacity (Total Volume in ml)'}
                </h3>
              </div>
              <span className="text-xs text-amber-400/90 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {language === 'ar' ? `الحجم: ${bottleCapacityMl} مل` : `Size: ${bottleCapacityMl} ml`}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[10, 15, 20, 30, 50, 100, 250, 500, 1000].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSelectCapacity(size)}
                  className={`py-2 px-1.5 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                    !isCustomCapacity && bottleCapacityMl === size
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-black'
                      : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm sm:text-base font-black leading-tight">{size}</div>
                  <div className="text-[10px] opacity-80">{t('ml')}</div>
                </button>
              ))}

              {/* Custom size button */}
              <button
                type="button"
                onClick={() => setIsCustomCapacity(true)}
                className={`py-2 px-1.5 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                  isCustomCapacity
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-black'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="text-xs sm:text-sm leading-tight mt-0.5 font-bold">{language === 'ar' ? 'مخصص' : 'Custom'}</div>
                <div className="text-[10px] opacity-80">{language === 'ar' ? 'أدخل الحجم' : 'Enter ml'}</div>
              </button>
            </div>

            {/* Custom size input */}
            {isCustomCapacity && (
              <div className="mt-3 flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-xl border border-amber-500/30">
                <label className="text-xs text-slate-300 font-medium whitespace-nowrap">
                  {language === 'ar' ? 'الحجم المخصص (مل):' : 'Custom volume (ml):'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  value={customCapacity}
                  onChange={(e) => handleCustomCapacityChange(e.target.value)}
                  placeholder=""
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-amber-300 focus:outline-none focus:border-amber-400"
                />
                <span className="text-xs text-slate-400">{t('ml')}</span>
              </div>
            )}

            {/* Permanent Direct Manual Bottle Capacity Input */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950/70 rounded-xl border border-slate-700/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">
                  {language === 'ar' ? '✍️ إدخال سعة الزجاجة يدوياً:' : '✍️ Direct Bottle Size (ml):'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'ar' ? '(أو انقر على الأحجام السريعة أعلاه)' : '(or pick from presets above)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(1, bottleCapacityMl - 5);
                    setBottleCapacityMl(next);
                    const ml = (next * concentrationPercent) / 100;
                    setDirectOilAmountInput(ml.toFixed(2));
                  }}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-slate-700 transition"
                  title="-5 ml"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  step="1"
                  value={bottleCapacityMl}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setBottleCapacityMl(val);
                      const ml = (val * concentrationPercent) / 100;
                      setDirectOilAmountInput(ml.toFixed(2));
                    }
                  }}
                  className="w-20 bg-slate-900 border border-amber-500/40 rounded-lg px-2 py-1 text-center font-mono font-black text-sm text-amber-300 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = bottleCapacityMl + 5;
                    setBottleCapacityMl(next);
                    const ml = (next * concentrationPercent) / 100;
                    setDirectOilAmountInput(ml.toFixed(2));
                  }}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-slate-700 transition"
                  title="+5 ml"
                >
                  +
                </button>
                <span className="text-xs font-bold font-mono text-slate-400">ml</span>
              </div>
            </div>
          </div>

          {/* STEP 2: Concentration & Input Mode */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">2</span>
                <h3 className="text-base font-bold text-slate-100">
                  {language === 'ar' ? 'نسبة تركيز الزيت العطري أو إدخال المقادير يدوياً' : 'Oil Concentration & Manual Input'}
                </h3>
              </div>
              <span className="text-sm font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                {concentrationPercent}% {language === 'ar' ? 'تركيز' : 'Conc.'}
              </span>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setCalcInputMode('percent')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  calcInputMode === 'percent'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'بالنسب المئوية (%)' : 'Percentage (%)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDirectAmountUnit('ml');
                  const currentOilMl = (bottleCapacityMl * concentrationPercent) / 100;
                  setDirectOilAmountInput(currentOilMl.toFixed(2));
                  setCalcInputMode('direct_amount');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  calcInputMode === 'direct_amount' && directAmountUnit === 'ml'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Droplet className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'يدوي بالمل (ml)' : 'Direct ml'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDirectAmountUnit('grams');
                  const density = primaryOil?.density || 0.95;
                  const currentOilMl = (bottleCapacityMl * concentrationPercent) / 100;
                  setDirectOilAmountInput((currentOilMl * density).toFixed(2));
                  setCalcInputMode('direct_amount');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  calcInputMode === 'direct_amount' && directAmountUnit === 'grams'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'يدوي بالميزان (غرام)' : 'Scale Grams'}</span>
              </button>
            </div>

            {/* PERCENTAGE MODE: Show Tier chips & slider */}
            {calcInputMode === 'percent' ? (
              <>
                {/* Tier chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(CONCENTRATION_TIERS) as ConcentrationTier[])
                    .filter((tKey) => tKey !== 'custom')
                    .map((tKey) => {
                      const info = getLocalizedTier(tKey, language);
                      const isSelected = tier === tKey;
                      return (
                        <button
                          key={tKey}
                          type="button"
                          onClick={() => handleTierSelect(tKey)}
                          className={`p-2.5 rounded-xl border ${language === 'ar' ? 'text-right' : 'text-left'} transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-sm'
                              : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{info.label.split('(')[0]}</span>
                            <span className="text-[11px] font-bold text-amber-400">{info.defaultPercent}%</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{info.desc}</div>
                        </button>
                      );
                    })}
                </div>

                {/* Custom slider & input for exact percentage */}
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      {language === 'ar' ? 'التحكم الدقيق في نسبة الزيت (%):' : 'Fine Fragrance Oil Ratio (%):'}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        step="0.5"
                        value={concentrationPercent}
                        onChange={(e) => {
                          setTier('custom');
                          setConcentrationPercent(parseFloat(e.target.value) || 0);
                        }}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-amber-400 text-sm focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="50"
                    step="0.5"
                    value={concentrationPercent}
                    onChange={(e) => {
                      setTier('custom');
                      setConcentrationPercent(parseFloat(e.target.value));
                    }}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>3% ({language === 'ar' ? 'خفيف جداً' : 'Light'})</span>
                    <span>15% ({language === 'ar' ? 'تواليت' : 'EDT'})</span>
                    <span>{language === 'ar' ? 'بارفان فخم' : 'EDP Luxury'}</span>
                    <span>35%+ ({language === 'ar' ? 'مركز ملكي' : 'Extrait'})</span>
                  </div>
                </div>
              </>
            ) : (
              /* DIRECT MANUAL AMOUNT MODE */
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      {language === 'ar' 
                        ? (directAmountUnit === 'grams' ? '⚖️ أدخل وزن الزيت على الميزان (غرام):' : '💧 أدخل حجم الزيت المطلوب (مل):')
                        : (directAmountUnit === 'grams' ? '⚖️ Enter Oil Weight on Scale (g):' : '💧 Enter Oil Volume (ml):')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        const curr = parseFloat(directOilAmountInput) || 0;
                        const next = Math.max(0, curr - 1);
                        setDirectOilAmountInput(next.toFixed(2));
                        const density = primaryOil?.density || 0.95;
                        const valMl = directAmountUnit === 'grams' ? (density > 0 ? next / density : 0) : next;
                        const newPercent = bottleCapacityMl > 0 ? Number(((valMl / bottleCapacityMl) * 100).toFixed(1)) : 0;
                        setConcentrationPercent(newPercent);
                        setTier('custom');
                      }}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-slate-700"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      step={directAmountUnit === 'grams' ? '0.25' : '0.5'}
                      value={directOilAmountInput}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        setDirectOilAmountInput(valStr);
                        const val = parseFloat(valStr) || 0;
                        const density = primaryOil?.density || 0.95;
                        const valMl = directAmountUnit === 'grams' ? (density > 0 ? val / density : 0) : val;
                        const newPercent = bottleCapacityMl > 0 ? Number(((valMl / bottleCapacityMl) * 100).toFixed(1)) : 0;
                        setConcentrationPercent(newPercent);
                        setTier('custom');
                      }}
                      className="w-24 bg-slate-900 border border-amber-500/40 rounded-lg px-2.5 py-1 text-center font-mono font-black text-sm text-amber-300 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const curr = parseFloat(directOilAmountInput) || 0;
                        const next = curr + 1;
                        setDirectOilAmountInput(next.toFixed(2));
                        const density = primaryOil?.density || 0.95;
                        const valMl = directAmountUnit === 'grams' ? (density > 0 ? next / density : 0) : next;
                        const newPercent = bottleCapacityMl > 0 ? Number(((valMl / bottleCapacityMl) * 100).toFixed(1)) : 0;
                        setConcentrationPercent(newPercent);
                        setTier('custom');
                      }}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-slate-700"
                    >
                      +
                    </button>
                    <span className="text-xs font-bold font-mono text-slate-400">
                      {directAmountUnit === 'grams' ? 'g' : 'ml'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'العيار الناتج:' : 'Derived Caliber:'}</span>
                    <span className="font-bold text-amber-400 font-mono text-sm">{concentrationPercent}%</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">
                      {directAmountUnit === 'grams' ? (language === 'ar' ? 'الحجم المعادل بالمل:' : 'Equiv Volume:') : (language === 'ar' ? 'الوزن بالميزان:' : 'Scale Weight:')}
                    </span>
                    <span className="font-bold text-slate-200 font-mono text-sm">
                      {directAmountUnit === 'grams'
                        ? `${(primaryOil?.density ? (parseFloat(directOilAmountInput) || 0) / primaryOil.density : (parseFloat(directOilAmountInput) || 0) / 0.95).toFixed(2)} ml`
                        : `${((parseFloat(directOilAmountInput) || 0) * (primaryOil?.density || 0.95)).toFixed(2)} g`}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'كحول 96° المطلوب للإكمال:' : 'Alcohol Needed:'}</span>
                    <span className="font-bold text-sky-400 font-mono text-sm">{formula.alcoholVolumeMl} ml</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Fragrance Oils Selection (Single or Blend) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            
            {/* Recipe Success Toast */}
            {recipeSuccessMessage && (
              <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs text-amber-200 flex items-center gap-2 shadow-md animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3]" />
                <span className="font-semibold">{recipeSuccessMessage}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">3</span>
                <h3 className="text-base font-bold text-slate-100">
                  {language === 'ar' ? 'اختيار الزيوت العطرية (مفرد أو خلطة)' : 'Fragrance Oil Selection (Single or Blend)'}
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {onSaveRecipe && (
                  <button
                    type="button"
                    onClick={handleOpenSaveRecipeModal}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer shadow-sm"
                    title={t('calcSaveAsRecipeBtn')}
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('calcSaveAsRecipeBtn')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAddOil}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'إضافة زيت للخلطة' : 'Add Oil to Blend'}</span>
                </button>
              </div>
            </div>

            {/* Quick Recipe Loader Dropdown */}
            {recipes && recipes.length > 0 && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">
                    {t('calcLoadRecipeBtn')}:
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-1 sm:max-w-md">
                  <select
                    value={selectedRecipeId}
                    onChange={(e) => {
                      const recId = e.target.value;
                      if (!recId) return;
                      const found = recipes.find((r) => r.id === recId);
                      if (found) applyRecipe(found);
                    }}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-medium focus:border-amber-400 focus:outline-none"
                  >
                    <option value="">{t('calcSelectRecipePlaceholder')}</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name} ({r.oils.length} {language === 'ar' ? 'زيوت' : 'oils'} • {r.bottleCapacityMl}ml)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Validation warning if percentages don't add to 100% */}
            {totalBlendPercent !== 100 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'ar' 
                    ? `مجموع نسب الزيوت في الخلطة حالياً ${totalBlendPercent}% (يجب أن يكون 100%)`
                    : `Total oil blend percentage is currently ${totalBlendPercent}% (must equal 100%)`}
                </span>
              </div>
            )}

            {/* Oils List */}
            <div className="space-y-3">
              {oilSelections.map((sel, idx) => {
                const selectedOil = oils.find((o) => o.id === sel.oilId);
                const calcOil = formula.oils[idx];
                const isSingle = oilSelections.length === 1;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-2.5 transition hover:border-slate-600"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-bold text-amber-400 bg-slate-900 px-2 py-1 rounded-md">
                          #{idx + 1}
                        </span>
                        <select
                          value={sel.oilId}
                          onChange={(e) => handleUpdateOilId(idx, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-100 font-medium focus:outline-none focus:border-amber-400 flex-1"
                        >
                          {oils.map((oil) => (
                            <option key={oil.id} value={oil.id}>
                              {getLocalizedOilName(oil.name, language)} ({oil.code}) - {oil.currentQuantity} {t('ml')} - ${oil.unitCost.toFixed(3)}/{t('ml')}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Percentage of the fragrance fraction */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {language === 'ar' ? 'نسبته بالخلطة:' : 'Blend ratio:'}
                        </span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={sel.percentage}
                            disabled={isSingle}
                            onChange={(e) => handleUpdateOilPercentage(idx, parseFloat(e.target.value) || 0)}
                            className={`w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-xs font-bold text-amber-400 ${
                              isSingle ? 'opacity-70 cursor-not-allowed' : 'focus:border-amber-400'
                            }`}
                          />
                          <span className={`text-xs font-bold text-slate-400 ${language === 'ar' ? 'mr-1' : 'ml-1'}`}>%</span>
                        </div>

                        {!isSingle && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOil(idx)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Calculated values for this oil */}
                    {calcOil && selectedOil && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 bg-slate-900/70 p-2.5 rounded-lg text-center text-xs border border-slate-800">
                          <div>
                            <div className="text-[11px] text-slate-400">
                              {language === 'ar' ? 'الكمية المطلوبة:' : 'Required Volume:'}
                            </div>
                            <div className="text-sm font-black text-amber-300">
                              {calcOil.volumeMl} <span className="text-[10px] text-slate-400 font-normal">{t('ml')}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] text-slate-400">
                              {language === 'ar' ? 'الوزن المقدر:' : 'Estimated Weight:'}
                            </div>
                            <div className="text-sm font-black text-slate-200">
                              {calcOil.weightG} <span className="text-[10px] text-slate-400 font-normal">{t('gram')}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] text-slate-400">
                              {language === 'ar' ? 'تكلفة الزيت:' : 'Oil Cost:'}
                            </div>
                            <div className="text-sm font-black text-emerald-400">
                              ${calcOil.cost.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* In-place raw material price input ("وضع أسعار المواد الأولية") */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-700/60 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-bold text-[11px]">
                              {language === 'ar' ? 'سعر تكلفة الملي ($/مل):' : 'Raw Oil Unit Cost ($/ml):'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({language === 'ar' ? 'الافتراضي:' : 'Default:'} ${selectedOil ? selectedOil.unitCost.toFixed(3) : '0.070'})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.005"
                              min="0"
                              placeholder={String(selectedOil?.unitCost ?? 0.07)}
                              value={sel.customUnitCost !== undefined ? sel.customUnitCost : (selectedOil ? selectedOil.unitCost : '')}
                              onChange={(e) => handleUpdateOilUnitCost(idx, e.target.value)}
                              className="w-24 bg-slate-900 border border-amber-500/40 rounded-lg px-2 py-1 text-xs text-center font-mono font-black text-amber-300 focus:border-amber-400 focus:outline-none"
                            />
                            {sel.customUnitCost !== undefined && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = [...oilSelections];
                                  next[idx] = { ...next[idx], customUnitCost: undefined };
                                  setOilSelections(next);
                                }}
                                className="p-1 text-slate-400 hover:text-amber-300 rounded cursor-pointer"
                                title={language === 'ar' ? 'استعادة السعر القياسي' : 'Reset to default'}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 4: Solvents, Fixatives & Packaging Components */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">4</span>
              <h3 className="text-base font-bold text-slate-100">
                {language === 'ar' ? 'الكحول والمثبت ومستلزمات التعبئة' : 'Alcohol, Fixatives & Packaging Materials'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Alcohol Selector */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {language === 'ar' ? 'كحول العطور:' : 'Perfumer Alcohol:'}
                </label>
                <select
                  value={selectedAlcoholId}
                  onChange={(e) => setSelectedAlcoholId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  {alcoholList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {getLocalizedMaterialName(a.name, language)} (${a.unitCost.toFixed(3)}/{t('ml')})
                    </option>
                  ))}
                </select>
                <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>{language === 'ar' ? 'المطلوب للزجاجة:' : 'Per bottle:'}</span>
                  <span className="font-bold text-amber-300">{formula.alcoholVolumeMl} {t('ml')}</span>
                </div>
                {/* In-place price input */}
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-700/60">
                  <span className="text-slate-400">{language === 'ar' ? 'سعر الملي ($/مل):' : 'Cost/ml ($):'}</span>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    placeholder={String(alcoholList.find(a => a.id === selectedAlcoholId)?.unitCost || 0.05)}
                    value={customAlcoholCost}
                    onChange={(e) => setCustomAlcoholCost(e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-amber-300 font-mono text-center focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Fixative Selector & % */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    {language === 'ar' ? 'المثبت / المحسن:' : 'Fixative Modifier:'}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={fixativePercent}
                      onChange={(e) => setFixativePercent(parseFloat(e.target.value) || 0)}
                      className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-amber-400 font-bold"
                    />
                    <span className="text-[10px] text-slate-400">%</span>
                  </div>
                </div>
                <select
                  value={selectedFixativeId}
                  onChange={(e) => setSelectedFixativeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  {fixativesList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {getLocalizedMaterialName(f.name, language)} (${f.unitCost.toFixed(3)}/{t('ml')})
                    </option>
                  ))}
                </select>
                <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>{language === 'ar' ? 'المطلوب للزجاجة:' : 'Per bottle:'}</span>
                  <span className="font-bold text-amber-300">{formula.fixativeVolumeMl} {t('ml')}</span>
                </div>
                {/* In-place price input */}
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-700/60">
                  <span className="text-slate-400">{language === 'ar' ? 'سعر الملي ($/مل):' : 'Cost/ml ($):'}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={String(fixativesList.find(f => f.id === selectedFixativeId)?.unitCost || 0.18)}
                    value={customFixativeCost}
                    onChange={(e) => setCustomFixativeCost(e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-amber-300 font-mono text-center focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bottle Selection */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {language === 'ar' ? 'نوع الزجاجة:' : 'Bottle Type:'}
                </label>
                <select
                  value={selectedBottleId}
                  onChange={(e) => setSelectedBottleId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  {bottlesList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {getLocalizedMaterialName(b.name, language)} (${b.unitCost.toFixed(2)}/{t('piece')})
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-400 pt-0.5">
                  {language === 'ar' ? 'سعر الزجاجة:' : 'Bottle cost:'}{' '}
                  <span className="font-bold text-slate-200">${formula.bottleCost.toFixed(2)}</span>
                </div>
                {/* In-place price input */}
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-700/60">
                  <span className="text-slate-400">{language === 'ar' ? 'سعر الزجاجة ($/قطعة):' : 'Bottle Cost ($):'}</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    placeholder={String(bottlesList.find(b => b.id === selectedBottleId)?.unitCost || 1.35)}
                    value={customBottleCost}
                    onChange={(e) => setCustomBottleCost(e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-amber-300 font-mono text-center focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sprayer Selection */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {language === 'ar' ? 'البخاخ والغطاء:' : 'Sprayer & Cap:'}
                </label>
                <select
                  value={selectedSprayerId}
                  onChange={(e) => setSelectedSprayerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  {sprayersList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {getLocalizedMaterialName(s.name, language)} (${s.unitCost.toFixed(2)}/{t('piece')})
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-400 pt-0.5">
                  {language === 'ar' ? 'سعر البخاخ:' : 'Sprayer cost:'}{' '}
                  <span className="font-bold text-slate-200">${formula.sprayerCost.toFixed(2)}</span>
                </div>
                {/* In-place price input */}
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-700/60">
                  <span className="text-slate-400">{language === 'ar' ? 'سعر البخاخ ($/قطعة):' : 'Sprayer Cost ($):'}</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    placeholder={String(sprayersList.find(s => s.id === selectedSprayerId)?.unitCost || 0.40)}
                    value={customSprayerCost}
                    onChange={(e) => setCustomSprayerCost(e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-amber-300 font-mono text-center focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Packaging / Box Selection */}
              <div className="sm:col-span-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {language === 'ar' ? 'علبة التغليف والملصقات:' : 'Packaging Box & Label:'}
                </label>
                <select
                  value={selectedPackagingId}
                  onChange={(e) => setSelectedPackagingId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="">
                    {language === 'ar' ? 'بدون علبة تغليف إضافية ($0.00)' : 'No extra packaging box ($0.00)'}
                  </option>
                  {packagingList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {getLocalizedMaterialName(p.name, language)} (${p.unitCost.toFixed(2)}/{t('piece')})
                    </option>
                  ))}
                </select>
                {/* In-place price input */}
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-700/60">
                  <span className="text-slate-400">{language === 'ar' ? 'سعر علبة التغليف ($/قطعة):' : 'Packaging Box Cost ($):'}</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    placeholder={String(packagingList.find(p => p.id === selectedPackagingId)?.unitCost || 0.00)}
                    value={customPackagingCost}
                    onChange={(e) => setCustomPackagingCost(e.target.value)}
                    className="w-24 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-amber-300 font-mono text-center focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SECTION: LIVE VISUALIZER & DETAILED SUMMARY (5 COLS) ================= */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Visual Bottle & Breakdown Card */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div>
                <h3 className="text-lg font-black text-amber-200 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-amber-400" />
                  {language === 'ar' ? 'تشريح تركيبة الزجاجة' : 'Bottle Formulation Anatomy'}
                </h3>
                <p className="text-xs text-slate-400">
                  {bottleCapacityMl} {t('ml')} - {concentrationPercent}% {language === 'ar' ? 'تركيز' : 'Conc.'}
                </p>
              </div>
              <div className={language === 'ar' ? 'text-left' : 'text-right'}>
                <span className="text-xs text-slate-400 block">{language === 'ar' ? 'إجمالي الكمية' : 'Total Volume'}</span>
                <span className="text-xl font-black text-amber-400">{bottleCapacityMl} {t('ml')}</span>
              </div>
            </div>

            {/* Visual Perfume Bottle & Product Preview */}
            <div className="space-y-4 py-2">
              {/* Product Showcase Card */}
              {primaryOil && (
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-500/30 bg-slate-900 shrink-0 relative">
                    {primaryOil.imageUrl ? (
                      <img src={primaryOil.imageUrl} alt={primaryOil.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-400">
                        <Droplet className="w-6 h-6" />
                      </div>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/90 text-center text-[9px] font-bold text-amber-300 py-0.5">
                      {bottleCapacityMl} {t('ml')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {primaryOil.code}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {primaryOil.brand.includes('تشكيلة نسمات الخاصة') ? '✨ Nasamat Signature' : primaryOil.brand}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 truncate mt-0.5">
                      {getLocalizedOilName(primaryOil.name, language)}
                    </h4>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                      <span>{language === 'ar' ? 'سعر البيع المدور:' : 'Rounded Retail Price:'}</span>
                      <strong className="text-emerald-400 font-mono font-bold">${formula.suggestedRetailPrice.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Perfume Liquid Layer Cylinder */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-36 h-56 rounded-3xl border-4 border-amber-500/40 bg-slate-950/80 p-2 shadow-2xl flex flex-col justify-end overflow-hidden">
                  {/* Cap & Sprayer Representation */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-6 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 rounded-t-lg border-2 border-amber-300" />
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-3 bg-amber-600 rounded-sm" />

                  {/* Layer 1: Fragrance Oil Layer (Top) */}
                  <div 
                    style={{ height: `${concentrationPercent}%` }}
                    className="w-full bg-gradient-to-b from-amber-400 to-amber-600 transition-all duration-500 flex items-center justify-center relative group"
                  >
                    <span className="text-[10px] font-black text-slate-950 bg-amber-300/80 px-1 rounded shadow-sm">
                      {language === 'ar' ? 'زيت:' : 'Oil:'} {formula.totalOilVolumeMl} {t('ml')} ({concentrationPercent}%)
                    </span>
                  </div>

                  {/* Layer 2: Fixative Layer (Middle) */}
                  {formula.fixativeVolumeMl > 0 && (
                    <div 
                      style={{ height: `${Math.max(4, fixativePercent * 1.5)}%` }}
                      className="w-full bg-rose-400/80 transition-all duration-500 flex items-center justify-center border-t border-b border-rose-300/40"
                    >
                      <span className="text-[8px] font-black text-slate-950 px-1">
                        {language === 'ar' ? 'مثبت:' : 'Fix:'} {formula.fixativeVolumeMl} {t('ml')}
                      </span>
                    </div>
                  )}

                  {/* Layer 3: Alcohol Solvent Layer (Bottom) */}
                  <div 
                    className="w-full flex-1 bg-gradient-to-t from-sky-600/70 via-sky-500/50 to-sky-400/40 transition-all duration-500 flex items-center justify-center"
                  >
                    <span className="text-[10px] font-black text-sky-100 bg-sky-950/60 px-1 rounded">
                      {language === 'ar' ? 'كحول:' : 'Alcohol:'} {formula.alcoholVolumeMl} {t('ml')}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 text-center">
                  {language === 'ar' ? 'الكثافة المعتمدة: ~0.95 جم/مل | إجمالي وزن الزيت:' : 'Standard Density: ~0.95 g/ml | Total Oil Weight:'}{' '}
                  <strong className="text-amber-300">{formula.totalOilWeightG} {t('gram')}</strong>
                </div>
              </div>
            </div>

            {/* Detailed Component Breakdown Table */}
            <div className="mt-5 space-y-2 border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-900">
                {language === 'ar' ? 'تفاصيل المكونات والتكلفة بالمل:' : 'Component Volumes & Cost per Bottle:'}
              </h4>

              <div className="space-y-1.5 text-xs">
                {formula.oils.map((o, i) => {
                  const oilInfo = oils.find((item) => item.id === o.oilId);
                  return (
                    <div key={i} className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-100/90 border border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Droplet className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-slate-900 font-bold">
                          {oilInfo ? getLocalizedOilName(oilInfo.name, language) : 'Fragrance Oil'}:
                        </span>
                        <span className="text-amber-700 font-black">{o.volumeMl} {t('ml')} ({o.weightG} {t('gram')})</span>
                      </div>
                      <span className="text-slate-900 font-black">${o.cost.toFixed(2)}</span>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-100/90 border border-slate-200">
                  <span className="text-slate-900 font-bold">
                    {language === 'ar' ? 'كحول العطور' : 'Perfumer Alcohol'} ({formula.alcoholVolumeMl} {t('ml')}):
                  </span>
                  <span className="text-slate-900 font-black">${formula.alcoholCost.toFixed(2)}</span>
                </div>

                {formula.fixativeVolumeMl > 0 && (
                  <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-100/90 border border-slate-200">
                    <span className="text-slate-900 font-bold">
                      {language === 'ar' ? 'المثبت' : 'Fixative'} ({formula.fixativeVolumeMl} {t('ml')}):
                    </span>
                    <span className="text-slate-900 font-black">${formula.fixativeCost.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-100/90 border border-slate-200">
                  <span className="text-slate-900 font-bold">
                    {language === 'ar' ? 'الزجاجة + البخاخ + التغليف:' : 'Bottle + Sprayer + Packaging:'}
                  </span>
                  <span className="text-slate-900 font-black">
                    ${(formula.bottleCost + formula.sprayerCost + formula.packagingCost).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Cost & Suggested Price Card with Benchmark Margin & Decimal Rounding */}
            <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3.5">
              
              {/* 1. Total Raw Materials Cost */}
              <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs text-amber-200/90 font-bold block">
                    {language === 'ar' ? 'إجمالي تكلفة المواد الأولية للزجاجة:' : 'Total Raw Materials Cost / Bottle:'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'ar' ? 'مجموع الزيوت والكحول والمثبت والعبوة والبخاخ والتغليف' : 'Sum of oils, solvent, fixative & packaging'}
                  </span>
                </div>
                <span className="text-xl font-black text-amber-400 font-mono">
                  ${formula.totalCostPerBottle.toFixed(2)}
                </span>
              </div>

              {/* 2. Ready-Bottle Profit Margin Benchmark Badge & Mode Toggle */}
              <div className="bg-slate-950/90 p-3.5 rounded-xl border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-200">
                      {language === 'ar' ? 'نسبة ربح العبوات الجاهزة:' : 'Ready-Made Bottle Margin:'}
                    </span>
                  </div>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                    {formula.benchmarkMarginPercent || 64}% {language === 'ar' ? 'هامش ربح' : 'Margin'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'تطبيق نسبة العبوات الجاهزة تلقائياً:' : 'Auto apply ready bottles margin:'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useReadyBottleMargin}
                      onChange={(e) => setUseReadyBottleMargin(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>

                {/* Custom margin slider if user unchecks ready bottle margin */}
                {!useReadyBottleMargin && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">
                        {language === 'ar' ? `تحديد هامش مخصص (${profitMargin}%):` : `Custom markup (${profitMargin}%):`}
                      </span>
                      <span className="font-bold text-amber-300 font-mono">{profitMargin}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="90"
                      step="5"
                      value={profitMargin}
                      onChange={(e) => setProfitMargin(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* 3. Price Decimal Rounding ("تدوير الفواصل السعرية") */}
              <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'ar' ? 'تدوير الفواصل السعرية:' : 'Price Fraction Rounding:'}</span>
                  </span>
                  {formula.unroundedPrice !== undefined && formula.unroundedPrice !== formula.suggestedRetailPrice && (
                    <span className="text-[11px] font-mono text-slate-400">
                      {language === 'ar' ? 'قبل التدوير:' : 'Before rounding:'} <span className="line-through text-slate-500">${formula.unroundedPrice.toFixed(2)}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setRoundingMode('whole')}
                    className={`p-2 rounded-lg text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      roundingMode === 'whole'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700/80 font-bold'
                    }`}
                  >
                    <span className="text-[11px]">{language === 'ar' ? '$1.00' : '$1.00'}</span>
                    <span className="text-[9px] opacity-75">{language === 'ar' ? 'صحيح' : 'Whole'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoundingMode('half')}
                    className={`p-2 rounded-lg text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      roundingMode === 'half'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700/80 font-bold'
                    }`}
                  >
                    <span className="text-[11px]">{language === 'ar' ? '$0.50' : '$0.50'}</span>
                    <span className="text-[9px] opacity-75">{language === 'ar' ? 'نصف دولار' : 'Half'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoundingMode('ceil_whole')}
                    className={`p-2 rounded-lg text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      roundingMode === 'ceil_whole'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700/80 font-bold'
                    }`}
                  >
                    <span className="text-[11px]">{language === 'ar' ? 'للأعلى' : 'Ceil'}</span>
                    <span className="text-[9px] opacity-75">{language === 'ar' ? 'حماية' : 'Protect'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoundingMode('none')}
                    className={`p-2 rounded-lg text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      roundingMode === 'none'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700/80 font-bold'
                    }`}
                  >
                    <span className="text-[11px]">{language === 'ar' ? 'دقيق' : 'Raw'}</span>
                    <span className="text-[9px] opacity-75">{language === 'ar' ? 'فواصل' : 'Cents'}</span>
                  </button>
                </div>
              </div>

              {/* 4. Final Total Selling Price Hero Card */}
              <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/60 p-4 rounded-2xl border-2 border-emerald-500/50 space-y-2.5 shadow-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                      {language === 'ar' ? 'المجموع النهائي لسعر البيع (مدور):' : 'Final Total Selling Price (Rounded):'}
                    </span>
                    <span className="text-xs text-slate-300">
                      {language === 'ar' ? `تركيبة ${bottleCapacityMl} مل (${concentrationPercent}% تركيز)` : `${bottleCapacityMl}ml Formula (${concentrationPercent}%)`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                      ${formula.suggestedRetailPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2">
                  <span className="text-slate-300 font-medium">
                    {language === 'ar' ? 'صافي الربح الفعلي للزجاجة:' : 'Actual Net Profit / Bottle:'}
                  </span>
                  <div className={`font-mono ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                    <span className="font-black text-emerald-300">+${formula.profitPerBottle.toFixed(2)}</span>
                    <span className={`text-[11px] font-bold text-amber-400 ${language === 'ar' ? 'mr-1.5' : 'ml-1.5'}`}>
                      ({formula.profitMarginPercent}% {language === 'ar' ? 'هامش' : 'margin'})
                    </span>
                  </div>
                </div>

                {/* Catalog Ready Bottle Reference */}
                <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-800/60 text-slate-400">
                  <span>{language === 'ar' ? 'سعر الكتالوج المرجعي للخلطة:' : 'Catalog Reference Price:'}</span>
                  <strong className="text-slate-200 font-mono">${weightedCatalogPrice.toFixed(2)}</strong>
                </div>

                {/* All Sizes Reference */}
                {primaryOil && (
                  <div className="grid grid-cols-4 gap-1 pt-1 text-center font-mono text-[10px]">
                    <div className="bg-slate-900/90 p-1 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">30ml</span>
                      <strong className="text-emerald-400">${(primaryOil.retailPrice30ml || 5).toFixed(2)}</strong>
                    </div>
                    <div className="bg-amber-500/10 p-1 rounded border border-amber-500/30">
                      <span className="text-amber-300 block text-[9px]">50ml ⭐</span>
                      <strong className="text-amber-400">${(primaryOil.retailPrice50ml || 7).toFixed(2)}</strong>
                    </div>
                    <div className="bg-slate-900/90 p-1 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">100ml</span>
                      <strong className="text-sky-400">${(primaryOil.retailPrice100ml || 12).toFixed(2)}</strong>
                    </div>
                    <div className="bg-purple-500/10 p-1 rounded border border-purple-500/30">
                      <span className="text-purple-300 block text-[9px]">{language === 'ar' ? 'جملة' : 'Wholesale'}</span>
                      <strong className="text-purple-300">${(primaryOil.wholesalePrice50ml || 4.5).toFixed(2)}</strong>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Production Batch & Stock Deduction Section */}
            <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">
                  {language === 'ar' ? 'عدد الزجاجات المراد إنتاجها:' : 'Number of bottles to produce:'}
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setBottlesToProduce(Math.max(1, bottlesToProduce - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={bottlesToProduce}
                    onChange={(e) => setBottlesToProduce(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-amber-400 text-sm py-1"
                  />
                  <button
                    type="button"
                    onClick={() => setBottlesToProduce(bottlesToProduce + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Batch Financials */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <div className="text-slate-400 text-[11px]">
                    {language === 'ar' ? 'إجمالي تكلفة التشغيلة:' : 'Total Batch Cost:'}
                  </div>
                  <div className="text-sm font-black text-amber-300">
                    ${(formula.totalCostPerBottle * bottlesToProduce).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">
                    {language === 'ar' ? 'إجمالي الأرباح المتوقعة:' : 'Expected Net Profit:'}
                  </div>
                  <div className="text-sm font-black text-emerald-400">
                    +${(actualProfit * bottlesToProduce).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Inventory Warnings if not enough stock */}
              {!inventoryCheck.canProduce && (
                <div className="bg-rose-500/10 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>{t('calcStockWarning')}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-200/90 pr-2">
                    {inventoryCheck.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={!inventoryCheck.canProduce}
                  onClick={handleConfirmProduction}
                  className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    inventoryCheck.canProduce
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{t('calcExecuteBtn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const tempBatch: ProductionBatch = {
                      id: `temp-${Date.now()}`,
                      batchNumber: `LABEL-${String(Date.now()).slice(-4)}`,
                      formula,
                      bottlesCount: bottlesToProduce,
                      totalBatchCost: formula.totalCostPerBottle * bottlesToProduce,
                      totalExpectedRevenue: formula.suggestedRetailPrice * bottlesToProduce,
                      totalExpectedProfit: formula.profitPerBottle * bottlesToProduce,
                      createdAt: new Date().toISOString(),
                    };
                    onPrintRecipe(tempBatch);
                  }}
                  className="py-3 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title={t('calcPrintRecipeBtn')}
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">{language === 'ar' ? 'طباعة الملصق' : 'Print Card'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Save Current Formulation as Recipe Modal */}
      {isSaveRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {t('recipeSaveModalTitle')}
                </h3>
              </div>
              <button
                onClick={() => setIsSaveRecipeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Blend Summary Pill */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span>{language === 'ar' ? 'مواصفات الخلطة الحالية:' : 'Current Formulation:'}</span>
                <span className="text-amber-400 font-bold">{bottleCapacityMl}ml • {concentrationPercent}% ({tier.toUpperCase()})</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {oilSelections.map((sel, i) => {
                  const o = oils.find((item) => item.id === sel.oilId);
                  return (
                    <span key={i} className="bg-slate-900 border border-slate-700/80 text-slate-300 px-2 py-0.5 rounded-md text-[11px]">
                      {o ? getLocalizedOilName(o.name, language) : 'Oil'} ({sel.percentage}%)
                    </span>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleConfirmSaveRecipe} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('recipeNameAr')} *
                  </label>
                  <input
                    type="text"
                    value={recipeDraftName}
                    onChange={(e) => setRecipeDraftName(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('recipeNameEn')}
                  </label>
                  <input
                    type="text"
                    value={recipeDraftNameEn}
                    onChange={(e) => setRecipeDraftNameEn(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('recipeCategory')}
                  </label>
                  <select
                    value={recipeDraftCategory}
                    onChange={(e) => setRecipeDraftCategory(e.target.value as RecipeCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="signature">خلطات نسمات الحصرية</option>
                    <option value="men">رجالي</option>
                    <option value="women">نسائي</option>
                    <option value="unisex">للجنسين</option>
                    <option value="oriental">عود وشرقي</option>
                    <option value="fresh">منعش وصيفي</option>
                    <option value="gourmand">غورماند</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('recipeRetailPrice')}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={recipeDraftPrice}
                    onChange={(e) => setRecipeDraftPrice(parseFloat(e.target.value) || 18)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-emerald-400 font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('recipeTargetGender')}
                  </label>
                  <select
                    value={recipeDraftGender}
                    onChange={(e) => setRecipeDraftGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="unisex">{t('genderUnisex')}</option>
                    <option value="men">{t('genderMen')}</option>
                    <option value="women">{t('genderWomen')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('recipeSeason')}
                  </label>
                  <select
                    value={recipeDraftSeason}
                    onChange={(e) => setRecipeDraftSeason(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="all">{t('seasonAll')}</option>
                    <option value="summer">{t('seasonSummer')}</option>
                    <option value="winter">{t('seasonWinter')}</option>
                    <option value="autumn">{t('seasonAutumn')}</option>
                    <option value="spring">{t('seasonSpring')}</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('recipeScentPyramid')}
                  </label>
                  <input
                    type="text"
                    value={recipeDraftNotes}
                    onChange={(e) => setRecipeDraftNotes(e.target.value)}
                    placeholder="قمة: برغموت، زعفران | قلب: ياسمين | قاعدة: عنبر، خشب الأرز..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSaveRecipeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-bold transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!recipeDraftName.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t('save')}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Perfume Caliber & Ratio Calculator Modal */}
      {isAdvancedModalOpen && (
        <PerfumeCaliberCalculatorModal
          isOpen={isAdvancedModalOpen}
          onClose={() => setIsAdvancedModalOpen(false)}
          oils={oils}
          materials={materials}
          settings={settings}
          onSaveRecipe={onSaveRecipe}
          initialOilId={oilSelections[0]?.oilId}
        />
      )}

    </div>
  );
};
