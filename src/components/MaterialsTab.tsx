import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  PlusCircle, 
  X,
  Camera,
  Image as ImageIcon
} from './icons';
import type { RawMaterial, MaterialCategory, UnitType, AppSettings } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedMaterialName, getLocalizedMaterialCategory } from '../utils/i18n';

interface MaterialsTabProps {
  materials: RawMaterial[];
  settings: AppSettings;
  onAddMaterial: (mat: RawMaterial) => void;
  onUpdateMaterial: (mat: RawMaterial) => void;
  onDeleteMaterial: (id: string) => void;
  onRestockMaterial: (id: string, additionalQty: number, additionalCost?: number) => void;
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({
  materials,
  settings,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onRestockMaterial,
}) => {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMat, setEditingMat] = useState<RawMaterial | null>(null);

  // Quick Restock
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');

  // Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('bottle');
  const [bottleCapacityMl, setBottleCapacityMl] = useState<string>('50');
  const [costPrice, setCostPrice] = useState<string>('');
  const [initialQuantity, setInitialQuantity] = useState<string>('');
  const [currentQuantity, setCurrentQuantity] = useState<string>('');
  const [unit, setUnit] = useState<UnitType>('piece');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('20');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleOpenAdd = (defaultCat?: MaterialCategory) => {
    setEditingMat(null);
    setName('');
    const targetCat = defaultCat || 'bottle';
    setCategory(targetCat);
    setBottleCapacityMl('50');
    setCostPrice('');
    setInitialQuantity('');
    setCurrentQuantity('');
    setUnit(targetCat === 'alcohol' || targetCat === 'fixative' ? 'ml' : 'piece');
    setLowStockThreshold(targetCat === 'alcohol' ? '500' : '20');
    setNotes('');
    setImageUrl(
      targetCat === 'bottle'
        ? 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80'
        : ''
    );
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mat: RawMaterial) => {
    setEditingMat(mat);
    setName(mat.name);
    setCategory(mat.category);
    setBottleCapacityMl(String(mat.bottleCapacityMl || ''));
    setCostPrice(String(mat.costPrice));
    setInitialQuantity(String(mat.initialQuantity));
    setCurrentQuantity(String(mat.currentQuantity));
    setUnit(mat.unit);
    setLowStockThreshold(String(mat.lowStockThreshold));
    setNotes(mat.notes || '');
    setImageUrl(mat.imageUrl || '');
    setIsModalOpen(true);
  };

  // Preview unit cost
  const prevCost = parseFloat(costPrice) || 0;
  const prevQty = parseFloat(initialQuantity) || 1;
  const previewUnitCost = prevCost > 0 && prevQty > 0 ? (prevCost / prevQty).toFixed(3) : '0.000';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const totalCost = parseFloat(costPrice) || 0;
    const initQty = parseFloat(initialQuantity) || 10;
    const curQty = currentQuantity !== '' ? parseFloat(currentQuantity) : initQty;
    const unitCost = Number((totalCost / initQty).toFixed(3));
    const cap = category === 'bottle' ? parseFloat(bottleCapacityMl) || undefined : undefined;

