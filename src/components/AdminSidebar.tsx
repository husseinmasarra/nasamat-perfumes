import React from 'react';
import { 
  ShoppingBag, 
  Package, 
  Tag, 
  Percent, 
  LayoutDashboard, 
  Folder, 
  Image as ImageIcon, 
  Award, 
  Menu, 
  Users, 
  UserCheck, 
  Truck, 
  Settings as SettingsIcon, 
  ExternalLink,
  FlaskConical,
  Bookmark,
  History,
  Lock,
  X,
  Target,
  Printer
} from './icons';
import { useLanguage } from '../context/LanguageContext';
import type { StaffMember } from '../types';

export type AdminNavTab = 
  | 'pos' 
  | 'orders' 
  | 'products' 
  | 'coupons' 
  | 'overview' 
  | 'categories' 
  | 'hero-banner' 
  | 'brands' 
  | 'menu-builder' 
  | 'customers' 
  | 'pixel' 
  | 'staff' 
  | 'suppliers' 
  | 'calculator' 
  | 'recipes' 
  | 'batches' 
  | 'settings';

interface AdminSidebarProps {
  currentTab: AdminNavTab;
  onSelectTab: (tab: AdminNavTab) => void;
  onViewStorefront: () => void;
  onLogout?: () => void;
  onOpenFinancialStatement?: () => void;
  lowStockCount?: number;
  ordersCount?: number;
  productsCount?: number;
  customersCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  currentStaff?: StaffMember;
  onSwitchUser?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onViewStorefront,
  onLogout,
  onOpenFinancialStatement,
  lowStockCount = 0,
  ordersCount = 0,
  productsCount = 0,
  customersCount = 0,
  isMobileOpen = false,
  onCloseMobile,
  currentStaff,
  onSwitchUser,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const navItems = [
    {
      id: 'pos' as AdminNavTab,
      labelEn: 'POS Terminal',
      labelAr: 'نقطة البيع (POS)',
      icon: ShoppingBag,
      badge: 'الكاشير',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    },
    {
      id: 'orders' as AdminNavTab,
      labelEn: 'Orders',
      labelAr: 'الطلبيات والمبيعات',
      icon: Package,
      badge: ordersCount > 0 ? `${ordersCount}` : undefined,
      badgeColor: 'bg-neutral-800 text-white border border-neutral-700',
    },
    {
      id: 'products' as AdminNavTab,
      labelEn: 'Products & Pricing',
      labelAr: 'المنتجات وقاعدة العطور',
      icon: Tag,
      badge: isAr ? '242 بالسوق' : '242 Market',
      badgeColor: 'bg-amber-400/20 text-amber-300 border border-amber-400/40',
    },
    {
      id: 'coupons' as AdminNavTab,
      labelEn: 'Coupons & Promos',
      labelAr: 'الكوبونات والعروض',
      icon: Percent,
    },
    {
      id: 'overview' as AdminNavTab,
      labelEn: 'Overview',
      labelAr: 'نظرة عامة والتقارير',
      icon: LayoutDashboard,
      badge: lowStockCount > 0 ? `! ${lowStockCount}` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold',
    },
    {
      id: 'categories' as AdminNavTab,
      labelEn: 'Categories & Photos',
      labelAr: 'الأقسام وتعديل الصور',
      icon: Folder,
      badge: isAr ? 'تعديل الصور' : 'Photos',
      badgeColor: 'bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold',
    },
    {
      id: 'hero-banner' as AdminNavTab,
      labelEn: 'Hero Banner & Cards',
      labelAr: 'بنر المتجر والكروت',
      icon: ImageIcon,
    },
    {
      id: 'brands' as AdminNavTab,
      labelEn: 'Brands',
      labelAr: 'الماركات ودور العطور',
      icon: Award,
    },
    {
      id: 'menu-builder' as AdminNavTab,
      labelEn: 'Menu Builder',
      labelAr: 'بناء قوائم المتجر',
      icon: Menu,
    },
    {
      id: 'customers' as AdminNavTab,
      labelEn: 'CRM & Meta Ads Leads',
      labelAr: 'الزبائن وحملات Meta Ads (CRM)',
      icon: Users,
      badge: 'CRM & Meta',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold',
    },
    {
      id: 'pixel' as AdminNavTab,
      labelEn: 'Pixels & Ads Tracking',
      labelAr: 'بكسل وتتبع الإعلانات (Pixel)',
      icon: Target,
      badge: 'Ads & Pixel',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold',
    },
    {
      id: 'staff' as AdminNavTab,
      labelEn: 'Staff & Roles',
      labelAr: 'فريق العمل والصلاحيات',
      icon: UserCheck,
    },
    {
      id: 'suppliers' as AdminNavTab,
      labelEn: 'Suppliers & Invoices',
      labelAr: 'الموردين والمواد الخام',
      icon: Truck,
    },
    {
      id: 'calculator' as AdminNavTab,
      labelEn: 'Lab & Calibers Calculator',
      labelAr: 'مختبر وحاسبة العيارات والنسب',
      icon: FlaskConical,
      badge: isAr ? 'عيارات ونسب' : 'Calibers',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold',
    },
    {
      id: 'recipes' as AdminNavTab,
      labelEn: 'Signature Blends',
      labelAr: 'خلطات نسمات الملكية',
      icon: Bookmark,
    },
    {
      id: 'batches' as AdminNavTab,
      labelEn: 'Production Batches',
      labelAr: 'سجل دفعات الإنتاج',
      icon: History,
    },
    {
      id: 'settings' as AdminNavTab,
      labelEn: 'Settings',
      labelAr: 'إعدادات النظام والنسخ',
      icon: SettingsIcon,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden cursor-pointer"
          onClick={onCloseMobile}
          onMouseDown={onCloseMobile}
        />
      )}

