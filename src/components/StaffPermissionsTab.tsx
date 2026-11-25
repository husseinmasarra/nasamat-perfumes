import React, { useState } from 'react';
import type { StaffMember, StaffRole, StaffPermissions } from '../types';
import type { AdminNavTab } from './AdminSidebar';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Key, 
  Lock, 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  ShoppingBag, 
  Tag, 
  FlaskConical, 
  Truck, 
  Settings as SettingsIcon,
  Percent
} from './icons';
import { useLanguage } from '../context/LanguageContext';

interface StaffPermissionsTabProps {
  currentStaff: StaffMember;
  onUpdateCurrentStaff: (staff: StaffMember) => void;
  staffMembers: StaffMember[];
  onUpdateStaffMembers: (staffList: StaffMember[]) => void;
  onSelectTab?: (tab: string) => void;
}

interface TabGroupInfo {
  titleAr: string;
  titleEn: string;
  icon: string;
  tabs: { id: AdminNavTab; labelAr: string; labelEn: string }[];
}

const TAB_GROUPS: TabGroupInfo[] = [
  {
    titleAr: 'المبيعات وصالة العرض (POS & Sales)',
    titleEn: 'Sales & POS',
    icon: '🛒',
    tabs: [
      { id: 'pos', labelAr: 'نقطة البيع الفورية (POS Terminal)', labelEn: 'POS Terminal' },
      { id: 'orders', labelAr: 'الطلبيات والفواتير', labelEn: 'Orders & Sales' },
    ],
  },
  {
    titleAr: 'المنتجات وقاعدة العطور',
    titleEn: 'Products & Fragrances',
    icon: '🧴',
    tabs: [
      { id: 'products', labelAr: 'المنتجات وقاعدة العطور', labelEn: 'Products & Pricing' },
      { id: 'brands', labelAr: 'الماركات ودور العطور', labelEn: 'Fragrance Brands' },
    ],
  },
  {
    titleAr: 'مختبر الصياغة والتصنيع',
    titleEn: 'Lab & Formulation',
    icon: '🧪',
    tabs: [
      { id: 'calculator', labelAr: 'مختبر وحاسبة العيارات', labelEn: 'Caliber Calculator' },
      { id: 'recipes', labelAr: 'خلطات نسمات الملكية', labelEn: 'Royal Recipes' },
      { id: 'batches', labelAr: 'سجل دفعات الإنتاج', labelEn: 'Production Batches' },
    ],
  },
  {
    titleAr: 'المخزون والموردين',
    titleEn: 'Inventory & Suppliers',
    icon: '📦',
    tabs: [
      { id: 'suppliers', labelAr: 'الموردين والمواد الخام والعبوات', labelEn: 'Suppliers & Raw Materials' },
    ],
  },
  {
    titleAr: 'التسويق والزبائن والواجهة',
    titleEn: 'Marketing & CRM',
    icon: '📢',
    tabs: [
      { id: 'customers', labelAr: 'دليل الزبائن والـ CRM و Meta Ads', labelEn: 'Customers CRM & Ads' },
      { id: 'coupons', labelAr: 'الكوبونات والعروض الترويجية', labelEn: 'Coupons & Promos' },
      { id: 'categories', labelAr: 'الأقسام وتعديل الصور', labelEn: 'Categories & Photos' },
      { id: 'hero-banner', labelAr: 'بنر المتجر والكروت الترويجية', labelEn: 'Boutique Banners' },
      { id: 'menu-builder', labelAr: 'بناء القائمة والتنقل', labelEn: 'Menu Builder' },
      { id: 'pixel', labelAr: 'بكسل وتتبع الإعلانات (Pixel & CAPI)', labelEn: 'Ad Pixels' },
    ],
  },
  {
    titleAr: 'الإدارة العليا والأمان',
    titleEn: 'Administration & Security',
    icon: '🔒',
    tabs: [
      { id: 'overview', labelAr: 'نظرة عامة والتقارير المالية', labelEn: 'Overview & Analytics' },
      { id: 'staff', labelAr: 'فريق العمل وتحديد الصلاحيات', labelEn: 'Staff & Roles' },
      { id: 'settings', labelAr: 'إعدادات النظام والنسخ الاحتياطي', labelEn: 'Settings & Security' },
    ],
  },
];

