import React, { useState, useMemo, useEffect } from 'react';
import { 
  Droplet, 
  Package, 
  AlertTriangle, 
  FlaskConical, 
  DollarSign, 
  Bookmark,
  ArrowRight,
  ShieldCheck,
  Table,
  Settings,
  PieChart,
  Store,
  FileText,
  CheckCircle2,
  Receipt,
  ShoppingBag,
  Lock,
  Eye,
  EyeOff
} from './icons';
import type { FragranceOil, RawMaterial, ProductionBatch, AppSettings, FragranceFamily } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedOilName, getLocalizedBrand, getLocalizedFamily } from '../utils/i18n';
import { saveSettings, loadSettings } from '../utils/storage';

interface DashboardTabProps {
  oils: FragranceOil[];
  materials: RawMaterial[];
  batches: ProductionBatch[];
  settings: AppSettings;
  onNavigateToTab: (tab: any) => void;
  onUpdateSettings?: (settings: AppSettings) => void;
  onRestockOil?: (id: string, qty: number, cost?: number) => void;
  onRestockMaterial?: (id: string, qty: number, cost?: number) => void;
  onOpenBackup?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  oils,
  materials,
  batches,
  settings,
  onNavigateToTab,
  onUpdateSettings,
  onOpenBackup,
}) => {
  const { language, t } = useLanguage();

  // Store Settings Local State
  const [storeName, setStoreName] = useState(
    settings.storeName || (language === 'ar' ? 'نسمات للعطور الفاخرة' : 'Nasamat Luxury Perfumes')
  );
  const [storeLocation, setStoreLocation] = useState(
    settings.storeLocation || (language === 'ar' ? 'بيروت - لبنان' : 'Beirut - Lebanon')
  );
  const [storePhone, setStorePhone] = useState(
    settings.storePhone && settings.storePhone !== '+961 70 000 000' ? settings.storePhone : '+961 81 713 408'
  );
  const [currency, setCurrency] = useState(settings.currency || '$');
  const [defaultProfitMargin, setDefaultProfitMargin] = useState(settings.defaultProfitMargin || 65);
  const [defaultConcentration, setDefaultConcentration] = useState(settings.defaultConcentrationPercent || 33);
  const [defaultFixative, setDefaultFixative] = useState(settings.defaultFixativePercent || 1.5);
  const [adminPassword, setAdminPassword] = useState(settings.adminPassword || '1234');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);

  useEffect(() => {
    if (settings.storeName) setStoreName(settings.storeName);
    if (settings.storeLocation) setStoreLocation(settings.storeLocation);
    if (settings.storePhone && settings.storePhone !== '+961 70 000 000') setStorePhone(settings.storePhone);
    if (settings.currency) setCurrency(settings.currency);
    if (settings.defaultProfitMargin) setDefaultProfitMargin(settings.defaultProfitMargin);
    if (settings.defaultConcentrationPercent) setDefaultConcentration(settings.defaultConcentrationPercent);
    if (settings.defaultFixativePercent) setDefaultFixative(settings.defaultFixativePercent);
    if (settings.adminPassword) setAdminPassword(settings.adminPassword);
  }, [settings]);

  // Financial & Inventory KPI Calculations
  const totalOilStockValue = useMemo(() => {
    return oils.reduce((sum, o) => sum + o.currentQuantity * o.unitCost, 0);
  }, [oils]);

  const totalMaterialsValue = useMemo(() => {
    return materials.reduce((sum, m) => sum + m.currentQuantity * m.unitCost, 0);
  }, [materials]);

  const totalAssetValue = totalOilStockValue + totalMaterialsValue;

  const totalOilLiters = useMemo(() => {
    return oils.reduce((sum, o) => sum + o.currentQuantity, 0) / 1000;
  }, [oils]);

  const totalBottlesInStock = useMemo(() => {
    return materials
      .filter((m) => m.category === 'bottle')
      .reduce((sum, m) => sum + m.currentQuantity, 0);
  }, [materials]);

  const lowStockOils = useMemo(() => {
    return oils.filter((o) => o.currentQuantity <= o.lowStockThreshold);
  }, [oils]);

  const lowStockMaterials = useMemo(() => {
    return materials.filter((m) => m.currentQuantity <= m.lowStockThreshold);
  }, [materials]);

  const totalLowStock = lowStockOils.length + lowStockMaterials.length;

  // Batches Analytics
  const totalBottlesProduced = useMemo(() => {
    return batches.reduce((sum, b) => sum + b.bottlesCount, 0);
  }, [batches]);

  const totalBatchesCost = useMemo(() => {
    return batches.reduce((sum, b) => sum + b.totalBatchCost, 0);
  }, [batches]);

  const totalBatchesProfit = useMemo(() => {
    return batches.reduce((sum, b) => sum + b.totalExpectedProfit, 0);
  }, [batches]);

  // Production Volume by Bottle Size
  const bottlesBySize = useMemo(() => {
    let b30 = 0;
    let b50 = 0;
    let b100 = 0;
    batches.forEach((b) => {
      const cap = b.formula.bottleCapacityMl;
      if (cap <= 35) b30 += b.bottlesCount;
      else if (cap <= 60) b50 += b.bottlesCount;
      else b100 += b.bottlesCount;
    });
    return { b30, b50, b100 };
  }, [batches]);

  // Family Distribution
  const familyDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    oils.forEach((o) => {
      counts[o.family] = (counts[o.family] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [oils]);

  // Supplier Distribution
  const supplierDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    oils.forEach((o) => {
      const b = o.brand.split('(')[0].trim();
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [oils]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSettings) {
      const current = loadSettings();
      const updated: AppSettings = {
        ...current,
        ...settings,
        storeName: storeName.trim() || settings.storeName,
        storeLocation: storeLocation.trim() || settings.storeLocation,
        storePhone: storePhone.trim() || settings.storePhone,
        currency,
        defaultProfitMargin: Number(defaultProfitMargin),
        defaultConcentrationPercent: Number(defaultConcentration),
        defaultFixativePercent: Number(defaultFixative),
        adminPassword: adminPassword.trim() || '1234',
        lastBackupDate: new Date().toISOString(),
      };
      saveSettings(updated);
      onUpdateSettings(updated);
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 3500);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ================= TOP HERO BANNER & QUICK ACTIONS ================= */}
      {/* Top Banner: Haute Parfumerie Executive Overview */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-black border border-neutral-300 text-[11px] font-bold">
                {language === 'ar' ? 'لوحة القيادة الإدارية والمالية' : 'Executive Management Dashboard'}
              </span>
              <span className="text-xs text-neutral-500 font-mono">NASAMAT EXECUTIVE v3.0</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-black flex items-center gap-2 font-serif">
              <span>{storeName}</span>
              <Droplet className="w-6 h-6 text-black" />
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
              {language === 'ar' 
                ? 'إدارة شاملة لتركيب العطور في السوق اللبناني: 100 صنف عطر مركز، حساب التكاليف، رصيد المواد، وتسعير الأحجام (30ml, 50ml, 100ml)'
                : 'Comprehensive perfume formulation management in Lebanon: 100 concentrated oils, batch costs, stock levels, and size pricing (30ml, 50ml, 100ml)'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateToTab('store')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-900 text-white font-black text-xs shadow-sm transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              <span className="text-white">{language === 'ar' ? 'صفحة الزبائن (المتجر)' : 'Customer Store'}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('calculator')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black border border-neutral-300 font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <FlaskConical className="w-4 h-4 text-black" />
              <span>{t('tabCalculator')}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('recipes')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black border border-neutral-300 font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-black" />
              <span>{t('tabRecipes')}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('invoices')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black border border-neutral-300 font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-black" />
              <span>{t('tabInvoices')}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('catalog')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black border border-neutral-300 font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Table className="w-4 h-4 text-black" />
              <span>{language === 'ar' ? 'جدول الـ 100 عطر (Excel)' : '100 Scents Excel Sheet'}</span>
            </button>
            {onOpenBackup && (
              <button
                onClick={onOpenBackup}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black border border-neutral-300 text-xs font-semibold transition cursor-pointer shadow-xs"
                title={t('backupReportsBtn')}
              >
                <FileText className="w-4 h-4 text-neutral-700" />
                <span className="hidden sm:inline">{t('backupReportsBtn')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= SECTION 1: FINANCIAL & INVENTORY KPI CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Assets Value */}
        <div className="bg-white border border-neutral-200 hover:border-black rounded-2xl p-4 shadow-xs transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-600 font-bold">
              {language === 'ar' ? 'إجمالي قيمة الأصول والمخزون' : 'Total Inventory Value'}
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              ${totalAssetValue.toFixed(2)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-1 font-medium">
              <span>{language === 'ar' ? 'زيوت:' : 'Oils:'} ${totalOilStockValue.toFixed(2)}</span>
              <span>{language === 'ar' ? 'مواد:' : 'Materials:'} ${totalMaterialsValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Fragrance Oil Volume */}
        <div className="bg-white border border-neutral-200 hover:border-black rounded-2xl p-4 shadow-xs transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-600 font-bold">
              {language === 'ar' ? 'حجم الزيوت العطرية المركزة' : 'Total Fragrance Oils'}
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Droplet className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-800 font-mono">
              {totalOilLiters.toFixed(2)} <span className="text-sm font-normal text-neutral-500">{language === 'ar' ? 'لتر' : 'L'}</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 font-medium">
              {language === 'ar' ? `عبر ${oils.length} صنف عطر مسجل` : `Across ${oils.length} registered scents`}
            </div>
          </div>
        </div>

        {/* KPI 3: Glass Bottles in Stock */}
        <div className="bg-white border border-neutral-200 hover:border-black rounded-2xl p-4 shadow-xs transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-600 font-bold">
              {language === 'ar' ? 'الزجاجات الجاهزة للتعبئة' : 'Bottles in Stock'}
            </span>
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-sky-800 font-mono">
              {totalBottlesInStock.toLocaleString()} <span className="text-sm font-normal text-neutral-500">{language === 'ar' ? 'زجاجة' : 'pcs'}</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 font-medium">
              {language === 'ar' ? 'أحجام 30 مل، 50 مل، 100 مل' : 'Sizes 30ml, 50ml, 100ml'}
            </div>
          </div>
        </div>

        {/* KPI 4: Low Stock Warnings */}
        <div className={`border rounded-2xl p-4 shadow-xs transition flex flex-col justify-between ${
          totalLowStock > 0 ? 'border-rose-300 bg-rose-50/40 hover:border-rose-500' : 'bg-white border-neutral-200 hover:border-black'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-600 font-bold">
              {t('dashHealthTitle')}
            </span>
            <span className={`p-2 rounded-xl ${totalLowStock > 0 ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className={`text-2xl font-black font-mono ${totalLowStock > 0 ? 'text-rose-700' : 'text-neutral-900'}`}>
              {totalLowStock} <span className="text-sm font-normal text-neutral-500">{language === 'ar' ? 'عناصر' : 'items'}</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 font-medium">
              {lowStockOils.length} {language === 'ar' ? 'زيت' : 'oils'} | {lowStockMaterials.length} {language === 'ar' ? 'مادة أولية' : 'materials'}
            </div>
          </div>
        </div>

      </div>

      {/* ================= SECTION 2: PRODUCTION ANALYTICS & BOTTLE SIZES ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Actual Production Deck */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">
                {language === 'ar' ? 'سجل عمليات الإنتاج والتشغيلات الفعلية' : 'Production Batches & Manufacturing Activity'}
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab('batches')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'ar' ? 'عرض سجل التشغيلات الكامل' : 'View Full Batches Log'}</span>
              <ArrowRight className={`w-3 h-3 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">{t('dashKpiBatches')}</span>
              <span className="text-lg font-black text-amber-400">{batches.length}</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الزجاجات المصنعة' : 'Bottles Produced'}</span>
              <span className="text-lg font-black text-slate-100">{totalBottlesProduced}</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'تكلفة الإنتاج الفعلي' : 'Actual Cost'}</span>
              <span className="text-lg font-black text-slate-200">${totalBatchesCost.toFixed(2)}</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الأرباح المحققة' : 'Net Profits'}</span>
              <span className="text-lg font-black text-emerald-400">+${totalBatchesProfit.toFixed(2)}</span>
            </div>
          </div>

          {/* Breakdown by Bottle Size */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-slate-300 block">
              {language === 'ar' ? 'توزيع الإنتاج والأسعار المعتمدة حسب حجم الزجاجة:' : 'Production Volume & Standard Lebanese Pricing by Size:'}
            </span>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-200">30ml:</span>
                  <span className="font-mono text-amber-400 font-bold">{bottlesBySize.b30} {language === 'ar' ? 'زجاجة' : 'pcs'}</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-mono font-bold">
                  {language === 'ar' ? 'سعر المفرق: $10.00' : 'Retail: $10.00'}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-amber-500/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-amber-200">50ml ⭐:</span>
                  <span className="font-mono text-amber-400 font-black">{bottlesBySize.b50} {language === 'ar' ? 'زجاجة' : 'pcs'}</span>
                </div>
                <div className="text-[10px] text-amber-300 font-mono font-bold">
                  {language === 'ar' ? 'مفرق: $16 (جملة: $8.50)' : 'Retail: $16 (W/S: $8.50)'}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-200">100ml:</span>
                  <span className="font-mono text-sky-400 font-bold">{bottlesBySize.b100} {language === 'ar' ? 'زجاجة' : 'pcs'}</span>
                </div>
                <div className="text-[10px] text-sky-400 font-mono font-bold">
                  {language === 'ar' ? 'سعر المفرق: $25.00' : 'Retail: $25.00'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Reorder & Inventory Health Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">{t('dashHealthTitle')}</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                totalLowStock > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {totalLowStock > 0 ? `${totalLowStock} ${language === 'ar' ? 'عناصر تنبيه' : 'alerts'}` : (language === 'ar' ? 'آمن 100%' : '100% Healthy')}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              {t('dashHealthSubtitle')}
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-slate-950/60">
                <span className="text-slate-300">{language === 'ar' ? 'الزيوت المتوفرة بأمان:' : 'Sufficient Oils:'}</span>
                <span className="font-bold text-emerald-400">{oils.length - lowStockOils.length} {language === 'ar' ? 'صنف' : 'scents'}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-950/60">
                <span className="text-slate-300">{language === 'ar' ? 'زيوت اقتربت من النفاد:' : 'Low Stock Oils:'}</span>
                <span className={`font-bold ${lowStockOils.length > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {lowStockOils.length} {language === 'ar' ? 'صنف' : 'scents'}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-950/60">
                <span className="text-slate-300">{language === 'ar' ? 'مواد أولية تحتاج طلب:' : 'Materials to Reorder:'}</span>
                <span className={`font-bold ${lowStockMaterials.length > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {lowStockMaterials.length} {language === 'ar' ? 'مادة' : 'items'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4">
            <button
              onClick={() => onNavigateToTab('catalog')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Table className="w-4 h-4 text-amber-400" />
              <span>{language === 'ar' ? 'مراجعة الأصناف في جدول Excel' : 'Review in Excel Spreadsheet'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* ================= SECTION 3: FEATURED SHOWCASE WITH PHOTOS & SIZES ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-400" />
              <span>{t('dashFeaturedTitle')}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {t('dashFeaturedSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('catalog')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'ar' ? 'عرض كل الـ 100 عطر في Excel' : 'View all 100 Scents in Excel'}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {oils.slice(0, 6).map((oil) => (
            <div
              key={oil.id}
              onClick={() => onNavigateToTab('catalog')}
              className="group bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-2.5 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div>
                <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-800 group-hover:border-amber-400/50 mb-2 bg-slate-900">
                  {oil.imageUrl ? (
                    <img
                      src={oil.imageUrl}
                      alt={oil.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-400/40">
                      <Droplet className="w-6 h-6" />
                    </div>
                  )}
                  <span className={`absolute top-1.5 ${language === 'ar' ? 'right-1.5' : 'left-1.5'} px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm text-[9px] font-mono font-bold text-amber-300 border border-amber-500/30`}>
                    {oil.code}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition truncate">
                  {getLocalizedOilName(oil.name, language)}
                </h4>
                <p className="text-[10px] text-slate-400 truncate mb-2">
                  {getLocalizedBrand(oil.brand, language)}
                </p>
              </div>

              {/* Price Chips */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1 font-mono text-[10px]">
                <div className="flex justify-between text-slate-300">
                  <span className="text-[9px] text-slate-400">30ml:</span>
                  <strong className="text-emerald-400">${(oil.retailPrice30ml || 5).toFixed(0)}</strong>
                </div>
                <div className="flex justify-between bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">
                  <span className="text-[9px] text-amber-300 font-semibold">50ml:</span>
                  <strong className="text-amber-400 font-bold">${(oil.retailPrice50ml || 7).toFixed(0)}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-[9px] text-slate-400">100ml:</span>
                  <strong className="text-sky-400">${(oil.retailPrice100ml || 12).toFixed(0)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= SECTION 4: ADVANCED INVENTORY INSIGHTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Fragrance Families Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              {language === 'ar' ? 'توزيع الأصناف الـ 100 حسب العائلات العطرية' : '100 Scents by Fragrance Family'}
            </h3>
            <span className="text-[11px] text-slate-400">{oils.length} {language === 'ar' ? 'صنف مسجل' : 'scents'}</span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            {familyDistribution.map(([fam, count]) => {
              const pct = Math.round((count / oils.length) * 100);
              return (
                <div key={fam} className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>{getLocalizedFamily(fam as FragranceFamily, language)}</span>
                    <span className="font-bold text-amber-400">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Suppliers Distribution in Lebanon */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400" />
              {language === 'ar' ? 'توزيع الأصناف حسب المصدر والشركات الموردة' : 'Fragrance Houses & Suppliers'}
            </h3>
            <span className="text-[11px] text-slate-400">{language === 'ar' ? 'زيوت فرنسية وسويسرية' : 'Swiss & French Oils'}</span>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            {supplierDistribution.map(([supplier, count]) => {
              const pct = Math.round((count / oils.length) * 100);
              return (
                <div key={supplier} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-bold text-slate-200">{getLocalizedBrand(supplier, language)}</span>
                  </div>
                  <div className={`font-mono ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                    <span className="font-bold text-slate-100">{count}</span>
                    <span className={`text-slate-500 text-[10px] ${language === 'ar' ? 'mr-1' : 'ml-1'}`}>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ================= SECTION 5: STORE SETTINGS & CONFIGURATION PANEL ================= */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {t('dashSettingsTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('dashSettingsSubtitle')}
              </p>
            </div>
          </div>

          {savedAlert && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings successfully saved!'}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Store Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('dashStoreName')}
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Store Location */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('dashStoreLocation')}
              </label>
              <input
                type="text"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Store Phone */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('dashStorePhone')}
              </label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'ar' ? 'عملة النظام الرئيسية' : 'Primary Currency'}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="$">$ (USD - الدولار الأمريكي)</option>
                <option value="ل.ل">ل.ل (LBP - الليرة اللبنانية)</option>
              </select>
            </div>

            {/* Default Profit Margin */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('dashDefaultMargin')}
              </label>
              <input
                type="number"
                min="10"
                max="90"
                value={defaultProfitMargin}
                onChange={(e) => setDefaultProfitMargin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Default Concentration % */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'ar' ? 'نسبة الزيت الافتراضية (%)' : 'Default Oil Concentration (%)'}
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={defaultConcentration}
                onChange={(e) => setDefaultConcentration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Default Fixative % */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'ar' ? 'نسبة المثبت الافتراضية (%)' : 'Default Fixative (%)'}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={defaultFixative}
                onChange={(e) => setDefaultFixative(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Admin Password */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('adminPasswordLabel')}</span>
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute left-auto right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showAdminPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className={`flex ${language === 'ar' ? 'justify-end' : 'justify-start'} pt-3 border-t border-slate-800`}>
            <button
              type="submit"
              className="py-2 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              {t('dashSaveSettingsBtn')}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
