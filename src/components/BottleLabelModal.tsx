import React, { useState, useEffect } from 'react';
import { X, Printer, Sparkles, Tag, Check, Sliders, Eye } from './icons';
import type { BottleLabelData } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BottleLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: BottleLabelData | null;
}

export const BottleLabelModal: React.FC<BottleLabelModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [labelData, setLabelData] = useState<BottleLabelData>({
    perfumeName: 'باكارات روج 540 إكستري',
    perfumeNameEn: 'Baccarat Rouge 540 Extrait',
    brand: 'نسمات للعطور الملكية',
    customerName: '',
    bottleSizeMl: 50,
    concentrationPercent: 22,
    concentrationTier: 'Extrait de Parfum',
    batchNumber: `NAS-${new Date().getFullYear()}-B${Math.floor(Math.random() * 900 + 100)}`,
    formulationDate: new Date().toISOString().split('T')[0],
    notes: 'زعفران، لوز مر، عنبر الحوت، خشب الأرز',
    ingredientsText: 'Alcohol Denat 96°, Parfum (Fragrance), Fixative Complex',
    qrCodeUrl: typeof window !== 'undefined' ? window.location.origin : 'https://nasmat-perfumes.com',
  });

  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'box'>('standard');
  const [labelTheme, setLabelTheme] = useState<'minimal' | 'gold_black' | 'champagne'>('minimal');
  const [printCopies, setPrintCopies] = useState<number>(1);

  // Sync with passed initialData
  useEffect(() => {
    if (initialData) {
      setLabelData((prev) => ({
        ...prev,
        ...initialData,
        batchNumber: initialData.batchNumber || `NAS-${new Date().getFullYear()}-B${Math.floor(Math.random() * 900 + 100)}`,
        formulationDate: initialData.formulationDate || new Date().toISOString().split('T')[0],
      }));
    }
  }, [initialData, isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Dimensions based on selected size
  const getDimensionsText = () => {
    if (labelSize === 'compact') return isAr ? '50mm × 30mm (لحجم 30 ملل / السفر)' : '50mm × 30mm (30ml / Travel Size)';
    if (labelSize === 'box') return isAr ? '70mm × 50mm (لعلب الهدايا الكبيرة)' : '70mm × 50mm (Large Gift Box)';
    return isAr ? '60mm × 40mm (المقاس القياسي 50 ملل و 100 ملل)' : '60mm × 40mm (Standard 50ml & 100ml)';
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      
      {/* Print-Only Container (Rendered during window.print) */}
      <div className="hidden print:block print:w-full print:m-0 print:p-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-bottle-labels-area, #printable-bottle-labels-area * {
              visibility: visible;
            }
            #printable-bottle-labels-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              background: #ffffff !important;
            }
            @page {
              size: auto;
              margin: 4mm;
            }
          }
        `}} />

        <div id="printable-bottle-labels-area" className="flex flex-wrap gap-4 p-2 justify-center">
          {Array.from({ length: printCopies }).map((_, idx) => (
            <div
              key={idx}
              className={`border border-neutral-900 rounded-lg p-3 text-black bg-white flex flex-col justify-between overflow-hidden page-break-inside-avoid ${
                labelSize === 'compact' 
                  ? 'w-[50mm] h-[30mm] text-[8px]' 
                  : labelSize === 'box'
                  ? 'w-[70mm] h-[50mm] text-[11px]'
                  : 'w-[60mm] h-[40mm] text-[9.5px]'
              }`}
              style={{ boxSizing: 'border-box' }}
            >
              {/* Top Branding */}
              <div className="text-center border-b border-neutral-400 pb-1">
                <div className="font-serif font-black tracking-widest uppercase text-[10px]">
                  NASMAT • نسمات
                </div>
                <div className="text-[7px] tracking-wider text-neutral-600 uppercase">
                  BEIRUT ATELIER • HAUTE PARFUMERIE
                </div>
              </div>

              {/* Perfume Info */}
              <div className="text-center my-auto py-1">
                <div className="font-bold text-[11px] leading-tight text-black line-clamp-1">
                  {labelData.perfumeName}
                </div>
                {labelData.perfumeNameEn && (
                  <div className="text-[8px] font-medium font-serif text-neutral-700 tracking-wide uppercase line-clamp-1">
                    {labelData.perfumeNameEn}
                  </div>
                )}
                {labelData.customerName && (
                  <div className="text-[8px] font-bold text-neutral-900 mt-0.5 border border-dashed border-neutral-400 px-1 py-0.2 rounded inline-block">
                    {isAr ? 'خاص بالزبون: ' : 'Crafted for: '}{labelData.customerName}
                  </div>
                )}
              </div>

              {/* Bottom Specs & QR */}
              <div className="border-t border-neutral-400 pt-1 flex items-center justify-between text-[7.5px] font-mono">
                <div>
                  <div className="font-black">
                    {labelData.bottleSizeMl} ML • EXTRAIT DE PARFUM
                  </div>
                  <div className="text-neutral-500">
                    LOT: {labelData.batchNumber} • {labelData.formulationDate}
                  </div>
                </div>
                <div className="text-end font-bold text-[7px] text-neutral-800">
                  LEBANON
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screen Interactive Modal */}
      <div 
        className="relative bg-white border border-neutral-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto animate-scaleUp text-black no-print"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-md">
              <Tag className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  BOTTLE LABEL ATELIER
                </span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.2 rounded-full font-mono">
                  THERMAL / SHEET READY
                </span>
              </div>
              <h3 className="text-base font-black text-white font-serif">
                {isAr ? 'طباعة استيكر وملصق الزجاجة الفاخر' : 'Luxury Perfume Bottle Label Generator'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-black" />
              <span>{isAr ? 'طباعة الاستيكر' : 'Print Label'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          
          {/* Live Label Preview Box */}
          <div className="bg-neutral-100 p-6 rounded-3xl border border-neutral-300 flex flex-col items-center justify-center space-y-3">
            <span className="text-xs font-bold text-neutral-600 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-neutral-600" />
              <span>{isAr ? 'معاينة حية للملصق (شكل الزجاجة الحقيقي):' : 'Live Bottle Sticker Preview:'}</span>
              <span className="text-[11px] font-mono text-neutral-500">({getDimensionsText()})</span>
            </span>

            {/* Label Canvas Simulation */}
            <div 
              className={`rounded-2xl transition-all shadow-xl p-4 flex flex-col justify-between text-center relative border ${
                labelTheme === 'gold_black'
                  ? 'bg-neutral-950 text-amber-100 border-amber-500/40 shadow-amber-500/10'
                  : labelTheme === 'champagne'
                  ? 'bg-amber-50 text-neutral-900 border-amber-300'
                  : 'bg-white text-black border-neutral-300'
              } ${
                labelSize === 'compact'
                  ? 'w-[280px] h-[160px]'
                  : labelSize === 'box'
                  ? 'w-[360px] h-[220px]'
                  : 'w-[320px] h-[190px]'
              }`}
            >
              {/* Watermark / Logo */}
              <div className="border-b border-current/20 pb-1.5">
                <div className="font-serif font-black tracking-widest uppercase text-xs">
                  {isAr ? 'NASMAT • نَسَمَات' : 'NASAMAT • BEIRUT'}
                </div>
                <div className="text-[9px] tracking-wider opacity-75 uppercase">
                  BEIRUT ATELIER • HAUTE PARFUMERIE
                </div>
              </div>

              {/* Center Details */}
              <div className="my-auto py-1">
                <div className="font-black text-sm sm:text-base font-serif">
                  {labelData.perfumeName}
                </div>
                {labelData.perfumeNameEn && (
                  <div className="text-[10px] font-medium font-serif opacity-80 uppercase tracking-wide">
                    {labelData.perfumeNameEn}
                  </div>
                )}
                {labelData.customerName && (
                  <div className="mt-1 px-2 py-0.5 rounded-full bg-current/10 text-[10px] font-bold inline-block">
                    {isAr ? 'صُمم خصيصاً لـ: ' : 'Crafted for: '} {labelData.customerName}
                  </div>
                )}
                {labelData.notes && (
                  <div className="text-[9px] opacity-70 italic mt-0.5 line-clamp-1">
                    {labelData.notes}
                  </div>
                )}
              </div>

              {/* Bottom Specs */}
              <div className="border-t border-current/20 pt-1.5 flex items-center justify-between text-[10px] font-mono">
                <div className="text-start">
                  <span className="font-bold">{labelData.bottleSizeMl} ML</span> • <span>EXTRAIT DE PARFUM</span>
                  <div className="text-[8px] opacity-60">
                    LOT: {labelData.batchNumber}
                  </div>
                </div>
                <div className="text-end">
                  <div className="font-bold text-[9px]">BEIRUT</div>
                  <div className="text-[8px] opacity-60">{labelData.formulationDate}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* 1. Size Selector */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
              <label className="font-bold text-neutral-800 block">
                {isAr ? '📏 مقاس الملصق:' : 'Label Size:'}
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'standard', label: isAr ? '60×40 مم (50/100 ملل)' : '60×40 mm (50/100 ml)' },
                  { id: 'compact', label: isAr ? '50×30 مم (30 ملل صغير)' : '50×30 mm (30 ml travel)' },
                  { id: 'box', label: isAr ? '70×50 مم (كبير للعلبة)' : '70×50 mm (Gift box)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setLabelSize(s.id as any)}
                    className={`w-full text-start px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                      labelSize === s.id
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    <span>{s.label}</span>
                    {labelSize === s.id && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Theme Selector */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
              <label className="font-bold text-neutral-800 block">
                {isAr ? '🎨 طابع التصميم:' : 'Label Theme:'}
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'minimal', label: isAr ? 'أبيض كلاسيكي (طابعات حرارية)' : 'Classic White (Thermal)' },
                  { id: 'gold_black', label: isAr ? 'أسود ملكي مع ذهبي' : 'Royal Black & Gold' },
                  { id: 'champagne', label: isAr ? 'شمبانيا فاخر وورقي' : 'Champagne & Parchment' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setLabelTheme(th.id as any)}
                    className={`w-full text-start px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                      labelTheme === th.id
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    <span>{th.label}</span>
                    {labelTheme === th.id && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Number of Copies */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
              <label className="font-bold text-neutral-800 block">
                {isAr ? '🖨️ عدد الملصقات للطباعة:' : 'Print Copies:'}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[1, 2, 4, 8].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setPrintCopies(qty)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                      printCopies === qty
                        ? 'bg-amber-500 text-black border-amber-600'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    <span>{qty} {isAr ? 'ملصق' : 'Labels'}</span>
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-neutral-500 block">
                {isAr ? 'تتوزع على الورقة بالتساوي عند الضغط على طباعة' : 'Arranged evenly on print sheet'}
              </span>
            </div>
          </div>

          {/* Quick Edit Inputs */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 space-y-3 text-xs">
            <span className="font-bold text-neutral-700 block">
              {isAr ? 'تعديل البيانات المطبوعة على الزجاجة:' : 'Edit Label Details:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-500 mb-1 block">{isAr ? 'اسم العطر (عربي):' : 'Perfume Name (Arabic):'}</label>
                <input
                  type="text"
                  value={labelData.perfumeName}
                  onChange={(e) => setLabelData({ ...labelData, perfumeName: e.target.value })}
                  className="w-full p-2 rounded-xl border border-neutral-300 font-bold"
                />
              </div>
              <div>
                <label className="text-neutral-500 mb-1 block">{isAr ? 'اسم العطر (إنجليزي):' : 'Perfume Name (English):'}</label>
                <input
                  type="text"
                  value={labelData.perfumeNameEn || ''}
                  onChange={(e) => setLabelData({ ...labelData, perfumeNameEn: e.target.value })}
                  className="w-full p-2 rounded-xl border border-neutral-300 font-serif"
                />
              </div>
              <div>
                <label className="text-neutral-500 mb-1 block">{isAr ? 'اسم الزبون / الإهداء (اختياري):' : 'Customer Name / Inscription:'}</label>
                <input
                  type="text"
                  value={labelData.customerName || ''}
                  onChange={(e) => setLabelData({ ...labelData, customerName: e.target.value })}
                  placeholder=""
                  className="w-full p-2 rounded-xl border border-neutral-300"
                />
              </div>
              <div>
                <label className="text-neutral-500 mb-1 block">{isAr ? 'حجم الزجاجة (ملل):' : 'Bottle Size (ml):'}</label>
                <select
                  value={labelData.bottleSizeMl}
                  onChange={(e) => setLabelData({ ...labelData, bottleSizeMl: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-neutral-300 font-mono font-bold"
                >
                  <option value={30}>{isAr ? '30 ملل (حجم حقيبة / سفر)' : '30 ml (Pocket / Travel)'}</option>
                  <option value={50}>{isAr ? '50 ملل (المقاس الأكثر طلباً)' : '50 ml (Most Popular)'}</option>
                  <option value={100}>{isAr ? '100 ملل (الحجم الملكي)' : '100 ml (Royal Flacon)'}</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-neutral-300 hover:border-black text-xs font-bold transition cursor-pointer"
          >
            ← {isAr ? 'إغلاق ومتابعة' : 'Close'}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-black shadow-md transition cursor-pointer flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'بدء الطباعة الآن' : 'Print Sticker'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
