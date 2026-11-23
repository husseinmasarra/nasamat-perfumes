import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  Droplet, 
  Package, 
  FlaskConical, 
  Table 
} from './icons';
import type { FragranceOil, RawMaterial } from '../types';
import { smartSearchOils, smartSearchMaterials, SMART_SEARCH_CHIPS, type SmartFilterChip } from '../utils/search';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedOilName, getLocalizedBrand, getLocalizedMaterialName } from '../utils/i18n';

interface SmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  oils: FragranceOil[];
  materials: RawMaterial[];
  onSelectOilForCalculator: (oilId: string) => void;
  onSelectOilForCatalog: (oilCode: string) => void;
  onSelectMaterial: (matId: string) => void;
}

export const SmartSearchModal: React.FC<SmartSearchModalProps> = ({
  isOpen,
  onClose,
  oils,
  materials,
  onSelectOilForCalculator,
  onSelectOilForCatalog,
  onSelectMaterial,
}) => {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'oils' | 'materials'>('oils');
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedChipId(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle chip click
  const handleChipClick = (chip: SmartFilterChip) => {
    if (selectedChipId === chip.id) {
      setSelectedChipId(null);
      setQuery('');
    } else {
      setSelectedChipId(chip.id);
      setQuery(chip.query);
      setActiveTab('oils');
    }
  };

  // Perform search
  const filteredOils = useMemo(() => {
    return smartSearchOils(oils, query);
  }, [oils, query]);

  const filteredMaterials = useMemo(() => {
    return smartSearchMaterials(materials, query);
  }, [materials, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border border-neutral-200 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[88vh] overflow-hidden mt-4 sm:mt-12 text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 bg-white relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shrink-0 shadow-md">
              <Droplet className="w-5 h-5 text-white" />
            </div>

            <div className="relative flex-1">
              <Search className={`w-5 h-5 text-neutral-400 absolute ${language === 'ar' ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedChipId(null);
                }}
                placeholder={t('searchModalPlaceholder')}
                className={`w-full bg-neutral-50 hover:bg-white border border-neutral-200 focus:border-black rounded-2xl ${language === 'ar' ? 'pr-11 pl-10' : 'pl-11 pr-10'} py-3 text-sm sm:text-base text-black placeholder:text-neutral-400 focus:outline-none transition`}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedChipId(null);
                    inputRef.current?.focus();
                  }}
                  className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-1 rounded-lg`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black border border-neutral-200 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 scrollbar-none">
            <span className="text-[11px] text-neutral-500 font-semibold shrink-0 mx-1 uppercase tracking-wider">
              {t('searchSuggestions')}
            </span>
            {SMART_SEARCH_CHIPS.map((chip) => {
              const isSelected = selectedChipId === chip.id;
              const chipLabel = language === 'en' ? chip.labelEn : chip.label;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200 hover:text-black'
                  }`}
                >
                  <span>{chip.icon}</span>
                  <span>{chipLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Selection Bar & Results Counter */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-50 border-b border-neutral-200 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('oils')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                activeTab === 'oils'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Droplet className="w-3.5 h-3.5" />
              <span>{t('searchTabOils')} ({filteredOils.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                activeTab === 'materials'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>{t('searchTabMaterials')} ({filteredMaterials.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-neutral-500 font-medium hidden sm:block">
            {query 
              ? (language === 'ar' ? `نتائج البحث عن "${query}"` : `Search results for "${query}"`)
              : (language === 'ar' ? 'استعراض كل العناصر المسجلة' : 'Showing all registered items')}
          </div>
        </div>

        {/* Results Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-white">
          {activeTab === 'oils' && (
            <>
              {filteredOils.length === 0 ? (
                <div className="text-center py-12 space-y-2 text-neutral-500">
                  <Droplet className="w-12 h-12 text-neutral-400 mx-auto" />
                  <p className="text-sm font-semibold">{t('searchEmpty')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredOils.map((oil) => {
                    const isLow = oil.currentQuantity <= oil.lowStockThreshold;
                    const localizedName = getLocalizedOilName(oil.name, language);
                    const localizedBrand = getLocalizedBrand(oil.brand, language);

                    return (
                      <div
                        key={oil.id}
                        className="bg-white border border-neutral-200 hover:border-black rounded-2xl p-3.5 transition-all duration-200 flex flex-col justify-between hover:shadow-md group text-black"
                      >
                        <div>
                          <div className="flex items-start gap-3 mb-2.5">
                            {/* Photo Thumbnail */}
                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0 relative group-hover:border-black">
                              {oil.imageUrl ? (
                                <img
                                  src={oil.imageUrl}
                                  alt={oil.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                  <Droplet className="w-5 h-5" />
                                </div>
                              )}
                              <span className="absolute bottom-0 inset-x-0 bg-black text-center text-[8px] font-mono font-bold text-white uppercase">
                                {oil.code}
                              </span>
                            </div>

                            {/* Name & Brand */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200 font-medium truncate uppercase tracking-wider">
                                  {localizedBrand}
                                </span>
                                {isLow && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-bold">
                                    {t('low')}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-black truncate mt-0.5 group-hover:underline transition">
                                {localizedName}
                              </h4>
                              {oil.notes && (
                                <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                                  {oil.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Pricing for Lebanese market & Remaining Qty */}
                          <div className="bg-neutral-50 p-2 rounded-xl border border-neutral-200 mb-3 flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 text-[10px]">30ml:</span>
                              <strong className="text-black font-bold">${(oil.retailPrice30ml || 5).toFixed(0)}</strong>
                              <span className="text-neutral-300">|</span>
                              <span className="text-black text-[10px] font-bold">50ml:</span>
                              <strong className="text-black font-black">${(oil.retailPrice50ml || 7).toFixed(0)}</strong>
                              <span className="text-neutral-300">|</span>
                              <span className="text-neutral-500 text-[10px]">100ml:</span>
                              <strong className="text-black font-bold">${(oil.retailPrice100ml || 12).toFixed(0)}</strong>
                            </div>

                            <span className={`text-[11px] font-bold ${isLow ? 'text-rose-600' : 'text-neutral-600'}`}>
                              {oil.currentQuantity} {t('ml')}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectOilForCalculator(oil.id);
                              onClose();
                            }}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm uppercase tracking-wider"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                            <span>{t('searchActionFormulate')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onSelectOilForCatalog(oil.code);
                              onClose();
                            }}
                            className="py-1.5 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer border border-neutral-200 uppercase"
                            title={t('searchActionCatalog')}
                          >
                            <Table className="w-3.5 h-3.5 text-neutral-600" />
                            <span>{t('searchActionCatalog')}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'materials' && (
            <>
              {filteredMaterials.length === 0 ? (
                <div className="text-center py-12 space-y-2 text-neutral-500">
                  <Package className="w-12 h-12 text-neutral-400 mx-auto" />
                  <p className="text-sm font-semibold">{t('searchEmpty')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredMaterials.map((mat) => {
                    const isLow = mat.currentQuantity <= mat.lowStockThreshold;
                    const localizedMatName = getLocalizedMaterialName(mat.name, language);

                    return (
                      <div
                        key={mat.id}
                        className="bg-white border border-neutral-200 hover:border-black rounded-2xl p-3.5 transition-all duration-200 flex items-center justify-between text-black shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden shrink-0">
                            {mat.imageUrl ? (
                              <img src={mat.imageUrl} alt={mat.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-black">{localizedMatName}</h4>
                            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                              {mat.bottleCapacityMl && (
                                <span className="px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-800 border border-neutral-200 font-mono text-[10px] font-bold">
                                  {mat.bottleCapacityMl} {t('ml')}
                                </span>
                              )}
                              <span>{language === 'ar' ? 'سعر الوحدة:' : 'Unit Cost:'} ${mat.unitCost.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`font-mono ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                          <span className={`text-sm font-black block ${isLow ? 'text-rose-600' : 'text-black'}`}>
                            {mat.currentQuantity} {mat.unit === 'piece' ? t('piece') : t('ml')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectMaterial(mat.id);
                              onClose();
                            }}
                            className="text-[11px] text-neutral-600 hover:text-black font-semibold hover:underline cursor-pointer"
                          >
                            {language === 'ar' ? 'عرض في المواد' : 'View in Materials'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
          <div className="flex items-center gap-3">
            <span>{language === 'ar' ? 'البحث السريع الذكي في كافة العطور والتركيبات' : 'Instant smart search across all perfumes'}</span>
          </div>
          <span className="text-black font-serif font-bold uppercase tracking-wider">
            {language === 'ar' ? 'مختبر نسمات الحرفي للعطور' : 'Nasamat Artisan Perfume Atelier'}
          </span>
        </div>
      </div>
    </div>
  );
};
