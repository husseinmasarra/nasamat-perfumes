import React, { useState, useMemo } from 'react';
import { 
  Droplet, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Download,
  PlusCircle,
  X
} from './icons';
import type { FragranceOil, FragranceFamily, AppSettings } from '../types';
import { exportOilsToCsv } from '../utils/storage';

interface OilsTabProps {
  oils: FragranceOil[];
  settings: AppSettings;
  onAddOil: (oil: FragranceOil) => void;
  onUpdateOil: (oil: FragranceOil) => void;
  onDeleteOil: (id: string) => void;
  onRestockOil: (id: string, additionalQty: number, additionalCost?: number) => void;
}

const FAMILY_LABELS: Record<FragranceFamily, string> = {
  oriental: 'شرقي / عود وعنبر',
  woody: 'خشبي / صندل وأرز',
  floral: 'زهري / ورد وياسمين',
  fresh: 'منعش / أكوا وفواكه',
  leather: 'جلدي / دخاني وبخور',
  gourmand: 'غورماند / فانيليا وتوباكو',
  citrus: 'حمضيات / برغموت وليمون',
  aromatic: 'أروماتك / أعشاب ولافندر',
  other: 'أخرى',
};

export const OilsTab: React.FC<OilsTabProps> = ({
  oils,
  settings,
  onAddOil,
  onUpdateOil,
  onDeleteOil,
  onRestockOil,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'ok'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOil, setEditingOil] = useState<FragranceOil | null>(null);

  // Restock modal state
  const [restockOilId, setRestockOilId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState<string>('');
  const [restockCost, setRestockCost] = useState<string>('');

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [brand, setBrand] = useState('');
  const [family, setFamily] = useState<FragranceFamily>('fresh');
  const [costPrice, setCostPrice] = useState<string>('');
  const [initialQuantity, setInitialQuantity] = useState<string>('');
  const [currentQuantity, setCurrentQuantity] = useState<string>('');
  const [unit, setUnit] = useState<'ml' | 'g'>('ml');
  const [density, setDensity] = useState<string>('0.95');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('50');
  const [notes, setNotes] = useState('');

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingOil(null);
    setName('');
    setCode(`OIL-${Math.floor(100 + Math.random() * 900)}`);
    setBrand('لوزي (Luzi)');
    setFamily('fresh');
    setCostPrice('');
    setInitialQuantity('');
    setCurrentQuantity('');
    setUnit('ml');
    setDensity('0.95');
    setLowStockThreshold('50');
    setNotes('');
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (oil: FragranceOil) => {
    setEditingOil(oil);
    setName(oil.name);
    setCode(oil.code);
    setBrand(oil.brand);
    setFamily(oil.family);
    setCostPrice(String(oil.costPrice));
    setInitialQuantity(String(oil.initialQuantity));
    setCurrentQuantity(String(oil.currentQuantity));
    setUnit(oil.unit);
    setDensity(String(oil.density));
    setLowStockThreshold(String(oil.lowStockThreshold));
    setNotes(oil.notes || '');
    setIsModalOpen(true);
  };

  // Calculated unit cost preview in modal
  const previewTotalCost = parseFloat(costPrice) || 0;
  const previewInitialQty = parseFloat(initialQuantity) || 1;
  const previewUnitCost = previewTotalCost > 0 && previewInitialQty > 0 
    ? (previewTotalCost / previewInitialQty).toFixed(3)
    : '0.000';

  // Submit modal
  const handleSaveOil = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const totalCost = parseFloat(costPrice) || 0;
    const initQty = parseFloat(initialQuantity) || 100;
    const curQty = currentQuantity !== '' ? parseFloat(currentQuantity) : initQty;
    const calculatedUnitCost = Number((totalCost / initQty).toFixed(4));

    if (editingOil) {
      const updated: FragranceOil = {
        ...editingOil,
        name: name.trim(),
        code: code.trim(),
        brand: brand.trim(),
        family,
        costPrice: totalCost,
        initialQuantity: initQty,
        currentQuantity: curQty,
        unit,
        density: parseFloat(density) || 0.95,
        unitCost: calculatedUnitCost,
        lowStockThreshold: parseFloat(lowStockThreshold) || 50,
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      };
      onUpdateOil(updated);
    } else {
      const newOil: FragranceOil = {
        id: `oil-${Date.now()}`,
        name: name.trim(),
        code: code.trim() || `OIL-${Date.now().toString().slice(-4)}`,
        brand: brand.trim() || 'عام',
        family,
        costPrice: totalCost,
        initialQuantity: initQty,
        currentQuantity: curQty,
        unit,
        density: parseFloat(density) || 0.95,
        unitCost: calculatedUnitCost,
        lowStockThreshold: parseFloat(lowStockThreshold) || 50,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddOil(newOil);
    }

    setIsModalOpen(false);
  };

  // Filtered oils
  const filteredOils = useMemo(() => {
    return oils.filter((oil) => {
      const matchesSearch = 
        oil.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        oil.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        oil.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (oil.notes && oil.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFamily = selectedFamily === 'all' || oil.family === selectedFamily;

      const isLow = oil.currentQuantity <= oil.lowStockThreshold;
      const matchesStock = 
        stockFilter === 'all' ||
        (stockFilter === 'low' && isLow) ||
        (stockFilter === 'ok' && !isLow);

      return matchesSearch && matchesFamily && matchesStock;
    });
  }, [oils, searchTerm, selectedFamily, stockFilter]);

  // Overall statistics for oils
  const totalOilsValue = useMemo(() => {
    return oils.reduce((sum, o) => sum + (o.currentQuantity * o.unitCost), 0);
  }, [oils]);

  const lowStockCount = oils.filter((o) => o.currentQuantity <= o.lowStockThreshold).length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">إجمالي أنواع الزيوت</span>
            <span className="text-2xl font-black text-amber-400">{oils.length} نوع</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Droplet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">القيمة المالية للزيوت المتوفرة</span>
            <span className="text-2xl font-black text-emerald-400">
              {totalOilsValue.toFixed(2)} {settings.currency}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">زيوت قاربت على النفاد</span>
            <span className={`text-2xl font-black ${lowStockCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
              {lowStockCount} نوع
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Add Button, Export */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو الكود أو المورد..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Family Filter */}
          <select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">كل العائلات العطرية</option>
            {Object.entries(FAMILY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">كل حالات المخزون</option>
            <option value="low">المنخفض فقط (تنبيه)</option>
            <option value="ok">المتوفر بكمية كافية</option>
          </select>

          {/* Export to CSV */}
          <button
            onClick={() => exportOilsToCsv(oils, settings.currency)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            title="تصدير جدول الزيوت إلى إكسل CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تصدير إكسل</span>
          </button>

          {/* Add New Oil Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة زيت عطري</span>
          </button>
        </div>
      </div>

      {/* Oils Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOils.map((oil) => {
          const isLow = oil.currentQuantity <= oil.lowStockThreshold;
          const percentageRemaining = Math.min(100, Math.round((oil.currentQuantity / oil.initialQuantity) * 100));

          return (
            <div
              key={oil.id}
              className={`bg-slate-900/90 rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between hover:border-amber-500/40 relative overflow-hidden ${
                isLow ? 'border-rose-500/40 shadow-lg shadow-rose-950/20' : 'border-slate-800 shadow-md'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {oil.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-1 font-['Cairo']">
                      {oil.name}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 whitespace-nowrap">
                    {FAMILY_LABELS[oil.family]}
                  </span>
                </div>

                <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
                  <span>المورد: <strong className="text-slate-300">{oil.brand}</strong></span>
                  <span>الكثافة: <strong className="text-slate-300">{oil.density} جم/مل</strong></span>
                </div>

                {/* Pricing Box */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mb-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">سعر شراء العبوة:</span>
                    <span className="text-sm font-bold text-slate-200">
                      {oil.costPrice.toFixed(2)} {settings.currency}
                    </span>
                    <span className="text-[10px] text-slate-500 block">لكل {oil.initialQuantity} {oil.unit}</span>
                  </div>
                  <div className="border-r border-slate-800 pr-2">
                    <span className="text-[11px] text-slate-400 block">سعر الـ 1 {oil.unit} الواحد:</span>
                    <span className="text-sm font-black text-amber-400">
                      {oil.unitCost.toFixed(3)} {settings.currency}
                    </span>
                    <span className="text-[10px] text-slate-400 block">المعتمد بالحاسبة</span>
                  </div>
                </div>

                {/* Stock Progress Bar */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">الكمية المتبقية:</span>
                    <span className={`font-bold ${isLow ? 'text-rose-400' : 'text-slate-200'}`}>
                      {oil.currentQuantity} / {oil.initialQuantity} {oil.unit} ({percentageRemaining}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${percentageRemaining}%` }}
                      className={`h-full transition-all duration-300 ${
                        isLow 
                          ? 'bg-rose-500' 
                          : percentageRemaining < 40 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  {isLow && (
                    <div className="text-[10px] text-rose-400 flex items-center gap-1 font-semibold pt-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      <span>تنبيه: اقترب من النفاد (أقل من {oil.lowStockThreshold} {oil.unit})</span>
                    </div>
                  )}
                </div>

                {oil.notes && (
                  <p className="text-[11px] text-slate-400 bg-slate-800/40 p-2 rounded-lg border border-slate-800 mb-3 line-clamp-2">
                    {oil.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRestockOilId(oil.id);
                    setRestockQty('');
                    setRestockCost('');
                  }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/20 transition cursor-pointer"
                  title="تزويد رصيد هذا الزيت بكمية جديدة"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>تزويد مخزون</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(oil)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                    title="تعديل بيانات الزيت"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف الزيت "${oil.name}"؟`)) {
                        onDeleteOil(oil.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition cursor-pointer"
                    title="حذف الزيت"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOils.length === 0 && (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Droplet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">لا توجد زيوت عطرية مطابقة للبحث أو الفلتر</p>
          <button
            onClick={handleOpenAdd}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة زيت جديد الآن</span>
          </button>
        </div>
      )}

      {/* ================= ADD / EDIT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 font-['Cairo'] flex items-center gap-2">
                <Droplet className="w-5 h-5 text-amber-400" />
                {editingOil ? 'تعديل بيانات الزيت العطري' : 'إضافة زيت عطري جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOil} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Oil Name */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    اسم الزيت العطري *
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

                {/* Code */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">كود الزيت</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Brand / Supplier */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">الشركة الموردة</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Family */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">العائلة العطرية</label>
                  <select
                    value={family}
                    onChange={(e) => setFamily(e.target.value as FragranceFamily)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    {Object.entries(FAMILY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Density */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">الكثافة (جم/مل)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.8"
                    max="1.2"
                    value={density}
                    onChange={(e) => setDensity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Total Purchase Cost */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    سعر الشراء الإجمالي ({settings.currency}) *
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

                {/* Initial Quantity & Unit */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    الكمية المشتراة (الحجم الكلي) *
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
                      onChange={(e) => setUnit(e.target.value as 'ml' | 'g')}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2 text-xs text-amber-400 font-bold"
                    >
                      <option value="ml">مل</option>
                      <option value="g">جرام</option>
                    </select>
                  </div>
                </div>

                {/* Current Remaining Quantity */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    الكمية المتبقية الحالية ({unit})
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

                {/* Low Stock Alert Threshold */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    حد تنبيه نقص المخزون ({unit})
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">ملاحظات ونوتات العطر</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Automatic Price Calculation Display Box */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">سعر الـ 1 {unit} الواحد المحسوب تلقائياً:</span>
                  <span className="text-base font-black text-amber-400">
                    {previewUnitCost} {settings.currency} / {unit}
                  </span>
                </div>
                <div className="text-left text-[11px] text-slate-400">
                  (السعر الإجمالي ÷ الحجم الكلي)
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-md transition cursor-pointer"
                >
                  {editingOil ? 'حفظ التعديلات' : 'إضافة الزيت للمخزون'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= QUICK RESTOCK MODAL ================= */}
      {restockOilId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 font-['Cairo'] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                تزويد مخزون الزيت
              </h3>
              <button
                onClick={() => setRestockOilId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              الزيت المحدد: <strong className="text-amber-400">{oils.find((o) => o.id === restockOilId)?.name}</strong>
              <div className="text-slate-400 mt-1">
                الرصيد المتبقي الحالي: {oils.find((o) => o.id === restockOilId)?.currentQuantity} مل
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">الكمية الإضافية (مل) *</label>
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
                <label className="text-xs font-semibold text-slate-300 block mb-1">تكلفة الشراء الإضافية (اختياري)</label>
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
                      onRestockOil(restockOilId, qty, cost);
                      setRestockOilId(null);
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                >
                  تأكيد الإضافة
                </button>
                <button
                  type="button"
                  onClick={() => setRestockOilId(null)}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
