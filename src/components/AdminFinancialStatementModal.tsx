import React, { useState, useMemo, useEffect } from 'react';
import type { Invoice, AppSettings } from '../types';
import { 
  Printer, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  ShieldCheck, 
  Lock, 
  X, 
  Check, 
  Package, 
  FileText,
  AlertCircle
} from './icons';
import { useLanguage } from '../context/LanguageContext';

export interface AdminFinancialStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  settings: AppSettings;
  isAdminAuthenticated?: boolean;
}

export const AdminFinancialStatementModal: React.FC<AdminFinancialStatementModalProps> = ({
  isOpen,
  onClose,
  invoices,
  settings,
  isAdminAuthenticated = true,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Statement Mode: 'daily' (كشف حساب يومي) or 'monthly' (كشف حساب شهري)
  const [statementType, setStatementType] = useState<'daily' | 'monthly'>('daily');

  // Today's date as YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Current month as YYYY-MM
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  // Selected date for daily statement (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Selected month for monthly statement (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Exchange rate to LBP (default 89,500)
  const exchangeRate = settings.lbpRate || 89500;

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Security check: Only manager/admin can view and print
  const isAuthorized = isAdminAuthenticated || (typeof window !== 'undefined' && sessionStorage.getItem('nasamat_admin_auth') === 'true');

  // Filtered invoices for Daily Statement
  const dailyInvoices = useMemo(() => {
    if (!selectedDate) return [];
    return invoices.filter((inv) => {
      const invDateStr = inv.date ? inv.date.slice(0, 10) : '';
      return invDateStr === selectedDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, selectedDate]);

  // Filtered invoices for Monthly Statement
  const monthlyInvoices = useMemo(() => {
    if (!selectedMonth) return [];
    return invoices.filter((inv) => {
      const invMonthStr = inv.date ? inv.date.slice(0, 7) : '';
      return invMonthStr === selectedMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, selectedMonth]);

  // Active invoices based on current tab
  const activeInvoices = statementType === 'daily' ? dailyInvoices : monthlyInvoices;

  // Aggregated Financial Metrics for the active period
  const metrics = useMemo(() => {
    let grossSales = 0;
    let totalPurchases = 0;
    let salesCount = 0;
    let purchasesCount = 0;
    let cashSales = 0;
    let whishOmtSales = 0;
    let cardSales = 0;
    let otherSales = 0;
    let totalDeliveryFees = 0;
    let totalDiscounts = 0;
    let totalCogs = 0;
    let netProfit = 0;
    let dueAmount = 0;
    let totalItemsBottles = 0;

    activeInvoices.forEach((inv) => {
      if (inv.type === 'sale') {
        salesCount += 1;
        grossSales += inv.totalAmount;
        totalDeliveryFees += (inv.deliveryFee || 0);
        totalDiscounts += (inv.discount || 0);
        dueAmount += (inv.dueAmount || 0);

        // COGS & Profit
        const cogs = inv.totalCogsCost || (inv.totalAmount * 0.28); // default estimated ~28% cost
        totalCogs += cogs;
        const profit = inv.netProfit !== undefined ? inv.netProfit : (inv.totalAmount - cogs);
        netProfit += profit;

        // Payment Method Breakdown
        if (inv.paymentMethod === 'cash') {
          cashSales += inv.totalAmount;
        } else if (inv.paymentMethod === 'whish_omt') {
          whishOmtSales += inv.totalAmount;
        } else if (inv.paymentMethod === 'bank_card') {
          cardSales += inv.totalAmount;
        } else {
          otherSales += inv.totalAmount;
        }

        // Bottles count
        inv.items.forEach((item) => {
          totalItemsBottles += (item.sizeOrQty || 1);
        });
      } else if (inv.type === 'purchase') {
        purchasesCount += 1;
        totalPurchases += inv.totalAmount;
      }
    });

    const netOperatingBalance = grossSales - totalPurchases;
    const grossMarginPercent = grossSales > 0 ? ((netProfit / grossSales) * 100) : 0;

    return {
      grossSales,
      grossSalesLbp: grossSales * exchangeRate,
      totalPurchases,
      totalPurchasesLbp: totalPurchases * exchangeRate,
      salesCount,
      purchasesCount,
      totalTransactions: salesCount + purchasesCount,
      cashSales,
      cashSalesLbp: cashSales * exchangeRate,
      whishOmtSales,
      cardSales,
      otherSales,
      totalDeliveryFees,
      totalDiscounts,
      totalCogs,
      netProfit,
      netProfitLbp: netProfit * exchangeRate,
      netOperatingBalance,
      netOperatingBalanceLbp: netOperatingBalance * exchangeRate,
      grossMarginPercent,
      dueAmount,
      totalItemsBottles,
    };
  }, [activeInvoices, exchangeRate]);

  // Monthly Daily Breakdown (For Monthly Statement)
  const monthlyDailyBreakdown = useMemo(() => {
    if (statementType !== 'monthly') return [];

    const map = new Map<string, { date: string; sales: number; purchases: number; count: number; profit: number }>();
    
    monthlyInvoices.forEach((inv) => {
      const d = inv.date ? inv.date.slice(0, 10) : '';
      if (!d) return;
      const current = map.get(d) || { date: d, sales: 0, purchases: 0, count: 0, profit: 0 };
      current.count += 1;
      if (inv.type === 'sale') {
        current.sales += inv.totalAmount;
        const cogs = inv.totalCogsCost || (inv.totalAmount * 0.28);
        current.profit += (inv.netProfit !== undefined ? inv.netProfit : (inv.totalAmount - cogs));
      } else {
        current.purchases += inv.totalAmount;
      }
      map.set(d, current);
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [statementType, monthlyInvoices]);

  // Top Selling Products of the Month
  const topSellingProducts = useMemo(() => {
    if (statementType !== 'monthly') return [];

    const map = new Map<string, { name: string; qty: number; revenue: number }>();

    monthlyInvoices.forEach((inv) => {
      if (inv.type !== 'sale') return;
      inv.items.forEach((it) => {
        const key = it.name.trim();
        const current = map.get(key) || { name: key, qty: 0, revenue: 0 };
        current.qty += (it.sizeOrQty || 1);
        current.revenue += it.totalPrice;
        map.set(key, current);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [statementType, monthlyInvoices]);

  if (!isOpen) return null;

  // Print invocation
  const handlePrint = () => {
    if (!isAuthorized) {
      alert(isAr ? 'عفواً، طباعة كشف الحساب مصرح بها فقط للمدير العام.' : 'Unauthorized: Only the General Manager can print this statement.');
      return;
    }
    window.print();
  };

  // Human date label
  const formattedPeriodLabel = statementType === 'daily'
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString(isAr ? 'ar-LB' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : (() => {
        const [y, m] = selectedMonth.split('-');
        const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        return d.toLocaleDateString(isAr ? 'ar-LB' : 'en-US', {
          year: 'numeric',
          month: 'long',
        });
      })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-neutral-300 rounded-3xl max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col text-black max-h-[95vh]">
        
        {/* ================= MODAL TOP CONTROL BAR (HIDDEN IN PRINT) ================= */}
        <div className="no-print p-4 sm:p-5 border-b border-neutral-800 bg-black text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-5 h-5 text-amber-400 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  {isAr ? 'كشف الحساب والتقرير المالي الرسمي' : 'Official Financial & Account Statement'}
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-300" />
                  <span>{isAr ? 'خاص بالمدير فقط' : 'Manager Only'}</span>
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {isAr 
                  ? 'كشف تفصيلي يومي وشهري للمبيعات، الإيرادات، النقدية، المصاريف، والأرباح' 
                  : 'Daily & monthly ledger of sales, receipts, expenses, and profits'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {isAuthorized ? (
              <button
                type="button"
                onClick={handlePrint}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4 text-black stroke-[2.5]" />
                <span>{isAr ? 'طباعة كشف الحساب (A4) 🖨️' : 'Print Statement (A4) 🖨️'}</span>
              </button>
            ) : (
              <div className="text-[11px] text-rose-300 bg-rose-950/80 border border-rose-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>{isAr ? 'الطباعة مقفلة (للمدير فقط)' : 'Locked: Manager Only'}</span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-2 rounded-xl transition hover:bg-neutral-800 cursor-pointer"
              title={isAr ? 'إغلاق (Esc)' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= CONTROLS & DATE SELECTORS (HIDDEN IN PRINT) ================= */}
        <div className="no-print p-4 bg-neutral-100 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Statement Type Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-neutral-300 shadow-2xs">
            <button
              type="button"
              onClick={() => setStatementType('daily')}
              className={`py-1.5 px-3.5 rounded-lg font-black transition cursor-pointer text-xs ${
                statementType === 'daily'
                  ? 'bg-black text-amber-400 shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              📅 {isAr ? 'كشف حساب يومي (اليوم / تاريخ محدد)' : 'Daily Statement'}
            </button>
            <button
              type="button"
              onClick={() => setStatementType('monthly')}
              className={`py-1.5 px-3.5 rounded-lg font-black transition cursor-pointer text-xs ${
                statementType === 'monthly'
                  ? 'bg-black text-amber-400 shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              📊 {isAr ? 'كشف حساب شهري (تقرير الدورة الكاملة)' : 'Monthly Statement'}
            </button>
          </div>

          {/* Date / Month Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            {statementType === 'daily' ? (
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-700">{isAr ? 'تاريخ الكشف:' : 'Date:'}</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="p-1.5 px-3 bg-white border border-neutral-300 rounded-xl font-bold font-mono text-xs focus:outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-2.5 py-1.5 rounded-lg border font-bold text-[11px] transition cursor-pointer ${
                    selectedDate === todayStr 
                      ? 'bg-neutral-900 text-white border-neutral-900' 
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                  }`}
                >
                  {isAr ? 'اليوم' : 'Today'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yest = new Date();
                    yest.setDate(yest.getDate() - 1);
                    const y = yest.getFullYear();
                    const m = String(yest.getMonth() + 1).padStart(2, '0');
                    const d = String(yest.getDate()).padStart(2, '0');
                    setSelectedDate(`${y}-${m}-${d}`);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white text-neutral-700 border border-neutral-300 hover:border-black font-bold text-[11px] transition cursor-pointer"
                >
                  {isAr ? 'أمس' : 'Yesterday'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-700">{isAr ? 'شهر الكشف:' : 'Month:'}</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="p-1.5 px-3 bg-white border border-neutral-300 rounded-xl font-bold font-mono text-xs focus:outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={() => setSelectedMonth(currentMonthStr)}
                  className={`px-2.5 py-1.5 rounded-lg border font-bold text-[11px] transition cursor-pointer ${
                    selectedMonth === currentMonthStr 
                      ? 'bg-neutral-900 text-white border-neutral-900' 
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                  }`}
                >
                  {isAr ? 'الشهر الحالي' : 'Current Month'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= PRINTABLE EXECUTIVE A4 STATEMENT SHEET ================= */}
        <div className="p-6 sm:p-8 md:p-10 overflow-y-auto space-y-6 print:p-0 print:overflow-visible text-black bg-white" id="printable-statement-area">
          
          {/* 1. Official Luxury Letterhead Header */}
          <div className="border-b-2 border-black pb-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs uppercase tracking-widest text-amber-800">
                    NASAMAT HAUTE PARFUMERIE • BEIRUT
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-amber-300 print:border print:border-black">
                    {isAr ? 'إدارة مالية عليا' : 'EXECUTIVE AUDIT'}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-black font-serif">
                  {settings.storeName || (isAr ? 'دار نَسَمَات لصياغة العطور الفاخرة' : 'Nasamat Haute Parfumerie')}
                </h1>
                <p className="text-xs text-neutral-600 font-medium">
                  {settings.storeLocation || 'بيروت — جبل لبنان'} • {isAr ? 'خدمة الإدارة والزبائن:' : 'Concierge:'} {settings.storePhone || '+961 81 713 408'}
                </p>
              </div>

              {/* Official Statement Badge */}
              <div className="text-end shrink-0 space-y-1">
                <div className="inline-block bg-neutral-100 border border-neutral-300 px-3 py-1.5 rounded-xl font-mono text-xs font-black text-black">
                  {statementType === 'daily' 
                    ? `STMT-DAY-${selectedDate.replace(/-/g, '')}` 
                    : `STMT-MTH-${selectedMonth.replace(/-/g, '')}`}
                </div>
                <div className="text-[11px] font-bold text-neutral-600">
                  {statementType === 'daily' ? (isAr ? 'كشف حساب يومي رسمي' : 'Official Daily Statement') : (isAr ? 'كشف حساب شهري رسمي' : 'Official Monthly Statement')}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {isAr ? 'سعر الصرف المعتمد:' : 'Rate:'} 1$ = {exchangeRate.toLocaleString()} L.L.
                </div>
              </div>
            </div>

            {/* Confidential Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px]">
              <div className="flex items-center gap-2 font-bold text-neutral-800">
                <Lock className="w-3.5 h-3.5 text-black" />
                <span>
                  {isAr 
                    ? `دورة الكشف المالي: ${formattedPeriodLabel}` 
                    : `Statement Period: ${formattedPeriodLabel}`}
                </span>
              </div>
              <div className="text-neutral-500 font-mono text-[10px]">
                {isAr ? '🔒 سري وخاص بالإدارة العامة والمدير المعتمد' : '🔒 Confidential - Executive Management Only'}
              </div>
            </div>
          </div>

          {/* 2. Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            
            {/* Total Sales */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-300 space-y-1">
              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block">
                {isAr ? 'إجمالي المبيعات' : 'Gross Sales'}
              </span>
              <div className="text-lg sm:text-xl font-black text-black font-mono">
                ${metrics.grossSales.toFixed(2)}
              </div>
              <div className="text-[10px] font-bold text-neutral-500 font-mono">
                {metrics.grossSalesLbp.toLocaleString()} L.L.
              </div>
              <span className="text-[10px] text-neutral-400 block pt-0.5">
                {metrics.salesCount} {isAr ? 'فاتورة بيع' : 'invoices'} • {metrics.totalItemsBottles} {isAr ? 'زجاجة' : 'bottles'}
              </span>
            </div>

            {/* Cash in Hand */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-1">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                {isAr ? 'نقدية الصندوق (الكاش)' : 'Cash In Hand'}
              </span>
              <div className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
                ${metrics.cashSales.toFixed(2)}
              </div>
              <div className="text-[10px] font-bold text-emerald-800 font-mono">
                {metrics.cashSalesLbp.toLocaleString()} L.L.
              </div>
              <span className="text-[10px] text-emerald-600 block pt-0.5">
                {isAr ? 'مقبوض نقداً بالكامل' : 'Paid in cash'}
              </span>
            </div>

            {/* Raw Material & Supplier Purchases */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-300 space-y-1">
              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block">
                {isAr ? 'المشتريات والمصروفات' : 'Purchases & COGS'}
              </span>
              <div className="text-lg sm:text-xl font-black text-rose-700 font-mono">
                ${metrics.totalPurchases.toFixed(2)}
              </div>
              <div className="text-[10px] font-bold text-neutral-500 font-mono">
                {metrics.totalPurchasesLbp.toLocaleString()} L.L.
              </div>
              <span className="text-[10px] text-neutral-400 block pt-0.5">
                {metrics.purchasesCount} {isAr ? 'عملية توريد / شراء' : 'purchase orders'}
              </span>
            </div>

            {/* Net Operating Profit */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-400 space-y-1">
              <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider block">
                {isAr ? 'صافي الأرباح المقدرة ★' : 'Net Profit ★'}
              </span>
              <div className="text-lg sm:text-xl font-black text-amber-800 font-mono">
                +${metrics.netProfit.toFixed(2)}
              </div>
              <div className="text-[10px] font-bold text-amber-900 font-mono">
                +{metrics.netProfitLbp.toLocaleString()} L.L.
              </div>
              <span className="text-[10px] text-amber-800 font-bold block pt-0.5">
                {metrics.grossMarginPercent.toFixed(1)}% {isAr ? 'هامش الربح' : 'profit margin'}
              </span>
            </div>

          </div>

          {/* 3. Payment Channels & Secondary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs">
            <div>
              <span className="text-neutral-500 text-[10px] font-bold block">{isAr ? 'ويش موني / OMT:' : 'Whish / OMT:'}</span>
              <span className="font-mono font-bold text-black">${metrics.whishOmtSales.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] font-bold block">{isAr ? 'بطاقات مصرفية:' : 'Card Receipts:'}</span>
              <span className="font-mono font-bold text-black">${metrics.cardSales.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] font-bold block">{isAr ? 'رسوم التوصيل المحصلة:' : 'Delivery Fees:'}</span>
              <span className="font-mono font-bold text-emerald-700">${metrics.totalDeliveryFees.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] font-bold block">{isAr ? 'ذمم مدينة معلقة للزبائن:' : 'Uncollected Due:'}</span>
              <span className="font-mono font-bold text-rose-700">${metrics.dueAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* 4. Monthly Special: Daily Distribution Table (Monthly Only) */}
          {statementType === 'monthly' && monthlyDailyBreakdown.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
                <h4 className="font-black text-xs text-neutral-900 uppercase tracking-wider">
                  {isAr ? 'التوزيع المالي اليومي خلال الشهر (Daily Distribution)' : 'Daily Breakdown in Month'}
                </h4>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {monthlyDailyBreakdown.length} {isAr ? 'يوماً نشطاً' : 'active days'}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-neutral-200">
                <table className="w-full text-xs text-start">
                  <thead className="bg-neutral-100 text-[10px] font-black uppercase text-neutral-700 border-b border-neutral-200">
                    <tr>
                      <th className="p-2 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className="p-2 text-center">{isAr ? 'عدد العمليات' : 'Orders'}</th>
                      <th className="p-2 text-end">{isAr ? 'مبيعات اليوم ($)' : 'Sales ($)'}</th>
                      <th className="p-2 text-end">{isAr ? 'مشتريات اليوم ($)' : 'Purchases ($)'}</th>
                      <th className="p-2 text-end">{isAr ? 'صافي الربح ($)' : 'Profit ($)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-mono text-[11px]">
                    {monthlyDailyBreakdown.map((row) => (
                      <tr key={row.date} className="hover:bg-neutral-50">
                        <td className="p-2 font-bold text-black">{row.date}</td>
                        <td className="p-2 text-center text-neutral-600">{row.count}</td>
                        <td className="p-2 text-end font-bold text-emerald-800">${row.sales.toFixed(2)}</td>
                        <td className="p-2 text-end text-rose-700">${row.purchases.toFixed(2)}</td>
                        <td className="p-2 text-end font-black text-amber-800">+${row.profit.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Monthly Special: Top 5 Best Sellers (Monthly Only) */}
          {statementType === 'monthly' && topSellingProducts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
                <h4 className="font-black text-xs text-neutral-900 uppercase tracking-wider">
                  {isAr ? 'أكثر العطور والمنتجات مبيعاً خلال الدورة الشهرية' : 'Top Performing Fragrances'}
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {topSellingProducts.map((p, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5 truncate">
                      <span className="font-bold text-black text-[11px] block truncate">{p.name}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">{p.qty} {isAr ? 'زجاجة مباعة' : 'bottles'}</span>
                    </div>
                    <span className="font-mono font-black text-emerald-700 text-xs shrink-0">${p.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Itemized Transactions Ledger Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
              <h4 className="font-black text-xs text-neutral-900 uppercase tracking-wider">
                {statementType === 'daily' 
                  ? (isAr ? 'سجل حركات وفواتير اليوم التفصيلي' : 'Itemized Daily Invoices Ledger') 
                  : (isAr ? 'سجل فواتير وحركات الدورة الشهرية' : 'Monthly Transactions Ledger')}
              </h4>
              <span className="text-[10px] text-neutral-500 font-mono">
                {activeInvoices.length} {isAr ? 'حركة مسجلة' : 'records'}
              </span>
            </div>

            {activeInvoices.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-neutral-300">
                <table className="w-full text-xs text-start">
                  <thead className="bg-neutral-100 text-[10px] font-black uppercase text-neutral-800 border-b border-neutral-300">
                    <tr>
                      <th className="p-2.5 text-start">{isAr ? 'رقم الفاتورة / الوقت' : 'Invoice / Time'}</th>
                      <th className="p-2.5 text-start">{isAr ? 'العميل / المورد' : 'Party / Customer'}</th>
                      <th className="p-2.5 text-start">{isAr ? 'النوع والتفاصيل' : 'Type & Items'}</th>
                      <th className="p-2.5 text-center">{isAr ? 'الدفع' : 'Payment'}</th>
                      <th className="p-2.5 text-end">{isAr ? 'المبلغ ($)' : 'Amount ($)'}</th>
                      <th className="p-2.5 text-end">{isAr ? 'المبلغ (ل.ل)' : 'Amount (L.L.)'}</th>
                      <th className="p-2.5 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-[11px]">
                    {activeInvoices.map((inv) => {
                      const isSale = inv.type === 'sale';
                      const timeStr = inv.date ? new Date(inv.date).toLocaleTimeString(isAr ? 'ar-LB' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                      const itemsPreview = inv.items.map((i) => `${i.name} (×${i.sizeOrQty})`).join('، ') || '—';

                      return (
                        <tr key={inv.id} className="hover:bg-neutral-50/80">
                          <td className="p-2.5 font-mono">
                            <span className="font-bold text-black block">{inv.invoiceNumber}</span>
                            <span className="text-[10px] text-neutral-400 block">{timeStr}</span>
                          </td>
                          <td className="p-2.5 font-bold text-neutral-900">
                            <span>{inv.partyName || (isSale ? 'زبون عام' : 'مورد')}</span>
                            {inv.partyPhone && (
                              <span className="block text-[10px] text-neutral-500 font-mono">{inv.partyPhone}</span>
                            )}
                          </td>
                          <td className="p-2.5 max-w-[200px]">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                isSale ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {isSale ? (isAr ? 'بيع' : 'Sale') : (isAr ? 'شراء' : 'Purchase')}
                              </span>
                              {inv.saleKind && (
                                <span className="text-[9px] text-neutral-500 font-medium">
                                  {inv.saleKind === 'wholesale' ? (isAr ? 'جملة' : 'Wholesale') : (isAr ? 'مفرق' : 'Retail')}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-600 truncate block" title={itemsPreview}>
                              {itemsPreview}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-bold text-neutral-700 text-[10px]">
                            {inv.paymentMethod === 'cash' ? (isAr ? 'كاش 💵' : 'Cash') :
                             inv.paymentMethod === 'whish_omt' ? 'Whish / OMT' :
                             inv.paymentMethod === 'bank_card' ? 'Card 💳' : 'Other'}
                          </td>
                          <td className="p-2.5 text-end font-mono font-bold text-black">
                            ${inv.totalAmount.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-end font-mono text-[10px] text-neutral-600 font-medium">
                            {(inv.totalAmount * exchangeRate).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                              inv.status === 'paid' 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {inv.status === 'paid' ? (isAr ? 'مدفوع' : 'Paid') : (isAr ? 'آجل' : 'Due')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Total Line */}
                  <tfoot className="bg-neutral-100 font-bold border-t-2 border-black text-xs font-mono">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-start font-black text-black">
                        {isAr ? 'الإجمالي العام للفترة المحددة:' : 'PERIOD TOTAL:'}
                      </td>
                      <td className="p-2.5 text-end font-black text-black text-sm">
                        ${metrics.grossSales.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-end text-[11px] font-black text-neutral-700">
                        {metrics.grossSalesLbp.toLocaleString()} L.L.
                      </td>
                      <td className="p-2.5 text-center text-[10px] font-sans text-neutral-600">
                        {metrics.totalTransactions} {isAr ? 'حركة' : 'ops'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
                {isAr 
                  ? `لا توجد أي فواتير أو حركات مسجلة لتاريخ: ${formattedPeriodLabel}` 
                  : `No transactions recorded for: ${formattedPeriodLabel}`}
              </div>
            )}
          </div>

          {/* 7. Official Executive Sign-off Block (Crucial for Printed A4) */}
          <div className="pt-6 border-t-2 border-black space-y-4 print:pt-4">
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              
              {/* Auditor */}
              <div className="space-y-8">
                <span className="font-bold text-neutral-700 block text-[11px]">
                  {isAr ? 'المحاسب المالي المسؤول' : 'Financial Accountant'}
                </span>
                <div className="border-b border-dotted border-neutral-400 pb-1 text-neutral-400 text-[10px]">
                  {isAr ? 'التوقيع: ____________________' : 'Signature: ____________________'}
                </div>
              </div>

              {/* General Manager Approval */}
              <div className="space-y-8">
                <span className="font-black text-black block text-[11px]">
                  {isAr ? 'توقيع واعتماد المدير العام ★' : 'General Manager Approval ★'}
                </span>
                <div className="border-b-2 border-black pb-1 text-black font-bold text-[10px]">
                  {isAr ? 'معتمد ومطابق للقيود الرسمية' : 'Approved & Verified'}
                </div>
              </div>

              {/* Boutique Official Seal */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <span className="font-bold text-neutral-700 block text-[11px]">
                  {isAr ? 'ختم دار نَسَمَات الرسمي' : 'Official Boutique Seal'}
                </span>
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-600/60 flex items-center justify-center text-[9px] font-bold text-amber-800 uppercase p-1 text-center font-serif">
                  {isAr ? 'نَسَمَات\nبيروت' : 'NASAMAT\nSEAL'}
                </div>
              </div>

            </div>

            {/* Document Digital Metadata Footer */}
            <div className="flex items-center justify-between text-[9px] text-neutral-500 pt-3 border-t border-neutral-200 font-mono">
              <div>
                <span>{isAr ? 'نظام نسمات لإدارة وتشغيل مختبر العطور والمخزون v3.0' : 'Nasamat Haute Parfumerie ERP v3.0'}</span>
              </div>
              <div>
                <span>{isAr ? 'تاريخ ووقت الطباعة والتحقق: ' : 'Generated on: '}</span>
                <span>{new Date().toLocaleString(isAr ? 'ar-LB' : 'en-US')}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
