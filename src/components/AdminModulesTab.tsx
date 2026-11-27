import React, { useState, useMemo, useEffect } from 'react';
import type { 
  FragranceOil, 
  SavedRecipe, 
  Invoice, 
  AppSettings, 
  CategoryNavConfig, 
  CustomerCustomBlend,
  CustomerUser,
  TrackingPixelSettings,
  CRMActivityLog,
  FirebaseConfigSettings,
  BottleLabelData,
  SavingsBundle,
  StaffMember
} from '../types';
import { StaffPermissionsTab } from './StaffPermissionsTab';
import { 
  Percent, 
  Folder, 
  Image as ImageIcon, 
  Award, 
  Menu as MenuIcon, 
  Users, 
  UserCheck, 
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Check,
  Edit3,
  Search,
  Lock,
  Download,
  RotateCcw,
  Camera,
  Upload,
  Sparkles,
  Truck,
  WhatsAppIcon,
  X,
  FlaskConical,
  Bookmark,
  Printer,
  History,
  Target,
  Activity,
  GoogleIcon,
  AppleIcon,
  GoogleSheetsIcon,
  Fingerprint,
  ShieldCheck,
  ArrowUpRight,
  Tag,
  FacebookIcon,
  InstagramIcon
} from './icons';
import {
  exportCrmToGoogleSheetsCsv,
  copyCrmForGoogleSheets,
  syncCustomersToGoogleSheetWebhook,
  getGoogleSheetEmbedUrl,
  GOOGLE_SHEET_APPS_SCRIPT_TEMPLATE,
  CRMCustomerExportItem
} from '../utils/googleSheets';
import { useLanguage } from '../context/LanguageContext';
import { 
  loadNavCategories, 
  saveNavCategories, 
  recordDeletedNavCategoryId,
  unrecordDeletedNavCategoryId,
  loadDeletedNavCategoryIds,
  INITIAL_NAV_CATEGORIES, 
  LUXURY_PRESET_IMAGES,
  loadCustomerBlends,
  saveCustomerBlends,
  loadCRMNotes,
  saveCRMNotes,
  loadCRMActivity,
  logCRMActivity,
  loadPixelEventsLog,
  recordPixelEventLog,
  loadCustomerUser,
  type PixelEventRecord,
  loadSavingsBundles,
  saveSavingsBundles,
  INITIAL_SAVINGS_BUNDLES,
  saveSettings
} from '../utils/storage';
import { formatWhatsAppPhone, formatDisplayPhone } from '../utils/whatsappConcierge';
import { trackPixelEvent, initPixels } from '../utils/pixelTracker';
import { 
  loadFirebaseConfig, 
  saveFirebaseConfig, 
  isFirebaseConfigured, 
  parseFirebaseConfigSnippet 
} from '../utils/firebase';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
  testSupabaseConnection,
  syncLocalToSupabase,
  pullFromSupabaseToLocal,
  SUPABASE_SQL_SCHEMA,
  type SupabaseConfigSettings
} from '../utils/supabase';

interface AdminModulesTabProps {
  module: 'coupons' | 'categories' | 'hero-banner' | 'brands' | 'menu-builder' | 'customers' | 'pixel' | 'staff' | 'settings';
  oils: FragranceOil[];
  recipes: SavedRecipe[];
  invoices: Invoice[];
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onOpenBackup?: () => void;
  onResetDefaults?: () => void;
  onSelectTab?: (tab: string) => void;
  onOpenBottleLabel?: (data: BottleLabelData) => void;
  savingsBundles?: SavingsBundle[];
  onUpdateSavingsBundles?: (bundles: SavingsBundle[]) => void;
  currentStaff?: StaffMember;
  onUpdateCurrentStaff?: (staff: StaffMember) => void;
  staffMembers?: StaffMember[];
  onUpdateStaffMembers?: (staffList: StaffMember[]) => void;
}

