import React, { useState } from 'react';
import { History, Printer, Search, Trash2, TrendingUp, FlaskConical, Package } from './icons';
import type { ProductionBatch, AppSettings } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BatchesTabProps {
  batches: ProductionBatch[];
  settings: AppSettings;
  onDeleteBatch: (id: string) => void;
  onPrintRecipe: (batch: ProductionBatch) => void;
}

export const BatchesTab: React.FC<BatchesTabProps> = ({
  batches,
  settings,
  onDeleteBatch,
  onPrintRecipe,
}) => {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBatches = batches.filter((b) => {
    return (
      b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.formula.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.notes && b.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalBottlesProduced = batches.reduce((sum, b) => sum + b.bottlesCount, 0);
  const totalCost = batches.reduce((sum, b) => sum + b.totalBatchCost, 0);
  const totalProfit = batches.reduce((sum, b) => sum + b.totalExpectedProfit, 0);

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-neutral-600 font-bold block">{t('batchKpiProduced')}</span>
            <span className="text-2xl font-black text-amber-800 font-mono">
              {totalBottlesProduced} <span className="text-sm font-normal text-neutral-500">{language === 'ar' ? 'زجاجة' : 'bottles'}</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-neutral-600 font-bold block">{t('batchKpiCost')}</span>
            <span className="text-2xl font-black text-black font-mono">
              ${totalCost.toFixed(2)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 text-black border border-neutral-200 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-neutral-600 font-bold block">{t('batchKpiProfit')}</span>
            <span className="text-2xl font-black text-emerald-700 font-mono">
              +${totalProfit.toFixed(2)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className={`w-4 h-4 text-slate-400 absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('batchSearchPlaceholder')}
          className={`w-full bg-slate-900 border border-slate-800 rounded-xl ${language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400`}
        />
      </div>

      {/* Batches Table / Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'} text-xs`}>
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">{t('batchColNo')}</th>
                <th className="py-3.5 px-4 font-bold">{t('batchColFormula')}</th>
                <th className="py-3.5 px-4 font-bold text-center">{t('batchColDetails')}</th>
                <th className="py-3.5 px-4 font-bold text-center">{t('batchColQuantity')}</th>
                <th className="py-3.5 px-4 font-bold">{t('batchColTotalCost')}</th>
                <th className="py-3.5 px-4 font-bold">{t('batchColRevenue')}</th>
                <th className="py-3.5 px-4 font-bold">{t('batchColProfit')}</th>
                <th className="py-3.5 px-4 font-bold">{t('batchColDate')}</th>
                <th className="py-3.5 px-4 font-bold text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredBatches.map((batch) => {
                const dateStr = new Date(batch.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={batch.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {batch.batchNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      {batch.formula.name}
                      {batch.notes && (
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{batch.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-bold">
                        {batch.formula.bottleCapacityMl} {t('ml')} | {batch.formula.concentrationPercent}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-amber-300">
                      {batch.bottlesCount} {language === 'ar' ? 'زجاجة' : 'bottles'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      ${batch.totalBatchCost.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-300">
                      ${batch.totalExpectedRevenue.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-400">
                      +${batch.totalExpectedProfit.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {dateStr}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onPrintRecipe(batch)}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition cursor-pointer"
                          title={t('batchViewCard')}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(language === 'ar' ? `هل أنت متأكد من حذف سجل التشغيلة ${batch.batchNumber}؟` : `Are you sure you want to delete ${batch.batchNumber}?`)) {
                              onDeleteBatch(batch.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title={t('delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBatches.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>{language === 'ar' ? 'لا توجد تشغيلات إنتاج مسجلة حتى الآن' : 'No manufacturing batches recorded yet'}</p>
          </div>
        )}
      </div>

    </div>
  );
};
