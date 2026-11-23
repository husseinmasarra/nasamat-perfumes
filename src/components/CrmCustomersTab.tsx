import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  ShoppingBag, 
  WhatsApp, 
  GoogleIcon, 
  AppleIcon, 
  GoogleSheetsIcon, 
  Sparkles, 
  Activity, 
  FlaskConical, 
  Check, 
  Copy, 
  ExternalLink,
  Target,
  Zap,
  Bell,
  X,
  Phone,
  Mail,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from './icons';
import type { 
  Invoice, 
  AppSettings, 
  CrmLeadRecord, 
  CrmLeadSource, 
  CrmLeadStatus, 
  CrmGenderCategory, 
  CustomerCustomBlend 
} from '../types';
import { 
  loadCrmLeads, 
  saveCrmLeads, 
  loadCustomerBlends, 
  loadCustomerUser,
  loadCRMNotes,
  saveCRMNotes,
  logCRMActivity,
  loadCrmDeletedLeadKeys,
  addCrmDeletedLeadKey
} from '../utils/storage';
import { 
  exportCrmToGoogleSheetsCsv, 
  copyCrmForGoogleSheets, 
  syncCustomersToGoogleSheetWebhook,
  CRMCustomerExportItem 
} from '../utils/googleSheets';
import { 
  exportMetaCustomAudienceCsv, 
  sendMetaCapiEvent, 
  normalizePhoneForMeta 
} from '../utils/metaAdsExport';

interface CrmCustomersTabProps {
  invoices: Invoice[];
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onSelectTab?: (tab: string) => void;
}

