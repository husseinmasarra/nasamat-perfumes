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
  Printer,
  Plus
} from './icons';
import { useLanguage } from '../context/LanguageContext';
import type { StaffMember } from '../types';

export type AdminNavTab = 
  | 'pos' 
  | 'orders' 
  | 'products' 
  | 'add-product'
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
    // 1. Core Analytics & Overview (أهم أولويات الإدارة)
    {
      id: 'overview' as AdminNavTab,
      labelEn: 'Overview & Reports',
      labelAr: 'نظرة عامة والتقارير',
      icon: LayoutDashboard,
    },
    // 2. Orders & Sales
    {
      id: 'orders' as AdminNavTab,
      labelEn: 'Orders & Sales',
      labelAr: 'الطلبيات والمبيعات',
      icon: Package,
    },
    // 3. POS Terminal (الكاشير)
    {
      id: 'pos' as AdminNavTab,
      labelEn: 'POS Terminal',
      labelAr: 'نقطة البيع (الكاشير)',
      icon: ShoppingBag,
    },
    // 4. Products & Pricing
    {
      id: 'products' as AdminNavTab,
      labelEn: 'Products & Pricing',
      labelAr: 'المنتجات وقاعدة العطور',
      icon: Tag,
    },
    // 5. Add Product
    {
      id: 'add-product' as AdminNavTab,
      labelEn: 'Add Product',
      labelAr: 'إضافة منتج جديد',
      icon: Plus,
    },
    // 6. Categories & Photos
    {
      id: 'categories' as AdminNavTab,
      labelEn: 'Categories & Photos',
      labelAr: 'الأقسام وتعديل الصور',
      icon: Folder,
    },
    // 7. Customers & CRM
    {
      id: 'customers' as AdminNavTab,
      labelEn: 'Customers & CRM',
      labelAr: 'الزبائن وسجل الخلطات',
      icon: Users,
    },
    // 8. Coupons & Promos
    {
      id: 'coupons' as AdminNavTab,
      labelEn: 'Coupons & Promos',
      labelAr: 'الكوبونات والعروض',
      icon: Percent,
    },
    // 9. Hero Banner & Marketing
    {
      id: 'hero-banner' as AdminNavTab,
      labelEn: 'Hero Banner & Cards',
      labelAr: 'بنر المتجر والكروت',
      icon: ImageIcon,
    },
    // 10. Brands Catalog
    {
      id: 'brands' as AdminNavTab,
      labelEn: 'Brands',
      labelAr: 'الماركات ودور العطور',
      icon: Award,
    },
    // 11. Store Menu Builder
    {
      id: 'menu-builder' as AdminNavTab,
      labelEn: 'Menu Builder',
      labelAr: 'بناء قوائم المتجر',
      icon: Menu,
    },
    // 12. Lab Calculator & Calibers
    {
      id: 'calculator' as AdminNavTab,
      labelEn: 'Lab Calculator',
      labelAr: 'مختبر وحاسبة العيارات',
      icon: FlaskConical,
    },
    // 13. Signature Recipes
    {
      id: 'recipes' as AdminNavTab,
      labelEn: 'Signature Blends',
      labelAr: 'خلطات نسمات الملكية',
      icon: Bookmark,
    },
    // 14. Suppliers & Materials
    {
      id: 'suppliers' as AdminNavTab,
      labelEn: 'Suppliers & Materials',
      labelAr: 'الموردين والمواد الخام',
      icon: Truck,
    },
    // 15. Production Batches
    {
      id: 'batches' as AdminNavTab,
      labelEn: 'Production Batches',
      labelAr: 'سجل دفعات الإنتاج',
      icon: History,
    },
    // 16. Staff & Permissions
    {
      id: 'staff' as AdminNavTab,
      labelEn: 'Staff & Roles',
      labelAr: 'فريق العمل والصلاحيات',
      icon: UserCheck,
    },
    // 17. Tracking Pixels
    {
      id: 'pixel' as AdminNavTab,
      labelEn: 'Pixels & Ads Tracking',
      labelAr: 'بكسل وتتبع الإعلانات',
      icon: Target,
    },
    // 18. System Settings & Backup
    {
      id: 'settings' as AdminNavTab,
      labelEn: 'Settings & Backup',
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
        admin-sidebar fixed md:sticky top-0 start-0 z-40 h-screen max-h-screen w-60 min-w-[240px] max-w-[240px] bg-[#0c0c0e] text-white flex flex-col border-e border-neutral-800 shadow-2xl transition-transform duration-200 ease-in-out shrink-0 select-none overflow-hidden
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 rtl:translate-x-full rtl:md:translate-x-0'}
      `}>
        
        {/* Brand Profile Header */}
        <div className="px-3.5 py-2.5 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-700 bg-white p-0.5 shadow-sm shrink-0">
              <img src={isAr ? '/logo.png' : '/logo-en.webp'} alt={isAr ? 'شعار نسمات' : 'Nasamat'} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-serif font-black text-sm text-white tracking-wider flex items-center gap-1.5 uppercase">
                <span>{isAr ? 'نَسَمَات' : 'NASAMAT'}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-400 text-black font-black uppercase tracking-wider shadow-xs">
                  ADMIN
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 font-semibold uppercase">
                {isAr ? 'لوحة الإدارة' : 'Dashboard'}
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active User & Switch Profile Badge */}
        {currentStaff && (
          <div className="mx-2 my-1 px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {currentStaff.role === 'owner' ? (
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                ) : currentStaff.role === 'cashier' ? (
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                ) : currentStaff.role === 'perfumer' ? (
                  <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-neutral-300" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate leading-tight">{currentStaff.name}</div>
                <div className="text-[9px] text-amber-300 font-mono leading-tight">
                  {currentStaff.role === 'owner' ? (isAr ? 'المدير العام' : 'Owner') : currentStaff.role === 'cashier' ? (isAr ? 'كاشير' : 'Cashier') : currentStaff.role === 'perfumer' ? (isAr ? 'خبير عطور' : 'Perfumer') : (isAr ? 'مستخدم' : 'Staff')}
                </div>
              </div>
            </div>
            {onSwitchUser && (
              <button
                type="button"
                onClick={onSwitchUser}
                className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 hover:text-white transition cursor-pointer shrink-0"
                title={isAr ? 'تبديل المستخدم' : 'Switch User'}
              >
                <UserCheck className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Navigation Items (Exact Priority Hierarchy, Clean Without Scrollbars & Without Badges) */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-2 py-1 space-y-0.5 flex flex-col justify-between">
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
                className={`admin-sidebar-nav-btn ${isActive ? 'active' : ''} w-full flex items-center px-2.5 py-1.5 rounded-lg transition-all duration-150 text-start cursor-pointer group ${
                  isActive
                    ? 'bg-white text-black shadow-md font-black ring-1 ring-white/20'
                    : 'text-white hover:bg-white/10 font-bold'
                }`}
                style={{
                  color: isActive ? '#000000' : '#ffffff',
                  backgroundColor: isActive ? '#ffffff' : undefined,
                }}
                title={isAr ? item.labelAr : item.labelEn}
              >
                <div className="flex items-center gap-2.5 min-w-0 w-full">
                  <div className="w-4 h-4 min-w-[16px] max-w-[16px] shrink-0 flex items-center justify-center">
                    <Icon 
                      className="w-4 h-4 min-w-[16px] max-w-[16px] shrink-0 transition-colors"
                      style={{ color: isActive ? '#000000' : '#ffffff' }}
                    />
                  </div>
                  <span 
                    className={`text-[12px] tracking-wide truncate ${isActive ? 'font-black text-black' : 'font-bold text-white'}`}
                    style={{ color: isActive ? '#000000' : '#ffffff' }}
                  >
                    {isAr ? item.labelAr : item.labelEn}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Compact View Storefront & Security Footer (No Overflows, No Emojis, No Scrollbars) */}
        <div className="p-2 border-t border-neutral-800 space-y-1.5 bg-[#09090b] shrink-0">
          <div className="grid grid-cols-2 gap-1.5">
            {/* Executive Financial Statement */}
            {onOpenFinancialStatement && (!currentStaff || currentStaff.permissions.canViewFinancials) && (
              <button
                onClick={onOpenFinancialStatement}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition text-[11px] font-bold cursor-pointer border border-amber-500/40 bg-neutral-900 hover:bg-black text-amber-300 shadow-2xs hover:border-amber-400"
                style={{ color: '#fbbf24', backgroundColor: '#18181b' }}
                title={isAr ? 'كشف حساب الإدارة' : 'Executive Statement'}
              >
                <Printer className="w-3.5 h-3.5 shrink-0" style={{ color: '#fbbf24' }} />
                <span className="truncate">{isAr ? 'كشف الإدارة' : 'Statement'}</span>
              </button>
            )}

            {/* View Storefront */}
            <button
              onClick={onViewStorefront}
              className={`admin-store-btn flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition text-[11px] font-bold cursor-pointer border border-neutral-700 shadow-2xs hover:brightness-110 ${
                !onOpenFinancialStatement ? 'col-span-2' : ''
              }`}
              style={{ color: '#ffffff', backgroundColor: '#1e293b' }}
              title={isAr ? 'معاينة متجر الزبائن' : 'View Storefront'}
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" style={{ color: '#fbbf24' }} />
              <span className="truncate text-white">{isAr ? 'معاينة المتجر' : 'Storefront'}</span>
            </button>
          </div>

          {/* Admin Lock / Exit button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="admin-logout-btn w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer border border-rose-500/80 shadow-2xs hover:brightness-110"
              style={{ color: '#ffffff', backgroundColor: '#e11d48' }}
              title={isAr ? 'قفل الإدارة وخروج' : 'Lock Admin'}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: '#ffffff' }} />
              <span className="font-bold text-white">{isAr ? 'قفل الإدارة وخروج' : 'Lock Admin'}</span>
            </button>
          )}

          <div className="text-[9px] text-neutral-400 text-center font-mono leading-none pt-0.5">
            {isAr ? 'دار نَسَمَات • بيروت' : 'NASAMAT ATELIER • BEIRUT'}
          </div>
        </div>

      </aside>
    </>
  );
};
