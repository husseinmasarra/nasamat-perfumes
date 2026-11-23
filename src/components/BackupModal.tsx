import React, { useRef } from 'react';
import { X, Download, Upload, FileSpreadsheet, RotateCcw, AlertTriangle, Database } from './icons';
import type { FragranceOil, RawMaterial, ProductionBatch, AppSettings, SavedRecipe, Invoice } from '../types';
import { exportDatabaseBackup, exportOilsToCsv } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  oils: FragranceOil[];
  materials: RawMaterial[];
  batches: ProductionBatch[];
  settings: AppSettings;
  recipes?: SavedRecipe[];
  invoices?: Invoice[];
  onImportData: (data: {
    oils: FragranceOil[];
    materials: RawMaterial[];
    batches: ProductionBatch[];
    settings?: AppSettings;
    recipes?: SavedRecipe[];
    invoices?: Invoice[];
  }) => void;
  onResetDefaults: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  oils,
  materials,
  batches,
  settings,
  recipes = [],
  invoices = [],
  onImportData,
  onResetDefaults,
}) => {
  const { language, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle ESC key
  React.useEffect(() => {
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

  const handleExportJson = () => {
    exportDatabaseBackup({ oils, materials, batches, settings, recipes, invoices });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.oils) && Array.isArray(parsed.materials)) {
          onImportData(parsed);
          alert(language === 'ar' ? 'تم استيراد النسخة الاحتياطية بنجاح!' : 'Backup successfully imported!');
          onClose();
        } else {
          alert(language === 'ar' ? 'الملف المحدد غير متوافق أو لا يحتوي على بنية البيانات الصحيحة.' : 'File format not compatible.');
        }
      } catch (err) {
        alert(language === 'ar' ? 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية. يرجى التأكد من صحة الملف.' : 'Error reading backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              {t('backupTitle')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Export / Import Options */}
        <div className="space-y-3">
          {/* Export JSON */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100">{t('backupExportJson')}</h4>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'حفظ جميع الزيوت، المواد، الزجاجات، وسجل التشغيلات في ملف واحد' : 'Save all oils, raw materials, bottles, and batch history in a single JSON file'}
                </p>
              </div>
              <button
                onClick={handleExportJson}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t('export')}</span>
              </button>
            </div>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100">{t('backupImportJson')}</h4>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'استعادة كامل البيانات من ملف JSON تم تنزيله مسبقاً' : 'Restore complete laboratory database from a previously exported JSON backup'}
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>{t('import')}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Export CSV / Excel */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100">{t('backupExportExcel')}</h4>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'تصدير جدول الأصناف بأسعار الشراء والمخزون لفتحه في Microsoft Excel' : 'Export oils catalog with purchase costs and stock levels for Microsoft Excel'}
                </p>
              </div>
              <button
                onClick={() => exportOilsToCsv(oils, settings.currency)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel CSV</span>
              </button>
            </div>
          </div>

          {/* Factory Reset */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{t('backupResetAll')}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'استعادة الـ 100 صنف والمواد الافتراضية وحذف التعديلات والتشغيلات' : 'Restore default 100 oils and inventory levels (resets custom edits and batches)'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm(language === 'ar' ? 'هل أنت متأكد من استعادة البيانات الافتراضية؟ سيتم مسح التعديلات.' : 'Are you sure you want to restore defaults? All customizations will be reset.')) {
                    onResetDefaults();
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('resetDefaultsBtn')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            {t('close')}
          </button>
        </div>

      </div>
    </div>
  );
};
