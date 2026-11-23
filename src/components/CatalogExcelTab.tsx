import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Search, 
  Download, 
  Printer, 
  Plus, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  X,
  Droplet,
  DollarSign,
  Image as ImageIcon,
  Eye,
  Camera
} from './icons';
import type { FragranceOil, FragranceFamily, AppSettings } from '../types';
import { exportOilsToCsv } from '../utils/storage';
import { smartSearchOils } from '../utils/search';
import { useLanguage } from '../context/LanguageContext';
import { 
  getLocalizedOilName, 
  getLocalizedBrand, 
  getLocalizedFamily, 
  getLocalizedCategory 
} from '../utils/i18n';

interface CatalogExcelTabProps {
  oils: FragranceOil[];
  settings: AppSettings;
  initialSearchTerm?: string;
  onAddOil: (oil: FragranceOil) => void;
  onUpdateOil: (oil: FragranceOil) => void;
  onDeleteOil: (id: string) => void;
  onRestockOil: (id: string, additionalQty: number, additionalCost?: number) => void;
}

// Categorization helper for the 100 scents
function getItemCategory(code: string, brand: string): string {
  if (brand.includes('تشكيلة نسمات الخاصة')) return 'خلطات نسمات الخاصة';
  const num = parseInt(code.replace(/\D/g, ''), 10);
  if (num >= 1 && num <= 20) return 'رجالي توب';
  if (num >= 21 && num <= 40) return 'نسائي جذاب';
  if (num >= 41 && num <= 60) return 'نيش وعود وسهرات';
  if (num >= 61 && num <= 75) return 'صيفي متوسطي';
  if (num >= 76 && num <= 90) return 'شتوي وغورماند وتبغ';
  if (num >= 91) return 'خلطات نسمات الخاصة';
  return 'عام';
}

type SortField = 'code' | 'name' | 'unitCost' | 'currentQuantity' | 'stockValue' | 'family';
type SortOrder = 'asc' | 'desc';