export const CrmCustomersTab: React.FC<CrmCustomersTabProps> = ({
  invoices,
  settings,
  onUpdateSettings,
  onSelectTab
}) => {
  const language = settings.language || 'ar';
  const isAr = language === 'ar';

  // State
  const [leads, setLeads] = useState<CrmLeadRecord[]>(loadCrmLeads);
  const [customerBlendsList, setCustomerBlendsList] = useState<CustomerCustomBlend[]>(loadCustomerBlends);
  const [activeSubTab, setActiveSubTab] = useState<'leads' | 'meta-ads' | 'googlesheet' | 'blends' | 'overview'>('leads');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | CrmLeadSource>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | CrmGenderCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CrmLeadStatus>('all');

  // Selection
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Modals
  const [profileModalLead, setProfileModalLead] = useState<CrmLeadRecord | null>(null);
  const [editModalLead, setEditModalLead] = useState<Partial<CrmLeadRecord> | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [followUpModalLead, setFollowUpModalLead] = useState<CrmLeadRecord | null>(null);
  const [followUpDateInput, setFollowUpDateInput] = useState('');
  const [followUpNoteInput, setFollowUpNoteInput] = useState('');

  // Meta CAPI Test State
  const [isSendingCapi, setIsSendingCapi] = useState(false);
  const [capiTestFeedback, setCapiTestFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Google Sheets state
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetSyncFeedback, setSheetSyncFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [copiedForSheet, setCopiedForSheet] = useState(false);

  // Permanently deleted lead keys
  const [deletedKeys, setDeletedKeys] = useState<string[]>(loadCrmDeletedLeadKeys);

  // Sync with localStorage on external update
  useEffect(() => {
    const handleLeadsUpdate = () => {
      setLeads(loadCrmLeads());
    };
    window.addEventListener('nasamat_crm_leads_updated', handleLeadsUpdate);
    return () => window.removeEventListener('nasamat_crm_leads_updated', handleLeadsUpdate);
  }, []);

  // Merge leads with live invoices and custom blends
  const mergedLeads = useMemo(() => {
    const map = new Map<string, CrmLeadRecord>();

    // 1. Existing stored leads (excluding any deleted or suppliers)
    leads.forEach((l) => {
      const key = l.name.trim().toLowerCase();
      if (
        key.includes('لوزي') || 
        key.includes('luzi') || 
        key.includes('قوارير') || 
        key.includes('الشرق') || 
        key.includes('مورد') || 
        deletedKeys.includes(key) || 
        deletedKeys.includes(l.id)
      ) {
        return;
      }
      map.set(key, { ...l });
    });

    // 2. Real Store Customers from Invoices (Sales Only, excluding suppliers & deleted)
    invoices.forEach((inv) => {
      // ONLY sales invoices - exclude purchase invoices from raw material or bottle suppliers
      if (inv.type !== 'sale') return;

      const name = (inv.partyName || '').trim();
      if (!name || name === 'زبون عام') return;
      const key = name.toLowerCase();

      // Blacklist supplier names & deleted leads
      if (
        key.includes('لوزي') || 
        key.includes('luzi') || 
        key.includes('قوارير') || 
        key.includes('الشرق') || 
        key.includes('مورد') || 
        deletedKeys.includes(key)
      ) {
        return;
      }

      const existing = map.get(key);
      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += inv.totalAmount;
        if (!existing.phone && inv.partyPhone) existing.phone = inv.partyPhone;
      } else {
        const leadNum = Math.floor(100 + Math.random() * 899);
        map.set(key, {
          id: `lead-inv-${Date.now()}-${leadNum}`,
          leadNumber: leadNum,
          name,
          phone: inv.partyPhone,
          genderCategory: 'UNISEX',
          source: 'WEBSITE',
          status: 'ORDER_PLACED',
          date: new Date(inv.date).toLocaleDateString('en-GB'),
          time: new Date(inv.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          segment: inv.totalAmount >= 100 ? 'vip' : 'regular',
          ordersCount: 1,
          totalSpent: inv.totalAmount,
          customBlendsCount: 0,
          city: 'Lebanon',
          notes: 'عميل مسجل عبر طلبية متجر'
        });
      }
    });

    // 3. Authed User
    const authed = loadCustomerUser();
    if (authed && authed.name) {
      const key = authed.name.trim().toLowerCase();
      if (!deletedKeys.includes(key) && !deletedKeys.includes(authed.id)) {
        const existing = map.get(key);
        if (existing) {
          existing.provider = authed.provider;
          existing.email = authed.email;
          existing.avatar = authed.avatar;
          if (authed.phone && !existing.phone) existing.phone = authed.phone;
          if (authed.savedCity && !existing.city) existing.city = authed.savedCity;
          if (authed.savedAddress && !existing.address) existing.address = authed.savedAddress;
        }
      }
    }

    // 4. Custom blends count
    customerBlendsList.forEach((b) => {
      if (!b.customerName) return;
      const key = b.customerName.trim().toLowerCase();
      if (deletedKeys.includes(key)) return;
      const existing = map.get(key);
      if (existing) {
        existing.customBlendsCount = (existing.customBlendsCount || 0) + 1;
        if (existing.segment === 'new') existing.segment = 'connoisseur';
      }
    });

    return Array.from(map.values());
  }, [leads, invoices, customerBlendsList, deletedKeys]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return mergedLeads.filter((lead) => {
      // Source filter
      if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false;
      // Gender filter
      if (genderFilter !== 'all' && lead.genderCategory !== genderFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      // Search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        lead.name.toLowerCase().includes(q) ||
        (lead.phone && lead.phone.includes(q)) ||
        (lead.email && lead.email.toLowerCase().includes(q)) ||
        (lead.adCampaign && lead.adCampaign.toLowerCase().includes(q)) ||
        (lead.notes && lead.notes.toLowerCase().includes(q)) ||
        (lead.city && lead.city.toLowerCase().includes(q))
      );
    });
  }, [mergedLeads, sourceFilter, genderFilter, statusFilter, searchQuery]);

  // Lead metrics
  const crmStats = useMemo(() => {
    const totalLeads = mergedLeads.length;
    const metaAdsLeads = mergedLeads.filter((l) => l.source === 'ADS' || l.source === 'CTWA').length;
    const ordersPlaced = mergedLeads.filter((l) => l.ordersCount > 0 || l.status === 'ORDER_PLACED' || l.status === 'VIP').length;
    const totalRevenue = mergedLeads.reduce((sum, l) => sum + (l.totalSpent || 0), 0);
    const activeFollowUps = mergedLeads.filter((l) => Boolean(l.followUpDate)).length;
    return {
      totalLeads,
      metaAdsLeads,
      ordersPlaced,
      totalRevenue,
      activeFollowUps,
      conversionRate: totalLeads ? Math.round((ordersPlaced / totalLeads) * 100) : 0
    };
  }, [mergedLeads]);

  // Handlers
  const handleUpdateLeadStatus = (leadId: string, newStatus: CrmLeadStatus) => {
    const updated = mergedLeads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l));
    setLeads(updated);
    saveCrmLeads(updated);
    logCRMActivity({
      customerName: mergedLeads.find((l) => l.id === leadId)?.name || 'زبون',
      type: 'login',
      description: `تغيير حالة العميل إلى ${newStatus}`
    });
  };

  const handleDeleteLead = (leadId: string, leadName: string) => {
    if (!window.confirm(isAr ? `هل أنت متأكد من حذف العميل "${leadName}" من نظام CRM نهائياً؟` : `Are you sure you want to delete "${leadName}" from CRM?`)) return;
    const normalizedKey = leadName.trim().toLowerCase();

    // 1. Add to permanent deleted list in storage
    addCrmDeletedLeadKey(normalizedKey);
    addCrmDeletedLeadKey(leadId);
    setDeletedKeys((prev) => [...prev, normalizedKey, leadId]);

    // 2. Filter from stored leads and persist
    const updated = leads.filter((l) => l.id !== leadId && l.name.trim().toLowerCase() !== normalizedKey);
    setLeads(updated);
    saveCrmLeads(updated);

    logCRMActivity({
      customerName: leadName,
      type: 'login',
      description: `حذف العميل "${leadName}" نهائياً من الـ CRM`
    });
  };

  const handleSaveLeadEdit = (leadData: Partial<CrmLeadRecord>) => {
    if (!leadData.name?.trim()) return;
    let updated: CrmLeadRecord[];
    const existingIndex = mergedLeads.findIndex((l) => l.id === leadData.id);
    if (existingIndex >= 0) {
      updated = [...mergedLeads];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...leadData
      } as CrmLeadRecord;
    } else {
      const newLead: CrmLeadRecord = {
        id: `lead-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
        leadNumber: Math.floor(200 + Math.random() * 799),
        name: leadData.name.trim(),
        phone: leadData.phone || '',
        email: leadData.email || '',
        genderCategory: leadData.genderCategory || 'WOMEN',
        source: leadData.source || 'ADS',
        adCampaign: leadData.adCampaign || 'Meta Ads Campaign',
        status: leadData.status || 'NEW',
        date: new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        segment: 'new',
        ordersCount: 0,
        totalSpent: 0,
        customBlendsCount: 0,
        city: leadData.city || 'Lebanon',
        notes: leadData.notes || ''
      };
      updated = [newLead, ...mergedLeads];
    }
    setLeads(updated);
    saveCrmLeads(updated);
    setEditModalLead(null);
    setIsNewLeadModalOpen(false);
  };

  const handleSaveFollowUp = () => {
    if (!followUpModalLead) return;
    const updated = mergedLeads.map((l) => {
      if (l.id === followUpModalLead.id) {
        return {
          ...l,
          followUpDate: followUpDateInput || undefined,
          followUpNotes: followUpNoteInput || undefined
        };
      }
      return l;
    });
    setLeads(updated);
    saveCrmLeads(updated);
    setFollowUpModalLead(null);
  };

  const handleOpenWhatsApp = (lead: CrmLeadRecord) => {
    const phone = normalizePhoneForMeta(lead.phone);
    if (!phone) {
      alert(isAr ? 'لا يوجد رقم هاتف مسجل لهذا العميل' : 'No phone number available for this lead');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const greeting = isAr
      ? `مرحباً ${lead.name} أهلاً بك في نسمات للعطور الفاخرة بيروت ✨`
      : `Hello ${lead.name}, welcome to Nasamat Haute Parfumerie Beirut ✨`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting)}`, '_blank');
  };

  const handleTriggerMetaCapi = async (lead: CrmLeadRecord) => {
    const pixelId = settings.trackingPixels?.metaPixelId || '';
    const token = settings.trackingPixels?.metaAccessToken || '';
    const testCode = settings.trackingPixels?.metaTestEventCode || '';

    setIsSendingCapi(true);
    setCapiTestFeedback(null);

    const res = await sendMetaCapiEvent(pixelId, token, 'Lead', lead, testCode);
    setIsSendingCapi(false);
    setCapiTestFeedback({
      success: res.success,
      msg: res.message
    });
    setTimeout(() => setCapiTestFeedback(null), 6000);
  };

  const handleExportMetaCustomAudience = () => {
    const listToExport = selectedLeadIds.length > 0
      ? mergedLeads.filter((l) => selectedLeadIds.includes(l.id))
      : mergedLeads;
    exportMetaCustomAudienceCsv(listToExport, `nasamat-meta-audience-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportGoogleSheetsCsv = () => {
    const items: CRMCustomerExportItem[] = mergedLeads.map((c) => ({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      segment: c.segment,
      ordersCount: c.ordersCount,
      totalSpent: c.totalSpent,
      aov: c.ordersCount ? Number((c.totalSpent / c.ordersCount).toFixed(2)) : 0,
      lastOrderDate: c.date,
      blendsCount: c.customBlendsCount,
      notes: c.notes || ''
    }));
    exportCrmToGoogleSheetsCsv(items, `nasamat-crm-leads-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleCopyTsv = async () => {
    const items: CRMCustomerExportItem[] = mergedLeads.map((c) => ({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      segment: c.segment,
      ordersCount: c.ordersCount,
      totalSpent: c.totalSpent,
      notes: c.notes || ''
    }));
    const success = await copyCrmForGoogleSheets(items);
    if (success) {
      setCopiedForSheet(true);
      setTimeout(() => setCopiedForSheet(false), 3000);
    }
  };

  const handleLiveGoogleSheetsSync = async () => {
    const webhook = settings.crmGoogleSheetWebhookUrl;
    if (!webhook) {
      setActiveSubTab('googlesheet');
      return;
    }
    setIsSyncingSheet(true);
    const items: CRMCustomerExportItem[] = mergedLeads.map((c) => ({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      segment: c.segment,
      ordersCount: c.ordersCount,
      totalSpent: c.totalSpent,
      notes: c.notes || ''
    }));
    const res = await syncCustomersToGoogleSheetWebhook(webhook, items);
    setIsSyncingSheet(false);
    setSheetSyncFeedback({
      success: res.success,
      msg: res.message
    });
    setTimeout(() => setSheetSyncFeedback(null), 6000);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleToggleLeadSelect = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((it) => it !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      
      {/* ================= 1. PAGE HEADER (StyLuxe CRM & Meta Ads Hub) ================= */}
      <div className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-3xl shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <Users className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black font-serif uppercase tracking-wider text-black">
                  {isAr ? 'نظام إدارة علاقات الزبائن (CRM) وحملات Meta Ads' : 'CRM & Meta Ads Leads Center'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase">
                  META ADS READY
                </span>
                {settings.trackingPixels?.metaPixelId && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Meta Pixel #{settings.trackingPixels.metaPixelId}
                  </span>
                )}
                {settings.crmGoogleSheetUrl && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                    <GoogleSheetsIcon className="w-3 h-3" />
                    Google Sheets Synced
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-medium mt-1 max-w-2xl">
                {isAr 
                  ? 'لوحة إدارة الزبائن المتكاملة: تتبع حملات إعلانات Meta Ads وواتساب CTWA، تصدير الجماهير المخصصة Custom Audiences، ومزامنة Google Sheets التفاعلية.'
                  : 'Customer relationship system: Meta Ads & CTWA lead tracking, Custom Audience export, CAPI integrations, and Google Sheets sync.'}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditModalLead({});
                setIsNewLeadModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>{isAr ? 'إضافة عميل جديد 👤' : 'New Lead 👤'}</span>
            </button>

            <button
              onClick={handleExportMetaCustomAudience}
              className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
              title={isAr ? 'تصدير جماهير مخصصة لمدير إعلانات فيسبوك Meta Ads Manager' : 'Export Meta Custom Audience CSV'}
            >
              <Target className="w-4 h-4 text-purple-700" />
              <span>{isAr ? 'تصدير Meta Ads (CSV)' : 'Meta Audience'}</span>
            </button>

            <button
              onClick={handleExportGoogleSheetsCsv}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
              title={isAr ? 'تصدير جدول الزبائن لـ Google Sheets' : 'Export Google Sheets CSV'}
            >
              <GoogleSheetsIcon className="w-4 h-4" />
              <span>{isAr ? 'تصدير Sheets (CSV)' : 'Sheets CSV'}</span>
            </button>

            <button
              onClick={handleLiveGoogleSheetsSync}
              disabled={isSyncingSheet}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <GoogleSheetsIcon className="w-4 h-4" />
              <span>{isSyncingSheet ? (isAr ? 'جاري المزامنة...' : 'Syncing...') : (isAr ? 'مزامنة Sheets 🔄' : 'Sync Sheets')}</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {capiTestFeedback && (
          <div className={`mt-4 p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            capiTestFeedback.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            <span>{capiTestFeedback.success ? '✅' : '⚠️'}</span>
            <span>{capiTestFeedback.msg}</span>
          </div>
        )}

        {sheetSyncFeedback && (
          <div className={`mt-4 p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            sheetSyncFeedback.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            <span>{sheetSyncFeedback.success ? '✅' : '⚠️'}</span>
            <span>{sheetSyncFeedback.msg}</span>
          </div>
        )}

        {/* ================= CRM QUICK STATS CARDS ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-neutral-200">
          <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-2xl">
            <span className="text-[10px] text-neutral-500 font-bold block">{isAr ? 'إجمالي العملاء والـ Leads' : 'Total Leads'}</span>
            <span className="text-lg font-black text-black font-mono">{crmStats.totalLeads}</span>
          </div>

          <div className="bg-purple-50/60 border border-purple-200 p-3 rounded-2xl">
            <span className="text-[10px] text-purple-700 font-bold block">{isAr ? 'عملاء إعلانات Meta Ads' : 'Meta Ads Leads'}</span>
            <span className="text-lg font-black text-purple-900 font-mono">{crmStats.metaAdsLeads}</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-2xl">
            <span className="text-[10px] text-emerald-700 font-bold block">{isAr ? 'طلبيات تم تأكيدها' : 'Orders Placed'}</span>
            <span className="text-lg font-black text-emerald-900 font-mono">{crmStats.ordersPlaced}</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-2xl">
            <span className="text-[10px] text-amber-700 font-bold block">{isAr ? 'نسبة التحويل (Conversion)' : 'Conversion Rate'}</span>
            <span className="text-lg font-black text-amber-950 font-mono">{crmStats.conversionRate}%</span>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-2xl">
            <span className="text-[10px] text-neutral-500 font-bold block">{isAr ? 'إجمالي المبيعات' : 'Total Spent'}</span>
            <span className="text-lg font-black text-black font-mono">${crmStats.totalRevenue.toFixed(2)}</span>
          </div>

          <div className="bg-sky-50/60 border border-sky-200 p-3 rounded-2xl">
            <span className="text-[10px] text-sky-700 font-bold block">{isAr ? 'مواعيد متابعة قادمة' : 'Active Follow-ups'}</span>
            <span className="text-lg font-black text-sky-900 font-mono">{crmStats.activeFollowUps}</span>
          </div>
        </div>

        {/* ================= SUB-NAVIGATION TABS ================= */}
        <div className="flex flex-wrap items-center gap-1.5 mt-6 pt-6 border-t border-neutral-200">
          <button
            onClick={() => setActiveSubTab('leads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'leads'
                ? 'bg-black text-white shadow-xs font-black'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isAr ? `دليل الزبائن وحملات Meta (${filteredLeads.length})` : `Leads Directory (${filteredLeads.length})`}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('meta-ads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'meta-ads'
                ? 'bg-purple-900 text-white shadow-xs font-black'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span>{isAr ? 'ربط Meta Ads & Pixel ⚡' : 'Meta Ads & CAPI ⚡'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('googlesheet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'googlesheet'
                ? 'bg-emerald-700 text-white shadow-xs font-black'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <GoogleSheetsIcon className="w-3.5 h-3.5" />
            <span>{isAr ? 'مزامنة Google Sheets 📊' : 'Google Sheets 📊'}</span>
            {settings.crmGoogleSheetUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveSubTab('blends')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'blends'
                ? 'bg-black text-white shadow-xs font-black'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? `سجل الخلطات (${customerBlendsList.length})` : `Customer Blends (${customerBlendsList.length})`}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-black text-white shadow-xs font-black'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'المؤشرات والتحليلات 📈' : 'CRM Insights 📈'}</span>
          </button>
        </div>
      </div>

      {/* ================= 2. VIEW A: LEADS DIRECTORY TABLE (Matching Screenshot) ================= */}
      {activeSubTab === 'leads' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-white border border-neutral-200 p-4 rounded-3xl shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-neutral-400 absolute start-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث بالاسم، الهاتف، الحملة، الملاحظات...' : 'Search name, phone, campaign, notes...'}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl ps-9 pe-4 py-2 text-xs font-medium focus:border-black focus:outline-none"
                />
              </div>

              {/* Source Filters */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                {[
                  { id: 'all', label: isAr ? 'جميع المصادر' : 'All Sources' },
                  { id: 'ADS', label: '📢 ADS' },
                  { id: 'CTWA', label: '💬 CTWA' },
                  { id: 'WA', label: '🟢 WA' },
                  { id: 'WEBSITE', label: '🌐 Website' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSourceFilter(s.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      sourceFilter === s.id
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Gender Filters */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: isAr ? 'الكل' : 'All' },
                  { id: 'WOMEN', label: 'WOMEN 🌸' },
                  { id: 'MEN', label: 'MEN 💼' },
                  { id: 'UNISEX', label: 'UNISEX 👑' }
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGenderFilter(g.id as any)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                      genderFilter === g.id
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-neutral-400 font-bold me-1">{isAr ? 'الحالة:' : 'Status:'}</span>
                {[
                  { id: 'all', label: isAr ? 'الكل' : 'All' },
                  { id: 'NEW', label: '• NEW' },
                  { id: 'CONTACTED', label: '• CONTACTED' },
                  { id: 'INTERESTED', label: '• INTERESTED' },
                  { id: 'ORDER_PLACED', label: '• ORDER PLACED' },
                  { id: 'VIP', label: '👑 VIP' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      statusFilter === st.id
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Selection Summary */}
              {selectedLeadIds.length > 0 && (
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1 rounded-xl text-purple-900 font-bold text-xs">
                  <span>{isAr ? `تم تحديد (${selectedLeadIds.length}) عميل` : `Selected (${selectedLeadIds.length})`}</span>
                  <button
                    onClick={handleExportMetaCustomAudience}
                    className="underline hover:text-purple-700 cursor-pointer"
                  >
                    {isAr ? 'تصدير لـ Meta Ads' : 'Export to Meta'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= LEADS TABLE (EXACT VISUAL REPLICA OF USER SCREENSHOT) ================= */}
          <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-neutral-100/90 font-bold text-neutral-700 uppercase border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.length > 0 && selectedLeadIds.length === filteredLeads.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 text-start">{isAr ? 'الزبون والحساب' : 'Customer & Profile'}</th>
                    <th className="py-3 px-3 text-start">{isAr ? 'التاريخ ورقم الطلب' : 'Date & ID'}</th>
                    <th className="py-3 px-3 text-start">{isAr ? 'الحالة ومصدر الإعلان' : 'Status & Source'}</th>
                    <th className="py-3 px-3 text-start">{isAr ? 'المتابعة' : 'Follow-up'}</th>
                    <th className="py-3 px-3 text-start">{isAr ? 'القيمة والمرحلة' : 'Value & Stage'}</th>
                    <th className="py-3 px-4 text-center">{isAr ? 'الإجراءات السريعة' : 'Quick Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-500">
                        <Users className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                        <span className="font-bold">{isAr ? 'لا يوجد زبائن أو Leads مطابقين لمعايير البحث' : 'No matching leads found'}</span>
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const isSelected = selectedLeadIds.includes(lead.id);
                      return (
                        <tr 
                          key={lead.id} 
                          className={`hover:bg-neutral-50/80 transition ${isSelected ? 'bg-purple-50/30' : ''}`}
                        >
                          {/* 1. Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleLeadSelect(lead.id)}
                              className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                            />
                          </td>

                          {/* 2. Customer Name, 360 Badge, Gender, Phone */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-black tracking-wide uppercase text-xs">
                                  {lead.name}
                                </span>
                                
                                {/* 360 Profile Button */}
                                <button
                                  type="button"
                                  onClick={() => setProfileModalLead(lead)}
                                  className="text-[10px] text-neutral-400 hover:text-black font-semibold cursor-pointer underline decoration-dotted"
                                  title={isAr ? 'عرض بروفايل العميل الشامل 360°' : 'View 360° Profile'}
                                >
                                  360°
                                </button>

                                {/* Gender Tag */}
                                {lead.genderCategory === 'WOMEN' && (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-black uppercase">
                                    WOMEN
                                  </span>
                                )}
                                {lead.genderCategory === 'MEN' && (
                                  <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-200 text-[9px] font-black uppercase">
                                    MEN
                                  </span>
                                )}
                                {lead.genderCategory === 'UNISEX' && (
                                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 text-[9px] font-black uppercase">
                                    UNISEX
                                  </span>
                                )}

                                {/* Auth Provider Icons */}
                                {lead.provider === 'google' && <GoogleIcon className="w-3 h-3 ms-1" />}
                                {lead.provider === 'apple' && <AppleIcon className="w-3 h-3 text-black ms-1" />}
                              </div>

                              {/* Phone */}
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-neutral-600 dir-ltr">
                                  {lead.phone || (isAr ? 'بدون هاتف' : 'No phone')}
                                </span>
                                {lead.phone && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(lead.phone || '');
                                    }}
                                    className="text-neutral-400 hover:text-black transition"
                                    title={isAr ? 'نسخ رقم الهاتف' : 'Copy phone'}
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 3. Date & ID */}
                          <td className="py-3 px-3">
                            <div className="space-y-0.5 text-[11px]">
                              <div className="flex items-center gap-1 text-neutral-700 font-mono">
                                <Calendar className="w-3 h-3 text-neutral-400" />
                                <span>{lead.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-neutral-400 font-mono text-[10px]">
                                <Clock className="w-3 h-3" />
                                <span>{lead.time || '12:00'}</span>
                                <span className="text-neutral-500 font-bold">#{lead.leadNumber || lead.id.slice(-4)}</span>
                              </div>
                            </div>
                          </td>

                          {/* 4. Status Dropdown & Source Pills */}
                          <td className="py-3 px-3">
                            <div className="space-y-1.5">
                              {/* Status Dropdown */}
                              <select
                                value={lead.status}
                                onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as CrmLeadStatus)}
                                className={`text-[11px] font-bold py-0.5 px-2 rounded-lg border focus:outline-none cursor-pointer transition ${
                                  lead.status === 'NEW' ? 'bg-sky-50 border-sky-300 text-sky-800' :
                                  lead.status === 'CONTACTED' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                                  lead.status === 'INTERESTED' ? 'bg-purple-50 border-purple-300 text-purple-800' :
                                  lead.status === 'ORDER_PLACED' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                                  lead.status === 'VIP' ? 'bg-amber-100 border-amber-400 text-amber-950 font-black' :
                                  'bg-neutral-100 border-neutral-300 text-neutral-700'
                                }`}
                              >
                                <option value="NEW">• NEW</option>
                                <option value="CONTACTED">• CONTACTED</option>
                                <option value="INTERESTED">• INTERESTED</option>
                                <option value="ORDER_PLACED">• ORDER PLACED</option>
                                <option value="VIP">👑 VIP CLIENT</option>
                                <option value="ARCHIVED">• ARCHIVED</option>
                              </select>

                              {/* Source Badges */}
                              <div className="flex flex-wrap items-center gap-1">
                                {lead.source === 'ADS' && (
                                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-black uppercase">
                                    ADS
                                  </span>
                                )}
                                {lead.source === 'CTWA' && (
                                  <>
                                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-black uppercase">
                                      ADS
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-[9px] font-black uppercase">
                                      CTWA
                                    </span>
                                  </>
                                )}
                                {lead.source === 'WA' && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase flex items-center gap-1">
                                    <WhatsApp className="w-2.5 h-2.5" /> WA
                                  </span>
                                )}
                                {lead.source === 'WEBSITE' && (
                                  <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[9px] font-black uppercase">
                                    STORE
                                  </span>
                                )}
                                {lead.source === 'INSTAGRAM' && (
                                  <span className="px-2 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 text-[9px] font-black uppercase">
                                    IG
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 5. Follow-up Button */}
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                setFollowUpModalLead(lead);
                                setFollowUpDateInput(lead.followUpDate || '');
                                setFollowUpNoteInput(lead.followUpNotes || '');
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 cursor-pointer transition ${
                                lead.followUpDate
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-mono'
                                  : 'bg-white hover:bg-neutral-50 border-neutral-300 border-dashed text-neutral-500'
                              }`}
                            >
                              <Bell className="w-3 h-3 text-amber-600" />
                              <span>{lead.followUpDate ? lead.followUpDate : '+ Follow-up'}</span>
                            </button>
                          </td>

                          {/* 6. Value / Stage */}
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <span className="font-mono font-black text-neutral-900 block text-xs">
                                ${lead.totalSpent.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-bold block">
                                {lead.ordersCount > 0 ? (
                                  <span className="text-emerald-700">{lead.ordersCount} ord</span>
                                ) : (
                                  'NEW CLIENT 0 ord'
                                )}
                              </span>
                            </div>
                          </td>

                          {/* 7. Action Buttons (Matching Screenshot) */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* WhatsApp Button (Green) */}
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsApp(lead)}
                                className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                                title={isAr ? 'مراسلة عبر واتساب' : 'Chat on WhatsApp'}
                              >
                                <WhatsApp className="w-3.5 h-3.5 text-white" />
                              </button>

                              {/* Lightning (Meta CAPI Conversion Trigger) */}
                              <button
                                type="button"
                                onClick={() => handleTriggerMetaCapi(lead)}
                                disabled={isSendingCapi}
                                className="w-7 h-7 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                                title={isAr ? 'إرسال حدث تحويل Lead إلى Meta Conversions API' : 'Send Conversion to Meta CAPI'}
                              >
                                <Zap className="w-3.5 h-3.5 text-white" />
                              </button>

                              {/* Create / View Order (Blue) */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectTab) onSelectTab('invoices');
                                }}
                                className="w-7 h-7 rounded-lg bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                                title={isAr ? 'إنشاء فاتورة / طلبية في سجل المبيعات' : 'Create Order in POS/Invoices'}
                              >
                                <ShoppingBag className="w-3.5 h-3.5 text-white" />
                              </button>

                              {/* Edit Lead (Dark Navy/Slate) */}
                              <button
                                type="button"
                                onClick={() => setEditModalLead(lead)}
                                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-800 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                                title={isAr ? 'تعديل بيانات العميل' : 'Edit Lead Details'}
                              >
                                <Edit3 className="w-3.5 h-3.5 text-white" />
                              </button>

                              {/* Delete Lead (Red) */}
                              <button
                                type="button"
                                onClick={() => handleDeleteLead(lead.id, lead.name)}
                                className="w-7 h-7 rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                                title={isAr ? 'حذف العميل' : 'Delete Lead'}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-white" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. VIEW B: META ADS & CAPI CONFIGURATION ================= */}
      {activeSubTab === 'meta-ads' && (
        <div className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-3xl shadow-xs space-y-8 animate-fadeIn">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 border border-purple-300 flex items-center justify-center font-bold">
                <Target className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h3 className="text-lg font-black font-serif uppercase tracking-wider text-black">
                  {isAr ? 'إعدادات وربط Meta Ads & Conversions API (CAPI)' : 'Meta Ads & Conversions API Setup'}
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  {isAr 
                    ? 'اربط حساب إعلانات فيسبوك وإنستغرام لتتبع زبائن CTWA، إرسال أحداث التحويل من السيرفر، وتوليد الجماهير المخصصة.'
                    : 'Connect Meta Pixel & Conversions API for direct Click-to-WhatsApp attribution and Custom Audience matching.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Form Box 1: Pixel & Access Token */}
            <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black uppercase text-black flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>{isAr ? 'بيانات الاعتماد (Meta Credentials)' : 'Meta Credentials'}</span>
              </h4>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Meta Pixel ID (Facebook Pixel)
                </label>
                <input
                  type="text"
                  value={settings.trackingPixels?.metaPixelId || ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    onUpdateSettings({
                      ...settings,
                      trackingPixels: {
                        ...settings.trackingPixels,
                        metaPixelId: val,
                        isMetaPixelEnabled: Boolean(val)
                      }
                    });
                  }}
                  placeholder="e.g. 123456789012345"
                  className="w-full bg-white border border-neutral-200 focus:border-purple-600 rounded-xl px-3.5 py-2 text-xs font-mono font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Conversions API (CAPI) System User Access Token
                </label>
                <textarea
                  rows={3}
                  value={settings.trackingPixels?.metaAccessToken || ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    onUpdateSettings({
                      ...settings,
                      trackingPixels: {
                        ...settings.trackingPixels,
                        metaAccessToken: val,
                        isMetaCapiEnabled: Boolean(val)
                      }
                    });
                  }}
                  placeholder="EAAB..."
                  className="w-full bg-white border border-neutral-200 focus:border-purple-600 rounded-xl px-3.5 py-2 text-[11px] font-mono font-medium focus:outline-none"
                />
                <span className="text-[10px] text-neutral-400 block mt-1">
                  {isAr 
                    ? 'يتم توليده من Meta Events Manager -> Settings -> Conversions API -> Generate Access Token'
                    : 'Generate in Meta Events Manager -> Settings -> Generate Access Token'}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Test Event Code (اختياري للاختبار)
                </label>
                <input
                  type="text"
                  value={settings.trackingPixels?.metaTestEventCode || ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    onUpdateSettings({
                      ...settings,
                      trackingPixels: {
                        ...settings.trackingPixels,
                        metaTestEventCode: val
                      }
                    });
                  }}
                  placeholder="e.g. TEST12345"
                  className="w-full bg-white border border-neutral-200 focus:border-purple-600 rounded-xl px-3.5 py-2 text-xs font-mono font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Form Box 2: Meta Custom Audience & Webhook */}
            <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black uppercase text-black flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-700" />
                <span>{isAr ? 'تصدير الجماهير المخصصة والـ Webhook' : 'Custom Audiences & Webhook'}</span>
              </h4>

              <div className="p-4 bg-white border border-purple-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-purple-950 block">
                  {isAr ? 'تصدير ملف الجماهير المخصصة (Custom Audience CSV)' : 'Export Meta Custom Audience File'}
                </span>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  {isAr
                    ? 'يقوم هذا الخيار بتصدير كافة العملاء بتنسيق رسمي متوافق 100% مع Meta Ads Manager، مشفراً ومرتباً بأرقام الهواتف والإنفاق، لاستهدافهم في حملات إعادة الاستهداف (Retargeting) أو بناء جمهور مشابه (Lookalike Audience 1%).'
                    : 'Exports cleaned, E.164-normalized customer list ready for Meta Ads Manager custom audience retargeting and Lookalike generation.'}
                </p>
                <button
                  type="button"
                  onClick={handleExportMetaCustomAudience}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Target className="w-4 h-4 text-purple-300" />
                  <span>{isAr ? 'تحميل ملف Meta Custom Audience الآن' : 'Download Meta Audience CSV'}</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  رابط استقبال الـ Webhook (Meta Lead Ads / Zapier / Make)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/api/meta-leads-webhook`}
                    className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/meta-leads-webhook`);
                      alert(isAr ? 'تم نسخ رابط الـ Webhook!' : 'Copied Webhook URL!');
                    }}
                    className="px-3 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-black font-bold text-xs cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= 4. VIEW C: GOOGLE SHEETS LIVE SYNC ================= */}
      {activeSubTab === 'googlesheet' && (
        <div className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-3xl shadow-xs space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center font-bold">
                <GoogleSheetsIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black font-serif uppercase tracking-wider text-black">
                  {isAr ? 'مزامنة Google Sheets التفاعلية' : 'Live Google Sheets Sync'}
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  {isAr ? 'ربط جدول البيانات تلقائياً، نسخ الحقول للصق المباشر (Ctrl+V)، وتصدير CSV مرمز بـ UTF-8 BOM' : 'Live spreadsheet integration, TSV clipboard copying, and auto-webhook sync.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyTsv}
                className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{copiedForSheet ? '✅' : '📋'}</span>
                <span>{copiedForSheet ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ لـ Sheet بـ Ctrl+V' : 'Copy for Sheet')}</span>
              </button>

              <button
                type="button"
                onClick={handleExportGoogleSheetsCsv}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <GoogleSheetsIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحميل CSV' : 'Download CSV'}</span>
              </button>
            </div>
          </div>

          {/* Webhook & Sheet URL Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                {isAr ? 'رابط جدول Google Sheet (للمعاينة والتضمين)' : 'Google Sheet URL'}
              </label>
              <input
                type="url"
                value={settings.crmGoogleSheetUrl || ''}
                onChange={(e) => {
                  onUpdateSettings({
                    ...settings,
                    crmGoogleSheetUrl: e.target.value.trim()
                  });
                }}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-600 rounded-xl px-3.5 py-2 text-xs font-mono font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                {isAr ? 'رابط Google Apps Script Webhook (للمزامنة الفورية)' : 'Google Apps Script Webhook'}
              </label>
              <input
                type="url"
                value={settings.crmGoogleSheetWebhookUrl || ''}
                onChange={(e) => {
                  onUpdateSettings({
                    ...settings,
                    crmGoogleSheetWebhookUrl: e.target.value.trim()
                  });
                }}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-600 rounded-xl px-3.5 py-2 text-xs font-mono font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Live Sheet View */}
          {settings.crmGoogleSheetUrl && (
            <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-xs mt-4">
              <iframe
                src={settings.crmGoogleSheetUrl.replace('/edit', '/preview')}
                title="Google Sheet CRM"
                className="w-full h-[500px] border-0"
              />
            </div>
          )}
        </div>
      )}

      {/* ================= 5. VIEW D: BESPOKE CUSTOMER BLENDS ================= */}
      {activeSubTab === 'blends' && (
        <div className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-3xl shadow-xs space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg font-black font-serif uppercase tracking-wider text-black">
              {isAr ? 'سجل الخلطات الملكية المصممة للزبائن' : 'Bespoke Customer Formulas'}
            </h3>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              {isAr ? 'المقادير الدقيقة للخلطات بالملل مع أسماء الزيوت ونسب التركيز' : 'Exact oil ml formulations custom-made for clients.'}
            </p>
          </div>

          {customerBlendsList.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <FlaskConical className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
              <span>{isAr ? 'لم يقم أي زبون بصياغة خلطة خاصة بعد' : 'No bespoke blends recorded yet'}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customerBlendsList.map((blend) => (
                <div key={blend.id} className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black text-sm">{blend.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black font-mono">
                      {blend.sizeMl}ml
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-600">
                    <span>{isAr ? 'الزبون:' : 'Client:'} </span>
                    <span className="font-bold text-neutral-900">{blend.customerName || (isAr ? 'زبون غير محدد' : 'Guest')}</span>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-neutral-200">
                    {blend.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-neutral-700">
                        <span>{ing.oilName}</span>
                        <span className="font-mono font-bold text-neutral-900">{ing.ml}ml ({ing.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= 6. VIEW E: CRM OVERVIEW & ANALYTICS ================= */}
      {activeSubTab === 'overview' && (
        <div className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-3xl shadow-xs space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg font-black font-serif uppercase tracking-wider text-black">
              {isAr ? 'تحليلات الأداء ومسار تحويل Meta Ads (Funnel)' : 'CRM Performance & Conversion Funnel'}
            </h3>
            <p className="text-xs text-neutral-500 font-medium">
              {isAr ? 'مؤشرات أداء الحملات ونمو قاعدة الزبائن' : 'Campaign performance and conversion metrics.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
              <span className="text-xs text-neutral-500 font-bold block">{isAr ? 'إجمالي العملاء' : 'Total Customers'}</span>
              <span className="text-2xl font-black text-black font-mono mt-1 block">{crmStats.totalLeads}</span>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
              <span className="text-xs text-purple-700 font-bold block">{isAr ? 'عملاء من إعلانات Meta' : 'Meta Ads Acquired'}</span>
              <span className="text-2xl font-black text-purple-900 font-mono mt-1 block">{crmStats.metaAdsLeads}</span>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-xs text-emerald-700 font-bold block">{isAr ? 'إجمالي المبيعات' : 'Total Revenue'}</span>
              <span className="text-2xl font-black text-emerald-900 font-mono mt-1 block">${crmStats.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="text-xs text-amber-700 font-bold block">{isAr ? 'معدل الطلب' : 'Average Order'}</span>
              <span className="text-2xl font-black text-amber-950 font-mono mt-1 block">
                ${crmStats.ordersPlaced ? (crmStats.totalRevenue / crmStats.ordersPlaced).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: 360° CUSTOMER PROFILE MODAL ================= */}
      {profileModalLead && (
        <div 
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
          onClick={() => setProfileModalLead(null)}
        >
          <div 
            className="w-full max-w-lg bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-lg font-serif">
                  {profileModalLead.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-black font-serif tracking-wide uppercase">
                    {profileModalLead.name}
                  </h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    {profileModalLead.phone || 'No phone'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setProfileModalLead(null)}
                className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-neutral-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold block">{isAr ? 'المصدر' : 'Source'}</span>
                <span className="font-bold text-neutral-900">{profileModalLead.source}</span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold block">{isAr ? 'الحالة' : 'Status'}</span>
                <span className="font-bold text-neutral-900">{profileModalLead.status}</span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold block">{isAr ? 'عدد الطلبات' : 'Orders'}</span>
                <span className="font-mono font-bold text-neutral-900">{profileModalLead.ordersCount}</span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold block">{isAr ? 'إجمالي الإنفاق' : 'Total Spent'}</span>
                <span className="font-mono font-black text-emerald-600">${profileModalLead.totalSpent.toFixed(2)}</span>
              </div>
            </div>

            {profileModalLead.notes && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                <span className="font-bold text-amber-950 block mb-0.5">{isAr ? 'ملاحظات التاجر CRM:' : 'CRM Notes:'}</span>
                <p className="text-neutral-700 italic">{profileModalLead.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleOpenWhatsApp(profileModalLead)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <WhatsApp className="w-3.5 h-3.5 text-white" />
                <span>{isAr ? 'فتح المحادثة عبر واتساب' : 'Open WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD / EDIT LEAD MODAL ================= */}
      {(editModalLead || isNewLeadModalOpen) && (
        <div 
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
          onClick={() => {
            setEditModalLead(null);
            setIsNewLeadModalOpen(false);
          }}
        >
          <div 
            className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-base font-black text-black font-serif uppercase tracking-wider">
                {editModalLead?.id ? (isAr ? 'تعديل بيانات العميل' : 'Edit Lead') : (isAr ? 'إضافة عميل / Lead جديد' : 'New Lead')}
              </h3>
              <button
                onClick={() => {
                  setEditModalLead(null);
                  setIsNewLeadModalOpen(false);
                }}
                className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-neutral-600" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveLeadEdit(editModalLead || {});
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  {isAr ? 'اسم العميل *' : 'Client Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editModalLead?.name || ''}
                  onChange={(e) => setEditModalLead({ ...editModalLead, name: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    {isAr ? 'رقم الهاتف / واتساب' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={editModalLead?.phone || ''}
                    onChange={(e) => setEditModalLead({ ...editModalLead, phone: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none"
                    placeholder="+961..."
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    {isAr ? 'الفئة / الجنس' : 'Category'}
                  </label>
                  <select
                    value={editModalLead?.genderCategory || 'WOMEN'}
                    onChange={(e) => setEditModalLead({ ...editModalLead, genderCategory: e.target.value as any })}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="WOMEN">WOMEN 🌸</option>
                    <option value="MEN">MEN 💼</option>
                    <option value="UNISEX">UNISEX 👑</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    {isAr ? 'المصدر' : 'Source'}
                  </label>
                  <select
                    value={editModalLead?.source || 'ADS'}
                    onChange={(e) => setEditModalLead({ ...editModalLead, source: e.target.value as any })}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="ADS">📢 Meta ADS</option>
                    <option value="CTWA">💬 CTWA WhatsApp Ads</option>
                    <option value="WA">🟢 Direct WhatsApp</option>
                    <option value="WEBSITE">🌐 Store Website</option>
                    <option value="INSTAGRAM">📸 Instagram</option>
                    <option value="MANUAL">👤 Manual Entry</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={editModalLead?.status || 'NEW'}
                    onChange={(e) => setEditModalLead({ ...editModalLead, status: e.target.value as any })}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="NEW">• NEW</option>
                    <option value="CONTACTED">• CONTACTED</option>
                    <option value="INTERESTED">• INTERESTED</option>
                    <option value="ORDER_PLACED">• ORDER PLACED</option>
                    <option value="VIP">👑 VIP</option>
                    <option value="ARCHIVED">• ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  {isAr ? 'ملاحظات التاجر (CRM Note)' : 'Merchant Note'}
                </label>
                <textarea
                  rows={2}
                  value={editModalLead?.notes || ''}
                  onChange={(e) => setEditModalLead({ ...editModalLead, notes: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalLead(null);
                    setIsNewLeadModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  {isAr ? 'حفظ البيانات' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: FOLLOW-UP MODAL ================= */}
      {followUpModalLead && (
        <div 
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
          onClick={() => setFollowUpModalLead(null)}
        >
          <div 
            className="w-full max-w-sm bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-black text-black">
                  {isAr ? `تحديد موعد متابعة: ${followUpModalLead.name}` : `Follow-up: ${followUpModalLead.name}`}
                </h3>
              </div>
              <button
                onClick={() => setFollowUpModalLead(null)}
                className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  {isAr ? 'تاريخ المتابعة' : 'Follow-up Date'}
                </label>
                <input
                  type="date"
                  value={followUpDateInput}
                  onChange={(e) => setFollowUpDateInput(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  {isAr ? 'ملاحظة التذكير' : 'Reminder Note'}
                </label>
                <input
                  type="text"
                  value={followUpNoteInput}
                  onChange={(e) => setFollowUpNoteInput(e.target.value)}
                  placeholder={isAr ? 'مثال: إرسال عرض باقة التوفير...' : 'e.g. Send offer...'}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
              {followUpModalLead.followUpDate && (
                <button
                  type="button"
                  onClick={() => {
                    setFollowUpDateInput('');
                    setFollowUpNoteInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl text-rose-600 text-xs font-bold hover:bg-rose-50 cursor-pointer"
                >
                  {isAr ? 'مسح الموعد' : 'Clear'}
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveFollowUp}
                className="px-4 py-2 rounded-xl bg-black text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                {isAr ? 'حفظ الموعد' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
