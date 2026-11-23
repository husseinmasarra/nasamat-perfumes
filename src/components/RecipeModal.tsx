import React from 'react';
import { X, Printer, FlaskConical } from './icons';
import type { ProductionBatch, AppSettings, FragranceOil, RawMaterial } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedOilName, getLocalizedMaterialName } from '../utils/i18n';

interface RecipeModalProps {
  batch: ProductionBatch | null;
  settings: AppSettings;
  oils: FragranceOil[];
  materials: RawMaterial[];
  onClose: () => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  batch,
  settings,
  oils,
  materials,
  onClose,
}) => {
  const { language, t } = useLanguage();

  // Handle ESC key
  React.useEffect(() => {
    if (!batch) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [batch, onClose]);

  if (!batch) return null;

  const handlePrint = () => {
    window.print();
  };

  const formula = batch.formula;
  const alcoholMat = materials.find((m) => m.id === formula.alcoholMaterialId);
  const fixativeMat = materials.find((m) => m.id === formula.fixativeMaterialId);
  const bottleMat = materials.find((m) => m.id === formula.bottleMaterialId);
  const sprayerMat = materials.find((m) => m.id === formula.sprayerMaterialId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white border border-neutral-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto text-black">
        
        {/* Controls (hidden on print) */}
        <div className="flex items-center justify-between no-print border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-black text-black">
              {t('recipeTitle')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-black" />
              <span>{t('print')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-black rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= PRINTABLE CARD CONTENT ================= */}
        <div className="print-card bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-white space-y-6 relative overflow-hidden">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                NASAMAT PERFUME LAB • FORMULATION SPECIFICATION
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                {formula.name}
              </h2>
              <div className="text-xs text-neutral-300 mt-1">
                {t('brandTitle')} | {t('recipeBatchNo')} <strong className="text-amber-400 font-mono">{batch.batchNumber}</strong> | {t('recipeProducedBottles')} {batch.bottlesCount}
              </div>
            </div>

            <div className={`${language === 'ar' ? 'text-left' : 'text-right'} bg-black/60 p-3 rounded-xl border border-neutral-800`}>
              <div className="text-xs text-neutral-400">{t('recipeBottleSize')}</div>
              <div className="text-xl font-black text-amber-400">{formula.bottleCapacityMl} {t('ml')}</div>
              <div className="text-xs text-emerald-400 font-bold">{formula.concentrationPercent}% {language === 'ar' ? 'تركيز' : 'Conc.'}</div>
            </div>
          </div>

          {/* Core Volumes Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              {t('recipeBreakdownTitle')}
            </h4>

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'} text-xs`}>
                <thead className="bg-slate-900 text-slate-400 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">{t('calcColComponent')}</th>
                    <th className="py-2.5 px-3 font-bold text-center">{t('calcColRatio')}</th>
                    <th className="py-2.5 px-3 font-bold text-center">{t('calcColVolume')}</th>
                    <th className="py-2.5 px-3 font-bold text-center">{t('calcColWeight')}</th>
                    <th className="py-2.5 px-3 font-bold text-center">Batch ({batch.bottlesCount})</th>
                    <th className="py-2.5 px-3 font-bold text-center">{t('calcColCost')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {formula.oils.map((item, idx) => {
                    const oil = oils.find((o) => o.id === item.oilId);
                    return (
                      <tr key={idx} className="bg-slate-950/60">
                        <td className="py-2.5 px-3 font-bold text-amber-300">
                          {oil ? getLocalizedOilName(oil.name, language) : 'Fragrance Oil'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.percentage}%</td>
                        <td className="py-2.5 px-3 text-center font-black text-slate-100">{item.volumeMl} {t('ml')}</td>
                        <td className="py-2.5 px-3 text-center text-slate-300">{item.weightG} {t('gram')}</td>
                        <td className="py-2.5 px-3 text-center font-black text-amber-400">
                          {(item.volumeMl * batch.bottlesCount).toFixed(2)} {t('ml')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-200">
                          ${item.cost.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Alcohol */}
                  <tr className="bg-slate-950/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {alcoholMat ? getLocalizedMaterialName(alcoholMat.name, language) : (language === 'ar' ? 'كحول عطور 96%' : 'Perfumer Alcohol 96%')}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">
                      {(100 - formula.concentrationPercent - formula.fixativePercent).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-100">{formula.alcoholVolumeMl} {t('ml')}</td>
                    <td className="py-2.5 px-3 text-center text-slate-300">
                      {(formula.alcoholVolumeMl * 0.81).toFixed(2)} {t('gram')}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-sky-400">
                      {(formula.alcoholVolumeMl * batch.bottlesCount).toFixed(2)} {t('ml')}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-200">
                      ${formula.alcoholCost.toFixed(2)}
                    </td>
                  </tr>

                  {/* Fixative */}
                  {formula.fixativeVolumeMl > 0 && (
                    <tr className="bg-slate-950/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        {fixativeMat ? getLocalizedMaterialName(fixativeMat.name, language) : (language === 'ar' ? 'المثبت' : 'Fixative')}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400">{formula.fixativePercent}%</td>
                      <td className="py-2.5 px-3 text-center font-black text-slate-100">{formula.fixativeVolumeMl} {t('ml')}</td>
                      <td className="py-2.5 px-3 text-center text-slate-300">
                        {(formula.fixativeVolumeMl * 0.85).toFixed(2)} {t('gram')}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-rose-400">
                        {(formula.fixativeVolumeMl * batch.bottlesCount).toFixed(2)} {t('ml')}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-200">
                        ${formula.fixativeCost.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Packaging Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[11px]">{t('calcBottleMat')}:</span>
              <span className="font-bold text-slate-200">{bottleMat ? getLocalizedMaterialName(bottleMat.name, language) : 'Standard Bottle'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('calcSprayerMat')}:</span>
              <span className="font-bold text-slate-200">{sprayerMat ? getLocalizedMaterialName(sprayerMat.name, language) : 'Luxury Pump'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('calcCostPerBottle')}:</span>
              <span className="font-black text-amber-400">${formula.totalCostPerBottle.toFixed(2)}</span>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-xs gap-3">
            <div>
              <span className="text-slate-400 block text-[11px]">{t('calcSuggestedRetail')}:</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                ${formula.suggestedRetailPrice.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{language === 'ar' ? 'إجمالي تكلفة التشغيلة:' : 'Batch Cost:'}</span>
              <span className="text-base font-bold text-slate-200 font-mono">
                ${batch.totalBatchCost.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('calcNetProfit')}:</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                +${batch.totalExpectedProfit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Blending & Maceration Directions */}
          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3 space-y-1">
            <div className="font-bold text-slate-300">{t('recipeInstructions')}</div>
            <p>1. {t('recipeInst1')}</p>
            <p>2. {t('recipeInst2')}</p>
            <p>3. {t('recipeInst3')}</p>
          </div>

          <div className="text-center text-[10px] text-slate-500 pt-2 font-mono">
            {language === 'ar' 
              ? `طُبع من مختبر نسمات لصياغة وتركيب العطور الملكي • ${new Date().toLocaleDateString('ar-EG')}`
              : `Printed from Nasamat Perfume Formulation Lab • ${new Date().toLocaleDateString('en-US')}`}
          </div>

        </div>

      </div>
    </div>
  );
};
