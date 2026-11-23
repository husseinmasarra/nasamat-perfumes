import React from 'react';
import { Download, RotateCcw, AlertTriangle, Search, ShoppingBag, Settings, Lock, Users, GoogleIcon, AppleIcon, FacebookIcon, InstagramIcon, WhatsAppOfficialBadge, InstagramOfficialBadge, FacebookOfficialBadge } from './icons';
import type { FragranceOil, RawMaterial, AppSettings, CustomerUser } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatWhatsAppPhone, formatDisplayPhone } from '../utils/whatsappConcierge';

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

  return (
    <div className="w-full">
      {/* Haute Parfumerie Top Gold Shimmer Bar */}
      <div className="w-full h-0.5 luxury-top-shimmer-bar" />

      {/* StyLuxe Luxury Top Announcement Ticker Bar */}
      <div className="bg-black text-white text-[11px] font-bold py-2 px-4 tracking-[0.2em] uppercase border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-center overflow-x-auto scrollbar-none whitespace-nowrap gap-4">
          <span className="hidden md:inline font-mono text-[10px] text-zinc-400">BEIRUT · LEBANON</span>
          
          {portal === 'customer' ? (
            <div className="flex-1 text-center font-semibold text-xs tracking-wider">
              {language === 'ar' ? (
                <>
                  <span>توصيل سريع لكافة الأراضي اللبنانية</span>
                  <span className="mx-2 text-amber-400">·</span>
                  <span>100% عطور أصلية فاخرة مضمونة</span>
                  <span className="mx-2 text-amber-400">·</span>
                  <span>دفع عند الاستلام</span>
                </>
              ) : (
                <>
                  <span>Fast Express Delivery Across Lebanon</span>
                  <span className="mx-2 text-amber-400">·</span>
                  <span>100% Authentic Luxury Guaranteed</span>
                  <span className="mx-2 text-amber-400">·</span>
                  <span>Cash on Delivery</span>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 text-center font-semibold text-xs tracking-wider">
              {language === 'ar' ? (
                <>
                  <span className="text-amber-400">⚙️</span>
                  <span className="mx-1">نظام نسمات لإدارة وتشغيل مختبر العطور والمخزون</span>
                  <span className="mx-2 text-zinc-600">|</span>
                  <span>تحديث فوري للأرصدة والفواتير</span>
                  <span className="mx-2 text-zinc-600">|</span>
                  <span className="text-emerald-400">النسخة الإدارية v3.0</span>
                </>
              ) : (
                <>
                  <span className="text-amber-400">⚙️</span>
                  <span className="mx-1">Nasamat Atelier Laboratory & Inventory System</span>
                  <span className="mx-2 text-zinc-600">|</span>
                  <span>Live Stock & Invoicing Sync</span>
                  <span className="mx-2 text-zinc-600">|</span>
                  <span className="text-emerald-400">Admin Edition v3.0</span>
                </>
              )}
            </div>
          )}

          <div className="hidden lg:flex items-center gap-2.5">
            <a 
              href={`https://wa.me/${formatWhatsAppPhone(settings.storePhone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 active:scale-95 transition-transform"
              title="WhatsApp"
              aria-label="WhatsApp"
            >
              <WhatsAppOfficialBadge className="w-5 h-5" />
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
              className="hover:scale-110 active:scale-95 transition-transform"
              title="Instagram"
              aria-label="Instagram"
            >
              <InstagramOfficialBadge className="w-5 h-5" />
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
              className="hover:scale-110 active:scale-95 transition-transform"
              title="Facebook"
              aria-label="Facebook"
            >
              <FacebookOfficialBadge className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      <header className="bg-white/95 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40 px-4 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Side 1 (Start): Customer Menu Trigger & Info Badge OR Admin Status */}
          <div className="flex items-center gap-2 shrink-0">
            {portal === 'customer' ? (
              <div className="flex items-center gap-2">
                {/* Menu Drawer Trigger Button */}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('nasamat_open_menu'))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 hover:border-black/50 border border-neutral-300 text-black text-xs font-bold transition-all duration-150 cursor-pointer shadow-2xs"
                  title={language === 'ar' ? 'فتح القائمة وتصفح الأقسام' : 'Open Navigation Menu'}
                >
                  <span className="text-sm">☰</span>
                  <span>{language === 'ar' ? 'القائمة' : 'Menu'}</span>
                </button>

                <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-xs text-neutral-800 font-semibold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{language === 'ar' ? '🇱🇧 بيروت • عطور نيش إكستري دو بارفان' : 'Beirut • Extrait Niche Perfumes'}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-300 text-xs font-black text-neutral-900 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>{language === 'ar' ? 'نظام نسمات' : 'Nasamat'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-black uppercase">
                  ADMIN
                </span>
              </div>
            )}
          </div>

          {/* Side 2 (Center): Clickable Circular Logo & "نسمات" in Middle of Screen */}
          <div className="flex items-center justify-center shrink-0">
            <button
              onClick={onGoHome}
              className="group flex items-center gap-2.5 p-1 rounded-2xl hover:bg-neutral-50 transition-all duration-200 cursor-pointer focus:outline-none"
              title={language === 'ar' ? 'نَسَمَات — العودة إلى الصفحة الرئيسية' : 'Nasamat — Return to Home'}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-black/85 bg-white shadow-xs group-hover:scale-105 transition-all duration-300 shrink-0">
                <img
                  src={language === 'ar' ? '/logo.png' : '/logo-en.webp'}
                  alt={language === 'ar' ? 'شعار نسمات لتركيب العطور الفاخرة' : 'Nasamat Luxury Bespoke Perfumery'}
                  className="w-full h-full object-contain p-0.5"
                />
              </div>

              <div className="flex flex-col items-start text-start">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xl sm:text-2xl font-black tracking-wide text-black group-hover:text-neutral-800 transition-colors ${
                    language === 'ar' ? "font-['Almarai',sans-serif]" : "font-['Cinzel',serif] uppercase"
                  }`}>
                    {language === 'ar' ? 'نَسَمَات' : 'NASAMAT'}
                  </span>
                </div>
                <span className={`text-[10px] sm:text-[11px] text-neutral-600 font-bold -mt-0.5 ${
                  language === 'ar' ? "font-['Almarai',sans-serif] tracking-normal" : "font-sans uppercase tracking-wider text-neutral-500"
                }`}>
                  {language === 'ar' ? 'لتركيب العطور الفاخرة' : 'LUXURY BESPOKE PERFUMERY'}
                </span>
              </div>
            </button>
          </div>

          {/* Side 3 (End): Quick Stats & Controls tailored to active portal */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Quick Search Button (available in both) */}
            <button
              onClick={onOpenSmartSearch}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 text-black text-xs font-bold transition cursor-pointer shadow-xs"
              title={language === 'ar' ? 'البحث السريع في العطور والمواد (Ctrl + K)' : 'Quick Search (Ctrl + K)'}
            >
              <Search className="w-3.5 h-3.5 text-black" />
              <span className="hidden md:inline">{t('smartSearchBtn')}</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.2 rounded bg-white border border-neutral-300 text-[10px] text-neutral-700 font-mono">
                Ctrl+K
              </kbd>
            </button>

            {/* Language Switcher Button (available in both) */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-300 text-black text-xs font-bold transition shadow-xs cursor-pointer"
              title={language === 'ar' ? 'Switch to English' : 'التحويل للغة العربية'}
            >
              <span className="text-xs">🌐</span>
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Currency selector (available in both) */}
            <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-xl px-2 py-1 text-xs text-black font-bold shadow-xs">
              <select
                value={settings.currency || '$'}
                onChange={(e) => onUpdateCurrency(e.target.value)}
                aria-label="Currency"
                className="bg-transparent text-black font-black focus:outline-none cursor-pointer"
              >
                <option value="$" className="bg-white text-black">$ USD</option>
                <option value="ل.ل" className="bg-white text-black">ل.ل LBP</option>
              </select>
            </div>

            {/* ================= CUSTOMER PORTAL CONTROLS ================= */}
            {portal === 'customer' && (
              <>
                {/* Customer Account Button (Google / Apple Login) */}
                {onOpenCustomerAuth && (
                  <button
                    onClick={onOpenCustomerAuth}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs cursor-pointer ${
                      customerUser
                        ? 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
                        : 'bg-white hover:bg-neutral-100 border-neutral-300 text-black'
                    }`}
                    title={customerUser ? (language === 'ar' ? `حساب: ${customerUser.name}` : `Account: ${customerUser.name}`) : (language === 'ar' ? 'تسجيل الدخول عبر Google أو Apple' : 'Sign in with Google / Apple')}
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
                        <span className="font-bold max-w-[80px] sm:max-w-[110px] truncate">{customerUser.name.split(' ')[0]}</span>
                        {customerUser.provider === 'google' && <GoogleIcon className="w-3.5 h-3.5 shrink-0" />}
                        {customerUser.provider === 'apple' && <AppleIcon className="w-3.5 h-3.5 text-black shrink-0" />}
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5 text-black shrink-0" />
                        <span className="hidden sm:inline">{language === 'ar' ? 'حسابي' : 'Sign In'}</span>
                        <div className="flex items-center gap-1 shrink-0 ps-1 border-s border-neutral-300 ms-0.5">
                          <GoogleIcon className="w-3.5 h-3.5" />
                          <AppleIcon className="w-3.5 h-3.5 text-black" />
                        </div>
                      </>
                    )}
                  </button>
                )}

                {/* Cart Button */}
                {onOpenCart && (
                  <button
                    onClick={onOpenCart}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs cursor-pointer ${
                      isCartBumping ? 'animate-cart-bump ' : ''
                    }${
                      cartCount > 0
                        ? 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-300 text-neutral-900 shadow-xs'
                        : 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-800 hover:border-amber-400'
                    }`}
                    title={language === 'ar' ? 'سلة المشتريات' : 'Shopping Cart'}
                  >
                    <ShoppingBag className={`w-3.5 h-3.5 ${cartCount > 0 ? 'text-amber-700' : 'text-neutral-700'}`} />
                    <span className="text-neutral-900 font-bold">{t('storeViewCart')}</span>
                    {cartCount > 0 && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-600 text-white font-black text-[11px] shadow-xs">
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
