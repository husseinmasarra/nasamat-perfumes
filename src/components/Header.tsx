import React from 'react';
import { 
  Download, 
  RotateCcw, 
  AlertTriangle, 
  Search, 
  ShoppingBag, 
  Settings, 
  Lock, 
  Users, 
  GoogleIcon, 
  AppleIcon, 
  FacebookIcon, 
  InstagramIcon, 
  WhatsAppOfficialBadge, 
  InstagramOfficialBadge, 
  FacebookOfficialBadge 
} from './icons';
import type { FragranceOil, RawMaterial, AppSettings, CustomerUser } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatWhatsAppPhone } from '../utils/whatsappConcierge';

export type PortalMode = 'customer' | 'admin';

interface HeaderProps {
  portal: PortalMode;
  onSelectPortal: (portal: PortalMode) => void;
  oils: FragranceOil[];
  materials: RawMaterial[];
  settings: AppSettings;
  cartCount?: number;
  customerUser?: CustomerUser | null;
  onOpenCustomerAuth?: () => void;
  onOpenCart?: () => void;
  onOpenBackup: () => void;
  onOpenSmartSearch: () => void;
  onResetDefaults: () => void;
  onUpdateCurrency: (currency: string) => void;
  onToggleTheme?: () => void;
  onLogout?: () => void;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  portal,
  onSelectPortal,
  oils,
  materials,
  settings,
  cartCount = 0,
  customerUser = null,
  onOpenCustomerAuth,
  onOpenCart,
  onOpenBackup,
  onOpenSmartSearch,
  onResetDefaults,
  onUpdateCurrency,
  onToggleTheme,
  onLogout,
  onGoHome,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const lowStockOils = oils.filter((o) => o.currentQuantity <= o.lowStockThreshold).length;
  const lowStockMaterials = materials.filter((m) => m.currentQuantity <= m.lowStockThreshold).length;
  const totalLowStock = lowStockOils + lowStockMaterials;

  const [isCartBumping, setIsCartBumping] = React.useState(false);
  const prevCartCountRef = React.useRef(cartCount);

  // Auto-rotating announcement ticker for seamless mobile & tablet display (zero scrollbar)
  const [announcementIdx, setAnnouncementIdx] = React.useState(0);

  const customerAnnouncements = React.useMemo(() => {
    return language === 'ar'
      ? [
          { icon: '🚚', text: 'توصيل سريع لكافة الأراضي اللبنانية' },
          { icon: '💎', text: '100% عطور أصلية فاخرة بتركيز إكستري دو بارفان' },
          { icon: '💵', text: 'الدفع عند الاستلام نقداً (USD أو LBP)' },
          { icon: '🇱🇧', text: 'صياغة حرفية في بيروت بزيوت فرنسية وسويسرية' },
        ]
      : [
          { icon: '🚚', text: 'Fast Express Delivery Across All Lebanon' },
          { icon: '💎', text: '100% Authentic Luxury Extrait de Parfum' },
          { icon: '💵', text: 'Cash on Delivery (USD or LBP)' },
          { icon: '🇱🇧', text: 'Artisan Crafted in Beirut with French & Swiss Oils' },
        ];
  }, [language]);

  const adminAnnouncements = React.useMemo(() => {
    return language === 'ar'
      ? [
          { icon: '⚙️', text: 'نظام نسمات لإدارة مختبر العطور والمخزون' },
          { icon: '📊', text: 'تحديث فوري للأرصدة والفواتير والأرباح' },
          { icon: '🧪', text: 'صياغة التراكيب والعيارات المخبرية' },
        ]
      : [
          { icon: '⚙️', text: 'Nasamat Laboratory & Inventory Management System' },
          { icon: '📊', text: 'Real-time Stock, Sales & Invoicing Sync' },
          { icon: '🧪', text: 'Artisan Formulations & Alcohol Caliber Engine' },
        ];
  }, [language]);

