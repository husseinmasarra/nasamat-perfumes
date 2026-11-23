import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  FlaskConical, 
  Droplet, 
  Droplets,
  Check, 
  X, 
  AlertCircle, 
  DollarSign, 
  TrendingUp,
  Bookmark,
  Printer,
  Table,
  Sliders,
  FileText
} from './icons';
import type { 
  SavedRecipe, 
  FragranceOil, 
  RawMaterial, 
  AppSettings, 
  RecipeCategory, 
  ConcentrationTier 
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  getLocalizedRecipeCategory, 
  getLocalizedGender, 
  getLocalizedSeason, 
  getLocalizedOilName 
} from '../utils/i18n';

interface RecipesTabProps {
  recipes: SavedRecipe[];
  oils: FragranceOil[];
  materials: RawMaterial[];
  settings: AppSettings;
  onFormulateRecipe: (recipe: SavedRecipe) => void;
  onSaveRecipe: (recipe: SavedRecipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
}

const PALETTE = [
  'bg-amber-500 text-amber-950 border-amber-400',
  'bg-rose-500 text-rose-950 border-rose-400',
  'bg-emerald-500 text-emerald-950 border-emerald-400',
  'bg-sky-500 text-sky-950 border-sky-400',
  'bg-purple-500 text-purple-950 border-purple-400',
  'bg-orange-500 text-orange-950 border-orange-400',
  'bg-teal-500 text-teal-950 border-teal-400',
];

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1592914610354-fd354ea45e48?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=400&q=80',
];

// Helper to calculate exact measurements for any recipe and bottle size
export interface ExactFormulation {
  size: number;
  concentrationPercent: number;
  fixativePercent: number;
  totalOilMl: number;
  totalOilG: number;
  alcoholMl: number;
  alcoholG: number;
  fixativeMl: number;
  fixativeG: number;
  fixativeDrops: number;
  totalLiquidMl: number;
  totalLiquidG: number;
  oilItems: {
    oilId: string;
    percentage: number;
    volumeMl: number;
    weightG: number;
    drops: number;
    cost: number;
    name: string;
    notes?: string;
  }[];
  oilCost: number;
  materialsCost: number;
  totalCost: number;
  retailPrice: number;
  netProfit: number;
  margin: number;
}

export function computeRecipeMeasurements(
  recipe: SavedRecipe,
  size: number,
  oilsMap: Map<string, FragranceOil>,
  defaultDensity = 0.95
): ExactFormulation {
  const concentrationPercent = recipe.concentrationPercent || 25;
  const fixativePercent = recipe.fixativePercent || 1.5;

  const totalOilMl = Number(((size * concentrationPercent) / 100).toFixed(2));
  const totalOilG = Number((totalOilMl * defaultDensity).toFixed(2));

  const fixativeMl = Number(((size * fixativePercent) / 100).toFixed(2));
  const fixativeG = Number((fixativeMl * 1.02).toFixed(2));
  const fixativeDrops = Math.round(fixativeMl * 20);

  const alcoholMl = Number(Math.max(0, size - totalOilMl - fixativeMl).toFixed(2));
  const alcoholG = Number((alcoholMl * 0.81).toFixed(2));

  const totalLiquidMl = size;
  const totalLiquidG = Number((totalOilG + fixativeG + alcoholG).toFixed(2));

  let oilCostSum = 0;
  const oilItems = recipe.oils.map((item) => {
    const oil = oilsMap.get(item.oilId);
    const itemMl = Number(((totalOilMl * (item.percentage || 0)) / 100).toFixed(2));
    const density = oil?.density || defaultDensity;
    const itemG = Number((itemMl * density).toFixed(2));
    const drops = Math.round(itemMl * 20);
    const cost = oil ? Number((itemMl * oil.unitCost).toFixed(2)) : 0;
    oilCostSum += cost;

    return {
      oilId: item.oilId,
      percentage: item.percentage,
      volumeMl: itemMl,
      weightG: itemG,
      drops,
      cost,
      name: oil?.name || item.notes || 'Fragrance Oil',
      notes: item.notes,
    };
  });

  // Bottle cost: 30ml = $1.00, 50ml = $1.35, 100ml = $1.80
  const bottleCost = size <= 35 ? 1.00 : size <= 65 ? 1.35 : 1.80;
  const sprayerCost = 0.75;
  const packagingCost = 0.70;
  const alcoholCost = Number((alcoholMl * 0.004).toFixed(2));
  const fixativeCost = Number((fixativeMl * 0.02).toFixed(2));
  const materialsCost = Number((bottleCost + sprayerCost + packagingCost + alcoholCost + fixativeCost).toFixed(2));
  const totalCost = Number((oilCostSum + materialsCost).toFixed(2));

  // Retail prices: 30ml = $5, 50ml = $7, 100ml = $12
  const retailPrice = size <= 35 ? 5 : size <= 65 ? 7 : 12;
  const netProfit = Number((retailPrice - totalCost).toFixed(2));
  const margin = retailPrice > 0 ? Number(((netProfit / retailPrice) * 100).toFixed(0)) : 0;

  return {
    size,
    concentrationPercent,
    fixativePercent,
    totalOilMl,
    totalOilG,
    alcoholMl,
    alcoholG,
    fixativeMl,
    fixativeG,
    fixativeDrops,
    totalLiquidMl,
    totalLiquidG,
    oilItems,
    oilCost: Number(oilCostSum.toFixed(2)),
    materialsCost,
    totalCost,
    retailPrice,
    netProfit,
    margin,
  };
}

