import React, { useState, useMemo, useEffect } from 'react';
import type { 
  FragranceOil, 
  RawMaterial, 
  AppSettings, 
  ConcentrationTier, 
  SavedRecipe,
  CartItem
} from '../types';
import { 
  FlaskConical, 
  Droplet, 
  Sliders, 
  Percent, 
  DollarSign, 
  Printer, 
  X, 
  Check, 
  Sparkles, 
  Copy, 
  ShoppingBag, 
  Layers, 
  Plus, 
  Trash2, 
  Bookmark,
  RotateCcw
} from './icons';
import { useLanguage } from '../context/LanguageContext';
import { CONCENTRATION_TIERS } from '../utils/calculator';
import { getLocalizedTier } from '../utils/i18n';

export interface PerfumeCaliberCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  oils: FragranceOil[];
  materials?: RawMaterial[];
  settings: AppSettings;
  onAddToCart?: (item: CartItem) => void;
  onSaveRecipe?: (recipe: SavedRecipe) => void;
  initialOilId?: string;
}

// Standard artisan & commercial bottle sizes in ml
const STANDARD_SIZES = [
  { ml: 10, labelAr: '10 مل (تستر / عينة)', labelEn: '10ml (Sample / Pocket)', badgeAr: 'عينة', badgeEn: 'Sample' },
  { ml: 15, labelAr: '15 مل (حجم السفر)', labelEn: '15ml (Travel)', badgeAr: 'ترافل', badgeEn: 'Travel' },
  { ml: 20, labelAr: '20 مل (صغير)', labelEn: '20ml (Mini)', badgeAr: 'ميني', badgeEn: 'Mini' },
  { ml: 30, labelAr: '30 مل (حقيبة / جيب)', labelEn: '30ml (Pocket)', badgeAr: 'يومي', badgeEn: 'Pocket' },
  { ml: 50, labelAr: '50 مل (الحجم الكلاسيكي)', labelEn: '50ml (Classic Standard)', badgeAr: 'الأكثر طلباً', badgeEn: 'Popular' },
  { ml: 100, labelAr: '100 مل (الحجم الملكي)', labelEn: '100ml (Royal Flacon)', badgeAr: 'ملكي فاخر', badgeEn: 'Royal' },
  { ml: 250, labelAr: '250 مل (عبوة ريفيل)', labelEn: '250ml (Refill Flacon)', badgeAr: 'ريفيل', badgeEn: 'Refill' },
  { ml: 500, labelAr: '500 مل (نصف لتر معملي)', labelEn: '500ml (Lab Flask)', badgeAr: 'معملي', badgeEn: 'Lab' },
  { ml: 1000, labelAr: '1000 مل (1 لتر تشغيلة)', labelEn: '1000ml (1L Master Batch)', badgeAr: '1 لتر', badgeEn: '1 Liter' },
];

