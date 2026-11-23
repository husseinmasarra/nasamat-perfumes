import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  ShoppingBag, 
  Check, 
  X, 
  AlertCircle, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Droplet,
  Package,
  WhatsAppIcon,
  Tag
} from './icons';
import type { 
  Invoice, 
  InvoiceItem, 
  InvoiceType, 
  InvoiceStatus, 
  PaymentMethod, 
  InvoiceItemType,
  FragranceOil, 
  RawMaterial, 
  AppSettings, 
  SavedRecipe,
  BottleLabelData
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedOilName } from '../utils/i18n';
import { openWhatsAppVIP, getOrderDataFromInvoice, type WhatsAppVIPActionType } from '../utils/whatsappConcierge';
import { AdminFinancialStatementModal } from './AdminFinancialStatementModal';

interface InvoicesTabProps {
  invoices: Invoice[];
  oils: FragranceOil[];
  materials: RawMaterial[];
  recipes: SavedRecipe[];
  settings: AppSettings;
  onSaveInvoice: (
    invoice: Invoice,
    stockChanges?: {
      deductions?: { oils: { id: string; amount: number }[]; materials: { id: string; amount: number }[] };
      additions?: { oils: { id: string; amount: number; cost?: number }[]; materials: { id: string; amount: number; cost?: number }[] };
    }
  ) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onOpenBottleLabel?: (data: BottleLabelData) => void;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({
  invoices,
  oils,
  materials,
  recipes,
  settings,
  onSaveInvoice,
  onDeleteInvoice,
  onOpenBottleLabel,
}) => {
  const { language, t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeWhatsAppMenuId, setActiveWhatsAppMenuId] = useState<string | null>(null);
  const [isFinancialStatementOpen, setIsFinancialStatementOpen] = useState(false);

  // Financial KPIs
  const totalSales = useMemo(() => {
    return invoices
      .filter((inv) => inv.type === 'sale')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  }, [invoices]);

  const totalPurchases = useMemo(() => {
    return invoices
      .filter((inv) => inv.type === 'purchase')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  }, [invoices]);

  const totalProfit = useMemo(() => {
    return invoices
      .filter((inv) => inv.type === 'sale')
      .reduce((sum, inv) => sum + (inv.netProfit || (inv.totalAmount * 0.6)), 0);
  }, [invoices]);

  const totalDue = useMemo(() => {
    return invoices
      .filter((inv) => inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.dueAmount, 0);
  }, [invoices]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Type / Status filter
      if (filterType === 'sale' && inv.type !== 'sale') return false;
      if (filterType === 'purchase' && inv.type !== 'purchase') return false;
      if (filterType === 'paid' && inv.status !== 'paid') return false;
      if (filterType === 'due' && inv.status === 'paid') return false;

      // Search term
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const matchNo = inv.invoiceNumber.toLowerCase().includes(q);
      const matchParty = inv.partyName.toLowerCase().includes(q);
      const matchPhone = inv.partyPhone && inv.partyPhone.toLowerCase().includes(q);
      const matchItems = inv.items.some((item) => item.name.toLowerCase().includes(q));

      return matchNo || matchParty || matchPhone || matchItems;
    });
  }, [invoices, filterType, searchTerm]);

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-black font-bold text-xs tracking-wider uppercase">
              <Receipt className="w-4 h-4 text-black" />
              <span>{t('tabInvoices')}</span>
              <span className="bg-neutral-100 text-black border border-neutral-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                {invoices.length} {language === 'ar' ? 'فاتورة مسجلة' : 'Recorded'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-black flex items-center gap-2 font-serif">
              <span>{t('invTitle')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl leading-relaxed">
              {t('invSubtitle')}
            </p>
          </div>

          {/* New Invoice Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsFinancialStatementOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-950 hover:bg-black text-amber-400 border border-amber-500/40 hover:border-amber-400 font-black rounded-xl shadow-xs text-xs sm:text-sm transition-all duration-200 cursor-pointer"
              title={language === 'ar' ? 'كشف حساب مالي تفصيلي يومي وشهري خاص بالإدارة والمدير' : 'Manager Daily & Monthly Financial Statement'}
            >
              <Printer className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              <span>{language === 'ar' ? 'كشف حساب يومي وشهري (خاص بالمدير)' : 'Daily & Monthly Statement (Manager)'}</span>
            </button>

            <button
              onClick={() => setIsNewSaleOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-900 text-white font-black rounded-xl shadow-sm text-xs sm:text-sm transition-all duration-200 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5] text-white" />
              <span className="text-white">{t('invNewSaleBtn')}</span>
            </button>

            <button
              onClick={() => setIsNewPurchaseOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-100 text-black border border-neutral-300 font-bold rounded-xl shadow-xs text-xs sm:text-sm transition-all duration-200 cursor-pointer"
            >
              <Package className="w-4 h-4 text-black" />
              <span>{t('invNewPurchaseBtn')}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-neutral-200">
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-emerald-900 font-bold block">{t('invKpiTotalSales')}</span>
            <span className="text-xl font-black text-emerald-700 font-mono">
              {settings.currency}{totalSales.toFixed(2)}
            </span>
          </div>
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-sky-900 font-bold block">{t('invKpiTotalPurchases')}</span>
            <span className="text-xl font-black text-sky-800 font-mono">
              {settings.currency}{totalPurchases.toFixed(2)}
            </span>
          </div>
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-amber-900 font-bold block">{t('invKpiNetProfit')}</span>
            <span className="text-xl font-black text-amber-700 font-mono">
              +{settings.currency}{totalProfit.toFixed(2)}
            </span>
          </div>
          <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-rose-900 font-bold block">{t('invKpiDueBalance')}</span>
            <span className="text-xl font-black text-rose-700 font-mono">
              {settings.currency}{totalDue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search and Filter Pills */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('invSearchPlaceholder')}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 ps-10 pe-9 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: t('invFilterAll') },
            { id: 'sale', label: t('invFilterSales') },
            { id: 'purchase', label: t('invFilterPurchases') },
            { id: 'paid', label: t('invFilterPaid') },
            { id: 'due', label: t('invFilterDue') },
          ].map((pill) => {
            const active = filterType === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setFilterType(pill.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Invoices List / Table */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Receipt className="w-10 h-10 text-amber-500/40 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {language === 'ar' ? 'لا توجد فواتير مطابقة للبحث' : 'No matching invoices found'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {language === 'ar' 
              ? 'سجّل أول فاتورة مبيع للعملاء أو فاتورة شراء مواد أولية الآن!' 
              : 'Record your first sales or purchase invoice now!'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setIsNewSaleOpen(true)}
              className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition"
            >
              {t('invNewSaleBtn')}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 text-start">{t('invColNo')}</th>
                  <th className="py-3.5 px-3 text-start">{t('invColType')}</th>
                  <th className="py-3.5 px-3 text-start">{t('invColDate')}</th>
                  <th className="py-3.5 px-4 text-start">{t('invColParty')}</th>
                  <th className="py-3.5 px-3 text-start">{t('invColItemsCount')}</th>
                  <th className="py-3.5 px-3 text-end">{t('invColTotal')}</th>
                  <th className="py-3.5 px-3 text-center">{t('invColStatus')}</th>
                  <th className="py-3.5 px-3 text-center">{t('invColPayment')}</th>
                  <th className="py-3.5 px-4 text-center">{t('invColActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredInvoices.map((inv) => {
                  const isSale = inv.type === 'sale';
                  const isPaid = inv.status === 'paid';
                  const formattedDate = new Date(inv.date).toLocaleDateString(language === 'ar' ? 'ar-LB' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr 
                      key={inv.id}
                      className="hover:bg-slate-850/60 transition-colors group"
                    >
                      {/* Invoice # */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="font-mono font-bold text-amber-400 hover:text-amber-300 underline decoration-amber-500/40 cursor-pointer"
                        >
                          {inv.invoiceNumber}
                        </button>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                          isSale 
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                        }`}>
                          {isSale ? '🛍️ ' + t('invTypeSale') : '📦 ' + t('invTypePurchase')}
                          {inv.saleKind && (
                            <span className="opacity-75">
                              ({inv.saleKind === 'wholesale' ? t('invKindWholesale') : t('invKindRetail')})
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Party Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white truncate max-w-[180px]">
                          {inv.partyName}
                        </div>
                        {inv.partyPhone && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            {inv.partyPhone}
                          </div>
                        )}
                      </td>

                      {/* Items Preview */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono text-[11px]">
                            {inv.items.length} {language === 'ar' ? 'أصناف' : 'items'}
                          </span>
                          {inv.items.some(it => it.notes?.includes('ملل') || it.name.includes('خلطة')) && (
                            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded text-[10px] font-bold flex items-center gap-1">
                              <span>🧪</span>
                              <span>{language === 'ar' ? 'خلطة بالملل' : 'Bespoke (ml)'}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-3 text-end font-mono">
                        <div className={`font-black text-sm ${isSale ? 'text-emerald-400' : 'text-slate-100'}`}>
                          {settings.currency}{inv.totalAmount.toFixed(2)}
                        </div>
                        {isSale && inv.netProfit !== undefined && (
                          <div className="text-[10px] text-amber-400/90">
                            +{settings.currency}{inv.netProfit.toFixed(2)} {language === 'ar' ? 'ربح' : 'profit'}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                            : inv.status === 'partial'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {isPaid ? t('invStatusPaid') : inv.status === 'partial' ? t('invStatusPartial') : t('invStatusDue')}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-3 text-center text-[11px] text-slate-400">
                        {inv.paymentMethod === 'whish_omt' ? 'Whish/OMT' : inv.paymentMethod === 'cash' ? 'Cash' : 'Card'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 relative">
                          
                          {/* WhatsApp VIP Concierge Dropdown Button */}
                          {inv.partyPhone && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setActiveWhatsAppMenuId(activeWhatsAppMenuId === inv.id ? null : inv.id)}
                                className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-800 text-emerald-400 border border-emerald-700/50 transition cursor-pointer flex items-center gap-1"
                                title="رسائل متابعة الزبون VIP عبر واتساب"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold hidden xl:inline">VIP</span>
                              </button>

                              {/* WhatsApp VIP Menu Popup */}
                              {activeWhatsAppMenuId === inv.id && (
                                <div 
                                  className="absolute top-full end-0 mt-1 z-30 w-52 bg-slate-900 border border-emerald-500/40 rounded-xl shadow-2xl p-1.5 text-xs text-start space-y-1 animate-scaleUp"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-2 py-1 border-b border-slate-800 text-[10px] font-bold text-slate-400">
                                    خدمة عملاء VIP للطلبية {inv.invoiceNumber}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      openWhatsAppVIP('compounding', getOrderDataFromInvoice(inv, settings.lbpRate || 90000, settings.storeName));
                                      setActiveWhatsAppMenuId(null);
                                    }}
                                    className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition"
                                  >
                                    <span>🧪</span>
                                    <span>قيد الصياغة بالمختبر (إكستري)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      openWhatsAppVIP('delivery', getOrderDataFromInvoice(inv, settings.lbpRate || 90000, settings.storeName));
                                      setActiveWhatsAppMenuId(null);
                                    }}
                                    className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition"
                                  >
                                    <span>🚚</span>
                                    <span>عطرك في الطريق للتوصيل</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      openWhatsAppVIP('satisfaction', getOrderDataFromInvoice(inv, settings.lbpRate || 90000, settings.storeName));
                                      setActiveWhatsAppMenuId(null);
                                    }}
                                    className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition"
                                  >
                                    <span>🌹</span>
                                    <span>استطلاع الرضا والثبات</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      openWhatsAppVIP('receipt', getOrderDataFromInvoice(inv, settings.lbpRate || 90000, settings.storeName));
                                      setActiveWhatsAppMenuId(null);
                                    }}
                                    className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition border-t border-slate-800/80"
                                  >
                                    <span>🧾</span>
                                    <span>إرسال الفاتورة الرقمية</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bottle Label Print Button */}
                          {onOpenBottleLabel && (
                            <button
                              type="button"
                              onClick={() => {
                                const primaryItem = inv.items[0];
                                onOpenBottleLabel({
                                  perfumeName: primaryItem ? primaryItem.name : 'عطر نسمات الملكي',
                                  customerName: inv.partyName,
                                  bottleSizeMl: primaryItem ? primaryItem.sizeOrQty : 50,
                                  concentrationPercent: 25,
                                  concentrationTier: 'Extrait de Parfum',
                                  batchNumber: `NAS-${inv.invoiceNumber}`,
                                  formulationDate: new Date(inv.date).toISOString().split('T')[0],
                                });
                              }}
                              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition cursor-pointer"
                              title="طباعة استيكر وملصق الزجاجة (Bottle Label)"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Print Receipt Button */}
                          <button
                            onClick={() => setSelectedInvoiceForPrint(inv)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                            title={t('invPrintAction')}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteConfirmId(inv.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title={t('invDeleteAction')}
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
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">{t('invDeleteAction')}</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('invDeleteConfirm')}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-bold transition"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmId) {
                    onDeleteInvoice(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Sales Invoice Modal */}
      {isNewSaleOpen && (
        <NewSaleInvoiceModal
          oils={oils}
          materials={materials}
          recipes={recipes}
          settings={settings}
          onClose={() => setIsNewSaleOpen(false)}
          onSave={(invoice, stockDeductions) => {
            onSaveInvoice(invoice, { deductions: stockDeductions });
            setIsNewSaleOpen(false);
            setSelectedInvoiceForPrint(invoice);
          }}
        />
      )}

      {/* New Purchase Invoice Modal */}
      {isNewPurchaseOpen && (
        <NewPurchaseInvoiceModal
          oils={oils}
          materials={materials}
          settings={settings}
          onClose={() => setIsNewPurchaseOpen(false)}
          onSave={(invoice, stockAdditions) => {
            onSaveInvoice(invoice, { additions: stockAdditions });
            setIsNewPurchaseOpen(false);
          }}
        />
      )}

      {/* Printable Receipt Modal */}
      {selectedInvoiceForPrint && (
        <InvoiceReceiptModal
          invoice={selectedInvoiceForPrint}
          settings={settings}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}

      {/* Daily & Monthly Financial Statement Modal (Manager Only) */}
      {isFinancialStatementOpen && (
        <AdminFinancialStatementModal
          isOpen={isFinancialStatementOpen}
          onClose={() => setIsFinancialStatementOpen(false)}
          invoices={invoices}
          settings={settings}
          isAdminAuthenticated={true}
        />
      )}

    </div>
  );
};

// ================= NEW SALE INVOICE MODAL =================
interface NewSaleModalProps {
  oils: FragranceOil[];
  materials: RawMaterial[];
  recipes: SavedRecipe[];
  settings: AppSettings;
  onClose: () => void;
  onSave: (
    invoice: Invoice,
    stockDeductions?: { oils: { id: string; amount: number }[]; materials: { id: string; amount: number }[] }
  ) => void;
}

const NewSaleInvoiceModal: React.FC<NewSaleModalProps> = ({
  oils,
  recipes,
  materials,
  settings,
  onClose,
  onSave,
}) => {
  const { language, t } = useLanguage();

  const [customerName, setCustomerName] = useState(language === 'ar' ? 'زبون نقدي - المحل' : 'Cash Customer');
  const [phone, setPhone] = useState('');
  const [saleKind, setSaleKind] = useState<'retail' | 'wholesale'>('retail');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentStatus, setPaymentStatus] = useState<InvoiceStatus>('paid');
  const [autoDeductStock, setAutoDeductStock] = useState(true);
  const [notes, setNotes] = useState('');

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: `item-${Date.now()}`,
      itemType: 'perfume_bottle',
      referenceId: recipes[0]?.id || oils[0]?.id,
      name: recipes[0]?.name || (oils[0]?.name ? `${oils[0].name} 50ml` : 'Perfume 50ml'),
      sizeOrQty: 1,
      unit: 'bottle',
      bottleCapacityMl: 50,
      unitPrice: 7,
      totalPrice: 7,
      cogsCost: 4.4,
    }
  ]);

  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Financial calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const totalAmount = Math.max(0, subtotal - discount + tax + (deliveryFee || 0));
  const [paidAmount, setPaidAmount] = useState<number>(totalAmount);
  
  // Keep paidAmount in sync if fully paid
  React.useEffect(() => {
    if (paymentStatus === 'paid') {
      setPaidAmount(totalAmount);
    }
  }, [totalAmount, paymentStatus]);

  const dueAmount = Math.max(0, totalAmount - paidAmount);

  // Total COGS
  const totalCogsCost = useMemo(() => {
    return items.reduce((sum, item) => sum + ((item.cogsCost || 0) * item.sizeOrQty), 0);
  }, [items]);

  const netProfit = Number((totalAmount - totalCogsCost).toFixed(2));

  // Add Item Row
  const handleAddItem = (type: InvoiceItemType) => {
    if (type === 'perfume_bottle') {
      const rec = recipes[0];
      setItems([
        ...items,
        {
          id: `item-${Date.now()}`,
          itemType: 'perfume_bottle',
          referenceId: rec ? rec.id : oils[0]?.id,
          name: rec ? rec.name : `${oils[0]?.name || 'Perfume'} 50ml`,
          sizeOrQty: 1,
          unit: 'bottle',
          bottleCapacityMl: 50,
          unitPrice: saleKind === 'wholesale' ? 4.5 : 7,
          totalPrice: saleKind === 'wholesale' ? 4.5 : 7,
          cogsCost: 4.4,
        }
      ]);
    } else if (type === 'raw_oil') {
      const oil = oils[0];
      setItems([
        ...items,
        {
          id: `item-${Date.now()}`,
          itemType: 'raw_oil',
          referenceId: oil?.id,
          name: `زيت خام: ${oil?.name || 'Oil'}`,
          sizeOrQty: 50,
          unit: 'ml',
          unitPrice: oil ? Number((oil.unitCost * 1.5).toFixed(3)) : 0.1,
          totalPrice: oil ? Number((oil.unitCost * 1.5 * 50).toFixed(2)) : 5,
          cogsCost: oil ? oil.unitCost : 0.07,
        }
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const handleUpdateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const next = [...items];
    const item = { ...next[index], ...updates };
    item.totalPrice = Number((item.sizeOrQty * item.unitPrice).toFixed(2));
    next[index] = item;
    setItems(next);
  };

  // Preset Selection for Perfume
  const handleSelectPerfumePreset = (index: number, id: string) => {
    // Check if recipe
    const rec = recipes.find((r) => r.id === id);
    if (rec) {
      const cap = rec.bottleCapacityMl || 50;
      const defaultRetail = cap === 30 ? 5 : cap === 100 ? 12 : 7;
      const price = saleKind === 'wholesale' ? 4.5 : (rec.suggestedRetailPrice || defaultRetail);
      handleUpdateItem(index, {
        referenceId: rec.id,
        name: `${rec.name} (${cap}ml)`,
        bottleCapacityMl: cap,
        unitPrice: price,
        cogsCost: 4.4,
      });
      return;
    }

    // Check if single oil
    const oil = oils.find((o) => o.id === id);
    if (oil) {
      const price = saleKind === 'wholesale' ? (oil.wholesalePrice50ml || 4.5) : (oil.retailPrice50ml || 7);
      handleUpdateItem(index, {
        referenceId: oil.id,
        name: `${oil.name} (50ml)`,
        bottleCapacityMl: 50,
        unitPrice: price,
        cogsCost: Number((oil.unitCost * 12.5 + 2.95).toFixed(2)),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) return;

    const nextCode = `INV-S-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const newInvoice: Invoice = {
      id: `inv-s-${Date.now()}`,
      invoiceNumber: nextCode,
      type: 'sale',
      saleKind,
      date: new Date().toISOString(),
      partyName: customerName.trim(),
      partyPhone: phone.trim() || undefined,
      status: paymentStatus,
      paymentMethod,
      items,
      subtotal,
      deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
      discount,
      tax,
      totalAmount,
      paidAmount,
      dueAmount,
      totalCogsCost,
      netProfit,
      stockDeducted: autoDeductStock,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Prepare deductions if enabled
    let stockDeductions;
    if (autoDeductStock) {
      const oilDeductions: { id: string; amount: number }[] = [];
      const matDeductions: { id: string; amount: number }[] = [];

      items.forEach((item) => {
        if (item.itemType === 'raw_oil' && item.referenceId) {
          oilDeductions.push({ id: item.referenceId, amount: item.sizeOrQty });
        } else if (item.itemType === 'perfume_bottle') {
          // If recipe, deduct constituent oils proportional to bottle size & concentration
          const rec = recipes.find((r) => r.id === item.referenceId);
          if (rec) {
            const totalOilMl = ((rec.bottleCapacityMl || 50) * (rec.concentrationPercent || 25) / 100) * item.sizeOrQty;
            rec.oils.forEach((o) => {
              oilDeductions.push({
                id: o.oilId,
                amount: Number(((totalOilMl * o.percentage) / 100).toFixed(2))
              });
            });
          } else if (item.referenceId) {
            // single oil
            const oilMl = (item.bottleCapacityMl || 50) * 0.25 * item.sizeOrQty;
            oilDeductions.push({ id: item.referenceId, amount: Number(oilMl.toFixed(2)) });
          }
        }
      });

      stockDeductions = { oils: oilDeductions, materials: matDeductions };
    }

    onSave(newInvoice, stockDeductions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-black text-white">
              {t('invModalNewSaleTitle')}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Customer & Sale Kind */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('invCustomerName')} *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('invPhone')}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('invSaleKind')}
              </label>
              <select
                value={saleKind}
                onChange={(e) => setSaleKind(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="retail">{t('invKindRetail')} (Retail)</option>
                <option value="wholesale">{t('invKindWholesale')} (Wholesale)</option>
              </select>
            </div>
          </div>

          {/* Payment & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('invPaymentMethod')}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="cash">نقدي (Cash)</option>
                <option value="whish_omt">Whish Money / OMT لبنان</option>
                <option value="bank_card">بطاقة بنكية (Credit/Debit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('invPaymentStatus')}
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as InvoiceStatus)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="paid">{t('invStatusPaid')}</option>
                <option value="partial">{t('invStatusPartial')}</option>
                <option value="due">{t('invStatusDue')}</option>
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                {language === 'ar' ? 'أصناف الفاتورة (عطور جاهزة أو زيوت خام):' : 'Invoice Line Items:'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddItem('perfume_bottle')}
                  className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Package className="w-3 h-3" />
                  <span>+ عطر زجاجة</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('raw_oil')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Droplet className="w-3 h-3 text-amber-400" />
                  <span>+ زيت خام (مل)</span>
                </button>
              </div>
            </div>

            {/* Items Rows */}
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row items-center gap-2"
                >
                  {/* Item selector */}
                  <div className="flex-1 w-full">
                    {item.itemType === 'perfume_bottle' ? (
                      <select
                        value={item.referenceId || ''}
                        onChange={(e) => handleSelectPerfumePreset(idx, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <optgroup label="✨ خلطات نسمات المحفوظة">
                          {recipes.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} - ${r.suggestedRetailPrice || 7}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="🌹 الزيوت الفردية الـ 100">
                          {oils.slice(0, 30).map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.code} - {o.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    ) : (
                      <select
                        value={item.referenceId || ''}
                        onChange={(e) => {
                          const o = oils.find((oil) => oil.id === e.target.value);
                          if (o) {
                            handleUpdateItem(idx, {
                              referenceId: o.id,
                              name: `زيت خام: ${o.name}`,
                              unitPrice: Number((o.unitCost * 1.5).toFixed(3)),
                              cogsCost: o.unitCost,
                            });
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        {oils.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.code} - {o.name} (${o.unitCost}/ml)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Quantity & Unit */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-slate-400">{t('invColQty')}:</span>
                    <input
                      type="number"
                      min="1"
                      step={item.unit === 'ml' ? '5' : '1'}
                      value={item.sizeOrQty}
                      onChange={(e) => handleUpdateItem(idx, { sizeOrQty: parseFloat(e.target.value) || 1 })}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-amber-400 text-xs focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">{item.unit === 'bottle' ? 'زجاجة' : 'مل'}</span>
                  </div>

                  {/* Unit Price */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-slate-400">{t('invColUnitPrice')}:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-emerald-400 text-xs focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">$</span>
                  </div>

                  {/* Total Line Price */}
                  <div className="w-16 text-end font-bold text-white text-xs shrink-0 font-mono">
                    ${item.totalPrice.toFixed(2)}
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    disabled={items.length <= 1}
                    onClick={() => handleRemoveItem(idx)}
                    className="text-slate-500 hover:text-rose-400 disabled:opacity-30 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{t('invSubtotal')}:</span>
              <span className="font-mono font-bold">${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{t('invDiscount')} ($):</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-end text-xs text-amber-400 font-bold"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{language === 'ar' ? 'رسوم التوصيل ($):' : 'Delivery Fee ($):'}</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={deliveryFee || ''}
                onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-end text-xs text-sky-400 font-bold"
              />
            </div>

            <div className="flex items-center justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
              <span className="text-emerald-400">{t('invNetTotal')}:</span>
              <span className="text-lg font-mono text-emerald-400">${totalAmount.toFixed(2)}</span>
            </div>

            {/* Profit preview */}
            <div className="flex items-center justify-between text-xs text-amber-300/80 pt-1 border-t border-slate-800/60">
              <span>{language === 'ar' ? 'صافي الربح المتوقع من هذه الفاتورة:' : 'Estimated Net Profit:'}</span>
              <span className="font-mono font-bold text-amber-400">+${netProfit.toFixed(2)}</span>
            </div>
          </div>

          {/* Stock auto-deduct toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deductStock"
              checked={autoDeductStock}
              onChange={(e) => setAutoDeductStock(e.target.checked)}
              className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="deductStock" className="text-xs text-slate-300 cursor-pointer font-medium">
              {t('invAutoDeductStock')}
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-bold transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{language === 'ar' ? 'حفظ وإصدار الفاتورة' : 'Save & Issue Invoice'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

// ================= NEW PURCHASE INVOICE MODAL =================
interface NewPurchaseModalProps {
  oils: FragranceOil[];
  materials: RawMaterial[];
  settings: AppSettings;
  onClose: () => void;
  onSave: (
    invoice: Invoice,
    stockAdditions?: { oils: { id: string; amount: number; cost?: number }[]; materials: { id: string; amount: number; cost?: number }[] }
  ) => void;
}

const NewPurchaseInvoiceModal: React.FC<NewPurchaseModalProps> = ({
  oils,
  materials,
  settings,
  onClose,
  onSave,
}) => {
  const { language, t } = useLanguage();

  const [supplierName, setSupplierName] = useState('شركة لوزي السويسرية (Luzi Fragrances)');
  const [phone, setPhone] = useState('+41 44 835 72 22');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentStatus, setPaymentStatus] = useState<InvoiceStatus>('paid');
  const [autoRestock, setAutoRestock] = useState(true);
  const [notes, setNotes] = useState('');

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: `p-item-${Date.now()}`,
      itemType: 'raw_oil',
      referenceId: oils[0]?.id,
      name: oils[0]?.name ? `زيت مركز: ${oils[0].name}` : 'Fragrance Oil',
      sizeOrQty: 500,
      unit: 'ml',
      unitPrice: oils[0]?.unitCost || 0.065,
      totalPrice: Number(((oils[0]?.unitCost || 0.065) * 500).toFixed(2)),
    }
  ]);

  const [discount, setDiscount] = useState<number>(0);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const totalAmount = Math.max(0, subtotal - discount);

  const handleAddItem = (type: 'raw_oil' | 'raw_material') => {
    if (type === 'raw_oil') {
      const oil = oils[0];
      setItems([
        ...items,
        {
          id: `p-item-${Date.now()}`,
          itemType: 'raw_oil',
          referenceId: oil?.id,
          name: `زيت مركز: ${oil?.name || 'Oil'}`,
          sizeOrQty: 500,
          unit: 'ml',
          unitPrice: oil?.unitCost || 0.07,
          totalPrice: Number(((oil?.unitCost || 0.07) * 500).toFixed(2)),
        }
      ]);
    } else {
      const mat = materials[0];
      setItems([
        ...items,
        {
          id: `p-item-${Date.now()}`,
          itemType: 'raw_material',
          referenceId: mat?.id,
          name: mat?.name || 'Material',
          sizeOrQty: 100,
          unit: mat?.unit === 'ml' ? 'ml' : 'piece',
          unitPrice: mat?.unitCost || 1.35,
          totalPrice: Number(((mat?.unitCost || 1.35) * 100).toFixed(2)),
        }
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const handleUpdateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const next = [...items];
    const item = { ...next[index], ...updates };
    item.totalPrice = Number((item.sizeOrQty * item.unitPrice).toFixed(2));
    next[index] = item;
    setItems(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || items.length === 0) return;

    const nextCode = `INV-P-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const newInvoice: Invoice = {
      id: `inv-p-${Date.now()}`,
      invoiceNumber: nextCode,
      type: 'purchase',
      date: new Date().toISOString(),
      partyName: supplierName.trim(),
      partyPhone: phone.trim() || undefined,
      status: paymentStatus,
      paymentMethod,
      items,
      subtotal,
      discount,
      tax: 0,
      totalAmount,
      paidAmount: totalAmount,
      dueAmount: 0,
      stockDeducted: autoRestock,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let stockAdditions;
    if (autoRestock) {
      const oilAdds: { id: string; amount: number; cost?: number }[] = [];
      const matAdds: { id: string; amount: number; cost?: number }[] = [];

      items.forEach((item) => {
        if (item.itemType === 'raw_oil' && item.referenceId) {
          oilAdds.push({
            id: item.referenceId,
            amount: item.sizeOrQty,
            cost: item.totalPrice,
          });
        } else if (item.itemType === 'raw_material' && item.referenceId) {
          matAdds.push({
            id: item.referenceId,
            amount: item.sizeOrQty,
            cost: item.totalPrice,
          });
        }
      });
      stockAdditions = { oils: oilAdds, materials: matAdds };
    }

    onSave(newInvoice, stockAdditions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-400" />
            <h3 className="text-base sm:text-lg font-black text-white">
              {t('invModalNewPurchaseTitle')}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('invSupplierName')} *
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('invPhone')}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                {language === 'ar' ? 'المواد والزيوت المشتراة:' : 'Purchased Materials & Oils:'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddItem('raw_oil')}
                  className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Droplet className="w-3 h-3 text-amber-400" />
                  <span>+ توريد زيت خام</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('raw_material')}
                  className="px-2.5 py-1 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Package className="w-3 h-3 text-sky-400" />
                  <span>+ قوارير وبخاخات</span>
                </button>
              </div>
            </div>

            {/* Item Rows */}
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row items-center gap-2"
                >
                  <div className="flex-1 w-full">
                    {item.itemType === 'raw_oil' ? (
                      <select
                        value={item.referenceId || ''}
                        onChange={(e) => {
                          const o = oils.find((oil) => oil.id === e.target.value);
                          if (o) {
                            handleUpdateItem(idx, {
                              referenceId: o.id,
                              name: `زيت مركز: ${o.name}`,
                              unitPrice: o.unitCost,
                            });
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        {oils.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.code} - {o.name} (${o.unitCost}/ml)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={item.referenceId || ''}
                        onChange={(e) => {
                          const m = materials.find((mat) => mat.id === e.target.value);
                          if (m) {
                            handleUpdateItem(idx, {
                              referenceId: m.id,
                              name: m.name,
                              unitPrice: m.unitCost,
                            });
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} (${m.unitCost})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-slate-400">{t('invColQty')}:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.sizeOrQty}
                      onChange={(e) => handleUpdateItem(idx, { sizeOrQty: parseFloat(e.target.value) || 1 })}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-sky-400 text-xs focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">{item.unit === 'ml' ? 'مل' : 'قطعة'}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-slate-400">{language === 'ar' ? 'سعر التكلفة:' : 'Cost:'}</span>
                    <input
                      type="number"
                      step="0.005"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-amber-400 text-xs focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">$</span>
                  </div>

                  <div className="w-16 text-end font-bold text-white text-xs shrink-0 font-mono">
                    ${item.totalPrice.toFixed(2)}
                  </div>

                  <button
                    type="button"
                    disabled={items.length <= 1}
                    onClick={() => handleRemoveItem(idx)}
                    className="text-slate-500 hover:text-rose-400 disabled:opacity-30 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{t('invSubtotal')}:</span>
              <span className="font-mono font-bold">${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{t('invDiscount')} ($):</span>
              <input
                type="number"
                min="0"
                step="1"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-end text-xs text-amber-400 font-bold"
              />
            </div>

            <div className="flex items-center justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
              <span className="text-sky-400">{t('invNetTotal')}:</span>
              <span className="text-lg font-mono text-sky-400">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Stock auto-restock toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="restockCheck"
              checked={autoRestock}
              onChange={(e) => setAutoRestock(e.target.checked)}
              className="accent-sky-500 w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="restockCheck" className="text-xs text-slate-300 cursor-pointer font-medium">
              {t('invAutoRestock')}
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-bold transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black rounded-xl text-xs shadow-lg shadow-sky-600/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{language === 'ar' ? 'تسجيل فاتورة الشراء' : 'Record Purchase Invoice'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

// ================= PRINTABLE RECEIPT MODAL =================
export interface InvoiceReceiptModalProps {
  invoice: Invoice;
  settings: AppSettings;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoice,
  settings,
  onClose,
}) => {
  const { language, t } = useLanguage();
  const isSale = invoice.type === 'sale';

  // Handle ESC key to dismiss
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-xl w-full my-auto shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Top Bar (hidden in print) */}
        <div className="no-print px-5 py-3 border-b border-neutral-800 flex items-center justify-between bg-black text-white">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-white tracking-wide">
              {t('invPrintReceipt')} • <span className="font-mono text-amber-400">{invoice.invoiceNumber}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-xs shadow-md transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-black" />
              <span>{t('print')}</span>
            </button>
            <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg transition hover:bg-neutral-800 cursor-pointer" title="إغلاق (Esc)">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 sm:p-8 bg-white text-black print:p-0 space-y-6">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-4 border-neutral-300">
            <div>
              <div className="flex items-center gap-2 text-amber-800 font-black text-xs tracking-widest uppercase">
                <span>NASAMAT PARFUMS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                {settings.storeName || 'نسمات للعطور الملكية'}
              </h2>
              <p className="text-xs text-neutral-600 font-bold mt-0.5">
                {settings.storeLocation || 'بيروت / جبل لبنان'} • {settings.storePhone || '+961 70 000 000'}
              </p>
            </div>

            <div className="text-end">
              <div className="inline-block bg-neutral-100 border border-neutral-300 px-3 py-1 rounded-lg text-xs font-mono font-black text-black">
                {invoice.invoiceNumber}
              </div>
              <div className="text-[11px] text-neutral-600 font-bold mt-1">
                {new Date(invoice.date).toLocaleDateString(language === 'ar' ? 'ar-LB' : 'en-US', {
                  dateStyle: 'medium',
                })}
              </div>
            </div>
          </div>

          {/* Party & Invoice Info */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <div>
              <span className="text-neutral-500 font-bold block text-[10px]">
                {isSale ? t('invCustomerName') : t('invSupplierName')}:
              </span>
              <span className="font-black text-black text-sm">{invoice.partyName}</span>
              {invoice.partyPhone && (
                <span className="block text-neutral-700 text-[11px] font-mono font-bold mt-0.5">{invoice.partyPhone}</span>
              )}
            </div>

            <div className="text-end space-y-1">
              <div>
                <span className="text-neutral-500 font-bold text-[10px] me-1">{t('invColType')}:</span>
                <span className="font-black text-black">
                  {isSale ? t('invTypeSale') : t('invTypePurchase')}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 font-bold text-[10px] me-1">{t('invPaymentMethod')}:</span>
                <span className="font-black text-black">
                  {invoice.paymentMethod === 'whish_omt' ? 'Whish / OMT' : invoice.paymentMethod === 'cash' ? 'Cash' : 'Card'}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black bg-neutral-100 text-black font-black">
                <th className="py-2.5 px-2 text-start text-black font-black">#</th>
                <th className="py-2.5 px-3 text-start text-black font-black">{t('invColItemName')}</th>
                <th className="py-2.5 px-2 text-center text-black font-black">{t('invColQty')}</th>
                <th className="py-2.5 px-2 text-end text-black font-black">{t('invColUnitPrice')}</th>
                <th className="py-2.5 px-2 text-end text-black font-black">{t('invColLineTotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  <td className="py-2.5 px-2 text-neutral-600 font-mono text-[11px] font-bold">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-black text-black text-xs">
                    <div>{item.name}</div>
                    {item.notes && (
                      <div className="mt-1 p-2 rounded-lg bg-amber-50/90 border border-amber-300 text-amber-950 text-[10px] font-sans whitespace-pre-line leading-relaxed text-start">
                        <div className="font-black text-amber-900 flex items-center gap-1 mb-0.5">
                          <span>🧪</span>
                          <span>{language === 'ar' ? 'المقادير المعملية للخلطة بالملل (حسب اختيار الزبون):' : 'Bespoke Formulation in ML:'}</span>
                        </div>
                        {item.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-black">
                    {item.sizeOrQty} {item.unit === 'bottle' ? 'زجاجة' : 'مل'}
                  </td>
                  <td className="py-2.5 px-2 text-end font-mono font-bold text-neutral-800">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-2.5 px-2 text-end font-mono font-black text-black">${item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="border-t pt-3 space-y-1.5 text-xs text-end max-w-xs ms-auto border-neutral-300">
            <div className="flex justify-between text-neutral-700 font-bold">
              <span>{t('invSubtotal')}:</span>
              <span className="font-mono text-black font-black">${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.deliveryFee !== undefined && invoice.deliveryFee > 0 && (
              <div className="flex justify-between text-neutral-700 font-bold">
                <span>{language === 'ar' ? 'رسوم التوصيل:' : 'Delivery Fee:'}</span>
                <span className="font-mono text-black font-black">+${invoice.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between text-amber-800 font-black">
                <span>{t('invDiscount')}:</span>
                <span className="font-mono">-${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-black pt-2 border-t-2 border-black">
              <span>{t('invNetTotal')}:</span>
              <span className="font-mono text-black">${invoice.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-neutral-600 font-bold pt-1">
              <span>{t('invPaidAmount')}:</span>
              <span className="font-mono font-black text-emerald-700">${invoice.paidAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Authentic Boutique Seal & Footer */}
          <div className="border-t pt-4 text-center space-y-1 border-neutral-200">
            <p className="text-xs font-black text-black">{t('invThankYou')}</p>
            <p className="text-[10px] text-neutral-600 font-semibold">
              {language === 'ar' 
                ? 'عطور نسمات الفاخرة مصنعة وفق أعلى المعايير الفرنسية والسويسرية بتركيز إكستري ثبات دائم.' 
                : 'Crafted with premium European oils at optimal EDP concentration for 24h performance.'}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