export const StaffPermissionsTab: React.FC<StaffPermissionsTabProps> = ({
  currentStaff,
  onUpdateCurrentStaff,
  staffMembers,
  onUpdateStaffMembers,
  onSelectTab,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isNewUserModal, setIsNewUserModal] = useState(false);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [isPinSwitchModalOpen, setIsPinSwitchModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState('');

  // Form State for editing / creating staff
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<StaffRole>('cashier');
  const [formPin, setFormPin] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formAllowedTabs, setFormAllowedTabs] = useState<string[]>([]);
  const [formPermissions, setFormPermissions] = useState<StaffPermissions>({
    canChangePrices: false,
    canGiveDiscounts: true,
    canViewFinancials: false,
    canExportData: false,
    canManageStaff: false,
    canAccessSettings: false,
  });

  const getRolePreset = (role: StaffRole): { allowedTabs: string[]; permissions: StaffPermissions } => {
    switch (role) {
      case 'owner':
        return {
          allowedTabs: TAB_GROUPS.flatMap((g) => g.tabs.map((t) => t.id)),
          permissions: {
            canChangePrices: true,
            canGiveDiscounts: true,
            canViewFinancials: true,
            canExportData: true,
            canManageStaff: true,
            canAccessSettings: true,
          },
        };
      case 'cashier':
        return {
          allowedTabs: ['pos', 'orders'],
          permissions: {
            canChangePrices: false,
            canGiveDiscounts: true,
            canViewFinancials: false,
            canExportData: false,
            canManageStaff: false,
            canAccessSettings: false,
          },
        };
      case 'perfumer':
        return {
          allowedTabs: ['calculator', 'recipes', 'batches', 'products'],
          permissions: {
            canChangePrices: false,
            canGiveDiscounts: false,
            canViewFinancials: false,
            canExportData: true,
            canManageStaff: false,
            canAccessSettings: false,
          },
        };
      case 'inventory':
        return {
          allowedTabs: ['products', 'suppliers', 'batches'],
          permissions: {
            canChangePrices: true,
            canGiveDiscounts: false,
            canViewFinancials: false,
            canExportData: true,
            canManageStaff: false,
            canAccessSettings: false,
          },
        };
      case 'marketing':
        return {
          allowedTabs: ['customers', 'coupons', 'categories', 'hero-banner', 'brands', 'menu-builder', 'pixel'],
          permissions: {
            canChangePrices: false,
            canGiveDiscounts: true,
            canViewFinancials: false,
            canExportData: true,
            canManageStaff: false,
            canAccessSettings: false,
          },
        };
      default:
        return {
          allowedTabs: ['pos'],
          permissions: {
            canChangePrices: false,
            canGiveDiscounts: false,
            canViewFinancials: false,
            canExportData: false,
            canManageStaff: false,
            canAccessSettings: false,
          },
        };
    }
  };

  const openCreateModal = () => {
    const preset = getRolePreset('cashier');
    setEditingStaff(null);
    setIsNewUserModal(true);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormRole('cashier');
    setFormPin(Math.floor(1000 + Math.random() * 9000).toString());
    setFormIsActive(true);
    setFormAllowedTabs(preset.allowedTabs);
    setFormPermissions(preset.permissions);
  };

  const openEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setIsNewUserModal(false);
    setFormName(staff.name);
    setFormPhone(staff.phone || '');
    setFormEmail(staff.email || '');
    setFormRole(staff.role);
    setFormPin(staff.pinCode || '1234');
    setFormIsActive(staff.isActive);
    setFormAllowedTabs([...staff.allowedTabs]);
    setFormPermissions({ ...staff.permissions });
  };

  const handleRoleChange = (newRole: StaffRole) => {
    setFormRole(newRole);
    const preset = getRolePreset(newRole);
    setFormAllowedTabs(preset.allowedTabs);
    setFormPermissions(preset.permissions);
  };

  const toggleTab = (tabId: string) => {
    setFormAllowedTabs((prev) =>
      prev.includes(tabId) ? prev.filter((id) => id !== tabId) : [...prev, tabId]
    );
  };

  const toggleGroupTabs = (tabs: { id: AdminNavTab }[]) => {
    const tabIds = tabs.map((t) => t.id);
    const allSelected = tabIds.every((id) => formAllowedTabs.includes(id));
    if (allSelected) {
      setFormAllowedTabs((prev) => prev.filter((id) => !tabIds.includes(id as AdminNavTab)));
    } else {
      setFormAllowedTabs((prev) => Array.from(new Set([...prev, ...tabIds])));
    }
  };

  const handleSaveStaffForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const cleanedPin = formPin.trim() || '1234';

    if (editingStaff) {
      // Update existing
      const updated: StaffMember = {
        ...editingStaff,
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        role: formRole,
        pinCode: cleanedPin,
        isActive: formIsActive,
        allowedTabs: formAllowedTabs,
        permissions: formPermissions,
      };

      const newList = staffMembers.map((s) => (s.id === updated.id ? updated : s));
      onUpdateStaffMembers(newList);

      if (currentStaff.id === updated.id) {
        onUpdateCurrentStaff(updated);
      }

      setSavedSuccessMessage(isAr ? `تم تحديث صلاحيات "${updated.name}" بنجاح ✅` : `Permissions updated for "${updated.name}" ✅`);
    } else {
      // Create new
      const newMember: StaffMember = {
        id: `staff-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        role: formRole,
        pinCode: cleanedPin,
        isActive: formIsActive,
        allowedTabs: formAllowedTabs,
        permissions: formPermissions,
        createdAt: new Date().toISOString(),
      };

      onUpdateStaffMembers([...staffMembers, newMember]);
      setSavedSuccessMessage(isAr ? `تم إضافة المستخدم الجديد "${newMember.name}" وتحديد صلاحياته ✅` : `New staff member "${newMember.name}" added ✅`);
    }

    setEditingStaff(null);
    setIsNewUserModal(false);
    setTimeout(() => setSavedSuccessMessage(''), 4000);
  };

  const handleDeleteStaff = (staffId: string) => {
    const target = staffMembers.find((s) => s.id === staffId);
    if (!target) return;
    if (target.role === 'owner') {
      alert(isAr ? 'لا يمكن حذف حساب المدير العام الأساسي للحفاظ على أمان النظام.' : 'Cannot delete primary owner account.');
      return;
    }
    if (confirm(isAr ? `هل أنت متأكد من حذف المستخدم "${target.name}"؟` : `Delete staff member "${target.name}"?`)) {
      const newList = staffMembers.filter((s) => s.id !== staffId);
      onUpdateStaffMembers(newList);
      if (currentStaff.id === staffId) {
        const owner = newList.find((s) => s.role === 'owner') || newList[0];
        onUpdateCurrentStaff(owner);
      }
    }
  };

  const handleSwitchToUser = (staff: StaffMember) => {
    if (!staff.isActive) {
      alert(isAr ? 'هذا الحساب معطل حالياً. قم بتفعيله أولاً للتمكن من الدخول.' : 'This account is inactive.');
      return;
    }
    onUpdateCurrentStaff(staff);
    setSavedSuccessMessage(isAr ? `تم التبديل بنجاح إلى حساب: ${staff.name} (${getRoleBadgeLabel(staff.role)})` : `Switched to ${staff.name}`);
    setTimeout(() => setSavedSuccessMessage(''), 3500);
  };

  const handlePinSwitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinInput.trim();
    if (!pin) return;

    const matched = staffMembers.find((s) => s.pinCode === pin && s.isActive);
    if (matched) {
      onUpdateCurrentStaff(matched);
      setIsPinSwitchModalOpen(false);
      setPinInput('');
      setPinError('');
      setSavedSuccessMessage(isAr ? `تم الدخول بنجاح بحساب "${matched.name}" رمز PIN صحيح ✅` : `Unlocked as ${matched.name} ✅`);
      setTimeout(() => setSavedSuccessMessage(''), 3500);
    } else {
      setPinError(isAr ? 'رمز PIN غير صحيح أو الحساب معطل.' : 'Invalid PIN code.');
    }
  };

  const getRoleBadgeLabel = (role: StaffRole) => {
    switch (role) {
      case 'owner':
        return isAr ? 'المدير العام (Owner)' : 'Owner';
      case 'cashier':
        return isAr ? 'كاشير نقطة البيع (Cashier)' : 'Cashier';
      case 'perfumer':
        return isAr ? 'خبير ومصمم العطور (Perfumer)' : 'Perfumer';
      case 'inventory':
        return isAr ? 'مسؤول المخزون (Inventory)' : 'Inventory';
      case 'marketing':
        return isAr ? 'مسؤول التسويق و CRM' : 'Marketing';
      default:
        return isAr ? 'دور مخصص' : 'Custom';
    }
  };

  const getRoleIcon = (role: StaffRole) => {
    switch (role) {
      case 'owner':
        return '👑';
      case 'cashier':
        return '🛍️';
      case 'perfumer':
        return '🧪';
      case 'inventory':
        return '📦';
      case 'marketing':
        return '🎯';
      default:
        return '👤';
    }
  };

  const getRoleBadgeColor = (role: StaffRole) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-400 text-black border-amber-500 font-black';
      case 'cashier':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'perfumer':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
      case 'inventory':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
      case 'marketing':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300 font-bold';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-black pb-12">
      {/* Top Header Card */}
      <div className="bg-white border border-neutral-200 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black font-serif uppercase tracking-wider text-black">
                  {isAr ? 'فريق العمل وتحديد الصلاحيات' : 'Staff & Role-Based Permissions'}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-300">
                  RBAC Security
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                {isAr 
                  ? 'إنشاء وتخصيص صلاحيات الوصول للوحة الإدارة لكل مستخدم بدقة (كاشير، مختبر، مخزون، مدير عام)' 
                  : 'Manage staff accounts, assign granular role permissions, and configure quick PIN access'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                setPinInput('');
                setPinError('');
                setIsPinSwitchModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold border border-neutral-300 transition cursor-pointer"
              title={isAr ? 'تبديل المستخدم الحالي برمز PIN السريع' : 'Switch User by PIN'}
            >
              <Key className="w-4 h-4 text-neutral-700" />
              <span>{isAr ? 'تبديل المستخدم (رمز PIN)' : 'Switch User'}</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? '+ إضافة مستخدم جديد' : '+ Add Staff Member'}</span>
            </button>
          </div>
        </div>

        {/* Success Toast Banner */}
        {savedSuccessMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <span>{savedSuccessMessage}</span>
            </div>
            <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
              {isAr ? 'تم التطبيق فوراً' : 'Applied Live'}
            </span>
          </div>
        )}

        {/* Current Active User Profile Banner */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-xl shrink-0">
              {getRoleIcon(currentStaff.role)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-500">{isAr ? 'المستخدم النشط حالياً:' : 'Active Session:'}</span>
                <span className="text-sm font-black text-black">{currentStaff.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRoleBadgeColor(currentStaff.role)}`}>
                  {getRoleBadgeLabel(currentStaff.role)}
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 flex flex-wrap items-center gap-2 mt-0.5">
                <span>{isAr ? 'التبويبات المسموحة:' : 'Allowed Tabs:'} <strong>{currentStaff.role === 'owner' ? (isAr ? 'كافة التبويبات (17)' : 'All 17') : currentStaff.allowedTabs.length}</strong></span>
                <span>•</span>
                <span>{isAr ? 'رمز الدخول السريع PIN:' : 'PIN:'} <strong className="font-mono">{currentStaff.pinCode}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{isAr ? 'الجلسة مفعلة' : 'Live Active'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Role Explanations Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-2xl">👑</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Owner</span>
          </div>
          <h4 className="font-bold text-xs text-black">{isAr ? 'المدير العام' : 'Store Owner'}</h4>
          <p className="text-[11px] text-neutral-500 leading-snug">
            {isAr ? 'صلاحيات مطلقة 100% على كافة التبويبات، الأسعار، الإعدادات، وكشف الأرباح.' : 'Full access to all tabs, financial reports & pricing.'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🛍️</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">POS</span>
          </div>
          <h4 className="font-bold text-xs text-black">{isAr ? 'كاشير الصالة' : 'POS Cashier'}</h4>
          <p className="text-[11px] text-neutral-500 leading-snug">
            {isAr ? 'مخصص لنقطة البيع وإصدار الفواتير فقط، مع حظر تعديل أسعار العطور والإعدادات.' : 'Limited to POS terminal and invoices only.'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🧪</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">Lab</span>
          </div>
          <h4 className="font-bold text-xs text-black">{isAr ? 'خبير ومصمم العطور' : 'Master Perfumer'}</h4>
          <p className="text-[11px] text-neutral-500 leading-snug">
            {isAr ? 'صلاحيات حاسبة العيارات، الوصفات الملكية، وسجل دفعات تصنيع العطور.' : 'Compounding, bespoke recipes and batches only.'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-2xl">📦</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">Warehouse</span>
          </div>
          <h4 className="font-bold text-xs text-black">{isAr ? 'مسؤول المخزون' : 'Inventory Manager'}</h4>
          <p className="text-[11px] text-neutral-500 leading-snug">
            {isAr ? 'مخصص للمواد الخام، الزيوت، الموردين، وإدخال كميات المخزون.' : 'Raw materials, fragrance stocks and suppliers.'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🎯</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">Marketing</span>
          </div>
          <h4 className="font-bold text-xs text-black">{isAr ? 'التسويق و CRM' : 'Marketing & Ads'}</h4>
          <p className="text-[11px] text-neutral-500 leading-snug">
            {isAr ? 'إدارة دليل الزبائن، بكسل الإعلانات Meta، الكوبونات وبنرات المتجر.' : 'CRM leads, Meta pixels, promo codes and banners.'}
          </p>
        </div>
      </div>

      {/* Staff Members List */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-black" />
            <h3 className="font-bold text-sm sm:text-base text-black">
              {isAr ? 'قائمة أعضاء فريق العمل والمستخدمين' : 'Staff Members Directory'}
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-500">
            {staffMembers.length} {isAr ? 'مستخدمين' : 'users'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staffMembers.map((staff) => {
            const isCurrent = currentStaff.id === staff.id;
            const isShowingPin = !!showPins[staff.id];

            return (
              <div
                key={staff.id}
                className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-neutral-50/80 border-black shadow-xs ring-1 ring-black'
                    : 'bg-white border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div>
                  {/* Card Header: Avatar + Name + Role */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-lg shrink-0">
                        {getRoleIcon(staff.role)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-black truncate">{staff.name}</h4>
                          {isCurrent && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-black text-white uppercase">
                              {isAr ? 'أنت' : 'You'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 font-mono truncate">
                          {staff.phone || staff.email || (isAr ? 'بدون هاتف' : 'No phone')}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${getRoleBadgeColor(staff.role)}`}>
                      {getRoleBadgeLabel(staff.role)}
                    </span>
                  </div>

                  {/* PIN Code & Status Bar */}
                  <div className="mt-3 p-2 rounded-xl bg-neutral-100/70 border border-neutral-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-[11px] text-neutral-600 font-bold">{isAr ? 'كود الدخول (PIN):' : 'PIN:'}</span>
                      <span className="font-mono font-bold text-black tracking-widest text-xs">
                        {isShowingPin ? staff.pinCode : '••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPins((prev) => ({ ...prev, [staff.id]: !prev[staff.id] }))}
                        className="text-[10px] text-neutral-500 hover:text-black transition"
                        title={isShowingPin ? (isAr ? 'إخفاء الرمز' : 'Hide') : (isAr ? 'إظهار الرمز' : 'Show')}
                      >
                        {isShowingPin ? '🙈' : '👁️'}
                      </button>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      staff.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {staff.isActive ? (isAr ? '● نشط' : 'Active') : (isAr ? 'معطل' : 'Inactive')}
                    </span>
                  </div>

                  {/* Permitted Tabs Chips */}
                  <div className="mt-2.5">
                    <div className="text-[10px] font-bold text-neutral-500 mb-1">
                      {isAr ? 'التبويبات المسموح بالدخول إليها:' : 'Permitted Tabs:'}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {staff.role === 'owner' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                          {isAr ? '👑 كافة التبويبات والصلاحيات (وصول كامل)' : 'Full Access to All 17 Tabs'}
                        </span>
                      ) : (
                        staff.allowedTabs.map((tabId) => (
                          <span
                            key={tabId}
                            className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700 border border-neutral-200"
                          >
                            {tabId}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(staff)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition cursor-pointer border border-neutral-200"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تحديد الصلاحيات' : 'Edit Permissions'}</span>
                    </button>

                    {staff.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staff.id)}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title={isAr ? 'حذف المستخدم' : 'Delete user'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleSwitchToUser(staff)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                      title={isAr ? 'التبديل إلى هذا الحساب فوراً' : 'Switch to this account'}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تسجيل دخول' : 'Switch'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL: EDIT / CREATE STAFF PERMISSIONS ================= */}
      {(editingStaff !== null || isNewUserModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center text-base">
                  {getRoleIcon(formRole)}
                </div>
                <div>
                  <h3 className="text-base font-black text-black">
                    {isNewUserModal 
                      ? (isAr ? 'إضافة مستخدم جديد وتحديد صلاحياته' : 'Add New Staff Member')
                      : (isAr ? `تحديد صلاحيات: ${formName || 'المستخدم'}` : `Edit Permissions: ${formName}`)}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {isAr ? 'حدد الدور الوظيفي، كود الدخول، والتبويبات المسموح بالدخول إليها' : 'Set role, PIN code, and allowed tabs'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingStaff(null);
                  setIsNewUserModal(false);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffForm} className="space-y-4 text-xs">
              {/* Basic Info Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">{isAr ? 'اسم المستخدم / الموظف *' : 'Name *'}</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={isAr ? 'مثال: أحمد الكاشير' : 'e.g. Ahmad Cashier'}
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-black font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">{isAr ? 'الدور الوظيفي الرئيسي *' : 'Role *'}</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-black font-bold"
                  >
                    <option value="owner">👑 {isAr ? 'المدير العام (Owner) — صلاحيات كاملة' : 'Owner (Full Access)'}</option>
                    <option value="cashier">🛍️ {isAr ? 'كاشير الصالة (Cashier) — POS وفواتير' : 'POS Cashier'}</option>
                    <option value="perfumer">🧪 {isAr ? 'خبير ومصمم العطور (Perfumer) — مختبر ووصفات' : 'Perfumer (Lab)'}</option>
                    <option value="inventory">📦 {isAr ? 'مسؤول المخزون (Inventory) — موردين ومواد' : 'Inventory'}</option>
                    <option value="marketing">🎯 {isAr ? 'مسؤول التسويق و CRM — زبائن وبكسل' : 'Marketing & CRM'}</option>
                    <option value="custom">👤 {isAr ? 'دور مخصص (Custom Permissions)' : 'Custom'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    {isAr ? 'كود الدخول السريع (PIN 4 أرقام) *' : 'Quick Login PIN (4 Digits) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={formPin}
                      onChange={(e) => setFormPin(e.target.value)}
                      placeholder="1234"
                      className="w-full p-2.5 ps-9 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-black font-mono font-bold tracking-widest"
                    />
                    <Key className="w-4 h-4 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">{isAr ? 'رقم الهاتف (اختياري)' : 'Phone (optional)'}</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+961 70 123 456"
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-black font-mono"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-black">{isAr ? 'حالة الحساب' : 'Account Status'}</div>
                  <div className="text-[11px] text-neutral-500">
                    {formIsActive 
                      ? (isAr ? 'الحساب مفعّل وجاهز لتسجيل الدخول' : 'Account is active') 
                      : (isAr ? 'الحساب معطل ومحظور من الدخول' : 'Account is disabled')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    formIsActive ? 'bg-black' : 'bg-neutral-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      formIsActive ? (isAr ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sensitive Authority Switches */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>{isAr ? 'صلاحيات العمليات والبيانات الحساسة:' : 'Sensitive Operational Permissions:'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canGiveDiscounts}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canGiveDiscounts: e.target.checked })}
                      className="rounded accent-black w-4 h-4"
                    />
                    <span className="font-bold text-black">{isAr ? 'تطبيق الخصومات بالفواتير والـ POS' : 'Apply Discounts'}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canChangePrices}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canChangePrices: e.target.checked })}
                      className="rounded accent-black w-4 h-4"
                    />
                    <span className="font-bold text-black">{isAr ? 'تعديل أسعار العطور والزيوت' : 'Change Prices'}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canViewFinancials}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canViewFinancials: e.target.checked })}
                      className="rounded accent-black w-4 h-4"
                    />
                    <span className="font-bold text-black">{isAr ? 'الاطلاع على كشف الحساب المالي' : 'View Financial Reports'}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canExportData}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canExportData: e.target.checked })}
                      className="rounded accent-black w-4 h-4"
                    />
                    <span className="font-bold text-black">{isAr ? 'تصدير البيانات ونسخ CSV / Excel' : 'Export Data (CSV/Excel)'}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageStaff}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canManageStaff: e.target.checked })}
                      className="rounded accent-black w-4 h-4"
                    />
                    <span className="font-bold text-black">{isAr ? 'إدارة وتعديل فريق العمل والصلاحيات' : 'Manage Staff'}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canAccessSettings}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canAccessSettings: e.target.checked })}
                      className="rounded accent-black w-4 h-4"
                    />
                    <span className="font-bold text-black">{isAr ? 'تعديل إعدادات المتجر وهوية الدار' : 'Change Store Settings'}</span>
                  </label>
                </div>
              </div>

              {/* Granular Tab Permissions Checklist */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div>
                    <h4 className="font-bold text-sm text-black">
                      {isAr ? 'التبويبات المسموح بظهورها والوصول إليها:' : 'Allowed Admin Tabs:'}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {isAr ? 'اختر التبويبات المسموح للمستخدم برؤيتها في القائمة الجانبية' : 'Check the tabs this staff member can see & use'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormAllowedTabs(TAB_GROUPS.flatMap((g) => g.tabs.map((t) => t.id)))}
                      className="text-[10px] font-bold text-neutral-700 hover:text-black underline cursor-pointer"
                    >
                      {isAr ? 'تحديد الكل' : 'Select All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAllowedTabs([])}
                      className="text-[10px] font-bold text-neutral-700 hover:text-black underline cursor-pointer"
                    >
                      {isAr ? 'إلغاء التحديد' : 'Deselect All'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                  {TAB_GROUPS.map((group) => {
                    const allInGroup = group.tabs.every((t) => formAllowedTabs.includes(t.id));

                    return (
                      <div key={group.titleEn} className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-black flex items-center gap-1.5">
                            <span>{group.icon}</span>
                            <span>{isAr ? group.titleAr : group.titleEn}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleGroupTabs(group.tabs)}
                            className="text-[10px] text-neutral-500 hover:text-black font-semibold cursor-pointer"
                          >
                            {allInGroup ? (isAr ? 'إلغاء القسم' : 'Deselect') : (isAr ? 'تحديد القسم' : 'Select Group')}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {group.tabs.map((tab) => {
                            const isChecked = formAllowedTabs.includes(tab.id);

                            return (
                              <label
                                key={tab.id}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${
                                  isChecked
                                    ? 'bg-white border-black shadow-2xs font-bold text-black'
                                    : 'bg-neutral-100/50 border-neutral-200 text-neutral-600'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleTab(tab.id)}
                                  className="rounded accent-black w-4 h-4"
                                />
                                <span className="text-[11px] truncate">
                                  {isAr ? tab.labelAr : tab.labelEn}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStaff(null);
                    setIsNewUserModal(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
                >
                  {isAr ? 'حفظ وتطبيق الصلاحيات فوراً ✅' : 'Save & Apply Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: QUICK PIN SWITCH USER ================= */}
      {isPinSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-neutral-200">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-amber-400 mx-auto flex items-center justify-center font-bold">
              <Key className="w-6 h-6 text-amber-400" />
            </div>

            <div>
              <h3 className="text-base font-black text-black">
                {isAr ? 'تبديل المستخدم برمز PIN السريع' : 'Quick Staff Login by PIN'}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {isAr ? 'أدخل رمز الدخول السريع الخاص بك (4 أرقام)' : 'Enter your 4-digit staff PIN code'}
              </p>
            </div>

            <form onSubmit={handlePinSwitchSubmit} className="space-y-3">
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                placeholder="••••"
                className="w-full p-3 rounded-2xl bg-neutral-50 border-2 border-neutral-300 text-center font-mono text-2xl font-black tracking-widest focus:outline-none focus:border-black"
              />

              {pinError && (
                <div className="text-xs text-rose-600 font-bold animate-fadeIn">
                  {pinError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinSwitchModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  {isAr ? 'دخول ✅' : 'Unlock'}
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-neutral-100 text-[10px] text-neutral-400">
              {isAr ? 'الرموز الافتراضية: المدير (0000) • الكاشير (1111) • الخبير (2222)' : 'Default PINs: Owner (0000) • Cashier (1111) • Perfumer (2222)'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