  const activeAnnouncements = portal === 'customer' ? customerAnnouncements : adminAnnouncements;

  React.useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % activeAnnouncements.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [activeAnnouncements.length]);

  React.useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setIsCartBumping(true);
      const timer = setTimeout(() => setIsCartBumping(false), 600);
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  React.useEffect(() => {
    const handleBump = () => {
      setIsCartBumping(true);
      setTimeout(() => setIsCartBumping(false), 600);
    };
    window.addEventListener('nasamat_cart_bump', handleBump);
    return () => window.removeEventListener('nasamat_cart_bump', handleBump);
  }, []);

  // Shared official social badges
  const renderSocialBadges = (iconSize: string = 'w-4 h-4') => (
    <div className="flex items-center gap-1.5 shrink-0">
      <a 
        href={`https://wa.me/${formatWhatsAppPhone(settings.storePhone)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 active:scale-95 transition-transform p-0.5"
        title="WhatsApp"
        aria-label="WhatsApp"
      >
        <WhatsAppOfficialBadge className={iconSize} />
      </a>
      <a
        href={settings.instagramUrl || '#'}
        target={settings.instagramUrl ? '_blank' : '_self'}
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!settings.instagramUrl) {
            e.preventDefault();
            alert(language === 'ar' ? 'سيتم تفعيل وإضافة رابط حساب الإنستغرام قريباً!' : 'Instagram link will be added soon!');
          }
        }}
        className="hover:scale-110 active:scale-95 transition-transform p-0.5"
        title="Instagram"
        aria-label="Instagram"
      >
        <InstagramOfficialBadge className={iconSize} />
      </a>
      <a
        href={settings.facebookUrl || '#'}
        target={settings.facebookUrl ? '_blank' : '_self'}
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!settings.facebookUrl) {
            e.preventDefault();
            alert(language === 'ar' ? 'سيتم تفعيل وإضافة رابط صفحة الفيسبوك قريباً!' : 'Facebook link will be added soon!');
          }
        }}
        className="hover:scale-110 active:scale-95 transition-transform p-0.5"
        title="Facebook"
        aria-label="Facebook"
      >
        <FacebookOfficialBadge className={iconSize} />
      </a>
    </div>
  );

  return (
    <div className="w-full select-none">
      {/* Haute Parfumerie Top Gold Shimmer Bar */}
      <div className="w-full h-0.5 luxury-top-shimmer-bar" />

      {/* ================= TIER 1: LUXURY TOP ANNOUNCEMENT & UTILITIES RIBBON ================= */}
      {/* 100% Full-Width Mobile Optimized with Zero Scrollbar */}
      <div className="bg-black text-white text-[11px] font-bold py-1.5 px-3 sm:px-4 lg:px-8 border-b border-zinc-800 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 w-full">
          
          {/* Start Side: Official Social Icons & Lebanon Pin */}
          <div className="flex items-center gap-2 shrink-0">
            {renderSocialBadges('w-4 h-4')}
            <span className="hidden sm:inline font-mono text-[10px] text-zinc-400 ps-1 border-s border-zinc-700">
              BEIRUT · LEBANON
            </span>
          </div>

          {/* Center: Live Seamless Rotating Ticker (Zero Horizontal Overflow / Zero Scrollbar) */}
          <div className="flex-1 text-center font-semibold text-[10px] sm:text-xs tracking-wider overflow-hidden px-1">
            {/* Desktop stationary display */}
            <div className="hidden lg:flex items-center justify-center gap-3">
              {portal === 'customer' ? (
                <>
                  <span>{language === 'ar' ? 'توصيل سريع لكافة الأراضي اللبنانية' : 'Fast Express Delivery Across Lebanon'}</span>
                  <span className="text-amber-400">·</span>
                  <span>{language === 'ar' ? '100% عطور أصلية فاخرة مضمونة' : '100% Authentic Luxury Guaranteed'}</span>
                  <span className="text-amber-400">·</span>
                  <span>{language === 'ar' ? 'دفع عند الاستلام (COD)' : 'Cash on Delivery (COD)'}</span>
                </>
              ) : (
                <>
                  <span className="text-amber-400">⚙️</span>
                  <span>{language === 'ar' ? 'نظام نسمات لإدارة وتشغيل مختبر العطور والمخزون' : 'Nasamat Atelier Laboratory & Inventory System'}</span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-emerald-400">v3.0 Production</span>
                </>
              )}
            </div>

            {/* Mobile & Tablet smoothly transitioning ticker */}
            <div className="lg:hidden flex items-center justify-center gap-1.5 transition-all duration-500 ease-in-out truncate">
              <span className="text-xs shrink-0">{activeAnnouncements[announcementIdx]?.icon}</span>
              <span className="truncate">{activeAnnouncements[announcementIdx]?.text}</span>
            </div>
          </div>

          {/* End Side: Mobile & Desktop Quick Language & Currency Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Language Toggle (Always directly accessible in 1 tap on Mobile and Desktop) */}
            <button
              onClick={toggleLanguage}
              className="px-2 py-0.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-white text-[10px] sm:text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer border border-zinc-700 shadow-2xs"
              title={language === 'ar' ? 'Switch to English' : 'التحويل للغة العربية'}
              aria-label="Toggle Language"
            >
              <span className="text-[10px]">🌐</span>
              <span>{language === 'ar' ? 'EN' : 'AR'}</span>
            </button>

            {/* Quick Currency Selector (Always accessible in 1 tap on Mobile and Desktop) */}
            <div className="flex items-center bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-1.5 py-0.5 text-[10px] sm:text-xs text-white font-bold shadow-2xs">
              <select
                value={settings.currency || '$'}
                onChange={(e) => onUpdateCurrency(e.target.value)}
                aria-label="Currency"
                className="bg-transparent text-white font-black focus:outline-none cursor-pointer text-[10px] sm:text-xs text-center"
              >
                <option value="$" className="bg-black text-white">$ USD</option>
                <option value="ل.ل" className="bg-black text-white">{language === 'ar' ? 'ل.ل LBP' : 'LBP'}</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* ================= TIER 2: MAIN LUXURY HEADER ================= */}
      {/* Perfectly fitted, full-screen mobile alignment with zero horizontal scroll */}
      <header className="bg-white/95 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40 px-2.5 sm:px-4 lg:px-8 py-2 sm:py-2.5 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4 w-full">
          
          {/* Start (Left/Start): Menu Drawer Trigger & Quick Search on Mobile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Menu Drawer Button (Customer & Admin) */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('nasamat_open_menu'))}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 active:scale-95 border border-neutral-300 text-black text-xs font-bold transition cursor-pointer shadow-2xs"
              title={language === 'ar' ? 'فتح القائمة وتصفح الأقسام' : 'Open Navigation Menu'}
              aria-label="Menu"
            >
              <span className="text-sm font-black leading-none">☰</span>
              <span className="hidden sm:inline">{language === 'ar' ? 'القائمة' : 'Menu'}</span>
            </button>

            {/* Quick Search Button (Always accessible on Mobile and Desktop) */}
            <button
              onClick={onOpenSmartSearch}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 active:scale-95 border border-neutral-300 text-black text-xs font-bold transition cursor-pointer shadow-2xs"
              title={language === 'ar' ? 'البحث السريع في العطور والمواد (Ctrl + K)' : 'Quick Search (Ctrl + K)'}
              aria-label="Quick Search"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
              <span className="hidden lg:inline">{t('smartSearchBtn')}</span>
              <kbd className="hidden xl:inline-block px-1.5 py-0.2 rounded bg-white border border-neutral-300 text-[10px] text-neutral-700 font-mono">
                Ctrl+K
              </kbd>
            </button>

            {/* Desktop Status Badge */}
            {portal === 'customer' ? (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs text-neutral-800 font-semibold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{language === 'ar' ? '🇱🇧 بيروت • عطور نيش إكستري دو بارفان' : 'Beirut • Extrait Niche Perfumes'}</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-300 text-xs font-black text-neutral-900 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>{language === 'ar' ? 'نظام نسمات' : 'Nasamat'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-black uppercase">
                  ADMIN
                </span>
              </div>
            )}
          </div>

          {/* Center: Flacon Emblem & Brand Name in Middle of Screen */}
          <div className="flex items-center justify-center min-w-0 px-1">
            <button
              onClick={onGoHome}
              className="group flex items-center gap-1.5 sm:gap-2.5 p-0.5 sm:p-1 rounded-2xl hover:bg-neutral-50 transition-all duration-200 cursor-pointer focus:outline-none min-w-0"
              title={language === 'ar' ? 'نَسَمَات — العودة إلى الصفحة الرئيسية' : 'Nasamat — Return to Home'}
            >
              {/* Circular Emblem */}
              <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 rounded-full overflow-hidden border-2 border-black/85 bg-white shadow-2xs group-hover:scale-105 transition-all duration-300 shrink-0">
                <img
                  src={language === 'ar' ? '/logo.png' : '/logo-en.webp'}
                  alt={language === 'ar' ? 'شعار نسمات لتركيب العطور الفاخرة' : 'Nasamat Luxury Bespoke Perfumery'}
                  className="w-full h-full object-contain p-0.5"
                />
              </div>

              {/* Typography */}
              <div className="flex flex-col items-start text-start min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-base sm:text-xl md:text-2xl font-black tracking-wide text-black group-hover:text-neutral-800 transition-colors leading-tight truncate ${
                    language === 'ar' ? "font-['Almarai',sans-serif]" : "font-['Cinzel',serif] uppercase"
                  }`}>
                    {language === 'ar' ? 'نَسَمَات' : 'NASAMAT'}
                  </span>
                </div>
                <span className={`text-[8px] sm:text-[10px] md:text-[11px] text-neutral-600 font-bold -mt-0.5 truncate ${
                  language === 'ar' ? "font-['Almarai',sans-serif] tracking-normal" : "font-sans uppercase tracking-wider text-neutral-500"
                }`}>
                  {language === 'ar' ? 'لتركيب العطور الفاخرة' : 'LUXURY BESPOKE'}
                </span>
              </div>
            </button>
          </div>

          {/* End (Right/End): Customer Account & Cart Buttons on Mobile and Desktop */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* ================= CUSTOMER PORTAL CONTROLS ================= */}
            {portal === 'customer' && (
              <>
                {/* Customer Account Button (Always accessible on Mobile and Desktop) */}
                {onOpenCustomerAuth && (
                  <button
                    onClick={onOpenCustomerAuth}
                    className={`flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 ${
                      customerUser
                        ? 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
                        : 'bg-white hover:bg-neutral-100 border-neutral-300 text-black'
                    }`}
                    title={customerUser ? (language === 'ar' ? `حساب: ${customerUser.name}` : `Account: ${customerUser.name}`) : (language === 'ar' ? 'تسجيل الدخول عبر Google أو Apple' : 'Sign in with Google / Apple')}
                    aria-label="Account"
                  >
                    {customerUser ? (
                      <>
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-amber-400 shrink-0">
                          <img
                            src={customerUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customerUser.name)}&background=000&color=fff`}
                            alt={customerUser.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="hidden sm:inline font-bold max-w-[80px] sm:max-w-[110px] truncate">{customerUser.name.split(' ')[0]}</span>
                        {customerUser.provider === 'google' && <GoogleIcon className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />}
                        {customerUser.provider === 'apple' && <AppleIcon className="w-3.5 h-3.5 text-black shrink-0 hidden sm:inline" />}
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 text-black shrink-0" />
                        <span className="hidden sm:inline">{language === 'ar' ? 'حسابي' : 'Sign In'}</span>
                        <div className="hidden md:flex items-center gap-1 shrink-0 ps-1 border-s border-neutral-300 ms-0.5">
                          <GoogleIcon className="w-3.5 h-3.5" />
                          <AppleIcon className="w-3.5 h-3.5 text-black" />
                        </div>
                      </>
                    )}
                  </button>
                )}

                {/* Cart Button (Always visible on Mobile and Desktop with live count) */}
                {onOpenCart && (
                  <button
                    onClick={onOpenCart}
                    className={`relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 ${
                      isCartBumping ? 'animate-cart-bump ' : ''
                    }${
                      cartCount > 0
                        ? 'bg-amber-50/80 hover:bg-amber-100/80 border-amber-300 text-neutral-900'
                        : 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-800 hover:border-amber-400'
                    }`}
                    title={language === 'ar' ? 'سلة المشتريات' : 'Shopping Cart'}
                    aria-label="Cart"
                  >
                    <ShoppingBag className={`w-4 h-4 ${cartCount > 0 ? 'text-amber-700' : 'text-neutral-700'}`} />
                    <span className="hidden sm:inline text-neutral-900 font-bold">{t('storeViewCart')}</span>
                    {cartCount > 0 && (
                      <span className="flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-4.5 sm:h-5 px-1 sm:px-1.5 rounded-full bg-amber-600 text-white font-black text-[10px] sm:text-[11px] shadow-xs">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}
              </>
            )}

            {/* ================= ADMIN PORTAL CONTROLS ================= */}
            {portal === 'admin' && (
              <>
                {/* Low Stock Warning Pill */}
                {totalLowStock > 0 && (
                  <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shadow-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{totalLowStock}</span>
                  </div>
                )}

                {/* Theme Toggle Button */}
                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    className="flex items-center justify-center p-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-black text-xs font-bold transition shadow-xs cursor-pointer"
                    title={settings.theme === 'light' ? (language === 'ar' ? 'التبديل إلى الوضع الداكن' : 'Switch to Dark Mode') : (language === 'ar' ? 'التبديل إلى الوضع الفاتح' : 'Switch to Light Mode')}
                  >
                    <span>{settings.theme === 'light' ? '☀️' : '🌙'}</span>
                  </button>
                )}

                {/* Backup / Export button */}
                <button
                  onClick={onOpenBackup}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-300 text-black text-xs font-bold transition cursor-pointer shadow-xs"
                  title={t('backupReportsBtn')}
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span className="hidden xl:inline">{t('backupReportsBtn')}</span>
                </button>

                {/* Direct shortcut to Customer Store */}
                <button
                  onClick={() => onSelectPortal('customer')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black hover:bg-neutral-900 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
                  title={language === 'ar' ? 'معاينة متجر الزبائن' : 'View Customer Store'}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-white" />
                  <span className="text-white font-bold">{language === 'ar' ? 'متجر الزبائن' : 'Store'}</span>
                </button>

                {/* Admin Lock / Logout button */}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-white text-xs font-bold transition shadow-xs cursor-pointer border border-rose-500 shrink-0 hover:brightness-110"
                    style={{ color: '#ffffff', backgroundColor: '#e11d48' }}
                    title={language === 'ar' ? 'قفل صفحة الإدارة والعودة لصفحة الزبائن' : 'Lock Admin Portal'}
                  >
                    <Lock className="w-3.5 h-3.5" style={{ color: '#ffffff' }} />
                    <span className="font-bold text-white" style={{ color: '#ffffff' }}>{language === 'ar' ? 'قفل' : 'Lock'}</span>
                  </button>
                )}
              </>
            )}

          </div>
        </div>
      </header>
    </div>
  );
};