      {/* Main Vertical Sidebar matching media_1795121443094_2b8f2dff.png */}
      <aside className={`
        admin-sidebar fixed md:sticky top-0 start-0 z-40 h-screen w-64 min-w-[256px] max-w-[256px] bg-[#0c0c0e] text-white flex flex-col border-e border-neutral-800 shadow-2xl transition-transform duration-200 ease-in-out shrink-0 select-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 rtl:translate-x-full rtl:md:translate-x-0'}
      `}>
        
        {/* Brand Profile Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-neutral-700 bg-white p-0.5 shadow-sm shrink-0">
              <img src={isAr ? '/logo.png' : '/logo-en.webp'} alt={isAr ? 'شعار نسمات' : 'Nasamat'} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-serif font-black text-base text-white tracking-wider flex items-center gap-1.5 uppercase">
                <span>{isAr ? 'نَسَمَات' : 'NASAMAT'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-400 text-black font-black uppercase tracking-wider shadow-xs">
                  ADMIN
                </span>
              </div>
              <div className="text-[11px] text-neutral-300 font-semibold uppercase">
                {isAr ? 'لوحة القيادة v3.0' : 'Dashboard v3.0'}
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User & Switch Profile Badge */}
        {currentStaff && (
          <div className="mx-3 my-2 p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">
                {currentStaff.role === 'owner' ? '👑' : currentStaff.role === 'cashier' ? '🛍️' : currentStaff.role === 'perfumer' ? '🧪' : currentStaff.role === 'inventory' ? '📦' : '👤'}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{currentStaff.name}</div>
                <div className="text-[10px] text-amber-300 font-mono">
                  {currentStaff.role === 'owner' ? (isAr ? 'المدير العام' : 'Owner') : currentStaff.role === 'cashier' ? (isAr ? 'كاشير' : 'Cashier') : currentStaff.role === 'perfumer' ? (isAr ? 'خبير عطور' : 'Perfumer') : (isAr ? 'مستخدم' : 'Staff')}
                </div>
              </div>
            </div>
            {onSwitchUser && (
              <button
                type="button"
                onClick={onSwitchUser}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 hover:text-white transition cursor-pointer shrink-0"
                title={isAr ? 'تبديل المستخدم (رمز PIN)' : 'Switch User'}
              >
                <UserCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Navigation Items (Exact styling from media_1795121443094_2b8f2dff.png) */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-800">
          {navItems
            .filter((item) => {
              if (!currentStaff) return true;
              if (currentStaff.role === 'owner') return true;
              return currentStaff.allowedTabs.includes(item.id);
            })
            .map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`admin-sidebar-nav-btn ${isActive ? 'active' : ''} w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-start cursor-pointer group ${
                  isActive
                    ? 'bg-white text-black shadow-lg font-black ring-1 ring-white/20'
                    : 'text-white hover:bg-white/10 font-bold'
                }`}
                style={{
                  color: isActive ? '#000000' : '#ffffff',
                  backgroundColor: isActive ? '#ffffff' : undefined,
                }}
                title={isAr ? item.labelAr : item.labelEn}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 min-w-[20px] max-w-[20px] shrink-0 flex items-center justify-center">
                    <Icon 
                      className="w-5 h-5 min-w-[20px] max-w-[20px] shrink-0 transition-colors"
                      style={{ color: isActive ? '#000000' : '#ffffff' }}
                    />
                  </div>
                  <span 
                    className={`text-xs sm:text-[13px] tracking-wide truncate ${isActive ? 'font-black text-black' : 'font-bold text-white'}`}
                    style={{ color: isActive ? '#000000' : '#ffffff' }}
                  >
                    {isAr ? item.labelAr : item.labelEn}
                  </span>
                </div>

                {item.badge && (
                  <span 
                    className={`admin-badge text-[10px] px-2 py-0.5 rounded-full shrink-0 font-mono font-bold ${
                      isActive 
                        ? 'bg-black text-white' 
                        : (item.badgeColor || 'bg-neutral-800 text-white border border-neutral-700')
                    }`}
                    style={{
                      color: isActive ? '#ffffff' : undefined,
                      backgroundColor: isActive ? '#000000' : undefined,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Storefront & Security Footer */}
        <div className="p-3 border-t border-neutral-800 space-y-2 bg-[#09090b]">
          {/* Executive Financial Statement Trigger (Manager Only) */}
          {onOpenFinancialStatement && (!currentStaff || currentStaff.permissions.canViewFinancials) && (
            <button
              onClick={onOpenFinancialStatement}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer group border border-amber-500/40 bg-neutral-900 hover:bg-black text-amber-400 shadow-md hover:border-amber-400 hover:brightness-110"
              style={{ color: '#fbbf24', backgroundColor: '#18181b' }}
              title={isAr ? 'كشف حساب مالي تفصيلي يومي وشهري خاص بالمدير' : 'Manager Daily & Monthly Statement'}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 min-w-[16px] max-w-[16px] shrink-0 flex items-center justify-center">
                  <Printer className="w-4 h-4" style={{ color: '#fbbf24' }} />
                </div>
                <span className="font-bold text-amber-300" style={{ color: '#fcd34d' }}>
                  {isAr ? 'كشف حساب الإدارة' : 'Executive Statement'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {isAr ? 'يومي/شهري' : 'Daily/Mth'}
              </span>
            </button>
          )}

          {/* View Storefront (Direct match to bottom item in image) */}
          <button
            onClick={onViewStorefront}
            className="admin-store-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition text-xs font-bold cursor-pointer group border border-neutral-700 shadow-md hover:brightness-110"
            style={{ color: '#ffffff', backgroundColor: '#1e293b' }}
            title={isAr ? 'الانتقال إلى واجهة الزبائن ومتجر العطور' : 'Switch to Customer Storefront'}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 min-w-[16px] max-w-[16px] shrink-0 flex items-center justify-center">
                <ExternalLink className="w-4 h-4 min-w-[16px] max-w-[16px] shrink-0" style={{ color: '#fbbf24' }} />
              </div>
              <span className="font-bold text-white" style={{ color: '#ffffff' }}>
                {isAr ? 'معاينة متجر الزبائن' : 'View Storefront'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold" style={{ color: '#fbbf24' }}>
              ↗
            </span>
          </button>

          {/* Admin Lock / Exit button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="admin-logout-btn w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border border-rose-500 shadow-md hover:brightness-110"
              style={{ color: '#ffffff', backgroundColor: '#e11d48' }}
              title={isAr ? 'قفل صفحة الإدارة والعودة للمتجر' : 'Lock Admin Session'}
            >
              <div className="w-4 h-4 min-w-[16px] max-w-[16px] shrink-0 flex items-center justify-center">
                <Lock className="w-4 h-4" style={{ color: '#ffffff' }} />
              </div>
              <span className="font-bold text-white" style={{ color: '#ffffff' }}>
                {isAr ? 'قفل الإدارة وخروج' : 'Lock Admin'}
              </span>
            </button>
          )}

          <div className="text-[10px] text-neutral-300 text-center font-mono pt-1" style={{ color: '#d1d5db' }}>
            {isAr ? 'نَسَمَات للعطور الفاخرة • بيروت' : 'NASAMAT LUXURY BESPOKE PERFUMERY • BEIRUT'}
          </div>
        </div>

      </aside>
    </>
  );
};