export const CatalogExcelTab: React.FC<CatalogExcelTabProps> = ({
  oils,
  settings,
  initialSearchTerm,
  onAddOil,
  onUpdateOil,
  onDeleteOil,
  onRestockOil,
}) => {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');

  React.useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm);
      setCurrentPage(1);
    }
  }, [initialSearchTerm]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'ok'>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOil, setEditingOil] = useState<FragranceOil | null>(null);
  const [previewOil, setPreviewOil] = useState<FragranceOil | null>(null);

  // Quick Restock Modal
  const [restockOilId, setRestockOilId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [brand, setBrand] = useState('');
  const [family, setFamily] = useState<FragranceFamily>('fresh');
  const [costPrice, setCostPrice] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [unit, setUnit] = useState<'ml' | 'g'>('ml');
  const [density, setDensity] = useState('0.95');
  const [lowStockThreshold, setLowStockThreshold] = useState('20');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [retailPrice30ml, setRetailPrice30ml] = useState('5');
  const [retailPrice50ml, setRetailPrice50ml] = useState('7');
  const [retailPrice100ml, setRetailPrice100ml] = useState('12');
  const [wholesalePrice50ml, setWholesalePrice50ml] = useState('4.5');

  // Filter & Search
  const filteredAndSortedOils = useMemo(() => {
    let result = oils;

    // Smart search
    if (searchTerm.trim()) {
      result = smartSearchOils(result, searchTerm);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((oil) => {
        const cat = getItemCategory(oil.code, oil.brand);
        return cat === selectedCategory;
      });
    }

    // Family filter
    if (selectedFamily !== 'all') {
      result = result.filter((oil) => oil.family === selectedFamily);
    }

    // Stock Status
    if (stockStatusFilter === 'low') {
      result = result.filter((oil) => oil.currentQuantity <= oil.lowStockThreshold);
    } else if (stockStatusFilter === 'ok') {
      result = result.filter((oil) => oil.currentQuantity > oil.lowStockThreshold);
    }

    // Sorting
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'code') {
        const numA = parseInt(a.code.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.code.replace(/\D/g, ''), 10) || 0;
        cmp = numA - numB;
      } else if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'unitCost') {
        cmp = a.unitCost - b.unitCost;
      } else if (sortField === 'currentQuantity') {
        cmp = a.currentQuantity - b.currentQuantity;
      } else if (sortField === 'stockValue') {
        cmp = (a.currentQuantity * a.unitCost) - (b.currentQuantity * b.unitCost);
      } else if (sortField === 'family') {
        cmp = a.family.localeCompare(b.family);
      }

      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [oils, searchTerm, selectedCategory, selectedFamily, stockStatusFilter, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedOils.length / (pageSize || 50)));
  const paginatedOils = useMemo(() => {
    if (pageSize <= 0) return filteredAndSortedOils;
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedOils.slice(start, start + pageSize);
  }, [filteredAndSortedOils, currentPage, pageSize]);

  // Sorting helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Excel Summary Totals
  const totals = useMemo(() => {
    const count = filteredAndSortedOils.length;
    const totalRemainingQty = filteredAndSortedOils.reduce((sum, o) => sum + o.currentQuantity, 0);
    const totalStockValue = filteredAndSortedOils.reduce((sum, o) => sum + (o.currentQuantity * o.unitCost), 0);
    const avgCostPerMl = count > 0 ? filteredAndSortedOils.reduce((sum, o) => sum + o.unitCost, 0) / count : 0;
    const lowStockCount = filteredAndSortedOils.filter((o) => o.currentQuantity <= o.lowStockThreshold).length;

    return {
      count,
      totalRemainingQty,
      totalStockValue,
      avgCostPerMl,
      lowStockCount,
    };
  }, [filteredAndSortedOils]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingOil(null);
    setName('');
    setCode(`NAS-${String(oils.length + 1).padStart(3, '0')}`);
    setBrand('لوزي (Luzi)');
    setFamily('fresh');
    setCostPrice('7.5');
    setInitialQuantity('100');
    setCurrentQuantity('100');
    setUnit('ml');
    setDensity('0.95');
    setLowStockThreshold('20');
    setNotes('');
    setImageUrl('https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80');
    setRetailPrice30ml('5');
    setRetailPrice50ml('7');
    setRetailPrice100ml('12');
    setWholesalePrice50ml('4.5');
    setIsModalOpen(true);
  };

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
    setImageUrl(oil.imageUrl || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80');
    setRetailPrice30ml(String(oil.retailPrice30ml || 5));
    setRetailPrice50ml(String(oil.retailPrice50ml || 7));
    setRetailPrice100ml(String(oil.retailPrice100ml || 12));
    setWholesalePrice50ml(String(oil.wholesalePrice50ml || 4.5));
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const totalCost = parseFloat(costPrice) || 0;
    const initQty = parseFloat(initialQuantity) || 100;
    const curQty = currentQuantity !== '' ? parseFloat(currentQuantity) : initQty;
    const unitCost = Number((totalCost / initQty).toFixed(4));
    const p30 = parseFloat(retailPrice30ml) || 5;
    const p50 = parseFloat(retailPrice50ml) || 7;
    const p100 = parseFloat(retailPrice100ml) || 12;
    const pWholesale = parseFloat(wholesalePrice50ml) || 4.5;

    if (editingOil) {
      onUpdateOil({
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
        unitCost,
        lowStockThreshold: parseFloat(lowStockThreshold) || 20,
        notes: notes.trim(),
        imageUrl: imageUrl.trim() || undefined,
        retailPrice30ml: p30,
        retailPrice50ml: p50,
        retailPrice100ml: p100,
        wholesalePrice50ml: pWholesale,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddOil({
        id: `oil-${Date.now()}`,
        name: name.trim(),
        code: code.trim(),
        brand: brand.trim() || 'عام',
        family,
        costPrice: totalCost,
        initialQuantity: initQty,
        currentQuantity: curQty,
        unit,
        density: parseFloat(density) || 0.95,
        unitCost,
        lowStockThreshold: parseFloat(lowStockThreshold) || 20,
        notes: notes.trim(),
        imageUrl: imageUrl.trim() || undefined,
        retailPrice30ml: p30,
        retailPrice50ml: p50,
        retailPrice100ml: p100,
        wholesalePrice50ml: pWholesale,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setIsModalOpen(false);
  };

  const categoriesList = [
    { id: 'all', label: language === 'ar' ? 'جميع الأصناف (100)' : 'All Scents (100)' },
    { id: 'رجالي توب', label: language === 'ar' ? 'رجالي توب (20)' : "Top Men's (20)" },
    { id: 'نسائي جذاب', label: language === 'ar' ? 'نسائي جذاب (20)' : "Women's Allure (20)" },
    { id: 'نيش وعود وسهرات', label: language === 'ar' ? 'نيش وعود (20)' : 'Niche & Oud (20)' },
    { id: 'صيفي متوسطي', label: language === 'ar' ? 'صيفي متوسطي (15)' : 'Summer Fresh (15)' },
    { id: 'شتوي وغورماند وتبغ', label: language === 'ar' ? 'شتوي وغورماند (15)' : 'Winter Gourmand (15)' },
    { id: 'خلطات نسمات الخاصة', label: language === 'ar' ? 'خلطات نسمات (10)' : 'Nasamat Signature (10)' },
  ];

  const familiesList: FragranceFamily[] = [
    'fresh', 'oriental', 'woody', 'floral', 'leather', 'gourmand', 'citrus', 'aromatic', 'other'
  ];

  return (
    <div className="space-y-5">
      
      {/* Excel Sheet Title & Top Metric Bar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 lg:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-neutral-100 text-black border border-neutral-200">
              <Table className="w-5 h-5 text-black" />
            </span>
            <div>
              <h2 className="text-lg lg:text-xl font-black text-black flex items-center gap-2 font-serif">
                <span>{t('catalogTitle')}</span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-black border border-neutral-300">
                  EXCEL MASTER SHEET
                </span>
              </h2>
              <p className="text-xs text-neutral-600">
                {t('catalogSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Excel KPI summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          <div className="bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200 text-center shadow-xs">
            <span className="text-[10px] text-neutral-600 font-bold block">{language === 'ar' ? 'عدد الأصناف' : 'Total Scents'}</span>
            <span className="text-base font-black text-amber-700 font-mono">{totals.count}</span>
          </div>
          <div className="bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200 text-center shadow-xs">
            <span className="text-[10px] text-neutral-600 font-bold block">{language === 'ar' ? 'إجمالي المخزون' : 'Total Volume'}</span>
            <span className="text-base font-black text-black font-mono">
              {(totals.totalRemainingQty / 1000).toFixed(1)} {language === 'ar' ? 'لتر' : 'L'}
            </span>
          </div>
          <div className="bg-emerald-50/80 px-3 py-2 rounded-xl border border-emerald-200 text-center shadow-xs">
            <span className="text-[10px] text-emerald-900 font-bold block">{language === 'ar' ? 'قيمة المخزون الكلية' : 'Total Stock Value'}</span>
            <span className="text-base font-black text-emerald-700 font-mono">
              ${totals.totalStockValue.toFixed(2)}
            </span>
          </div>
          <div className="bg-sky-50/80 px-3 py-2 rounded-xl border border-sky-200 text-center shadow-xs">
            <span className="text-[10px] text-sky-900 font-bold block">{language === 'ar' ? 'متوسط سعر المل' : 'Avg Cost / ml'}</span>
            <span className="text-base font-black text-sky-800 font-mono">
              ${totals.avgCostPerMl.toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs (Excel Sheet Tabs Style) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categoriesList.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Excel Toolbar: Search, Filters, Rows per page, Export, Add */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className={`w-4 h-4 text-amber-400 absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t('catalogSearchPlaceholder')}
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl ${language === 'ar' ? 'pr-9 pl-9' : 'pl-9 pr-9'} py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className={`absolute ${language === 'ar' ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer`}
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Family filter */}
          <select
            value={selectedFamily}
            onChange={(e) => {
              setSelectedFamily(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">{language === 'ar' ? 'كل العائلات' : 'All Families'}</option>
            {familiesList.map((f) => (
              <option key={f} value={f}>{getLocalizedFamily(f, language)}</option>
            ))}
          </select>

          {/* Stock filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => {
              setStockStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">{language === 'ar' ? 'كل الحالات' : 'All Stock'}</option>
            <option value="low">{language === 'ar' ? 'المنخفض فقط' : 'Low Stock Only'}</option>
            <option value="ok">{language === 'ar' ? 'المتوفر كافٍ' : 'Optimal Stock'}</option>
          </select>

          {/* Rows per page */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value={25}>25 {language === 'ar' ? 'سطر' : 'rows'}</option>
            <option value={50}>50 {language === 'ar' ? 'سطر' : 'rows'}</option>
            <option value={100}>100 {language === 'ar' ? 'سطر (الكل)' : 'rows (All)'}</option>
          </select>

          {/* Export Excel button */}
          <button
            onClick={() => exportOilsToCsv(filteredAndSortedOils, settings.currency)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            title={t('catalogExportCsv')}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'ar' ? 'تصدير إكسل' : 'Export Excel'}</span>
          </button>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title={t('print')}
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{t('print')}</span>
          </button>

          {/* Add item */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add')}</span>
          </button>
        </div>
      </div>

      {/* ================= THE DETAILED EXCEL SPREADSHEET TABLE ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'} text-xs border-collapse`}>
            {/* Table Header */}
            <thead className="bg-slate-950 text-slate-300 font-bold text-[11px] select-none border-b-2 border-slate-800 sticky top-0 z-10">
              <tr className="divide-x divide-x-reverse divide-slate-800">
                <th className="py-3 px-2 text-center w-10 text-slate-500">{t('catalogColIndex')}</th>
                
                {/* Photo */}
                <th className="py-3 px-2 text-center w-14 text-amber-400">
                  <div className="flex items-center justify-center gap-1">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t('catalogColPhoto')}</span>
                  </div>
                </th>

                {/* Code */}
                <th 
                  onClick={() => handleSort('code')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition w-24"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>{t('catalogColCode')}</span>
                    {sortField === 'code' ? (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>

                {/* Name */}
                <th 
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition min-w-[190px]"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>{t('catalogColName')}</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>

                {/* Brand / Supplier */}
                <th className="py-3 px-3 text-slate-300 min-w-[130px]">{t('catalogColBrand')}</th>

                {/* Family */}
                <th 
                  onClick={() => handleSort('family')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition w-28 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{t('catalogColFamily')}</span>
                    {sortField === 'family' ? (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>

                {/* Density */}
                <th className="py-3 px-2 text-center w-16 text-slate-400">{language === 'ar' ? 'الكثافة' : 'Density'}</th>

                {/* Unit Cost per ML */}
                <th 
                  onClick={() => handleSort('unitCost')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition text-center w-24"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{t('catalogColCostMl')}</span>
                    {sortField === 'unitCost' ? (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>

                {/* Unit Cost per Gram */}
                <th className="py-3 px-2 text-center w-20 text-slate-400">{t('catalogColCostG')}</th>

                {/* Sizes and Retail Prices in Lebanon */}
                <th className="py-3 px-3 text-center min-w-[190px] text-amber-300 bg-slate-900">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('catalogColPrices')}</span>
                  </div>
                </th>

                {/* Remaining Quantity */}
                <th 
                  onClick={() => handleSort('currentQuantity')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition text-center min-w-[140px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{t('catalogColStock')}</span>
                    {sortField === 'currentQuantity' ? (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>

                {/* Stock Valuation ($) */}
                <th 
                  onClick={() => handleSort('stockValue')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-850 hover:text-amber-300 transition text-center w-28"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{t('catalogColStockValue')}</span>
                    {sortField === 'stockValue' ? (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>

                {/* Status */}
                <th className="py-3 px-2 text-center w-20">{t('catalogColStatus')}</th>

                {/* Notes */}
                <th className="py-3 px-4 min-w-[180px]">{t('catalogColNotes')}</th>

                {/* Actions */}
                <th className="py-3 px-2 text-center w-24 no-print">{t('catalogColActions')}</th>
              </tr>
            </thead>

            {/* Table Rows (Excel Data) */}
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {paginatedOils.map((oil, idx) => {
                const isLow = oil.currentQuantity <= oil.lowStockThreshold;
                const percentage = Math.min(100, Math.round((oil.currentQuantity / oil.initialQuantity) * 100));
                const stockVal = oil.currentQuantity * oil.unitCost;
                const costPerGram = oil.unitCost / (oil.density || 0.95);
                const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                const localizedOilName = getLocalizedOilName(oil.name, language);
                const localizedBrand = getLocalizedBrand(oil.brand, language);

                return (
                  <tr 
                    key={oil.id}
                    className={`transition-colors divide-x divide-x-reverse divide-slate-800/60 ${
                      idx % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-950/40'
                    } hover:bg-amber-500/5 ${isLow ? 'bg-rose-950/20' : ''}`}
                  >
                    {/* # Index */}
                    <td className="py-2.5 px-2 text-center text-slate-500 font-mono text-[11px]">
                      {rowNumber}
                    </td>

                    {/* Photo Thumbnail */}
                    <td className="py-1.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => setPreviewOil(oil)}
                        className="relative group w-10 h-10 mx-auto rounded-xl overflow-hidden border border-slate-700/80 bg-slate-800 hover:border-amber-400 transition shadow-sm cursor-pointer block"
                        title={t('catalogPhotoModalTitle')}
                      >
                        {oil.imageUrl ? (
                          <img
                            src={oil.imageUrl}
                            alt={oil.name}
                            className="w-full h-full object-cover object-center group-hover:scale-115 transition duration-300"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-amber-400/50">
                            <Droplet className="w-4 h-4" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Eye className="w-3.5 h-3.5 text-white drop-shadow" />
                        </div>
                      </button>
                    </td>

                    {/* Code */}
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400 text-xs">
                      {oil.code}
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-4 font-bold text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Droplet className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                        <span className="hover:text-amber-300 cursor-pointer" onClick={() => setPreviewOil(oil)}>
                          {localizedOilName}
                        </span>
                      </div>
                    </td>

                    {/* Supplier */}
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                      {localizedBrand}
                    </td>

                    {/* Family */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 text-[10px] font-semibold text-slate-300 whitespace-nowrap">
                        {getLocalizedFamily(oil.family, language)}
                      </span>
                    </td>

                    {/* Density */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400 text-[11px]">
                      {oil.density.toFixed(2)}
                    </td>

                    {/* Unit Cost ($/ml) */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-300 text-xs bg-slate-950/30">
                      ${oil.unitCost.toFixed(3)}
                    </td>

                    {/* Cost per Gram */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400 text-[11px]">
                      ${costPerGram.toFixed(3)}
                    </td>

                    {/* Sizes and Retail Prices in Lebanon */}
                    <td className="py-2.5 px-3 text-center min-w-[190px]">
                      <div className="flex flex-col gap-1 items-center font-mono">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60 font-semibold" title="30ml">
                            30ml: <strong className="text-emerald-400">${(oil.retailPrice30ml || 5).toFixed(2)}</strong>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/30 font-bold" title="50ml">
                            50ml: <strong className="text-amber-400">${(oil.retailPrice50ml || 7).toFixed(2)}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60" title="100ml">
                            100ml: <strong className="text-sky-400">${(oil.retailPrice100ml || 12).toFixed(2)}</strong>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-200 border border-purple-500/30" title="Wholesale 50ml">
                            {language === 'ar' ? 'جملة:' : 'W/S:'} <strong className="text-purple-300">${(oil.wholesalePrice50ml || 4.5).toFixed(2)}</strong>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Quantity with mini progress bar */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className={`font-bold ${isLow ? 'text-rose-400' : 'text-slate-200'}`}>
                            {oil.currentQuantity} {t('ml')}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            / {oil.initialQuantity}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${percentage}%` }}
                            className={`h-full ${
                              isLow ? 'bg-rose-500' : percentage < 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Stock Valuation ($) */}
                    <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-400 text-xs bg-slate-950/30">
                      ${stockVal.toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-2 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold animate-pulse whitespace-nowrap">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>{t('low')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold whitespace-nowrap">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{t('healthy')}</span>
                        </span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] max-w-xs truncate" title={oil.notes}>
                      {oil.notes || '—'}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRestockOilId(oil.id);
                            setRestockQty('');
                            setRestockCost('');
                          }}
                          className="p-1 rounded-md text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
                          title={t('catalogRestockAction')}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(oil)}
                          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                          title={t('catalogEditAction')}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(language === 'ar' ? `هل أنت متأكد من حذف الصنف "${oil.name}" (${oil.code})؟` : `Are you sure you want to delete "${oil.name}"?`)) {
                              onDeleteOil(oil.id);
                            }
                          }}
                          className="p-1 rounded-md text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition cursor-pointer"
                          title={t('catalogDeleteAction')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Excel Totals Summary Footer Row (SUM / AVERAGE) */}
            <tfoot className="bg-slate-950 text-slate-100 font-bold border-t-2 border-slate-700 divide-x divide-x-reverse divide-slate-800">
              <tr>
                <td colSpan={7} className={`py-3 px-4 ${language === 'ar' ? 'text-left' : 'text-right'} font-black text-amber-300 text-xs`}>
                  {language === 'ar' ? 'إجمالي كشف الأصناف الظاهرة (Excel Totals & Averages):' : 'Spreadsheet Totals & Averages:'}
                </td>
                <td className="py-3 px-3 text-center font-mono font-black text-amber-400 text-xs">
                  ${totals.avgCostPerMl.toFixed(3)}
                  <span className="text-[10px] text-slate-400 block font-normal">({language === 'ar' ? 'متوسط' : 'Avg'})</span>
                </td>
                <td className="py-3 px-2 text-center text-slate-400 font-mono text-[11px]">
                  —
                </td>
                <td className="py-3 px-3 text-center text-slate-400 text-[10px]">
                  {language === 'ar' ? 'هامش ربح 75%' : '75% margin'}
                </td>
                <td className="py-3 px-3 text-center font-mono font-black text-slate-100 text-xs">
                  {totals.totalRemainingQty.toLocaleString()} {t('ml')}
                  <span className="text-[10px] text-slate-400 block font-normal">({language === 'ar' ? 'مجموع الأرصدة' : 'Total Qty'})</span>
                </td>
                <td className="py-3 px-3 text-center font-mono font-black text-emerald-400 text-sm bg-emerald-950/20">
                  ${totals.totalStockValue.toFixed(2)}
                  <span className="text-[10px] text-emerald-300 block font-normal">({language === 'ar' ? 'القيمة الكلية' : 'Total Value'})</span>
                </td>
                <td className="py-3 px-2 text-center text-[10px] text-rose-400 font-bold">
                  {totals.lowStockCount > 0 ? `${totals.lowStockCount} ${t('low')}` : t('healthy')}
                </td>
                <td colSpan={2} className="py-3 px-4 text-slate-400 text-[11px]">
                  {language === 'ar' ? 'المجموع الكلي:' : 'Total:'} <strong>{totals.count}</strong> {language === 'ar' ? 'صنف مسجل' : 'items'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination Bar */}
        {pageSize > 0 && totalPages > 1 && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              {language === 'ar' 
                ? `عرض الصفحة ${currentPage} من أصل ${totalPages} صفحة (${filteredAndSortedOils.length} صنف إجمالي)`
                : `Page ${currentPage} of ${totalPages} (${filteredAndSortedOils.length} items total)`}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
              >
                {language === 'ar' ? 'السابق' : 'Prev'}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg font-bold transition cursor-pointer ${
                    currentPage === page
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                {editingOil ? t('catalogEditModalTitle') : t('catalogNewModalTitle')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {t('catalogColName')} *
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

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {t('catalogColCode')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="NAS-001"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {t('catalogColBrand')}
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Luzi, Givaudan, Mane, Nasamat..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {t('catalogColFamily')}
                  </label>
                  <select
                    value={family}
                    onChange={(e) => setFamily(e.target.value as FragranceFamily)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    {familiesList.map((f) => (
                      <option key={f} value={f}>{getLocalizedFamily(f, language)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ar' ? 'الكثافة (جم/مل)' : 'Density (g/ml)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={density}
                    onChange={(e) => setDensity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

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
                    placeholder="75"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ar' ? 'الكمية المشتراة (مل) *' : 'Purchased Qty (ml) *'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={initialQuantity}
                    onChange={(e) => setInitialQuantity(e.target.value)}
                    placeholder="100"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ar' ? 'الكمية المتبقية الحالية (مل)' : 'Remaining Qty (ml)'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    placeholder={initialQuantity || '100'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ar' ? 'حد تنبيه النقص (مل)' : 'Low Stock Warning (ml)'}
                  </label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    placeholder="20"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Image URL & Presets */}
                <div className="sm:col-span-2 space-y-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>{language === 'ar' ? 'صورة الزجاجة الفاخرة' : 'Perfume Bottle Photo URL'}</span>
                    </label>
                  </div>

                  <div className="flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden shrink-0">
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
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Selling Prices for the 3 Lebanese Sizes */}
                <div className="sm:col-span-2 space-y-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>{language === 'ar' ? 'أسعار البيع المعتمدة في السوق اللبناني ($ USD)' : 'Lebanese Market Pricing ($ USD)'}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">30ml ({language === 'ar' ? 'مفرق' : 'Retail'})</span>
                      <div className="relative">
                        <span className={`absolute ${language === 'ar' ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 text-xs text-slate-500`}>$</span>
                        <input
                          type="number"
                          step="0.5"
                          value={retailPrice30ml}
                          onChange={(e) => setRetailPrice30ml(e.target.value)}
                          placeholder="10"
                          className={`w-full bg-slate-900 border border-slate-700 rounded-xl ${language === 'ar' ? 'pr-6 pl-2' : 'pl-6 pr-2'} py-1.5 text-xs font-bold text-emerald-400 focus:outline-none focus:border-amber-400`}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-amber-300 font-semibold block mb-0.5">50ml ({language === 'ar' ? 'الأكثر طلباً' : 'Bestseller'})</span>
                      <div className="relative">
                        <span className={`absolute ${language === 'ar' ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 text-xs text-slate-500`}>$</span>
                        <input
                          type="number"
                          step="0.5"
                          value={retailPrice50ml}
                          onChange={(e) => setRetailPrice50ml(e.target.value)}
                          placeholder="16"
                          className={`w-full bg-slate-900 border border-amber-500/40 rounded-xl ${language === 'ar' ? 'pr-6 pl-2' : 'pl-6 pr-2'} py-1.5 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400`}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">100ml ({language === 'ar' ? 'فاخر' : 'Luxury'})</span>
                      <div className="relative">
                        <span className={`absolute ${language === 'ar' ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 text-xs text-slate-500`}>$</span>
                        <input
                          type="number"
                          step="0.5"
                          value={retailPrice100ml}
                          onChange={(e) => setRetailPrice100ml(e.target.value)}
                          placeholder="25"
                          className={`w-full bg-slate-900 border border-slate-700 rounded-xl ${language === 'ar' ? 'pr-6 pl-2' : 'pl-6 pr-2'} py-1.5 text-xs font-bold text-sky-400 focus:outline-none focus:border-amber-400`}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-purple-300 font-semibold block mb-0.5">{language === 'ar' ? 'سعر الجملة (50 مل)' : 'Wholesale (50ml)'}</span>
                      <div className="relative">
                        <span className={`absolute ${language === 'ar' ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 text-xs text-slate-500`}>$</span>
                        <input
                          type="number"
                          step="0.5"
                          value={wholesalePrice50ml}
                          onChange={(e) => setWholesalePrice50ml(e.target.value)}
                          placeholder="8.5"
                          className={`w-full bg-slate-900 border border-slate-700 rounded-xl ${language === 'ar' ? 'pr-6 pl-2' : 'pl-6 pr-2'} py-1.5 text-xs font-bold text-purple-300 focus:outline-none focus:border-amber-400`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">{t('catalogColNotes')}</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Top notes, heart notes, base..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition cursor-pointer"
                >
                  {editingOil ? t('save') : t('add')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium cursor-pointer"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PHOTO ZOOM & FULL PERFUME INSPECTION MODAL ================= */}
      {previewOil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {previewOil.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {getLocalizedFamily(previewOil.family, language)}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-100 mt-1">
                  {getLocalizedOilName(previewOil.name, language)}
                </h3>
                <p className="text-xs text-amber-400">
                  {getLocalizedBrand(previewOil.brand, language)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOil(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-res Image & Quick Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-2xl aspect-square bg-slate-950">
                {previewOil.imageUrl ? (
                  <img
                    src={previewOil.imageUrl}
                    alt={previewOil.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                    <Droplet className="w-10 h-10 text-amber-500/40" />
                    <span className="text-xs">No image</span>
                  </div>
                )}
                <div className={`absolute top-2 ${language === 'ar' ? 'right-2' : 'left-2'} px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-sm border border-amber-500/30 text-[10px] font-bold text-amber-300`}>
                  Extrait Luxury
                </div>
              </div>

              {/* Scent & Inventory Specs */}
              <div className="space-y-3">
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('catalogColCostMl')}:</span>
                    <strong className="text-amber-300 font-mono">${previewOil.unitCost.toFixed(3)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('catalogColCostG')}:</span>
                    <strong className="text-slate-300 font-mono">${(previewOil.unitCost / (previewOil.density || 0.95)).toFixed(3)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'ar' ? 'كثافة الزيت:' : 'Density:'}</span>
                    <strong className="text-slate-300 font-mono">{previewOil.density.toFixed(2)} g/ml</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/80 pt-1.5">
                    <span className="text-slate-400">{language === 'ar' ? 'الرصيد المتبقي:' : 'Remaining Stock:'}</span>
                    <strong className="text-emerald-400 font-mono">{previewOil.currentQuantity} {t('ml')} / {previewOil.initialQuantity} {t('ml')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('catalogColStockValue')}:</span>
                    <strong className="text-emerald-400 font-mono">${(previewOil.currentQuantity * previewOil.unitCost).toFixed(2)}</strong>
                  </div>
                </div>

                {previewOil.notes && (
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <div className="text-[10px] text-amber-400 font-bold mb-1">{language === 'ar' ? 'النوتات والمواصفات:' : 'Olfactory Pyramid:'}</div>
                    {previewOil.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Lebanese Retail & Wholesale Pricing Cards */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>{t('catalogColPrices')}:</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">30ml</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    ${(previewOil.retailPrice30ml || 5).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-500 block">{language === 'ar' ? 'حقيبة / سفر' : 'Travel'}</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-500/40 text-center shadow-lg shadow-amber-500/5">
                  <span className="text-[10px] text-amber-300 font-bold block">50ml ⭐</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    ${(previewOil.retailPrice50ml || 7).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-amber-300/80 block">{language === 'ar' ? 'الأكثر طلباً' : 'Bestseller'}</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">100ml</span>
                  <span className="text-base font-black text-sky-400 font-mono">
                    ${(previewOil.retailPrice100ml || 12).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-500 block">{language === 'ar' ? 'فاخرة وهدايا' : 'Luxury'}</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-purple-500/30 text-center">
                  <span className="text-[10px] text-purple-300 font-bold block">{language === 'ar' ? 'جملة (50 مل)' : 'Wholesale'}</span>
                  <span className="text-base font-black text-purple-400 font-mono">
                    ${(previewOil.wholesalePrice50ml || 4.5).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-purple-300/80 block">{language === 'ar' ? 'موزعين وصالونات' : 'Salons & B2B'}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const o = previewOil;
                  setPreviewOil(null);
                  handleOpenEdit(o);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t('catalogEditAction')}</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewOil(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= QUICK RESTOCK MODAL ================= */}
      {restockOilId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                {t('catalogRestockModalTitle')}
              </h3>
              <button onClick={() => setRestockOilId(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              {language === 'ar' ? 'الصنف:' : 'Fragrance:'}{' '}
              <strong className="text-amber-400">
                {oils.find((o) => o.id === restockOilId) ? getLocalizedOilName(oils.find((o) => o.id === restockOilId)!.name, language) : ''}
              </strong>
              <div className="text-slate-400 mt-1">
                {language === 'ar' ? 'الرصيد المتبقي الحالي:' : 'Current remaining stock:'}{' '}
                {oils.find((o) => o.id === restockOilId)?.currentQuantity} {t('ml')}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {language === 'ar' ? 'الكمية الإضافية (مل) *' : 'Additional Quantity (ml) *'}
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
                  {language === 'ar' ? 'التكلفة الإضافية ($ اختياري)' : 'Additional Cost ($ optional)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  placeholder="Cost of new stock"
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
                  {t('confirm')}
                </button>
                <button
                  type="button"
                  onClick={() => setRestockOilId(null)}
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