export const AdminModulesTab: React.FC<AdminModulesTabProps> = ({
  module,
  oils,
  recipes,
  invoices,
  settings,
  onUpdateSettings,
  onOpenBackup,
  onResetDefaults,
  onSelectTab,
  onOpenBottleLabel,
  savingsBundles: propSavingsBundles,
  onUpdateSavingsBundles,
  currentStaff,
  onUpdateCurrentStaff,
  staffMembers,
  onUpdateStaffMembers,
}) => {
  const { language, setLanguage } = useLanguage();
  const isAr = language === 'ar';

  // Savings Bundles state (Admin Management)
  const [couponSubTab, setCouponSubTab] = useState<'bundles' | 'coupons'>('bundles');
  const [bundlesList, setBundlesList] = useState<SavingsBundle[]>(() => {
    return propSavingsBundles !== undefined ? propSavingsBundles : loadSavingsBundles();
  });
  const [savedBundleId, setSavedBundleId] = useState<string | null>(null);
  const [isAddBundleModalOpen, setIsAddBundleModalOpen] = useState(false);
  const [bundlePerfumeSearch, setBundlePerfumeSearch] = useState('');

  // New bundle modal fields
  const [newBundleName, setNewBundleName] = useState('');
  const [newBundleSubtitle, setNewBundleSubtitle] = useState('');
  const [newBundlePrice, setNewBundlePrice] = useState(15);
  const [newBundleOriginalPrice, setNewBundleOriginalPrice] = useState(18);
  const [newBundleBottlesCount, setNewBundleBottlesCount] = useState(2);
  const [newBundleBottleSize, setNewBundleBottleSize] = useState(50);
  const [newBundleFreeDelivery, setNewBundleFreeDelivery] = useState(false);
  const [newBundleFeatured, setNewBundleFeatured] = useState(false);
  const [newBundleImage, setNewBundleImage] = useState('https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80');
  const [newBundleSelectionMode, setNewBundleSelectionMode] = useState<'all' | 'custom'>('all');
  const [newBundleSelectedIds, setNewBundleSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (propSavingsBundles !== undefined) {
      setBundlesList(propSavingsBundles);
    }
  }, [propSavingsBundles]);

  const handleSaveAllBundles = (updatedList: SavingsBundle[], targetId?: string) => {
    setBundlesList(updatedList);
    saveSavingsBundles(updatedList);
    if (onUpdateSavingsBundles) {
      onUpdateSavingsBundles(updatedList);
    }
    if (targetId) {
      setSavedBundleId(targetId);
      setTimeout(() => setSavedBundleId(null), 2500);
    }
  };

  const handleUpdateSingleBundle = (bundleId: string, updates: Partial<SavingsBundle>) => {
    const updated = bundlesList.map(b => b.id === bundleId ? { ...b, ...updates } : b);
    handleSaveAllBundles(updated, bundleId);
  };

  const handleDeleteBundle = (bundleId: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذه الباقة التوفيرية؟' : 'Are you sure you want to delete this bundle?')) return;
    const filtered = bundlesList.filter(b => b.id !== bundleId);
    handleSaveAllBundles(filtered);
  };

  const handleAddNewBundleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBundleName.trim()) return;

    const newBundle: SavingsBundle = {
      id: 'bundle-' + Date.now(),
      name: newBundleName.trim(),
      subtitle: newBundleSubtitle.trim() || (isAr ? `${newBundleBottlesCount} عطور فاخرة` : `${newBundleBottlesCount} Luxury Bottles`),
      description: isAr ? `باقة توفيرية تضم ${newBundleBottlesCount} زجاجات بسعة ${newBundleBottleSize} مل` : `Value set with ${newBundleBottlesCount} flacons of ${newBundleBottleSize}ml`,
      price: Number(newBundlePrice) || 15,
      originalPrice: Number(newBundleOriginalPrice) || (Number(newBundlePrice) + 4),
      bottlesCount: Number(newBundleBottlesCount) || 2,
      bottleSizeMl: Number(newBundleBottleSize) || 50,
      selectionMode: newBundleSelectionMode,
      selectedItemIds: newBundleSelectionMode === 'custom' ? newBundleSelectedIds : [],
      features: [
        isAr ? `${newBundleBottlesCount} زجاجات سعة ${newBundleBottleSize} مل` : `${newBundleBottlesCount} x ${newBundleBottleSize}ml bottles`,
        isAr ? 'تركيز إكستري دو بارفان فائق الثبات' : 'Extrait de Parfum concentration',
        newBundleFreeDelivery ? (isAr ? 'توصيل مجاني لكافة مناطق لبنان 🚚' : 'Free delivery across Lebanon 🚚') : (isAr ? 'تغليف إهدائي فاخر وبوكس مميز' : 'Luxury gift packaging')
      ],
      featuresAr: [
        `${newBundleBottlesCount} زجاجات سعة ${newBundleBottleSize} مل`,
        'تركيز إكستري دو بارفان فائق الثبات',
        newBundleFreeDelivery ? 'توصيل مجاني لكافة مناطق لبنان 🚚' : 'تغليف إهدائي فاخر وبوكس مميز'
      ],
      freeDelivery: newBundleFreeDelivery,
      isFeatured: newBundleFeatured,
      isActive: true,
      imageUrl: newBundleImage.trim() || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80',
      badge: newBundleFeatured ? (isAr ? 'الأكثر طلباً' : 'Bestseller') : undefined
    };

    const nextList = [newBundle, ...bundlesList];
    handleSaveAllBundles(nextList, newBundle.id);
    setIsAddBundleModalOpen(false);
    // Reset modal
    setNewBundleName('');
    setNewBundleSubtitle('');
    setNewBundlePrice(15);
    setNewBundleOriginalPrice(18);
    setNewBundleSelectedIds([]);
  };

  const allStorePerfumes = useMemo(() => {
    const list: { id: string; name: string; brand: string; type: 'oil' | 'recipe'; imageUrl?: string }[] = [];
    recipes.forEach(r => {
      list.push({
        id: r.id,
        name: r.name,
        brand: (r as any).brand || 'نسمات الحصرية',
        type: 'recipe',
        imageUrl: r.imageUrl
      });
    });
    oils.forEach(o => {
      list.push({
        id: o.id,
        name: o.name,
        brand: o.brand || 'نسمات',
        type: 'oil',
        imageUrl: o.imageUrl
      });
    });
    return list;
  }, [recipes, oils]);

  const filteredPerfumesForBundles = useMemo(() => {
    if (!bundlePerfumeSearch.trim()) return allStorePerfumes;
    const q = bundlePerfumeSearch.trim().toLowerCase();
    return allStorePerfumes.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }, [allStorePerfumes, bundlePerfumeSearch]);

  // Coupons state
  const [coupons, setCoupons] = useState([
    { id: '1', code: 'BEIRUT2026', discountPercent: 10, minOrder: 30, active: true },
    { id: '2', code: 'ROYALVIP', discountPercent: 15, minOrder: 50, active: true },
    { id: '3', code: 'FREESHIP', discountPercent: 0, minOrder: 35, freeShipping: true, active: true },
  ]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPercent, setNewCouponPercent] = useState('10');

  // Customer bespoke blends in admin (الخلطات المختارة من الزبون بالملل)
  const [customerBlendsList, setCustomerBlendsList] = useState<CustomerCustomBlend[]>(() => loadCustomerBlends());
  const [customerSubTab, setCustomerSubTab] = useState<'overview' | 'directory' | 'blends' | 'activity' | 'googlesheet' | 'firebase' | 'supabase'>('overview');
  const [blendSearchTerm, setBlendSearchTerm] = useState('');
  const [selectedBlendSizes, setSelectedBlendSizes] = useState<Record<string, number>>({});
  const [printingBlend, setPrintingBlend] = useState<CustomerCustomBlend | null>(null);

  // Google Sheets CRM Integration State
  const [googleSheetUrlInput, setGoogleSheetUrlInput] = useState(settings.crmGoogleSheetUrl || '');
  const [googleSheetWebhookInput, setGoogleSheetWebhookInput] = useState(settings.crmGoogleSheetWebhookUrl || '');
  const [isSyncingGoogleSheet, setIsSyncingGoogleSheet] = useState(false);
  const [googleSheetStatusMsg, setGoogleSheetStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedAppsScript, setCopiedAppsScript] = useState(false);
  const [copiedForSheet, setCopiedForSheet] = useState(false);

  // Firebase Auth Settings State
  const [adminFbConfig, setAdminFbConfig] = useState<FirebaseConfigSettings>(() => loadFirebaseConfig());
  const [adminFbSnippet, setAdminFbSnippet] = useState('');
  const [adminFbSaveMsg, setAdminFbSaveMsg] = useState('');
  const isFbConnected = isFirebaseConfigured(adminFbConfig);

  // Supabase Cloud Sync State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfigSettings>(() => getSupabaseConfig());
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; text: string }>({ type: 'idle', text: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const isSupaConnected = isSupabaseConfigured();

  const handleTestSupabase = async () => {
    setSupabaseStatusMsg({ type: 'loading', text: isAr ? 'جاري فحص الاتصال بقاعدة بيانات Supabase...' : 'Testing Supabase connection...' });
    const res = await testSupabaseConnection();
    setSupabaseStatusMsg({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
  };

  const handleSaveSupabase = () => {
    saveSupabaseConfig(supabaseConfig);
    setSupabaseStatusMsg({
      type: 'success',
      text: isAr ? '✓ تم حفظ إعدادات Supabase بنجاح!' : 'Supabase settings saved successfully!'
    });
    setTimeout(() => setSupabaseStatusMsg({ type: 'idle', text: '' }), 4000);
  };

  const handlePushToSupabase = async () => {
    setIsSyncing(true);
    setSupabaseStatusMsg({ type: 'loading', text: isAr ? 'جاري رفع البيانات إلى السحابة...' : 'Uploading data to cloud...' });
    try {
      const res = await syncLocalToSupabase();
      setSupabaseStatusMsg({
        type: 'success',
        text: `✓ ${res.message}`
      });
      setSupabaseConfig(getSupabaseConfig());
    } catch (err: any) {
      setSupabaseStatusMsg({
        type: 'error',
        text: isAr ? `فشل الرفع: ${err.message}` : `Upload failed: ${err.message}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setIsSyncing(true);
    setSupabaseStatusMsg({ type: 'loading', text: isAr ? 'جاري سحب البيانات من السحابة...' : 'Pulling data from cloud...' });
    try {
      const res = await pullFromSupabaseToLocal();
      setCustomerBlendsList(loadCustomerBlends());
      setSupabaseStatusMsg({
        type: 'success',
        text: `✓ ${res.message}`
      });
      setSupabaseConfig(getSupabaseConfig());
    } catch (err: any) {
      setSupabaseStatusMsg({
        type: 'error',
        text: isAr ? `فشل السحب: ${err.message}` : `Pull failed: ${err.message}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // CRM State
  const [crmNotes, setCrmNotes] = useState<Record<string, string>>(() => loadCRMNotes());
  const [editingCrmCustomerName, setEditingCrmCustomerName] = useState<string | null>(null);
  const [editingCrmNoteText, setEditingCrmNoteText] = useState<string>('');
  const [crmSegmentFilter, setCrmSegmentFilter] = useState<'all' | 'vip' | 'regular' | 'new' | 'connoisseur'>('all');
  const [crmDirectorySearch, setCrmDirectorySearch] = useState('');
  const [crmActivityList, setCrmActivityList] = useState<CRMActivityLog[]>(() => loadCRMActivity());

  useEffect(() => {
    const handleActivityUpdate = () => {
      setCrmActivityList(loadCRMActivity());
    };
    window.addEventListener('nasamat_crm_activity_updated', handleActivityUpdate);
    return () => window.removeEventListener('nasamat_crm_activity_updated', handleActivityUpdate);
  }, []);

  // Pixel & Ads Tracking State
  const [pixelSettings, setPixelSettings] = useState<TrackingPixelSettings>(() => settings.trackingPixels || {
    metaPixelId: '',
    isMetaPixelEnabled: false,
    tiktokPixelId: '',
    isTiktokPixelEnabled: false,
    snapchatPixelId: '',
    isSnapchatPixelEnabled: false,
    googleTagId: '',
    isGoogleTagEnabled: false,
    pixelTestMode: true,
  });
  const [pixelEventsLog, setPixelEventsLog] = useState<PixelEventRecord[]>(() => loadPixelEventsLog());
  const [pixelSaveMessage, setPixelSaveMessage] = useState('');

  useEffect(() => {
    const handlePixelEventLogged = () => {
      setPixelEventsLog(loadPixelEventsLog());
    };
    window.addEventListener('nasamat_pixel_event_logged', handlePixelEventLogged);
    return () => window.removeEventListener('nasamat_pixel_event_logged', handlePixelEventLogged);
  }, []);

  const handleSavePixelSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings = {
      ...settings,
      trackingPixels: pixelSettings,
    };
    onUpdateSettings(updatedSettings);
    initPixels(pixelSettings);
    setPixelSaveMessage(isAr ? 'تم حفظ وتفعيل إعدادات الـ Pixel بنجاح! 🎯' : 'Pixel settings saved & active!');
    setTimeout(() => setPixelSaveMessage(''), 3500);
  };

  const handleFireTestPixelEvent = (eventName: any, payload: any) => {
    trackPixelEvent(eventName, payload);
    setPixelEventsLog(loadPixelEventsLog());
  };

  const handleSaveCrmNote = (customerName: string) => {
    const updated = {
      ...crmNotes,
      [customerName]: editingCrmNoteText.trim(),
    };
    setCrmNotes(updated);
    saveCRMNotes(updated);
    logCRMActivity({
      customerName,
      type: 'note_added',
      description: `تحديث ملاحظات الإدارة للزبون "${customerName}"`,
    });
    setEditingCrmCustomerName(null);
  };

  useEffect(() => {
    const handleUpdate = () => {
      setCustomerBlendsList(loadCustomerBlends());
    };
    window.addEventListener('nasamat_customer_blends_updated', handleUpdate);
    return () => window.removeEventListener('nasamat_customer_blends_updated', handleUpdate);
  }, []);

  const handleDeleteBlend = (blendId: string) => {
    const updated = customerBlendsList.filter((b) => b.id !== blendId);
    setCustomerBlendsList(updated);
    saveCustomerBlends(updated);
    window.dispatchEvent(new CustomEvent('nasamat_customer_blends_updated'));
  };

  // Register New Blend for Customer Modal state
  const [isNewCustomerBlendModalOpen, setIsNewCustomerBlendModalOpen] = useState(false);
  const [newBlendCustomerName, setNewBlendCustomerName] = useState('');
  const [newBlendName, setNewBlendName] = useState('');
  const [newBlendSize, setNewBlendSize] = useState<number>(50);
  const [newBlendOils, setNewBlendOils] = useState<{ oilId: string; percentage: number }[]>([]);
  const [newBlendOilSearch, setNewBlendOilSearch] = useState('');

  const handleOpenNewCustomerBlendModal = (prefillCustomerName?: string) => {
    setNewBlendCustomerName(prefillCustomerName || '');
    setNewBlendName('');
    setNewBlendSize(50);
    if (oils.length >= 2) {
      setNewBlendOils([
        { oilId: oils[0].id, percentage: 60 },
        { oilId: oils[1].id, percentage: 40 },
      ]);
    } else if (oils.length === 1) {
      setNewBlendOils([{ oilId: oils[0].id, percentage: 100 }]);
    } else {
      setNewBlendOils([]);
    }
    setNewBlendOilSearch('');
    setIsNewCustomerBlendModalOpen(true);
  };

  const handleAddOilToNewBlend = (oil: FragranceOil) => {
    if (newBlendOils.some((bo) => bo.oilId === oil.id)) return;
    if (newBlendOils.length >= 4) return;
    const newCount = newBlendOils.length + 1;
    const equalShare = Math.floor(100 / newCount);
    const remainder = 100 - equalShare * newCount;
    setNewBlendOils([
      ...newBlendOils.map((bo, idx) => ({ ...bo, percentage: idx === 0 ? equalShare + remainder : equalShare })),
      { oilId: oil.id, percentage: equalShare },
    ]);
  };

  const handleRemoveOilFromNewBlend = (oilId: string) => {
    const filtered = newBlendOils.filter((bo) => bo.oilId !== oilId);
    if (filtered.length === 0) {
      setNewBlendOils([]);
      return;
    }
    const equalShare = Math.floor(100 / filtered.length);
    const remainder = 100 - equalShare * filtered.length;
    setNewBlendOils(filtered.map((bo, idx) => ({ ...bo, percentage: idx === 0 ? equalShare + remainder : equalShare })));
  };

  const handleUpdateNewBlendOilPercentage = (oilId: string, percentage: number) => {
    const valid = Math.max(5, Math.min(95, percentage));
    setNewBlendOils((prev) => prev.map((bo) => (bo.oilId === oilId ? { ...bo, percentage: valid } : bo)));
  };

  const handleEqualizeNewBlendRatios = () => {
    if (newBlendOils.length === 0) return;
    const equalShare = Math.floor(100 / newBlendOils.length);
    const remainder = 100 - equalShare * newBlendOils.length;
    setNewBlendOils(newBlendOils.map((bo, idx) => ({ ...bo, percentage: idx === 0 ? equalShare + remainder : equalShare })));
  };

  const handleSaveNewCustomerBlend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlendName.trim() || !newBlendCustomerName.trim() || newBlendOils.length === 0) return;

    const totalOilMl = Number((newBlendSize * 0.25).toFixed(2));
    const alcoholMl = Number((newBlendSize - totalOilMl).toFixed(2));

    const ingredients = newBlendOils.map((bo) => {
      const match = oils.find((o) => o.id === bo.oilId);
      const oilMl = Number(((totalOilMl * bo.percentage) / 100).toFixed(2));
      return {
        oilId: bo.oilId,
        oilName: match?.name || 'زيت عطري',
        oilCode: match?.code,
        oilBrand: match?.brand,
        percentage: bo.percentage,
        ml: oilMl,
      };
    });

    const newBlend: CustomerCustomBlend = {
      id: `blend-${Date.now()}`,
      name: newBlendName.trim(),
      customerName: newBlendCustomerName.trim(),
      sizeMl: newBlendSize,
      totalOilMl,
      alcoholMl,
      concentrationPercent: 25,
      ingredients,
      totalPrice: newBlendSize === 30 ? 5 : newBlendSize === 50 ? 8 : 14,
      notes: ingredients.map(ing => `${ing.oilName}: ${ing.ml} ملل (${ing.percentage}%)`).join(' + '),
      createdAt: new Date().toISOString(),
    };

    const updated = [newBlend, ...customerBlendsList];
    setCustomerBlendsList(updated);
    saveCustomerBlends(updated);
    window.dispatchEvent(new CustomEvent('nasamat_customer_blends_updated'));
    setIsNewCustomerBlendModalOpen(false);
  };

  const filteredCustomerBlends = useMemo(() => {
    if (!blendSearchTerm.trim()) return customerBlendsList;
    const q = blendSearchTerm.toLowerCase();
    return customerBlendsList.filter((b) => 
      b.name.toLowerCase().includes(q) ||
      (b.customerName && b.customerName.toLowerCase().includes(q)) ||
      b.ingredients.some(ing => ing.oilName.toLowerCase().includes(q) || (ing.oilCode && ing.oilCode.toLowerCase().includes(q)))
    );
  }, [customerBlendsList, blendSearchTerm]);

  const availableOilsForNewBlend = useMemo(() => {
    return oils.filter((o) => {
      const isAlreadyAdded = newBlendOils.some((bo) => bo.oilId === o.id);
      if (isAlreadyAdded) return false;
      if (!newBlendOilSearch.trim()) return true;
      const q = newBlendOilSearch.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        (o.brand && o.brand.toLowerCase().includes(q)) ||
        (o.code && o.code.toLowerCase().includes(q))
      );
    });
  }, [oils, newBlendOils, newBlendOilSearch]);

  const newBlendTotalPercent = useMemo(() => {
    return newBlendOils.reduce((sum, item) => sum + item.percentage, 0);
  }, [newBlendOils]);

  // Navigation & Category Images management (صور قابلة للتعديل وإضافة أقسام جديدة)
  const [adminNavCategories, setAdminNavCategories] = useState<CategoryNavConfig[]>(() => loadNavCategories());
  const [editingCategoryModal, setEditingCategoryModal] = useState<CategoryNavConfig | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; label: string } | null>(null);
  const [categoryToast, setCategoryToast] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [modalEditId, setModalEditId] = useState('');
  const [modalEditImageUrl, setModalEditImageUrl] = useState('');
  const [modalEditLabelAr, setModalEditLabelAr] = useState('');
  const [modalEditLabelEn, setModalEditLabelEn] = useState('');
  const [modalEditCountAr, setModalEditCountAr] = useState('');
  const [modalEditCountEn, setModalEditCountEn] = useState('');

  // Re-sync categories automatically whenever updated anywhere in the app
  useEffect(() => {
    const handleUpdate = () => {
      setAdminNavCategories(loadNavCategories());
    };
    window.addEventListener('nasamat_categories_updated', handleUpdate);
    return () => window.removeEventListener('nasamat_categories_updated', handleUpdate);
  }, []);

  const openAdminCategoryEdit = (cat: CategoryNavConfig) => {
    setIsAddingCategory(false);
    setEditingCategoryModal(cat);
    setModalEditId(cat.id);
    setModalEditImageUrl(cat.imageUrl);
    setModalEditLabelAr(cat.labelAr);
    setModalEditLabelEn(cat.labelEn);
    setModalEditCountAr(cat.countAr || '');
    setModalEditCountEn(cat.countEn || '');
  };

  const openAddNewCategory = () => {
    setIsAddingCategory(true);
    setEditingCategoryModal({
      id: 'new',
      labelAr: '',
      labelEn: '',
      imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80',
      countAr: '15 عطر',
      countEn: '15 Scents',
    });
    setModalEditId('cat_' + Date.now().toString().slice(-4));
    setModalEditImageUrl('https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80');
    setModalEditLabelAr('');
    setModalEditLabelEn('');
    setModalEditCountAr('15 عطر');
    setModalEditCountEn('15 Scents');
  };

  const deleteAdminCategory = (id: string, label: string) => {
    setCategoryToDelete({ id, label });
  };

  const saveAdminCategoryEdit = () => {
    if (!editingCategoryModal) return;
    if (isAddingCategory) {
      if (!modalEditLabelAr.trim()) {
        alert(isAr ? 'يرجى كتابة اسم القسم بالعربية' : 'Please enter category name in Arabic');
        return;
      }
      const newCatId = (modalEditId.trim() || 'cat_' + Date.now().toString().slice(-4)).toLowerCase().replace(/\s+/g, '_');
      unrecordDeletedNavCategoryId(newCatId);
      const newCat: CategoryNavConfig = {
        id: newCatId,
        labelAr: modalEditLabelAr.trim(),
        labelEn: modalEditLabelEn.trim() || modalEditLabelAr.trim(),
        imageUrl: modalEditImageUrl.trim() || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80',
        countAr: modalEditCountAr.trim() || 'عطور حصرية',
        countEn: modalEditCountEn.trim() || 'Exclusive',
      };
      const updated = [...adminNavCategories, newCat];
      setAdminNavCategories(updated);
      saveNavCategories(updated);
      window.dispatchEvent(new Event('nasamat_categories_updated'));
      setEditingCategoryModal(null);
      setIsAddingCategory(false);
      return;
    }
    const updated = adminNavCategories.map((c) => {
      if (c.id === editingCategoryModal.id) {
        return {
          ...c,
          imageUrl: modalEditImageUrl.trim() || c.imageUrl,
          labelAr: modalEditLabelAr.trim() || c.labelAr,
          labelEn: modalEditLabelEn.trim() || c.labelEn,
          countAr: modalEditCountAr.trim() || c.countAr,
          countEn: modalEditCountEn.trim() || c.countEn,
        };
      }
      return c;
    });
    setAdminNavCategories(updated);
    saveNavCategories(updated);
    window.dispatchEvent(new Event('nasamat_categories_updated'));
    setEditingCategoryModal(null);
  };

  const handleAdminFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setModalEditImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Customer List for CRM derived from invoices, bespoke blends, and user accounts
  const customerList = useMemo(() => {
    const map = new Map<string, { 
      name: string; 
      phone?: string; 
      email?: string;
      provider?: 'google' | 'apple' | 'email' | 'device_passkey' | 'guest';
      avatar?: string;
      ordersCount: number; 
      totalSpent: number; 
      lastDate: string;
      customBlendsCount: number;
      segment: 'vip' | 'regular' | 'new' | 'connoisseur';
      notes: string;
    }>();

    // 1. Invoices
    invoices.forEach((inv) => {
      const name = (inv.partyName || 'زبون عام').trim();
      const key = name.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += inv.totalAmount;
        if (new Date(inv.date) > new Date(existing.lastDate)) existing.lastDate = inv.date;
        if (inv.partyPhone && !existing.phone) existing.phone = inv.partyPhone;
      } else {
        map.set(key, {
          name,
          phone: inv.partyPhone,
          ordersCount: 1,
          totalSpent: inv.totalAmount,
          lastDate: inv.date,
          customBlendsCount: 0,
          segment: 'new',
          notes: crmNotes[name] || '',
        });
      }
    });

    // 2. Custom Blends
    customerBlendsList.forEach((b) => {
      if (!b.customerName) return;
      const name = b.customerName.trim();
      const key = name.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.customBlendsCount += 1;
      } else {
        map.set(key, {
          name,
          phone: undefined,
          ordersCount: 0,
          totalSpent: 0,
          lastDate: b.createdAt,
          customBlendsCount: 1,
          segment: 'connoisseur',
          notes: crmNotes[name] || '',
        });
      }
    });

    // 3. Authenticated Customer User (Google / Apple)
    const authedUser = loadCustomerUser();
    if (authedUser) {
      const key = authedUser.name.trim().toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.provider = authedUser.provider;
        existing.email = authedUser.email;
        existing.avatar = authedUser.avatar;
        if (authedUser.phone && !existing.phone) existing.phone = authedUser.phone;
      } else {
        map.set(key, {
          name: authedUser.name,
          email: authedUser.email,
          phone: authedUser.phone,
          provider: authedUser.provider,
          avatar: authedUser.avatar,
          ordersCount: 0,
          totalSpent: 0,
          lastDate: authedUser.lastLoginAt,
          customBlendsCount: 0,
          segment: 'new',
          notes: crmNotes[authedUser.name] || '',
        });
      }
    }

    // Assign segments & notes
    return Array.from(map.values()).map((c) => {
      let segment: 'vip' | 'regular' | 'new' | 'connoisseur' = 'new';
      if (c.totalSpent >= 100 || c.ordersCount >= 3) {
        segment = 'vip';
      } else if (c.customBlendsCount > 0) {
        segment = 'connoisseur';
      } else if (c.ordersCount > 1) {
        segment = 'regular';
      }
      return {
        ...c,
        segment,
        notes: crmNotes[c.name] || '',
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [invoices, customerBlendsList, crmNotes]);

  // Filtered customer list for CRM directory
  const filteredCrmCustomers = useMemo(() => {
    return customerList.filter((c) => {
      // Segment filter
      if (crmSegmentFilter !== 'all' && c.segment !== crmSegmentFilter) return false;
      // Search term
      if (!crmDirectorySearch.trim()) return true;
      const q = crmDirectorySearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    });
  }, [customerList, crmSegmentFilter, crmDirectorySearch]);

  // Pre-formatted customer items for Google Sheets export and sync
  const crmExportItems: CRMCustomerExportItem[] = useMemo(() => {
    return customerList.map((c) => {
      const blends = customerBlendsList.filter(
        (b) => (b.customerName || '').trim().toLowerCase() === c.name.trim().toLowerCase()
      );
      return {
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        segment: c.segment || 'regular',
        ordersCount: c.ordersCount || 0,
        totalSpent: c.totalSpent || 0,
        aov: c.ordersCount ? Number((c.totalSpent / c.ordersCount).toFixed(2)) : 0,
        lastOrderDate: c.lastDate || '',
        blendsCount: c.customBlendsCount || blends.length || 0,
        blendsNames: blends.map((b) => b.name).join(' | '),
        notes: c.notes || crmNotes[c.name] || '',
      };
    });
  }, [customerList, customerBlendsList, crmNotes]);

  const handleExportGoogleSheetCsv = () => {
    exportCrmToGoogleSheetsCsv(crmExportItems, `nasamat-crm-customers-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleCopyForGoogleSheet = async () => {
    const success = await copyCrmForGoogleSheets(crmExportItems);
    if (success) {
      setCopiedForSheet(true);
      setTimeout(() => setCopiedForSheet(false), 3000);
    }
  };

  const handleSaveGoogleSheetConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      crmGoogleSheetUrl: googleSheetUrlInput.trim(),
      crmGoogleSheetWebhookUrl: googleSheetWebhookInput.trim(),
    });
    setGoogleSheetStatusMsg({
      type: 'success',
      text: isAr ? 'تم حفظ روابط Google Sheet بنجاح ✅' : 'Google Sheet URLs saved successfully ✅'
    });
    setTimeout(() => setGoogleSheetStatusMsg(null), 3500);
  };

  const handleSyncToGoogleSheet = async () => {
    const webhook = googleSheetWebhookInput.trim() || settings.crmGoogleSheetWebhookUrl;
    if (!webhook) {
      setGoogleSheetStatusMsg({
        type: 'error',
        text: isAr ? 'يرجى إدخال رابط Webhook لـ Google Apps Script أولاً للمزامنة' : 'Please configure Google Apps Script Webhook URL first'
      });
      return;
    }
    setIsSyncingGoogleSheet(true);
    setGoogleSheetStatusMsg(null);
    try {
      const res = await syncCustomersToGoogleSheetWebhook(webhook, crmExportItems);
      setGoogleSheetStatusMsg({
        type: res.success ? 'success' : 'error',
        text: res.message
      });
    } catch (err: any) {
      setGoogleSheetStatusMsg({
        type: 'error',
        text: err?.message || 'حدث خطأ أثناء المزامنة'
      });
    } finally {
      setIsSyncingGoogleSheet(false);
    }
  };

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(GOOGLE_SHEET_APPS_SCRIPT_TEMPLATE);
    setCopiedAppsScript(true);
    setTimeout(() => setCopiedAppsScript(false), 3000);
  };

  // CRM KPI Metrics
  const crmMetrics = useMemo(() => {
    const totalCustomers = customerList.length;
    const vipCount = customerList.filter(c => c.segment === 'vip').length;
    const connoisseurCount = customerList.filter(c => c.customBlendsCount > 0).length;
    const totalRevenue = customerList.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgOrderValue = invoices.length > 0 ? (totalRevenue / invoices.length) : 0;
    const googleAppleCount = customerList.filter(c => c.provider === 'google' || c.provider === 'apple' || c.provider === 'email').length;
    return {
      totalCustomers,
      vipCount,
      connoisseurCount,
      totalRevenue,
      avgOrderValue,
      googleAppleCount,
    };
  }, [customerList, invoices]);

  // Brands list
  const brandList = useMemo(() => {
    const map = new Map<string, { count: number; minPrice: number; maxPrice: number }>();
    oils.forEach((o) => {
      const b = o.brand || 'Other';
      const p = o.retailPrice50ml || 7;
      const ex = map.get(b);
      if (ex) {
        ex.count += 1;
        if (p < ex.minPrice) ex.minPrice = p;
        if (p > ex.maxPrice) ex.maxPrice = p;
      } else {
        map.set(b, { count: 1, minPrice: p, maxPrice: p });
      }
    });
    return Array.from(map.entries()).map(([brand, data]) => ({ brand, ...data })).sort((a, b) => b.count - a.count);
  }, [oils]);

  // Categories list
  const categoriesList = [
    { id: 'oriental', nameAr: 'شرقية وملكية (أخشاب وعنبر)', nameEn: 'Oriental & Royal Oud', icon: '👑', count: oils.filter(o => o.family === 'oriental').length },
    { id: 'woody', nameAr: 'خشبية نيش (صندل وأرز)', nameEn: 'Woody & Cedar Niche', icon: '🪵', count: oils.filter(o => o.family === 'woody').length },
    { id: 'floral', nameAr: 'زهرية رومانسية (ياسمين وغراس)', nameEn: 'Floral Grasse', icon: '🌸', count: oils.filter(o => o.family === 'floral').length },
    { id: 'fresh', nameAr: 'منعشة وبحرية (حمضيات وأكوا)', nameEn: 'Fresh & Aquatic', icon: '🌊', count: oils.filter(o => o.family === 'fresh').length },
    { id: 'leather', nameAr: 'جلود وباتشولي فاخرة', nameEn: 'Leather & Suede', icon: '💼', count: oils.filter(o => o.family === 'leather').length },
    { id: 'gourmand', nameAr: 'جورماند وحلوة (فانيلا وتوباكو)', nameEn: 'Gourmand & Vanilla', icon: '🍨', count: oils.filter(o => o.family === 'gourmand').length },
    { id: 'aromatic', nameAr: 'عطرية فوجير وفلفل وردي', nameEn: 'Aromatic & Fougere', icon: '🌿', count: oils.filter(o => o.family === 'aromatic').length },
    { id: 'citrus', nameAr: 'حمضيات برغموت وكالابريا', nameEn: 'Citrus & Bergamot', icon: '🍋', count: oils.filter(o => o.family === 'citrus').length },
  ];

  // Hero & Banner customizer state
  const [heroTitle, setHeroTitle] = useState('نسمات — فخامة العطور العالمية');
  const [heroPill, setHeroPill] = useState('تشكيلة 2026 الحصرية — بيروت');
  const [heroBio, setHeroBio] = useState('عطور نيش شرقية وعالمية فاخرة بتركيز إكستري دو بارفان يدوم طويلاً.');
  const [heroBannerSaved, setHeroBannerSaved] = useState(false);

  // Settings state
  const [adminPasswordInput, setAdminPasswordInput] = useState(settings.adminPassword || '1234');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [adminSecretSlugInput, setAdminSecretSlugInput] = useState(settings.adminSecretSlug || 'nasmat-vault-77');
  const [secretSlugSaved, setSecretSlugSaved] = useState(false);
  const [secretSlugCopied, setSecretSlugCopied] = useState(false);

  // WhatsApp & Store Phone state
  const [storePhoneInput, setStorePhoneInput] = useState(settings.storePhone || '+961 70 000 000');
  const [phoneSaved, setPhoneSaved] = useState(false);

  // Social Media Links (Facebook & Instagram)
  const [facebookUrlInput, setFacebookUrlInput] = useState(settings.facebookUrl || '');
  const [instagramUrlInput, setInstagramUrlInput] = useState(settings.instagramUrl || '');
  const [socialSaved, setSocialSaved] = useState(false);

  // Delivery settings state
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<number>(settings.defaultDeliveryFee !== undefined ? settings.defaultDeliveryFee : 3);
  const [freeThresholdInput, setFreeThresholdInput] = useState<number>(settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 35);
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState<boolean>(settings.isFreeDeliveryEnabled !== false);
  const [deliveryNotesInput, setDeliveryNotesInput] = useState<string>(settings.deliveryNotes || 'توصيل سريع لكافة الأراضي اللبنانية خلال 24 - 48 ساعة والدفع كاش عند الاستلام');
  const [deliverySettingsSaved, setDeliverySettingsSaved] = useState(false);

  // LBP Exchange Rate state
  const [lbpRateInput, setLbpRateInput] = useState<number>(settings.lbpRate || 90000);
  const [lbpRateSaved, setLbpRateSaved] = useState(false);

  // Store Brand Identity
  const [storeNameInput, setStoreNameInput] = useState(settings.storeName || 'نسمات للعطور الملكية - لبنان');
  const [storeLocationInput, setStoreLocationInput] = useState(settings.storeLocation || 'بيروت / جبل لبنان');
  const [storeBioInput, setStoreBioInput] = useState(settings.storeBio || 'صياغة وتركيب أفخم العطور العالمية والنيش بتركيز إكستري دو بارفان لثبات وفوحان دائم');
  const [allSettingsSaved, setAllSettingsSaved] = useState(false);

  // Keep local inputs synchronized with settings prop from parent
  useEffect(() => {
    if (settings) {
      setAdminPasswordInput(settings.adminPassword || '1234');
      setAdminSecretSlugInput(settings.adminSecretSlug || 'nasmat-vault-77');
      const cleanPhone = settings.storePhone && settings.storePhone !== '+961 70 000 000' 
        ? settings.storePhone 
        : '+961 81 713 408';
      setStorePhoneInput(cleanPhone);
      setFacebookUrlInput(settings.facebookUrl || '');
      setInstagramUrlInput(settings.instagramUrl || '');
      setDeliveryFeeInput(settings.defaultDeliveryFee !== undefined ? settings.defaultDeliveryFee : 3);
      setFreeThresholdInput(settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 35);
      setFreeDeliveryEnabled(settings.isFreeDeliveryEnabled !== false);
      setDeliveryNotesInput(settings.deliveryNotes || 'توصيل سريع لكافة الأراضي اللبنانية خلال 24 - 48 ساعة والدفع كاش عند الاستلام');
      setLbpRateInput(settings.lbpRate || 90000);
      setStoreNameInput(settings.storeName || 'نسمات للعطور الملكية - لبنان');
      setStoreLocationInput(settings.storeLocation || 'بيروت / جبل لبنان');
      setStoreBioInput(settings.storeBio || 'صياغة وتركيب أفخم العطور العالمية والنيش بتركيز إكستري دو بارفان لثبات وفوحان دائم');
    }
  }, [settings]);

  // Master unified save function: saves ALL settings at once so no field is ever lost or reverted
  const handleSaveAllSettings = (
    e?: React.FormEvent,
    specificFeedback?: 'phone' | 'delivery' | 'rate' | 'password' | 'slug' | 'store' | 'social' | 'all'
  ) => {
    if (e) e.preventDefault();

    const cleanSlug = adminSecretSlugInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'nasmat-vault-77';
    setAdminSecretSlugInput(cleanSlug);

    const rate = Number(lbpRateInput) || 90000;
    const phone = storePhoneInput.trim();

    const updated: AppSettings = {
      ...settings,
      storePhone: phone,
      facebookUrl: facebookUrlInput.trim(),
      instagramUrl: instagramUrlInput.trim(),
      defaultDeliveryFee: Number(deliveryFeeInput),
      freeDeliveryThreshold: Number(freeThresholdInput),
      isFreeDeliveryEnabled: Boolean(freeDeliveryEnabled),
      deliveryNotes: deliveryNotesInput.trim(),
      lbpRate: rate,
      adminPassword: adminPasswordInput.trim() || '1234',
      adminSecretSlug: cleanSlug,
      storeName: storeNameInput.trim() || settings.storeName,
      storeLocation: storeLocationInput.trim() || settings.storeLocation,
      storeBio: storeBioInput.trim() || settings.storeBio,
    };

    // Direct persistence in localStorage so changes are 100% saved immediately
    saveSettings(updated);

    // Broadcast to parent React state
    onUpdateSettings(updated);

    // Specific feedback animations
    if (specificFeedback === 'phone') {
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 3000);
    } else if (specificFeedback === 'social') {
      setSocialSaved(true);
      setTimeout(() => setSocialSaved(false), 3000);
    } else if (specificFeedback === 'delivery') {
      setDeliverySettingsSaved(true);
      setTimeout(() => setDeliverySettingsSaved(false), 3000);
    } else if (specificFeedback === 'rate') {
      setLbpRateSaved(true);
      setTimeout(() => setLbpRateSaved(false), 3000);
    } else if (specificFeedback === 'password') {
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } else if (specificFeedback === 'slug') {
      setSecretSlugSaved(true);
      setTimeout(() => setSecretSlugSaved(false), 3000);
    }

    setAllSettingsSaved(true);
    setTimeout(() => setAllSettingsSaved(false), 4000);
  };

  const handleSavePhone = (e: React.FormEvent) => handleSaveAllSettings(e, 'phone');
  const handleSaveSocial = (e: React.FormEvent) => handleSaveAllSettings(e, 'social');
  const handleSaveDeliverySettings = (e: React.FormEvent) => handleSaveAllSettings(e, 'delivery');
  const handleSaveLbpRate = (e: React.FormEvent) => handleSaveAllSettings(e, 'rate');
  const handleSavePassword = (e: React.FormEvent) => handleSaveAllSettings(e, 'password');
  const handleSaveSecretSlug = (e: React.FormEvent) => handleSaveAllSettings(e, 'slug');

  const handleCopySecretAdminLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const link = `${origin}/#${adminSecretSlugInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'nasmat-vault-77'}`;
    navigator.clipboard.writeText(link);
    setSecretSlugCopied(true);
    setTimeout(() => setSecretSlugCopied(false), 2500);
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    setCoupons((prev) => [
      ...prev,
      {
        id: `cp-${Date.now()}`,
        code: newCouponCode.trim().toUpperCase(),
        discountPercent: parseInt(newCouponPercent) || 10,
        minOrder: 25,
        active: true,
      },
    ]);
    setNewCouponCode('');
  };

  return (
    <div className="space-y-6 animate-fadeIn text-black">
      
      {/* ================= 1. COUPONS & SAVINGS BUNDLES ================= */}
      {module === 'coupons' && (
        <div className="space-y-6">
          {/* Top Sub-Tabs Navigation */}
          <div className="bg-white border border-neutral-200 p-3 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCouponSubTab('bundles')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  couponSubTab === 'bundles'
                    ? 'bg-black text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-700 hover:text-black hover:bg-neutral-200'
                }`}
              >
                <span>🎁</span>
                <span>{isAr ? 'باقات التوفير وتعديل الأسعار والعطور' : 'Savings Bundles & Pricing'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${couponSubTab === 'bundles' ? 'bg-amber-400 text-black' : 'bg-neutral-200 text-neutral-800'}`}>
                  {bundlesList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCouponSubTab('coupons')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  couponSubTab === 'coupons'
                    ? 'bg-black text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-700 hover:text-black hover:bg-neutral-200'
                }`}
              >
                <span>🏷️</span>
                <span>{isAr ? 'أكواد الكوبونات والخصومات' : 'Discount Coupons'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${couponSubTab === 'coupons' ? 'bg-amber-400 text-black' : 'bg-neutral-200 text-neutral-800'}`}>
                  {coupons.length}
                </span>
              </button>
            </div>

            {couponSubTab === 'bundles' && (
              <button
                type="button"
                onClick={() => setIsAddBundleModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs transition cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة باقة توفير جديدة' : 'Add New Bundle'}</span>
              </button>
            )}
          </div>

          {/* SUB-TAB 1: SAVINGS BUNDLES (Manager Selection & Price Control) */}
          {couponSubTab === 'bundles' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Card */}
              <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold shadow-md">
                      <span className="text-2xl">🎁</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-black font-serif uppercase tracking-wider text-black">
                        {isAr ? 'إدارة باقات التوفير وتعديل الأسعار والعطور' : 'Savings Bundles & Manager Selection'}
                      </h2>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">
                        {isAr
                          ? 'تحكم كامل بأسعار باقات العطور، تحديد العطور من قِبل المدير أو الزبون، وتفعيل الشحن المجاني'
                          : 'Manage bundle pricing, curate fragrance selections, and toggle free delivery'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{bundlesList.filter(b => b.isActive).length} {isAr ? 'باقات معروضة بالمتجر' : 'Active in Store'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bundles Cards List */}
              <div className="space-y-6">
                {bundlesList.map((bundle) => {
                  const savings = Math.max(0, bundle.originalPrice - bundle.price);
                  const discountPct = bundle.originalPrice > 0 ? Math.round((savings / bundle.originalPrice) * 100) : 0;
                  const isSaved = savedBundleId === bundle.id;

                  return (
                    <div
                      key={bundle.id}
                      className={`bg-white border-2 rounded-3xl p-6 shadow-sm transition-all duration-200 space-y-6 ${
                        bundle.isActive ? 'border-neutral-200 hover:border-black' : 'border-dashed border-neutral-300 opacity-80'
                      }`}
                    >
                      {/* Top Bar: Image, Badges & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                        <div className="flex items-center gap-3">
                          <img
                            src={bundle.imageUrl || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80'}
                            alt={bundle.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-neutral-200 shadow-sm shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-black">
                                {bundle.name || (isAr ? 'باقة بدون اسم' : 'Unnamed Bundle')}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-[10px] font-bold border border-neutral-200">
                                {bundle.bottlesCount} {isAr ? 'عبوات' : 'Bottles'} ({bundle.bottleSizeMl}ml)
                              </span>
                              {bundle.freeDelivery && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                                  🚚 {isAr ? 'شحن مجاني' : 'Free Shipping'}
                                </span>
                              )}
                              {bundle.isFeatured && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                                  🔥 {isAr ? 'الأكثر طلباً' : 'Featured'}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-neutral-500 block mt-0.5">
                              {bundle.subtitle}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Active / Inactive Toggle */}
                          <button
                            type="button"
                            onClick={() => handleUpdateSingleBundle(bundle.id, { isActive: !bundle.isActive })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              bundle.isActive
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border border-neutral-300'
                            }`}
                          >
                            {bundle.isActive ? (isAr ? 'معروضة بالمتجر ✓' : 'Visible in Store ✓') : (isAr ? 'مخفية مؤقتاً ✕' : 'Hidden ✕')}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteBundle(bundle.id)}
                            className="p-2 rounded-xl bg-neutral-100 hover:bg-rose-100 text-neutral-500 hover:text-rose-600 transition cursor-pointer"
                            title={isAr ? 'حذف الباقة' : 'Delete Bundle'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Main Fields Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        {/* Bundle Name */}
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">
                            {isAr ? 'اسم الباقة في المتجر *' : 'Bundle Name *'}
                          </label>
                          <input
                            type="text"
                            value={bundle.name}
                            onChange={(e) => handleUpdateSingleBundle(bundle.id, { name: e.target.value })}
                            placeholder=""
                            className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-bold focus:outline-none focus:border-black"
                          />
                        </div>

                        {/* Subtitle */}
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">
                            {isAr ? 'الوصف الفرعي *' : 'Subtitle *'}
                          </label>
                          <input
                            type="text"
                            value={bundle.subtitle}
                            onChange={(e) => handleUpdateSingleBundle(bundle.id, { subtitle: e.target.value })}
                            placeholder=""
                            className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 focus:outline-none focus:border-black"
                          />
                        </div>

                        {/* Selling Price ($) - Primary Request */}
                        <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-2xl">
                          <label className="font-black text-amber-950 block mb-1 flex items-center justify-between">
                            <span>{isAr ? 'سعر البيع المعتمد ($) *' : 'Selling Price ($) *'}</span>
                            <span className="text-[10px] text-amber-800 font-normal">سعر الزبون</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-auto right-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">$</span>
                            <input
                              type="number"
                              step="0.5"
                              min="1"
                              value={bundle.price}
                              onChange={(e) => handleUpdateSingleBundle(bundle.id, { price: parseFloat(e.target.value) || 0 })}
                              placeholder=""
                              className="w-full p-2 pr-7 rounded-xl bg-white border border-amber-300 font-mono font-black text-sm text-black focus:outline-none focus:border-black"
                            />
                          </div>
                          <span className="text-[10px] text-neutral-600 block mt-1 font-mono">
                            ~{Math.round(bundle.price * (settings.lbpRate || 90000)).toLocaleString()} L.L.
                          </span>
                        </div>

                        {/* Original Price ($) - Crossed Out */}
                        <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-2xl">
                          <label className="font-bold text-neutral-700 block mb-1 flex items-center justify-between">
                            <span>{isAr ? 'السعر الأصلي المشطوب ($)' : 'Original Crossed Price ($)'}</span>
                            <span className="text-[10px] text-neutral-500 font-normal">قبل التخفيض</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-auto right-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">$</span>
                            <input
                              type="number"
                              step="0.5"
                              min="1"
                              value={bundle.originalPrice}
                              onChange={(e) => handleUpdateSingleBundle(bundle.id, { originalPrice: parseFloat(e.target.value) || 0 })}
                              placeholder=""
                              className="w-full p-2 pr-7 rounded-xl bg-white border border-neutral-300 font-mono font-bold text-sm text-neutral-700 focus:outline-none focus:border-black"
                            />
                          </div>
                          <span className="text-[10px] text-emerald-600 block mt-1 font-bold">
                            {isAr ? `توفير: $${savings.toFixed(2)} (${discountPct}% خصم)` : `Save: $${savings.toFixed(2)} (${discountPct}%)`}
                          </span>
                        </div>
                      </div>

                      {/* Specifications & Toggles Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">
                            {isAr ? 'عدد العطور في الباقة:' : 'Number of Bottles:'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={bundle.bottlesCount}
                            onChange={(e) => handleUpdateSingleBundle(bundle.id, { bottlesCount: parseInt(e.target.value) || 1 })}
                            placeholder=""
                            className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono font-bold focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">
                            {isAr ? 'سعة كل زجاجة (مل):' : 'Bottle Size (ml):'}
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="250"
                            value={bundle.bottleSizeMl}
                            onChange={(e) => handleUpdateSingleBundle(bundle.id, { bottleSizeMl: parseInt(e.target.value) || 50 })}
                            placeholder=""
                            className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono font-bold focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">
                            {isAr ? 'رابط صورة الباقة:' : 'Image URL:'}
                          </label>
                          <input
                            type="text"
                            value={bundle.imageUrl || ''}
                            onChange={(e) => handleUpdateSingleBundle(bundle.id, { imageUrl: e.target.value })}
                            placeholder=""
                            className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono text-[11px] focus:outline-none focus:border-black"
                          />
                        </div>

                        <div className="flex flex-col justify-center space-y-2 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!bundle.freeDelivery}
                              onChange={(e) => handleUpdateSingleBundle(bundle.id, { freeDelivery: e.target.checked })}
                              className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                            />
                            <span className="font-bold text-neutral-800">
                              🚚 {isAr ? 'شحن مجاني لكافة لبنان ($0 توصيل)' : 'Free Lebanon Delivery ($0)'}
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!bundle.isFeatured}
                              onChange={(e) => handleUpdateSingleBundle(bundle.id, { isFeatured: e.target.checked })}
                              className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                            />
                            <span className="font-bold text-neutral-800">
                              🔥 {isAr ? 'تمييز كباقة الأكثر طلباً (Featured)' : 'Featured Bestseller Badge'}
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Perfume Selection Mode: Manager Curated vs Customer Choice */}
                      <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs font-black text-black flex items-center gap-1.5">
                            <span>🧪</span>
                            <span>{isAr ? 'طريقة اختيار عطور الباقة:' : 'Fragrance Selection Mode:'}</span>
                          </span>

                          <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer font-bold">
                              <input
                                type="radio"
                                name={`selectionMode-${bundle.id}`}
                                checked={bundle.selectionMode !== 'custom'}
                                onChange={() => handleUpdateSingleBundle(bundle.id, { selectionMode: 'all' })}
                                className="cursor-pointer"
                              />
                              <span>{isAr ? 'الزبون يختار العطور بنفسه في المتجر' : 'Customer picks from catalog'}</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer font-bold">
                              <input
                                type="radio"
                                name={`selectionMode-${bundle.id}`}
                                checked={bundle.selectionMode === 'custom'}
                                onChange={() => handleUpdateSingleBundle(bundle.id, { selectionMode: 'custom' })}
                                className="cursor-pointer"
                              />
                              <span>{isAr ? 'المدير يحدد عطور الباقة حصرياً' : 'Manager pre-selects fragrances'}</span>
                            </label>
                          </div>
                        </div>

                        {/* When Manager Curates Perfumes */}
                        {bundle.selectionMode === 'custom' && (
                          <div className="pt-2 border-t border-neutral-200 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[11px] text-neutral-600 font-bold">
                                {isAr ? `حدد العطور المتضمنة في هذه الباقة (المحدد حالياً: ${bundle.selectedItemIds.length} عطور):` : `Select fragrances included in this bundle (${bundle.selectedItemIds.length} selected):`}
                              </p>
                              <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                                {bundle.selectedItemIds.length === bundle.bottlesCount ? (isAr ? 'مكتملة تماماً ✓' : 'Exact match ✓') : (isAr ? `الموصى به: ${bundle.bottlesCount} عطور` : `Recommended: ${bundle.bottlesCount}`)}
                              </span>
                            </div>

                            {/* Perfumes checklist grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 bg-white rounded-xl border border-neutral-200">
                              {allStorePerfumes.map((perfume) => {
                                const isChecked = bundle.selectedItemIds.includes(perfume.id);
                                return (
                                  <button
                                    key={perfume.id}
                                    type="button"
                                    onClick={() => {
                                      const nextIds = isChecked
                                        ? bundle.selectedItemIds.filter(id => id !== perfume.id)
                                        : [...bundle.selectedItemIds, perfume.id];
                                      handleUpdateSingleBundle(bundle.id, { selectedItemIds: nextIds });
                                    }}
                                    className={`p-2 rounded-xl border text-start flex items-center gap-2 transition cursor-pointer ${
                                      isChecked
                                        ? 'bg-black text-white border-black font-bold shadow-xs'
                                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                                    }`}
                                  >
                                    <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0 border-current">
                                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-[11px] block truncate">{perfume.name}</span>
                                      <span className="text-[9px] opacity-70 block truncate">{perfume.brand}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer: Save Confirmation */}
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          {isSaved ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5 animate-fadeIn">
                              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                              <span>{isAr ? 'تم حفظ التعديلات وتحديث السعر في المتجر بنجاح ✓' : 'Bundle updated successfully ✓'}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-400">
                              {isAr ? 'يتم حفظ أي تعديل تلقائياً في المتجر وقاعدة البيانات' : 'Changes save automatically to store'}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSaveAllBundles(bundlesList, bundle.id)}
                          className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Bundle Modal */}
              {isAddBundleModalOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
                  onClick={() => setIsAddBundleModalOpen(false)}
                >
                  <div
                    className="bg-white text-black w-full max-w-xl rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎁</span>
                        <h3 className="font-bold text-sm">
                          {isAr ? 'إنشاء باقة توفير جديدة' : 'Create New Savings Bundle'}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddBundleModalOpen(false)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleAddNewBundleSubmit} className="p-6 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">
                            {isAr ? 'اسم الباقة *' : 'Bundle Name *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={newBundleName}
                            onChange={(e) => setNewBundleName(e.target.value)}
                            placeholder=""
                            className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-bold focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">
                            {isAr ? 'الوصف المختصر *' : 'Subtitle *'}
                          </label>
                          <input
                            type="text"
                            value={newBundleSubtitle}
                            onChange={(e) => setNewBundleSubtitle(e.target.value)}
                            placeholder=""
                            className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">
                            {isAr ? 'سعر البيع ($) *' : 'Selling Price ($) *'}
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            required
                            value={newBundlePrice}
                            onChange={(e) => setNewBundlePrice(parseFloat(e.target.value) || 0)}
                            placeholder=""
                            className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono font-bold focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">
                            {isAr ? 'السعر الأصلي ($) *' : 'Original Price ($) *'}
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            required
                            value={newBundleOriginalPrice}
                            onChange={(e) => setNewBundleOriginalPrice(parseFloat(e.target.value) || 0)}
                            placeholder=""
                            className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">
                            {isAr ? 'عدد العطور في الباقة:' : 'Bottles Count:'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={newBundleBottlesCount}
                            onChange={(e) => setNewBundleBottlesCount(parseInt(e.target.value) || 1)}
                            placeholder=""
                            className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono font-bold focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-neutral-700 block mb-1">
                            {isAr ? 'سعة كل عبوة (مل):' : 'Bottle Size (ml):'}
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="250"
                            value={newBundleBottleSize}
                            onChange={(e) => setNewBundleBottleSize(parseInt(e.target.value) || 50)}
                            placeholder=""
                            className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer font-bold">
                          <input
                            type="checkbox"
                            checked={newBundleFreeDelivery}
                            onChange={(e) => setNewBundleFreeDelivery(e.target.checked)}
                            className="w-4 h-4 rounded text-black cursor-pointer"
                          />
                          <span>🚚 {isAr ? 'شحن مجاني' : 'Free Delivery'}</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer font-bold">
                          <input
                            type="checkbox"
                            checked={newBundleFeatured}
                            onChange={(e) => setNewBundleFeatured(e.target.checked)}
                            className="w-4 h-4 rounded text-black cursor-pointer"
                          />
                          <span>🔥 {isAr ? 'تمييز كالأكثر طلباً' : 'Featured Bestseller'}</span>
                        </label>
                      </div>

                      <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsAddBundleModalOpen(false)}
                          className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black font-bold transition cursor-pointer"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold transition cursor-pointer shadow-md"
                        >
                          {isAr ? 'إضافة الباقة وحفظها ✓' : 'Add Bundle ✓'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: DISCOUNT COUPONS */}
          {couponSubTab === 'coupons' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              <div className="md:col-span-2 space-y-3">
                <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs">
                    <thead className="bg-neutral-100/80 font-bold text-neutral-600">
                      <tr>
                        <th className="py-3 px-4 text-start">{isAr ? 'كود الكوبون' : 'Code'}</th>
                        <th className="py-3 px-3 text-center">{isAr ? 'قيمة الخصم' : 'Discount'}</th>
                        <th className="py-3 px-3 text-center">{isAr ? 'الحد الأدنى' : 'Min Order'}</th>
                        <th className="py-3 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                        <th className="py-3 px-3 text-center">{isAr ? 'حذف' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {coupons.map((cp) => (
                        <tr key={cp.id} className="hover:bg-neutral-50">
                          <td className="py-3 px-4 font-mono font-bold text-black">{cp.code}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">
                            {cp.discountPercent > 0 ? `${cp.discountPercent}% OFF` : (isAr ? 'توصيل مجاني' : 'Free Ship')}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-neutral-600">${cp.minOrder}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {isAr ? 'فعّال' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setCoupons(coupons.filter(c => c.id !== cp.id))}
                              className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-black">
                  {isAr ? 'إضافة كوبون جديد' : 'Create New Coupon'}
                </h3>
                <form onSubmit={handleAddCoupon} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-neutral-600 font-bold mb-1">{isAr ? 'كود الكوبون:' : 'Coupon Code:'}</label>
                    <input
                      type="text"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      placeholder=""
                      className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono uppercase focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-600 font-bold mb-1">{isAr ? 'نسبة الخصم (%):' : 'Discount (%):'}</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={newCouponPercent}
                      onChange={(e) => setNewCouponPercent(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm hover:bg-neutral-800"
                  >
                    {isAr ? 'إضافة الكوبون' : 'Add Coupon'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 2. CATEGORIES ================= */}
      {module === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold">
                  <Folder className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black font-serif uppercase tracking-wider">
                    {isAr ? 'أقسام وتصنيفات المتجر (صور قابلة للتعديل)' : 'Storefront Categories & Navigation Photos'}
                  </h2>
                  <p className="text-xs text-neutral-500 font-medium">
                    {isAr ? 'تخصيص وتعديل صور الأقسام الدائرية وروابط المتجر — رفع من الجهاز أو وضع رابط' : 'Customize circular photos, labels and counts'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openAddNewCategory}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>{isAr ? '➕ إضافة قسم جديد' : '+ Add New Category'}</span>
                </button>
                <button
                  onClick={() => openAdminCategoryEdit(adminNavCategories[0])}
                  className="px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <span>{isAr ? 'تعديل الصور' : 'Edit Photos'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Editable Category Photo Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminNavCategories.map((cat) => (
              <div key={cat.id} className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs space-y-3 hover:border-black transition-all flex flex-col justify-between group">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-300 group-hover:border-black shadow-sm shrink-0 bg-neutral-100 p-0.5">
                    <img 
                      src={cat.imageUrl} 
                      alt={cat.labelAr} 
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-black">{isAr ? cat.labelAr : cat.labelEn}</h4>
                    <p className="text-xs text-neutral-500 font-medium">{isAr ? cat.countAr : cat.countEn}</p>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      {isAr ? 'صورة مخصصة نشطة' : 'Active Photo'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openAdminCategoryEdit(cat)}
                    className="flex-1 py-2 px-3 rounded-xl border border-neutral-300 hover:border-black hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-neutral-600" />
                    <span>{isAr ? 'تعديل' : 'Edit'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAdminCategory(cat.id, cat.labelAr)}
                    className="py-2 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    title={isAr ? 'حذف هذا القسم' : 'Delete Category'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Blacklisted / Deleted Categories Card for Full Transparency */}
          {Array.from(loadDeletedNavCategoryIds()).filter(
            (id) => !['bundles', 'delivery', 'التوصيل والدفع', 'باقات التوفير', 'delivery & cod'].includes(id.toLowerCase())
          ).length > 0 && (
            <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black font-serif uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>{isAr ? 'قائمة الأقسام المحذوفة من المتجر (المحظورة)' : 'Deleted & Blocked Categories'}</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {isAr
                      ? 'هذه الأقسام تم حذفها نهائياً ومحظور ظهورها في المتجر أو شريط التنقل. يمكنك استرجاع أي قسم بنقرة واحدة.'
                      : 'These categories have been permanently blocked from the storefront. You can restore any category anytime.'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from(loadDeletedNavCategoryIds())
                  .filter(
                    (id) => !['bundles', 'delivery', 'التوصيل والدفع', 'باقات التوفير', 'delivery & cod'].includes(id.toLowerCase())
                  )
                  .map((delId) => {
                    const original = INITIAL_NAV_CATEGORIES.find((c) => c.id === delId);
                    const label = original ? (isAr ? original.labelAr : original.labelEn) : delId;
                    return (
                      <div key={delId} className="p-3.5 rounded-2xl bg-white border border-neutral-200 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="space-y-0.5 min-w-0">
                          <span className="font-bold text-xs text-neutral-700 block truncate">{label}</span>
                          <span className="text-[10px] text-neutral-400 font-mono block">ID: {delId}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            unrecordDeletedNavCategoryId(delId);
                            if (original && !adminNavCategories.some((c) => c.id === delId)) {
                              const restored = [...adminNavCategories, original];
                              setAdminNavCategories(restored);
                              saveNavCategories(restored);
                            }
                            window.dispatchEvent(new Event('nasamat_categories_updated'));
                            setCategoryToast(
                              isAr
                                ? `↺ تم استرجاع قسم "${label}" للمتجر بنجاح`
                                : `Restored category "${label}" successfully`
                            );
                            setTimeout(() => setCategoryToast(null), 3500);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-neutral-300 hover:border-black hover:bg-neutral-50 text-[11px] font-bold text-neutral-800 transition flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <span>{isAr ? '↺ استرجاع' : 'Restore'}</span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Olfactory Families Breakdown */}
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-sm font-black font-serif uppercase tracking-wider text-black">
              {isAr ? 'العائلات العطرية وتوزيع العطور عليها' : 'Olfactory Families'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {categoriesList.map((cat) => (
                <div key={cat.id} className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <div className="font-bold text-neutral-900">{isAr ? cat.nameAr : cat.nameEn}</div>
                  <div className="text-[11px] text-neutral-500">{cat.count} {isAr ? 'عطور مسجلة' : 'perfumes'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. HERO BANNER & CARDS ================= */}
      {module === 'hero-banner' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black font-serif uppercase tracking-wider">
                  {isAr ? 'تخصيص بنر المتجر وكروت العرض' : 'Hero Banner & Store Cards'}
                </h2>
                <p className="text-xs text-neutral-500 font-medium">
                  {isAr ? 'تعديل النصوص والشعارات الترويجية المعروضة للزبائن في الصفحة الرئيسية' : 'Customize storefront banners and announcement texts'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4 max-w-2xl text-xs">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">{isAr ? 'نص الكبسولة العلوية (Hero Pill):' : 'Top Pill Badge:'}</label>
              <input
                type="text"
                value={heroPill}
                onChange={(e) => setHeroPill(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-700 mb-1">{isAr ? 'عنوان البنر الرئيسي (Hero Title):' : 'Hero Title:'}</label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-700 mb-1">{isAr ? 'الوصف الفرعي الفاخر:' : 'Luxury Subtitle:'}</label>
              <textarea
                rows={3}
                value={heroBio}
                onChange={(e) => setHeroBio(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300"
              />
            </div>
            <button
              onClick={() => {
                setHeroBannerSaved(true);
                setTimeout(() => setHeroBannerSaved(false), 2000);
              }}
              className="py-2.5 px-6 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-800"
            >
              {heroBannerSaved ? (isAr ? 'تم حفظ التعديلات ✅' : 'Saved ✅') : (isAr ? 'حفظ إعدادات البنر' : 'Save Banner Settings')}
            </button>
          </div>
        </div>
      )}

      {/* ================= 4. BRANDS ================= */}
      {module === 'brands' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black font-serif uppercase tracking-wider">
                  {isAr ? 'الماركات ودور العطور العالمية' : 'Fragrance Brands & Houses'}
                </h2>
                <p className="text-xs text-neutral-500 font-medium">
                  {isAr ? 'قائمة دور العطور المتوفرة بالمختبر مع إحصائيات الأسعار وعدد العطور' : 'Catalog of fragrance houses and perfume collections'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {brandList.map((b) => (
              <div key={b.brand} className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-xs space-y-1">
                <div className="font-bold text-sm text-black truncate">{b.brand}</div>
                <div className="text-xs text-neutral-500">{b.count} {isAr ? 'عطور متاحة' : 'perfumes'}</div>
                <div className="text-[11px] font-mono font-bold text-neutral-700 pt-1 border-t border-neutral-100">
                  ${b.minPrice} - ${b.maxPrice} (50ml)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 5. MENU BUILDER ================= */}
      {module === 'menu-builder' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold">
                  <MenuIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black font-serif uppercase tracking-wider">
                    {isAr ? 'بناء قوائم وروابط المتجر (صور قابلة للتعديل)' : 'Storefront Menu Builder'}
                  </h2>
                  <p className="text-xs text-neutral-500 font-medium">
                    {isAr ? 'التحكم في أزرار التنقل الرئيسية وصور الأقسام وروابط التذييل' : 'Configure navigation links and boutique collections'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => openAdminCategoryEdit(adminNavCategories[0])}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>{isAr ? 'تعديل الصور' : 'Edit Photos'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-3 max-w-2xl text-xs">
            {adminNavCategories.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-black transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-neutral-300 shadow-2xs shrink-0 bg-white">
                    <img
                      src={item.imageUrl}
                      alt={item.labelAr}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                  </div>
                  <div>
                    <span className="font-bold text-black block">{isAr ? item.labelAr : item.labelEn}</span>
                    <span className="text-[10px] text-neutral-500">{isAr ? item.countAr : item.countEn}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openAdminCategoryEdit(item)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-300 hover:border-black bg-white text-neutral-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-neutral-600" />
                    <span>{isAr ? 'تعديل الصورة' : 'Edit'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAdminCategory(item.id, item.labelAr)}
                    className="p-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-2xs"
                    title={isAr ? 'حذف هذا القسم' : 'Delete Category'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {isAr ? 'مفعّل' : 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 6. CRM & CUSTOMERS ================= */}
      {module === 'customers' && (
        <div className="space-y-6">
          
          {/* Main Module Header */}
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold shadow-md shrink-0">
                  <Users className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black font-serif uppercase tracking-wider text-black">
                      {isAr ? 'نظام إدارة علاقات الزبائن (CRM) وسجل الخلطات' : 'Customer Relationship Management (CRM)'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase">
                      CRM PRO
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">
                    {isAr 
                      ? 'متابعة سجلات الزبائن، حسابات Google و Apple، تصنيفات VIP، والمقادير المعملية للخلطات بالملل' 
                      : 'Comprehensive customer directory, Google/Apple auth tracking, VIP segmentation, and bespoke formulas'}
                  </p>
                </div>
              </div>

              {/* Sub-Tabs Selector */}
              <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setCustomerSubTab('overview')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    customerSubTab === 'overview'
                      ? 'bg-black text-white shadow-sm font-black'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'نظرة عامة ومؤشرات CRM' : 'CRM Dashboard'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerSubTab('directory')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    customerSubTab === 'directory'
                      ? 'bg-black text-white shadow-sm font-black'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isAr ? `دليل الزبائن (${filteredCrmCustomers.length})` : `Directory (${filteredCrmCustomers.length})`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerSubTab('blends')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    customerSubTab === 'blends'
                      ? 'bg-black text-white shadow-sm font-black'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? `الخلطات بالملل (${filteredCustomerBlends.length})` : `Formulas (${filteredCustomerBlends.length})`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerSubTab('activity')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    customerSubTab === 'activity'
                      ? 'bg-black text-white shadow-sm font-black'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isAr ? 'سجل النشاط ⚡' : 'Activity Feed'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerSubTab('googlesheet')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    customerSubTab === 'googlesheet'
                      ? 'bg-emerald-700 text-white shadow-sm font-black'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-200/50'
                  }`}
                >
                  <GoogleSheetsIcon className="w-3.5 h-3.5" />
                  <span>{isAr ? 'Google Sheets 📊' : 'Google Sheets 📊'}</span>
                  {settings.crmGoogleSheetUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerSubTab('firebase')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    customerSubTab === 'firebase'
                      ? 'bg-black text-white shadow-sm font-black'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <span className="text-amber-500 font-bold">🔥</span>
                  <span>{isAr ? 'ربط Firebase & Google' : 'Firebase Auth'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerSubTab('supabase')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    customerSubTab === 'supabase'
                      ? 'bg-black text-white shadow-sm font-black'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <span className="text-emerald-500 font-bold">⚡</span>
                  <span>{isAr ? 'مزامنة Supabase السحابية' : 'Supabase Sync'}</span>
                  {isSupaConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                </button>
              </div>
            </div>
          </div>

          {/* ================= SUB-TAB 1: CRM OVERVIEW & KPIS ================= */}
          {customerSubTab === 'overview' && (
            <div className="space-y-6">
              {/* 4 Luxury KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-neutral-500">
                    <span className="text-xs font-bold">{isAr ? 'إجمالي قاعدة الزبائن' : 'Total Customers'}</span>
                    <Users className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-black">
                    {crmMetrics.totalCustomers}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <span>{crmMetrics.googleAppleCount} مسجلين عبر Google / Apple</span>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-neutral-500">
                    <span className="text-xs font-bold">{isAr ? 'كبار الزبائن (VIP)' : 'VIP Customers'}</span>
                    <span className="text-base">👑</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-900">
                    {crmMetrics.vipCount}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium">
                    {isAr ? 'أعلى إنفاق وتكرار طلبات' : 'High Lifetime Value'}
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-neutral-500">
                    <span className="text-xs font-bold">{isAr ? 'عشاق الخلطات الحرفية' : 'Bespoke Perfume Clients'}</span>
                    <FlaskConical className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-black">
                    {crmMetrics.connoisseurCount}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-medium">
                    {customerBlendsList.length} {isAr ? 'خلطة معملية مسجلة' : 'blends created'}
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-neutral-500">
                    <span className="text-xs font-bold">{isAr ? 'متوسط قيمة الطلب (AOV)' : 'Avg Order Value'}</span>
                    <span className="text-emerald-500 font-bold text-xs">$</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-600">
                    ${crmMetrics.avgOrderValue.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">
                    إجمالي مبيعات: ${crmMetrics.totalRevenue.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Segmentation & Quick Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Segmentation breakdown */}
                <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="font-bold text-sm text-black flex items-center gap-2">
                      <span>🏷️</span>
                      <span>{isAr ? 'شرائح وتصنيف الزبائن (Customer Segments)' : 'Customer Segmentation'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCustomerSubTab('directory')}
                      className="text-xs font-bold text-neutral-600 hover:text-black underline cursor-pointer"
                    >
                      {isAr ? 'عرض الكل بالدليل ←' : 'View Directory →'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div 
                      onClick={() => { setCrmSegmentFilter('vip'); setCustomerSubTab('directory'); }}
                      className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">👑</span>
                        <div>
                          <span className="text-xs font-black text-amber-950 block">{isAr ? 'كبار الزبائن VIP' : 'VIP High-Value'}</span>
                          <span className="text-[10px] text-amber-800">{isAr ? 'أنفقوا أكثر من $100 أو طلبوا 3 مرات فأكثر' : 'Spent $100+ or 3+ orders'}</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-sm text-amber-950 bg-amber-200 px-2 py-0.5 rounded-lg">
                        {crmMetrics.vipCount}
                      </span>
                    </div>

                    <div 
                      onClick={() => { setCrmSegmentFilter('connoisseur'); setCustomerSubTab('directory'); }}
                      className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between cursor-pointer hover:bg-neutral-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🧪</span>
                        <div>
                          <span className="text-xs font-black text-black block">{isAr ? 'عشاق الصياغة والخلطات الحرفية' : 'Bespoke Atelier Connoisseurs'}</span>
                          <span className="text-[10px] text-neutral-500">{isAr ? 'زبائن قاموا بصياغة عطور خاصة بهم' : 'Customers with bespoke formulas'}</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-sm text-black bg-neutral-200 px-2 py-0.5 rounded-lg">
                        {crmMetrics.connoisseurCount}
                      </span>
                    </div>

                    <div 
                      onClick={() => { setCrmSegmentFilter('regular'); setCustomerSubTab('directory'); }}
                      className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between cursor-pointer hover:bg-neutral-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">⭐</span>
                        <div>
                          <span className="text-xs font-black text-black block">{isAr ? 'زبائن متكررون (Regulars)' : 'Repeat Customers'}</span>
                          <span className="text-[10px] text-neutral-500">{isAr ? 'أكثر من طلب واحد' : '2+ orders placed'}</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-sm text-black bg-neutral-200 px-2 py-0.5 rounded-lg">
                        {customerList.filter(c => c.segment === 'regular').length}
                      </span>
                    </div>

                    <div 
                      onClick={() => { setCrmSegmentFilter('new'); setCustomerSubTab('directory'); }}
                      className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between cursor-pointer hover:bg-neutral-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🆕</span>
                        <div>
                          <span className="text-xs font-black text-black block">{isAr ? 'زبائن جدد (New Clients)' : 'New Clients'}</span>
                          <span className="text-[10px] text-neutral-500">{isAr ? 'الطلب الأول أو حساب جديد' : 'First order or new sign-in'}</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-sm text-black bg-neutral-200 px-2 py-0.5 rounded-lg">
                        {customerList.filter(c => c.segment === 'new').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent CRM Activity Preview */}
                <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="font-bold text-sm text-black flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>{isAr ? 'آخر النشاطات والتفاعلات' : 'Recent Customer Activity'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCustomerSubTab('activity')}
                      className="text-xs font-bold text-neutral-600 hover:text-black underline cursor-pointer"
                    >
                      {isAr ? 'عرض كل النشاطات ←' : 'View Full Feed →'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {crmActivityList.slice(0, 5).map((act) => (
                      <div key={act.id} className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-neutral-300 flex items-center justify-center shrink-0 text-sm shadow-2xs">
                          {act.type === 'login' && '🔑'}
                          {act.type === 'order' && '🛍️'}
                          {act.type === 'blend_created' && '🧪'}
                          {act.type === 'note_added' && '📝'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-black truncate">{act.customerName}</span>
                            <span className="text-[10px] font-mono text-neutral-400">
                              {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-0.5">{act.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW A: BESPOKE CUSTOMER FORMULAS WITH EXACT MILLILITERS */}
          {customerSubTab === 'blends' && (
            <div className="space-y-6">
              
              {/* Filter and Search Bar with Register Button */}
              <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 text-neutral-400 absolute start-3 top-3" />
                  <input
                    type="text"
                    value={blendSearchTerm}
                    onChange={(e) => setBlendSearchTerm(e.target.value)}
                    placeholder={isAr ? 'ابحث باسم الخلطة، الزبون، أو كود الزيت...' : 'Search blend name, customer, or oil code...'}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl ps-9 pe-4 py-2 text-xs font-medium focus:border-black focus:outline-none"
                  />
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenNewCustomerBlendModal()}
                    className="px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? '+ تسجيل خلطة جديدة باسم الزبون 🧪' : '+ Register Blend for Customer'}</span>
                  </button>

                  <div className="text-xs text-neutral-500 font-bold hidden md:block">
                    {isAr 
                      ? `إجمالي الخلطات المسجلة: ${customerBlendsList.length} خلطة` 
                      : `Total saved blends: ${customerBlendsList.length}`}
                  </div>
                </div>
              </div>

              {/* Blends List */}
              {filteredCustomerBlends.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 mx-auto flex items-center justify-center text-2xl text-neutral-400">
                    🧪
                  </div>
                  <h3 className="font-bold text-sm text-black">
                    {isAr ? 'لا توجد خلطات زبائن مسجلة حالياً' : 'No customer bespoke blends found'}
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    {isAr 
                      ? 'عندما يقوم أي زبون بصياغة عطره الخاص في صفحة "ركّب عطرك" وحفظه أو طلبه، ستظهر هنا فوراً مع تفاصيل المقادير بالملل.' 
                      : 'When customers formulate custom blends in the store, they will appear here with exact ml measurements.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {filteredCustomerBlends.map((blend) => {
                    const currentSize = selectedBlendSizes[blend.id] || blend.sizeMl || 50;
                    const totalOilMl = Number((currentSize * 0.25).toFixed(2));
                    const alcoholMl = Number((currentSize - totalOilMl).toFixed(2));

                    return (
                      <div
                        key={blend.id}
                        className="bg-white border border-neutral-200 hover:border-black rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                      >
                        <div className="space-y-4">
                          
                          {/* Card Top Details */}
                          <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                                  {isAr ? 'تركيبة زبون خاصة' : 'Bespoke Customer Blend'}
                                </span>
                                <span className="font-mono text-[10px] text-neutral-400">
                                  {new Date(blend.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="font-serif font-black text-xl text-black mt-1.5">
                                {blend.name}
                              </h3>
                              {blend.customerName && (
                                <p className="text-xs text-neutral-600 font-semibold mt-0.5">
                                  👤 {isAr ? 'الزبون / الإهداء:' : 'Customer:'} <span className="text-black font-bold">{blend.customerName}</span>
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteBlend(blend.id)}
                              className="text-neutral-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title={isAr ? 'حذف من السجل' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Dynamic Size Recalculator Controls for Perfumer */}
                          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-neutral-700 flex items-center gap-1.5">
                              <span>🧴</span>
                              <span>{isAr ? 'حساب المقادير حسب سعة الزجاجة:' : 'Recalculate for Size:'}</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              {[30, 50, 100].map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => setSelectedBlendSizes(prev => ({ ...prev, [blend.id]: sz }))}
                                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
                                    currentSize === sz
                                      ? 'bg-black text-white shadow-xs'
                                      : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                                  }`}
                                >
                                  {sz} ml
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* EXACT MILLILITERS FORMULATION TABLE */}
                          <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
                            <table className="w-full text-xs">
                              <thead className="bg-neutral-100 font-bold text-neutral-700">
                                <tr>
                                  <th className="py-2.5 px-3 text-start">#</th>
                                  <th className="py-2.5 px-3 text-start">{isAr ? 'الزيت العطري المطلوب' : 'Oil Name'}</th>
                                  <th className="py-2.5 px-2 text-center">{isAr ? 'الكود' : 'Code'}</th>
                                  <th className="py-2.5 px-2 text-center">{isAr ? 'النسبة' : 'Ratio'}</th>
                                  <th className="py-2.5 px-3 text-end">{isAr ? 'المقدار بالملل (ml)' : 'Amount (ml)'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200">
                                {blend.ingredients.map((ing, i) => {
                                  const ingMl = Number(((totalOilMl * ing.percentage) / 100).toFixed(2));
                                  return (
                                    <tr key={ing.oilId} className="hover:bg-neutral-50/80">
                                      <td className="py-2.5 px-3 text-neutral-400 font-mono text-[11px]">{i + 1}</td>
                                      <td className="py-2.5 px-3 font-bold text-black">
                                        {ing.oilName}
                                        {ing.oilBrand && (
                                          <span className="text-[10px] text-neutral-400 block font-normal">
                                            {ing.oilBrand}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-2 text-center font-mono text-[11px] font-bold text-neutral-600">
                                        {ing.oilCode || '-'}
                                      </td>
                                      <td className="py-2.5 px-2 text-center font-mono font-bold text-neutral-700">
                                        {ing.percentage}%
                                      </td>
                                      <td className="py-2.5 px-3 text-end font-mono font-black text-amber-700 text-sm">
                                        {ingMl.toFixed(2)} ملل
                                      </td>
                                    </tr>
                                  );
                                })}

                                {/* Total Pure Oils Row */}
                                <tr className="bg-amber-50/70 border-t-2 border-amber-300 font-bold">
                                  <td colSpan={4} className="py-2 px-3 text-amber-950 font-black">
                                    {isAr ? '● مجموع الزيوت العطرية (تركيز إكستري):' : 'Total Fragrance Oils (Extrait):'}
                                  </td>
                                  <td className="py-2 px-3 text-end font-mono font-black text-amber-900 text-sm">
                                    {totalOilMl.toFixed(2)} ملل
                                  </td>
                                </tr>

                                {/* Alcohol Solvent Row */}
                                <tr className="bg-emerald-50/70 font-bold">
                                  <td colSpan={4} className="py-2 px-3 text-emerald-950 font-black">
                                    {isAr ? '● كحول عطري نقي 96% (المذيب):' : 'Perfumer Pure Alcohol 96%:'}
                                  </td>
                                  <td className="py-2 px-3 text-end font-mono font-black text-emerald-800 text-sm">
                                    {alcoholMl.toFixed(2)} ملل
                                  </td>
                                </tr>

                                {/* Final Total Bottle Volume */}
                                <tr className="bg-black text-white font-black">
                                  <td colSpan={4} className="py-2 px-3 text-white">
                                    {isAr ? '★ سعة القارورة الصافية:' : 'Total Bottle Capacity:'}
                                  </td>
                                  <td className="py-2 px-3 text-end font-mono text-white text-sm">
                                    {currentSize}.00 ملل
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                          <div className="text-xs">
                            <span className="text-neutral-500 block text-[10px] uppercase font-mono">{isAr ? 'سعر التركيب:' : 'Price:'}</span>
                            <span className="font-mono font-black text-base text-black">
                              ${(currentSize === 30 ? 5 : currentSize === 50 ? 8 : 14).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {onOpenBottleLabel && (
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenBottleLabel({
                                    perfumeName: blend.name,
                                    brand: 'NASMAT Haute Parfumerie',
                                    customerName: blend.customerName,
                                    bottleSizeMl: currentSize,
                                    concentrationPercent: 25,
                                    concentrationTier: 'Extrait de Parfum',
                                    batchNumber: blend.id || `LOT-${Date.now().toString().slice(-6)}`,
                                    formulationDate: new Date(blend.createdAt || Date.now()).toLocaleDateString('en-GB'),
                                    notes: blend.ingredients.map(i => `${i.oilName} (${i.percentage}%)`).join(' • '),
                                    ingredientsText: 'Alcohol Denat 96%, Parfum (Fragrance Oils), Fixative 1.5%, Aqua.',
                                  });
                                }}
                                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                                title={isAr ? 'طباعة ملصق / ليبل الزجاجة الحراري الفاخر' : 'Print Luxury Bottle Sticker Label'}
                              >
                                <Tag className="w-3.5 h-3.5 text-amber-700" />
                                <span>{isAr ? '🏷️ ليبل الزجاجة' : 'Bottle Label'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setPrintingBlend({
                                  ...blend,
                                  sizeMl: currentSize,
                                  totalOilMl,
                                  alcoholMl,
                                });
                              }}
                              className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                            >
                              <Printer className="w-3.5 h-3.5 text-white" />
                              <span>{isAr ? 'طباعة بطاقة المعمل 🖨️' : 'Print Lab Ticket'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* VIEW B: CRM CUSTOMER DIRECTORY (قاعدة بيانات الزبائن والمبيعات) */}
          {customerSubTab === 'directory' && (
            <div className="space-y-4">
              {/* Filter pills and Search Bar */}
              <div className="bg-white border border-neutral-200 p-4 rounded-3xl shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-neutral-400 absolute start-3 top-3" />
                    <input
                      type="text"
                      value={crmDirectorySearch}
                      onChange={(e) => setCrmDirectorySearch(e.target.value)}
                      placeholder={isAr ? 'ابحث بالاسم، الهاتف، البريد أو الملاحظة...' : 'Search customer, phone, email, notes...'}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl ps-9 pe-4 py-2 text-xs font-medium focus:border-black focus:outline-none"
                    />
                  </div>

                  {/* Segment Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    {[
                      { id: 'all', label: isAr ? 'الكل' : 'All' },
                      { id: 'vip', label: isAr ? '👑 VIP' : 'VIP' },
                      { id: 'regular', label: isAr ? '⭐ دائمون' : 'Regular' },
                      { id: 'connoisseur', label: isAr ? '🧪 خلطات' : 'Bespoke' },
                      { id: 'new', label: isAr ? '🆕 جدد' : 'New' },
                    ].map((seg) => (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => setCrmSegmentFilter(seg.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          crmSegmentFilter === seg.id
                            ? 'bg-black text-white shadow-xs'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {seg.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleExportGoogleSheetCsv}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition"
                      title={isAr ? 'تصدير جدول الزبائن بصيغة CSV لـ Google Sheets' : 'Export CSV for Google Sheets'}
                    >
                      <GoogleSheetsIcon className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تصدير Sheets (CSV)' : 'Export CSV'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyForGoogleSheet}
                      className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition"
                      title={isAr ? 'نسخ البيانات بالكامل للصقها مباشرة في أي Google Sheet بـ Ctrl+V' : 'Copy for direct paste into Google Sheets'}
                    >
                      <span>{copiedForSheet ? '✅' : '📋'}</span>
                      <span>{copiedForSheet ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ لـ Sheet' : 'Copy TSV')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomerSubTab('googlesheet')}
                      className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition"
                      title={isAr ? 'فتح لوحة مزامنة Google Sheets المباشرة' : 'Open Live Google Sheets Sync'}
                    >
                      <GoogleSheetsIcon className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مزامنة Sheets 🔄' : 'Sync Sheets'}</span>
                    </button>

                    {/* Add Blend Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenNewCustomerBlendModal()}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تركيب خلطة لزبون 🧪' : 'New Customer Blend'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CRM Customer Directory Table */}
              <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-neutral-100/80 font-bold text-neutral-700 uppercase">
                      <tr>
                        <th className="py-3 px-4 text-start">{isAr ? 'الزبون والحساب' : 'Customer & Auth'}</th>
                        <th className="py-3 px-3 text-start">{isAr ? 'الشريحة' : 'Segment'}</th>
                        <th className="py-3 px-3 text-start">{isAr ? 'الاتصال' : 'Contact'}</th>
                        <th className="py-3 px-3 text-center">{isAr ? 'الطلبات' : 'Orders'}</th>
                        <th className="py-3 px-3 text-center">{isAr ? 'إجمالي المشتريات' : 'Total Spent'}</th>
                        <th className="py-3 px-3 text-center">{isAr ? 'خلطات خاصة' : 'Blends'}</th>
                        <th className="py-3 px-4 text-start">{isAr ? 'ملاحظة التاجر (CRM Note)' : 'Merchant Note'}</th>
                        <th className="py-3 px-4 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredCrmCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-neutral-500">
                            {isAr ? 'لا يوجد زبائن مطابقين لمعايير البحث' : 'No customers match the current filters'}
                          </td>
                        </tr>
                      ) : (
                        filteredCrmCustomers.map((c, idx) => {
                          const blendsForCustomer = customerBlendsList.filter(
                            (b) => b.customerName?.toLowerCase() === c.name.toLowerCase()
                          );
                          return (
                            <tr key={idx} className="hover:bg-neutral-50/80 transition">
                              {/* Customer Name & Auth Badge */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                    {c.avatar ? (
                                      <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{c.name.slice(0, 1)}</span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-black flex items-center gap-1.5">
                                      <span>{c.name}</span>
                                      {c.provider === 'google' && (
                                        <span title="مسجل عبر حساب Google">
                                          <GoogleIcon className="w-3.5 h-3.5" />
                                        </span>
                                      )}
                                      {c.provider === 'apple' && (
                                        <span title="مسجل عبر حساب Apple ID">
                                          <AppleIcon className="w-3.5 h-3.5 text-black" />
                                        </span>
                                      )}
                                      {c.provider === 'email' && (
                                        <span title="مسجل عبر البريد الإلكتروني" className="text-xs">
                                          ✉️
                                        </span>
                                      )}
                                      {c.provider === 'device_passkey' && (
                                        <span title="مسجل عبر Passkey الجهاز">
                                          <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-neutral-400 font-mono">
                                      {isAr ? 'آخر نشاط:' : 'Active:'} {new Date(c.lastDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Segment Badge */}
                              <td className="py-3 px-3">
                                {c.segment === 'vip' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black">
                                    <span>👑</span> VIP
                                  </span>
                                )}
                                {c.segment === 'connoisseur' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 text-sky-950 border border-sky-300 text-[10px] font-bold">
                                    <span>🧪</span> {isAr ? 'عاشق خلطات' : 'Bespoke'}
                                  </span>
                                )}
                                {c.segment === 'regular' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-300 text-[10px] font-bold">
                                    <span>⭐</span> {isAr ? 'دائم' : 'Regular'}
                                  </span>
                                )}
                                {c.segment === 'new' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                    <span>🆕</span> {isAr ? 'جديد' : 'New'}
                                  </span>
                                )}
                              </td>

                              {/* Contact Info */}
                              <td className="py-3 px-3">
                                <div className="space-y-0.5">
                                  {c.phone ? (
                                    <span className="font-mono text-neutral-700 block text-[11px]">{c.phone}</span>
                                  ) : (
                                    <span className="text-neutral-400 text-[11px]">-</span>
                                  )}
                                  {c.email && (
                                    <span className="font-mono text-neutral-500 block text-[10px] truncate max-w-[140px]">{c.email}</span>
                                  )}
                                </div>
                              </td>

                              {/* Orders Count */}
                              <td className="py-3 px-3 text-center font-mono font-bold text-black">
                                {c.ordersCount}
                              </td>

                              {/* Total Spent */}
                              <td className="py-3 px-3 text-center font-mono font-black text-emerald-600">
                                ${c.totalSpent.toFixed(2)}
                              </td>

                              {/* Custom Blends */}
                              <td className="py-3 px-3 text-center">
                                {blendsForCustomer.length > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono font-black text-[11px]">
                                    {blendsForCustomer.length} {isAr ? 'خلطات' : 'blends'}
                                  </span>
                                ) : (
                                  <span className="text-neutral-400">-</span>
                                )}
                              </td>

                              {/* Merchant CRM Notes */}
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-between gap-2 max-w-[200px]">
                                  <span className="text-[11px] text-neutral-600 truncate italic">
                                    {c.notes || (isAr ? 'لا توجد ملاحظات...' : 'No notes...')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCrmCustomerName(c.name);
                                      setEditingCrmNoteText(c.notes || '');
                                    }}
                                    className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition cursor-pointer shrink-0"
                                    title={isAr ? 'تعديل ملاحظة الزبون' : 'Edit CRM Note'}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomerSubTab('blends');
                                      handleOpenNewCustomerBlendModal(c.name);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-[11px] cursor-pointer shadow-2xs transition"
                                    title={isAr ? 'تركيب خلطة باسم الزبون' : 'Formulate Blend'}
                                  >
                                    <FlaskConical className="w-3.5 h-3.5 text-amber-700" />
                                    <span>{isAr ? 'تركيب خلطة' : 'Compound'}</span>
                                  </button>

                                  {c.phone && (
                                    <a
                                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition"
                                      title={isAr ? 'محادثة عبر واتساب' : 'WhatsApp'}
                                    >
                                      <WhatsAppIcon className="w-3.5 h-3.5" />
                                    </a>
                                  )}
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

          {/* ================= SUB-TAB 4: CRM ACTIVITY FEED ================= */}
          {customerSubTab === 'activity' && (
            <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-black flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span>{isAr ? 'سجل نشاطات الزبائن وتفاعلات المتجر (Live Activity Feed)' : 'Customer Activity Stream'}</span>
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isAr ? 'رصد فوري لعمليات تسجيل الدخول بـ Google و Apple والطلبات الجديدة والخلطات' : 'Real-time feed of authentication, bespoke blending, and orders'}
                  </p>
                </div>
                <span className="text-xs font-mono bg-neutral-100 px-3 py-1 rounded-full text-neutral-600">
                  {crmActivityList.length} {isAr ? 'نشاط مسجل' : 'events'}
                </span>
              </div>

              <div className="space-y-3">
                {crmActivityList.map((act) => (
                  <div key={act.id} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start gap-4 hover:border-black transition">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-300 flex items-center justify-center shrink-0 text-lg shadow-2xs">
                      {act.type === 'login' && '🔑'}
                      {act.type === 'order' && '🛍️'}
                      {act.type === 'blend_created' && '🧪'}
                      {act.type === 'note_added' && '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-black">{act.customerName}</span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {new Date(act.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-700 mt-1">{act.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= SUB-TAB 5: FIREBASE CONSOLE & GOOGLE AUTH ================= */}
          {customerSubTab === 'firebase' && (
            <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    <h3 className="font-bold text-base text-black">
                      {isAr ? 'ربط Google Firebase Authentication الرسمي' : 'Official Google Firebase Authentication Hub'}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {isAr 
                      ? 'الربط السحابي الرسمي لتمكين زبائن المتجر من تسجيل الدخول بحسابات Google و Apple الحقيقية وحفظ خلطاتهم' 
                      : 'Connect your Firebase project to enable real Google and Apple Sign-in'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                    isFbConnected 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isFbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                    <span>
                      {isFbConnected 
                        ? (isAr ? 'متصل بنظام المصادقة الرسمي — NASMAT' : 'Connected: NASMAT') 
                        : (isAr ? 'بانتظار إدخال المفاتيح' : 'Setup Required')}
                    </span>
                  </span>
                </div>
              </div>

              {/* Direct Quick Links to Firebase Console & Google Colab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <span>🔥</span>
                      <span>{isAr ? 'وحدة تحكم Firebase Console الرسمية' : 'Firebase Console'}</span>
                    </div>
                    <div className="text-[11px] text-amber-800 font-mono mt-0.5">
                      https://console.firebase.google.com/
                    </div>
                  </div>
                  <a
                    href="https://console.firebase.google.com/u/0/?pli=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <span>{isAr ? 'فتح الكونسول' : 'Open Console'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                      <span>☁️</span>
                      <span>{isAr ? 'منصة Google Colab والحوسبة السحابية' : 'Google Colab Research'}</span>
                    </div>
                    <div className="text-[11px] text-blue-800 font-mono mt-0.5">
                      https://colab.research.google.com/
                    </div>
                  </div>
                  <a
                    href="https://colab.research.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <span>{isAr ? 'فتح Colab' : 'Open Colab'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 4-Step Interactive Integration Guide */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                    <span>📌 خطوات تفعيل Google Sign-In والبريد الإلكتروني (Email Auth) خلال دقيقة واحدة:</span>
                  </h4>
                  <a
                    href="https://console.firebase.google.com/u/0/project/nasmat-95a51/authentication"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>بدء وتفعيل Authentication لمشروع nasmat-95a51</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
                <ol className="text-xs text-neutral-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>
                    <span>افتح </span>
                    <a href="https://console.firebase.google.com/u/0/project/nasmat-95a51/authentication" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">صفحة Authentication</a>
                    <span> في مشروعك واضغط <b>Get started (بدء الاستخدام)</b>.</span>
                  </li>
                  <li>
                    <span>قم بتفعيل كل من: </span>
                    <b className="text-emerald-700">1. Google</b>
                    <span> و </span>
                    <b className="text-emerald-700">2. البريد الإلكتروني / كلمة المرور (Email/Password)</b>.
                  </li>
                  <li>في تبويب <b>Settings &gt; Authorized domains</b> أضف النطاق <code>127.0.0.1</code> أو نطاق موقعك الرسمي.</li>
                  <li>
                    <span>من </span>
                    <a href="https://console.firebase.google.com/u/0/project/nasmat-95a51/settings/general" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">إعدادات المشروع (⚙️)</a>
                    <span> انزل لأسفل عند قسم <b>Your apps</b> وانسخ كود <code>firebaseConfig</code> والصقه في المربع أدناه.</span>
                  </li>
                </ol>
              </div>

              {/* Instant Paste Code Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800 flex items-center justify-between">
                  <span>{isAr ? 'الصق كود الـ SDK (firebaseConfig) هنا للاستخراج التلقائي للمفاتيح:' : 'Paste firebaseConfig snippet:'}</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    استخراج ذكي لجميع الحقول بنقرة واحدة
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={adminFbSnippet}
                  onChange={(e) => {
                    setAdminFbSnippet(e.target.value);
                    const parsed = parseFirebaseConfigSnippet(e.target.value);
                    if (parsed.apiKey || parsed.projectId) {
                      setAdminFbConfig((prev) => ({
                        ...prev,
                        apiKey: parsed.apiKey || prev.apiKey,
                        authDomain: parsed.authDomain || prev.authDomain,
                        projectId: parsed.projectId || prev.projectId,
                        storageBucket: parsed.storageBucket || prev.storageBucket,
                        messagingSenderId: parsed.messagingSenderId || prev.messagingSenderId,
                        appId: parsed.appId || prev.appId,
                        isFirebaseEnabled: true,
                      }));
                      setAdminFbSaveMsg('✓ تم استخراج مفاتيح المشروع تلقائياً من الكود!');
                      setTimeout(() => setAdminFbSaveMsg(''), 3000);
                    }
                  }}
                  placeholder=""
                  className="w-full p-3 rounded-2xl bg-neutral-50 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                />
              </div>

              {/* Feedback Alert */}
              {adminFbSaveMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>{adminFbSaveMsg}</span>
                </div>
              )}

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Web API Key (apiKey) *</label>
                  <input
                    type="text"
                    value={adminFbConfig.apiKey || ''}
                    onChange={(e) => setAdminFbConfig({ ...adminFbConfig, apiKey: e.target.value })}
                    placeholder=""
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Auth Domain *</label>
                  <input
                    type="text"
                    value={adminFbConfig.authDomain || ''}
                    onChange={(e) => setAdminFbConfig({ ...adminFbConfig, authDomain: e.target.value })}
                    placeholder=""
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Project ID *</label>
                  <input
                    type="text"
                    value={adminFbConfig.projectId || ''}
                    onChange={(e) => setAdminFbConfig({ ...adminFbConfig, projectId: e.target.value })}
                    placeholder=""
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">App ID *</label>
                  <input
                    type="text"
                    value={adminFbConfig.appId || ''}
                    onChange={(e) => setAdminFbConfig({ ...adminFbConfig, appId: e.target.value })}
                    placeholder=""
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Storage Bucket (اختياري)</label>
                  <input
                    type="text"
                    value={adminFbConfig.storageBucket || ''}
                    onChange={(e) => setAdminFbConfig({ ...adminFbConfig, storageBucket: e.target.value })}
                    placeholder=""
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Messaging Sender ID (اختياري)</label>
                  <input
                    type="text"
                    value={adminFbConfig.messagingSenderId || ''}
                    onChange={(e) => setAdminFbConfig({ ...adminFbConfig, messagingSenderId: e.target.value })}
                    placeholder=""
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  {isAr ? 'يتم حفظ الإعدادات تلقائياً في المتصفح وتفعيل Google Login فوراً للزبائن' : 'Settings are saved locally and active immediately'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...adminFbConfig, isFirebaseEnabled: true };
                    saveFirebaseConfig(updated);
                    onUpdateSettings({ ...settings, firebaseConfig: updated });
                    setAdminFbSaveMsg(isAr ? '✓ تم حفظ وتفعيل إعدادات Firebase Console بنجاح!' : 'Firebase settings saved successfully!');
                    setTimeout(() => setAdminFbSaveMsg(''), 3000);
                  }}
                  className="px-6 py-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'حفظ إعدادات Firebase وتفعيل Google Sign-In 💾' : 'Save Firebase Settings'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= SUB-TAB 6: SUPABASE CLOUD SYNC ================= */}
          {customerSubTab === 'supabase' && (
            <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <h3 className="font-bold text-base text-black flex items-center gap-2">
                      <span>{isAr ? 'مزامنة Supabase السحابية (Cross-Device Cloud Sync)' : 'Supabase Cloud Database Sync'}</span>
                      {isSupaConnected ? (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{isAr ? 'متصل بالسحابة' : 'Connected'}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                          {isAr ? 'بانتظار الربط' : 'Pending Configuration'}
                        </span>
                      )}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {isAr 
                      ? 'مزامنة فورية حية للمخزون والفواتير وخلطات الزبائن بين الهاتف واللابتوب وكافة الأجهزة' 
                      : 'Live two-way cloud sync for inventory, bespoke blends, and orders across all devices'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:border-black text-black font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🔍</span>
                    <span>{isAr ? 'اختبار الاتصال' : 'Test Connection'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSupabase}
                    className="px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حفظ المفاتيح' : 'Save Keys'}</span>
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {supabaseStatusMsg.text && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  supabaseStatusMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' :
                  supabaseStatusMsg.type === 'error' ? 'bg-rose-50 border border-rose-300 text-rose-900' :
                  'bg-neutral-100 border border-neutral-300 text-neutral-800 animate-pulse'
                }`}>
                  <span>{supabaseStatusMsg.type === 'success' ? '✓' : supabaseStatusMsg.type === 'error' ? '⚠️' : '⏳'}</span>
                  <span>{supabaseStatusMsg.text}</span>
                </div>
              )}

              {/* Step-by-Step Instructions */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>{isAr ? 'كيفية ربط قاعدة بيانات Supabase المجانية في 60 ثانية:' : 'Quick Supabase Setup in 60s:'}</span>
                  </h4>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <span>فتح لوحة Supabase</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
                <ol className="text-xs text-neutral-700 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>أنشئ مشروعاً جديداً مجانياً على <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-800 font-bold underline">Supabase Dashboard</a> باسم <b>nasmat-perfumes</b>.</li>
                  <li>من القائمة الجانبية ادخل إلى <b>Project Settings &gt; API</b>، وانسخ <b>Project URL</b> و <b>anon public key</b> والصقهما في الحقلين أدناه.</li>
                  <li>من القائمة الجانبية ادخل إلى <b>SQL Editor</b> واضغط <b>New query</b>، ثم الصق كود الجداول من الصندوق أدناه واضغط <b>Run</b>.</li>
                </ol>
              </div>

              {/* Supabase Credentials Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800 block">
                    {isAr ? 'رابط المشروع (Project URL):' : 'Project URL:'}
                  </label>
                  <input
                    type="url"
                    value={supabaseConfig.url || ''}
                    onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value.trim() })}
                    placeholder="https://xyzabcdefg.supabase.co"
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800 block">
                    {isAr ? 'المفتاح العام (anon public key):' : 'Anon Public Key:'}
                  </label>
                  <input
                    type="text"
                    value={supabaseConfig.anonKey || ''}
                    onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value.trim() })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Live Sync Controls */}
              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-black flex items-center gap-1.5">
                      <span>🔄</span>
                      <span>{isAr ? 'المزامنة الحية اليدوية بين السحابة وهذا الجهاز' : 'Two-way Manual Cloud Sync'}</span>
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {supabaseConfig.lastSyncAt
                        ? (isAr ? `آخر مزامنة ناجحة: ${new Date(supabaseConfig.lastSyncAt).toLocaleString()}` : `Last synced: ${new Date(supabaseConfig.lastSyncAt).toLocaleString()}`)
                        : (isAr ? 'لم تتم المزامنة بعد' : 'Not synced yet')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSyncing || !isSupaConnected}
                      onClick={handlePushToSupabase}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <span>⬆️</span>
                      <span>{isAr ? 'رفع بيانات هذا الجهاز إلى السحابة' : 'Push Local to Cloud'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSyncing || !isSupaConnected}
                      onClick={handlePullFromSupabase}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <span>⬇️</span>
                      <span>{isAr ? 'سحب أحدث البيانات من السحابة' : 'Pull Cloud to Local'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SQL Schema Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <span>🗄️</span>
                    <span>{isAr ? 'كود إنشاء جداول قاعدة البيانات (SQL Schema):' : 'Database SQL Schema:'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="text-xs font-bold text-black bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg border border-neutral-300 flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        <span>{isAr ? 'نسخ كود SQL بالكامل' : 'Copy SQL Schema'}</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={6}
                  value={SUPABASE_SQL_SCHEMA}
                  className="w-full p-3 rounded-2xl bg-neutral-900 text-neutral-200 font-mono text-[11px] focus:outline-none select-all"
                />
              </div>
            </div>
          )}

          {/* ================= SUB-TAB 6: GOOGLE SHEETS LIVE CRM ================= */}
          {customerSubTab === 'googlesheet' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Banner */}
              <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
                    <GoogleSheetsIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-black font-serif">
                        {isAr ? 'نظام إدارة الزبائن عبر Google Sheets المباشر' : 'Live Google Sheets CRM'}
                      </h3>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        CLOUD SYNC
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      {isAr 
                        ? 'ربط مباشر ومزامنة سحابية تلقائية وتصدير كامل لبيانات الزبائن والطلبات والمبيعات لجدولك في Google Drive'
                        : 'Real-time cloud sync, instant export, and live spreadsheet access for all customer records'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncToGoogleSheet}
                    disabled={isSyncingGoogleSheet}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSyncingGoogleSheet ? '⏳' : '🔄'}</span>
                    <span>{isSyncingGoogleSheet ? (isAr ? 'جاري المزامنة...' : 'Syncing...') : (isAr ? 'مزامنة سحابية للجدول الآن' : 'Sync to Sheet Now')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportGoogleSheetCsv}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <span>📥</span>
                    <span>{isAr ? 'تصدير CSV لـ Google Sheets' : 'Download CSV'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyForGoogleSheet}
                    className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>{copiedForSheet ? '✅' : '📋'}</span>
                    <span>{copiedForSheet ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ للّصق المباشر (Ctrl+V)' : 'Copy for Sheet')}</span>
                  </button>

                  {settings.crmGoogleSheetUrl && (
                    <a
                      href={settings.crmGoogleSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <GoogleSheetsIcon className="w-3.5 h-3.5" />
                      <span>{isAr ? 'فتح جدول Google Sheets ↗️' : 'Open in Google Sheets ↗️'}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Status Message */}
              {googleSheetStatusMsg && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in fade-in duration-200 ${
                  googleSheetStatusMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <span>{googleSheetStatusMsg.type === 'success' ? '✅' : '⚠️'}</span>
                  <span>{googleSheetStatusMsg.text}</span>
                </div>
              )}

              {/* Settings Configuration Card */}
              <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚙️</span>
                    <h4 className="font-bold text-sm text-black">
                      {isAr ? 'إعدادات ربط جدول Google Sheets' : 'Google Sheets Connection Settings'}
                    </h4>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">GOOGLE DRIVE CLOUD SYNC</span>
                </div>

                <form onSubmit={handleSaveGoogleSheetConfig} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-800 block">
                        {isAr ? '1. رابط جدول Google Sheet (للعرض والفتح المباشر):' : '1. Google Sheet URL (View & Embed):'}
                      </label>
                      <input
                        type="url"
                        value={googleSheetUrlInput}
                        onChange={(e) => setGoogleSheetUrlInput(e.target.value)}
                        placeholder=""
                        className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                      />
                      <p className="text-[10px] text-neutral-400">
                        {isAr ? 'رابط ملف Google Sheet في حسابك ليتم تضمينه وفتحه بضغطة زر' : 'Paste your Google Sheet link to embed and view it here'}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-800 block">
                        {isAr ? '2. رابط Webhook للمزامنة الآلية (Google Apps Script Web App URL):' : '2. Google Apps Script Webhook URL (Live Auto-Sync):'}
                      </label>
                      <input
                        type="url"
                        value={googleSheetWebhookInput}
                        onChange={(e) => setGoogleSheetWebhookInput(e.target.value)}
                        placeholder=""
                        className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                      />
                      <p className="text-[10px] text-neutral-400">
                        {isAr ? 'رابط تطبيق الويب الصادر من Apps Script لاستقبال تحديثات الزبائن تلقائياً' : 'Deploy as Web App URL to receive live customer updates'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      {isAr ? 'حفظ إعدادات Google Sheets' : 'Save Google Sheet Settings'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Embedded Google Sheet Live Viewer (if URL provided) */}
              {settings.crmGoogleSheetUrl ? (
                <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <GoogleSheetsIcon className="w-5 h-5" />
                      <h4 className="font-bold text-sm text-black">
                        {isAr ? 'المعاينة المباشرة لجدول زبائن نسمات في Google Sheets' : 'Live Google Sheet Interactive Preview'}
                      </h4>
                    </div>
                    <a
                      href={settings.crmGoogleSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <span>{isAr ? 'فتح في نافذة كاملة ↗️' : 'Open in New Tab ↗️'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="w-full h-[620px] rounded-2xl overflow-hidden border border-neutral-300 bg-neutral-50 relative">
                    <iframe
                      src={getGoogleSheetEmbedUrl(settings.crmGoogleSheetUrl)}
                      title="Google Sheet CRM Live Preview"
                      className="w-full h-full border-0"
                      allow="clipboard-write"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-emerald-50/40 border border-dashed border-emerald-300 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                    <GoogleSheetsIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-black">
                    {isAr ? 'أدخل رابط جدول Google Sheets لعرضه والتحكم به مباشرة من هنا' : 'Connect Google Sheet URL to view it live here'}
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    {isAr
                      ? 'بمجرد لصق رابط جدولك في حقل الإعدادات أعلاه، سيظهر الجدول التفاعلي مباشرة داخل لوحة الإدارة مع إمكانية التعديل والمزامنة والتصدير.'
                      : 'Once you paste your Google Sheet link above, the full interactive sheet will embed directly inside your dashboard.'}
                  </p>
                </div>
              )}

              {/* Step-by-Step Google Apps Script Automation Guide */}
              <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <h4 className="font-bold text-sm text-black">
                      {isAr ? 'كود المزامنة التلقائية لـ Google Sheets (Google Apps Script)' : 'Automated Sync Script (Google Apps Script)'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAppsScript}
                    className="text-xs font-bold text-black bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg border border-neutral-300 flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedAppsScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        <span>{isAr ? 'نسخ الكود بالكامل' : 'Copy Script Code'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs text-neutral-800 leading-relaxed">
                  <p className="font-bold text-emerald-900">
                    {isAr ? 'طريقة التشغيل في 3 خطوات بسيطة:' : '3 Simple Setup Steps:'}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-700">
                    <li>{isAr ? 'افتح جدول Google جديد في حسابك على drive.google.com.' : 'Open a new Google Sheet in your Google Drive.'}</li>
                    <li>{isAr ? 'من القائمة العلوية اضغط على Extensions (الإضافات) ثم اختر Apps Script.' : 'From top menu click Extensions > Apps Script.'}</li>
                    <li>{isAr ? 'احذف أي كود موجود والصق الكود أدناه، ثم اضغط Deploy > New deployment > Web app (واختر في Who has access: Anyone)، ثم انسخ الرابط والصقه في حقل Webhook أعلاه.' : 'Paste the code below, click Deploy > New deployment > Web app (Who has access: Anyone), then paste the URL above.'}</li>
                  </ol>
                </div>

                <textarea
                  readOnly
                  rows={8}
                  value={GOOGLE_SHEET_APPS_SCRIPT_TEMPLATE}
                  className="w-full p-3 rounded-2xl bg-neutral-900 text-neutral-200 font-mono text-[11px] focus:outline-none select-all leading-normal"
                />
              </div>
            </div>
          )}

          {/* CRM NOTE EDIT MODAL */}
          {editingCrmCustomerName && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-neutral-200 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📝</span>
                    <h3 className="font-bold text-sm text-black">
                      {isAr ? `تعديل ملاحظة CRM: ${editingCrmCustomerName}` : `Edit CRM Note for ${editingCrmCustomerName}`}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingCrmCustomerName(null)}
                    className="p-1 rounded-full text-neutral-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 block">
                    {isAr ? 'ملاحظة خاصة بالتاجر (تفضيلات العطور، النوتات المفضلة، العنوان، المناسبات):' : 'Private Merchant Notes:'}
                  </label>
                  <textarea
                    rows={4}
                    value={editingCrmNoteText}
                    onChange={(e) => setEditingCrmNoteText(e.target.value)}
                    placeholder=""
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs focus:outline-none focus:border-black bg-neutral-50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setEditingCrmCustomerName(null)}
                    className="px-4 py-2 rounded-xl bg-neutral-100 text-xs font-bold hover:bg-neutral-200 transition cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveCrmNote(editingCrmCustomerName)}
                    className="px-5 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
                  >
                    {isAr ? 'حفظ الملاحظة 💾' : 'Save Note'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PRINTABLE LAB FORMULATION TICKET MODAL */}
          {printingBlend && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white border-2 border-black rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧪</span>
                    <h3 className="font-bold text-sm text-black uppercase tracking-wider">
                      {isAr ? 'بطاقة خلط معملية (Haute Parfumerie Lab Ticket)' : 'Laboratory Formulation Ticket'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setPrintingBlend(null)}
                    className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-black">
                    <span>{isAr ? 'اسم العطر المختار:' : 'Perfume:'}</span>
                    <span className="text-amber-800 text-sm font-black">{printingBlend.name}</span>
                  </div>
                  {printingBlend.customerName && (
                    <div className="flex justify-between text-neutral-600">
                      <span>{isAr ? 'اسم الزبون / الإهداء:' : 'Customer:'}</span>
                      <span className="font-bold text-black">{printingBlend.customerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-600">
                    <span>{isAr ? 'حجم الزجاجة المطلوب:' : 'Bottle Capacity:'}</span>
                    <span className="font-bold text-black font-mono">{printingBlend.sizeMl} ml (Extrait de Parfum)</span>
                  </div>
                </div>

                {/* Table of Exact Milliliters */}
                <div className="border border-neutral-300 rounded-xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-neutral-100 font-bold text-neutral-800">
                      <tr>
                        <th className="py-2 px-3 text-start">{isAr ? 'الزيت العطري' : 'Oil'}</th>
                        <th className="py-2 px-2 text-center">{isAr ? 'الكود' : 'Code'}</th>
                        <th className="py-2 px-2 text-center">{isAr ? 'النسبة' : 'Ratio'}</th>
                        <th className="py-2 px-3 text-end">{isAr ? 'المقدار بالملل' : 'Volume (ml)'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {printingBlend.ingredients.map((ing) => {
                        const totalOil = printingBlend.totalOilMl || (printingBlend.sizeMl * 0.25);
                        const ingMl = ((totalOil * ing.percentage) / 100).toFixed(2);
                        return (
                          <tr key={ing.oilId}>
                            <td className="py-2 px-3 font-bold text-black">{ing.oilName}</td>
                            <td className="py-2 px-2 text-center font-mono text-[11px]">{ing.oilCode || '-'}</td>
                            <td className="py-2 px-2 text-center font-mono">{ing.percentage}%</td>
                            <td className="py-2 px-3 text-end font-mono font-black text-amber-800">{ingMl} ملل</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-amber-50 font-bold border-t border-amber-300">
                        <td colSpan={3} className="py-2 px-3 text-amber-950">{isAr ? 'مجموع الزيوت العطرية:' : 'Total Oils:'}</td>
                        <td className="py-2 px-3 text-end font-mono font-black text-amber-900">
                          {(printingBlend.totalOilMl || printingBlend.sizeMl * 0.25).toFixed(2)} ملل
                        </td>
                      </tr>
                      <tr className="bg-emerald-50 font-bold">
                        <td colSpan={3} className="py-2 px-3 text-emerald-950">{isAr ? 'كحول عطري 96%:' : 'Alcohol 96%:'}</td>
                        <td className="py-2 px-3 text-end font-mono font-black text-emerald-800">
                          {(printingBlend.alcoholMl || printingBlend.sizeMl * 0.75).toFixed(2)} ملل
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setPrintingBlend(null)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md"
                  >
                    <Printer className="w-3.5 h-3.5 text-white" />
                    <span>{isAr ? 'طباعة التذكرة الآن 🖨️' : 'Print Ticket'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= 7. PIXEL & ADS TRACKING ================= */}
      {module === 'pixel' && (
        <div className="space-y-6">
          {/* Main Module Header */}
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold shadow-md shrink-0">
                  <Target className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black font-serif uppercase tracking-wider text-black">
                      {isAr ? 'نظام بكسل وتتبع الإعلانات والتحويلات (Pixel & Conversion Tracking)' : 'Pixel & Ads Tracking Engine'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 text-[10px] font-black uppercase">
                      PIXEL SUITE
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">
                    {isAr 
                      ? 'ربط مباشر مع Meta Pixel (فيسبوك وإنستغرام) و TikTok Pixel و Google Tag و Snapchat لمتابعة المبيعات والعائد الإعلاني (ROAS)' 
                      : 'Connect Meta, TikTok, Google Tag, and Snapchat pixels to track conversions, ROAS, and customer journey'}
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-2xl border border-neutral-200 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-neutral-800">{isAr ? 'محرك التتبع نشط' : 'Tracking Engine Active'}</span>
              </div>
            </div>
          </div>

          {pixelSaveMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold text-center animate-in fade-in">
              {pixelSaveMessage}
            </div>
          )}

          {/* Pixel Configuration Form */}
          <form onSubmit={handleSavePixelSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. Meta (Facebook & Instagram) Pixel */}
              <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                      f
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-black">Meta Pixel (Facebook & Instagram)</h3>
                      <p className="text-[10px] text-neutral-400">fbevents.js • PageView, AddToCart, Purchase, Lead</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pixelSettings.isMetaPixelEnabled}
                      onChange={(e) => setPixelSettings({ ...pixelSettings, isMetaPixelEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">
                    {isAr ? 'معرّف Meta Pixel ID:' : 'Meta Pixel ID:'}
                  </label>
                  <input
                    type="text"
                    value={pixelSettings.metaPixelId || ''}
                    onChange={(e) => setPixelSettings({ ...pixelSettings, metaPixelId: e.target.value })}
                    placeholder=""
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono focus:border-black focus:outline-none bg-neutral-50"
                  />
                  <p className="text-[10px] text-neutral-400">
                    {isAr ? 'يمكنك نسخه من مدير الإعلانات (Meta Events Manager)' : 'Found in Meta Events Manager'}
                  </p>
                </div>
              </div>

              {/* 2. TikTok Pixel */}
              <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                      ♫
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-black">TikTok Pixel</h3>
                      <p className="text-[10px] text-neutral-400">analytics.tiktok.com • CompletePayment, AddToCart</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pixelSettings.isTiktokPixelEnabled}
                      onChange={(e) => setPixelSettings({ ...pixelSettings, isTiktokPixelEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">
                    {isAr ? 'معرّف TikTok Pixel ID:' : 'TikTok Pixel ID:'}
                  </label>
                  <input
                    type="text"
                    value={pixelSettings.tiktokPixelId || ''}
                    onChange={(e) => setPixelSettings({ ...pixelSettings, tiktokPixelId: e.target.value })}
                    placeholder=""
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono focus:border-black focus:outline-none bg-neutral-50"
                  />
                  <p className="text-[10px] text-neutral-400">
                    {isAr ? 'يمكنك نسخه من TikTok Ads Manager' : 'Found in TikTok Ads Manager'}
                  </p>
                </div>
              </div>

              {/* 3. Google Tag (GA4 / Google Ads) */}
              <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                      <GoogleIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-black">Google Tag & GA4</h3>
                      <p className="text-[10px] text-neutral-400">gtag.js • Google Analytics 4 & Google Ads Conversion</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pixelSettings.isGoogleTagEnabled}
                      onChange={(e) => setPixelSettings({ ...pixelSettings, isGoogleTagEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">
                    {isAr ? 'معرّف Google Tag (GA4 / Ads):' : 'Google Tag ID:'}
                  </label>
                  <input
                    type="text"
                    value={pixelSettings.googleTagId || ''}
                    onChange={(e) => setPixelSettings({ ...pixelSettings, googleTagId: e.target.value })}
                    placeholder=""
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono focus:border-black focus:outline-none bg-neutral-50"
                  />
                  <p className="text-[10px] text-neutral-400">
                    {isAr ? 'يدعم معرفات القياس في إحصاءات جوجل 4 ومعرف إعلانات جوجل' : 'Supports GA4 Measurement ID and Google Ads conversion'}
                  </p>
                </div>
              </div>

              {/* 4. Snapchat Pixel */}
              <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-yellow-100 text-yellow-800 flex items-center justify-center font-bold text-sm">
                      👻
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-black">Snapchat Pixel</h3>
                      <p className="text-[10px] text-neutral-400">tr.snapchat.com • Snap Pixel Tracking</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pixelSettings.isSnapchatPixelEnabled}
                      onChange={(e) => setPixelSettings({ ...pixelSettings, isSnapchatPixelEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">
                    {isAr ? 'معرّف Snapchat Pixel ID:' : 'Snapchat Pixel ID:'}
                  </label>
                  <input
                    type="text"
                    value={pixelSettings.snapchatPixelId || ''}
                    onChange={(e) => setPixelSettings({ ...pixelSettings, snapchatPixelId: e.target.value })}
                    placeholder=""
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono focus:border-black focus:outline-none bg-neutral-50"
                  />
                  <p className="text-[10px] text-neutral-400">
                    {isAr ? 'يمكنك نسخه من Snapchat Ads Manager' : 'Found in Snapchat Ads Manager'}
                  </p>
                </div>
              </div>

            </div>

            {/* Save Buttons & In-Browser Test Mode */}
            <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800">
                <input
                  type="checkbox"
                  checked={pixelSettings.pixelTestMode}
                  onChange={(e) => setPixelSettings({ ...pixelSettings, pixelTestMode: e.target.checked })}
                  className="rounded border-neutral-300 text-black focus:ring-black"
                />
                <span>{isAr ? 'تفعيل وضع الاختبار المباشر (Console & Live Stream Debugger)' : 'Enable Live Test Debugger'}</span>
              </label>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'حفظ وتفعيل الـ Pixels الآن 🎯' : 'Save & Activate Pixels'}</span>
              </button>
            </div>
          </form>

          {/* ================= LIVE EVENT DIAGNOSTICS STREAM ================= */}
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-black flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'مختبر فحص ومراقبة أحداث الـ Pixel المباشرة (Live Event Inspector)' : 'Live Event Inspector'}</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  {isAr ? 'رصد فوري لجميع أحداث التحويل (إضافة للسلة، شراء، تسجيل بحساب Google/Apple، تركيب عطر)' : 'Real-time monitor of pixel events fired on the boutique'}
                </p>
              </div>

              {/* Event Simulator Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFireTestPixelEvent('AddToCart', { content_name: 'عطر مسك الملوك 50ml', value: 8, currency: 'USD' })}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition cursor-pointer"
                >
                  🧪 {isAr ? 'تجربة AddToCart' : 'Test AddToCart'}
                </button>
                <button
                  type="button"
                  onClick={() => handleFireTestPixelEvent('Purchase', { order_id: `TEST-${Date.now()}`, value: 25, currency: 'USD' })}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition cursor-pointer"
                >
                  🧪 {isAr ? 'تجربة Purchase' : 'Test Purchase'}
                </button>
                <button
                  type="button"
                  onClick={() => handleFireTestPixelEvent('CompleteRegistration', { provider: 'Google', customer_name: 'وسام حيدر' })}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition cursor-pointer"
                >
                  🧪 {isAr ? 'تجربة Google Login' : 'Test Registration'}
                </button>
              </div>
            </div>

            {/* Events Stream Table */}
            <div className="border border-neutral-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-start divide-y divide-neutral-200">
                <thead className="bg-neutral-100 font-bold text-neutral-700">
                  <tr>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'اسم الحدث (Event)' : 'Event Name'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'المنصة' : 'Platform'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'البيانات المرسلة (Payload)' : 'Payload Data'}</th>
                    <th className="py-2.5 px-4 text-end">{isAr ? 'التوقيت' : 'Timestamp'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white font-mono">
                  {pixelEventsLog.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-neutral-400 font-sans">
                        {isAr ? 'لم يتم رصد أحداث بعد. تصفح المتجر أو اضغط أزرار التجربة أعلاه لتوليد أحداث.' : 'No events logged yet.'}
                      </td>
                    </tr>
                  ) : (
                    pixelEventsLog.map((ev) => (
                      <tr key={ev.id} className="hover:bg-neutral-50">
                        <td className="py-2.5 px-4 font-bold text-black font-sans flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{ev.eventName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600 font-sans">
                          <span className="bg-neutral-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            {ev.platform}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700 text-[11px] truncate max-w-xs">
                          {JSON.stringify(ev.data)}
                        </td>
                        <td className="py-2.5 px-4 text-end text-neutral-400 text-[10px]">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= 8. STAFF & ROLES ================= */}
      {module === 'staff' && (
        <StaffPermissionsTab
          currentStaff={currentStaff || {
            id: 'staff-owner',
            name: 'المدير العام',
            role: 'owner',
            pinCode: '0000',
            isActive: true,
            allowedTabs: ['pos', 'orders', 'products', 'coupons', 'overview', 'categories', 'hero-banner', 'brands', 'menu-builder', 'customers', 'pixel', 'staff', 'suppliers', 'calculator', 'recipes', 'batches', 'settings'],
            permissions: {
              canChangePrices: true,
              canGiveDiscounts: true,
              canViewFinancials: true,
              canExportData: true,
              canManageStaff: true,
              canAccessSettings: true
            },
            createdAt: new Date().toISOString()
          }}
          onUpdateCurrentStaff={onUpdateCurrentStaff || (() => {})}
          staffMembers={staffMembers || []}
          onUpdateStaffMembers={onUpdateStaffMembers || (() => {})}
          onSelectTab={onSelectTab}
        />
      )}

      {/* ================= 8. SETTINGS & SYSTEM ================= */}
      {module === 'settings' && (
        <div className="space-y-6">
          {/* Header & Global Master Save Action */}
          <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold shadow-xs">
                  <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black font-serif uppercase tracking-wider">
                    {isAr ? 'إعدادات النظام والأمان والنسخ الاحتياطي' : 'Settings & Security'}
                  </h2>
                  <p className="text-xs text-neutral-500 font-medium">
                    {isAr ? 'التحكم برقم الواتساب، التوصيل، العملة وسعر الصرف، هوية المتجر، وكلمة السر' : 'Admin controls for WhatsApp, delivery fees, LBP rate, brand identity & password'}
                  </p>
                </div>
              </div>

              {/* Master Save Button - Saves ALL fields on the page at once */}
              <button
                type="button"
                onClick={(e) => handleSaveAllSettings(e, 'all')}
                className="py-3 px-6 rounded-2xl bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-2 shadow-md active:scale-95 shrink-0"
              >
                <span>💾</span>
                <span>
                  {allSettingsSaved 
                    ? (isAr ? 'تم تطبيق وحفظ كافة الإعدادات ✅' : 'All Settings Saved ✅') 
                    : (isAr ? 'حفظ وتطبيق كافة الإعدادات فوراً' : 'Save & Apply All Settings')}
                </span>
              </button>
            </div>

            {/* Global Success Banner */}
            {allSettingsSaved && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <span>
                    {isAr 
                      ? 'تم حفظ وتطبيق كافة الإعدادات بنجاح في كامل المتجر والنظام (تم التحديث الفوري).' 
                      : 'All settings have been successfully saved and applied system-wide.'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                  {isAr ? 'مُحدث ومحفوظ' : 'Saved'}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Store Brand & Identity Card */}
            <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                    🏛️
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-black">
                      {isAr ? 'هوية دار العطور واسم المتجر (Boutique & Brand Identity)' : 'Boutique & Brand Identity'}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      {isAr ? 'اسم المتجر المعروض على الفواتير، الترويسة، وموقع البوتيك الرسمي للزبائن' : 'Store name, location, and description shown on invoices and boutique storefront'}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-neutral-100 text-neutral-800 font-bold px-3 py-1 rounded-full border border-neutral-200">
                  {storeNameInput}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1.5">
                    {isAr ? 'اسم المتجر / العلامة:' : 'Store / Brand Name:'}
                  </label>
                  <input
                    type="text"
                    value={storeNameInput}
                    onChange={(e) => setStoreNameInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-sm focus:outline-none focus:border-black"
                    placeholder="نسمات للعطور الملكية"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1.5">
                    {isAr ? 'المدينة / العنوان:' : 'City / Address:'}
                  </label>
                  <input
                    type="text"
                    value={storeLocationInput}
                    onChange={(e) => setStoreLocationInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-sm focus:outline-none focus:border-black"
                    placeholder="بيروت / جبل لبنان"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-neutral-700 font-bold mb-1.5">
                    {isAr ? 'الوصف التعريفي للدار (يظهر في التذييل والفواتير):' : 'Boutique Bio:'}
                  </label>
                  <input
                    type="text"
                    value={storeBioInput}
                    onChange={(e) => setStoreBioInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-black"
                    placeholder="صياغة وتركيب أفخم العطور العالمية..."
                  />
                </div>
              </div>
            </div>

            {/* 2. WhatsApp & Contact Phone Settings Card */}
            <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <WhatsAppIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-black">
                      {isAr ? 'رقم الواتساب وهاتف المتجر الرسمي (Official WhatsApp Number)' : 'Official WhatsApp & Store Phone'}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      {isAr ? 'يتم توجيه جميع طلبات السلة والزر العائم واستفسارات الزبائن إلى هذا الرقم مباشرة' : 'Directs all customer orders, floating concierge button, and inquiries'}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-mono">
                  <span>●</span> {formatDisplayPhone(storePhoneInput || settings.storePhone)}
                </span>
              </div>

              <form onSubmit={handleSavePhone} className="space-y-3.5 text-xs pt-1">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1.5">
                    {isAr ? 'رقم الواتساب مع رمز الدولة (أو أدخل رقمك اللبناني مباشرة مثل 81713408):' : 'WhatsApp Number (e.g. 81713408 or +961...):'}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={storePhoneInput}
                        onChange={(e) => setStorePhoneInput(e.target.value)}
                        onBlur={() => handleSaveAllSettings(undefined, 'phone')}
                        placeholder="81713408"
                        className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono focus:outline-none focus:border-black font-bold text-sm"
                        required
                        dir="ltr"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-2 shrink-0 shadow-sm"
                    >
                      <WhatsAppIcon className="w-4 h-4 text-white" />
                      <span>
                        {phoneSaved 
                          ? (isAr ? 'تم حفظ رقم الواتساب بنجاح ✅' : 'WhatsApp Saved ✅') 
                          : (isAr ? 'حفظ وتحديث رقم الواتساب' : 'Save WhatsApp Number')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Live Test & Preview Link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="text-[11px] text-neutral-600 space-y-1">
                    <div>
                      <span className="font-bold text-black">{isAr ? 'معاينة رابط الدردشة المباشر:' : 'Direct Link Preview:'}</span>{' '}
                      <span className="font-mono text-emerald-700 font-bold">
                        https://wa.me/{formatWhatsAppPhone(storePhoneInput)}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      <span>{isAr ? 'الرقم المنسق المعروض للزبائن:' : 'Customer Display:'}</span>{' '}
                      <span className="font-bold text-neutral-800">{formatDisplayPhone(storePhoneInput)}</span>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${formatWhatsAppPhone(storePhoneInput)}?text=${encodeURIComponent(
                      isAr ? 'مرحباً، هذه رسالة تجربة من لوحة التحكم' : 'Hello, testing from Admin Dashboard'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-4 rounded-lg bg-white border border-neutral-300 hover:border-black text-[11px] font-bold text-black flex items-center justify-center gap-1.5 transition shrink-0"
                  >
                    <span>{isAr ? 'تجربة الرقم ↗' : 'Test Link ↗'}</span>
                  </a>
                </div>
              </form>
            </div>

            {/* 2.5 Social Media Accounts (Facebook & Instagram) Card */}
            <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center gap-1">
                    <InstagramIcon className="w-4 h-4 text-[#E4405F]" />
                    <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-black">
                      {isAr ? 'حسابات وسائل التواصل الاجتماعي (Facebook & Instagram)' : 'Social Media Accounts (Facebook & Instagram)'}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      {isAr ? 'أدخل روابط صفحات المتجر على فيسبوك وإنستغرام (أو يمكنك حفظها وتعديلها لاحقاً في أي وقت)' : 'Enter store page links for Facebook and Instagram (or add/update them later at any time)'}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-neutral-50 text-neutral-700 font-bold px-2.5 py-0.5 rounded-full border border-neutral-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {isAr ? 'روابط المتجر الرسمية' : 'Official Social Links'}
                </span>
              </div>

              <form onSubmit={handleSaveSocial} className="space-y-4 text-xs pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Facebook URL */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-neutral-700 font-bold">
                      <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
                      <span>{isAr ? 'رابط صفحة الفيسبوك (Facebook Page URL):' : 'Facebook Page URL:'}</span>
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={facebookUrlInput}
                        onChange={(e) => setFacebookUrlInput(e.target.value)}
                        onBlur={() => handleSaveAllSettings(undefined, 'social')}
                        placeholder="https://facebook.com/nasmat.perfumes"
                        className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="text-neutral-400">
                        {isAr ? 'يمكن تركه فارغاً وإضافته لاحقاً' : 'Can be left blank and added later'}
                      </span>
                      {facebookUrlInput ? (
                        <a
                          href={facebookUrlInput}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1877F2] font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <span>{isAr ? 'تجربة رابط الفيسبوك ↗' : 'Test Facebook ↗'}</span>
                        </a>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium text-[10px]">
                          {isAr ? 'سيُضاف لاحقاً' : 'To be added later'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Instagram URL */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-neutral-700 font-bold">
                      <InstagramIcon className="w-4 h-4 text-[#E4405F]" />
                      <span>{isAr ? 'رابط حساب الإنستغرام (Instagram Profile URL):' : 'Instagram Profile URL:'}</span>
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={instagramUrlInput}
                        onChange={(e) => setInstagramUrlInput(e.target.value)}
                        onBlur={() => handleSaveAllSettings(undefined, 'social')}
                        placeholder="https://instagram.com/nasmat.perfumes"
                        className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="text-neutral-400">
                        {isAr ? 'يمكن تركه فارغاً وإضافته لاحقاً' : 'Can be left blank and added later'}
                      </span>
                      {instagramUrlInput ? (
                        <a
                          href={instagramUrlInput}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#E4405F] font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <span>{isAr ? 'تجربة رابط الإنستغرام ↗' : 'Test Instagram ↗'}</span>
                        </a>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium text-[10px]">
                          {isAr ? 'سيُضاف لاحقاً' : 'To be added later'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100">
                  <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                    <span className="text-amber-600">✨</span>
                    <span>
                      {isAr
                        ? 'تظهر أيقونات فيسبوك وإنستغرام تلقائياً للزبائن في التذييل والقائمة الجانبية والشريط العلوي للمتجر.'
                        : 'Facebook & Instagram icons appear automatically for customers in boutique footer, drawer, and top bar.'}
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="py-2.5 px-6 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-2 shadow-xs shrink-0"
                  >
                    <span>
                      {socialSaved 
                        ? (isAr ? 'تم حفظ الروابط بنجاح ✅' : 'Social Links Saved ✅') 
                        : (isAr ? 'حفظ وتحديث روابط التواصل' : 'Save Social Links')}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* 3. Delivery & Shipping Settings Card */}
            <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-sm text-black">
                    {isAr ? 'إعدادات التوصيل والشحن في لبنان (Lebanon Delivery Settings)' : 'Lebanon Delivery Settings'}
                  </h3>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {isAr ? 'لبنان وكافة المحافظات' : 'Lebanon Wide'}
                </span>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed">
                {isAr
                  ? 'التحكم بسعر التوصيل الأساسي لكافة المناطق اللبنانية، حد التوصيل المجاني التلقائي، وملاحظات التوصيل للزبائن.'
                  : 'Configure standard delivery fee, free delivery threshold, and customer-facing delivery notes.'}
              </p>

              <form onSubmit={handleSaveDeliverySettings} className="space-y-4 text-xs pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-700 font-bold mb-1.5">
                      {isAr ? 'سعر التوصيل الافتراضي ($ USD):' : 'Default Delivery Fee ($ USD):'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={deliveryFeeInput}
                      onChange={(e) => setDeliveryFeeInput(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono focus:outline-none focus:border-black font-bold text-sm"
                      required
                    />
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      {isAr ? 'السعر الافتراضي للتوصيل (يطبق على السلة)' : 'Default delivery cost applied to cart'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold mb-1.5">
                      {isAr ? 'حد التوصيل المجاني ($ USD):' : 'Free Delivery Threshold ($ USD):'}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={freeThresholdInput}
                      onChange={(e) => setFreeThresholdInput(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono focus:outline-none focus:border-black font-bold text-sm"
                      required
                    />
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      {isAr ? 'قيمة السلة المؤهلة للتوصيل المجاني التلقائي' : 'Cart subtotal to trigger free delivery'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                  <input
                    type="checkbox"
                    id="freeDeliveryToggle"
                    checked={freeDeliveryEnabled}
                    onChange={(e) => setFreeDeliveryEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-black cursor-pointer"
                  />
                  <label htmlFor="freeDeliveryToggle" className="text-neutral-800 font-bold cursor-pointer select-none text-xs">
                    {isAr ? 'تفعيل ميزة التوصيل المجاني التلقائي للطلبات فوق الحد' : 'Enable automatic Free Delivery above threshold'}
                  </label>
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1.5">
                    {isAr ? 'نص وملاحظة التوصيل المعروضة للزبائن (في المتجر وصفحة السلة):' : 'Delivery Policy & Note for Customers:'}
                  </label>
                  <input
                    type="text"
                    value={deliveryNotesInput}
                    onChange={(e) => setDeliveryNotesInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-black text-xs font-medium"
                    placeholder="توصيل سريع لكافة الأراضي اللبنانية خلال 24 - 48 ساعة والدفع كاش عند الاستلام"
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-800 transition flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4 text-white" />
                  <span>
                    {deliverySettingsSaved 
                      ? (isAr ? 'تم حفظ إعدادات التوصيل بنجاح ✅' : 'Delivery Settings Saved ✅') 
                      : (isAr ? 'حفظ إعدادات التوصيل' : 'Save Delivery Settings')}
                  </span>
                </button>
              </form>
            </div>

            {/* LBP Currency & Exchange Rate Settings Card */}
            <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold">
                    💵
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-black">
                      {isAr ? 'سعر صرف الدولار بالليرة اللبنانية (USD to LBP Exchange Rate)' : 'USD / LBP Exchange Rate'}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      {isAr
                        ? 'يستخدم لتحويل أسعار العطور، باقات التوفير، وفواتير السلة تلقائياً إلى الليرة اللبنانية للزبائن'
                        : 'Used to calculate customer cart total and bundle prices in Lebanese Pounds'}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-amber-50 text-amber-900 font-black px-3 py-1 rounded-full border border-amber-300 font-mono">
                  $1 = {Number(lbpRateInput).toLocaleString()} L.L.
                </span>
              </div>

              <form onSubmit={handleSaveLbpRate} className="space-y-3.5 text-xs pt-1">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1.5">
                    {isAr ? 'سعر صرف الدولار الواحد بالليرة اللبنانية (L.L.):' : 'Rate per 1 USD in LBP:'}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        value={lbpRateInput}
                        onChange={(e) => setLbpRateInput(parseInt(e.target.value) || 90000)}
                        placeholder=""
                        className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono focus:outline-none focus:border-black font-black text-sm"
                        required
                        dir="ltr"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-2.5 px-6 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-2 shrink-0 shadow-sm"
                    >
                      <span>
                        {lbpRateSaved 
                          ? (isAr ? 'تم حفظ سعر الصرف بنجاح ✅' : 'Rate Saved ✅') 
                          : (isAr ? 'حفظ وتحديث سعر الصرف' : 'Update Exchange Rate')}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Password security card */}
            <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-black" />
                <h3 className="font-bold text-sm text-black">
                  {isAr ? 'كلمة سر الدخول المخفي للإدارة' : 'Hidden Admin Password'}
                </h3>
              </div>
              <form onSubmit={handleSavePassword} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-600 font-bold mb-1">
                    {isAr ? 'كلمة السر الجديدة:' : 'New Password:'}
                  </label>
                  <input
                    type="text"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-800"
                >
                  {passwordSaved ? (isAr ? 'تم حفظ كلمة السر بنجاح ✅' : 'Saved ✅') : (isAr ? 'حفظ كلمة السر' : 'Update Password')}
                </button>
              </form>
            </div>

            {/* Anti-Guessing Secret URL Card (تغيير اسم الرابط السري لمنع التخمين) */}
            <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    🛡️
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-black">
                      {isAr ? 'الرابط السري لمنع التخمين (Anti-Guessing)' : 'Secret Admin URL (Anti-Guessing)'}
                    </h3>
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      {isAr ? 'تم حظر وحجب #admin نهائياً لمنع المتطفلين' : '#admin is blocked from guessing'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2 text-xs">
                <span className="text-neutral-500 font-medium block">
                  {isAr ? 'رابط الدخول السري المخصص لمتجرك الآن:' : 'Your secret access URL:'}
                </span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 rounded-xl bg-white border border-neutral-300 font-mono text-black text-[11px] select-all overflow-x-auto whitespace-nowrap">
                    {(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')}#{adminSecretSlugInput}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySecretAdminLink}
                    className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition shrink-0 cursor-pointer"
                  >
                    {secretSlugCopied ? (isAr ? 'تم النسخ ✅' : 'Copied ✅') : (isAr ? '📋 نسخ' : 'Copy')}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveSecretSlug} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-600 font-bold mb-1">
                    {isAr ? 'تخصيص الكلمة السرية في الرابط (تغيير الاسم منعا للتخمين):' : 'Customize Secret Slug:'}
                  </label>
                  <div className="flex items-center rounded-xl border border-neutral-300 overflow-hidden focus-within:border-black bg-white">
                    <span className="px-3 py-2 bg-neutral-100 text-neutral-500 font-mono text-xs border-e border-neutral-200">#</span>
                    <input
                      type="text"
                      value={adminSecretSlugInput}
                      onChange={(e) => setAdminSecretSlugInput(e.target.value)}
                      placeholder=""
                      className="w-full p-2 font-mono text-xs text-black focus:outline-none"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    {isAr ? 'استخدم حروفاً وأرقاماً بالإنجليزية' : 'Use English letters and numbers'}
                  </span>
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-800"
                >
                  {secretSlugSaved ? (isAr ? 'تم حفظ الرابط السري بنجاح ✅' : 'Saved ✅') : (isAr ? 'حفظ الرابط السري' : 'Save Secret Slug')}
                </button>
              </form>
            </div>

            {/* Backup & Restore card */}
            <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-black" />
                <h3 className="font-bold text-sm text-black">
                  {isAr ? 'النسخ الاحتياطي لقاعدة البيانات' : 'Data Backup & Export'}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {isAr 
                  ? 'حفظ نسخة كاملة من كافة العطور والأسعار والفواتير والوصفات بملف JSON آمن لاستعادتها في أي وقت.' 
                  : 'Download complete database snapshot including products, prices, and invoices.'}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {onOpenBackup && (
                  <button
                    onClick={onOpenBackup}
                    className="py-2.5 px-4 rounded-xl bg-neutral-900 text-white font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-black"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isAr ? 'فتح نافذة النسخ الاحتياطي' : 'Open Backup Modal'}</span>
                  </button>
                )}
                {onResetDefaults && (
                  <button
                    onClick={onResetDefaults}
                    className="py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-rose-50 hover:text-rose-700 text-neutral-700 font-bold text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isAr ? 'استعادة البيانات الافتراضية' : 'Reset Defaults'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Master Save Bar */}
            <div className="md:col-span-2 p-5 bg-neutral-900 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div>
                <h4 className="font-bold text-sm">
                  {isAr ? 'حفظ وتثبيت كافة إعدادات النظام' : 'Save & Commit All System Settings'}
                </h4>
                <p className="text-xs text-neutral-400">
                  {isAr 
                    ? 'يتم تطبيق رقم الواتساب، أسعار وشروط التوصيل، سعر الصرف، وهوية الدار فوراً على كامل المتجر للزبائن' 
                    : 'Immediately applies all WhatsApp, delivery fees, LBP rate, and brand identity settings to the storefront'}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => handleSaveAllSettings(e, 'all')}
                className="py-3 px-8 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-2 shadow-md active:scale-95 shrink-0"
              >
                <span>💾</span>
                <span>
                  {allSettingsSaved 
                    ? (isAr ? 'تم تطبيق وحفظ كافة الإعدادات بنجاح ✅' : 'All Settings Saved ✅') 
                    : (isAr ? 'حفظ وتطبيق كافة الإعدادات في المشروع' : 'Save & Apply All Settings')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Category Image & Info Edit Modal */}
      {editingCategoryModal && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setEditingCategoryModal(null)}
        >
          <div 
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden text-black animate-scaleUp my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-black font-serif">
                    {isAddingCategory 
                      ? (isAr ? 'إضافة قسم جديد للمتجر' : 'Add New Category') 
                      : (isAr ? `تعديل صورة وتفاصيل: ${editingCategoryModal.labelAr}` : `Edit Category: ${editingCategoryModal.labelEn}`)}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">
                    {isAr ? 'حدد اسم القسم ورفع صورة من جهازك أو وضع رابط أو اختيار من الصور الفاخرة' : 'Set category details, upload photo, or select preset'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingCategoryModal(null)}
                className="w-8 h-8 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-600 hover:text-black flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-black shrink-0 bg-white shadow-md">
                  <img
                    src={modalEditImageUrl || editingCategoryModal.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                </div>
                <div className="flex-1 space-y-2 w-full text-center sm:text-start">
                  <label className="inline-flex py-2 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider items-center justify-center gap-2 shadow-sm transition cursor-pointer">
                    <Upload className="w-4 h-4 text-white" />
                    <span>{isAr ? 'رفع صورة من جهازك' : 'Upload from Device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAdminFileUpload}
                      className="hidden"
                    />
                  </label>
                  <div className="text-[11px] text-neutral-500">
                    {isAr ? 'يدعم PNG, JPG, WEBP ويتم حفظ الصورة فوراً' : 'Supports JPG, PNG, WEBP and saves locally'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {isAr ? 'رابط الصورة المباشر (URL):' : 'Image URL:'}
                </label>
                <input
                  type="url"
                  value={modalEditImageUrl}
                  onChange={(e) => setModalEditImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {isAr ? 'الاسم بالعربية:' : 'Name (Arabic):'}
                  </label>
                  <input
                    type="text"
                    value={modalEditLabelAr}
                    onChange={(e) => setModalEditLabelAr(e.target.value)}
                    placeholder=""
                    className="w-full p-2 rounded-xl border border-neutral-300 text-xs font-bold focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {isAr ? 'الاسم بالإنجليزية:' : 'Name (English):'}
                  </label>
                  <input
                    type="text"
                    value={modalEditLabelEn}
                    onChange={(e) => setModalEditLabelEn(e.target.value)}
                    placeholder=""
                    className="w-full p-2 rounded-xl border border-neutral-300 text-xs font-bold focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {isAr ? 'الوصف أو عدد العطور (عربي):' : 'Count / Subtitle (Arabic):'}
                  </label>
                  <input
                    type="text"
                    value={modalEditCountAr}
                    onChange={(e) => setModalEditCountAr(e.target.value)}
                    placeholder=""
                    className="w-full p-2 rounded-xl border border-neutral-300 text-xs font-medium focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {isAr ? 'الوصف أو عدد العطور (إنجليزي):' : 'Count / Subtitle (English):'}
                  </label>
                  <input
                    type="text"
                    value={modalEditCountEn}
                    onChange={(e) => setModalEditCountEn(e.target.value)}
                    placeholder=""
                    className="w-full p-2 rounded-xl border border-neutral-300 text-xs font-medium focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-black flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'أو اختر صورة جاهزة بنقرة واحدة:' : 'Or choose preset:'}</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {LUXURY_PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setModalEditImageUrl(preset.url)}
                      className={`p-1 rounded-xl border transition cursor-pointer flex flex-col items-center ${
                        modalEditImageUrl === preset.url ? 'border-black bg-neutral-100 ring-2 ring-black' : 'border-neutral-200 hover:border-black'
                      }`}
                      title={preset.name}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingCategoryModal(null)}
                className="px-4 py-2 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-xs font-bold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={saveAdminCategoryEdit}
                className="px-5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Check className="w-4 h-4 text-white stroke-[3]" />
                <span>{isAddingCategory ? (isAr ? 'حفظ وإضافة القسم للمتجر' : 'Add Category to Store') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Permanent Category Deletion Confirmation Modal */}
      {categoryToDelete && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setCategoryToDelete(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden text-black animate-scaleUp my-auto p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-bold text-lg text-black font-serif">
                {isAr ? 'حذف هذا القسم نهائياً من المتجر؟' : 'Permanently Delete Category?'}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {isAr
                  ? `هل أنت متأكد من حذف قسم "${categoryToDelete.label}"؟ سيتم إخفاؤه وحظره تماماً من شريط التنقل والواجهة ولن يعود للظهور مجدداً.`
                  : `Are you sure you want to permanently delete "${categoryToDelete.label}"? It will be blocked and hidden from store navigation permanently.`}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-bold transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  recordDeletedNavCategoryId(categoryToDelete.id);
                  recordDeletedNavCategoryId(categoryToDelete.label);
                  const updated = adminNavCategories.filter(
                    (c) => c.id !== categoryToDelete.id && c.labelAr !== categoryToDelete.label && c.labelEn !== categoryToDelete.label
                  );
                  setAdminNavCategories(updated);
                  saveNavCategories(updated);
                  window.dispatchEvent(new Event('nasamat_categories_updated'));
                  setCategoryToast(
                    isAr
                      ? `تم حذف قسم "${categoryToDelete.label}" وحظره نهائياً من المتجر`
                      : `Permanently deleted "${categoryToDelete.label}"`
                  );
                  setCategoryToDelete(null);
                  setTimeout(() => setCategoryToast(null), 3500);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                {isAr ? 'نعم، احذف القسم' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Category Action Toast Notification */}
      {categoryToast && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-neutral-700 animate-fadeIn text-xs font-bold">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>{categoryToast}</span>
        </div>
      )}

      {/* Modal: New Customer Blend Registration */}
      {isNewCustomerBlendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-neutral-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    {isAr ? 'تركيب وتسجيل خلطة جديدة باسم الزبون' : 'Formulate & Register Customer Blend'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    {isAr ? 'صياغة العطر المعملية بالملل والنسب وتسجيلها في السجل الرسمي للزبون' : 'Laboratory compounding with ml breakdown saved to profile'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCustomerBlendModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCustomerBlend} className="p-6 space-y-6">
              {/* Row 1: Customer Name & Blend Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-black flex items-center justify-between">
                    <span>{isAr ? 'اسم الزبون (تسجيل الخلطة باسمه):' : 'Customer Name:'} <span className="text-rose-500">*</span></span>
                    <Users className="w-3.5 h-3.5 text-neutral-400" />
                  </label>
                  <input
                    type="text"
                    required
                    value={newBlendCustomerName}
                    onChange={(e) => setNewBlendCustomerName(e.target.value)}
                    placeholder=""
                    className="w-full p-2.5 rounded-xl border border-neutral-300 focus:border-black text-xs font-bold text-black focus:outline-none bg-neutral-50"
                  />
                  {customerList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-neutral-500">{isAr ? 'اختيار سريع:' : 'Quick pick:'}</span>
                      {customerList.slice(0, 4).map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewBlendCustomerName(c.name)}
                          className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-lg border border-neutral-200 transition"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-black flex items-center justify-between">
                    <span>{isAr ? 'اسم العطر أو الخلطة المختار:' : 'Blend / Perfume Name:'} <span className="text-rose-500">*</span></span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </label>
                  <input
                    type="text"
                    required
                    value={newBlendName}
                    onChange={(e) => setNewBlendName(e.target.value)}
                    placeholder=""
                    className="w-full p-2.5 rounded-xl border border-neutral-300 focus:border-black text-xs font-bold text-black focus:outline-none bg-neutral-50"
                  />
                </div>
              </div>

              {/* Row 2: Bottle Size Selector (30ml / 50ml / 100ml) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-black">
                  {isAr ? 'حجم الزجاجة المطلوب تركيبها:' : 'Bottle Size:'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[30, 50, 100].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setNewBlendSize(sz)}
                      className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                        newBlendSize === sz
                          ? 'border-black bg-black text-white shadow-md'
                          : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      <span className="font-mono text-sm">{sz} ML</span>
                      <span className="text-[10px] font-normal opacity-80">
                        {isAr ? (sz === 30 ? 'عينة فاخرة (5$)' : sz === 50 ? 'الحجم الأكثر طلباً (8$)' : 'الحجم الملكي (14$)') : `$${sz === 30 ? 5 : sz === 50 ? 8 : 14}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Selected Oils & Proportions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-black">{isAr ? 'الزيوت العطرية الداخلة في التركيبة:' : 'Formulation Oils:'}</span>
                    <span className="text-[11px] font-mono text-neutral-500">({newBlendOils.length}/4)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleEqualizeNewBlendRatios}
                      className="text-[11px] font-bold text-neutral-600 hover:text-black bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-lg border border-neutral-200 transition cursor-pointer"
                    >
                      {isAr ? 'موازنة النسب بالتساوي ⚖️' : 'Equalize Ratios'}
                    </button>
                  </div>
                </div>

                {newBlendOils.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed border-neutral-300 text-center text-xs text-neutral-500">
                    {isAr ? 'لم تختر زيوت بعد. اختر من قائمة الزيوت أدناه لإضافتها إلى التركيبة' : 'No oils selected. Pick from available oils below.'}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {newBlendOils.map((bo) => {
                      const oil = oils.find(o => o.id === bo.oilId);
                      const totalOilMl = Number((newBlendSize * 0.25).toFixed(2));
                      const oilMl = Number(((totalOilMl * bo.percentage) / 100).toFixed(2));
                      return (
                        <div key={bo.oilId} className="p-3 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="font-bold text-black flex items-center gap-2">
                              <span>{oil?.name || 'زيت عطري'}</span>
                              {oil?.brand && <span className="text-[10px] text-neutral-500 font-normal">({oil.brand})</span>}
                              {oil?.code && <span className="text-[10px] font-mono bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded">{oil.code}</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-lg text-xs font-black">
                                {oilMl} {isAr ? 'ملل' : 'ml'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOilFromNewBlend(bo.oilId)}
                                className="text-neutral-400 hover:text-rose-600 transition cursor-pointer p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="5"
                              max="95"
                              step="5"
                              value={bo.percentage}
                              onChange={(e) => handleUpdateNewBlendOilPercentage(bo.oilId, Number(e.target.value))}
                              className="flex-1 accent-black h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateNewBlendOilPercentage(bo.oilId, bo.percentage - 5)}
                                className="w-6 h-6 rounded bg-white border border-neutral-300 text-xs font-bold hover:bg-neutral-100 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="w-12 text-center font-mono font-bold text-xs bg-white border border-neutral-200 py-0.5 rounded">
                                {bo.percentage}%
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateNewBlendOilPercentage(bo.oilId, bo.percentage + 5)}
                                className="w-6 h-6 rounded bg-white border border-neutral-300 text-xs font-bold hover:bg-neutral-100 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {newBlendTotalPercent !== 100 && (
                      <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2 flex items-center justify-between">
                        <span>{isAr ? `تنبيه: مجموع النسب الحالي ${newBlendTotalPercent}% (المطلوب 100%)` : `Current sum is ${newBlendTotalPercent}% (requires 100%)`}</span>
                        <button
                          type="button"
                          onClick={handleEqualizeNewBlendRatios}
                          className="underline hover:text-amber-900 cursor-pointer"
                        >
                          {isAr ? 'موازنة الآن ⚖️' : 'Equalize now'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Oil Picker: Add oils from catalog */}
              {newBlendOils.length < 4 && (
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-black flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-black" />
                      <span>{isAr ? 'إضافة زيت إلى التركيبة من الكتالوج:' : 'Add Oil from Catalog:'}</span>
                    </label>
                    <div className="relative w-48">
                      <Search className="w-3 h-3 text-neutral-400 absolute right-2.5 top-2.5" />
                      <input
                        type="text"
                        value={newBlendOilSearch}
                        onChange={(e) => setNewBlendOilSearch(e.target.value)}
                        placeholder={isAr ? 'بحث بالاسم أو الكود...' : 'Search oils...'}
                        className="w-full pr-8 pl-2 py-1 text-[11px] border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-neutral-50 rounded-2xl border border-neutral-200">
                    {availableOilsForNewBlend.slice(0, 18).map((oil) => (
                      <button
                        key={oil.id}
                        type="button"
                        onClick={() => handleAddOilToNewBlend(oil)}
                        className="text-start p-2 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 hover:border-black transition cursor-pointer flex flex-col justify-between"
                      >
                        <span className="text-xs font-bold text-black truncate w-full">{oil.name}</span>
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono mt-1">
                          <span>{oil.brand || 'Nasamat'}</span>
                          <span className="text-amber-700 font-bold">+ إضافة</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulation Ticket / Laboratory Details */}
              <div className="bg-neutral-900 text-white rounded-2xl p-4 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">
                      {isAr ? 'بطاقة المعيار المعملي للتركيبة (تحضير فوري)' : 'Laboratory Formulation Ticket'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Extrait de Parfum
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                    <span className="block text-[10px] text-neutral-400">{isAr ? 'حجم الزجاجة' : 'Size'}</span>
                    <span className="font-mono font-bold text-white text-sm">{newBlendSize} {isAr ? 'ملل' : 'ml'}</span>
                  </div>
                  <div className="bg-amber-950/40 p-2 rounded-xl border border-amber-500/20">
                    <span className="block text-[10px] text-amber-300">{isAr ? 'إجمالي الزيوت' : 'Total Oil'}</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{(newBlendSize * 0.25).toFixed(1)} {isAr ? 'ملل' : 'ml'}</span>
                  </div>
                  <div className="bg-sky-950/40 p-2 rounded-xl border border-sky-500/20">
                    <span className="block text-[10px] text-sky-300">{isAr ? 'كحول نقي 96%' : 'Pure Alcohol'}</span>
                    <span className="font-mono font-bold text-sky-400 text-sm">{(newBlendSize * 0.75).toFixed(1)} {isAr ? 'ملل' : 'ml'}</span>
                  </div>
                </div>

                {newBlendOils.length > 0 && (
                  <div className="text-[11px] bg-white/5 rounded-xl p-2.5 border border-white/10 space-y-1">
                    <span className="text-[10px] text-neutral-400 block border-b border-white/10 pb-1">
                      {isAr ? 'المقادير الدقيقة لكل زيت بالملل:' : 'Exact ml for each oil:'}
                    </span>
                    {newBlendOils.map((bo) => {
                      const match = oils.find(o => o.id === bo.oilId);
                      const totalOilMl = Number((newBlendSize * 0.25).toFixed(2));
                      const oilMl = Number(((totalOilMl * bo.percentage) / 100).toFixed(2));
                      return (
                        <div key={bo.oilId} className="flex items-center justify-between font-mono">
                          <span className="text-neutral-300">• {match?.name || 'زيت'}:</span>
                          <span className="text-amber-300 font-bold">{oilMl} {isAr ? 'ملل' : 'ml'} ({bo.percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerBlendModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!newBlendName.trim() || !newBlendCustomerName.trim() || newBlendOils.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer flex items-center gap-2 shadow-lg transition"
                >
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'حفظ الخلطة وتسجيلها في سجل الزبون 📜' : 'Register Blend to Customer Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