export const PerfumeCaliberCalculatorModal: React.FC<PerfumeCaliberCalculatorModalProps> = ({
  isOpen,
  onClose,
  oils,
  materials = [],
  settings,
  onAddToCart,
  onSaveRecipe,
  initialOilId,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // 1. Bottle Size State
  const [bottleCapacityMl, setBottleCapacityMl] = useState<number>(50);
  const [isCustomCapacity, setIsCustomCapacity] = useState<boolean>(false);
  const [customCapacityInput, setCustomCapacityInput] = useState<string>('');

  // 1.1 Calculation Input Mode
  // 'percent' = Concentration % mode
  // 'direct_ml' = Manual direct milliliter input
  // 'direct_grams' = Manual direct digital scale weight in grams
  const [calcMode, setCalcMode] = useState<'percent' | 'direct_ml' | 'direct_grams'>('percent');

  // Direct manual inputs
  const [directOilMlInput, setDirectOilMlInput] = useState<string>('15');
  const [directFixativeMlInput, setDirectFixativeMlInput] = useState<string>('0.75');
  const [directWaterMlInput, setDirectWaterMlInput] = useState<string>('0');

  const [directOilGramsInput, setDirectOilGramsInput] = useState<string>('14.25');
  const [directFixativeGramsInput, setDirectFixativeGramsInput] = useState<string>('0.75');
  const [directWaterGramsInput, setDirectWaterGramsInput] = useState<string>('0');

  // Manual custom oil override (free text entry without database selection)
  const [isManualCustomOil, setIsManualCustomOil] = useState<boolean>(false);
  const [manualOilName, setManualOilName] = useState<string>('');
  const [manualOilDensity, setManualOilDensity] = useState<string>('0.95');

  // 2. Caliber / Grade State
  const [tier, setTier] = useState<ConcentrationTier>('extrait');
  const [oilConcentrationPercent, setOilConcentrationPercent] = useState<number>(30);

  // 3. Additional Component Ratios (%)
  const [fixativePercent, setFixativePercent] = useState<number>(settings.defaultFixativePercent || 1.5);
  const [waterPercent, setWaterPercent] = useState<number>(0); // Distilled water / DPG

  // 4. Batch Multiplier (Number of bottles to formulate/compound)
  const [batchCount, setBatchCount] = useState<number>(1);

  // 5. Selected Perfume Oil
  const [selectedOilId, setSelectedOilId] = useState<string>(initialOilId || oils[0]?.id || '');
  const [customBlendName, setCustomBlendName] = useState<string>('');
  const [customOilCostPerMl, setCustomOilCostPerMl] = useState<string>('');

  // 6. Multi-Oil Blend mode
  const [isBlendMode, setIsBlendMode] = useState<boolean>(false);
  const [blendItems, setBlendItems] = useState<{ oilId: string; sharePercent: number }[]>([
    { oilId: initialOilId || oils[0]?.id || '', sharePercent: 100 },
  ]);

  // Feedback states
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [addedToCartSuccess, setAddedToCartSuccess] = useState<boolean>(false);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Find active primary oil
  const activeOil = useMemo(() => {
    return oils.find((o) => o.id === selectedOilId) || oils[0];
  }, [oils, selectedOilId]);

  // Exchange rate
  const exchangeRate = settings.lbpRate || 89500;

  // Change tier handler
  const handleSelectTier = (newTier: ConcentrationTier) => {
    setTier(newTier);
    if (newTier === 'pure_oil') {
      setOilConcentrationPercent(100);
      setFixativePercent(0);
      setWaterPercent(0);
    } else if (newTier === 'extrait') {
      setOilConcentrationPercent(30);
    } else if (newTier === 'edp') {
      setOilConcentrationPercent(22);
    } else if (newTier === 'edt') {
      setOilConcentrationPercent(12);
    } else if (newTier === 'edc') {
      setOilConcentrationPercent(5);
    }
  };

  // Calculate remainder alcohol percent automatically
  const alcoholPercent = useMemo(() => {
    const totalOthers = oilConcentrationPercent + fixativePercent + waterPercent;
    return Math.max(0, Number((100 - totalOthers).toFixed(1)));
  }, [oilConcentrationPercent, fixativePercent, waterPercent]);

  // Auto-balance button to snap alcohol to exact 100%
  const handleAutoBalanceAlcohol = () => {
    const others = oilConcentrationPercent + fixativePercent + waterPercent;
    if (others > 100) {
      // Scale down proportionally
      const diff = others - 100;
      setOilConcentrationPercent((prev) => Math.max(1, prev - diff));
    }
  };

  // Handler for switching modes smoothly and syncing inputs
  const handleSwitchMode = (newMode: 'percent' | 'direct_ml' | 'direct_grams') => {
    if (newMode === 'direct_ml') {
      setDirectOilMlInput(singleBottleMeasures.oilMl.toString());
      setDirectFixativeMlInput(singleBottleMeasures.fixativeMl.toString());
      setDirectWaterMlInput(singleBottleMeasures.waterMl.toString());
    } else if (newMode === 'direct_grams') {
      setDirectOilGramsInput(singleBottleMeasures.oilGrams.toString());
      setDirectFixativeGramsInput(singleBottleMeasures.fixativeGrams.toString());
      setDirectWaterGramsInput(singleBottleMeasures.waterGrams.toString());
    } else if (newMode === 'percent') {
      setOilConcentrationPercent(singleBottleMeasures.effectiveOilPercent);
      setFixativePercent(singleBottleMeasures.effectiveFixativePercent);
      setWaterPercent(singleBottleMeasures.effectiveWaterPercent);
    }
    setCalcMode(newMode);
  };

  // Calculations: Volumes (ml) & Weights (grams) per single bottle
  const singleBottleMeasures = useMemo(() => {
    // 1. Densities:
    const oilDensity = isManualCustomOil 
      ? (parseFloat(manualOilDensity) || 0.95)
      : (activeOil?.density || settings.defaultOilDensity || 0.95);
    const alcoholDensity = 0.81; // 96° perfumer alcohol density
    const fixativeDensity = 1.00;
    const waterDensity = 1.00;

    let oilMl = 0;
    let fixativeMl = 0;
    let waterMl = 0;
    let oilGrams = 0;
    let fixativeGrams = 0;
    let waterGrams = 0;

    if (calcMode === 'percent') {
      oilMl = Number((bottleCapacityMl * (oilConcentrationPercent / 100)).toFixed(2));
      fixativeMl = Number((bottleCapacityMl * (fixativePercent / 100)).toFixed(2));
      waterMl = Number((bottleCapacityMl * (waterPercent / 100)).toFixed(2));
      oilGrams = Number((oilMl * oilDensity).toFixed(2));
      fixativeGrams = Number((fixativeMl * fixativeDensity).toFixed(2));
      waterGrams = Number((waterMl * waterDensity).toFixed(2));
    } else if (calcMode === 'direct_ml') {
      oilMl = Number(Math.max(0, parseFloat(directOilMlInput) || 0).toFixed(2));
      fixativeMl = Number(Math.max(0, parseFloat(directFixativeMlInput) || 0).toFixed(2));
      waterMl = Number(Math.max(0, parseFloat(directWaterMlInput) || 0).toFixed(2));
      oilGrams = Number((oilMl * oilDensity).toFixed(2));
      fixativeGrams = Number((fixativeMl * fixativeDensity).toFixed(2));
      waterGrams = Number((waterMl * waterDensity).toFixed(2));
    } else { // direct_grams
      oilGrams = Number(Math.max(0, parseFloat(directOilGramsInput) || 0).toFixed(2));
      fixativeGrams = Number(Math.max(0, parseFloat(directFixativeGramsInput) || 0).toFixed(2));
      waterGrams = Number(Math.max(0, parseFloat(directWaterGramsInput) || 0).toFixed(2));
      oilMl = Number((oilDensity > 0 ? oilGrams / oilDensity : 0).toFixed(2));
      fixativeMl = Number((fixativeDensity > 0 ? fixativeGrams / fixativeDensity : 0).toFixed(2));
      waterMl = Number((waterDensity > 0 ? waterGrams / waterDensity : 0).toFixed(2));
    }

    // Alcohol volume in ml (remainder to complete the bottle capacity)
    const alcoholMl = Number(Math.max(0, bottleCapacityMl - oilMl - fixativeMl - waterMl).toFixed(2));
    const alcoholGrams = Number((alcoholMl * alcoholDensity).toFixed(2));
    const totalGrams = Number((oilGrams + alcoholGrams + fixativeGrams + waterGrams).toFixed(2));

    // Dynamic percentages:
    const effectiveOilPercent = calcMode === 'percent'
      ? oilConcentrationPercent
      : (bottleCapacityMl > 0 ? Number(((oilMl / bottleCapacityMl) * 100).toFixed(1)) : 0);

    const effectiveFixativePercent = calcMode === 'percent'
      ? fixativePercent
      : (bottleCapacityMl > 0 ? Number(((fixativeMl / bottleCapacityMl) * 100).toFixed(1)) : 0);

    const effectiveWaterPercent = calcMode === 'percent'
      ? waterPercent
      : (bottleCapacityMl > 0 ? Number(((waterMl / bottleCapacityMl) * 100).toFixed(1)) : 0);

    const effectiveAlcoholPercent = bottleCapacityMl > 0
      ? Number(Math.max(0, 100 - effectiveOilPercent - effectiveFixativePercent - effectiveWaterPercent).toFixed(1))
      : 0;

    // 4. Raw Material Cost Calculations
    const oilCostPerMl = customOilCostPerMl !== '' 
      ? parseFloat(customOilCostPerMl) || 0.07 
      : (activeOil?.costPerMl || activeOil?.unitCost || 0.07);
    
    const oilCost = Number((oilMl * oilCostPerMl).toFixed(2));
    const alcoholCost = Number((alcoholMl * 0.05).toFixed(2)); // estimated $0.05/ml for perfumer alcohol
    const fixativeCost = Number((fixativeMl * 0.15).toFixed(2)); // estimated $0.15/ml for pure fixative
    const waterCost = 0.01;

    // Flacon packaging cost (Bottle + fine mist pump + luxury cap + box)
    let bottlePackagingCost = 1.10;
    if (bottleCapacityMl <= 20) bottlePackagingCost = 0.70;
    else if (bottleCapacityMl <= 35) bottlePackagingCost = 0.90;
    else if (bottleCapacityMl <= 60) bottlePackagingCost = 1.10;
    else if (bottleCapacityMl <= 100) bottlePackagingCost = 1.60;
    else bottlePackagingCost = 2.50;

    const totalCogs = Number((oilCost + alcoholCost + fixativeCost + waterCost + bottlePackagingCost).toFixed(2));

    // Suggested Selling Price based on standard catalog pricing
    let suggestedPrice = 8;
    if (tier === 'pure_oil' || effectiveOilPercent >= 95) {
      suggestedPrice = Math.round(oilMl * 1.5);
    } else if (bottleCapacityMl <= 15) {
      suggestedPrice = 3.5;
    } else if (bottleCapacityMl <= 20) {
      suggestedPrice = 4.0;
    } else if (bottleCapacityMl <= 35) {
      suggestedPrice = activeOil?.retailPrice30ml || 5;
    } else if (bottleCapacityMl <= 60) {
      suggestedPrice = activeOil?.retailPrice50ml || 8;
    } else if (bottleCapacityMl <= 100) {
      suggestedPrice = activeOil?.retailPrice100ml || 14;
    } else {
      // Larger artisan flacons
      suggestedPrice = Math.round(totalCogs * 2.5);
    }

    const profit = Number((suggestedPrice - totalCogs).toFixed(2));
    const profitMarginPercent = suggestedPrice > 0 ? Number(((profit / suggestedPrice) * 100).toFixed(1)) : 0;

    return {
      oilMl,
      oilGrams,
      alcoholMl,
      alcoholGrams,
      fixativeMl,
      fixativeGrams,
      waterMl,
      waterGrams,
      totalGrams,
      oilDensity,
      effectiveOilPercent,
      effectiveFixativePercent,
      effectiveWaterPercent,
      effectiveAlcoholPercent,
      oilCost,
      alcoholCost,
      fixativeCost,
      bottlePackagingCost,
      totalCogs,
      suggestedPrice,
      profit,
      profitMarginPercent,
    };
  }, [
    calcMode,
    directOilMlInput,
    directFixativeMlInput,
    directWaterMlInput,
    directOilGramsInput,
    directFixativeGramsInput,
    directWaterGramsInput,
    isManualCustomOil,
    manualOilDensity,
    bottleCapacityMl, 
    oilConcentrationPercent, 
    fixativePercent, 
    waterPercent, 
    activeOil, 
    customOilCostPerMl, 
    settings.defaultOilDensity,
    tier
  ]);

  // Scaled calculations for batch compounding (multiplied by batchCount)
  const batchMeasures = useMemo(() => {
    const s = singleBottleMeasures;
    const n = Math.max(1, batchCount);
    return {
      batchCount: n,
      totalVolumeMl: Number((bottleCapacityMl * n).toFixed(2)),
      totalNetGrams: Number((s.totalGrams * n).toFixed(2)),
      oilMl: Number((s.oilMl * n).toFixed(2)),
      oilGrams: Number((s.oilGrams * n).toFixed(2)),
      alcoholMl: Number((s.alcoholMl * n).toFixed(2)),
      alcoholGrams: Number((s.alcoholGrams * n).toFixed(2)),
      fixativeMl: Number((s.fixativeMl * n).toFixed(2)),
      fixativeGrams: Number((s.fixativeGrams * n).toFixed(2)),
      waterMl: Number((s.waterMl * n).toFixed(2)),
      waterGrams: Number((s.waterGrams * n).toFixed(2)),
      totalCogs: Number((s.totalCogs * n).toFixed(2)),
      totalCogsLbp: Number((s.totalCogs * n * exchangeRate).toFixed(0)),
      totalRevenue: Number((s.suggestedPrice * n).toFixed(2)),
      totalRevenueLbp: Number((s.suggestedPrice * n * exchangeRate).toFixed(0)),
      totalProfit: Number((s.profit * n).toFixed(2)),
      totalProfitLbp: Number((s.profit * n * exchangeRate).toFixed(0)),
    };
  }, [singleBottleMeasures, batchCount, bottleCapacityMl, exchangeRate]);

  if (!isOpen) return null;

  // Copy formula formulation text to clipboard
  const handleCopyFormula = () => {
    const name = (isManualCustomOil && manualOilName.trim())
      ? manualOilName.trim()
      : (customBlendName.trim() || activeOil?.name || (isAr ? 'تركيبة خاصة' : 'Custom Formula'));
    const modeLabelAr = calcMode === 'percent' 
      ? 'بالنسب المئوية (%)' 
      : calcMode === 'direct_ml' 
        ? 'بالمقادير المباشرة (مل)' 
        : 'بالميزان الرقمي (غرام)';
    const text = isAr 
      ? `🧪 بطاقة تركيب معملية — نَسَمَات للعطور الفاخرة
اسم العطر: ${name}
الحجم: ${bottleCapacityMl} مل • عدد الزجاجات: ${batchCount}
عيار التركيز: ${singleBottleMeasures.effectiveOilPercent}% (${getLocalizedTier(tier, 'ar').label})
نمط الإدخال: ${modeLabelAr}
──────────────────────
• الزيت العطري: ${batchMeasures.oilMl} مل (${batchMeasures.oilGrams} غرام بالميزان)
• كحول العطور 96°: ${batchMeasures.alcoholMl} مل (${batchMeasures.alcoholGrams} غرام بالميزان)
• مثبت نسمات العطري: ${batchMeasures.fixativeMl} مل (${batchMeasures.fixativeGrams} غرام بالميزان)
${batchMeasures.waterMl > 0 ? `• ماء مقطر / مذيب: ${batchMeasures.waterMl} مل (${batchMeasures.waterGrams} غرام)\n` : ''}──────────────────────
إجمالي الوزن الصافي: ${batchMeasures.totalNetGrams} غرام
التكلفة التقديرية للتشغيلة: $${batchMeasures.totalCogs.toFixed(2)} (${batchMeasures.totalCogsLbp.toLocaleString()} ل.ل)
سعر البيع المقترح: $${batchMeasures.totalRevenue.toFixed(2)} (${batchMeasures.totalRevenueLbp.toLocaleString()} ل.ل)`
      : `🧪 Laboratory Perfume Formulation — Nasamat Haute Parfumerie
Blend: ${name}
Size: ${bottleCapacityMl}ml • Batch: ${batchCount} bottle(s)
Grade: ${getLocalizedTier(tier, 'en').label} (${singleBottleMeasures.effectiveOilPercent}%)
Input Mode: ${calcMode}
──────────────────────
• Fragrance Oil: ${batchMeasures.oilMl}ml (${batchMeasures.oilGrams}g on scale)
• Perfumer's Alcohol 96°: ${batchMeasures.alcoholMl}ml (${batchMeasures.alcoholGrams}g on scale)
• Fixative: ${batchMeasures.fixativeMl}ml (${batchMeasures.fixativeGrams}g on scale)
${batchMeasures.waterMl > 0 ? `• Distilled Water: ${batchMeasures.waterMl}ml (${batchMeasures.waterGrams}g)\n` : ''}──────────────────────
Total Net Weight: ${batchMeasures.totalNetGrams}g
Total Estimated COGS: $${batchMeasures.totalCogs.toFixed(2)}
Suggested Retail Price: $${batchMeasures.totalRevenue.toFixed(2)}`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // Add customized perfume to cart
  const handleAddToCartClick = () => {
    if (!onAddToCart) return;
    const name = (isManualCustomOil && manualOilName.trim())
      ? manualOilName.trim()
      : (customBlendName.trim() || activeOil?.name || (isAr ? 'عطر مصمم بالحاسبة' : 'Calculator Formulated Perfume'));
    
    const cartItem: CartItem = {
      id: `custom-calc-${Date.now()}`,
      itemType: 'oil',
      referenceId: activeOil?.id || 'bespoke-calc',
      name: `${name} (${bottleCapacityMl}ml - ${singleBottleMeasures.effectiveOilPercent}%)`,
      nameEn: `${name} (${bottleCapacityMl}ml - ${singleBottleMeasures.effectiveOilPercent}%)`,
      brand: activeOil?.brand || (isAr ? 'نسمات' : 'Nasamat'),
      imageUrl: activeOil?.imageUrl || 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=400&q=80',
      sizeMl: bottleCapacityMl,
      unitPrice: singleBottleMeasures.suggestedPrice,
      quantity: batchCount,
      oilQuantityPerBottleMl: singleBottleMeasures.oilMl,
      notes: `${isAr ? 'تركيب معملي خاص' : 'Bespoke Formulation'}: ${batchMeasures.oilMl}ml ${isAr ? 'زيت' : 'oil'} + ${batchMeasures.alcoholMl}ml ${isAr ? 'كحول' : 'alcohol'} + ${batchMeasures.fixativeMl}ml ${isAr ? 'مثبت' : 'fixative'}`,
    };

    onAddToCart(cartItem);
    setAddedToCartSuccess(true);
    setTimeout(() => setAddedToCartSuccess(false), 3000);
  };

  // Print invocation
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-neutral-300 rounded-3xl max-w-5xl w-full my-auto shadow-2xl overflow-hidden flex flex-col text-black max-h-[95vh]">
        
        {/* ================= MODAL TOP CONTROL HEADER (NO-PRINT) ================= */}
        <div className="no-print p-4 sm:p-5 border-b border-neutral-800 bg-black text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <FlaskConical className="w-5 h-5 text-amber-400 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  {isAr ? 'آلة حاسبة العيارات ونسب تركيب العطور' : 'Perfume Formulation & Caliber Calculator'}
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                  <span>{bottleCapacityMl}ml</span>
                  <span>•</span>
                  <span>{oilConcentrationPercent}%</span>
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {isAr 
                  ? 'تحكم مرن بحجم العبوة، عيارات التركيز، المقادير الدقيقة بالمل والغرام، وحساب التكاليف والأرباح' 
                  : 'Adjust volume, concentration calibers, exact ml & scale grams with cost & profit metrics'}
              </p>
            </div>
          </div>

          {/* Quick Actions (Print, Copy, Close) */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleCopyFormula}
              className="py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title={isAr ? 'نسخ التركيبة والمقادير للحافظة' : 'Copy Formula'}
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'نسخ المقادير' : 'Copy'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              title={isAr ? 'طباعة بطاقة التحضير المعملية (A4)' : 'Print Lab Card'}
            >
              <Printer className="w-4 h-4 text-black stroke-[2.5]" />
              <span>{isAr ? 'طباعة المقادير 🖨️' : 'Print A4 🖨️'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-2 rounded-xl transition hover:bg-neutral-800 cursor-pointer"
              title={isAr ? 'إغلاق (Esc)' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= INTERACTIVE WORKSPACE (SCROLLABLE) ================= */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 print:p-0 print:overflow-visible">
          
          {/* Printable Letterhead (visible ONLY in print) */}
          <div className="hidden print:block border-b-2 border-black pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-600">
                  NASAMAT HAUTE PARFUMERIE • BEIRUT
                </span>
                <h1 className="text-xl font-black font-serif text-black">
                  {settings.storeName || (isAr ? 'نَسَمَات لصياغة العطور الفاخرة' : 'Nasamat Haute Parfumerie')}
                </h1>
                <p className="text-xs text-neutral-600">
                  {isAr ? 'بطاقة المقادير المعملية للتركيب والصياغة الدقيقة' : 'Laboratory Perfume Compounding Formulation Sheet'}
                </p>
              </div>
              <div className="text-end font-mono text-xs">
                <span className="font-bold block">LAB-FORMULA-{Date.now().toString().slice(-6)}</span>
                <span className="text-neutral-500">{new Date().toLocaleDateString(isAr ? 'ar-LB' : 'en-US')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ================= LEFT CONTROLS: SIZE, CALIBER & RATIOS (7 COLS) ================= */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* STEP 1: BOTTLE SIZE & CAPACITY */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-black text-amber-400 text-xs font-black flex items-center justify-center">1</span>
                    <h4 className="font-black text-sm text-black uppercase tracking-wider">
                      {isAr ? 'حجم العبوة والسعة الإجمالية' : 'Bottle Volume & Capacity'}
                    </h4>
                  </div>
                  <span className="font-mono text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    {bottleCapacityMl} {isAr ? 'مل' : 'ml'}
                  </span>
                </div>

                {/* Standard Sizes Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {STANDARD_SIZES.map((sz) => {
                    const isSelected = !isCustomCapacity && bottleCapacityMl === sz.ml;
                    return (
                      <button
                        key={sz.ml}
                        type="button"
                        onClick={() => {
                          setBottleCapacityMl(sz.ml);
                          setIsCustomCapacity(false);
                        }}
                        className={`p-2 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-center relative ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-md'
                            : 'bg-white hover:bg-neutral-100 text-black border-neutral-200'
                        }`}
                      >
                        <span className="font-black font-mono text-sm sm:text-base leading-tight">
                          {sz.ml} <span className="text-[10px] font-sans font-bold">{isAr ? 'مل' : 'ml'}</span>
                        </span>
                        <span className={`text-[9px] font-bold block mt-0.5 ${isSelected ? 'text-amber-300' : 'text-neutral-500'}`}>
                          {isAr ? sz.badgeAr : sz.badgeEn}
                        </span>
                      </button>
                    );
                  })}
                  
                  {/* Custom Size button */}
                  <button
                    type="button"
                    onClick={() => setIsCustomCapacity(true)}
                    className={`p-2 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                      isCustomCapacity
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                        : 'bg-white hover:bg-neutral-100 text-black border-neutral-200'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm leading-tight">{isAr ? 'مخصص' : 'Custom'}</span>
                    <span className="text-[9px] text-neutral-500 block">{isAr ? 'أدخل الحجم' : 'Enter ml'}</span>
                  </button>
                </div>

                {/* Permanent Manual Capacity Direct Input Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border border-neutral-300 rounded-xl shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-black">
                      {isAr ? '✍️ كتابة سعة الزجاجة يدوياً:' : '✍️ Direct Bottle Size (ml):'}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      {isAr ? '(أدخل أي حجم تريده بالمل)' : '(Enter any custom volume in ml)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setBottleCapacityMl((prev) => Math.max(1, prev - 5))}
                      className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-neutral-300 transition"
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
                        }
                      }}
                      className="w-20 bg-amber-50 border border-amber-400 rounded-lg px-2 py-1 text-center font-mono font-black text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      type="button"
                      onClick={() => setBottleCapacityMl((prev) => prev + 5)}
                      className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-neutral-300 transition"
                      title="+5 ml"
                    >
                      +
                    </button>
                    <span className="text-xs font-bold font-mono text-neutral-700">ml</span>
                  </div>
                </div>
              </div>

              {/* ================= CALCULATION INPUT MODE SELECTOR ================= */}
              <div className="bg-black text-white p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-black flex items-center justify-center font-black">
                    <Sliders className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">
                      {isAr ? 'نمط عمل الحاسبة والإدخال:' : 'Formulation Input Mode:'}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {isAr ? 'اختر بين النسب المئوية أو الإدخال اليدوي المباشر' : 'Choose between % ratios or direct amounts'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('percent')}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      calcMode === 'percent'
                        ? 'bg-amber-400 text-black shadow-sm ring-2 ring-amber-300'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>{isAr ? 'بالنسب المئوية (%)' : 'Percentage (%)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchMode('direct_ml')}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      calcMode === 'direct_ml'
                        ? 'bg-amber-400 text-black shadow-sm ring-2 ring-amber-300'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <Droplet className="w-3.5 h-3.5" />
                    <span>{isAr ? 'يدوي بالمل (Direct ml)' : 'Direct ml'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchMode('direct_grams')}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      calcMode === 'direct_grams'
                        ? 'bg-amber-400 text-black shadow-sm ring-2 ring-amber-300'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>{isAr ? 'يدوي بالميزان (غرام)' : 'Scale Grams'}</span>
                  </button>
                </div>
              </div>

              {/* MODE 1: PERCENTAGE MODE (%) */}
              {calcMode === 'percent' && (
                <>
                  {/* STEP 2: PERFUME CALIBERS (CONCENTRATION GRADES) */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-black text-amber-400 text-xs font-black flex items-center justify-center">2</span>
                        <h4 className="font-black text-sm text-black uppercase tracking-wider">
                          {isAr ? 'عيارات التركيز المعيارية (Perfume Calibers)' : 'Concentration Calibers & Grades'}
                        </h4>
                      </div>
                      <span className="font-mono text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                        {singleBottleMeasures.effectiveOilPercent}% {isAr ? 'زيت خام' : 'Pure Oil'}
                      </span>
                    </div>

                    {/* Caliber Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {/* Extrait de Parfum */}
                      <button
                        type="button"
                        onClick={() => handleSelectTier('extrait')}
                        className={`p-3 rounded-xl border text-start transition cursor-pointer relative ${
                          tier === 'extrait'
                            ? 'bg-black text-white border-black shadow-md ring-2 ring-amber-400/50'
                            : 'bg-white hover:bg-neutral-100 text-black border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs">Extrait de Parfum</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${tier === 'extrait' ? 'bg-amber-400 text-black' : 'bg-neutral-100 text-neutral-700'}`}>
                            30% - 40%
                          </span>
                        </div>
                        <span className={`text-[10px] block font-medium ${tier === 'extrait' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {isAr ? 'عيار ملكي فائق الثبات (+24 ساعة)' : 'Royal Ultra Extract (24h+)'}
                        </span>
                      </button>

                      {/* Eau de Parfum (EDP) */}
                      <button
                        type="button"
                        onClick={() => handleSelectTier('edp')}
                        className={`p-3 rounded-xl border text-start transition cursor-pointer relative ${
                          tier === 'edp'
                            ? 'bg-black text-white border-black shadow-md ring-2 ring-amber-400/50'
                            : 'bg-white hover:bg-neutral-100 text-black border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs">Eau de Parfum (EDP)</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${tier === 'edp' ? 'bg-amber-400 text-black' : 'bg-neutral-100 text-neutral-700'}`}>
                            18% - 24%
                          </span>
                        </div>
                        <span className={`text-[10px] block font-medium ${tier === 'edp' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {isAr ? 'عيار فخم متوازن ومثالي (8-12 ساعة)' : 'Optimal Luxury Wear (8-12h)'}
                        </span>
                      </button>

                      {/* Eau de Toilette (EDT) */}
                      <button
                        type="button"
                        onClick={() => handleSelectTier('edt')}
                        className={`p-3 rounded-xl border text-start transition cursor-pointer relative ${
                          tier === 'edt'
                            ? 'bg-black text-white border-black shadow-md ring-2 ring-amber-400/50'
                            : 'bg-white hover:bg-neutral-100 text-black border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs">Eau de Toilette (EDT)</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${tier === 'edt' ? 'bg-amber-400 text-black' : 'bg-neutral-100 text-neutral-700'}`}>
                            10% - 15%
                          </span>
                        </div>
                        <span className={`text-[10px] block font-medium ${tier === 'edt' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {isAr ? 'عيار نهاري خفيف ومنعش (4-6 ساعات)' : 'Moderate Daily Wear (4-6h)'}
                        </span>
                      </button>

                      {/* Eau de Cologne (EDC) */}
                      <button
                        type="button"
                        onClick={() => handleSelectTier('edc')}
                        className={`p-3 rounded-xl border text-start transition cursor-pointer relative ${
                          tier === 'edc'
                            ? 'bg-black text-white border-black shadow-md ring-2 ring-amber-400/50'
                            : 'bg-white hover:bg-neutral-100 text-black border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs">Eau de Cologne (EDC)</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${tier === 'edc' ? 'bg-amber-400 text-black' : 'bg-neutral-100 text-neutral-700'}`}>
                            3% - 8%
                          </span>
                        </div>
                        <span className={`text-[10px] block font-medium ${tier === 'edc' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {isAr ? 'رذاذ صيفي منعش وخفيف (ساعتين)' : 'Fresh Splash (~2h)'}
                        </span>
                      </button>

                      {/* Pure Oil (CPO 100%) */}
                      <button
                        type="button"
                        onClick={() => handleSelectTier('pure_oil')}
                        className={`p-3 rounded-xl border text-start transition cursor-pointer relative ${
                          tier === 'pure_oil'
                            ? 'bg-black text-white border-black shadow-md ring-2 ring-amber-400/50'
                            : 'bg-white hover:bg-neutral-100 text-black border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs">{isAr ? 'زيت خام نقي (دهن)' : 'Pure Oil (CPO)'}</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${tier === 'pure_oil' ? 'bg-amber-400 text-black' : 'bg-neutral-100 text-neutral-700'}`}>
                            100%
                          </span>
                        </div>
                        <span className={`text-[10px] block font-medium ${tier === 'pure_oil' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {isAr ? 'دهن عطر خالص بدون كحول' : '100% Alcohol-Free Pure Oil'}
                        </span>
                      </button>

                      {/* Custom Grade */}
                      <button
                        type="button"
                        onClick={() => handleSelectTier('custom')}
                        className={`p-3 rounded-xl border text-start transition cursor-pointer relative ${
                          tier === 'custom'
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                            : 'bg-white hover:bg-neutral-100 text-black border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs">{isAr ? 'عيار مخصص حر' : 'Custom Caliber'}</span>
                          <Sliders className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] text-neutral-500 block">
                          {isAr ? 'تحديد أي نسبة بدقة يدوياً' : 'Fine manual percentage'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* STEP 3: FINE RATIO SLIDERS & PERCENTAGE CONTROLS */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-black text-amber-400 text-xs font-black flex items-center justify-center">3</span>
                        <h4 className="font-black text-sm text-black uppercase tracking-wider">
                          {isAr ? 'التحكم الدقيق بنسب المكونات (%)' : 'Adjustable Formulation Ratios (%)'}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoBalanceAlcohol}
                        className="text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{isAr ? 'موازنة الكحول تلقائياً 100%' : 'Auto-Balance 100%'}</span>
                      </button>
                    </div>

                    {/* Dynamic Proportions Composition Bar */}
                    <div className="space-y-1.5">
                      <div className="h-4 w-full bg-neutral-200 rounded-full overflow-hidden flex shadow-inner">
                        <div 
                          style={{ width: `${Math.min(100, singleBottleMeasures.effectiveOilPercent)}%` }} 
                          className="bg-amber-500 h-full transition-all duration-200" 
                          title={`${isAr ? 'الزيت العطري' : 'Oil'}: ${singleBottleMeasures.effectiveOilPercent}%`}
                        />
                        <div 
                          style={{ width: `${Math.min(100, singleBottleMeasures.effectiveAlcoholPercent)}%` }} 
                          className="bg-sky-600 h-full transition-all duration-200" 
                          title={`${isAr ? 'الكحول' : 'Alcohol'}: ${singleBottleMeasures.effectiveAlcoholPercent}%`}
                        />
                        <div 
                          style={{ width: `${Math.min(100, singleBottleMeasures.effectiveFixativePercent)}%` }} 
                          className="bg-emerald-600 h-full transition-all duration-200" 
                          title={`${isAr ? 'المثبت' : 'Fixative'}: ${singleBottleMeasures.effectiveFixativePercent}%`}
                        />
                        {waterPercent > 0 && (
                          <div 
                            style={{ width: `${Math.min(100, singleBottleMeasures.effectiveWaterPercent)}%` }} 
                            className="bg-purple-600 h-full transition-all duration-200" 
                            title={`${isAr ? 'ماء مقطر' : 'Water'}: ${singleBottleMeasures.effectiveWaterPercent}%`}
                          />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-amber-800">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                            <span>{isAr ? 'الزيت' : 'Oil'}: {singleBottleMeasures.effectiveOilPercent}%</span>
                          </span>
                          <span className="flex items-center gap-1 text-sky-800">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
                            <span>{isAr ? 'الكحول' : 'Alcohol'}: {singleBottleMeasures.effectiveAlcoholPercent}%</span>
                          </span>
                          <span className="flex items-center gap-1 text-emerald-800">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                            <span>{isAr ? 'المثبت' : 'Fixative'}: {singleBottleMeasures.effectiveFixativePercent}%</span>
                          </span>
                        </div>
                        <span className={`font-mono ${singleBottleMeasures.effectiveOilPercent + singleBottleMeasures.effectiveAlcoholPercent + singleBottleMeasures.effectiveFixativePercent + singleBottleMeasures.effectiveWaterPercent === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {singleBottleMeasures.effectiveOilPercent + singleBottleMeasures.effectiveAlcoholPercent + singleBottleMeasures.effectiveFixativePercent + singleBottleMeasures.effectiveWaterPercent}% {isAr ? 'الإجمالي' : 'Total'}
                        </span>
                      </div>
                    </div>

                    {/* SLIDER 1: Fragrance Oil % */}
                    <div className="p-3 bg-white rounded-xl border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-black flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5 text-amber-500" />
                          <span>{isAr ? 'نسبة الزيت العطري الخام (% Fragrance Oil):' : 'Fragrance Oil Ratio (%):'}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            step="0.5"
                            value={oilConcentrationPercent}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setTier('custom');
                              setOilConcentrationPercent(Math.min(100, Math.max(0, val)));
                            }}
                            className="w-16 bg-neutral-100 border border-neutral-300 rounded-lg px-2 py-1 text-center font-mono font-black text-xs text-black focus:outline-none focus:border-black"
                          />
                          <span className="font-black text-xs font-mono">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        step="0.5"
                        value={oilConcentrationPercent}
                        onChange={(e) => {
                          setTier('custom');
                          setOilConcentrationPercent(parseFloat(e.target.value));
                        }}
                        className="w-full accent-black cursor-pointer h-2 bg-neutral-200 rounded-lg"
                      />
                    </div>

                    {/* SLIDER 2: Fixative % */}
                    <div className="p-3 bg-white rounded-xl border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-black flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isAr ? 'نسبة المثبت العطري (% Fixative):' : 'Fixative Ratio (%):'}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={fixativePercent}
                            onChange={(e) => setFixativePercent(Math.max(0, Math.min(10, parseFloat(e.target.value) || 0)))}
                            className="w-16 bg-neutral-100 border border-neutral-300 rounded-lg px-2 py-1 text-center font-mono font-black text-xs text-black focus:outline-none focus:border-black"
                          />
                          <span className="font-black text-xs font-mono">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.25"
                        value={fixativePercent}
                        onChange={(e) => setFixativePercent(parseFloat(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer h-2 bg-neutral-200 rounded-lg"
                      />
                    </div>

                    {/* SLIDER 3: Distilled Water / DPG % */}
                    <div className="p-3 bg-white rounded-xl border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-black flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-purple-600" />
                          <span>{isAr ? 'نسبة الماء المقطر أو المذيب الإضافي (% Water/DPG):' : 'Distilled Water / Solvent (%):'}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={waterPercent}
                            onChange={(e) => setWaterPercent(Math.max(0, Math.min(10, parseFloat(e.target.value) || 0)))}
                            className="w-16 bg-neutral-100 border border-neutral-300 rounded-lg px-2 py-1 text-center font-mono font-black text-xs text-black focus:outline-none focus:border-black"
                          />
                          <span className="font-black text-xs font-mono">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        step="0.25"
                        value={waterPercent}
                        onChange={(e) => setWaterPercent(parseFloat(e.target.value))}
                        className="w-full accent-purple-600 cursor-pointer h-2 bg-neutral-200 rounded-lg"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* MODE 2: DIRECT MANUAL ML INPUT MODE (إدخال يدوي مباشر بالمل) */}
              {calcMode === 'direct_ml' && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-black text-xs font-black flex items-center justify-center">✍️</span>
                      <h4 className="font-black text-sm text-black uppercase tracking-wider">
                        {isAr ? 'إدخال المقادير يدوياً بالمل (Direct Milliliters)' : 'Direct Milliliters Input Mode'}
                      </h4>
                    </div>
                    <span className="font-mono text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full">
                      {isAr ? 'تركيز تلقائي:' : 'Derived Conc:'} {singleBottleMeasures.effectiveOilPercent}%
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600">
                    {isAr
                      ? 'أدخل كميات المكونات بالمل مباشرة، وستقوم الحاسبة تلقائياً باحتساب النسبة المئوية للتركيز، أوزان الغرامات على الميزان، وتكملة الكحول اللازمة.'
                      : 'Type ingredient volumes in ml directly. The system automatically computes concentration %, scale weights, and alcohol balance.'}
                  </p>

                  <div className="space-y-3">
                    {/* Manual Oil Input (ml) */}
                    <div className="p-3 bg-white border border-neutral-300 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                          <Droplet className="w-4 h-4 text-amber-500" />
                          <span>{isAr ? 'كمية الزيت العطري الخام بالمل:' : 'Raw Fragrance Oil (ml):'}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(directOilMlInput) || 0;
                              setDirectOilMlInput(Math.max(0, curr - 1).toString());
                            }}
                            className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-neutral-300"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={bottleCapacityMl}
                            step="0.5"
                            value={directOilMlInput}
                            onChange={(e) => setDirectOilMlInput(e.target.value)}
                            className="w-20 bg-amber-50 border border-amber-400 rounded-lg px-2.5 py-1 text-center font-mono font-black text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(directOilMlInput) || 0;
                              setDirectOilMlInput(Math.min(bottleCapacityMl, curr + 1).toString());
                            }}
                            className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-neutral-300"
                          >
                            +
                          </button>
                          <span className="text-xs font-bold font-mono text-neutral-600">ml</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-bold bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                        <span>{isAr ? 'الوزن على الميزان:' : 'Scale weight:'} <strong className="text-black font-mono">{singleBottleMeasures.oilGrams}g</strong> (كثافة {singleBottleMeasures.oilDensity} g/ml)</span>
                        <span className="text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded font-mono">{singleBottleMeasures.effectiveOilPercent}% {isAr ? 'تركيز' : 'Conc.'}</span>
                      </div>
                    </div>

                    {/* Manual Fixative Input (ml) */}
                    <div className="p-3 bg-white border border-neutral-300 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <span>{isAr ? 'كمية مثبت العطر بالمل:' : 'Fixative (ml):'}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(directFixativeMlInput) || 0;
                              setDirectFixativeMlInput(Math.max(0, curr - 0.25).toString());
                            }}
                            className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-neutral-300"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.25"
                            value={directFixativeMlInput}
                            onChange={(e) => setDirectFixativeMlInput(e.target.value)}
                            className="w-20 bg-emerald-50 border border-emerald-400 rounded-lg px-2.5 py-1 text-center font-mono font-black text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(directFixativeMlInput) || 0;
                              setDirectFixativeMlInput((curr + 0.25).toString());
                            }}
                            className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-neutral-300"
                          >
                            +
                          </button>
                          <span className="text-xs font-bold font-mono text-neutral-600">ml</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-bold bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                        <span>{isAr ? 'الوزن على الميزان:' : 'Scale weight:'} <strong className="text-black font-mono">{singleBottleMeasures.fixativeGrams}g</strong></span>
                        <span className="text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded font-mono">{singleBottleMeasures.effectiveFixativePercent}% {isAr ? 'نسبة' : 'Ratio'}</span>
                      </div>
                    </div>

                    {/* Manual Water / Solvent Input (ml) */}
                    <div className="p-3 bg-white border border-neutral-300 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-purple-600" />
                          <span>{isAr ? 'كمية الماء المقطر أو المذيب بالمل (اختياري):' : 'Distilled Water / Solvent (ml):'}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={directWaterMlInput}
                            onChange={(e) => setDirectWaterMlInput(e.target.value)}
                            className="w-20 bg-purple-50 border border-purple-400 rounded-lg px-2.5 py-1 text-center font-mono font-black text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                          />
                          <span className="text-xs font-bold font-mono text-neutral-600">ml</span>
                        </div>
                      </div>
                    </div>

                    {/* Auto-calculated Alcohol 96° Remainder Card */}
                    <div className="p-4 bg-sky-50 border border-sky-300 rounded-xl flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-xs font-black text-sky-950 block">
                          {isAr ? 'كحول العطور 96° المتبقي المطلوب للإكمال:' : "Required Alcohol 96° to fill bottle:"}
                        </span>
                        <span className="text-[11px] text-sky-800 font-medium">
                          {isAr ? `تكملة سعة الزجاجة (${bottleCapacityMl} مل) تلقائياً` : `Auto-balances to fill ${bottleCapacityMl}ml`}
                        </span>
                      </div>
                      <div className="text-end font-mono">
                        <span className="font-black text-base text-sky-950 block">
                          {singleBottleMeasures.alcoholMl} <span className="text-xs font-bold">ml</span>
                        </span>
                        <span className="text-xs font-bold text-sky-700 block">
                          {singleBottleMeasures.alcoholGrams} g ({singleBottleMeasures.effectiveAlcoholPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 3: DIRECT SCALE GRAMS INPUT MODE (إدخال يدوي بالميزان بالغرام) */}
              {calcMode === 'direct_grams' && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-black text-xs font-black flex items-center justify-center">⚖️</span>
                      <h4 className="font-black text-sm text-black uppercase tracking-wider">
                        {isAr ? 'إدخال أوزان الميزان الرقمي بالغرام (Direct Scale Grams)' : 'Direct Scale Weight (Grams) Mode'}
                      </h4>
                    </div>
                    <span className="font-mono text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      {isAr ? 'تركيز محسوب:' : 'Calc Conc:'} {singleBottleMeasures.effectiveOilPercent}%
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600">
                    {isAr
                      ? 'ضع زجاجة العطر على الميزان واصفر القراءة (Tare)، ثم اكتب وزن الزيت والمثبت بالغرامات. ستقوم الحاسبة بتحويل الغرامات إلى مل وحساب كمية الكحول الواجب وزنها بالميزان.'
                      : 'Place bottle on scale and tare. Enter oil and fixative grams; the system converts to ml and calculates the exact alcohol grams to weigh.'}
                  </p>

                  <div className="space-y-3">
                    {/* Manual Oil Grams Input */}
                    <div className="p-3 bg-white border border-neutral-300 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                          <Droplet className="w-4 h-4 text-amber-500" />
                          <span>{isAr ? 'وزن الزيت العطري على الميزان (غرام):' : 'Fragrance Oil Weight on Scale (g):'}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(directOilGramsInput) || 0;
                              setDirectOilGramsInput(Math.max(0, curr - 1).toFixed(2));
                            }}
                            className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-neutral-300"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="0.25"
                            value={directOilGramsInput}
                            onChange={(e) => setDirectOilGramsInput(e.target.value)}
                            className="w-24 bg-amber-50 border border-amber-400 rounded-lg px-2.5 py-1 text-center font-mono font-black text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(directOilGramsInput) || 0;
                              setDirectOilGramsInput((curr + 1).toFixed(2));
                            }}
                            className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-neutral-300"
                          >
                            +
                          </button>
                          <span className="text-xs font-bold font-mono text-neutral-600">g</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-bold bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                        <span>{isAr ? 'الحجم المعادل بالمل:' : 'Equivalent Volume:'} <strong className="text-black font-mono">{singleBottleMeasures.oilMl} ml</strong></span>
                        <span className="text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded font-mono">{singleBottleMeasures.effectiveOilPercent}% {isAr ? 'عيار التركيز' : 'Caliber'}</span>
                      </div>
                    </div>

                    {/* Manual Fixative Grams Input */}
                    <div className="p-3 bg-white border border-neutral-300 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <span>{isAr ? 'وزن مثبت العطر على الميزان (غرام):' : 'Fixative Weight on Scale (g):'}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(directFixativeGramsInput) || 0;
                              setDirectFixativeGramsInput(Math.max(0, curr - 0.25).toFixed(2));
                            }}
                            className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-neutral-300"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="0.25"
                            value={directFixativeGramsInput}
                            onChange={(e) => setDirectFixativeGramsInput(e.target.value)}
                            className="w-24 bg-emerald-50 border border-emerald-400 rounded-lg px-2.5 py-1 text-center font-mono font-black text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(directFixativeGramsInput) || 0;
                              setDirectFixativeGramsInput((curr + 0.25).toFixed(2));
                            }}
                            className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer border border-neutral-300"
                          >
                            +
                          </button>
                          <span className="text-xs font-bold font-mono text-neutral-600">g</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-bold bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                        <span>{isAr ? 'الحجم المعادل بالمل:' : 'Equivalent Volume:'} <strong className="text-black font-mono">{singleBottleMeasures.fixativeMl} ml</strong></span>
                        <span className="text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded font-mono">{singleBottleMeasures.effectiveFixativePercent}%</span>
                      </div>
                    </div>

                    {/* Auto-calculated Alcohol Grams on Scale */}
                    <div className="p-4 bg-sky-50 border border-sky-300 rounded-xl flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-xs font-black text-sky-950 block">
                          ⚖️ {isAr ? 'وزن كحول 96° المطلوب وزنه على الميزان:' : 'Alcohol 96° weight to add on scale:'}
                        </span>
                        <span className="text-[11px] text-sky-800 font-medium">
                          {isAr ? `صب كحول حتى تصبح القراءة +${singleBottleMeasures.alcoholGrams}g` : `Add alcohol until +${singleBottleMeasures.alcoholGrams}g on scale`}
                        </span>
                      </div>
                      <div className="text-end font-mono">
                        <span className="font-black text-base text-sky-950 block">
                          {singleBottleMeasures.alcoholGrams} <span className="text-xs font-bold">g</span>
                        </span>
                        <span className="text-xs font-bold text-sky-700 block">
                          {singleBottleMeasures.alcoholMl} ml ({singleBottleMeasures.effectiveAlcoholPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: FRAGRANCE OIL SELECTION (OR MANUAL ENTRY) */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-black text-amber-400 text-xs font-black flex items-center justify-center">4</span>
                    <h4 className="font-black text-sm text-black uppercase tracking-wider">
                      {isAr ? 'اختيار الزيت العطري أو إدخاله يدوياً' : 'Select Perfume Oil or Enter Manually'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsManualCustomOil(!isManualCustomOil)}
                    className={`text-xs font-bold px-3 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                      isManualCustomOil
                        ? 'bg-amber-400 text-black border-amber-500 font-black shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    <span>✍️</span>
                    <span>{isManualCustomOil ? (isAr ? 'إلغاء الإدخال اليدوي' : 'Cancel Manual Entry') : (isAr ? 'إدخال زيت مخصص يدوياً' : 'Enter Custom Oil')}</span>
                  </button>
                </div>

                {/* If Manual Custom Oil is Active */}
                {isManualCustomOil ? (
                  <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <span>🧪</span>
                      <span>{isAr ? 'إدخال مواصفات وتكلفة الزيت العطري يدوياً:' : 'Manual Fragrance Oil Specs & Unit Cost:'}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                          {isAr ? 'اسم الزيت العطري / الخلطة:' : 'Fragrance Oil Name:'}
                        </label>
                        <input
                          type="text"
                          value={manualOilName}
                          onChange={(e) => setManualOilName(e.target.value)}
                          placeholder={isAr ? 'مثال: مسك الختام الملكي' : 'e.g. Royal Musk'}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-black focus:outline-none focus:border-black"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                          {isAr ? 'سعر التكلفة بالدولار ($/مل):' : 'Unit Cost ($/ml):'}
                        </label>
                        <input
                          type="number"
                          step="0.005"
                          min="0"
                          value={customOilCostPerMl}
                          onChange={(e) => setCustomOilCostPerMl(e.target.value)}
                          placeholder="0.070"
                          className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-black focus:outline-none focus:border-black"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                          {isAr ? 'كثافة الزيت العطري (g/ml):' : 'Density (g/ml):'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.5"
                          max="1.5"
                          value={manualOilDensity}
                          onChange={(e) => setManualOilDensity(e.target.value)}
                          placeholder="0.95"
                          className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-black focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-700 block mb-1">
                        {isAr ? 'اختر من زيوت المشروع:' : 'Select from project oils:'}
                      </label>
                      <select
                        value={selectedOilId}
                        onChange={(e) => setSelectedOilId(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:border-black"
                      >
                        {oils.map((oil) => (
                          <option key={oil.id} value={oil.id}>
                            {oil.name} ({oil.code || 'OIL'}) — ${oil.unitCost || 0.07}/ml
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-700 block mb-1">
                        {isAr ? 'اسم التركيبة أو الخلطة:' : 'Formula / Blend Name:'}
                      </label>
                      <input
                        type="text"
                        value={customBlendName}
                        onChange={(e) => setCustomBlendName(e.target.value)}
                        placeholder={activeOil?.name || (isAr ? 'مثال: خلطة نسمات الملكية' : 'e.g. Royal Bespoke Blend')}
                        className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* ================= RIGHT COLUMN: EXACT MEASURES & FINANCIAL SUMMARY (5 COLS) ================= */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* LABORATORY EXACT MEASUREMENTS CARD (ML & GRAMS) */}
              <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-amber-600 stroke-[2.5]" />
                    <h4 className="font-black text-sm text-black font-serif uppercase tracking-wider">
                      {isAr ? 'المقادير المعملية (بالمل والميزان)' : 'Exact Lab Measures (ml & grams)'}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 px-2 py-0.5 rounded-full font-mono">
                    1$ = {exchangeRate.toLocaleString()} L.L.
                  </span>
                </div>

                {/* Compounding Batch Multiplier Controls */}
                <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-xs font-bold text-neutral-700">
                    {isAr ? 'عدد الزجاجات المطلوب تصنيعها:' : 'Batch Bottles to compound:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 5, 10, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBatchCount(num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black transition cursor-pointer ${
                          batchCount === num
                            ? 'bg-black text-amber-300 shadow-xs'
                            : 'bg-white hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
                        }`}
                      >
                        ×{num}
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={batchCount}
                      onChange={(e) => setBatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center bg-white border border-neutral-300 rounded-lg py-1 text-xs font-mono font-bold text-black focus:outline-none"
                    />
                  </div>
                </div>

                {/* Exact Ingredient Rows */}
                <div className="space-y-2.5">
                  
                  {/* Row 1: Fragrance Oil */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-amber-950 block">
                        {isAr ? '1. الزيت العطري الخام' : '1. Fragrance Oil'} ({singleBottleMeasures.effectiveOilPercent}%)
                      </span>
                      <span className="text-[10px] text-amber-800 font-medium">
                        {isAr ? 'كثافة الزيت:' : 'Density:'} ~{singleBottleMeasures.oilDensity} g/ml
                      </span>
                    </div>
                    <div className="text-end">
                      <span className="font-mono font-black text-sm text-black block">
                        {batchMeasures.oilMl} <span className="text-xs font-bold text-neutral-600">ml</span>
                      </span>
                      <span className="font-mono font-bold text-[11px] text-amber-800 block">
                        {batchMeasures.oilGrams} <span className="text-[10px]">g ({isAr ? 'بالميزان' : 'scale'})</span>
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Perfumer's Alcohol */}
                  <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-sky-950 block">
                        {isAr ? '2. كحول العطور الإيثيلي 96°' : "2. Perfumer's Alcohol 96°"} ({singleBottleMeasures.effectiveAlcoholPercent}%)
                      </span>
                      <span className="text-[10px] text-sky-800 font-medium">
                        {isAr ? 'كثافة الكحول:' : 'Density:'} 0.81 g/ml
                      </span>
                    </div>
                    <div className="text-end">
                      <span className="font-mono font-black text-sm text-black block">
                        {batchMeasures.alcoholMl} <span className="text-xs font-bold text-neutral-600">ml</span>
                      </span>
                      <span className="font-mono font-bold text-[11px] text-sky-800 block">
                        {batchMeasures.alcoholGrams} <span className="text-[10px]">g ({isAr ? 'بالميزان' : 'scale'})</span>
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Fixative */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-emerald-950 block">
                        {isAr ? '3. مثبت العطر الفاخر' : '3. Fragrance Fixative'} ({singleBottleMeasures.effectiveFixativePercent}%)
                      </span>
                      <span className="text-[10px] text-emerald-800 font-medium">
                        {isAr ? 'كثافة المثبت:' : 'Density:'} 1.00 g/ml
                      </span>
                    </div>
                    <div className="text-end">
                      <span className="font-mono font-black text-sm text-black block">
                        {batchMeasures.fixativeMl} <span className="text-xs font-bold text-neutral-600">ml</span>
                      </span>
                      <span className="font-mono font-bold text-[11px] text-emerald-800 block">
                        {batchMeasures.fixativeGrams} <span className="text-[10px]">g ({isAr ? 'بالميزان' : 'scale'})</span>
                      </span>
                    </div>
                  </div>

                  {/* Row 4: Distilled Water if any */}
                  {batchMeasures.waterMl > 0 && (
                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-purple-950 block">
                          {isAr ? '4. ماء مقطر / مذيب إضافي' : '4. Distilled Water / Solvent'} ({singleBottleMeasures.effectiveWaterPercent}%)
                        </span>
                        <span className="text-[10px] text-purple-800 font-medium">1.00 g/ml</span>
                      </div>
                      <div className="text-end">
                        <span className="font-mono font-black text-sm text-black block">
                          {batchMeasures.waterMl} <span className="text-xs font-bold text-neutral-600">ml</span>
                        </span>
                        <span className="font-mono font-bold text-[11px] text-purple-800 block">
                          {batchMeasures.waterGrams} <span className="text-[10px]">g</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total Net Compound Summary */}
                  <div className="pt-2 border-t-2 border-black flex items-center justify-between text-xs font-black text-black">
                    <span>
                      {isAr ? `إجمالي محتوى العبوة (${batchCount} زجاجة):` : `Total Net Contents (${batchCount} bottle):`}
                    </span>
                    <div className="text-end font-mono">
                      <span className="block text-sm">{batchMeasures.totalVolumeMl} ml</span>
                      <span className="text-neutral-500 font-bold">{batchMeasures.totalNetGrams} g net</span>
                    </div>
                  </div>

                </div>

                {/* FINANCIAL & COSTING BREAKDOWN */}
                <div className="p-4 bg-neutral-900 text-white rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
                    <span className="text-xs font-bold text-neutral-300">
                      {isAr ? 'الحسبة المالية والتكلفة التقديرية:' : 'Cost & Profit Analytics:'}
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">
                      {singleBottleMeasures.profitMarginPercent}% {isAr ? 'هامش ربح' : 'Margin'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-400 block">{isAr ? 'تكلفة الإنتاج (COGS):' : 'Batch Cost (COGS):'}</span>
                      <span className="font-mono font-black text-base text-rose-300 block">
                        ${batchMeasures.totalCogs.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {batchMeasures.totalCogsLbp.toLocaleString()} L.L.
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 block">{isAr ? 'سعر البيع المقترح:' : 'Suggested Retail:'}</span>
                      <span className="font-mono font-black text-base text-amber-300 block">
                        ${batchMeasures.totalRevenue.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {batchMeasures.totalRevenueLbp.toLocaleString()} L.L.
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400">
                      {isAr ? 'صافي الربح المتوقع ★:' : 'Expected Net Profit ★:'}
                    </span>
                    <div className="text-end font-mono">
                      <span className="text-emerald-400 font-black text-sm block">
                        +${batchMeasures.totalProfit.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-500 font-bold">
                        +{batchMeasures.totalProfitLbp.toLocaleString()} L.L.
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS (ADD TO CART / SAVE AS RECIPE) */}
                <div className="space-y-2 pt-1 no-print">
                  {onAddToCart && (
                    <button
                      type="button"
                      onClick={handleAddToCartClick}
                      className="w-full py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98"
                    >
                      {addedToCartSuccess ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">{isAr ? 'تمت الإضافة للسلة بنجاح!' : 'Added to Cart!'}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 text-amber-400" />
                          <span>{isAr ? 'إضافة هذا العطر المركب إلى السلة' : 'Add Formulated Perfume to Cart'}</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyFormula}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-neutral-700" />
                    <span>{isAr ? 'نسخ المقادير المعملية الكاملة' : 'Copy Full Formula Sheet'}</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* LABORATORY MACERATION & PROTOCOL INSTRUCTIONS (PRINT READY) */}
          <div className="p-4 bg-neutral-100 rounded-2xl border border-neutral-300 text-xs space-y-2 text-neutral-800">
            <h5 className="font-black text-black flex items-center gap-2 text-xs">
              <span>⚗️</span>
              <span>{isAr ? 'بروتوكول التركيب المعملي وفترة التعتيق (Maceration Protocol):' : 'Compounding & Maceration Protocol:'}</span>
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-600 leading-relaxed font-medium">
              <li>
                {isAr 
                  ? 'وزن الزيت العطري في وعاء زجاجي نقي وجاف، ثم إضافة كحول العطور 96° تدريجياً مع التحريك المستمر لمدة دقيقة.' 
                  : 'Weigh fragrance oil in a clean glass beaker, then add 96° perfumer alcohol slowly while stirring.'}
              </li>
              <li>
                {isAr 
                  ? 'إضافة مثبت نَسَمَات العطري بنسبة المقادير الموضحة أعلاه لربط النوتات وتثبيت الفوحان.' 
                  : 'Add fragrance fixative at exact measured grams to bind volatile molecules.'}
              </li>
              <li>
                {isAr 
                  ? 'إغلاق الزجاجة بإحكام وحفظها في مكان بارد ومظلم (15-18°C) لفترة تعتيق لا تقل عن 7-14 يوماً لاكتمال الانسجام العطري.' 
                  : 'Seal flacon and macerate in cool dark storage (15-18°C) for 7-14 days for optimal harmony.'}
              </li>
            </ol>
          </div>

        </div>

      </div>
    </div>
  );
};
