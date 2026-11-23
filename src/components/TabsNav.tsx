import React from 'react';
import { ShoppingBag, FlaskConical, Bookmark, Receipt, Table, Package, History, LayoutDashboard } from './icons';
import { useLanguage } from '../context/LanguageContext';

export type ActiveTab = 'store' | 'calculator' | 'recipes' | 'invoices' | 'catalog' | 'materials' | 'batches' | 'dashboard';

interface TabsNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  cartCount?: number;
  recipesCount: number;
  invoicesCount: number;
  oilsCount: number;
  materialsCount: number;
  batchesCount: number;
  lowStockCount: number;
  onSwitchToCustomer?: () => void;
}

export const TabsNav: React.FC<TabsNavProps> = ({
  activeTab,
  onSelectTab,
  cartCount = 0,
  recipesCount,
  invoicesCount,
  oilsCount,
  materialsCount,
  batchesCount,
  lowStockCount,
  onSwitchToCustomer,
}) => {
  const { language, t } = useLanguage();

  const tabs = [
    {
      id: 'dashboard' as ActiveTab,
      label: t('tabDashboard'),
      icon: LayoutDashboard,
      badge: lowStockCount > 0 ? `! ${lowStockCount}` : undefined,
      badgeColor: lowStockCount > 0 ? 'bg-rose-100 text-rose-800 border border-rose-300 font-black' : undefined,
    },
    {
      id: 'invoices' as ActiveTab,
      label: t('tabInvoices'),
      icon: Receipt,
      badge: invoicesCount,
    },
    {
      id: 'recipes' as ActiveTab,
      label: t('tabRecipes'),
      icon: Bookmark,
      badge: recipesCount,
      highlight: true,
    },
    {
      id: 'calculator' as ActiveTab,
      label: t('tabCalculator'),
      icon: FlaskConical,
      badge: language === 'ar' ? 'حرفي' : 'Artisan',
      highlight: true,
    },
    {
      id: 'catalog' as ActiveTab,
      label: t('tabCatalog'),
      icon: Table,
      badge: oilsCount,
    },
    {
      id: 'materials' as ActiveTab,
      label: t('tabMaterials'),
      icon: Package,
      badge: materialsCount,
    },
    {
      id: 'batches' as ActiveTab,
      label: t('tabBatches'),
      icon: History,
      badge: batchesCount,
    },
  ];

  return (
    <div className="bg-white border-b border-neutral-200 px-4 lg:px-8 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto py-2 scrollbar-none">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-black text-white shadow-sm border border-black'
                    : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-600'}`} />
                <span className={isActive ? 'text-white' : 'text-neutral-800'}>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white text-black font-black'
                        : tab.badgeColor || 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick jump to customer store */}
        {onSwitchToCustomer && (
          <button
            onClick={onSwitchToCustomer}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-black text-xs font-bold transition shadow-xs cursor-pointer"
            title={language === 'ar' ? 'معاينة متجر الزبائن' : 'Preview Customer Store'}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">{language === 'ar' ? 'صفحة الزبائن' : 'Customer Store'}</span>
            {cartCount > 0 && (
              <span className="min-w-[18px] h-4.5 px-1.5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
