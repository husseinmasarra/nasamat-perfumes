import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Filter,
  Plus,
  FlaskConical,
  Sparkles,
  Database,
  Copy,
  Check,
  Tag,
  Layers
} from './icons';
import { useLanguage } from '../context/LanguageContext';
import {
  PERFUME_PRESETS_DATABASE,
  POPULAR_DATABASE_BRANDS,
  normalizeSearchString,
  type PerfumePresetSpec
} from '../data/perfumeDatabase';
import type { FragranceFamily } from '../types';

interface PerfumeMarketDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForAdd: (preset: PerfumePresetSpec) => void;
  onFormulateInCalculator?: (preset: PerfumePresetSpec) => void;
}

export const PerfumeMarketDatabaseModal: React.FC<PerfumeMarketDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSelectForAdd,
  onFormulateInCalculator
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('الكل');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered perfumes
  const filteredPerfumes = useMemo(() => {
    let list = PERFUME_PRESETS_DATABASE;

    // Brand filter
    if (selectedBrand && selectedBrand !== 'الكل') {
      const cleanBrand = normalizeSearchString(selectedBrand);
      list = list.filter((p) => normalizeSearchString(p.brand).includes(cleanBrand));
    }

    // Family filter
    if (selectedFamily && selectedFamily !== 'all') {
      list = list.filter((p) => p.family === selectedFamily);
    }

    // Gender filter
    if (selectedGender && selectedGender !== 'all') {
      list = list.filter((p) => p.targetGender === selectedGender);
    }

    // Search query
    if (searchQuery.trim()) {
      const cleanQ = normalizeSearchString(searchQuery);
      const words = cleanQ.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const haystack = [
          normalizeSearchString(p.nameAr),
          normalizeSearchString(p.nameEn),
          normalizeSearchString(p.brand),
          normalizeSearchString(p.topNotes),
          normalizeSearchString(p.heartNotes),
          normalizeSearchString(p.baseNotes),
          ...p.searchKeywords.map(normalizeSearchString)
        ].join(' ');
        return words.every((w) => haystack.includes(w));
      });
    }

    return list;
  }, [searchQuery, selectedBrand, selectedFamily, selectedGender]);

  const handleCopySpec = (p: PerfumePresetSpec) => {
    const text = isAr
      ? `💎 عطر: ${p.nameAr}\n🏛️ الدار: ${p.brand}\n🏷️ التصنيف: ${getFamilyLabel(p.family)} (${getGenderLabel(p.targetGender)})\n\n🌸 قمة العطر: ${p.topNotes}\n🌿 قلب العطر: ${p.heartNotes}\n🪵 قاعدة العطر: ${p.baseNotes}\n\n💰 الأسعار المقترحة: 30ml: $${p.suggestedPrice30ml} | 50ml: $${p.suggestedPrice50ml} | 100ml: $${p.suggestedPrice100ml}\n✨ المصدر: قاعدة بيانات عطور السوق - نسمات`
      : `💎 Fragrance: ${p.nameEn}\n🏛️ House: ${p.brand}\n\n🌸 Top Notes: ${p.topNotes}\n🌿 Heart Notes: ${p.heartNotes}\n🪵 Base Notes: ${p.baseNotes}\n\n💰 Suggested: 50ml: $${p.suggestedPrice50ml}`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getFamilyLabel = (family: FragranceFamily) => {
    switch (family) {
      case 'oriental': return isAr ? 'شرقي فاخر' : 'Oriental';
      case 'woody': return isAr ? 'خشبي ملكي' : 'Woody';
      case 'fresh': return isAr ? 'منعش صيفي' : 'Fresh & Aquatic';
      case 'citrus': return isAr ? 'حمضيات فوارة' : 'Citrus';
      case 'floral': return isAr ? 'زهري راقٍ' : 'Floral';
      case 'aromatic': return isAr ? 'أروماتيك' : 'Aromatic';
      case 'leather': return isAr ? 'جلدي نخبوي' : 'Leather';
      case 'gourmand': return isAr ? 'سويت وفانيليا' : 'Gourmand';
      default: return isAr ? 'متنوع' : 'Other';
    }
  };

  const getGenderLabel = (g?: string) => {
    if (g === 'men') return isAr ? 'رجالي' : 'Men';
    if (g === 'women') return isAr ? 'نسائي' : 'Women';
    return isAr ? 'للجنسين' : 'Unisex';
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 bg-gradient-to-r from-neutral-900 via-neutral-950 to-black text-white shrink-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black shadow-lg shrink-0">
              <Database className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  {isAr ? 'موسوعة عطور السوق الشاملة' : 'Market Perfumes Encyclopedia'}
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold px-2 py-0.5 rounded-full">
                  {PERFUME_PRESETS_DATABASE.length} {isAr ? 'عطر موثق عالمياً وشرقياً' : 'Total Curated Fragrances'}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black font-serif text-white tracking-wide mt-0.5">
                {isAr ? 'قاعدة البيانات الشاملة لكافة أنواع عطور السوق والنيش' : 'Comprehensive Market Fragrances Database'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="p-4 sm:p-5 bg-neutral-50 border-b border-neutral-200 space-y-3.5 shrink-0">
          {/* Main Search Input */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'ابحث باسم أي عطر بالعربية أو الإنكليزية، الدار، أو المكونات (سوفاج، كريد، توم فورد، عنبر، لويس فويتون، مسك، رصاصي، مضاوي...)...'
                    : 'Search by fragrance name, brand, notes, or house (Sauvage, Creed, Aventus, Tom Ford, Oud, Rose...)...'
                }
                className="w-full pr-11 pl-10 py-3 rounded-2xl border border-neutral-300 bg-white font-bold text-xs sm:text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 shadow-xs transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black font-bold text-sm p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Summary Counter */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-neutral-300 shadow-2xs shrink-0 text-xs font-bold text-neutral-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                {isAr
                  ? `عرض ${filteredPerfumes.length} من أصل ${PERFUME_PRESETS_DATABASE.length} عطر`
                  : `Showing ${filteredPerfumes.length} of ${PERFUME_PRESETS_DATABASE.length}`}
              </span>
            </div>
          </div>

          {/* Secondary Filter Row: Families & Genders */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {/* Genders */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[11px] font-bold text-neutral-500 px-1.5">{isAr ? 'الفئة:' : 'Gender:'}</span>
              {(['all', 'men', 'women', 'unisex'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGender(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedGender === g
                      ? 'bg-black text-amber-400 shadow-xs'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                  }`}
                >
                  {g === 'all' ? (isAr ? 'الكل' : 'All') : getGenderLabel(g)}
                </button>
              ))}
            </div>

            {/* Families */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 shadow-2xs overflow-x-auto max-w-full">
              <span className="text-[11px] font-bold text-neutral-500 px-1.5 shrink-0">{isAr ? 'العائلة:' : 'Family:'}</span>
              {(['all', 'oriental', 'woody', 'fresh', 'citrus', 'floral', 'aromatic', 'leather', 'gourmand'] as const).map((fam) => (
                <button
                  key={fam}
                  type="button"
                  onClick={() => setSelectedFamily(fam)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                    selectedFamily === fam
                      ? 'bg-black text-amber-400 shadow-xs'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                  }`}
                >
                  {fam === 'all' ? (isAr ? 'كل العائلات' : 'All Families') : getFamilyLabel(fam as FragranceFamily)}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Pills Scrollbar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin pt-1">
            <span className="text-[10px] font-black text-neutral-500 shrink-0 uppercase tracking-wider">
              {isAr ? 'دور وماركات العطور:' : 'Houses:'}
            </span>
            {POPULAR_DATABASE_BRANDS.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={`text-[11px] px-3 py-1 rounded-xl border font-bold transition shrink-0 cursor-pointer ${
                  selectedBrand === brand
                    ? 'bg-amber-400 text-black border-amber-500 font-black shadow-xs'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-black hover:bg-neutral-100'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Perfumes Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredPerfumes.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto text-2xl">
                🔍
              </div>
              <h3 className="font-bold text-lg text-neutral-800">
                {isAr ? 'لم يتم العثور على عطور تطابق بحثك' : 'No matching fragrances found'}
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                {isAr
                  ? 'جرب البحث بكلمات أخرى أو قم بإلغاء تصنيف الدار أو الفئة لاستعراض كافة العطور.'
                  : 'Try searching with different keywords or reset brand and family filters.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBrand('الكل');
                  setSelectedFamily('all');
                  setSelectedGender('all');
                }}
                className="py-2 px-5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
              >
                {isAr ? 'إعادة ضبط كل الفلاتر' : 'Reset All Filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPerfumes.map((perfume) => (
                <div
                  key={perfume.id}
                  className="bg-white border border-neutral-200 hover:border-amber-400 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                >
                  {/* Top Header Card */}
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={perfume.imageUrl || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=150&q=80'}
                          alt={perfume.nameAr}
                          className="w-14 h-14 rounded-2xl object-cover border border-neutral-200 group-hover:scale-105 transition-transform shrink-0 shadow-2xs"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-900 text-amber-300">
                              {perfume.brand}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                              {getGenderLabel(perfume.targetGender)}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                              {getFamilyLabel(perfume.family)}
                            </span>
                          </div>
                          <h3 className="font-black text-sm sm:text-base text-black font-serif mt-1 line-clamp-1">
                            {perfume.nameAr}
                          </h3>
                          <div className="text-[11px] font-mono text-neutral-500 line-clamp-1">
                            {perfume.nameEn}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopySpec(perfume)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-black hover:bg-neutral-100 transition cursor-pointer shrink-0"
                        title={isAr ? 'نسخ بطاقة العطر' : 'Copy specs'}
                      >
                        {copiedId === perfume.id ? (
                          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-neutral-600 leading-relaxed line-clamp-2">
                      {perfume.description}
                    </p>

                    {/* Olfactory Pyramid Accordion Card */}
                    <div className="p-3 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-1.5 text-[11px]">
                      <div className="flex items-start gap-1.5">
                        <span className="shrink-0 font-bold text-amber-700">🌸 {isAr ? 'القمة:' : 'Top:'}</span>
                        <span className="text-neutral-700 line-clamp-1 font-medium">{perfume.topNotes}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="shrink-0 font-bold text-emerald-700">🌿 {isAr ? 'القلب:' : 'Heart:'}</span>
                        <span className="text-neutral-700 line-clamp-1 font-medium">{perfume.heartNotes}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="shrink-0 font-bold text-stone-700">🪵 {isAr ? 'القاعدة:' : 'Base:'}</span>
                        <span className="text-neutral-700 line-clamp-1 font-medium">{perfume.baseNotes}</span>
                      </div>
                    </div>

                    {/* Suggested Pricing Ribbon */}
                    <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-neutral-100/70 border border-neutral-200 font-mono">
                      <div>
                        <span className="text-neutral-500 text-[10px]">30ml: </span>
                        <span className="font-bold text-black">${perfume.suggestedPrice30ml}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px]">50ml: </span>
                        <span className="font-bold text-emerald-700">${perfume.suggestedPrice50ml}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px]">100ml: </span>
                        <span className="font-bold text-black">${perfume.suggestedPrice100ml}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px]">{isAr ? 'جملة:' : 'Wholesale:'} </span>
                        <span className="font-bold text-amber-800">${perfume.suggestedWholesalePrice50ml}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectForAdd(perfume)}
                      className="flex-1 py-2 px-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                      <span>{isAr ? 'إضافة إلى المخزون' : 'Add to Catalog'}</span>
                    </button>

                    {onFormulateInCalculator && (
                      <button
                        type="button"
                        onClick={() => onFormulateInCalculator(perfume)}
                        className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                        title={isAr ? 'فتح في حاسبة العيارات والنسب' : 'Open in Calculator'}
                      >
                        <FlaskConical className="w-3.5 h-3.5 text-amber-700" />
                        <span className="hidden sm:inline">{isAr ? 'صياغة' : 'Formulate'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-neutral-500 font-medium text-center sm:text-start">
            {isAr
              ? '💡 نصيحة: يمكنك النقر على «إضافة إلى المخزون» لأي عطر لاستيراد كافة مواصفاته وهرمه العطري وتسعيره المقترح فوراً.'
              : 'Tip: Click "Add to Catalog" on any perfume to autofill all specs, notes, and pricing directly.'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2 px-6 rounded-xl bg-white border border-neutral-300 hover:border-black text-black font-bold text-xs transition cursor-pointer"
          >
            {isAr ? 'إغلاق الموسوعة' : 'Close Database'}
          </button>
        </div>
      </div>
    </div>
  );
};