export const RecipesTab: React.FC<RecipesTabProps> = ({
  recipes,
  oils,
  materials,
  settings,
  onFormulateRecipe,
  onSaveRecipe,
  onDeleteRecipe,
}) => {
  const { language, t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingRecipe, setEditingRecipe] = useState<SavedRecipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Per-card selected bottle size (defaults to 50ml or recipe default)
  const [cardSizes, setCardSizes] = useState<Record<string, number>>({});

  // Active recipe for Laboratory Master Formulation Sheet Modal
  const [labSheetData, setLabSheetData] = useState<{ recipe: SavedRecipe; size: number } | null>(null);

  // Map oils for quick lookups
  const oilsMap = useMemo(() => new Map(oils.map((o) => [o.id, o])), [oils]);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((rec) => {
      const matchCategory = selectedCategory === 'all' || rec.category === selectedCategory;
      const q = searchTerm.trim().toLowerCase();
      if (!q) return matchCategory;

      const matchName = rec.name.toLowerCase().includes(q) || (rec.nameEn && rec.nameEn.toLowerCase().includes(q));
      const matchCode = rec.code.toLowerCase().includes(q);
      const matchNotes = rec.scentNotes && rec.scentNotes.toLowerCase().includes(q);
      const matchDesc = rec.description && rec.description.toLowerCase().includes(q);
      const matchOil = rec.oils.some((ro) => {
        const oil = oilsMap.get(ro.oilId);
        return oil && oil.name.toLowerCase().includes(q);
      });

      return matchCategory && (matchName || matchCode || matchNotes || matchDesc || matchOil);
    });
  }, [recipes, selectedCategory, searchTerm, oilsMap]);

  // KPI Calculations
  const totalCount = recipes.length;
  const signatureCount = recipes.filter((r) => r.isSignature || r.category === 'signature').length;
  
  // Average suggested price (strictly $7)
  const avgPrice = useMemo(() => {
    if (recipes.length === 0) return 7;
    return 7;
  }, [recipes]);

  // Open modal for new recipe
  const handleOpenCreateModal = () => {
    const nextNum = recipes.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    const newRecipe: SavedRecipe = {
      id: `rec-custom-${Date.now()}`,
      code: `NAS-REC-${padded}`,
      name: '',
      nameEn: '',
      description: '',
      category: 'signature',
      bottleCapacityMl: 50,
      concentrationPercent: 25,
      concentrationTier: 'edp',
      fixativePercent: 1.5,
      oils: [
        { oilId: oils[0]?.id || '', percentage: 60 },
        { oilId: oils[1]?.id || '', percentage: 40 },
      ],
      suggestedRetailPrice: 7,
      targetGender: 'unisex',
      season: 'all',
      scentNotes: '',
      imageUrl: PRESET_IMAGES[0],
      isSignature: true,
      isMaster: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingRecipe(newRecipe);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (recipe: SavedRecipe) => {
    setEditingRecipe(JSON.parse(JSON.stringify(recipe)));
    setIsModalOpen(true);
  };

  // Duplicate recipe
  const handleDuplicateRecipe = (recipe: SavedRecipe) => {
    const nextNum = recipes.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    const dup: SavedRecipe = {
      ...recipe,
      id: `rec-dup-${Date.now()}`,
      code: `NAS-REC-${padded}`,
      name: `${recipe.name} (${language === 'ar' ? 'نسخة' : 'Copy'})`,
      nameEn: recipe.nameEn ? `${recipe.nameEn} (Copy)` : undefined,
      suggestedRetailPrice: 7,
      isMaster: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSaveRecipe(dup);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-black font-bold text-xs tracking-wider uppercase">
              <Bookmark className="w-4 h-4 text-black" />
              <span>{t('tabRecipes')}</span>
              <span className="bg-neutral-100 text-black border border-neutral-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                {recipes.length} {language === 'ar' ? 'وصفة محفوظة' : 'Saved'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-black flex items-center gap-2 font-serif">
              <span>{t('recipesTitle')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl leading-relaxed">
              {t('recipesSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-3 bg-black hover:bg-neutral-900 text-white font-black rounded-xl shadow-sm text-xs sm:text-sm transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3] text-white" />
              <span className="text-white">{t('recipesAddBtn')}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-neutral-200">
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-neutral-600 font-bold block">{t('recipeKpiTotal')}</span>
            <span className="text-xl font-black text-black font-mono">{totalCount}</span>
          </div>
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-amber-900 font-bold block">{t('recipeKpiSignatures')}</span>
            <span className="text-xl font-black text-amber-700 font-mono">{signatureCount}</span>
          </div>
          <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-rose-900 font-bold block">{t('recipeKpiAvgCost')}</span>
            <span className="text-xl font-black text-rose-700 font-mono">~{settings.currency}4.40</span>
          </div>
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-emerald-900 font-bold block">{t('recipeKpiAvgPrice')}</span>
            <span className="text-xl font-black text-emerald-700 font-mono">{settings.currency}{avgPrice}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('recipesSearchPlaceholder')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl ps-9 pe-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: t('recipeFilterAll') },
            { id: 'signature', label: t('recipeFilterSignature') },
            { id: 'men', label: t('recipeFilterMen') },
            { id: 'women', label: t('recipeFilterWomen') },
            { id: 'unisex', label: t('recipeFilterUnisex') },
            { id: 'oriental', label: t('recipeFilterOriental') },
            { id: 'fresh', label: t('recipeFilterFresh') },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              {language === 'ar' ? 'لم يتم العثور على أي خلطة' : 'No recipes found'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? 'جرب البحث بكلمات أخرى أو قم بابتكار خلطة مميزة جديدة' : 'Try adjusting your search or craft a new signature blend'}
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('recipesAddBtn')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecipes.map((recipe) => {
            const currentSize = cardSizes[recipe.id] || recipe.bottleCapacityMl || 50;
            const measures = computeRecipeMeasurements(recipe, currentSize, oilsMap, settings.defaultOilDensity || 0.95);
            const catInfo = getLocalizedRecipeCategory(recipe.category, language);
            const genderStr = getLocalizedGender(recipe.targetGender, language);
            const seasonStr = getLocalizedSeason(recipe.season, language);

            return (
              <div
                key={recipe.id}
                className="bg-slate-900 border border-slate-800/90 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-200 flex flex-col group"
              >
                {/* Card Top Artwork & Badges */}
                <div className="relative h-36 bg-slate-950 overflow-hidden">
                  <img
                    src={recipe.imageUrl || PRESET_IMAGES[0]}
                    alt={recipe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 start-3 end-3 flex items-center justify-between gap-2">
                    <span className="bg-slate-950/80 backdrop-blur-md border border-amber-500/30 text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <span>{catInfo.icon}</span>
                      <span>{catInfo.label}</span>
                    </span>

                    <span className="bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold">
                      {recipe.code}
                    </span>
                  </div>

                  {/* Bottom Sub-badges in image */}
                  <div className="absolute bottom-2 start-3 flex items-center gap-1.5 flex-wrap">
                    <span className="bg-slate-900/90 border border-slate-700/60 text-slate-300 text-[10px] px-2 py-0.5 rounded-md">
                      {genderStr}
                    </span>
                    <span className="bg-slate-900/90 border border-slate-700/60 text-slate-300 text-[10px] px-2 py-0.5 rounded-md">
                      {seasonStr}
                    </span>
                    {recipe.isMaster && (
                      <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] px-2 py-0.5 rounded-md font-bold">
                        ⭐ {t('recipeBadgeMaster')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Title */}
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {recipe.name}
                      </h2>
                      {recipe.nameEn && (
                        <p className="text-xs text-slate-400 font-medium line-clamp-1">
                          {recipe.nameEn}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    {recipe.description && (
                      <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2">
                        {recipe.description}
                      </p>
                    )}

                    {/* Scent Pyramid / Olfactory Notes */}
                    {recipe.scentNotes && (
                      <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-2.5 text-[11px] text-slate-400 leading-snug">
                        <span className="text-amber-400/90 font-bold block mb-0.5">
                          {language === 'ar' ? 'الهرم العطري:' : 'Pyramid Notes:'}
                        </span>
                        <span className="text-slate-300">{recipe.scentNotes}</span>
                      </div>
                    )}

                    {/* Exact Size Selector Pill */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-bold flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t('recipeSelectBatchSize')}</span>
                        </span>
                        <span className="text-amber-400 font-mono font-bold text-xs">
                          {measures.concentrationPercent}% ({recipe.concentrationTier.toUpperCase()})
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                        {[
                          { size: 30, label: '30 ml', price: '$5' },
                          { size: 50, label: '50 ml', price: '$7', top: true },
                          { size: 100, label: '100 ml', price: '$12' },
                        ].map((btn) => {
                          const isSel = currentSize === btn.size;
                          return (
                            <button
                              key={btn.size}
                              type="button"
                              onClick={() => setCardSizes((prev) => ({ ...prev, [recipe.id]: btn.size }))}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                isSel
                                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                              }`}
                            >
                              <span>{btn.label}</span>
                              <span className={`text-[10px] font-mono ${isSel ? 'text-slate-950 font-black' : 'text-amber-400/90'}`}>
                                {btn.price}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Exact Measurements Table */}
                    <div className="space-y-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800">
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          <Droplet className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t('recipeExactMeasures')} ({currentSize}ml)</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          {measures.totalLiquidMl}ml • {measures.totalLiquidG}g
                        </span>
                      </div>

                      {/* Oil rows */}
                      <div className="space-y-1.5">
                        {measures.oilItems.map((item, idx) => {
                          const colorBg = PALETTE[idx % PALETTE.length].split(' ')[0];
                          const oil = oilsMap.get(item.oilId);
                          const isLow = oil && oil.currentQuantity <= oil.lowStockThreshold;

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-1 text-[11px] bg-slate-900/90 border border-slate-800/80 px-2 py-1.5 rounded-lg"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-2 h-2 rounded-full ${colorBg} shrink-0`} />
                                <span className="font-semibold text-slate-200 truncate">
                                  {item.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 font-mono shrink-0">
                                <span className="text-amber-400 font-bold text-[10px]">
                                  {item.percentage}%
                                </span>
                                <span className="text-slate-300 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]">
                                  {item.volumeMl}ml ({item.weightG}g)
                                </span>
                                {isLow && <span title={t('lowStockWarning')}>⚠️</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Alcohol and Fixative breakdown */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono">
                        <div className="bg-slate-900/70 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-400">{language === 'ar' ? 'كحول 96%:' : 'Alcohol:'}</span>
                          <span className="text-sky-300 font-bold">{measures.alcoholMl}ml ({measures.alcoholG}g)</span>
                        </div>
                        <div className="bg-slate-900/70 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-400">{language === 'ar' ? 'المثبت:' : 'Fixative:'}</span>
                          <span className="text-purple-300 font-bold">{measures.fixativeMl}ml (~{measures.fixativeDrops}ق)</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Specs & Pricing Footer */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    {/* Cost & Profit Row */}
                    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] text-amber-300/80 block">{t('calcSuggestedRetail')} ({currentSize}ml)</span>
                        <span className="text-base font-black text-amber-400">
                          {settings.currency}{measures.retailPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="text-[10px] text-slate-400 block">{t('calcNetProfit')} (التكلفة {settings.currency}{measures.totalCost})</span>
                        <span className="text-xs font-bold text-emerald-400">
                          +{settings.currency}{measures.netProfit.toFixed(2)} ({measures.margin}%)
                        </span>
                      </div>
                    </div>

                    {/* Master Lab Sheet Button */}
                    <button
                      type="button"
                      onClick={() => setLabSheetData({ recipe, size: currentSize })}
                      className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-500/30 hover:border-amber-400/60 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('recipeLabSheetModalBtn')}</span>
                    </button>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {/* Primary Action: Open in Calculator */}
                      <button
                        onClick={() => onFormulateRecipe({ ...recipe, bottleCapacityMl: currentSize })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                        title={t('recipeFormulateInCalc')}
                      >
                        <FlaskConical className="w-4 h-4 stroke-[2.5]" />
                        <span>{t('recipeFormulateInCalc')}</span>
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicateRecipe(recipe)}
                        className="p-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                        title={t('recipeDuplicate')}
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEditModal(recipe)}
                        className="p-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-xl transition cursor-pointer"
                        title={t('recipeEdit')}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirmId(recipe.id)}
                        className="p-2.5 bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer"
                        title={t('recipeDelete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">{t('recipeDelete')}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('recipeDeleteConfirm')}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  onDeleteRecipe(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {t('recipeDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Laboratory Master Formulation Sheet Modal */}
      {labSheetData && (
        <LabSheetModal
          recipe={labSheetData.recipe}
          size={labSheetData.size}
          oilsMap={oilsMap}
          settings={settings}
          onClose={() => setLabSheetData(null)}
          onFormulate={() => {
            onFormulateRecipe({ ...labSheetData.recipe, bottleCapacityMl: labSheetData.size });
            setLabSheetData(null);
          }}
        />
      )}

      {/* Craft / Edit Recipe Modal */}
      {isModalOpen && editingRecipe && (
        <RecipeEditorModal
          recipe={editingRecipe}
          oils={oils}
          materials={materials}
          settings={settings}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRecipe(null);
          }}
          onSave={(saved) => {
            onSaveRecipe(saved);
            setIsModalOpen(false);
            setEditingRecipe(null);
          }}
        />
      )}

    </div>
  );
};

// ================= LABORATORY MASTER FORMULATION SHEET MODAL =================
interface LabSheetModalProps {
  recipe: SavedRecipe;
  size: number;
  oilsMap: Map<string, FragranceOil>;
  settings: AppSettings;
  onClose: () => void;
  onFormulate: () => void;
}

const LabSheetModal: React.FC<LabSheetModalProps> = ({
  recipe,
  size: initialSize,
  oilsMap,
  settings,
  onClose,
  onFormulate,
}) => {
  const { language, t } = useLanguage();
  const [currentSize, setCurrentSize] = useState(initialSize);

  const measures = computeRecipeMeasurements(recipe, currentSize, oilsMap, settings.defaultOilDensity || 0.95);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <FlaskConical className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">
                  {recipe.code}
                </span>
                <span className="text-xs text-slate-400">نسمات | مختبر العطور الملكية</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {t('recipeLabSheetModalTitle')}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Recipe Identity Banner */}
          <div className="flex items-start justify-between gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-amber-400">{recipe.name}</h2>
              {recipe.nameEn && <p className="text-xs text-slate-400">{recipe.nameEn}</p>}
              {recipe.scentNotes && (
                <p className="text-[11px] text-slate-300 pt-1">
                  <span className="text-amber-400/90 font-bold">الهرم العطري: </span>
                  {recipe.scentNotes}
                </p>
              )}
            </div>

            {/* Size Selector in Modal */}
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className="text-[10px] text-slate-400 font-semibold">{t('recipeSelectBatchSize')}</span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {[30, 50, 100].map((s) => (
                  <button
                    key={s}
                    onClick={() => setCurrentSize(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentSize === s
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}ml
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scale Guidance Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-amber-200 text-xs">
            <FlaskConical className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="leading-relaxed">
              {t('recipeLabScaleHint')}
            </p>
          </div>

          {/* Table of Exact Formulations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Table className="w-4 h-4 text-amber-400" />
              <span>{t('recipeExactMeasures')} — {currentSize} ملل (تركيز {measures.concentrationPercent}%)</span>
            </h4>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-3 text-start">المكون العطري / الخامة</th>
                    <th className="p-3 text-center">النسبة %</th>
                    <th className="p-3 text-center">الحجم (ml)</th>
                    <th className="p-3 text-center text-amber-300">الوزن بالميزان (g)</th>
                    <th className="p-3 text-center">القطرات التقريبية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {measures.oilItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="p-3 font-sans font-semibold text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-amber-400 font-bold">{item.percentage}%</td>
                      <td className="p-3 text-center text-slate-300">{item.volumeMl.toFixed(2)} ml</td>
                      <td className="p-3 text-center text-amber-300 font-bold bg-amber-500/5">{item.weightG.toFixed(2)} g</td>
                      <td className="p-3 text-center text-slate-400">~{item.drops} قطرة</td>
                    </tr>
                  ))}
                  
                  {/* Fixative Row */}
                  <tr className="bg-purple-950/20 hover:bg-purple-950/30">
                    <td className="p-3 font-sans font-semibold text-purple-300">
                      ⚓ {t('recipeFixativeLabel')} ({measures.fixativePercent}%)
                    </td>
                    <td className="p-3 text-center text-purple-400 font-bold">{measures.fixativePercent}%</td>
                    <td className="p-3 text-center text-purple-200">{measures.fixativeMl.toFixed(2)} ml</td>
                    <td className="p-3 text-center text-purple-300 font-bold bg-purple-500/5">{measures.fixativeG.toFixed(2)} g</td>
                    <td className="p-3 text-center text-purple-300">~{measures.fixativeDrops} قطرة</td>
                  </tr>

                  {/* Alcohol Row */}
                  <tr className="bg-sky-950/20 hover:bg-sky-950/30">
                    <td className="p-3 font-sans font-semibold text-sky-300">
                      🧪 {t('recipeAlcohol96Label')}
                    </td>
                    <td className="p-3 text-center text-sky-400 font-bold">{(100 - measures.concentrationPercent - measures.fixativePercent).toFixed(1)}%</td>
                    <td className="p-3 text-center text-sky-200">{measures.alcoholMl.toFixed(2)} ml</td>
                    <td className="p-3 text-center text-sky-300 font-bold bg-sky-500/5">{measures.alcoholG.toFixed(2)} g</td>
                    <td className="p-3 text-center text-sky-400">سرنجة مدرجة</td>
                  </tr>

                  {/* Total Row */}
                  <tr className="bg-slate-900 font-bold text-xs border-t-2 border-slate-700">
                    <td className="p-3 font-sans text-white">
                      ✨ {t('recipeTotalLiquidLabel')}
                    </td>
                    <td className="p-3 text-center text-white">100%</td>
                    <td className="p-3 text-center text-emerald-400 font-black">{measures.totalLiquidMl}.00 ml</td>
                    <td className="p-3 text-center text-emerald-400 font-black bg-emerald-500/10">{measures.totalLiquidG.toFixed(2)} g</td>
                    <td className="p-3 text-center text-slate-300">قارورة كاملة</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Certified 6 Formulation Steps */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <FlaskConical className="w-4 h-4 text-amber-400" />
              <span>{t('recipeStepsTitle')}</span>
            </h4>
            <div className="grid grid-cols-1 gap-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                {t('recipeStep1Text')}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                {t('recipeStep2Text')}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                {t('recipeStep3Text')}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                {t('recipeStep4Text')}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                {t('recipeStep5Text')}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                {t('recipeStep6Text')}
              </div>
            </div>
          </div>

          {/* Pricing & Economics */}
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">سعر البيع الرسمي المعتمد:</span>
              <span className="text-lg font-black text-amber-400">${measures.retailPrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">التكلفة الإجمالية:</span>
              <span className="text-sm font-bold text-rose-300">${measures.totalCost.toFixed(2)}</span>
            </div>
            <div className="text-end">
              <span className="text-slate-400 block text-[11px]">صافي الربح المتوقع:</span>
              <span className="text-sm font-bold text-emerald-400">+${measures.netProfit.toFixed(2)} ({measures.margin}%)</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'طباعة بطاقة الصياغة' : 'Print Formula'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              onClick={onFormulate}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <FlaskConical className="w-4 h-4 stroke-[2.5]" />
              <span>{t('recipeFormulateInCalc')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ================= RECIPE EDITOR / CRAFT NEW RECIPE MODAL =================
interface RecipeEditorModalProps {
  recipe: SavedRecipe;
  oils: FragranceOil[];
  materials: RawMaterial[];
  settings: AppSettings;
  onClose: () => void;
  onSave: (recipe: SavedRecipe) => void;
}

const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({
  recipe,
  oils,
  settings,
  onClose,
  onSave,
}) => {
  const { language, t } = useLanguage();
  const [draft, setDraft] = useState<SavedRecipe>({ ...recipe, suggestedRetailPrice: 7 });

  const oilsMap = useMemo(() => new Map(oils.map((o) => [o.id, o])), [oils]);

  // Sum of percentages
  const totalPercentage = useMemo(() => {
    return draft.oils.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
  }, [draft.oils]);

  const isTotal100 = totalPercentage === 100;

  // Live measurements preview for the draft
  const liveMeasures = useMemo(() => {
    return computeRecipeMeasurements(
      draft, 
      draft.bottleCapacityMl || 50, 
      oilsMap, 
      settings.defaultOilDensity || 0.95
    );
  }, [draft, oilsMap, settings]);

  // Auto balance helper: sets remaining percent to last oil or adds one
  const handleAutoBalance = () => {
    if (draft.oils.length === 0) return;
    const currentOthers = draft.oils.slice(0, -1).reduce((acc, curr) => acc + curr.percentage, 0);
    const lastIndex = draft.oils.length - 1;
    const remaining = Math.max(0, 100 - currentOthers);
    const nextOils = [...draft.oils];
    nextOils[lastIndex].percentage = remaining;
    setDraft({ ...draft, oils: nextOils });
  };

  const handleAddOilRow = () => {
    if (oils.length === 0) return;
    const remaining = Math.max(0, 100 - totalPercentage);
    setDraft({
      ...draft,
      oils: [
        ...draft.oils,
        { oilId: oils[0].id, percentage: remaining || 10 }
      ]
    });
  };

  const handleRemoveOilRow = (index: number) => {
    if (draft.oils.length <= 1) return;
    const next = [...draft.oils];
    next.splice(index, 1);
    setDraft({ ...draft, oils: next });
  };

  const handleUpdateOilId = (index: number, oilId: string) => {
    const next = [...draft.oils];
    next[index].oilId = oilId;
    setDraft({ ...draft, oils: next });
  };

  const handleUpdatePercentage = (index: number, percentage: number) => {
    const next = [...draft.oils];
    next[index].percentage = Math.max(0, Math.min(100, percentage));
    setDraft({ ...draft, oils: next });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    if (!isTotal100) return;
    onSave({
      ...draft,
      suggestedRetailPrice: 7, // Enforce retail $7 for 50ml
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-black text-white">
              {draft.id.startsWith('rec-custom') ? t('recipeNewModalTitle') : t('recipeEditModalTitle')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Row 1: Names & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {language === 'ar' ? 'كود الخلطة' : 'Recipe Code'}
              </label>
              <input
                type="text"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('recipeNameAr')} *
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('recipeNameEn')}
              </label>
              <input
                type="text"
                value={draft.nameEn || ''}
                onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Category, Gender, Season, Retail Price */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('recipeCategory')}
              </label>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value as RecipeCategory })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="signature">خلطات نسمات الحصرية (Signature)</option>
                <option value="men">رجالي (Men)</option>
                <option value="women">نسائي (Women)</option>
                <option value="unisex">للجنسين (Unisex)</option>
                <option value="oriental">عود وشرقي (Oriental)</option>
                <option value="fresh">منعش وصيفي (Fresh)</option>
                <option value="gourmand">غورماند وحلوي (Gourmand)</option>
                <option value="custom">مخصص (Custom)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('recipeTargetGender')}
              </label>
              <select
                value={draft.targetGender || 'unisex'}
                onChange={(e) => setDraft({ ...draft, targetGender: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="unisex">{t('genderUnisex')}</option>
                <option value="men">{t('genderMen')}</option>
                <option value="women">{t('genderWomen')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('recipeSeason')}
              </label>
              <select
                value={draft.season || 'all'}
                onChange={(e) => setDraft({ ...draft, season: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="all">{t('seasonAll')}</option>
                <option value="summer">{t('seasonSummer')}</option>
                <option value="winter">{t('seasonWinter')}</option>
                <option value="autumn">{t('seasonAutumn')}</option>
                <option value="spring">{t('seasonSpring')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('recipeRetailPrice')} (50ml)
              </label>
              <input
                type="number"
                disabled
                value={7}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none cursor-not-allowed"
                title="السعر المعتمد: 50 ملل = $7"
              />
            </div>
          </div>

          {/* Row 3: Bottle Size & Concentration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('recipeBottleCapacity')} (ml)
              </label>
              <select
                value={draft.bottleCapacityMl}
                onChange={(e) => setDraft({ ...draft, bottleCapacityMl: parseInt(e.target.value, 10) || 50 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value={30}>30 ml ({language === 'ar' ? 'سفر وحقيبة - 5$' : 'Travel - $5'})</option>
                <option value={50}>50 ml ({language === 'ar' ? 'الأكثر مبيعاً ورواجاً - 7$' : 'Bestseller - $7'})</option>
                <option value={100}>100 ml ({language === 'ar' ? 'الحجم الملكي الفاخر - 12$' : 'Royal Luxury - $12'})</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('recipeConcentrationPercent')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={40}
                  step={1}
                  value={draft.concentrationPercent}
                  onChange={(e) => setDraft({ ...draft, concentrationPercent: parseInt(e.target.value, 10) || 25 })}
                  className="w-full accent-amber-500"
                />
                <span className="font-mono text-xs font-bold text-amber-400 w-12 text-end">
                  {draft.concentrationPercent}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('recipeFixativePercent')}
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={5}
                value={draft.fixativePercent || 1.5}
                onChange={(e) => setDraft({ ...draft, fixativePercent: parseFloat(e.target.value) || 1.5 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Oil Composition Section */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-amber-400" />
                  <span>{t('recipeOilsComposition')}</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  {language === 'ar' 
                    ? 'حدد الزيوت العطرية ونسبة كل زيت من التركيبة العطرية الكلية (يجب أن تساوي 100%)'
                    : 'Specify fragrance oils and individual ratios (total must equal 100%)'}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                  isTotal100 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {t('recipeTotalPercent')} {totalPercentage}%
                </span>
                {!isTotal100 && (
                  <button
                    type="button"
                    onClick={handleAutoBalance}
                    className="text-[11px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2.5 py-1 rounded-lg border border-amber-500/40 font-medium transition cursor-pointer"
                  >
                    {language === 'ar' ? 'موازنة تلقائية 100%' : 'Auto Balance'}
                  </button>
                )}
              </div>
            </div>

            {/* Oil Rows */}
            <div className="space-y-2 pt-2">
              {draft.oils.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-xl"
                >
                  <span className="text-xs font-mono text-slate-400 w-6 text-center shrink-0">
                    #{idx + 1}
                  </span>

                  {/* Oil Select */}
                  <select
                    value={item.oilId}
                    onChange={(e) => handleUpdateOilId(idx, e.target.value)}
                    className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    {oils.map((oil) => (
                      <option key={oil.id} value={oil.id}>
                        {oil.code} - {oil.name} ({settings.currency}{oil.unitCost}/ml)
                      </option>
                    ))}
                  </select>

                  {/* Percentage Slider & Input */}
                  <div className="flex items-center gap-2 w-full sm:w-56 shrink-0">
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={item.percentage}
                      onChange={(e) => handleUpdatePercentage(idx, parseInt(e.target.value, 10) || 0)}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={item.percentage}
                        onChange={(e) => handleUpdatePercentage(idx, parseInt(e.target.value, 10) || 0)}
                        className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-mono font-bold text-center focus:border-amber-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    disabled={draft.oils.length <= 1}
                    onClick={() => handleRemoveOilRow(idx)}
                    className="text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 p-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Oil Button */}
            <button
              type="button"
              onClick={handleAddOilRow}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-dashed border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('recipeAddOilBtn')}</span>
            </button>
          </div>

          {/* LIVE FORMULATION PREVIEW BOX */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Table className="w-4 h-4 text-amber-400" />
                <span>{t('recipeLiveMeasurementsTitle')} {draft.bottleCapacityMl}ml ({draft.concentrationPercent}%)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                إجمالي السائل: {liveMeasures.totalLiquidMl}ml • {liveMeasures.totalLiquidG}g
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">الزيوت الكلية:</span>
                <span className="text-amber-400 font-bold">{liveMeasures.totalOilMl} ml ({liveMeasures.totalOilG} g)</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">كحول 96%:</span>
                <span className="text-sky-300 font-bold">{liveMeasures.alcoholMl} ml ({liveMeasures.alcoholG} g)</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">المثبت:</span>
                <span className="text-purple-300 font-bold">{liveMeasures.fixativeMl} ml (~{liveMeasures.fixativeDrops}ق)</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">تكلفة التصنيع:</span>
                <span className="text-rose-300 font-bold">${liveMeasures.totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Scent Notes & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('recipeScentPyramid')}
              </label>
              <input
                type="text"
                value={draft.scentNotes || ''}
                onChange={(e) => setDraft({ ...draft, scentNotes: e.target.value })}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('recipeDescription')}
              </label>
              <textarea
                rows={2}
                value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Artwork Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {language === 'ar' ? 'صورة العطر الفاخرة' : 'Perfume Artwork'}
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {PRESET_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDraft({ ...draft, imageUrl: img })}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      draft.imageUrl === img ? 'border-amber-500 scale-105 shadow-md shadow-amber-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!isTotal100 || !draft.name.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t('save')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