    if (editingMat) {
      onUpdateMaterial({
        ...editingMat,
        name: name.trim(),
        category,
        bottleCapacityMl: cap,
        costPrice: totalCost,
        initialQuantity: initQty,
        currentQuantity: curQty,
        unit,
        unitCost,
        lowStockThreshold: parseFloat(lowStockThreshold) || 10,
        notes: notes.trim(),
        imageUrl: imageUrl.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddMaterial({
        id: `mat-${Date.now()}`,
        name: name.trim(),
        category,
        bottleCapacityMl: cap,
        costPrice: totalCost,
        initialQuantity: initQty,
        currentQuantity: curQty,
        unit,
        unitCost,
        lowStockThreshold: parseFloat(lowStockThreshold) || 10,
        notes: notes.trim(),
        imageUrl: imageUrl.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setIsModalOpen(false);
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
      const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [materials, selectedCategory, searchTerm]);

  const categoriesKeys: MaterialCategory[] = ['bottle', 'sprayer', 'alcohol', 'fixative', 'packaging', 'other'];

  return (
    <div className="space-y-6">
      
      {/* Category Pills Header */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            {language === 'ar' ? `جميع المواد (${materials.length})` : `All Materials (${materials.length})`}
          </button>
          {categoriesKeys.map((catKey) => {
            const info = getLocalizedMaterialCategory(catKey, language);
            const count = materials.filter((m) => m.category === catKey).length;
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                }`}
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-white text-black' : 'bg-neutral-200 text-neutral-800'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add Material Button */}
        <button
          onClick={() => handleOpenAdd(selectedCategory !== 'all' ? (selectedCategory as MaterialCategory) : undefined)}
          className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-neutral-900 text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="text-white">{t('matAddBtn')}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className={`w-4 h-4 text-slate-400 absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('matSearchPlaceholder')}
          className={`w-full bg-slate-900 border border-slate-800 rounded-xl ${language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400`}
        />
      </div>

      {/* Materials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((mat) => {
          const isLow = mat.currentQuantity <= mat.lowStockThreshold;
          const percentage = Math.min(100, Math.round((mat.currentQuantity / mat.initialQuantity) * 100));
          const catInfo = getLocalizedMaterialCategory(mat.category, language);
          const localizedName = getLocalizedMaterialName(mat.name, language);

          return (
            <div
              key={mat.id}
              className={`bg-slate-900/90 rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between hover:border-amber-500/40 relative ${
                isLow ? 'border-rose-500/40 shadow-lg shadow-rose-950/20' : 'border-slate-800 shadow-md'
              }`}
            >
              <div>
                {/* Photo or Header Banner */}
                {mat.imageUrl ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-700/80 mb-3 bg-slate-950">
                    <img
                      src={mat.imageUrl}
                      alt={mat.name}
                      className="w-full h-full object-cover object-center hover:scale-105 transition duration-300"
                    />
                    <div className={`absolute top-2 ${language === 'ar' ? 'right-2' : 'left-2'} flex items-center gap-1.5`}>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm border border-slate-700 text-slate-200 font-semibold">
                        {catInfo.icon} {catInfo.label}
                      </span>
                    </div>
                    {mat.bottleCapacityMl && (
                      <div className={`absolute bottom-2 ${language === 'ar' ? 'left-2' : 'right-2'} px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-md`}>
                        {mat.bottleCapacityMl} {t('ml')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-3 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xl p-1 rounded-lg bg-slate-800">
                        {catInfo.icon}
                      </span>
                      <span className="text-xs text-amber-400 font-medium">
                        {catInfo.label}
                      </span>
                    </div>
                    {mat.bottleCapacityMl && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono">
                        {mat.bottleCapacityMl} {t('ml')}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-100">
                    {localizedName}
                  </h3>
                </div>

                {/* Price Details */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 my-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">{language === 'ar' ? 'سعر التكلفة:' : 'Total Cost:'}</span>
                    <span className="text-sm font-bold text-slate-200">
                      ${mat.costPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {language === 'ar' ? `لكل ${mat.initialQuantity} ${mat.unit === 'piece' ? 'قطعة' : mat.unit}` : `per ${mat.initialQuantity} ${mat.unit === 'piece' ? 'pcs' : mat.unit}`}
                    </span>
                  </div>
                  <div className={`${language === 'ar' ? 'border-r pr-2' : 'border-l pl-2'} border-slate-800`}>
                    <span className="text-[11px] text-slate-400 block">{language === 'ar' ? 'سعر الوحدة الواحدة:' : 'Unit Cost:'}</span>
                    <span className="text-sm font-black text-amber-400">
                      ${mat.unitCost.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {language === 'ar' ? `لكل ${mat.unit === 'piece' ? 'قطعة' : mat.unit}` : `per ${mat.unit === 'piece' ? 'pc' : mat.unit}`}
                    </span>
                  </div>
                </div>

                {/* Stock progress */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{language === 'ar' ? 'الرصيد المتبقي:' : 'Stock Remaining:'}</span>
                    <span className={`font-bold ${isLow ? 'text-rose-400' : 'text-slate-200'}`}>
                      {mat.currentQuantity} / {mat.initialQuantity} {mat.unit === 'piece' ? (language === 'ar' ? 'قطعة' : 'pcs') : t('ml')} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className={`h-full transition-all duration-300 ${
                        isLow ? 'bg-rose-500' : percentage < 40 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  {isLow && (
                    <div className="text-[10px] text-rose-400 flex items-center gap-1 font-semibold pt-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{language === 'ar' ? `تنبيه: اقترب من النفاد (أقل من ${mat.lowStockThreshold})` : `Low stock warning (< ${mat.lowStockThreshold})`}</span>
                    </div>
                  )}
                </div>

                {mat.notes && (
                  <p className="text-[11px] text-slate-400 bg-slate-800/40 p-2 rounded-lg border border-slate-800 mb-3">
                    {mat.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRestockId(mat.id);
                    setRestockQty('');
                    setRestockCost('');
                  }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/20 transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{t('restock')}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(mat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                    title={t('edit')}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(language === 'ar' ? `هل أنت متأكد من حذف "${mat.name}"؟` : `Are you sure you want to delete "${mat.name}"?`)) {
                        onDeleteMaterial(mat.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition cursor-pointer"
                    title={t('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                {editingMat ? t('matEditModalTitle') : t('matNewModalTitle')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {t('matColCategory')} *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value as MaterialCategory;
                      setCategory(newCat);
                      if (newCat === 'alcohol' || newCat === 'fixative') {
                        setUnit('ml');
                      } else {
                        setUnit('piece');
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    {categoriesKeys.map((catKey) => {
                      const info = getLocalizedMaterialCategory(catKey, language);
                      return (
                        <option key={catKey} value={catKey}>{info.icon} {info.label}</option>
                      );
                    })}
                  </select>
                </div>

                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {t('matColName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Image URL & Presets */}
                <div className="sm:col-span-2 space-y-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>{language === 'ar' ? 'صورة المادة الأولية' : 'Material Image URL'}</span>
                    </label>
                  </div>

                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottle Capacity if category is bottle */}
                {category === 'bottle' && (
                  <div className="sm:col-span-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <label className="text-xs font-semibold text-amber-300 block mb-1">
                      {language === 'ar' ? 'سعة الزجاجة بالمليلتر (لربطها بالحاسبة تلقائياً) *' : 'Bottle Capacity in ml (Auto-linked to Calculator) *'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={bottleCapacityMl}
                      onChange={(e) => setBottleCapacityMl(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {/* Total Cost */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ar' ? 'سعر الشراء الإجمالي ($) *' : 'Total Purchase Cost ($) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Initial Qty & Unit */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ar' ? 'الكمية المشتراة *' : 'Purchased Quantity *'}
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as UnitType)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2 text-xs text-amber-400 font-bold"
                    >
                      <option value="piece">{language === 'ar' ? 'قطعة' : 'pcs'}</option>
                      <option value="ml">{t('ml')}</option>
                      <option value="g">{t('gram')}</option>
                    </select>
                  </div>
                </div>

                {/* Current Quantity */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ar' ? `الكمية المتبقية الحالية (${unit === 'piece' ? 'قطعة' : unit})` : `Remaining Qty (${unit === 'piece' ? 'pcs' : unit})`}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Low Stock Alert */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ar' ? 'حد تنبيه النقص' : 'Low Stock Warning Threshold'}
                  </label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">{t('notes')}</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Unit Cost Preview */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">{t('matColUnitCost')}:</span>
                  <span className="text-base font-black text-amber-400">
                    ${previewUnitCost} / {unit === 'piece' ? (language === 'ar' ? 'قطعة' : 'pc') : t('ml')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-sm shadow-md transition cursor-pointer"
                >
                  {editingMat ? t('save') : t('add')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= QUICK RESTOCK MODAL ================= */}
      {restockId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                {t('matRestockModalTitle')}
              </h3>
              <button onClick={() => setRestockId(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              {language === 'ar' ? 'المادة:' : 'Material:'}{' '}
              <strong className="text-amber-400">
                {materials.find((m) => m.id === restockId) ? getLocalizedMaterialName(materials.find((m) => m.id === restockId)!.name, language) : ''}
              </strong>
              <div className="text-slate-400 mt-1">
                {language === 'ar' ? 'الرصيد المتبقي الحالي:' : 'Current remaining stock:'}{' '}
                {materials.find((m) => m.id === restockId)?.currentQuantity} {materials.find((m) => m.id === restockId)?.unit === 'piece' ? (language === 'ar' ? 'قطعة' : 'pcs') : t('ml')}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {language === 'ar' ? 'الكمية الإضافية المشتراة *' : 'Additional Quantity *'}
                </label>
                <input
                  type="number"
                  step="1"
                  autoFocus
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder=""
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {language === 'ar' ? 'التكلفة الإضافية (اختياري)' : 'Additional Cost (optional)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  placeholder=""
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const qty = parseFloat(restockQty);
                    if (qty > 0) {
                      const cost = parseFloat(restockCost) || undefined;
                      onRestockMaterial(restockId, qty, cost);
                      setRestockId(null);
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {t('confirm')}
                </button>
                <button
                  type="button"
                  onClick={() => setRestockId(null)}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
