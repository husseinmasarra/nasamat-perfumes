import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { 
  FragranceOil, 
  SavedRecipe, 
  RawMaterial, 
  AppSettings, 
  CartItem, 
  Invoice, 
  InvoiceItem, 
  CategoryNavConfig,
  CustomerCustomBlend,
  CustomBlendIngredient,
  BottleLabelData
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedOilName, getLocalizedBrand, getLocalizedFamily, getLocalizedNotes } from '../utils/i18n';
import { 
  ShoppingBag, 
  Search, 
  Droplet,
  Eye, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  X, 
  Truck, 
  Phone, 
  MessageCircle, 
  Receipt,
  Store,
  DollarSign,
  WhatsAppIcon,
  WhatsAppOfficialIcon,
  WhatsAppOfficialBadge,
  InstagramOfficialBadge,
  FacebookOfficialBadge,
  Lock,
  AlertTriangle,
  Star,
  Award,
  Sparkles,
  Camera,
  Upload,
  RotateCcw,
  Edit3,
  Image as ImageIcon,
  Bookmark,
  Sliders,
  FlaskConical,
  History,
  GoogleIcon,
  AppleIcon,
  FacebookIcon,
  InstagramIcon,
  Users
} from './icons';
import { 
  loadNavCategories, 
  saveNavCategories, 
  loadDeletedNavCategoryIds,
  INITIAL_NAV_CATEGORIES, 
  LUXURY_PRESET_IMAGES,
  loadCustomerBlends,
  saveCustomerBlends,
  loadSavedDeliveryDetails,
  saveSavedDeliveryDetails,
  saveCustomerUser,
  loadSavingsBundles
} from '../utils/storage';
import { trackPixelEvent } from '../utils/pixelTracker';
import { syncSingleOrderToGoogleSheetWebhook } from '../utils/googleSheets';
import { formatWhatsAppPhone, formatDisplayPhone, formatSocialUrl } from '../utils/whatsappConcierge';
import type { CustomerUser, SavingsBundle } from '../types';
import { PerfumeDetailsModal } from './PerfumeDetailsModal';
import { StorePoliciesModal, type PolicyTab } from './StorePoliciesModal';

interface StoreTabProps {
  oils: FragranceOil[];
  recipes: SavedRecipe[];
  materials: RawMaterial[];
  settings: AppSettings;
  cart: CartItem[];
  customerUser?: CustomerUser | null;
  onOpenCustomerAuth?: () => void;
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
  onUpdateCartQty: (id: string, delta: number) => void;
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  onConfirmOrder: (invoice: Invoice, deductions: {
    oils: { id: string; amount: number }[];
    materials: { id: string; amount: number }[];
  }) => void;
  onViewInvoiceReceipt?: (invoice: Invoice) => void;
  isCartOpen: boolean;
  onCloseCart: () => void;
  onOpenCart: () => void;
  onOpenAdmin?: () => void;
  onUpdateOil?: (updated: FragranceOil) => void;
  onUpdateRecipe?: (updated: SavedRecipe) => void;
  onUpdateCustomerUser?: (user: CustomerUser) => void;
  savingsBundles?: SavingsBundle[];
  onUpdateSavingsBundles?: (bundles: SavingsBundle[]) => void;
}

export const StoreTab: React.FC<StoreTabProps> = ({
  oils,
  recipes,
  materials,
  settings,
  cart,
  customerUser = null,
  onOpenCustomerAuth,
  onUpdateCustomerUser,
  savingsBundles: propSavingsBundles,
  onUpdateSavingsBundles,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onClearCart,
  onConfirmOrder,
  onViewInvoiceReceipt,
  isCartOpen,
  onCloseCart,
  onOpenCart,
  onOpenAdmin,
  onUpdateOil,
  onUpdateRecipe,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const isAr = language === 'ar';

  useEffect(() => {
    trackPixelEvent('PageView');
  }, []);

  // Customer Boutique Pages: 'home' (الرئيسية واكتشف), 'catalog' (الكتالوج وكل العطور), 'signatures' (خلطات نسمات الحصرية), 'mix-perfume' (ركّب عطرك الخاص), 'bundles' (باقات التوفير), 'atelier' (قصة الدار والمختبر), 'delivery' (التوصيل والدفع في لبنان)
  const [customerPage, setCustomerPage] = useState<'home' | 'catalog' | 'signatures' | 'mix-perfume' | 'bundles' | 'atelier' | 'delivery'>('home');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<number>(0);

  // Savings Bundles State
  const activeSavingsBundles = useMemo(() => {
    return propSavingsBundles && propSavingsBundles.length > 0 ? propSavingsBundles : loadSavingsBundles();
  }, [propSavingsBundles]);
  const [selectedBundleForPicker, setSelectedBundleForPicker] = useState<SavingsBundle | null>(null);
  const [bundlePickedPerfumeIds, setBundlePickedPerfumeIds] = useState<string[]>([]);
  const [bundlePickerSearch, setBundlePickerSearch] = useState('');

  // Off-Canvas Navigation Drawer state
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  // Store Policies Modal state
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const [policyInitialTab, setPolicyInitialTab] = useState<PolicyTab>('privacy');
  const openPolicies = (tab: PolicyTab = 'privacy') => {
    setPolicyInitialTab(tab);
    setIsMenuDrawerOpen(false);
    setIsPoliciesOpen(true);
  };

  // Mix Your Own Perfume from Project Oils & Saved Customer Record
  const [activeBlenderTab, setActiveBlenderTab] = useState<'composer' | 'my-blends'>('composer');
  const [customerBlends, setCustomerBlends] = useState<CustomerCustomBlend[]>(() => loadCustomerBlends());
  const [blendOils, setBlendOils] = useState<{ oilId: string; percentage: number }[]>(() => {
    if (oils.length >= 2) {
      return [
        { oilId: oils[0].id, percentage: 60 },
        { oilId: oils[1].id, percentage: 40 },
      ];
    } else if (oils.length === 1) {
      return [{ oilId: oils[0].id, percentage: 100 }];
    }
    return [];
  });
  const [customPerfumeName, setCustomPerfumeName] = useState('');
  const [customPerfumeRecipient, setCustomPerfumeRecipient] = useState('');
  const [customPerfumeSize, setCustomPerfumeSize] = useState<number>(50);
  const [oilPickerSearch, setOilPickerSearch] = useState('');
  const [oilPickerFamily, setOilPickerFamily] = useState<string>('all');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'name'>('featured');

  // Quick View & Size Selection Modal when clicking on any perfume card
  const [quickSelectProduct, setQuickSelectProduct] = useState<{
    type: 'oil' | 'recipe';
    data: FragranceOil | SavedRecipe;
    key: string;
  } | null>(null);

  // Placed Order invoice modal
  const [lastPlacedInvoice, setLastPlacedInvoice] = useState<Invoice | null>(null);

  // Category Images & Navigation configuration (Managed exclusively from Admin)
  const [navCategories, setNavCategories] = useState<CategoryNavConfig[]>(() => loadNavCategories());

  // Helper to find category config (strictly respects deleted/blocked categories)
  const getCategoryConfig = (id: string): CategoryNavConfig => {
    const deletedIds = loadDeletedNavCategoryIds();
    if (deletedIds.has(id)) {
      return {
        id,
        labelAr: '',
        labelEn: '',
        imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80',
      };
    }
    const found = navCategories.find((c) => c.id === id);
    if (found) return found;
    const initialFound = INITIAL_NAV_CATEGORIES.find((c) => c.id === id);
    if (initialFound && !deletedIds.has(initialFound.id)) return initialFound;
    return {
      id,
      labelAr: id,
      labelEn: id,
      imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80',
    };
  };

  // Listen to global events
  useEffect(() => {
    const handleHome = () => {
      setCustomerPage('home');
      setSelectedCategory('all');
      setSearchTerm('');
      setIsMenuDrawerOpen(false);
      setQuickSelectProduct(null);
      setLastPlacedInvoice(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleOpenMenu = () => setIsMenuDrawerOpen(true);
    const handleCategoriesUpdated = () => {
      setNavCategories(loadNavCategories());
    };

    window.addEventListener('nasamat_go_home', handleHome);
    window.addEventListener('nasamat_open_menu', handleOpenMenu);
    window.addEventListener('nasamat_categories_updated', handleCategoriesUpdated);
    return () => {
      window.removeEventListener('nasamat_go_home', handleHome);
      window.removeEventListener('nasamat_open_menu', handleOpenMenu);
      window.removeEventListener('nasamat_categories_updated', handleCategoriesUpdated);
    };
  }, []);

  // Safe Navigation with luxury non-guessable hash synchronization & real browser history
  const navigateToCustomerPage = (
    page: 'home' | 'catalog' | 'signatures' | 'mix-perfume' | 'bundles' | 'atelier' | 'delivery',
    category?: string,
    replace = false
  ) => {
    setCustomerPage(page);
    if (category) {
      setSelectedCategory(category);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const pageHashes: Record<string, string> = {
        'home': '',
        'catalog': category && category !== 'all' ? `#royal-catalog-${category}` : '#royal-catalog',
        'signatures': '#private-reserve',
        'mix-perfume': '#bespoke-atelier',
        'bundles': '#curated-sets',
        'atelier': '#craft-heritage',
        'delivery': '#shipping-protocol',
      };
      const hash = pageHashes[page] || '';
      const newUrl = hash ? `${window.location.pathname}${hash}` : window.location.pathname;
      const stateObj = { page, category: category || (page === 'catalog' ? selectedCategory : undefined) };

      if (replace) {
        window.history.replaceState(stateObj, '', newUrl);
      } else {
        window.history.pushState(stateObj, '', newUrl);
      }
    } catch (_) {}
  };

  // Stable refs for popstate checks without triggering re-runs or auto-closing drawers
  const quickSelectProductRef = useRef(quickSelectProduct);
  quickSelectProductRef.current = quickSelectProduct;

  const lastPlacedInvoiceRef = useRef(lastPlacedInvoice);
  lastPlacedInvoiceRef.current = lastPlacedInvoice;

  const isCartOpenRef = useRef(isCartOpen);
  isCartOpenRef.current = isCartOpen;

  const isMenuDrawerOpenRef = useRef(isMenuDrawerOpen);
  isMenuDrawerOpenRef.current = isMenuDrawerOpen;

  // 1. Synchronize initial hash ON MOUNT ONLY (supports bookmarks / direct links e.g. #royal-catalog)
  useEffect(() => {
    const rawWithQuery = (window.location.hash || '').toLowerCase();
    const raw = rawWithQuery.split('?')[0];
    if (!raw || raw === '' || raw === '#home') {
      setCustomerPage('home');
    } else if (raw.startsWith('#royal-catalog') || raw.startsWith('#catalog')) {
      setCustomerPage('catalog');
      const cat = raw.replace('#royal-catalog-', '').replace('#catalog-', '').split('?')[0];
      if (cat && cat !== '#royal-catalog' && cat !== '#catalog') {
        setSelectedCategory(cat);
      }
    } else if (raw === '#private-reserve' || raw === '#signatures') {
      setCustomerPage('signatures');
    } else if (raw === '#bespoke-atelier' || raw === '#mix-perfume') {
      setCustomerPage('mix-perfume');
    } else if (raw === '#curated-sets' || raw === '#bundles') {
      setCustomerPage('bundles');
    } else if (raw === '#craft-heritage' || raw === '#atelier') {
      setCustomerPage('atelier');
    } else if (raw === '#shipping-protocol' || raw === '#delivery') {
      setCustomerPage('delivery');
    }
  }, []);

  // 2. Synchronize ONLY when a real browser navigation event (Back / Forward) fires
  useEffect(() => {
    const handlePopState = () => {
      // 1. If quickSelectProduct modal is open, close it on browser back
      if (quickSelectProductRef.current) {
        setQuickSelectProduct(null);
        return;
      }
      // 2. If order success modal is open, close it on browser back
      if (lastPlacedInvoiceRef.current) {
        setLastPlacedInvoice(null);
        return;
      }
      // 3. If cart is open, close it on browser back
      if (isCartOpenRef.current) {
        onCloseCart();
        return;
      }
      // 4. If menu drawer is open, close it on browser back
      if (isMenuDrawerOpenRef.current) {
        setIsMenuDrawerOpen(false);
        return;
      }

      const rawWithQuery = (window.location.hash || '').toLowerCase();
      const raw = rawWithQuery.split('?')[0];
      if (!raw || raw === '' || raw === '#home') {
        setCustomerPage('home');
      } else if (raw.startsWith('#royal-catalog') || raw.startsWith('#catalog')) {
        setCustomerPage('catalog');
        const cat = raw.replace('#royal-catalog-', '').replace('#catalog-', '').split('?')[0];
        if (cat && cat !== '#royal-catalog' && cat !== '#catalog') {
          setSelectedCategory(cat);
        }
      } else if (raw === '#private-reserve' || raw === '#signatures') {
        setCustomerPage('signatures');
      } else if (raw === '#bespoke-atelier' || raw === '#mix-perfume') {
        setCustomerPage('mix-perfume');
      } else if (raw === '#curated-sets' || raw === '#bundles') {
        setCustomerPage('bundles');
      } else if (raw === '#craft-heritage' || raw === '#atelier') {
        setCustomerPage('atelier');
      } else if (raw === '#shipping-protocol' || raw === '#delivery') {
        setCustomerPage('delivery');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [onCloseCart]);

  // Selected sizes and quantities per product card
  // Key: product key (e.g. `oil-${id}` or `recipe-${id}`) -> { size: 30 | 50 | 100, qty: number }
  const [productSelections, setProductSelections] = useState<Record<string, { size: number; qty: number }>>({});

  const handleOpenProductModal = (product: { type: 'oil' | 'recipe'; data: FragranceOil | SavedRecipe; key: string }) => {
    setQuickSelectProduct(product);
    try {
      const hash = window.location.hash || '';
      const cleanSearch = `?perfume=${encodeURIComponent(product.data.code)}`;
      window.history.pushState(
        { modal: 'perfume', code: product.data.code },
        '',
        `${window.location.pathname}${cleanSearch}${hash}`
      );
    } catch (_) {}
  };

  const handleCloseProductModal = () => {
    setQuickSelectProduct(null);
    if (window.location.search.includes('perfume=') || window.location.hash.includes('perfume=')) {
      try {
        window.history.back();
      } catch (_) {}
    }
  };

  // Checkout form state (pre-filled from authenticated CustomerUser or cached delivery storage)
  const initialDeliveryCache = useMemo(() => loadSavedDeliveryDetails(), []);
  const [customerName, setCustomerName] = useState(() => customerUser?.name || initialDeliveryCache?.name || '');
  const [customerPhone, setCustomerPhone] = useState(() => customerUser?.phone || initialDeliveryCache?.phone || '');
  const [customerCity, setCustomerCity] = useState(() => customerUser?.savedCity || initialDeliveryCache?.city || '');
  const [customerAddress, setCustomerAddress] = useState(() => customerUser?.savedAddress || initialDeliveryCache?.address || '');
  const [customerNotes, setCustomerNotes] = useState(() => customerUser?.savedNotes || initialDeliveryCache?.notes || '');
  const [formError, setFormError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Sync helper to keep delivery details saved in customer account & local cache
  const syncCustomerDeliveryDetails = (nameVal: string, phoneVal: string, cityVal: string, addrVal: string, notesVal: string) => {
    saveSavedDeliveryDetails({
      name: nameVal.trim() || undefined,
      phone: phoneVal.trim() || undefined,
      city: cityVal.trim() || undefined,
      address: addrVal.trim() || undefined,
      notes: notesVal.trim() || undefined,
    });
    if (customerUser) {
      const updatedUser: CustomerUser = {
        ...customerUser,
        name: nameVal.trim() || customerUser.name,
        phone: phoneVal.trim() || customerUser.phone,
        savedAddress: addrVal.trim() || customerUser.savedAddress,
        savedCity: cityVal.trim() || customerUser.savedCity,
        savedNotes: notesVal.trim() || customerUser.savedNotes,
      };
      saveCustomerUser(updatedUser);
      if (onUpdateCustomerUser) onUpdateCustomerUser(updatedUser);
    }
  };

  // ESC Key & Back Event Listener for StoreTab
  useEffect(() => {
    const handleEscape = () => {
      // 1. Details modal
      if (quickSelectProduct) {
        handleCloseProductModal();
        return;
      }
      // 2. Order success modal
      if (lastPlacedInvoice) {
        setLastPlacedInvoice(null);
        return;
      }
      // 3. Cart drawer
      if (isCartOpen) {
        onCloseCart();
        return;
      }
      // 4. Menu drawer
      if (isMenuDrawerOpen) {
        setIsMenuDrawerOpen(false);
        return;
      }
      // 5. Customer page back to home
      if (customerPage !== 'home') {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          navigateToCustomerPage('home');
        }
        return;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleEscape();
      }
    };

    window.addEventListener('nasamat_escape', handleEscape);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('nasamat_escape', handleEscape);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quickSelectProduct, lastPlacedInvoice, isCartOpen, isMenuDrawerOpen, customerPage, onCloseCart]);

  // World-Class Sticky Return & Breadcrumbs Header (like Sephora, Zara, Chanel)
  const renderInternalPageBackHeader = (titleAr: string, titleEn: string, subtitle?: string) => (
    <div className="bg-white/95 backdrop-blur-md sticky top-0 z-20 border-b border-neutral-200 py-3.5 px-2.5 sm:px-6 -mx-2.5 sm:-mx-6 mb-6 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Breadcrumbs Navigation Trail */}
          <nav className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium overflow-x-auto scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
            <button
              type="button"
              onClick={() => navigateToCustomerPage('home')}
              className="hover:text-black hover:underline cursor-pointer font-bold text-neutral-600 shrink-0"
            >
              {language === 'ar' ? 'الرئيسية' : 'Home'}
            </button>
            <span className="text-neutral-300">/</span>
            <span className="font-bold text-black shrink-0">
              {language === 'ar' ? titleAr : titleEn}
            </span>
            {customerPage === 'catalog' && selectedCategory !== 'all' && (
              <>
                <span className="text-neutral-300">/</span>
                <span className="font-semibold text-neutral-600 shrink-0">
                  {language === 'ar' ? getCategoryConfig(selectedCategory).labelAr : getCategoryConfig(selectedCategory).labelEn}
                </span>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {subtitle && (
            <span className="hidden lg:inline-block text-xs text-neutral-500 font-medium">
              {subtitle}
            </span>
          )}
          <button
            type="button"
            onClick={() => navigateToCustomerPage('home')}
            className="text-xs font-bold text-neutral-600 hover:text-black hover:underline transition hidden sm:inline-block cursor-pointer"
          >
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </button>
        </div>
      </div>
    </div>
  );

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Kiosk mode (Customer-only fullscreen view)
  const [isKioskMode, setIsKioskMode] = useState(false);

  // Auto-sync with authenticated customer (Google / Apple) or cached delivery
  useEffect(() => {
    if (customerUser) {
      if (customerUser.name && !customerName.trim()) setCustomerName(customerUser.name);
      if (customerUser.phone && !customerPhone.trim()) setCustomerPhone(customerUser.phone);
      if (customerUser.savedAddress && !customerAddress.trim()) setCustomerAddress(customerUser.savedAddress);
      if (customerUser.savedCity && !customerCity.trim()) setCustomerCity(customerUser.savedCity);
      if (customerUser.savedNotes && !customerNotes.trim()) setCustomerNotes(customerUser.savedNotes);
      if (!customPerfumeRecipient.trim()) setCustomPerfumeRecipient(customerUser.name);
    } else {
      const saved = loadSavedDeliveryDetails();
      if (saved) {
        if (saved.name && !customerName.trim()) setCustomerName(saved.name);
        if (saved.phone && !customerPhone.trim()) setCustomerPhone(saved.phone);
        if (saved.address && !customerAddress.trim()) setCustomerAddress(saved.address);
        if (saved.city && !customerCity.trim()) setCustomerCity(saved.city);
        if (saved.notes && !customerNotes.trim()) setCustomerNotes(saved.notes);
      }
    }
  }, [customerUser]);

  // Delivery fee adjustments
  const [customDeliveryFee, setCustomDeliveryFee] = useState<number | null>(null);

  // Field validation flags
  const isNameValid = customerName.trim().length > 0;
  const isPhoneValid = customerPhone.trim().length >= 6;
  const isAddressValid = customerAddress.trim().length > 0;
  const isFormValid = isNameValid && isPhoneValid && isAddressValid;

  // Show Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Helper to get or default selection (supports custom sizes)
  const getSelection = (key: string, availableSizes?: number[]) => {
    const defaultSize = availableSizes && availableSizes.length > 0
      ? (availableSizes.includes(50) ? 50 : availableSizes[0])
      : 50;
    const current = productSelections[key];
    if (!current) return { size: defaultSize, qty: 1 };
    if (availableSizes && availableSizes.length > 0 && !availableSizes.includes(current.size)) {
      return { size: defaultSize, qty: current.qty };
    }
    return current;
  };

  const setSize = (key: string, size: number) => {
    setProductSelections((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { size: 50, qty: 1 }),
        size,
      },
    }));
  };

  const setQty = (key: string, qty: number) => {
    const validQty = Math.max(1, Math.min(20, qty));
    setProductSelections((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { size: 50, qty: 1 }),
        qty: validQty,
      },
    }));
  };

  // Custom Perfume Compounding Pricing & Calculations
  const customPerfumePrice = customPerfumeSize === 30 ? 5 : customPerfumeSize === 50 ? 8 : 14;

  const blendTotalPercentage = useMemo(() => {
    return blendOils.reduce((sum, item) => sum + item.percentage, 0);
  }, [blendOils]);

  const filteredPickerOils = useMemo(() => {
    return oils.filter((o) => {
      const q = oilPickerSearch.trim().toLowerCase();
      const matchesSearch = !q || o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q) || (o.brand && o.brand.toLowerCase().includes(q));
      const matchesFamily = oilPickerFamily === 'all' || o.family === oilPickerFamily;
      return matchesSearch && matchesFamily;
    });
  }, [oils, oilPickerSearch, oilPickerFamily]);

  const handleAddOilToBlend = (oil: FragranceOil) => {
    if (blendOils.some((bo) => bo.oilId === oil.id)) {
      showToast(language === 'ar' ? 'هذا الزيت موجود بالفعل في خلطتك' : 'This oil is already in your blend');
      return;
    }
    if (blendOils.length >= 4) {
      showToast(language === 'ar' ? 'الحد الأقصى للخلطة هو 4 زيوت لضمان توازن الرائحة' : 'Max 4 oils per blend for optimal balance');
      return;
    }
    const newCount = blendOils.length + 1;
    const equalShare = Math.floor(100 / newCount);
    const remainder = 100 - equalShare * newCount;
    const updated = [
      ...blendOils.map((bo, idx) => ({ ...bo, percentage: idx === 0 ? equalShare + remainder : equalShare })),
      { oilId: oil.id, percentage: equalShare }
    ];
    setBlendOils(updated);
    showToast(language === 'ar' ? `تمت إضافة "${oil.name}" للخلطة بنجاح 🧪` : `Added ${oil.name}`);
  };

  const handleRemoveOilFromBlend = (oilId: string) => {
    const filtered = blendOils.filter((bo) => bo.oilId !== oilId);
    if (filtered.length === 0) {
      setBlendOils([]);
      showToast(language === 'ar' ? 'تمت إزالة الزيت بنجاح. يمكنك اختيار زيوت جديدة من القائمة بالأسفل' : 'Oil removed. You can pick new oils below');
      return;
    }
    const equalShare = Math.floor(100 / filtered.length);
    const remainder = 100 - equalShare * filtered.length;
    const rebalanced = filtered.map((bo, idx) => ({
      ...bo,
      percentage: idx === 0 ? equalShare + remainder : equalShare,
    }));
    setBlendOils(rebalanced);
    showToast(language === 'ar' ? 'تمت إزالة الزيت وإعادة ضبط نسب التركيبة ⚖️' : 'Oil removed and ratios rebalanced');
  };

  const handleUpdateOilPercentage = (oilId: string, percentage: number) => {
    const valid = Math.max(5, Math.min(95, percentage));
    setBlendOils((prev) =>
      prev.map((bo) => (bo.oilId === oilId ? { ...bo, percentage: valid } : bo))
    );
  };

  const handleEqualizePercentages = () => {
    if (blendOils.length === 0) return;
    const equalShare = Math.floor(100 / blendOils.length);
    const remainder = 100 - equalShare * blendOils.length;
    setBlendOils(
      blendOils.map((bo, idx) => ({
        ...bo,
        percentage: idx === 0 ? equalShare + remainder : equalShare,
      }))
    );
  };

  const handleSaveBlendToRecord = () => {
    if (!customPerfumeName.trim()) {
      showToast(language === 'ar' ? 'يرجى كتابة اسم لخلطتك العطرية أولاً' : 'Please name your bespoke blend');
      return;
    }
    if (blendOils.length === 0) {
      showToast(language === 'ar' ? 'يرجى اختيار زيت واحد على الأقل للتركيب' : 'Please select at least one oil');
      return;
    }

    const totalOilMl = Number((customPerfumeSize * 0.25).toFixed(2));
    const alcoholMl = Number((customPerfumeSize - totalOilMl).toFixed(2));

    const ingredients: CustomBlendIngredient[] = blendOils.map((bo) => {
      const match = oils.find((o) => o.id === bo.oilId);
      const oilMl = Number(((totalOilMl * bo.percentage) / 100).toFixed(2));
      return {
        oilId: bo.oilId,
        oilName: match?.name || 'زيت عطري',
        oilNameEn: match?.nameEn || (match?.name ? getLocalizedOilName(match.name, 'en') : 'Fragrance Oil'),
        oilCode: match?.code,
        oilBrand: match?.brand,
        percentage: bo.percentage,
        ml: oilMl,
      };
    });

    const newBlend: CustomerCustomBlend = {
      id: `blend-${Date.now()}`,
      name: customPerfumeName.trim(),
      nameEn: !/[\u0600-\u06FF]/.test(customPerfumeName.trim()) ? customPerfumeName.trim() : 'Bespoke Blend',
      customerName: customPerfumeRecipient.trim() || undefined,
      sizeMl: customPerfumeSize,
      totalOilMl,
      alcoholMl,
      concentrationPercent: 25,
      ingredients,
      totalPrice: customPerfumePrice,
      notes: ingredients.map(ing => `${ing.oilName}: ${ing.ml} ملل (${ing.percentage}%)`).join(' + '),
      createdAt: new Date().toISOString(),
    };

    const updated = [newBlend, ...customerBlends];
    setCustomerBlends(updated);
    saveCustomerBlends(updated);
    window.dispatchEvent(new CustomEvent('nasamat_customer_blends_updated'));
    trackPixelEvent('CustomBlendCreated', {
      content_name: newBlend.name,
      customer_name: newBlend.customerName,
      value: newBlend.totalPrice,
      currency: 'USD',
    });
    showToast(
      language === 'ar'
        ? `تم تسجيل الخلطة "${newBlend.name}" باسم "${newBlend.customerName || 'الزبون'}" في السجل بنجاح! 📜✨`
        : 'Registered and saved to your customer record!'
    );
  };

  const handleDeleteSavedBlend = (blendId: string) => {
    const updated = customerBlends.filter((b) => b.id !== blendId);
    setCustomerBlends(updated);
    saveCustomerBlends(updated);
    window.dispatchEvent(new CustomEvent('nasamat_customer_blends_updated'));
    showToast(language === 'ar' ? 'تم حذف الخلطة من سجلك' : 'Removed from saved blends');
  };

  const handleLoadSavedBlend = (blend: CustomerCustomBlend) => {
    setCustomPerfumeName(blend.name);
    setCustomPerfumeRecipient(blend.customerName || '');
    setCustomPerfumeSize(blend.sizeMl);
    setBlendOils(blend.ingredients.map(ing => ({ oilId: ing.oilId, percentage: ing.percentage })));
    setActiveBlenderTab('composer');
    showToast(language === 'ar' ? `تم تحميل تركيبة "${blend.name}" في المختبر 🧪` : 'Loaded blend into atelier');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleAddBlendToCart = (blend?: CustomerCustomBlend) => {
    if (!blend && blendOils.length === 0) {
      showToast(language === 'ar' ? 'يرجى اختيار زيت واحد على الأقل للتركيب' : 'Please select at least one oil');
      return;
    }
    const isAr = language === 'ar';
    const fallbackName = isAr ? 'خلطة عطرية خاصة' : 'Bespoke Blend';
    const name = blend 
      ? (isAr ? blend.name : (blend.nameEn || getLocalizedOilName(blend.name, 'en'))) 
      : (customPerfumeName.trim() || fallbackName);
    const size = blend ? blend.sizeMl : customPerfumeSize;
    const price = blend ? blend.totalPrice : customPerfumePrice;
    const totalOilMl = Number((size * 0.25).toFixed(2));
    const alcoholMl = Number((size - totalOilMl).toFixed(2));
    
    const itemsBreakdown = blend
      ? blend.ingredients.map((ing, i) => {
          const ml = ing.ml || Number(((totalOilMl * ing.percentage) / 100).toFixed(2));
          const ingName = isAr ? ing.oilName : (ing.oilNameEn || getLocalizedOilName(ing.oilName, 'en'));
          return `  ${i + 1}. ${ingName}${ing.oilCode ? ` [${ing.oilCode}]` : ''}: ${ml} ${isAr ? 'ملل' : 'ml'} (${ing.percentage}%)`;
        }).join('\n')
      : blendOils.map((bo, i) => {
          const match = oils.find((o) => o.id === bo.oilId);
          const ml = Number(((totalOilMl * bo.percentage) / 100).toFixed(2));
          const oilName = isAr ? (match?.name || 'زيت') : (match?.nameEn || (match?.name ? getLocalizedOilName(match.name, 'en') : 'Fragrance Oil'));
          return `  ${i + 1}. ${oilName}${match?.code ? ` [${match.code}]` : ''}: ${ml} ${isAr ? 'ملل' : 'ml'} (${bo.percentage}%)`;
        }).join('\n');

    const detailedNotes = isAr
      ? `الحجم المختار: ${size} ملل (تركيز إكستري دو بارفان)\nإجمالي الزيوت: ${totalOilMl} ملل | كحول إيثيلي نقي 96%: ${alcoholMl} ملل\nالتركيبة المعملية الدقيقة بالملل:\n${itemsBreakdown}${customPerfumeRecipient ? `\nلصالح: ${customPerfumeRecipient}` : ''}`
      : `Selected Size: ${size}ml (Extrait de Parfum Concentration)\nTotal Fragrance Oils: ${totalOilMl}ml | Pure 96% Ethyl Alcohol: ${alcoholMl}ml\nFormulation Breakdown:\n${itemsBreakdown}${customPerfumeRecipient ? `\nFor: ${customPerfumeRecipient}` : ''}`;

    onAddToCart({
      itemType: 'recipe',
      referenceId: blend ? blend.id : `custom-blend-${Date.now()}`,
      name: isAr ? `خلطة مخصصة: ${name} (${size} ملل)` : `Bespoke Blend: ${name} (${size}ml)`,
      nameEn: `Bespoke Blend: ${name} (${size}ml)`,
      brand: isAr ? 'مختبر نسمات الحرفي (Bespoke Atelier)' : 'Nasamat Bespoke Atelier',
      imageUrl: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=400&q=80',
      sizeMl: size,
      unitPrice: price,
      quantity: 1,
      oilQuantityPerBottleMl: totalOilMl,
      notes: detailedNotes,
    });

    trackPixelEvent('AddToCart', {
      content_name: name,
      value: price,
      currency: 'USD',
      quantity: 1,
    });

    showToast(language === 'ar' ? `تمت إضافة "${name}" (${size} ملل) إلى سلتك بنجاح` : 'Custom blend added to cart!');
  };

  const handleWhatsAppOrderBlend = (blend?: CustomerCustomBlend) => {
    if (!blend && blendOils.length === 0) {
      showToast(language === 'ar' ? 'يرجى اختيار زيت واحد على الأقل للتركيب' : 'Please select at least one oil');
      return;
    }
    const isAr = language === 'ar';
    const fallbackName = isAr ? 'عطري المخصص' : 'My Custom Fragrance';
    const name = blend ? (isAr ? blend.name : (blend.nameEn || getLocalizedOilName(blend.name, 'en'))) : (customPerfumeName.trim() || fallbackName);
    const size = blend ? blend.sizeMl : customPerfumeSize;
    const price = blend ? blend.totalPrice : customPerfumePrice;
    const concentration = (settings.defaultConcentrationPercent || 33) / 100;
    const totalOilMl = Number((size * concentration).toFixed(2));
    const alcoholMl = Number((size - totalOilMl).toFixed(2));
    const phone = formatWhatsAppPhone(settings.storePhone);

    const formulaLines = blend
      ? blend.ingredients.map((ing, i) => {
          const ml = ing.ml || Number(((totalOilMl * ing.percentage) / 100).toFixed(2));
          const ingName = isAr ? ing.oilName : (ing.oilNameEn || getLocalizedOilName(ing.oilName, 'en'));
          return `  ${i + 1}. *${ingName}* ${ing.oilCode ? `[${ing.oilCode}]` : ''}: *${ml} ${isAr ? 'ملل' : 'ml'}* (${ing.percentage}%)`;
        }).join('\n')
      : blendOils.map((bo, i) => {
          const match = oils.find((o) => o.id === bo.oilId);
          const ml = Number(((totalOilMl * bo.percentage) / 100).toFixed(2));
          const oilName = isAr ? (match?.name || 'زيت') : (match?.nameEn || (match?.name ? getLocalizedOilName(match.name, 'en') : 'Fragrance Oil'));
          return `  ${i + 1}. *${oilName}* ${match?.code ? `[${match?.code}]` : ''}: *${ml} ${isAr ? 'ملل' : 'ml'}* (${bo.percentage}%)`;
        }).join('\n');

    let msg = '';
    if (isAr) {
      msg = `*طلب تركيب عطر مخصص من بوتيك نسمات 🧪✨*\n`;
      msg += `------------------------------------\n`;
      msg += `👑 *اسم العطر المختار من الزبون:* "${name}"\n`;
      if (customPerfumeRecipient || blend?.customerName) {
        msg += `👤 *الاسم / الإهداء:* ${blend?.customerName || customPerfumeRecipient}\n`;
      }
      msg += `🧴 *الحجم المطلوب:* ${size} ملل (تركيز إكستري دو بارفان)\n`;
      msg += `🧪 *إجمالي الزيوت العطرية المطلوبة للعبوة:* *${totalOilMl} ملل*\n`;
      msg += `💧 *كحول عطري نقي 96%:* *${alcoholMl} ملل*\n`;
      msg += `💵 *السعر:* $${price.toFixed(2)} (~${Math.round(price * (settings.lbpRate || 90000)).toLocaleString()} ل.ل)\n`;
      msg += `------------------------------------\n`;
      msg += `🧬 *المقادير المعملية الدقيقة بالملمتر (ملل):*\n`;
      msg += formulaLines + '\n';
      msg += `------------------------------------\n`;
      msg += `يرجى تحضير الخلطة بالمقادير المذكورة وتأكيد التوصيل. شكراً لكم!`;
    } else {
      msg = `*Bespoke Perfume Order - NASAMAT Atelier 🧪✨*\n`;
      msg += `------------------------------------\n`;
      msg += `👑 *Fragrance Name:* "${name}"\n`;
      if (customPerfumeRecipient || blend?.customerName) {
        msg += `👤 *Client / Dedication:* ${blend?.customerName || customPerfumeRecipient}\n`;
      }
      msg += `🧴 *Bottle Size:* ${size}ml (Extrait de Parfum 30%)\n`;
      msg += `🧪 *Total Fragrance Oils:* *${totalOilMl} ml*\n`;
      msg += `💧 *Pure Perfumer's Alcohol 96%:* *${alcoholMl} ml*\n`;
      msg += `💵 *Price:* $${price.toFixed(2)} (~${Math.round(price * (settings.lbpRate || 90000)).toLocaleString()} LBP)\n`;
      msg += `------------------------------------\n`;
      msg += `🧬 *Formulation Breakdown:*\n`;
      msg += formulaLines + '\n';
      msg += `------------------------------------\n`;
      msg += `Please formulate this bespoke blend with the specified ratios and confirm delivery. Thank you!`;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Calculate pricing & stock for an oil (supports custom sizes & sizePrices)
  const getOilInfo = (oil: FragranceOil, size: number) => {
    // Original Packaged Perfume (عطور أصلية معلبة وجاهزة بالعلبة الرسمية)
    if (oil.isOriginalPackaged) {
      const price = oil.singleBottlePrice || 85;
      const count = oil.packageStockCount !== undefined 
        ? oil.packageStockCount 
        : Math.floor(oil.currentQuantity / (oil.singleBottleSizeMl || 100));
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (count <= 0) {
        stockStatus = 'out_of_stock';
      } else if (count <= 2) {
        stockStatus = 'low_stock';
      }
      return { 
        price, 
        oilNeededMl: oil.singleBottleSizeMl || 100, 
        maxBottlesPossible: count, 
        stockStatus 
      };
    }

    let price = 7;
    if (oil.sizePrices && oil.sizePrices[size] !== undefined) {
      price = oil.sizePrices[size];
    } else if (size === 30) {
      price = oil.retailPrice30ml !== undefined ? oil.retailPrice30ml : 5;
    } else if (size === 100) {
      price = oil.retailPrice100ml !== undefined ? oil.retailPrice100ml : 12;
    } else if (size === 50) {
      price = oil.retailPrice50ml !== undefined ? oil.retailPrice50ml : 7;
    } else {
      const base50 = oil.retailPrice50ml !== undefined ? oil.retailPrice50ml : 7;
      price = Math.max(1, Math.round((size / 50) * base50 * 10) / 10);
    }

    // Oil needed per bottle (Extrait concentration ~25-30%)
    const oilNeededMl = Math.max(0.5, (size * 25) / 100);
    const maxBottlesPossible = Math.floor(oil.currentQuantity / oilNeededMl);

    let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (maxBottlesPossible <= 0) {
      stockStatus = 'out_of_stock';
    } else if (maxBottlesPossible <= 2) {
      stockStatus = 'low_stock';
    }

    return { price, oilNeededMl, maxBottlesPossible, stockStatus };
  };

  // Calculate pricing & stock for a recipe (supports custom sizes & sizePrices)
  const getRecipeInfo = (recipe: SavedRecipe, size: number) => {
    let price = 7;
    if (recipe.sizePrices && recipe.sizePrices[size] !== undefined) {
      price = recipe.sizePrices[size];
    } else if (size === 30) {
      price = recipe.retailPrice30ml !== undefined ? recipe.retailPrice30ml : 5;
    } else if (size === 100) {
      price = recipe.retailPrice100ml !== undefined ? recipe.retailPrice100ml : 12;
    } else if (size === 50) {
      price = recipe.retailPrice50ml !== undefined ? recipe.retailPrice50ml : (recipe.suggestedRetailPrice || 7);
    } else {
      const base50 = recipe.retailPrice50ml !== undefined ? recipe.retailPrice50ml : (recipe.suggestedRetailPrice || 7);
      price = Math.max(1, Math.round((size / 50) * base50 * 10) / 10);
    }

    // Calculate max bottles based on constituent oils in stock
    const conc = recipe.concentrationPercent || 25;
    const oilNeededMl = Math.max(0.5, (size * conc) / 100);
    let minBottles = 999;
    recipe.oils.forEach((ro) => {
      const match = oils.find((o) => o.id === ro.oilId);
      const neededForThisOil = (oilNeededMl * ro.percentage) / 100;
      if (!match || neededForThisOil <= 0) {
        minBottles = 0;
      } else {
        const canMake = Math.floor(match.currentQuantity / neededForThisOil);
        if (canMake < minBottles) minBottles = canMake;
      }
    });

    if (minBottles === 999) minBottles = 0;

    let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (minBottles <= 0) {
      stockStatus = 'out_of_stock';
    } else if (minBottles <= 2) {
      stockStatus = 'low_stock';
    }

    return { price, oilNeededMl, maxBottlesPossible: minBottles, stockStatus };
  };

  // Unified items list: recipes first, then oils
  const unifiedItems = useMemo(() => {
    type CatalogEntry = 
      | { type: 'recipe'; data: SavedRecipe; key: string }
      | { type: 'oil'; data: FragranceOil; key: string };

    const list: CatalogEntry[] = [];

    // Add recipes
    recipes.forEach((r) => {
      list.push({ type: 'recipe', data: r, key: `recipe-${r.id}` });
    });

    // Add oils
    oils.forEach((o) => {
      list.push({ type: 'oil', data: o, key: `oil-${o.id}` });
    });

    // Filter by search
    let filtered = list.filter((item) => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;

      if (item.type === 'recipe') {
        const r = item.data;
        return (
          r.name.toLowerCase().includes(q) ||
          r.nameEn.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.scentNotes && r.scentNotes.toLowerCase().includes(q))
        );
      } else {
        const o = item.data;
        return (
          o.name.toLowerCase().includes(q) ||
          o.code.toLowerCase().includes(q) ||
          o.brand.toLowerCase().includes(q) ||
          (o.notes && o.notes.toLowerCase().includes(q))
        );
      }
    });

    // Filter by category
    if (selectedCategory !== 'all') {
      const targetCatId = selectedCategory.toLowerCase();
      const currentCatConfig = getCategoryConfig(selectedCategory);
      const catLabelAr = (currentCatConfig?.labelAr || '').trim().toLowerCase();
      const catLabelEn = (currentCatConfig?.labelEn || '').trim().toLowerCase();

      filtered = filtered.filter((item) => {
        const isRec = item.type === 'recipe';
        const rec = isRec ? (item.data as SavedRecipe) : null;
        const oil = !isRec ? (item.data as FragranceOil) : null;

        // 1. DIRECT EXPLICIT CATEGORY LINK (Highest Priority)
        if (oil) {
          const directCat = (oil.category || '').toLowerCase();
          const directDept = (oil.department || '').toLowerCase();
          const directNature = (oil.productNature || '').toLowerCase();
          const linkedCats = (oil.categories || []).map((c) => c.toLowerCase());

          if (
            directCat === targetCatId ||
            (catLabelAr && directCat === catLabelAr) ||
            (catLabelEn && directCat === catLabelEn) ||
            directDept === targetCatId ||
            directNature === targetCatId ||
            linkedCats.includes(targetCatId) ||
            (catLabelAr && linkedCats.includes(catLabelAr)) ||
            (catLabelEn && linkedCats.includes(catLabelEn))
          ) {
            return true;
          }
        }
        if (rec) {
          const directCat = (rec.category || '').toLowerCase();
          if (
            directCat === targetCatId ||
            (catLabelAr && directCat === catLabelAr) ||
            (catLabelEn && directCat === catLabelEn)
          ) {
            return true;
          }
        }

        // 2. STANDARD CATEGORY RULES & FALLBACKS
        if (selectedCategory === 'signatures') {
          return item.type === 'recipe' || (item.type === 'oil' && parseInt(item.data.code.replace(/\D/g, ''), 10) >= 91);
        }
        if (selectedCategory === 'original') {
          return item.type === 'oil' && !!(item.data as FragranceOil).isOriginalPackaged;
        }
        if (selectedCategory === 'makeup') {
          return item.type === 'oil' && (item.data as FragranceOil).productNature === 'makeup';
        }
        if (selectedCategory === 'accessories') {
          return item.type === 'oil' && (item.data as FragranceOil).productNature === 'accessories';
        }
        if (selectedCategory === 'bakhoor') {
          if (oil) return oil.productNature === 'bakhoor' || oil.name.includes('بخور') || (!!oil.notes && oil.notes.includes('بخور'));
          return rec ? (rec.name.includes('بخور') || rec.category === 'oriental') : false;
        }
        if (selectedCategory === 'men') {
          if (item.type === 'recipe') return item.data.targetGender === 'men';
          const o = item.data as FragranceOil;
          if (o.targetGender) return o.targetGender === 'men';
          const codeNum = parseInt(o.code.replace(/\D/g, ''), 10);
          return (codeNum >= 1 && codeNum <= 20) || (!!o.notes && (o.notes.includes('رجالي') || o.notes.includes('للرجال')));
        }
        if (selectedCategory === 'women') {
          if (item.type === 'recipe') return item.data.targetGender === 'women';
          const o = item.data as FragranceOil;
          if (o.targetGender) return o.targetGender === 'women';
          const codeNum = parseInt(o.code.replace(/\D/g, ''), 10);
          return (codeNum >= 21 && codeNum <= 40) || (!!o.notes && (o.notes.includes('نسائي') || o.notes.includes('للنساء')));
        }
        if (selectedCategory === 'unisex') {
          if (item.type === 'recipe') return item.data.targetGender === 'unisex';
          const o = item.data as FragranceOil;
          if (o.targetGender) return o.targetGender === 'unisex';
          const codeNum = parseInt(o.code.replace(/\D/g, ''), 10);
          return (codeNum >= 41 && codeNum <= 60) || (!!o.notes && (o.notes.includes('للجنسين') || o.notes.includes('مشترك')));
        }
        if (selectedCategory === 'oriental') {
          if (rec) return rec.category === 'oriental' || rec.name.includes('عود') || rec.name.includes('عنبر');
          return oil!.family === 'oriental' || oil!.name.includes('عود') || oil!.name.includes('عنبر');
        }
        if (selectedCategory === 'musk') {
          if (rec) return rec.name.includes('مسك') || (!!rec.nameEn && rec.nameEn.toLowerCase().includes('musk'));
          return oil!.name.includes('مسك') || oil!.family === 'floral' || (!!oil!.notes && oil!.notes.includes('مسك'));
        }
        if (selectedCategory === 'home_linen') {
          if (rec) return rec.name.includes('معطر');
          return oil!.name.includes('معطر') || oil!.family === 'fresh' || oil!.family === 'citrus';
        }
        if (selectedCategory === 'fresh') {
          if (rec) return rec.category === 'fresh';
          return oil!.family === 'fresh' || oil!.family === 'citrus';
        }
        if (selectedCategory === 'gourmand') {
          if (rec) return rec.category === 'gourmand';
          return oil!.family === 'gourmand';
        }

        // Custom categories: only show if explicitly linked above
        return false;
      });
    }

    // Sort
    if (sortBy === 'price_asc') {
      filtered.sort((a, b) => {
        const priceA = a.type === 'recipe' ? 7 : (a.data.retailPrice50ml || 7);
        const priceB = b.type === 'recipe' ? 7 : (b.data.retailPrice50ml || 7);
        return priceA - priceB;
      });
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => {
        const priceA = a.type === 'recipe' ? 7 : (a.data.retailPrice50ml || 7);
        const priceB = b.type === 'recipe' ? 7 : (b.data.retailPrice50ml || 7);
        return priceB - priceA;
      });
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.data.name.localeCompare(b.data.name, 'ar'));
    }

    return filtered;
  }, [oils, recipes, searchTerm, selectedCategory, sortBy]);

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  // Delivery calculation: respects admin settings & allows dynamic overrides as needed
  const baseDelivery = settings.defaultDeliveryFee !== undefined ? settings.defaultDeliveryFee : 3;
  const freeThreshold = settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 35;
  const isFreeDeliveryActive = settings.isFreeDeliveryEnabled !== false;

  const hasFreeDeliveryBundle = cart.some(
    (item) => (item as any).hasFreeDelivery === true || (item.referenceId?.includes('bundle-') && item.name.includes('مجاني'))
  );

  const defaultCalculatedFee = cartSubtotal === 0 
    ? 0 
    : (hasFreeDeliveryBundle || (isFreeDeliveryActive && cartSubtotal >= freeThreshold) ? 0 : baseDelivery);

  const deliveryFee = customDeliveryFee !== null ? customDeliveryFee : defaultCalculatedFee;
  const cartGrandTotal = cartSubtotal + deliveryFee;

  // Lebanese exchange rate: 90,000 LBP / USD
  const lbpRate = settings.lbpRate || 90000;
  const grandTotalLbp = Math.round(cartGrandTotal * lbpRate);

  // Handle Add to Cart action
  const handleAddToCartClick = (
    type: 'oil' | 'recipe',
    referenceId: string,
    name: string,
    nameEn: string | undefined,
    brand: string | undefined,
    imageUrl: string | undefined,
    sizeMl: number,
    unitPrice: number,
    quantity: number,
    oilNeededMl: number
  ) => {
    onAddToCart({
      itemType: type,
      referenceId,
      name,
      nameEn,
      brand,
      imageUrl,
      sizeMl,
      unitPrice,
      quantity,
      oilQuantityPerBottleMl: oilNeededMl,
      notes: `${sizeMl}ml EDP bottle`,
    });

    showToast(
      language === 'ar'
        ? `تمت إضافة "${name}" (${sizeMl} ملل) إلى السلة بنجاح`
        : `Added "${nameEn || name}" (${sizeMl}ml) to cart`
    );

    trackPixelEvent('AddToCart', {
      content_name: name,
      content_ids: [referenceId],
      content_type: type,
      value: unitPrice * quantity,
      currency: 'USD',
      quantity,
    });

    // Trigger cart bump animation across UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nasamat_cart_bump'));
    }
  };

  // Handle Checkout submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setAttemptedSubmit(true);
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setFormError(
        language === 'ar'
          ? 'يرجى إدخال الاسم الكامل، العنوان بالتفصيل، ورقم الهاتف لإتمام الطلبية'
          : 'Please enter Full Name, Detailed Address, and Phone Number'
      );
      return;
    }
    setFormError(null);

    // Persist address and phone to customer account & cache
    syncCustomerDeliveryDetails(customerName, customerPhone, customerCity, customerAddress, customerNotes);

    // 1. Generate Invoice Items
    const invoiceItems: InvoiceItem[] = cart.map((ci) => ({
      id: `item-sale-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemType: 'perfume_bottle',
      referenceId: ci.referenceId,
      name: `${ci.name} (${ci.sizeMl} ملل معبأ)`,
      sizeOrQty: ci.quantity,
      unit: 'bottle',
      bottleCapacityMl: ci.sizeMl,
      unitPrice: ci.unitPrice,
      totalPrice: Number((ci.unitPrice * ci.quantity).toFixed(2)),
      cogsCost: Number(((ci.unitPrice * 0.28) * ci.quantity).toFixed(2)), // estimated COGS
      notes: `طلب عبر بوتيك نسمات: ${ci.sizeMl}ml`,
    }));

    // 2. Prepare Deductions for inventory
    const oilDeductionsMap = new Map<string, number>();
    const matDeductionsMap = new Map<string, number>();

    cart.forEach((ci) => {
      const totalOilMl = ci.oilQuantityPerBottleMl * ci.quantity;

      if (ci.itemType === 'oil') {
        const cur = oilDeductionsMap.get(ci.referenceId) || 0;
        oilDeductionsMap.set(ci.referenceId, cur + totalOilMl);
      } else {
        // Recipe: deduct constituent oils
        const rec = recipes.find((r) => r.id === ci.referenceId);
        if (rec) {
          rec.oils.forEach((ro) => {
            const fractionMl = (totalOilMl * ro.percentage) / 100;
            const cur = oilDeductionsMap.get(ro.oilId) || 0;
            oilDeductionsMap.set(ro.oilId, cur + fractionMl);
          });
        }
      }

      // Deduct bottle materials if matched
      const bottleMat = materials.find((m) => m.category === 'bottle' && m.bottleCapacityMl === ci.sizeMl);
      if (bottleMat) {
        const cur = matDeductionsMap.get(bottleMat.id) || 0;
        matDeductionsMap.set(bottleMat.id, cur + ci.quantity);
      }
      const sprayerMat = materials.find((m) => m.category === 'sprayer');
      if (sprayerMat) {
        const cur = matDeductionsMap.get(sprayerMat.id) || 0;
        matDeductionsMap.set(sprayerMat.id, cur + ci.quantity);
      }
    });

    const deductions = {
      oils: Array.from(oilDeductionsMap.entries()).map(([id, amount]) => ({
        id,
        amount: Number(amount.toFixed(2)),
      })),
      materials: Array.from(matDeductionsMap.entries()).map(([id, amount]) => ({
        id,
        amount,
      })),
    };

    // 3. Create Invoice object
    const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = `INV-S-${dateCode}-${randSuffix}`;

    const customBlendNotes = cart
      .filter((ci) => ci.notes)
      .map((ci) => `[${ci.name}: ${ci.notes}]`)
      .join(' | ');

    const combinedNotes = `طلب متجر الزبائن • العنوان: ${customerCity} - ${customerAddress} ${customerNotes ? `• ملاحظات: ${customerNotes}` : ''}${customBlendNotes ? ` • تركيبات العطور: ${customBlendNotes}` : ''}${deliveryFee > 0 ? ` • التوصيل: $${deliveryFee.toFixed(2)}` : ' • توصيل مجاني'}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      type: 'sale',
      saleKind: 'retail',
      date: new Date().toISOString(),
      partyName: customerName.trim(),
      partyPhone: customerPhone.trim(),
      status: 'paid', // Cash on delivery
      paymentMethod: 'cash',
      items: invoiceItems,
      subtotal: cartSubtotal,
      deliveryFee: deliveryFee,
      discount: 0,
      tax: 0,
      totalAmount: cartGrandTotal,
      paidAmount: cartGrandTotal,
      dueAmount: 0,
      totalCogsCost: invoiceItems.reduce((s, it) => s + (it.cogsCost || 0), 0),
      netProfit: Number((cartGrandTotal - invoiceItems.reduce((s, it) => s + (it.cogsCost || 0), 0)).toFixed(2)),
      stockDeducted: true,
      notes: combinedNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onConfirmOrder(newInvoice, deductions);
    trackPixelEvent('Purchase', {
      order_id: newInvoice.invoiceNumber,
      value: newInvoice.totalAmount,
      currency: 'USD',
      customer_name: customerName.trim(),
    });

    // Auto-sync order directly to Google Sheets Webhook in real time if configured
    if (settings.crmGoogleSheetWebhookUrl) {
      const itemsSummary = cart
        .map((ci) => `${ci.name} (${ci.sizeMl}ml × ${ci.quantity})`)
        .join(' | ');
      syncSingleOrderToGoogleSheetWebhook(settings.crmGoogleSheetWebhookUrl, {
        orderNumber: newInvoice.invoiceNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerCity: customerCity.trim(),
        customerAddress: customerAddress.trim(),
        itemsDescription: itemsSummary,
        subtotal: cartSubtotal,
        deliveryFee: deliveryFee,
        totalUsd: cartGrandTotal,
        totalLbp: grandTotalLbp,
        notes: customerNotes.trim(),
        paymentMethod: 'الدفع عند الاستلام (COD)',
        date: new Date().toLocaleString('ar-LB'),
      }).catch((err) => console.warn('Background Google Sheet sync notice:', err));
    }

    setLastPlacedInvoice(newInvoice);
    onClearCart();
  };

  // WhatsApp Checkout builder
  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return;

    setAttemptedSubmit(true);
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setFormError(
        language === 'ar'
          ? 'يرجى إدخال الاسم الكامل، العنوان بالتفصيل، ورقم الهاتف لإتمام الطلبية'
          : 'Please enter Full Name, Detailed Address, and Phone Number'
      );
      return;
    }
    setFormError(null);

    // Persist address and phone to customer account & cache
    syncCustomerDeliveryDetails(customerName, customerPhone, customerCity, customerAddress, customerNotes);

    const phone = formatWhatsAppPhone(settings.storePhone);
    
    let text = isAr 
      ? `*طلب عطور جديد من بوتيك نسمات 🌹*\n`
      : `*New Fragrance Order from NASAMAT Boutique 🌹*\n`;
    text += `------------------------------------\n`;
    text += isAr ? `👤 *الزبون:* ${customerName.trim()}\n` : `👤 *Customer:* ${customerName.trim()}\n`;
    text += isAr ? `📞 *الهاتف:* ${customerPhone.trim()}\n` : `📞 *Phone:* ${customerPhone.trim()}\n`;
    text += isAr ? `🏠 *العنوان:* ${customerAddress.trim()}${customerCity ? ` (${customerCity.trim()})` : ''}\n` : `🏠 *Address:* ${customerAddress.trim()}${customerCity ? ` (${customerCity.trim()})` : ''}\n`;
    text += `------------------------------------\n`;
    text += isAr ? `🛍️ *الطلبات:* \n` : `🛍️ *Items:* \n`;
    
    cart.forEach((ci, idx) => {
      const itemName = !isAr ? (ci.nameEn || getLocalizedOilName(ci.name, 'en')) : ci.name;
      text += `${idx + 1}. *${itemName}* (${ci.sizeMl}${isAr ? ' ملل' : 'ml'}) × ${ci.quantity} = $${(ci.unitPrice * ci.quantity).toFixed(2)}\n`;
      if (ci.notes) {
        text += `   ↳ 🧬 *${ci.notes}*\n`;
      }
    });
    
    text += `------------------------------------\n`;
    text += isAr ? `💵 *المجموع الجزئي:* $${cartSubtotal.toFixed(2)}\n` : `💵 *Subtotal:* $${cartSubtotal.toFixed(2)}\n`;
    text += isAr 
      ? `🚚 *التوصيل:* ${deliveryFee === 0 ? 'مجاني 🎁' : `$${deliveryFee.toFixed(2)}`}${customDeliveryFee !== null ? ' (تعديل مخصص)' : ''}\n`
      : `🚚 *Delivery:* ${deliveryFee === 0 ? 'Free 🎁' : `$${deliveryFee.toFixed(2)}`}${customDeliveryFee !== null ? ' (Custom)' : ''}\n`;
    text += isAr ? `🌟 *الإجمالي النهائي:* *$${cartGrandTotal.toFixed(2)} USD*\n` : `🌟 *Total:* *$${cartGrandTotal.toFixed(2)} USD*\n`;
    text += isAr ? `🇱🇧 *المعادل التقريبي:* ~${grandTotalLbp.toLocaleString()} ل.ل\n` : `🇱🇧 *Approx. LBP:* ~${grandTotalLbp.toLocaleString()} LBP\n`;
    if (customerNotes) text += isAr ? `📝 *ملاحظات:* ${customerNotes}\n` : `📝 *Notes:* ${customerNotes}\n`;
    text += `------------------------------------\n`;
    text += isAr ? `شكراً لكم! ننتظر تأكيدكم للتوصيل.` : `Thank you! Awaiting your delivery confirmation.`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  // Curated Top 4 Best-Sellers for the Home Showcase
  const curatedFeatured = useMemo(() => {
    type CatalogEntry = 
      | { type: 'recipe'; data: SavedRecipe; key: string }
      | { type: 'oil'; data: FragranceOil; key: string };

    const items: CatalogEntry[] = [];
    const rec1 = recipes.find((r) => r.id === 'rec-1') || recipes[0];
    if (rec1) items.push({ type: 'recipe', data: rec1, key: `recipe-${rec1.id}` });

    const oilAventus = oils.find((o) => o.code === 'NAS-003' || o.name.includes('أفنتوس')) || oils[0];
    if (oilAventus) items.push({ type: 'oil', data: oilAventus, key: `oil-${oilAventus.id}` });

    const oilBaccarat = oils.find((o) => o.code === 'NAS-040' || o.name.includes('باكارات')) || oils[1];
    if (oilBaccarat) items.push({ type: 'oil', data: oilBaccarat, key: `oil-${oilBaccarat.id}` });

    const oilSauvage = oils.find((o) => o.code === 'NAS-002' || o.name.includes('سوفاج')) || oils[2];
    if (oilSauvage) items.push({ type: 'oil', data: oilSauvage, key: `oil-${oilSauvage.id}` });

    return items;
  }, [oils, recipes]);

  // Luxury Haute Parfumerie Product Card Renderer
  const renderProductCard = (
    item: { type: 'recipe' | 'oil'; data: SavedRecipe | FragranceOil; key: string },
    badgeOverride?: string
  ) => {
    const isRecipe = item.type === 'recipe';
    const rec = isRecipe ? (item.data as SavedRecipe) : null;
    const oil = !isRecipe ? (item.data as FragranceOil) : null;

    const key = item.key;
    const availSizes = (item.data as any)?.availableSizes;
    const productSizes: number[] = Array.isArray(availSizes) && availSizes.length > 0
      ? availSizes
      : [30, 50, 100];
    const selection = getSelection(key, productSizes);
    const currentSize = selection.size;
    const currentQty = selection.qty;

    // Price and stock calculations
    const info = isRecipe
      ? getRecipeInfo(rec!, currentSize)
      : getOilInfo(oil!, currentSize);

    const { price, stockStatus, maxBottlesPossible } = info;
    const lineTotal = price * currentQty;

    // Product details
    const name = isRecipe ? rec!.name : oil!.name;
    const nameEn = isRecipe ? rec!.nameEn : (oil as any)!.nameEn;
    const displayName = isAr ? name : (nameEn || getLocalizedOilName(name, 'en'));
    const brand = isRecipe ? (isAr ? 'خلطة نسمات الملكية' : 'Nasamat Signature') : oil!.brand;
    const displayBrand = isRecipe ? brand : (isAr ? brand : getLocalizedBrand(oil!.brand, 'en'));
    const imageUrl = isRecipe ? rec!.imageUrl : oil!.imageUrl;
    const notesText = isRecipe 
      ? (isAr ? (rec!.scentNotes || rec!.description) : (rec!.descriptionEn || getLocalizedNotes(rec!.scentNotes || rec!.description, 'en')))
      : (isAr ? oil!.notes : ((oil as any)!.notesEn || getLocalizedNotes(oil!.notes, 'en')));
    const family = isRecipe ? (isAr ? 'نيش وخلطات' : 'Royal Niche') : oil!.family;

    // Comparison benchmark price
    const originalPrice = currentSize === 30 ? 9 : currentSize === 50 ? 12 : 20;

    return (
      <div
        key={key}
        onClick={() => handleOpenProductModal(item)}
        className="group bg-white border border-neutral-200 hover:border-black rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1.5"
      >
        {/* Product Visual Header (3:4 ratio luxury boutique style) */}
        <div className="relative aspect-[3/4] max-h-52 sm:max-h-72 bg-neutral-50 overflow-hidden flex items-center justify-center p-2 sm:p-3">
          {/* Haute Parfumerie Crystal Sheen Light Reflection */}
          <div className="shine-sweep-overlay" />
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName}
              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-neutral-200 flex items-center justify-center text-neutral-600">
              <Droplet className="w-8 h-8" />
            </div>
          )}

          {/* Badges top-start & top-end (Nasamat Signature) */}
          <div className="absolute top-2 start-2 flex flex-col gap-1 items-start">
            <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded sm:rounded-md text-[8px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm ${
              oil?.isOriginalPackaged
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border border-amber-300'
                : 'bg-black text-white'
            }`}>
              {badgeOverride
                ? (isAr ? badgeOverride : (badgeOverride.includes('أكثر') ? '★ Best Seller' : (!/[\u0600-\u06FF]/.test(badgeOverride) ? badgeOverride : '★ Special Offer')))
                : (oil?.productNature === 'makeup'
                    ? (isAr ? 'مكياج فاخر' : 'Luxury Makeup')
                    : oil?.productNature === 'accessories'
                    ? (isAr ? 'إكسسوار راقٍ' : 'Luxury Accessory')
                    : oil?.productNature === 'bakhoor'
                    ? (isAr ? 'بخور ملكي' : 'Royal Bakhoor')
                    : oil?.productNature === 'other'
                    ? (isAr ? 'منتج بوتيك' : 'Boutique Item')
                    : (oil?.isOriginalPackaged 
                        ? (isAr ? 'عطر أصلي معلب' : '100% Original Boxed') 
                        : (isRecipe ? (isAr ? 'خلطة ملكية' : 'Royal Blend') : (isAr ? 'الأكثر طلباً' : 'Best Seller'))))}
            </span>
          </div>

          <div className="absolute top-2 end-2 flex flex-col gap-1 items-end">
            <span className="px-1.5 sm:px-2 py-0.5 rounded sm:rounded-md bg-rose-600 text-white text-[8px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm">
              {isAr ? `وفّر $${Math.max(1, originalPrice - price)}` : `Save $${Math.max(1, originalPrice - price)}`}
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-neutral-900 border border-neutral-300 text-[9px] font-mono font-bold shadow-xs">
              {oil?.isOriginalPackaged ? (oil.concentration || 'OFFICIAL RETAIL') : 'EXTRAIT DE PARFUM'}
            </span>
          </div>

          {/* Hover overlay hint */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <span className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-bold flex items-center gap-1.5 shadow-xl uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-black" />
              <span>{t('storeCardClickHint')}</span>
            </span>
          </div>

          {/* Stock Status Pill bottom-start */}
          <div className="absolute bottom-2 start-2">
            {stockStatus === 'in_stock' && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-white/95 border border-neutral-200 text-neutral-800 text-[8px] sm:text-[9px] font-bold flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{t('storeInStockBottles')}</span>
              </span>
            )}
            {stockStatus === 'low_stock' && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-white/95 border border-amber-300 text-amber-800 text-[8px] sm:text-[9px] font-bold flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>{t('storeLowStockBottles')}</span>
              </span>
            )}
            {stockStatus === 'out_of_stock' && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-white/95 border border-rose-300 text-rose-700 text-[8px] sm:text-[9px] font-bold shadow-xs">
                {t('storeOutOfStockBottles')}
              </span>
            )}
          </div>
        </div>

        {/* Product Body (Luxury Editorial Hierarchy) */}
        <div className="p-2.5 sm:p-4 md:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
          <div>
            {/* Inspiration Sub-label */}
            <div className="text-[10px] sm:text-xs text-neutral-600 font-bold uppercase tracking-wider flex items-center gap-1 truncate">
              <span className="text-neutral-500 font-bold">
                {oil?.productNature && oil.productNature !== 'perfume_crafted' && oil.productNature !== 'perfume_original'
                  ? (isAr ? 'دار الصنع:' : 'Brand:')
                  : (isAr ? 'مستوحى من:' : 'Inspired by:')}
              </span>
              <span className="text-black font-black truncate">{displayBrand}</span>
            </div>

            {/* Fragrance Name */}
            <h3 className="font-serif font-black text-black text-xs sm:text-base md:text-lg leading-snug line-clamp-1 mt-0.5 group-hover:underline">
              {displayName}
            </h3>

            {/* English Name if in Arabic mode and available */}
            {isAr && nameEn && (
              <p className="text-[9px] sm:text-xs text-neutral-500 font-bold line-clamp-1">
                {nameEn}
              </p>
            )}

            {/* Star Rating (5 gold stars) */}
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs mt-0.5 sm:mt-1">
              <span className="text-amber-500 font-black tracking-tighter">★★★★★</span>
              <span className="text-[10px] sm:text-xs font-black text-black font-mono">4.9</span>
              <span className="hidden sm:inline text-[11px] text-neutral-600 font-bold">({isRecipe ? (isAr ? '184 تقييم' : '184 reviews') : (isAr ? '142 تقييم' : '142 reviews')})</span>
            </div>

            {/* Scent notes pill */}
            {notesText && (
              <p className="text-[9px] sm:text-[11px] text-slate-800 font-semibold mt-1 sm:mt-2 line-clamp-1 leading-relaxed bg-slate-100 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-200">
                {notesText}
              </p>
            )}
          </div>

          {/* Pricing & Size Selection */}
          <div className="space-y-1.5 sm:space-y-2 pt-1 border-t border-neutral-100">
            {oil?.isOriginalPackaged ? (
              <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-300 flex items-center justify-between gap-2 shadow-2xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="text-[10px] sm:text-xs font-black text-amber-950 font-mono truncate">
                      {oil.productNature === 'makeup'
                        ? (oil.colorOrShade ? `${oil.colorOrShade}` : (isAr ? 'مستحضر تجميل فاخر' : 'Luxury Makeup'))
                        : oil.productNature === 'accessories'
                        ? (oil.specification ? `${oil.specification}` : (isAr ? 'إكسسوار راقٍ' : 'Luxury Accessory'))
                        : oil.productNature === 'bakhoor'
                        ? (oil.specification ? `${oil.specification}` : (isAr ? 'بخور ملكي معتق' : 'Royal Bakhoor'))
                        : `${oil.singleBottleSizeMl || 100}ml • ${oil.concentration || 'Eau de Parfum'}`}
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-neutral-600 block truncate font-bold mt-0.5">
                    {oil.productNature && oil.productNature !== 'perfume_crafted' && oil.productNature !== 'perfume_original'
                      ? (oil.category ? `${oil.category} • ` : '') + (isAr ? 'قطعة فاخرة أصلية' : 'Authentic Piece')
                      : ((oil.countryOfOrigin ? `${oil.countryOfOrigin} • ` : '') + (oil.boxCondition === 'sealed' ? (isAr ? 'مغلف بالسولوفان' : 'Sealed Box') : (oil.boxCondition === 'tester' ? (isAr ? 'تستر أصلي' : 'Tester Box') : (isAr ? 'علبة رسمية' : 'Retail Box'))))}
                  </span>
                </div>
                <div className="text-end shrink-0">
                  <div className="flex items-baseline justify-end gap-1">
                    {oil.originalRetailPrice && (
                      <span className="text-[9px] sm:text-[10px] text-neutral-400 line-through font-mono">
                        ${oil.originalRetailPrice}
                      </span>
                    )}
                    <span className="text-black font-mono font-black text-xs sm:text-base">
                      ${price.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-black text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded font-mono">
                    {oil.packageStockCount !== undefined ? `${oil.packageStockCount} ${isAr ? 'علب' : 'pcs'}` : (isAr ? 'متوفر' : 'In Stock')}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black font-extrabold text-[10px] sm:text-xs uppercase tracking-wider">
                    {language === 'ar' ? 'اختر الحجم:' : 'Select Size:'}
                  </span>
                  <div className="flex items-baseline gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-neutral-500 line-through font-mono font-bold">
                      ${originalPrice}
                    </span>
                    <span className="text-black font-mono font-black text-sm sm:text-lg">
                      ${price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Size pills (Dynamic based on perfume's availableSizes) */}
                <div className={`grid gap-1 sm:gap-2 ${
                  productSizes.length <= 2 ? 'grid-cols-2' : productSizes.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
                }`}>
                  {productSizes.map((sz) => {
                    const isSelected = currentSize === sz;
                    const sInfo = isRecipe ? getRecipeInfo(rec!, sz) : getOilInfo(oil!, sz);
                    const isPopular = sz === 50 || (productSizes.length === 1);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSize(key, sz);
                        }}
                        className={`relative py-1 sm:py-2 px-0.5 sm:px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'size-pill-selected bg-black text-white border-2 border-black shadow-md scale-[1.02]'
                            : 'size-pill-unselected bg-white hover:bg-neutral-50 text-black border-2 border-neutral-300'
                        }`}
                      >
                        <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider">{sz}ml</span>
                        <span className={`text-[9px] sm:text-xs font-mono font-bold mt-0.5 ${isSelected ? 'text-amber-300' : 'price-subtext text-neutral-700'}`}>
                          ${sInfo.price}
                        </span>
                        {isPopular && (
                          <span className="badge-top absolute -top-1.5 -end-1 bg-amber-400 text-black text-[7px] sm:text-[8px] font-black px-1 sm:px-1.5 py-0.2 rounded-full uppercase shadow-xs">
                            {isAr ? 'توب' : 'TOP'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Add to Cart Action */}
          <div className="pt-1.5 sm:pt-2 border-t border-neutral-200">
            {/* Add to Cart (Black Luxury Button) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCartClick(
                  item.type,
                  item.data.id,
                  name,
                  nameEn,
                  brand,
                  imageUrl,
                  currentSize,
                  price,
                  currentQty,
                  info.oilNeededMl
                );
              }}
              disabled={stockStatus === 'out_of_stock'}
              className={`w-full py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-2 transition cursor-pointer shadow-md ${
                stockStatus === 'out_of_stock'
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                  : 'bg-black hover:bg-neutral-800 text-white shadow-sm'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
              <span className="truncate">
                {stockStatus === 'out_of_stock'
                  ? t('storeOutOfStockBottles')
                  : `${t('storeAddToCart')} ($${price.toFixed(2)})`}
              </span>
            </button>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Toast Notification with Smooth Spring Pop */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-xl shadow-2xl border border-neutral-700 flex items-center gap-3 animate-toast-pop">
          <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
          <span className="font-bold text-xs tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Luxury Sub-Navigation Bar with Real Circular Category Photos */}
      <div className="bg-white border-b border-neutral-200 sticky top-14 sm:top-16 z-30 -mt-2 -mx-2.5 sm:-mx-6 lg:-mx-8 px-2.5 sm:px-6 lg:px-8 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden gap-3">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold uppercase tracking-wider">
            {[
              { id: 'home', page: 'home', conf: getCategoryConfig('home') },
              { id: 'catalog', page: 'catalog', conf: getCategoryConfig('all') },
              { id: 'signatures', page: 'signatures', conf: getCategoryConfig('signatures') },
              { id: 'mix-perfume', page: 'mix-perfume', conf: getCategoryConfig('mix-perfume') },
              { id: 'atelier', page: 'atelier', conf: getCategoryConfig('atelier') },
              { id: 'delivery', page: 'delivery', conf: getCategoryConfig('delivery') },
            ]
              .filter(({ id }) => {
                const deletedIds = loadDeletedNavCategoryIds();
                if (deletedIds.has(id)) return false;
                if (id === 'catalog' && (deletedIds.has('all') || !navCategories.some((c) => c.id === 'all'))) return false;
                return navCategories.some((c) => c.id === id || (id === 'catalog' && c.id === 'all'));
              })
              .map(({ id, page, conf }) => (
              <button
                key={id}
                onClick={() => navigateToCustomerPage(page as any)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                  customerPage === page
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'text-neutral-700 hover:text-black hover:bg-neutral-100 border-transparent'
                }`}
              >
                <img
                  src={conf.imageUrl}
                  alt={language === 'ar' ? conf.labelAr : conf.labelEn}
                  className="w-5 h-5 rounded-full object-cover border border-neutral-300 shadow-2xs shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80';
                  }}
                />
                <span>{language === 'ar' ? conf.labelAr : conf.labelEn}</span>
              </button>
            ))}
          </nav>

          {/* Quick Actions (Cart) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenCart}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-xs ${
                cart.length > 0
                  ? 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-300 text-neutral-950'
                  : 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-800 hover:border-amber-400'
              }`}
            >
              <ShoppingBag className={`w-3.5 h-3.5 ${cart.length > 0 ? 'text-amber-700' : 'text-neutral-700'}`} />
              <span className="hidden sm:inline text-neutral-600">{language === 'ar' ? 'السلة' : 'Cart'}:</span>
              <span className="font-mono font-black text-neutral-900">${cartSubtotal.toFixed(2)}</span>
              {cart.length > 0 && (
                <span className="min-w-[18px] h-4.5 px-1.5 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {cart.reduce((s, it) => s + it.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================= PAGE 1: HOME & DISCOVER (الرئيسية واكتشف) ================= */}
      {customerPage === 'home' && (
        <div className="space-y-10 animate-fadeIn">
          {/* StyLuxe High-Fashion Luxury Editorial Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-[#fafafa] border border-neutral-200/90 p-6 sm:p-10 lg:p-12 shadow-xs group">
            {/* Subtle Architectural Accent Line */}
            <div className="absolute top-0 start-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-start max-w-2xl">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-black tracking-wider uppercase font-serif">
                  {language === 'ar' ? (
                    <span>نسمات — <span className="animate-text-gold-shine">فخامة العطور العالمية</span></span>
                  ) : (
                    <span>REDEFINING <span className="animate-text-gold-shine">LUXURY PERFUMES</span></span>
                  )}
                </h1>
                
                <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed">
                  {language === 'ar' 
                    ? 'عطور نيش شرقية وعالمية فاخرة بتركيز إكستري دو بارفان يدوم طويلاً، مصممة بأعلى معايير الإتقان في بيروت مع زيوت نقية مستوردة من غراس ولوزي.' 
                    : 'Clean silhouettes, pure Extrait de Parfum concentration, and bespoke artisan formulations handcrafted in Beirut with French and Swiss oils.'}
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  <button
                    onClick={() => navigateToCustomerPage('catalog', 'all')}
                    className="px-6 py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-white" />
                    <span>{language === 'ar' ? 'تصفح كل العطور' : 'Shop All Perfumes'}</span>
                  </button>
                  <button
                    onClick={() => navigateToCustomerPage('signatures')}
                    className="px-6 py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-black border border-neutral-300 font-bold text-xs uppercase tracking-wider transition shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-black" />
                    <span>{language === 'ar' ? 'استكشف خلطات نسمات الحصرية' : 'Signature Blends'}</span>
                  </button>
                </div>
              </div>

              {/* High Fashion Brand Emblem */}
              <button
                onClick={() => {
                  navigateToCustomerPage('home');
                }}
                className="flex flex-col items-center justify-center p-6 bg-white border border-neutral-200 hover:border-black rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 text-center min-w-[240px] cursor-pointer group"
                title={language === 'ar' ? 'نَسَمَات — لتركيب العطور الفاخرة' : 'Nasamat — Luxury Bespoke Perfumery'}
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-black/85 p-1 bg-white shadow-md mb-3 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={language === 'ar' ? '/logo.png' : '/logo-en.webp'}
                    alt={language === 'ar' ? 'شعار نسمات لتركيب العطور الفاخرة' : 'Nasamat Luxury Bespoke Perfumery'}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="font-serif font-black text-xl tracking-wider text-black uppercase">
                  {language === 'ar' ? 'نَسَمَات' : 'NASAMAT'}
                </div>
                <div className="text-xs font-bold text-neutral-600 tracking-wider uppercase">
                  {language === 'ar' ? 'لتركيب العطور الفاخرة' : 'LUXURY BESPOKE PERFUMERY'}
                </div>
                <div className="mt-3 pt-3 border-t border-neutral-100 w-full text-[11px] font-semibold text-neutral-500 flex items-center justify-center gap-2">
                  <span>Extrait de Parfum • {isAr ? 'بيروت' : 'Beirut'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Circular Category Quick-Nav Strip (Real Luxury Photos - 100% Editable) */}
          <div className="py-2 overflow-x-auto scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between gap-4 min-w-max mx-auto px-1">
              {navCategories
                .filter((cat) => cat.id !== 'home' && cat.id !== 'atelier')
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="flex flex-col items-center gap-2.5 p-2 rounded-2xl hover:bg-neutral-50 transition group shrink-0 relative"
                  >
                    <div 
                      onClick={() => {
                        if (cat.id === 'mix-perfume' || cat.id === 'bundles' || cat.id === 'delivery' || cat.id === 'signatures') {
                          navigateToCustomerPage(cat.id as any);
                        } else {
                          navigateToCustomerPage('catalog', cat.id);
                        }
                      }}
                      className="relative cursor-pointer"
                    >
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-neutral-300 group-hover:border-black group-hover:scale-105 shadow-sm group-hover:shadow-md transition-all duration-300 bg-neutral-100 p-0.5">
                        <img
                          src={cat.imageUrl}
                          alt={language === 'ar' ? cat.labelAr : cat.labelEn}
                          className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80';
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (cat.id === 'mix-perfume' || cat.id === 'bundles' || cat.id === 'delivery' || cat.id === 'signatures') {
                          navigateToCustomerPage(cat.id as any);
                        } else {
                          navigateToCustomerPage('catalog', cat.id);
                        }
                      }}
                      className="text-center cursor-pointer"
                    >
                      <span className="text-xs font-black text-black group-hover:underline block">
                        {language === 'ar' ? cat.labelAr : cat.labelEn}
                      </span>
                      {cat.countAr && !/\d+/.test(cat.countAr) && (
                        <span className="text-[10px] text-neutral-500 font-bold block mt-0.5">
                          {language === 'ar' ? cat.countAr : cat.countEn}
                        </span>
                      )}
                    </button>
                  </div>
                ))}
            </div>
          </div>


          {/* 3 Pillars of Excellence (ركائز الفخامة والخدمة) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs space-y-2 hover:border-black transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-xs">
                <Sparkles className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="font-bold text-sm text-black uppercase tracking-wide">
                {language === 'ar' ? 'زيوت نقية من غراس وسويسرا' : 'Pure French & Swiss Oils'}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {language === 'ar'
                  ? 'استيراد مباشر من أعرق دور العطور العالمية في غراس ولوزي السويسرية بجودة 100% خام.'
                  : 'Directly sourced from Grasse, France and Luzi, Switzerland with uncompromised purity.'}
              </p>
            </div>

            <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs space-y-2 hover:border-black transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-center shadow-xs">
                <Truck className="w-6 h-6 text-rose-700" />
              </div>
              <h3 className="font-bold text-sm text-black uppercase tracking-wide">
                {language === 'ar' ? 'توصيل سريع لكافة لبنان' : 'Express Lebanon Delivery'}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {isAr
                  ? (settings.deliveryNotes || `بيروت خلال 24 ساعة، وكافة المحافظات خلال 48 ساعة فقط بتكلفة $${settings.defaultDeliveryFee ?? 3}${settings.isFreeDeliveryEnabled !== false ? ` (مجاني فوق $${settings.freeDeliveryThreshold ?? 35})` : ''}.`)
                  : `Beirut in 24 hours, all governorates in 48 hours. $${settings.defaultDeliveryFee ?? 3}${settings.isFreeDeliveryEnabled !== false ? ` (Free over $${settings.freeDeliveryThreshold ?? 35})` : ''}.`}
              </p>
            </div>

            <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs space-y-2 hover:border-black transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 flex items-center justify-center shadow-xs">
                <Receipt className="w-6 h-6 text-sky-700" />
              </div>
              <h3 className="font-bold text-sm text-black uppercase tracking-wide">
                {language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {language === 'ar'
                  ? 'الدفع عند الاستلام بالدولار أو بالليرة اللبنانية أو عبر Whish Money.'
                  : 'Pay upon delivery in USD, LBP, or via Whish Money.'}
              </p>
            </div>
          </div>

          {/* Curated Best Sellers in Beirut */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-neutral-200 pb-3">
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  BEIRUT TOP PICKS • BEST SELLERS
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-black font-serif uppercase tracking-wide">
                  {language === 'ar' ? 'أيقونات التشكيلة — الأكثر طلباً في بيروت' : 'Iconic Fragrances • Beirut Bestsellers'}
                </h2>
              </div>
              <button
                onClick={() => navigateToCustomerPage('catalog', 'all')}
                className="text-xs font-bold text-neutral-800 hover:text-black flex items-center gap-1 group cursor-pointer"
              >
                <span>{language === 'ar' ? 'عرض الكتالوج الكامل' : 'Explore full catalog'}</span>
                <span className="transition-transform group-hover:translate-x-1">←</span>
              </button>
            </div>

            {/* 4 Bestsellers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {curatedFeatured.map((item) => renderProductCard(item, isAr ? '★ الأكثر طلباً' : '★ Best Seller'))}
            </div>
          </div>

          {/* Lebanese Verified Customer Testimonials & Social Proof */}
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 text-[10px] font-black uppercase tracking-widest">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{isAr ? '4.9 / 5.0 • أكثر من 450 تقييم موثق في لبنان' : '4.9 / 5.0 • Over 450 Verified Reviews Across Lebanon'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-black font-serif uppercase tracking-wide">
                {language === 'ar' ? 'تجارب زبائن نسمات في مختلف المناطق اللبنانية' : 'What Our Customers in Lebanon Say'}
              </h2>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                {isAr
                  ? 'شهادات حقيقية من عشاق العطور الذين اختبروا ثبات زيوت نسمات المركزة (Extrait 33%) وسرعة التوصيل'
                  : 'Genuine testimonials from perfume enthusiasts who experienced our 33% Extrait sillage & fast delivery'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex text-amber-400 gap-0.5 text-sm">
                    {'★★★★★'}
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed italic">
                    {language === 'ar'
                      ? '"عطر نسمات رويال بليند ثباته خيالي! رشيته الصبح وظل فوحانه لليوم الثاني بكل وضوح. التوصيل في بيروت أخذ أقل من 24 ساعة، والعينة المجانية ذوق عالي."'
                      : '"Nasamat Royal Blend has phenomenal performance. Sillage lasts 24h. Express delivery in Beirut was super fast!"'}
                  </p>
                </div>
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-black">{isAr ? 'جورج خوري' : 'Georges Khoury'}</span>
                  <span className="text-neutral-500 font-mono text-[11px]">{isAr ? 'الأشرفية — بيروت' : 'Achrafieh — Beirut'}</span>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex text-amber-400 gap-0.5 text-sm">
                    {'★★★★★'}
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed italic">
                    {language === 'ar'
                      ? '"جربت باكارات روج وليبر إنتنس، المقادير والنوتات مطابقة 100% للأصلي وأوفر بكثير. البخاخ ميكرو ناعم جداً ولا يوجد أي تسريب نهائياً."'
                      : '"Baccarat Rouge and Libre Intense were 100% spot on compared to the boutique flacons. Super premium atomizers."'}
                  </p>
                </div>
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-black">{isAr ? 'رانيا معوض' : 'Rania Moawad'}</span>
                  <span className="text-neutral-500 font-mono text-[11px]">{isAr ? 'جونيه — جبل لبنان' : 'Jounieh — Mount Lebanon'}</span>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex text-amber-400 gap-0.5 text-sm">
                    {'★★★★★'}
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed italic">
                    {language === 'ar'
                      ? '"تعامل في قمة الرقي والاحترافية وسرعة بالتوصيل لطرابلس. الدفع عند الاستلام بالليرة بسعر السوق تماماً بدون أي تعقيد. شكراً لفريق نسمات."'
                      : '"Flawless customer service and delivery to Tripoli. Cash on Delivery at official market rate. Highly recommended!"'}
                  </p>
                </div>
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-black">{isAr ? 'م. طارق علوان' : 'Eng. Tarek Alwan'}</span>
                  <span className="text-neutral-500 font-mono text-[11px]">{isAr ? 'الميناء — طرابلس' : 'El Mina — Tripoli'}</span>
                </div>
              </div>
            </div>

            {/* Direct Feedback / WhatsApp Review Prompt */}
            <div className="text-center pt-1">
              <a
                href={`https://wa.me/${formatWhatsAppPhone(settings.storePhone)}?text=${encodeURIComponent(
                  isAr 
                    ? 'مرحباً نسمات، أود مشاركة تقييمي وتجربتي مع عطوركم: ⭐⭐⭐⭐⭐' 
                    : 'Hello Nasamat, I would like to submit my 5-star review and experience: ⭐⭐⭐⭐⭐'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <span>💬 {isAr ? 'شاركنا تقييمك ورأيك العطري عبر واتساب' : 'Share your fragrance review on WhatsApp'}</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ================= PAGE 2: FULL CATALOG (كل العطور والكتالوج) ================= */}
      {customerPage === 'catalog' && (
        <div className="space-y-6 animate-fadeIn">
          {renderInternalPageBackHeader(
            language === 'ar' ? 'خزانة العطور الملكية' : 'Royal Perfumery Archives', 
            'Royal Perfumery Archives', 
            language === 'ar' ? 'تصفح تشكيلة عطور إكستري دو بارفان الكاملة' : 'Explore All Extrait Fragrances'
          )}
          {/* Filter and Search Controls */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('storeSearchPlaceholder')}
                  className="w-full bg-neutral-50 hover:bg-white border border-neutral-200 focus:border-black rounded-xl ps-10 pe-4 py-2.5 text-sm text-black placeholder-neutral-400 focus:outline-none transition"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute top-1/2 -translate-y-1/2 end-3 text-neutral-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-neutral-500 whitespace-nowrap font-medium uppercase tracking-wider">
                  {language === 'ar' ? 'الترتيب:' : 'Sort by:'}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-neutral-50 border border-neutral-200 text-xs font-bold text-black rounded-xl px-3 py-2.5 focus:outline-none focus:border-black cursor-pointer w-full md:w-auto"
                >
                  <option value="featured">{t('storeSortFeatured')}</option>
                  <option value="price_asc">{t('storeSortPriceAsc')}</option>
                  <option value="price_desc">{t('storeSortPriceDesc')}</option>
                  <option value="name">{t('storeSortName')}</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills (Dynamically synchronized with all store categories) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {navCategories
                .filter((cat) => cat.id !== 'home' && cat.id !== 'atelier' && cat.id !== 'mix-perfume' && cat.id !== 'bundles' && cat.id !== 'delivery')
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer uppercase tracking-wider ${
                      selectedCategory === cat.id
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                    }`}
                  >
                    {language === 'ar' ? cat.labelAr : cat.labelEn}
                  </button>
                ))}
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
              <span className="font-semibold">
                {language === 'ar'
                  ? 'تشكيلة عطور فاخرة بتركيز إكستري دو بارفان'
                  : 'Luxury Extrait de Parfum Fragrances'}
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                30ml ($5) • 50ml ($7) • 100ml ($12)
              </span>
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {unifiedItems.map((item) => renderProductCard(item))}
          </div>
        </div>
      )}

      {/* ================= PAGE 3: SIGNATURE ATELIER BLENDS (خلطات نسمات الحصرية) ================= */}
      {customerPage === 'signatures' && (
        <div className="space-y-8 animate-fadeIn">
          {renderInternalPageBackHeader(
            'خلطات نسمات الملكية الخاصة', 
            'Private Reserve Signatures',
            language === 'ar' ? 'وصفات خاصة حصرية تم تعتيقها داخل مختبر بيروت' : 'Aged Reserve Signature Perfumes'
          )}
          {/* Header */}
          <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg text-center max-w-4xl mx-auto space-y-3 relative overflow-hidden border border-neutral-800">
            <h1 className="text-2xl sm:text-4xl font-black font-serif uppercase tracking-wider">
              {language === 'ar' ? 'مختبر خلطات نسمات الحصرية' : 'Nasamat Signature Formulations'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              {language === 'ar'
                ? 'وصفات خاصة نادرة تم ابتكارها وتعتيقها داخل مختبر نسمات في بيروت، تجمع بين أعظم التراكيب العالمية بتوازن دقيق ونسبة ثبات وفوحان تتجاوز 24 ساعة.'
                : 'Exclusive bespoke recipes crafted and macerated in Beirut, merging iconic fragrance accords into unforgettable royal signatures.'}
            </p>
          </div>

          {/* Recipes List in Detailed Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recipes.map((rec) => {
              const key = `recipe-${rec.id}`;
              const selection = getSelection(key);
              const currentSize = selection.size;
              const currentQty = selection.qty;
              const info = getRecipeInfo(rec, currentSize);
              const lineTotal = info.price * currentQty;

              return (
                <div
                  key={rec.id}
                  className="bg-white border border-neutral-200 hover:border-black rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5"
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Bottle Image */}
                    <div className="w-full sm:w-36 h-48 bg-neutral-100 rounded-2xl overflow-hidden shrink-0 relative">
                      <img
                        src={rec.imageUrl || 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=400&q=80'}
                        alt={language === 'ar' ? rec.name : (rec.nameEn || getLocalizedOilName(rec.name, 'en'))}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 start-2 bg-white/95 backdrop-blur-xs border border-neutral-300 text-neutral-900 text-[9px] font-black px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                        EXTRAIT DE PARFUM
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 font-mono">
                        <span>{rec.code}</span>
                        <span className="text-black font-serif uppercase tracking-widest">NASAMAT ATELIER</span>
                      </div>
                      <h3 className="text-lg font-black text-black font-serif">
                        {language === 'ar' ? rec.name : (rec.nameEn || rec.name)}
                      </h3>
                      {language === 'ar' && rec.nameEn && (
                        <p className="text-xs text-neutral-400 font-medium font-sans">
                          {rec.nameEn}
                        </p>
                      )}
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {language === 'ar' ? rec.description : (rec.descriptionEn || rec.description)}
                      </p>

                      {/* Olfactory Notes Box */}
                      {rec.scentNotes && (
                        <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs space-y-1 mt-2">
                          <span className="font-bold text-black block text-[11px] uppercase tracking-wider">
                            {language === 'ar' ? 'الهرم العطري والنوتات:' : 'Olfactory Pyramid:'}
                          </span>
                          <span className="text-neutral-700 leading-relaxed font-sans block">
                            {language === 'ar' ? rec.scentNotes : getLocalizedNotes(rec.scentNotes, 'en')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Size Selector & Add to Cart */}
                  <div className="pt-3 border-t border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                        {[
                          { size: 30, label: '30ml', price: 5 },
                          { size: 50, label: '50ml', price: 7, popular: true },
                          { size: 100, label: '100ml', price: 12 },
                        ].map((s) => (
                          <button
                            key={s.size}
                            onClick={() => setSize(key, s.size)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                              currentSize === s.size
                                ? 'bg-black text-white shadow-md'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            <span>{s.label}</span>
                            <span className="font-mono text-[10px]">${s.price}</span>
                          </button>
                        ))}
                      </div>

                      <div className="text-end">
                        <span className="text-[10px] text-neutral-400 block uppercase tracking-wider">
                          {language === 'ar' ? 'السعر' : 'Price'}
                        </span>
                        <span className="font-black text-xl font-mono text-black">
                          ${info.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleAddToCartClick(
                            'recipe',
                            rec.id,
                            rec.name,
                            rec.nameEn,
                            isAr ? 'خلطة نسمات الملكية' : 'Nasamat Royal Signature',
                            rec.imageUrl,
                            currentSize,
                            info.price,
                            1,
                            info.oilNeededMl
                          );
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4 text-white" />
                        <span>{language === 'ar' ? `أضف للسلة ($${info.price})` : `Add to Cart ($${info.price})`}</span>
                      </button>

                      <button
                        onClick={() => {
                          handleOpenProductModal({
                            type: 'recipe',
                            data: rec,
                            key,
                          });
                        }}
                        className="px-4 py-3 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-black text-xs font-bold transition cursor-pointer"
                        title={language === 'ar' ? 'معاينة سريعة' : 'Quick View'}
                      >
                        <Eye className="w-4 h-4 text-black" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= PAGE: MIX YOUR OWN PERFUME (مختبر تركيب عطرك الخاص من زيوت المشروع بالاسم) ================= */}
      {customerPage === 'mix-perfume' && (
        <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
          {renderInternalPageBackHeader(
            'مختبر تركيب وصياغة العطور بالاسم', 
            'Bespoke Perfume Compounding',
            language === 'ar' ? 'ركب عطرك الخاص من زيوت المختبر بنسب دقيقة' : 'Formulate your signature blend by exact %'
          )}
          {/* Hero Header */}
          <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl text-center space-y-3 relative overflow-hidden border border-neutral-800">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-bold tracking-widest uppercase">
              <FlaskConical className="w-3 h-3 text-amber-400" />
              <span>BEIRUT ATELIER • BESPOKE CREATION LAB</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-serif uppercase tracking-wider">
              {language === 'ar' ? 'مختبر صياغة وتركيب العطور بالاسم' : 'Bespoke Perfume Atelier'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              {language === 'ar'
                ? 'ركّب عطرك الحصري بنفسك من أجود الزيوت العطرية العالمية المحفوظة في المختبر بالاسم والنسب. سمّ خلطتك بنفسك، احفظها في سجلك، وسنقوم بتركيبها يدوياً بتركيز إكستري دو بارفان مع طباعة اسمك على الزجاجة.'
                : 'Formulate your royal fragrance from authentic saved oils by exact name & ratio. Name your creation, save it to your customer record, and our perfumers will handcraft it with Extrait de Parfum concentration.'}
            </p>

            {/* Atelier Navigation Tabs (Composer vs. Customer Saved Blends Record vs. Caliber Calculator) */}
            <div className="pt-3 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveBlenderTab('composer')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
                  activeBlenderTab === 'composer'
                    ? 'bg-white text-black font-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                <span>{language === 'ar' ? 'صياغة وتركيب عطر جديد' : 'Compound New Blend'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveBlenderTab('my-blends')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
                  activeBlenderTab === 'my-blends'
                    ? 'bg-amber-400 text-black font-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>
                  {language === 'ar' ? 'سجل خلطاتي المحفوظة' : 'My Saved Blends'}
                </span>
                {customerBlends.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                )}
              </button>
            </div>
          </div>

          {/* VIEW 1: INTERACTIVE ATELIER COMPOSER */}
          {activeBlenderTab === 'composer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form & Oil Selection (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Step 1: Naming the Perfume by Customer */}
                <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-black flex items-center justify-center">1</span>
                      <div>
                        <h3 className="font-bold text-sm text-black uppercase tracking-wider">
                          {language === 'ar' ? 'تسمية العطر من قبل الزبون (Bespoke Naming)' : 'Name Your Perfume'}
                        </h3>
                        <p className="text-[11px] text-neutral-500">
                          {language === 'ar' ? 'اكتب الاسم المفضل لخلطتك ليتم حفظه وطباعته على الملصق الملكي' : 'Printed on luxury flacon and saved in your profile'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">Step 1/3</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-black flex items-center justify-between mb-1">
                        <span>{language === 'ar' ? 'اسم العطر أو الخلطة المختارة:' : 'Perfume / Blend Name:'} <span className="text-rose-500">*</span></span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      </label>
                      <input
                        type="text"
                        value={customPerfumeName}
                        onChange={(e) => setCustomPerfumeName(e.target.value)}
                        placeholder={language === 'ar' ? 'مثال: خلطة الملوك الخاصة' : 'e.g. Royal Imperial Blend'}
                        className="w-full bg-neutral-50 border border-neutral-300 focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-black flex items-center justify-between mb-1">
                        <span>{language === 'ar' ? 'تسجيل التركيبة باسم الزبون (الاسم الكامل):' : 'Register Blend to Customer Name:'}</span>
                        <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-normal">
                          {language === 'ar' ? 'يُحفظ بالسجل ويُنقش على الزجاجة' : 'Saved to Profile & Engraved'}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={customPerfumeRecipient}
                        onChange={(e) => setCustomPerfumeRecipient(e.target.value)}
                        placeholder={language === 'ar' ? 'مثال: سمو الأمير / الاسم الكريم' : 'e.g. John Doe / Client Name'}
                        className="w-full bg-neutral-50 border border-neutral-300 focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black focus:outline-none"
                      />
                      <p className="text-[10px] text-neutral-500 mt-1">
                        {language === 'ar' 
                          ? 'يتم تسجيل هذه التركيبة رسمياً باسمك في سجل الزبائن لطلبها مجدداً، وتظهر منقوشة على الزجاجة.' 
                          : 'This blend is registered to your name in our customer records for instant reorders.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2: Choosing Oils by Name from Project & Blending Proportions */}
                <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-black flex items-center justify-center">2</span>
                      <div>
                        <h3 className="font-bold text-sm text-black uppercase tracking-wider">
                          {language === 'ar' ? 'تركيب الزيوت العطرية بالاسم والنسب' : 'Select Oils by Name & Ratios'}
                        </h3>
                        <p className="text-[11px] text-neutral-500">
                          {language === 'ar' ? 'اختر 1 إلى 4 زيوت من زيوت المشروع المحفوظة وحدد نسبة كل زيت' : 'Mix 1 to 4 oils from project catalog with exact %'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">Step 2/3</span>
                  </div>

                  {/* Mixing Beaker / Active Blend Formulation */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-black">
                          {language === 'ar' ? 'قارورة الخلط الحالية (الزيوت المختارة):' : 'Selected Oils in Formulation:'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleEqualizePercentages}
                          className="text-[11px] text-neutral-600 hover:text-black font-bold underline cursor-pointer"
                        >
                          {language === 'ar' ? '⚖️ توزيع النسب بالتساوي' : 'Equalize Ratios'}
                        </button>
                      </div>
                    </div>

                    {/* Percentage Breakdown Bar */}
                    <div className="space-y-1">
                      <div className="h-3 w-full bg-neutral-200 rounded-full overflow-hidden flex shadow-inner">
                        {blendOils.map((bo, idx) => {
                          const colors = ['bg-black', 'bg-amber-500', 'bg-emerald-600', 'bg-sky-600'];
                          return (
                            <div
                              key={bo.oilId}
                              style={{ width: `${bo.percentage}%` }}
                              className={`${colors[idx % colors.length]} h-full transition-all duration-300 relative`}
                              title={`${bo.percentage}%`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-500">
                          {language === 'ar' ? 'إجمالي النسب:' : 'Total Ratio:'}
                        </span>
                        <span className={`font-mono font-bold ${blendTotalPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {blendTotalPercentage}% {blendTotalPercentage === 100 ? (isAr ? '✓ (متوازن تماماً)' : '✓ (Perfect Balance)') : (isAr ? (100 - blendTotalPercentage > 0 ? `متبقي ${100 - blendTotalPercentage}%` : `زيادة ${blendTotalPercentage - 100}%`) : (100 - blendTotalPercentage > 0 ? `${100 - blendTotalPercentage}% remaining` : `${blendTotalPercentage - 100}% excess`))}
                        </span>
                      </div>
                    </div>

                    {/* Selected Oils List with sliders */}
                    <div className="space-y-2.5 pt-1">
                      {blendOils.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-neutral-200 space-y-2">
                          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center text-xl">
                            🧪
                          </div>
                          <p className="text-sm font-bold text-black">
                            {language === 'ar' ? 'لم تقم باختيار أي زيوت بعد للتركيبة' : 'No oils selected yet'}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {language === 'ar' ? 'اختر زيوتاً من القائمة أدناه لإضافتها وتحديد نسبها المئوية' : 'Select oils from the list below and set percentages'}
                          </p>
                        </div>
                      ) : (
                        blendOils.map((bo, idx) => {
                          const oil = oils.find((o) => o.id === bo.oilId);
                          const colors = ['border-s-black', 'border-s-amber-500', 'border-s-emerald-600', 'border-s-sky-600'];
                          return (
                            <div
                              key={bo.oilId}
                              className={`p-3 bg-white rounded-xl border border-neutral-200 border-s-4 ${colors[idx % colors.length]} space-y-2.5 shadow-2xs`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-mono text-[10px] bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded font-bold">
                                    {oil?.code || `OIL-${idx + 1}`}
                                  </span>
                                  <span className="font-bold text-xs text-black truncate">
                                    {oil ? (language === 'ar' ? oil.name : (oil.nameEn || getLocalizedOilName(oil.name, 'en'))) : (language === 'ar' ? 'زيت عطري' : 'Fragrance Oil')}
                                  </span>
                                  {oil?.brand && (
                                    <span className="text-[10px] text-neutral-400 hidden sm:inline truncate">
                                      ({language === 'ar' ? oil.brand : getLocalizedBrand(oil.brand, 'en')})
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Percentage Direct Control (Stepper + Input) */}
                                  <div className="flex items-center bg-neutral-50 rounded-lg border border-neutral-300 p-0.5 shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOilPercentage(bo.oilId, bo.percentage - 5)}
                                      disabled={bo.percentage <= 5}
                                      className="w-5 h-5 rounded bg-white hover:bg-neutral-200 text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs transition cursor-pointer shadow-2xs"
                                      title="-5%"
                                    >
                                      -
                                    </button>
                                    <div className="flex items-center px-1">
                                      <input
                                        type="number"
                                        min="5"
                                        max="95"
                                        step="5"
                                        value={bo.percentage}
                                        onChange={(e) => handleUpdateOilPercentage(bo.oilId, parseInt(e.target.value) || 5)}
                                        className="w-8 text-center font-mono font-black text-xs bg-transparent border-none focus:outline-none text-black p-0"
                                      />
                                      <span className="font-black text-[11px] text-amber-700 select-none">%</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOilPercentage(bo.oilId, bo.percentage + 5)}
                                      disabled={bo.percentage >= 95}
                                      className="w-5 h-5 rounded bg-white hover:bg-neutral-200 text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs transition cursor-pointer shadow-2xs"
                                      title="+5%"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* Prominent Remove Oil Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOilFromBlend(bo.oilId)}
                                    className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs hover:border-rose-300 shrink-0"
                                    title={language === 'ar' ? 'إزالة هذا الزيت من التركيبة' : 'Remove oil from blend'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span>{language === 'ar' ? 'إزالة' : 'Remove'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Percentage Range Slider */}
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min="5"
                                  max="95"
                                  step="5"
                                  value={bo.percentage}
                                  onChange={(e) => handleUpdateOilPercentage(bo.oilId, parseInt(e.target.value) || 10)}
                                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Oil Selection Catalog Filter & List */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black uppercase tracking-wider">
                        {language === 'ar' ? 'اختر زيتاً لإضافته للخلطة من زيوت المشروع:' : 'Add Project Oils to Formula:'}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-medium">
                        {language === 'ar' ? 'زيوت نقية متاحة' : 'Available Pure Oils'}
                      </span>
                    </div>

                    {/* Search & Family Filter Bar */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-neutral-400 absolute start-3 top-2.5" />
                        <input
                          type="text"
                          value={oilPickerSearch}
                          onChange={(e) => setOilPickerSearch(e.target.value)}
                          placeholder={language === 'ar' ? 'ابحث باسم الزيت أو الكود أو الماركة...' : 'Search oil name, code, brand...'}
                          className="w-full bg-neutral-50 border border-neutral-300 focus:border-black rounded-xl ps-9 pe-4 py-2 text-xs focus:outline-none font-medium"
                        />
                      </div>

                      {/* Family Filter Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {[
                          { id: 'all', label: language === 'ar' ? 'الكل' : 'All' },
                          { id: 'oriental', label: language === 'ar' ? 'شرقية' : 'Oriental' },
                          { id: 'woody', label: language === 'ar' ? 'خشبية' : 'Woody' },
                          { id: 'floral', label: language === 'ar' ? 'زهرية' : 'Floral' },
                          { id: 'fresh', label: language === 'ar' ? 'منعشة' : 'Fresh' },
                          { id: 'leather', label: language === 'ar' ? 'جلود' : 'Leather' },
                          { id: 'gourmand', label: language === 'ar' ? 'جورماند' : 'Gourmand' },
                        ].map((fam) => (
                          <button
                            key={fam.id}
                            type="button"
                            onClick={() => setOilPickerFamily(fam.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer border ${
                              oilPickerFamily === fam.id
                                ? 'bg-black text-white border-black shadow-2xs'
                                : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {fam.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scrollable Oils Grid for Selection */}
                    <div className="max-h-64 overflow-y-auto space-y-1.5 pe-1 divide-y divide-neutral-100 border border-neutral-200 rounded-2xl p-2 bg-neutral-50/50">
                      {filteredPickerOils.slice(0, 30).map((oil) => {
                        const isSelected = blendOils.some((bo) => bo.oilId === oil.id);
                        return (
                          <div
                            key={oil.id}
                            className="p-2.5 rounded-xl hover:bg-white flex items-center justify-between transition gap-2"
                          >
                            <div className="truncate flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-black truncate">
                                  {language === 'ar' ? oil.name : (oil.nameEn || getLocalizedOilName(oil.name, 'en'))}
                                </span>
                                <span className="font-mono text-[9px] bg-neutral-200 text-neutral-800 px-1 rounded font-bold">
                                  {oil.code}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                                {language === 'ar' ? (oil.brand || 'نسمات') : getLocalizedBrand(oil.brand || 'Nasamat', 'en')} {oil.family ? `• ${oil.family}` : ''}
                              </p>
                            </div>

                            {isSelected ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveOilFromBlend(oil.id)}
                                className="py-1 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 shadow-2xs"
                                title={language === 'ar' ? 'إزالة هذا الزيت من التركيبة' : 'Remove from blend'}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>{language === 'ar' ? 'إزالة ✕' : 'Remove ✕'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddOilToBlend(oil)}
                                className="py-1 px-3 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer bg-black hover:bg-neutral-800 text-white shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{language === 'ar' ? 'إضافة للخلطة' : 'Add'}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Step 3: Choose Bottle Size */}
                <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-black flex items-center justify-center">3</span>
                      <div>
                        <h3 className="font-bold text-sm text-black uppercase tracking-wider">
                          {language === 'ar' ? 'حجم القارورة والتركيز الملكي' : 'Choose Size & Concentration'}
                        </h3>
                        <p className="text-[11px] text-neutral-500">
                          {language === 'ar' ? 'تركيز إكستري دو بارفان ثبات 24-48 ساعة' : 'Extrait de Parfum for lasting sillage'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">Step 3/3</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setCustomPerfumeSize(30)}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                        customPerfumeSize === 30
                          ? 'bg-black text-white border-black shadow-md'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-black border-neutral-200'
                      }`}
                    >
                      <span className="block text-xs font-bold">30 ml</span>
                      <span className="text-base sm:text-lg font-black font-mono">$5.00</span>
                      <span className="block text-[10px] text-neutral-400">{isAr ? 'حجم الجيب' : 'Pocket Size'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomPerfumeSize(50)}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                        customPerfumeSize === 50
                          ? 'bg-black text-white border-black shadow-md'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-black border-neutral-200'
                      }`}
                    >
                      <span className="block text-xs font-bold">50 ml</span>
                      <span className="text-base sm:text-lg font-black font-mono">$8.00</span>
                      <span className="block text-[10px] text-neutral-400">{isAr ? 'الأكثر طلباً' : 'Most Popular'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomPerfumeSize(100)}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                        customPerfumeSize === 100
                          ? 'bg-black text-white border-black shadow-md'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-black border-neutral-200'
                      }`}
                    >
                      <span className="block text-xs font-bold">100 ml</span>
                      <span className="text-base sm:text-lg font-black font-mono">$14.00</span>
                      <span className="block text-[10px] text-neutral-400">{isAr ? 'الحجم الملكي الكبير' : 'Royal Grande Flacon'}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Luxury Flacon Visualizer & Save to Customer Record (5 cols) */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
                
                <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      BESPOKE FLACON PREVIEW
                    </span>
                    <span className="bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      {isAr ? '★ خلطة حصرية بالاسم' : '★ Bespoke Custom Blend'}
                    </span>
                  </div>

                  {/* Bottle Simulation Card */}
                  <div className="bg-neutral-900 text-white rounded-2xl p-6 text-center space-y-3.5 relative overflow-hidden shadow-2xl group">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Interactive Animated Luxury Perfume Flacon */}
                    <div className="relative mx-auto w-28 h-40 flex flex-col items-center justify-end py-1">
                      {/* Sprayer Nozzle & Cap */}
                      <div className="w-8 h-4 bg-gradient-to-r from-amber-300 via-amber-100 to-amber-400 rounded-t-sm shadow-md border-t border-amber-200" />
                      {/* Sprayer Neck Collar */}
                      <div className="w-10 h-2 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 shadow-xs" />
                      
                      {/* Crystal Bottle Body */}
                      <div className="relative w-24 h-32 rounded-2xl border-2 border-amber-400/40 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl flex flex-col justify-end p-1">
                        {/* Glass Sheen Light Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10 pointer-events-none z-20" />
                        
                        {/* Dynamic Animated Liquid */}
                        <div 
                          className="w-full rounded-b-xl relative overflow-hidden transition-all duration-700 ease-out"
                          style={{
                            height: customPerfumeSize === 30 ? '55%' : customPerfumeSize === 50 ? '75%' : '90%',
                            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.75) 0%, rgba(217, 119, 6, 0.9) 100%)'
                          }}
                        >
                          {/* Liquid Surface Wave */}
                          <div className="absolute -top-2 inset-x-0 h-4 bg-amber-300/60 rounded-full blur-[1px] animate-liquid-wave" />
                          
                          {/* Rising Effervescent Micro-bubbles */}
                          <div className="absolute bottom-1 start-3 w-1.5 h-1.5 rounded-full bg-white/60 animate-bubble-1" />
                          <div className="absolute bottom-2 end-4 w-1 h-1 rounded-full bg-white/70 animate-bubble-2" />
                          <div className="absolute bottom-0 start-8 w-1 h-1 rounded-full bg-white/50 animate-bubble-3" />
                        </div>

                        {/* Royal Label on Glass */}
                        <div className="absolute top-4 inset-x-2 bg-black/60 backdrop-blur-xs border border-amber-400/30 rounded-lg p-1 text-center z-10">
                          <p className="text-[7px] text-amber-300 font-mono tracking-widest uppercase">NASAMAT</p>
                          <p className="text-[9px] font-bold text-white truncate">{customPerfumeName || (language === 'ar' ? 'خاص' : 'Bespoke')}</p>
                          {customPerfumeRecipient && (
                            <p className="text-[7px] text-amber-300 font-bold truncate">FOR: {customPerfumeRecipient}</p>
                          )}
                          <p className="text-[7px] text-amber-200/70 font-mono">{customPerfumeSize} ML</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase font-mono tracking-widest text-amber-400">
                        NASAMAT ATELIER • BEIRUT
                      </p>
                      <h2 className="text-xl sm:text-2xl font-black font-serif tracking-wider text-white">
                        {customPerfumeName || (language === 'ar' ? 'اسم عطرك الخاص' : 'Bespoke Perfume')}
                      </h2>
                      {customPerfumeRecipient && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold tracking-wide">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{language === 'ar' ? `باسم الزبون: ${customPerfumeRecipient}` : `Custom Blend for: ${customPerfumeRecipient}`}</span>
                        </div>
                      )}
                      <p className="text-[11px] text-neutral-400 font-mono">
                        EXTRAIT DE PARFUM • {customPerfumeSize} ML
                      </p>
                    </div>

                    {/* Selected Oils & Percentages Composition */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-start space-y-2 text-xs">
                      <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider border-b border-white/10 pb-1 flex items-center justify-between">
                        <span>{language === 'ar' ? 'توليفة النوتات والنسب المختارة:' : 'Custom Blend Composition:'}</span>
                        <span className="font-mono text-amber-400 font-bold">{blendTotalPercentage}%</span>
                      </div>
                      <div className="space-y-1.5">
                        {blendOils.length === 0 ? (
                          <div className="text-[11px] text-neutral-400 italic py-1">
                            {language === 'ar' ? 'لم يتم اختيار أي زيوت بعد' : 'No oils selected yet'}
                          </div>
                        ) : (
                          blendOils.map((bo) => {
                            const oil = oils.find((o) => o.id === bo.oilId);
                            return (
                              <div key={bo.oilId} className="flex items-center justify-between text-[11px]">
                                <span className="text-neutral-300 truncate max-w-[180px]">
                                  • {oil ? (isAr ? oil.name : (oil.nameEn || getLocalizedOilName(oil.name, 'en'))) : (isAr ? 'زيت عطري' : 'Fragrance Oil')} {oil?.code ? `[${oil.code}]` : ''}
                                </span>
                                <span className="font-mono font-black text-amber-300 bg-white/10 px-2 py-0.5 rounded text-[11px]">
                                  {bo.percentage}%
                                </span>
                              </div>
                            );
                          })
                        )}
                        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-300">
                          <span>• {language === 'ar' ? 'التركيز العطري:' : 'Concentration:'}</span>
                          <span className="font-mono text-emerald-400 font-bold">Extrait de Parfum</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="pt-2 space-y-3 border-t border-neutral-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-neutral-500 uppercase tracking-wider block">
                          {language === 'ar' ? 'السعر النهائي للعبوة' : 'Total Price'}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-bold">
                          {language === 'ar' ? 'شامل الصياغة والطباعة الفاخرة' : 'Hand-crafted & Engraved'}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="text-2xl font-black font-mono text-black">
                          ${customPerfumePrice.toFixed(2)}
                        </span>
                        <span className="block text-[11px] text-neutral-500 font-mono">
                          ~{Math.round(customPerfumePrice * (settings.lbpRate || 90000)).toLocaleString()} L.L.
                        </span>
                      </div>
                    </div>

                    {/* Button 1: Save to Customer Record (سجل الزبون) */}
                    <button
                      type="button"
                      onClick={handleSaveBlendToRecord}
                      className="w-full py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <Bookmark className="w-4 h-4 text-amber-700" />
                      <span>
                        {language === 'ar' 
                          ? `تسجيل وحفظ التركيبة باسم "${customPerfumeRecipient.trim() || 'الزبون'}" 📜` 
                          : 'Register Blend to Customer Profile'}
                      </span>
                    </button>

                    {/* Button 2: Add to Cart */}
                    <button
                      type="button"
                      onClick={() => handleAddBlendToCart()}
                      className="w-full py-3.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-white" />
                      <span>{language === 'ar' ? `أضف عطرك المخصص للسلة ($${customPerfumePrice.toFixed(2)})` : `Add Custom Blend to Cart`}</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* VIEW 2: CUSTOMER'S SAVED BLENDS RECORD (سجل خلطات الزبون الخاصة) */}
          {activeBlenderTab === 'my-blends' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-black font-serif uppercase tracking-wider text-black">
                      {language === 'ar' ? 'سجل خلطاتي العطرية المحفوظة' : 'My Saved Fragrance Blends'}
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {language === 'ar'
                      ? 'جميع التركيبات التي صممتها وسَمّيتها بنفسك محفوظة هنا في سجلك لإعادة طلبها أو تعديلها بأي وقت.'
                      : 'All bespoke formulations you crafted and named are saved here for easy reordering and modification.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveBlenderTab('composer')}
                  className="py-2.5 px-5 rounded-xl bg-black text-white font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-neutral-800 transition shadow-sm"
                >
                  <FlaskConical className="w-4 h-4 text-white" />
                  <span>{language === 'ar' ? '+ تركيب عطر جديد' : '+ Compound New'}</span>
                </button>
              </div>

              {/* Saved Blends Grid */}
              {customerBlends.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 mx-auto flex items-center justify-center text-3xl">
                    📜
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-black">
                      {language === 'ar' ? 'لم تقم بحفظ أي خلطة خاصة بعد' : 'No Saved Custom Blends Yet'}
                    </h3>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto">
                      {language === 'ar'
                        ? 'يمكنك تركيب عطرك الملكي المفضل من زيوت المشروع بالاسم وتسميته بنفسك، ثم الضغط على "حفظ في سجل خلطاتي الخاصة" ليظهر هنا دائماً.'
                        : 'Create your unique blend from saved oils, name it, and save it to your customer record.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveBlenderTab('composer')}
                    className="py-2.5 px-6 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-800 transition"
                  >
                    {language === 'ar' ? 'ابدأ تركيب أول خلطة لك الآن 🧪' : 'Start Your First Blend Now'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {customerBlends.map((blend) => (
                    <div
                      key={blend.id}
                      className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-xs hover:border-black transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                              {blend.sizeMl} ML • EXTRAIT DE PARFUM
                            </span>
                            <h3 className="font-serif font-black text-lg text-black mt-1">
                              {blend.name}
                            </h3>
                            {blend.customerName && (
                              <p className="text-[11px] text-neutral-500 font-medium">
                                {blend.customerName}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSavedBlend(blend.id)}
                            className="text-neutral-400 hover:text-rose-600 transition p-1 cursor-pointer"
                            title={language === 'ar' ? 'حذف من السجل' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Ingredients Breakdown */}
                        <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1.5 text-xs">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                            {language === 'ar' ? 'الزيوت المكونة للخلطة:' : 'Formula Oils:'}
                          </span>
                          <div className="space-y-1">
                            {blend.ingredients.map((ing) => {
                              return (
                                <div key={ing.oilId} className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-neutral-800 truncate">
                                    • {ing.oilName} {ing.oilCode ? `[${ing.oilCode}]` : ''}
                                  </span>
                                  <div className="flex items-center gap-1.5 font-mono shrink-0">
                                    <span className="font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-[11px]">
                                      {ing.percentage}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {new Date(blend.createdAt).toLocaleDateString()}
                          </span>
                          <span className="font-mono font-black text-base text-black">
                            ${blend.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-neutral-100 space-y-2">
                        <button
                          type="button"
                          onClick={() => handleAddBlendToCart(blend)}
                          className="w-full py-2.5 px-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-white" />
                          <span>{language === 'ar' ? 'إضافة للسلة' : 'Add to Cart'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleLoadSavedBlend(blend)}
                          className="w-full py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-neutral-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تعديل الخلطة بالمعمل' : 'Edit Mix in Atelier'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ================= PAGE: BUNDLES & SAVE (باقات التوفير الحصرية والشحن المجاني) ================= */}
      {customerPage === 'bundles' && (
        <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
          {renderInternalPageBackHeader(
            'باقات التوفير والشحن المجاني', 
            'Exclusive Value Sets & Bundles',
            language === 'ar' ? 'وفر أكثر مع خيارات الباقات المتكاملة والهدايا' : 'Save more with luxury bundle sets'
          )}
          {/* Hero Header */}
          <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl text-center space-y-3 relative overflow-hidden border border-neutral-800">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-bold tracking-widest uppercase">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>EXCLUSIVE BUNDLES • SAVE MORE & FREE DELIVERY</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-serif uppercase tracking-wider">
              {language === 'ar' ? 'باقات التوفير الحصرية' : 'Build Your Bundle & Save'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              {language === 'ar'
                ? 'وفّر أكثر مع باقات نسمات الفاخرة. اختر عطورك المفضلة بتركيز إكستري دو بارفان مع شحن مجاني لكافة المناطق اللبنانية وهدايا مجانية مميزة.'
                : 'Save more with our curated luxury bundles. Pick your favorite Extrait fragrances with free delivery across Lebanon and complimentary gifts.'}
            </p>
          </div>

          {/* Dynamic Savings Bundles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSavingsBundles.filter((b) => b.isActive).map((bundle) => {
              const savings = Math.max(0, bundle.originalPrice - bundle.price);
              const discountPct = bundle.originalPrice > 0 ? Math.round((savings / bundle.originalPrice) * 100) : 0;
              const isManagerCurated = bundle.selectionMode === 'custom';

              // Resolve curated fragrances if manager selected them
              const curatedPerfumes = isManagerCurated && bundle.selectedItemIds && bundle.selectedItemIds.length > 0
                ? bundle.selectedItemIds.map((id) => {
                    const rec = recipes.find((r) => r.id === id);
                    if (rec) return { id: rec.id, name: isAr ? rec.name : (rec.nameEn || getLocalizedOilName(rec.name, 'en')), brand: isAr ? ((rec as any).brand || 'نسمات') : getLocalizedBrand((rec as any).brand || 'Nasamat', 'en') };
                    const oil = oils.find((o) => o.id === id);
                    if (oil) return { id: oil.id, name: isAr ? oil.name : (oil.nameEn || getLocalizedOilName(oil.name, 'en')), brand: isAr ? ((oil as any).brand || 'نسمات') : getLocalizedBrand((oil as any).brand || 'Nasamat', 'en') };
                    return null;
                  }).filter(Boolean)
                : [];

              return (
                <div
                  key={bundle.id}
                  className={`bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 relative ${
                    bundle.isFeatured
                      ? 'border-2 border-black transform sm:-translate-y-1'
                      : 'border border-neutral-200 hover:border-black'
                  }`}
                >
                  {bundle.isFeatured && (
                    <div className="absolute -top-3.5 start-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md whitespace-nowrap inline-flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{isAr ? (bundle.badge || 'الأكثر طلباً وتوفيراً') : (bundle.badge && !/[\u0600-\u06FF]/.test(bundle.badge) ? bundle.badge : 'Bestseller')} {bundle.freeDelivery ? (language === 'ar' ? '• شحن مجاني' : '• Free Ship') : ''}</span>
                    </div>
                  )}

                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        {isAr
                          ? (bundle.badge || (isManagerCurated ? 'باقة مختارة من الدار' : 'باقة التوفير'))
                          : (bundle.badge && !/[\u0600-\u06FF]/.test(bundle.badge) ? bundle.badge : (isManagerCurated ? 'Curated Set' : 'Value Bundle'))}
                      </span>
                      {savings > 0 && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                          {language === 'ar' ? `وفّر $${savings.toFixed(2)} (${discountPct}%)` : `Save $${savings.toFixed(2)} (${discountPct}%)`}
                        </span>
                      )}
                    </div>

                    <div className="w-full h-44 bg-neutral-100 rounded-2xl overflow-hidden relative">
                      <img
                        src={bundle.imageUrl || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80'}
                        alt={isAr ? bundle.name : (bundle.nameEn || 'Luxury Bundle')}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                      <div className="absolute top-2 start-2 bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        {bundle.bottlesCount} {language === 'ar' ? 'عبوات' : 'Bottles'} {bundle.bottleSizeMl}ML
                      </div>
                      {bundle.freeDelivery && (
                        <div className="absolute bottom-2 end-2 bg-emerald-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Truck className="w-3 h-3 text-white" />
                          <span>{language === 'ar' ? 'شحن مجاني' : 'Free Ship'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-black font-serif">
                        {isAr ? bundle.name : (bundle.nameEn || (bundle.id === 'bundle-duo' ? 'Niche Duo Bundle' : bundle.id === 'bundle-trio' ? 'Elite Trio Bundle' : bundle.id === 'bundle-quad' ? 'Royal Quad Bundle' : 'Luxury Bundle'))}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        {isAr ? (bundle.subtitle || bundle.description) : (bundle.descriptionEn || (bundle.id === 'bundle-duo' ? '2 x 50ml flacons of your choice' : bundle.id === 'bundle-trio' ? '3 x 50ml flacons + Free Delivery' : bundle.id === 'bundle-quad' ? '4 x 50ml flacons + Free Delivery' : 'Curated luxury fragrance set'))}
                      </p>
                    </div>

                    {/* Features list */}
                    {(() => {
                      const featList = isAr
                        ? (bundle.featuresAr || bundle.features || [])
                        : (bundle.featuresEn || (bundle.id === 'bundle-duo'
                            ? ['2 x 50ml flacons of your choice', 'Long-lasting Extrait de Parfum concentration', 'Luxury gift packaging']
                            : bundle.id === 'bundle-trio'
                            ? ['3 x 50ml flacons of any fragrance', 'Immediate free delivery across Lebanon 🚚', 'Luxury box & gift wrapping']
                            : bundle.id === 'bundle-quad'
                            ? ['4 x 50ml flacons from premium collection', 'Free delivery to all Lebanese governorates', 'Luxury gift box + complimentary samples']
                            : ['Bespoke luxury flacons', 'Extrait de Parfum concentration', 'Complimentary gift packaging']));
                      return featList.length > 0 ? (
                        <ul className="text-xs text-neutral-600 space-y-2 border-t border-neutral-100 pt-3">
                          {featList.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-center gap-2">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null;
                    })()}

                    {/* Curated perfumes chip list if manager selected */}
                    {isManagerCurated && curatedPerfumes.length > 0 && (
                      <div className="bg-amber-50/50 border border-amber-200/70 p-3 rounded-2xl space-y-1.5">
                        <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>{language === 'ar' ? 'العطور المحددة في هذه الباقة:' : 'Curated Fragrances in this Set:'}</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {curatedPerfumes.map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 rounded-lg bg-white border border-amber-300 text-black text-[11px] font-bold shadow-2xs"
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing & Add to Cart Actions */}
                  <div className="space-y-3 pt-4 border-t border-neutral-100">
                    <div className="flex items-baseline justify-between">
                      {bundle.originalPrice > bundle.price && (
                        <span className="text-xs text-neutral-400 line-through font-mono">
                          ${bundle.originalPrice.toFixed(2)}
                        </span>
                      )}
                      <div className="text-end ms-auto">
                        <span className="text-2xl font-black font-mono text-black">
                          ${bundle.price.toFixed(2)}
                        </span>
                        <span className="block text-[10px] text-neutral-500 font-mono">
                          ~{Math.round(bundle.price * (lbpRate || 90000)).toLocaleString()} L.L.
                        </span>
                      </div>
                    </div>

                    {isManagerCurated ? (
                      /* Curated by Manager -> 1-Click direct add with manager's selected fragrances */
                      <button
                        type="button"
                        onClick={() => {
                          const namesStr = curatedPerfumes.length > 0
                            ? curatedPerfumes.map((p) => p.name).join(' + ')
                            : (isAr ? `${bundle.bottlesCount} عطور مختارة` : `${bundle.bottlesCount} curated fragrances`);

                          onAddToCart({
                            itemType: 'recipe',
                            referenceId: `bundle-${bundle.id}-${Date.now()}`,
                            name: `${bundle.name} (${namesStr})`,
                            nameEn: bundle.name,
                            brand: isAr ? 'باقات نسمات التوفيرية' : 'NASAMAT Value Sets',
                            imageUrl: bundle.imageUrl,
                            sizeMl: bundle.bottleSizeMl,
                            unitPrice: bundle.price,
                            quantity: 1,
                            oilQuantityPerBottleMl: (bundle.bottleSizeMl * 0.30) * bundle.bottlesCount,
                            hasFreeDelivery: !!bundle.freeDelivery,
                          } as any);

                          showToast(
                            language === 'ar'
                              ? `تمت إضافة ${bundle.name} إلى سلتك بنجاح!`
                              : `${bundle.name} added to cart!`
                          );
                        }}
                        className="w-full py-3.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4 text-white" />
                        <span>{language === 'ar' ? `أضف الباقة للسلة ($${bundle.price})` : `Add Bundle to Cart ($${bundle.price})`}</span>
                      </button>
                    ) : (
                      /* Customer Choice -> Let customer pick their N perfumes OR add with 1-click popular */
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBundleForPicker(bundle);
                            setBundlePickedPerfumeIds([]);
                            setBundlePickerSearch('');
                          }}
                          className="w-full py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                        >
                          <span>🎨</span>
                          <span>{language === 'ar' ? `اختر عطور الباقة بنفسك (${bundle.bottlesCount} عطور)` : `Select Your ${bundle.bottlesCount} Fragrances`}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            // 1-Click quick add with top available fragrances
                            const defaultPicks = [...recipes, ...oils].slice(0, bundle.bottlesCount).map((p) => isAr ? p.name : ((p as any).nameEn || getLocalizedOilName(p.name, 'en'))).join(' + ');
                            onAddToCart({
                              itemType: 'recipe',
                              referenceId: `bundle-${bundle.id}-${Date.now()}`,
                              name: `${bundle.name} (${defaultPicks})`,
                              nameEn: bundle.name,
                              brand: isAr ? 'باقات نسمات التوفيرية' : 'NASAMAT Value Sets',
                              imageUrl: bundle.imageUrl,
                              sizeMl: bundle.bottleSizeMl,
                              unitPrice: bundle.price,
                              quantity: 1,
                              oilQuantityPerBottleMl: (bundle.bottleSizeMl * 0.30) * bundle.bottlesCount,
                              hasFreeDelivery: !!bundle.freeDelivery,
                            } as any);

                            showToast(
                              language === 'ar'
                                ? `تمت إضافة ${bundle.name} بأفضل المبيعات!`
                                : `${bundle.name} added to cart!`
                            );
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-[11px] transition cursor-pointer text-center"
                        >
                          {language === 'ar' ? `أضف مباشرة بأفضل المبيعات ($${bundle.price})` : `Add with Bestsellers ($${bundle.price})`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customer Fragrance Selector Modal for Custom Bundles */}
          {selectedBundleForPicker && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
              onClick={() => setSelectedBundleForPicker(null)}
            >
              <div
                className="bg-white text-black w-full max-w-2xl rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        {isAr ? `تخصيص عطور ${selectedBundleForPicker.name}` : `Customize ${selectedBundleForPicker.nameEn || selectedBundleForPicker.name}`}
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        {language === 'ar'
                          ? `اختر ${selectedBundleForPicker.bottlesCount} عطور فاخرة بسعة ${selectedBundleForPicker.bottleSizeMl}ml بسعر $${selectedBundleForPicker.price}`
                          : `Pick ${selectedBundleForPicker.bottlesCount} fragrances of ${selectedBundleForPicker.bottleSizeMl}ml for $${selectedBundleForPicker.price}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBundleForPicker(null)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress Counter & Search */}
                <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-700">
                      {language === 'ar' ? 'العطور المختارة:' : 'Selected:'}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-black ${
                        bundlePickedPerfumeIds.length === selectedBundleForPicker.bottlesCount
                          ? 'bg-emerald-600 text-white'
                          : 'bg-black text-white'
                      }`}
                    >
                      {bundlePickedPerfumeIds.length} / {selectedBundleForPicker.bottlesCount}
                    </span>
                    {bundlePickedPerfumeIds.length === selectedBundleForPicker.bottlesCount && (
                      <span className="text-xs text-emerald-600 font-bold">
                        {language === 'ar' ? '✓ اكتمل الاختيار!' : '✓ Complete!'}
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    value={bundlePickerSearch}
                    onChange={(e) => setBundlePickerSearch(e.target.value)}
                    placeholder=""
                    className="w-full sm:w-64 p-2 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-none focus:border-black"
                  />
                </div>

                {/* Fragrance Options List */}
                <div className="p-4 overflow-y-auto space-y-2 flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[...recipes, ...oils]
                      .filter((item) => {
                        if (!bundlePickerSearch.trim()) return true;
                        const q = bundlePickerSearch.toLowerCase();
                        return item.name.toLowerCase().includes(q) || Boolean((item as any).brand && (item as any).brand.toLowerCase().includes(q));
                      })
                      .map((perfume) => {
                        const isPicked = bundlePickedPerfumeIds.includes(perfume.id);
                        const canPickMore = bundlePickedPerfumeIds.length < selectedBundleForPicker.bottlesCount;

                        return (
                          <div
                            key={perfume.id}
                            onClick={() => {
                              if (isPicked) {
                                setBundlePickedPerfumeIds(bundlePickedPerfumeIds.filter((id) => id !== perfume.id));
                              } else if (canPickMore) {
                                setBundlePickedPerfumeIds([...bundlePickedPerfumeIds, perfume.id]);
                              }
                            }}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition cursor-pointer ${
                              isPicked
                                ? 'bg-black text-white border-black shadow-sm'
                                : canPickMore
                                ? 'bg-white hover:bg-neutral-50 text-black border-neutral-200'
                                : 'bg-neutral-50 opacity-60 text-neutral-400 border-neutral-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={perfume.imageUrl || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=200&q=80'}
                                alt={isAr ? perfume.name : ((perfume as any).nameEn || getLocalizedOilName(perfume.name, 'en'))}
                                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-neutral-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=200&q=80';
                                }}
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-xs block truncate">
                                  {isAr ? perfume.name : ((perfume as any).nameEn || getLocalizedOilName(perfume.name, 'en'))}
                                </span>
                                <span className={`text-[10px] block truncate ${isPicked ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                  {isAr ? ((perfume as any).brand || 'نسمات') : getLocalizedBrand((perfume as any).brand || 'Nasamat', 'en')}
                                </span>
                              </div>
                            </div>

                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border text-xs font-bold ${
                                isPicked
                                  ? 'bg-amber-400 text-black border-amber-400'
                                  : 'border-neutral-300 text-neutral-400'
                              }`}
                            >
                              {isPicked ? '✓' : '+'}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
                  <div className="text-xs">
                    <span className="text-neutral-500 block">
                      {language === 'ar' ? 'سعر الباقة الإجمالي:' : 'Total Bundle Price:'}
                    </span>
                    <span className="font-black text-base font-mono text-black">
                      ${selectedBundleForPicker.price.toFixed(2)}
                      {selectedBundleForPicker.freeDelivery && (
                        <span className="text-emerald-700 text-xs ms-2 font-sans font-bold inline-flex items-center gap-1">
                          <Truck className="w-3 h-3 text-emerald-700" />
                          <span>{language === 'ar' ? 'شحن مجاني' : 'Free Delivery'}</span>
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBundleForPicker(null)}
                      className="px-4 py-2.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-black text-xs font-bold transition cursor-pointer"
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>

                    <button
                      type="button"
                      disabled={bundlePickedPerfumeIds.length !== selectedBundleForPicker.bottlesCount}
                      onClick={() => {
                        const chosenNames = bundlePickedPerfumeIds
                          .map((id) => {
                            const found = [...recipes, ...oils].find((p) => p.id === id);
                            return found ? (isAr ? found.name : ((found as any).nameEn || getLocalizedOilName(found.name, 'en'))) : '';
                          })
                          .filter(Boolean);

                        onAddToCart({
                          itemType: 'recipe',
                          referenceId: `bundle-${selectedBundleForPicker.id}-${Date.now()}`,
                          name: `${selectedBundleForPicker.name} (${chosenNames.join(' + ')})`,
                          nameEn: selectedBundleForPicker.name,
                          brand: isAr ? 'باقات نسمات التوفيرية' : 'NASAMAT Value Sets',
                          imageUrl: selectedBundleForPicker.imageUrl,
                          sizeMl: selectedBundleForPicker.bottleSizeMl,
                          unitPrice: selectedBundleForPicker.price,
                          quantity: 1,
                          oilQuantityPerBottleMl: (selectedBundleForPicker.bottleSizeMl * 0.30) * selectedBundleForPicker.bottlesCount,
                          hasFreeDelivery: !!selectedBundleForPicker.freeDelivery,
                        } as any);

                        showToast(
                          language === 'ar'
                            ? `تمت إضافة ${selectedBundleForPicker.name} إلى سلتك!`
                            : `${selectedBundleForPicker.name} added to cart!`
                        );
                        setSelectedBundleForPicker(null);
                      }}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md ${
                        bundlePickedPerfumeIds.length === selectedBundleForPicker.bottlesCount
                          ? 'bg-black hover:bg-neutral-800 text-white cursor-pointer'
                          : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {language === 'ar'
                          ? `تأكيد وإضافة للسلة ($${selectedBundleForPicker.price})`
                          : `Confirm & Add to Cart ($${selectedBundleForPicker.price})`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= PAGE 4: ATELIER & CRAFTSMANSHIP (قصة الدار والمختبر) ================= */}
      {customerPage === 'atelier' && (
        <div className="space-y-10 animate-fadeIn max-w-4xl mx-auto">
          {renderInternalPageBackHeader(
            'قصة نسمات والمختبر الحرفي', 
            'The Nasamat Atelier Story',
            language === 'ar' ? 'فلسفة الصياغة الفاخرة وسر تركيز إكستري دو بارفان' : 'Haute Parfumerie Craft & Maceration'
          )}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50/90 border border-amber-300 text-amber-950 text-xs font-black tracking-wider uppercase shadow-xs">
              <span className="text-amber-600">✦</span>
              <span>BEIRUT ATELIER • HAUTE PARFUMERIE CRAFT</span>
              <span className="text-amber-600">✦</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-black font-serif uppercase tracking-wider">
              {language === 'ar' ? 'قصة نسمات وحرفية العطور' : 'The Nasamat Atelier Story'}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-2xl mx-auto">
              {language === 'ar'
                ? 'ولدت نسمات في بيروت لتعيد تعريف العطور الفاخرة بدمج أعرق المدارس الفرنسية والسويسرية في تركيب الزيوت النقية مع الشغف اللبناني بالأناقة.'
                : 'Born in Beirut to redefine high-end perfumery, blending Grasse and Swiss master formulations with Beirut’s enduring elegance.'}
            </p>
          </div>

          {/* 4 Pillars of Formulation */}
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
              <div className="w-14 h-14 rounded-2xl bg-neutral-50 border-2 border-neutral-300 text-neutral-900 flex items-center justify-center text-2xl shrink-0 font-serif font-black shadow-xs">
                1
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-black uppercase tracking-wide">
                  {language === 'ar' ? 'استيراد الزيوت النقية من غراس وسويسرا' : 'Direct Crude Oil Sourcing (Grasse & Switzerland)'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {language === 'ar'
                    ? 'نتعامل حصرياً مع معمل لوزي (Luzi) السويسري ومختبرات غراس في فرنسا. نستخدم زيوتاً عطرية خام نقية 100% غير ممددة بأي زيوت ناقلة رخيصة، مما يضمن نقاء الرائحة وسلامتها التامة على الجلد وفق معايير IFRA الدولية.'
                    : 'We source exclusively from Luzi (Switzerland) and Robertet/Givaudan (Grasse, France) ensuring 100% pure undiluted crude extracts.'}
                </p>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
              <div className="w-14 h-14 rounded-2xl bg-neutral-50 border-2 border-neutral-300 text-neutral-900 flex items-center justify-center text-2xl shrink-0 font-serif font-black shadow-xs">
                2
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-black uppercase tracking-wide">
                  {language === 'ar' ? 'تركيز إكستري دو بارفان الملكي (Extrait de Parfum)' : 'The Pure Extrait Standard'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {language === 'ar'
                    ? 'في حين تكتفي العطور التجارية العادية بتركيزات مخففة لتوفير التكلفة، نلتزم في نسمات بأعلى درجات الزيت العطري الصافي بتركيز إكستري في كل زجاجة. هذا الالتزام هو الحد الفاصل بين العطر العادي والعطر الملكي الفاخر الذي يدوم فوحانه طوال اليوم.'
                    : 'While commercial fragrances settle for diluted formulas, we infuse pure high-grade essence in every flacon, ensuring unprecedented longevity.'}
                </p>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
              <div className="w-14 h-14 rounded-2xl bg-neutral-50 border-2 border-neutral-300 text-neutral-900 flex items-center justify-center text-2xl shrink-0 font-serif font-black shadow-xs">
                3
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-black uppercase tracking-wide">
                  {language === 'ar' ? 'كحول حبوب فرنسي معالج ومثبت نباتي ناعم' : 'Pure Cosmetic Grain Alcohol & Botanical IPM'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {language === 'ar'
                    ? 'نستخدم كحول تجميلي فرنسي نقي 96% منزوع الرائحة بالكامل، مدمج مع مادة الآيزوبروبيل ميريستات (IPM) النباتية التي تمنع التبخر السريع للنوتات الافتتاحية وتعطي ملمساً مخملياً ناعماً على البشرة بدون أي جفاف أو تحسس.'
                    : 'French cosmetic-grade 96% grain alcohol treated to be entirely neutral, combined with gentle plant-based fixatives.'}
                </p>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
              <div className="w-14 h-14 rounded-2xl bg-neutral-50 border-2 border-neutral-300 text-neutral-900 flex items-center justify-center text-2xl shrink-0 font-serif font-black shadow-xs">
                4
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-black uppercase tracking-wide">
                  {language === 'ar' ? 'التعتيق البارد والسكب اليدوي في بيروت' : 'Cold Maceration & Hand Bottling'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {language === 'ar'
                    ? 'تخضع تركيباتنا لفترة تعتيق في درجات حرارة محكومة لتنسجم جزيئات الزيت مع الكحول وتتفتح النوتات العطرية بشكل كامل، قبل سكبها يدوياً في زجاجات كريستالية سميكة القاع مزودة ببخاخات إيطالية ميكرو تمنع أي تسريب.'
                    : 'Batches undergo cold maceration in dark temperature-controlled conditions before being hand-bottled with leak-proof Italian atomizers.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quality Seal */}
          <div className="bg-[#fafafa] border border-neutral-300 rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center text-xl font-bold shadow-xs">
              ✓
            </div>
            <h3 className="text-base font-bold text-black uppercase tracking-wider">
              {language === 'ar' ? 'ضمان نسمات للجودة الملكية' : 'The Nasamat Guarantee'}
            </h3>
            <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
              {language === 'ar'
                ? 'نضمن لكم رضاكم التام عن كل زجاجة عطر تطلبونها، مع إمكانية المعاينة وفحص الطلبية عند الاستلام مباشرة.'
                : 'Complete satisfaction guarantee with order inspection upon delivery.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigateToCustomerPage('catalog', 'all')}
                className="px-6 py-3 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition cursor-pointer"
              >
                {language === 'ar' ? 'ابدأ التسوق وتصفح العطور ←' : 'Explore Collections →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PAGE 5: LEBANON DELIVERY & FAQ (التوصيل والدفع في لبنان والأسئلة الشائعة) ================= */}
      {customerPage === 'delivery' && (
        <div className="space-y-10 animate-fadeIn max-w-4xl mx-auto">
          {renderInternalPageBackHeader(
            'خدمات التوصيل والدفع والضمان', 
            'Lebanon Delivery & FAQ',
            language === 'ar' ? 'توصيل سريع لكافة الأراضي اللبنانية خلال 24 - 48 ساعة' : 'Fast Delivery across Lebanon'
          )}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs font-black tracking-wider uppercase shadow-2xs">
              <Truck className="w-3.5 h-3.5 text-neutral-800" />
              <span>LEBANON SHIPPING & FAQ</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-black font-serif uppercase tracking-wider">
              {language === 'ar' ? 'خدمات التوصيل والدفع في لبنان' : 'Lebanon Delivery & FAQ'}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-2xl mx-auto">
              {language === 'ar'
                ? 'نوفر خدمة التوصيل السريع لكافة المناطق والمحافظات اللبنانية مع خيارات دفع مرنة ومريحة.'
                : 'Fast delivery across all Lebanese governorates with versatile Cash on Delivery and digital payment options.'}
            </p>
          </div>

          {/* Delivery Zones Table */}
          <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-5 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                <Truck className="w-5 h-5 text-white" />
                <span>{language === 'ar' ? 'جدول مناطق وأوقات التوصيل' : 'Delivery Zones & Schedules'}</span>
              </div>
              <span className="text-xs bg-white/20 text-white font-mono px-2.5 py-1 rounded-full font-bold">
                ${settings.defaultDeliveryFee ?? 3} FLAT RATE
              </span>
            </div>

            <div className="divide-y divide-neutral-200">
              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-black">
                    {language === 'ar' ? 'بيروت الكبرى وضواحيها (Beirut & Suburbs)' : 'Greater Beirut'}
                  </h4>
                  <p className="text-xs text-neutral-500">
                    {language === 'ar' ? 'الأشرفية، الحمراء، الروشة، بعبدا، سن الفيل، فرن الشباك...' : 'Achrafieh, Hamra, Baabda, Sin El Fil...'}
                  </p>
                </div>
                <div className="text-start sm:text-end">
                  <span className="text-xs font-bold text-emerald-600 block">
                    {language === 'ar' ? 'خلال 24 ساعة فقط' : 'Within 24 Hours'}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    ${settings.defaultDeliveryFee ?? 3} {settings.isFreeDeliveryEnabled !== false ? (language === 'ar' ? `(مجاني فوق $${settings.freeDeliveryThreshold ?? 35})` : `(Free over $${settings.freeDeliveryThreshold ?? 35})`) : ''}
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-black">
                    {language === 'ar' ? 'جبل لبنان، المتن، كسروان، الشوف (Mount Lebanon)' : 'Mount Lebanon & Keserwan'}
                  </h4>
                  <p className="text-xs text-neutral-500">
                    {language === 'ar' ? 'جونيه، جبيل، برمانا، أنطلياس، بيكفيا، عالية، الدامور...' : 'Jounieh, Jbeil, Broummana, Antelias, Aley...'}
                  </p>
                </div>
                <div className="text-start sm:text-end">
                  <span className="text-xs font-bold text-neutral-800 block">
                    {language === 'ar' ? '24 إلى 48 ساعة' : '24 to 48 Hours'}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    ${settings.defaultDeliveryFee ?? 3} {settings.isFreeDeliveryEnabled !== false ? (language === 'ar' ? `(مجاني فوق $${settings.freeDeliveryThreshold ?? 35})` : `(Free over $${settings.freeDeliveryThreshold ?? 35})`) : ''}
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-black">
                    {language === 'ar' ? 'الشمال، الجنوب، والبقاع (North, South, Bekaa)' : 'North, South & Bekaa'}
                  </h4>
                  <p className="text-xs text-neutral-500">
                    {language === 'ar' ? 'طرابلس، الكورة، زغرتا، صيدا، صور، النبطية، زحلة، شتورا...' : 'Tripoli, Saida, Tyre, Nabatieh, Zahle...'}
                  </p>
                </div>
                <div className="text-start sm:text-end">
                  <span className="text-xs font-bold text-neutral-800 block">
                    {language === 'ar' ? '48 إلى 72 ساعة' : '48 to 72 Hours'}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    ${settings.defaultDeliveryFee ?? 3} {settings.isFreeDeliveryEnabled !== false ? (language === 'ar' ? `(مجاني فوق $${settings.freeDeliveryThreshold ?? 35})` : `(Free over $${settings.freeDeliveryThreshold ?? 35})`) : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
                <DollarSign className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="font-bold text-sm text-black">
                {language === 'ar' ? 'كاش بالدولار (USD)' : 'Cash in USD'}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {language === 'ar'
                  ? 'الدفع نقداً عند استلام الطلبية من مندوب التوصيل بالدولار الأمريكي.'
                  : 'Pay cash directly upon receiving your package from the courier.'}
              </p>
            </div>

            <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-800 font-mono font-black text-xs">
                LBP
              </div>
              <h3 className="font-bold text-sm text-black">
                {language === 'ar' ? 'كاش بالليرة اللبنانية (LBP)' : 'Cash in LBP'}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {language === 'ar'
                  ? 'الدفع بالليرة اللبنانية بسعر الصرف المعتمد بالسوق (90,000 ل.ل لكل دولار) بدون أي فارق.'
                  : 'Pay in Lebanese Pounds at official market exchange rate (90,000 LBP per USD).'}
              </p>
            </div>

            <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-700">
                <Phone className="w-5 h-5 text-sky-700" />
              </div>
              <h3 className="font-bold text-sm text-black">
                {language === 'ar' ? 'Whish Money / OMT' : 'Whish / OMT Transfer'}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {language === 'ar'
                  ? 'تحويل فوري عبر تطبيق Whish Money الإلكتروني أو عبر مكاتب OMT.'
                  : 'Instant digital transfer via Whish Money mobile wallet or OMT.'}
              </p>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-black font-serif uppercase tracking-wide text-center">
              {language === 'ar' ? 'الأسئلة الأكثر شيوعاً' : 'Frequently Asked Questions'}
            </h2>

            <div className="space-y-3">
              <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs space-y-1.5">
                <h4 className="font-bold text-sm text-black">
                  {language === 'ar' ? '• كم تدوم رائحة عطور نسمات على الجلد والملابس؟' : '• How long does the scent last?'}
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {language === 'ar'
                    ? 'بفضل تركيز إكستري دو بارفان الفاخر واستخدام كحول فرنسي ومثبت نباتي نقي، تدوم العطور على الجلد أكثر من 18 إلى 24 ساعة، وعلى الملابس تتجاوز 48 ساعة حتى بعد الغسيل.'
                    : 'Thanks to pure extrait concentration, longevity exceeds 18-24 hours on skin and 48 hours on fabrics.'}
                </p>
              </div>

              <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs space-y-1.5">
                <h4 className="font-bold text-sm text-black">
                  {language === 'ar' ? '• هل الزيوت مطابقة للأصلية؟' : '• Are the fragrance oils identical to the original?'}
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {language === 'ar'
                    ? 'نعم، مستخلصاتنا الزيتية مستوردة من معامل Luzi السويسرية ومختبرات Grasse الفرنسية التي تقوم بالتحليل الكروماتوغرافي الدقيق لضمان تطابق النوتات الافتتاحية والقلب والقاعدة بنسبة 98% فأكثر.'
                    : 'Yes, our oils match the master olfactory profiles by over 98% using chromatographic analysis from Grasse and Luzi.'}
                </p>
              </div>

              <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs space-y-1.5">
                <h4 className="font-bold text-sm text-black">
                  {language === 'ar' ? '• ما هو تركيز الزيوت العطرية في عطوركم؟' : '• What is the fragrance concentration?'}
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {language === 'ar'
                    ? 'كافة عطورنا تصاغ بتركيز Extrait de Parfum فاخر من أنقى الزيوت العطرية السويسرية والفرنسية لضمان ثبات وفوحان فائق يدوم طويلاً.'
                    : 'All our fragrances are crafted at Extrait de Parfum concentration with pure Swiss and French oils for exceptional longevity and sillage.'}
                </p>
              </div>

              <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs space-y-1.5">
                <h4 className="font-bold text-sm text-black">
                  {language === 'ar' ? '• كيف يمكنني طلب خلطة مخصصة أو تعديل النوتات؟' : '• Can I customize a blend?'}
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {language === 'ar'
                    ? 'بإمكانكم التواصل معنا مباشرة عبر زر الواتساب في أسفل الصفحة، وسيقوم خبير العطور لدينا بمساعدتكم في تركيب وصفتكم الخاصة بالنسب التي تفضلونها.'
                    : 'Contact our WhatsApp concierge directly to tailor a bespoke recipe with our master perfumer.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Luxury Boutique Editorial Footer */}
      <footer className="mt-16 pt-12 border-t border-neutral-200 space-y-8 text-black">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                navigateToCustomerPage('home');
              }}
              className="w-14 h-14 rounded-full overflow-hidden border-2 border-black/85 bg-white p-0.5 shadow-sm hover:scale-105 transition-transform cursor-pointer"
              title={language === 'ar' ? 'نَسَمَات — العودة للرئيسية' : 'Nasamat — Return to Home'}
            >
              <img 
                src={language === 'ar' ? '/logo.png' : '/logo-en.webp'} 
                alt={language === 'ar' ? 'شعار نسمات' : 'Nasamat Luxury Bespoke Perfumery'} 
                className="w-full h-full object-contain" 
              />
            </button>
            <div>
              <div className="text-xl font-black font-serif tracking-wider text-black uppercase">
                {language === 'ar' ? 'نَسَمَات' : 'NASAMAT'}
              </div>
              <div className="text-xs font-semibold text-neutral-600 uppercase">
                {language === 'ar' ? 'لتركيب العطور الفاخرة • بيروت، لبنان' : 'LUXURY BESPOKE PERFUMERY • BEIRUT, LEBANON'}
              </div>
            </div>
          </div>

          {/* Quick Page Links */}
          <nav className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
            <button
              onClick={() => navigateToCustomerPage('home')}
              className="px-3 py-1.5 rounded-lg text-neutral-700 hover:text-black hover:bg-neutral-100 transition cursor-pointer"
            >
              {language === 'ar' ? 'الرئيسية' : 'Home'}
            </button>
            <button
              onClick={() => navigateToCustomerPage('catalog', 'all')}
              className="px-3 py-1.5 rounded-lg text-neutral-700 hover:text-black hover:bg-neutral-100 transition cursor-pointer"
            >
              {language === 'ar' ? 'العطور' : 'Perfumes'}
            </button>
            <button
              onClick={() => navigateToCustomerPage('signatures')}
              className="px-3 py-1.5 rounded-lg text-neutral-700 hover:text-black hover:bg-neutral-100 transition cursor-pointer"
            >
              {language === 'ar' ? 'خلطات نسمات' : 'Signatures'}
            </button>
            <button
              onClick={() => navigateToCustomerPage('atelier')}
              className="px-3 py-1.5 rounded-lg text-neutral-700 hover:text-black hover:bg-neutral-100 transition cursor-pointer"
            >
              {language === 'ar' ? 'قصة الدار والمختبر' : 'Atelier'}
            </button>
            <button
              onClick={() => navigateToCustomerPage('delivery')}
              className="px-3 py-1.5 rounded-lg text-neutral-700 hover:text-black hover:bg-neutral-100 transition cursor-pointer"
            >
              {language === 'ar' ? 'التوصيل والدفع' : 'Delivery'}
            </button>
          </nav>

          {/* Concierge Contact & Social Channels */}
          <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-end">
            <div className="text-neutral-500 font-sans text-[11px] font-medium">
              {language === 'ar' ? 'خدمة الزبائن وحسابات التواصل' : 'Customer Care & Social Media'}
            </div>
            
            <div className="flex items-center justify-center md:justify-end gap-3.5 pt-1">
              {/* WhatsApp Official Badge */}
              <a 
                href={`https://wa.me/${formatWhatsAppPhone(settings.storePhone)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-115 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer shrink-0"
                title="WhatsApp"
                aria-label="WhatsApp"
              >
                <WhatsAppOfficialBadge className="w-12 h-12" />
              </a>

              {/* Instagram Official Badge */}
              <a
                href={formatSocialUrl(settings.instagramUrl, 'instagram')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center hover:scale-115 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer shrink-0"
                title="Instagram"
                aria-label="Instagram"
              >
                <InstagramOfficialBadge className="w-12 h-12" />
              </a>

              {/* Facebook Official Badge */}
              <a
                href={formatSocialUrl(settings.facebookUrl, 'facebook')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-115 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer shrink-0"
                title="Facebook"
                aria-label="Facebook"
              >
                <FacebookOfficialBadge className="w-12 h-12" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-100 flex flex-col items-center justify-center text-center text-xs text-neutral-500 gap-3">
          {/* Main Footer Policy Links (Privacy, Shipping, Returns, Terms) */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap font-bold text-neutral-600">
            <button
              type="button"
              onClick={() => openPolicies('privacy')}
              className="hover:text-black hover:underline cursor-pointer transition"
            >
              {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </button>
            <span className="text-neutral-300">•</span>
            <button
              type="button"
              onClick={() => openPolicies('shipping')}
              className="hover:text-black hover:underline cursor-pointer transition"
            >
              {isAr ? 'الشحن والتوصيل' : 'Shipping & Delivery'}
            </button>
            <span className="text-neutral-300">•</span>
            <button
              type="button"
              onClick={() => openPolicies('returns')}
              className="hover:text-black hover:underline cursor-pointer transition"
            >
              {isAr ? 'الضمان والاستبدال' : 'Returns & Guarantee'}
            </button>
            <span className="text-neutral-300">•</span>
            <button
              type="button"
              onClick={() => openPolicies('terms')}
              className="hover:text-black hover:underline cursor-pointer transition"
            >
              {isAr ? 'شروط الخدمة' : 'Terms of Service'}
            </button>
          </div>

          <p>
            © 2026 {language === 'ar' ? 'نسمات للعطور الفاخرة — بيروت، لبنان. جميع الحقوق محفوظة.' : 'Nasamat Haute Parfumerie — Beirut, Lebanon. All rights reserved.'}
          </p>
        </div>
      </footer>

      {/* Haute Parfumerie Olfactory Dossier & Pyramid Modal */}
      <PerfumeDetailsModal
        isOpen={!!quickSelectProduct}
        onClose={handleCloseProductModal}
        product={quickSelectProduct}
        selectedSize={quickSelectProduct ? getSelection(quickSelectProduct.key, (quickSelectProduct.data as any)?.availableSizes).size : 50}
        onSelectSize={(size) => {
          if (quickSelectProduct) {
            setSize(quickSelectProduct.key, size);
          }
        }}
        quantity={quickSelectProduct ? getSelection(quickSelectProduct.key).qty : 1}
        onUpdateQuantity={(qty) => {
          if (quickSelectProduct) {
            setQty(quickSelectProduct.key, qty);
          }
        }}
        onAddToCart={(type, id, name, nameEn, brand, imageUrl, size, price, qty, oilNeededMl) => {
          handleAddToCartClick(type, id, name, nameEn, brand, imageUrl, size, price, qty, oilNeededMl);
        }}
        getPriceInfo={(prod, size) => {
          if (prod.type === 'recipe') {
            return getRecipeInfo(prod.data as SavedRecipe, size);
          } else {
            return getOilInfo(prod.data as FragranceOil, size);
          }
        }}
        lbpRate={lbpRate}
        storePhone={settings.storePhone}
        onUpdateOil={onUpdateOil}
        onUpdateRecipe={onUpdateRecipe}
      />

      {/* Off-Canvas Navigation Drawer (Nasamat Menu) */}
      {isMenuDrawerOpen && (
        <div 
          className="fixed inset-0 z-[70] overflow-hidden bg-black/60 backdrop-blur-sm flex justify-start animate-fadeIn cursor-pointer select-none"
          onClick={() => setIsMenuDrawerOpen(false)}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsMenuDrawerOpen(false);
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="w-full max-w-xs sm:max-w-sm bg-white h-full flex flex-col shadow-2xl text-black border-e border-neutral-200 animate-slideRight cursor-default select-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-black bg-white p-0.5">
                  <img 
                    src={language === 'ar' ? '/logo.png' : '/logo-en.webp'} 
                    alt={language === 'ar' ? 'شعار نسمات' : 'Nasamat'} 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div>
                  <h3 className="font-serif font-black text-sm tracking-wider text-black uppercase">
                    {language === 'ar' ? 'نَسَمَات' : 'NASAMAT'}
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    {language === 'ar' ? 'لتركيب العطور الفاخرة' : 'LUXURY BESPOKE PERFUMERY'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Links List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-neutral-100">
              {/* Account Quick Card inside Drawer */}
              {onOpenCustomerAuth && (
                <div className="pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuDrawerOpen(false);
                      onOpenCustomerAuth();
                    }}
                    className={`w-full p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between cursor-pointer shadow-2xs ${
                      customerUser
                        ? 'bg-amber-50/90 border-amber-300 text-amber-950 hover:bg-amber-100'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-black'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-white border border-neutral-300 flex items-center justify-center shrink-0 shadow-2xs">
                        {customerUser ? (
                          <img
                            src={customerUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customerUser.name)}&background=000&color=fff`}
                            alt={customerUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-4 h-4 text-black" />
                        )}
                      </div>
                      <div className="text-start">
                        <div className="font-black text-xs text-black">
                          {customerUser ? customerUser.name : (language === 'ar' ? 'حسابي / تسجيل الدخول' : 'My Account / Sign In')}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-normal">
                          {customerUser ? (customerUser.email || customerUser.phone || 'VIP Customer') : (language === 'ar' ? 'سجل دخولك لحفظ خلطاتك وعنوانك' : 'Sign in to save your blends & address')}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 font-bold px-1.5">←</span>
                  </button>
                </div>
              )}

              {/* Official Social Media Channels (Prominent Mobile Drawer Card) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-neutral-900 via-black to-neutral-900 text-white shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 text-xs">✨</span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                      {isAr ? 'قنوات التواصل المباشر' : 'OFFICIAL SOCIAL & CHAT'}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {isAr ? 'متاحون فوراً' : 'ONLINE'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/${formatWhatsAppPhone(settings.storePhone)}?text=${encodeURIComponent(
                      isAr ? 'مرحباً نسمات، أود التواصل والاستفسار.' : 'Hello Nasamat, I would like to inquire.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-emerald-600/30 border border-white/10 hover:border-emerald-500/50 transition-all active:scale-95 group text-center"
                  >
                    <WhatsAppOfficialBadge className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-white mt-1.5">{isAr ? 'واتساب' : 'WhatsApp'}</span>
                  </a>

                  {/* Instagram */}
                  <a
                    href={formatSocialUrl(settings.instagramUrl, 'instagram')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-pink-600/30 border border-white/10 hover:border-pink-500/50 transition-all active:scale-95 group text-center cursor-pointer"
                  >
                    <InstagramOfficialBadge className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-white mt-1.5">{isAr ? 'إنستغرام' : 'Instagram'}</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={formatSocialUrl(settings.facebookUrl, 'facebook')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-blue-600/30 border border-white/10 hover:border-blue-500/50 transition-all active:scale-95 group text-center cursor-pointer"
                  >
                    <FacebookOfficialBadge className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-white mt-1.5">{isAr ? 'فيسبوك' : 'Facebook'}</span>
                  </a>
                </div>
              </div>

              {/* Section 1: الأقسام الرئيسية والخدمات الفاخرة */}
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  {language === 'ar' ? 'الواجهة والأجنحة الفاخرة' : 'MAIN SHOWROOM'}
                </div>
                {[
                  {
                    id: 'ai-sommelier',
                    configId: 'ai-sommelier',
                    label: language === 'ar' ? '✨ مستشار نسمات الذكي (AI Sommelier)' : '✨ AI Perfume Sommelier',
                    action: () => {
                      setIsMenuDrawerOpen(false);
                      window.dispatchEvent(new CustomEvent('nasamat_open_ai_sommelier'));
                    },
                    active: false,
                  },
                  {
                    id: 'home',
                    configId: 'home',
                    label: language === 'ar' ? 'الرئيسية واكتشف' : 'Home & Discover',
                    action: () => {
                      navigateToCustomerPage('home');
                      setIsMenuDrawerOpen(false);
                    },
                    active: customerPage === 'home',
                  },
                  {
                    id: 'catalog',
                    configId: 'all',
                    label: language === 'ar' ? 'خزانة العطور الملكية' : 'All Perfumes',
                    action: () => {
                      navigateToCustomerPage('catalog', 'all');
                      setIsMenuDrawerOpen(false);
                    },
                    active: customerPage === 'catalog' && selectedCategory === 'all',
                  },
                  {
                    id: 'signatures',
                    configId: 'signatures',
                    label: language === 'ar' ? 'خلطات نسمات الحصرية' : 'Signature Blends',
                    action: () => {
                      navigateToCustomerPage('signatures');
                      setIsMenuDrawerOpen(false);
                    },
                    active: customerPage === 'signatures',
                  },
                  {
                    id: 'mix-perfume',
                    configId: 'mix-perfume',
                    label: language === 'ar' ? 'مختبر تركيب عطرك الخاص' : 'Mix Your Perfume',
                    action: () => {
                      navigateToCustomerPage('mix-perfume');
                      setIsMenuDrawerOpen(false);
                    },
                    active: customerPage === 'mix-perfume',
                  },
                ]
                  .filter((item) => {
                    const deletedIds = loadDeletedNavCategoryIds();
                    if (deletedIds.has(item.id) || (item.configId && deletedIds.has(item.configId))) return false;
                    if (item.id === 'catalog' && !navCategories.some((c) => c.id === 'all')) return false;
                    if (item.configId === 'ai-sommelier') return true;
                    return navCategories.some((c) => c.id === item.id || (item.id === 'catalog' && c.id === 'all'));
                  })
                  .map((item) => {
                  const conf = getCategoryConfig(item.configId);
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-start transition cursor-pointer ${
                        item.active
                          ? 'bg-black text-white font-black shadow-sm'
                          : 'hover:bg-neutral-100 text-neutral-800 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={conf.imageUrl}
                          alt={item.label}
                          className="w-6 h-6 rounded-full object-cover border border-neutral-300 shadow-2xs shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80';
                          }}
                        />
                        <span className="text-xs truncate">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Section 2: تصنيفات وعائلات العطور الفاخرة (ديناميكية بالكامل وتشمل الأقسام الجديدة والمخصصة) */}
              <div className="space-y-1 pt-3">
                <div className="px-3 py-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    {language === 'ar' ? 'تصنيفات وتشكيلات العطور' : 'FRAGRANCE COLLECTIONS'}
                  </span>
                </div>
                {navCategories
                  .filter((cat) => !['home', 'mix-perfume', 'bundles', 'atelier', 'delivery', 'all'].includes(cat.id))
                  .map((cat) => {
                    const isActive = customerPage === 'catalog' && selectedCategory === cat.id;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          if (cat.id === 'signatures') {
                            navigateToCustomerPage('signatures');
                          } else {
                            navigateToCustomerPage('catalog', cat.id);
                          }
                          setIsMenuDrawerOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-start transition cursor-pointer ${
                          isActive
                            ? 'bg-black text-white font-black shadow-sm'
                            : 'hover:bg-neutral-100 text-neutral-800 font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={cat.imageUrl}
                            alt={language === 'ar' ? cat.labelAr : cat.labelEn}
                            className="w-6 h-6 rounded-full object-cover border border-neutral-300 shadow-2xs shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs truncate">{language === 'ar' ? cat.labelAr : cat.labelEn}</span>
                            {cat.countAr && !/\d+/.test(cat.countAr) && (
                              <span className={`text-[10px] ${isActive ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                {language === 'ar' ? cat.countAr : cat.countEn}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* Section 3: قصة الدار والخدمات */}
              <div className="space-y-1 pt-3">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  {language === 'ar' ? 'الدار والخدمات' : 'ATELIER & SERVICES'}
                </div>
                {[
                  {
                    id: 'atelier',
                    configId: 'atelier',
                    label: language === 'ar' ? 'قصة الدار والمختبر الحرفي' : 'Our Atelier Craft',
                    action: () => {
                      navigateToCustomerPage('atelier');
                      setIsMenuDrawerOpen(false);
                    },
                    active: customerPage === 'atelier',
                  },
                  {
                    id: 'delivery',
                    configId: 'delivery',
                    label: language === 'ar' ? 'التوصيل والدفع في لبنان والأسئلة' : 'Lebanon Delivery & FAQ',
                    action: () => {
                      navigateToCustomerPage('delivery');
                      setIsMenuDrawerOpen(false);
                    },
                    active: customerPage === 'delivery',
                  },
                  {
                    id: 'policies',
                    configId: 'policies',
                    label: language === 'ar' ? 'السياسات والضمانات الملكية' : 'Store Policies & Guarantees',
                    action: () => {
                      openPolicies('privacy');
                      setIsMenuDrawerOpen(false);
                    },
                    active: isPoliciesOpen,
                  },
                  {
                    id: 'install-app',
                    configId: 'all',
                    label: language === 'ar' ? '📲 تثبيت تطبيق نسمات (سطح المكتب / الهاتف)' : '📲 Install Nasamat App (Desktop / Mobile)',
                    action: () => {
                      setIsMenuDrawerOpen(false);
                      window.dispatchEvent(new CustomEvent('nasamat_open_pwa_install'));
                    },
                    active: false,
                  },
                ].map((item) => {
                  const conf = getCategoryConfig(item.configId);
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-start transition cursor-pointer ${
                        item.active
                          ? 'bg-black text-white font-black shadow-sm'
                          : 'hover:bg-neutral-100 text-neutral-800 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={conf.imageUrl}
                          alt={item.label}
                          className="w-6 h-6 rounded-full object-cover border border-neutral-300 shadow-2xs shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80';
                          }}
                        />
                        <span className="text-xs truncate">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer with Cart, Language Switcher and WhatsApp concierge */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-2.5">
              {/* Language Switcher in Drawer */}
              <button
                type="button"
                onClick={() => {
                  toggleLanguage();
                }}
                className="w-full py-2 px-3 rounded-xl bg-white border border-neutral-300 hover:border-black text-xs font-bold flex items-center justify-between shadow-2xs transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌐</span>
                  <span className="text-neutral-700">{language === 'ar' ? 'لغة العرض' : 'Language'}</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 text-black font-black uppercase">
                  {language === 'ar' ? 'English (EN)' : 'Arabic (AR)'}
                </span>
              </button>

              <button
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  onOpenCart();
                }}
                className="w-full py-3 px-4 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100/80 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-between shadow-xs transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-700" />
                  <span className="text-neutral-950 font-bold">{language === 'ar' ? 'حقيبة المشتريات' : 'Shopping Cart'}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-mono text-[11px] font-black shadow-xs">
                  {cart.reduce((s, it) => s + it.quantity, 0)} {language === 'ar' ? 'عطر' : 'items'}
                </span>
              </button>

              <button
                onClick={() => {
                  const phone = formatWhatsAppPhone(settings.storePhone);
                  const msg = isAr 
                    ? 'مرحباً نسمات، أود التواصل والاستفسار بخصوص عطوركم الفاخرة.'
                    : 'Hello Nasamat, I would like to inquire about your luxury perfumes.';
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <WhatsAppOfficialIcon className="w-5 h-5 shrink-0" />
                <span>{language === 'ar' ? 'تواصل معنا عبر واتساب' : 'Chat via WhatsApp'}</span>
              </button>

              {/* Social Media Official Badges */}
              <div className="pt-2 border-t border-neutral-200/80">
                <div className="flex items-center justify-center gap-4 py-1">
                  {/* WhatsApp */}
                  <a 
                    href={`https://wa.me/${formatWhatsAppPhone(settings.storePhone)}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-11 h-11 rounded-full flex items-center justify-center hover:scale-115 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer shrink-0"
                    title="WhatsApp"
                    aria-label="WhatsApp"
                  >
                    <WhatsAppOfficialBadge className="w-11 h-11" />
                  </a>

                  {/* Instagram */}
                  <a
                    href={formatSocialUrl(settings.instagramUrl, 'instagram')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center hover:scale-115 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer shrink-0"
                    title="Instagram"
                    aria-label="Instagram"
                  >
                    <InstagramOfficialBadge className="w-11 h-11" />
                  </a>

                  {/* Facebook */}
                  <a
                    href={formatSocialUrl(settings.facebookUrl, 'facebook')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full flex items-center justify-center hover:scale-115 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer shrink-0"
                    title="Facebook"
                    aria-label="Facebook"
                  >
                    <FacebookOfficialBadge className="w-11 h-11" />
                  </a>
                </div>
              </div>

              <div className="text-center pt-1 text-[10px] text-neutral-400 font-medium">
                {isAr ? '🇱🇧 توصيل سريع لجميع المناطق اللبنانية • كاش عند الاستلام' : '🇱🇧 Fast Express Delivery Across Lebanon • Cash on Delivery'}
              </div>

              {/* Luxury Policy Links (Privacy, Shipping, Returns, Terms) */}
              <div className="pt-3 border-t border-neutral-200/80 flex items-center justify-center gap-2 sm:gap-5 flex-wrap text-[11px] text-neutral-500 font-bold">
                <button
                  type="button"
                  onClick={() => openPolicies('privacy')}
                  className="hover:text-black hover:underline cursor-pointer transition"
                >
                  {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </button>
                <span className="text-neutral-300">•</span>
                <button
                  type="button"
                  onClick={() => openPolicies('shipping')}
                  className="hover:text-black hover:underline cursor-pointer transition"
                >
                  {isAr ? 'الشحن والتوصيل' : 'Shipping & Delivery'}
                </button>
                <span className="text-neutral-300">•</span>
                <button
                  type="button"
                  onClick={() => openPolicies('returns')}
                  className="hover:text-black hover:underline cursor-pointer transition"
                >
                  {isAr ? 'الضمان والاستبدال' : 'Returns & Guarantee'}
                </button>
                <span className="text-neutral-300">•</span>
                <button
                  type="button"
                  onClick={() => openPolicies('terms')}
                  className="hover:text-black hover:underline cursor-pointer transition"
                >
                  {isAr ? 'شروط الخدمة' : 'Terms of Service'}
                </button>
              </div>

              <div className="text-center pt-1 text-[10px] text-neutral-400">
                © {new Date().getFullYear()} {isAr ? 'نسمات للعطور الفاخرة • بيروت، لبنان' : 'Nasamat Haute Parfumerie • Beirut, Lebanon'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Cart Drawer Modal */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 z-[60] overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn cursor-pointer select-none"
          onClick={onCloseCart}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onCloseCart();
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="w-full max-w-lg bg-white border-s border-neutral-200 h-full flex flex-col shadow-2xl animate-slideLeft text-black cursor-default select-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-300 flex items-center justify-center text-neutral-900 font-bold shadow-xs">
                  <ShoppingBag className="w-5 h-5 text-neutral-900" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-black font-serif uppercase tracking-wider">
                    {t('storeViewCart')}
                  </h2>
                  <span className="text-xs text-neutral-500 font-semibold">
                    {cart.reduce((s, it) => s + it.quantity, 0)} {t('storeCartItemsCount')}
                  </span>
                </div>
              </div>

              <button
                onClick={onCloseCart}
                className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                    <ShoppingBag className="w-10 h-10 text-neutral-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-black font-serif">{t('storeCartEmpty')}</h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-xs">{t('storeCartEmptyDesc')}</p>
                  </div>
                  <button
                    onClick={onCloseCart}
                    className="px-6 py-3 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-neutral-800 transition cursor-pointer"
                  >
                    {t('storeContinueShopping')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-neutral-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm hover:border-black transition"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={isAr ? item.name : (item.nameEn || getLocalizedOilName(item.name, 'en'))} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-500">
                            <Droplet className="w-5 h-5 text-neutral-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-black truncate">
                          {isAr ? item.name : (item.nameEn || getLocalizedOilName(item.name, 'en'))}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-black text-white font-bold uppercase tracking-wider">
                            {item.sizeMl} {isAr ? 'ملل' : 'ml'}
                          </span>
                          <span className="text-xs text-black font-mono font-bold">
                            ${item.unitPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Stepper & Line Total */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <div className="flex items-center bg-neutral-100 border border-neutral-200 rounded-lg p-0.5">
                          <button
                            onClick={() => onUpdateCartQty(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-black font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateCartQty(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-black font-mono">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => onRemoveFromCart(item.id)}
                            className="text-neutral-400 hover:text-rose-600 transition cursor-pointer"
                            title={isAr ? 'حذف' : 'Remove'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Clear Cart link */}
                  <div className="text-end pt-1">
                    <button
                      onClick={onClearCart}
                      className="text-[11px] text-neutral-400 hover:text-rose-600 underline cursor-pointer"
                    >
                      {t('clearCart')}
                    </button>
                  </div>
                </div>
              )}

              {/* Order Summary Box */}
              {cart.length > 0 && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-neutral-600">
                    <span>{t('storeCartSubtotal')}</span>
                    <span className="font-bold text-black font-mono">${cartSubtotal.toFixed(2)}</span>
                  </div>

                  {/* Delivery Fee Section */}
                  <div className="space-y-1.5 pt-1 border-t border-neutral-200">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-neutral-700">{t('storeCartDelivery')}</span>
                      </div>
                      <span className="font-bold text-emerald-600 font-mono">
                        {deliveryFee === 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            {language === 'ar' ? 'مجاني' : 'Free'}
                          </span>
                        ) : (
                          `$${deliveryFee.toFixed(2)}`
                        )}
                      </span>
                    </div>
                  </div>

                  {isFreeDeliveryActive && cartSubtotal < freeThreshold && customDeliveryFee === null && (
                    <div className="text-[10px] text-neutral-600 bg-white p-2.5 rounded-xl border border-neutral-200 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>
                        {language === 'ar' 
                          ? `أضف عطوراً بقيمة $${(freeThreshold - cartSubtotal).toFixed(2)} إضافية للحصول على توصيل مجاني!`
                          : `Add $${(freeThreshold - cartSubtotal).toFixed(2)} more to qualify for FREE delivery!`}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-neutral-200 pt-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-black uppercase tracking-wider block">{t('storeCartTotal')}</span>
                      <span className="text-[11px] text-neutral-500 font-medium">
                        ~{grandTotalLbp.toLocaleString()} L.L
                      </span>
                    </div>
                    <span className="text-2xl font-black text-black font-mono">
                      ${cartGrandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Customer Checkout Form */}
              {cart.length > 0 && (
                <form onSubmit={handleCheckoutSubmit} className="space-y-3.5 pt-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-neutral-700" />
                        <span>{t('storeCustomerDetailsTitle')}</span>
                      </h4>
                      <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {language === 'ar' ? '* الاسم، العنوان، والهاتف إلزامية' : '* Required Fields'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      {language === 'ar' ? 'يلزم إدخال هذه البيانات لتوصيل الطلبية وتأكيد الحجز بدقة' : 'Required for delivery and confirmation'}
                    </p>

                    {/* Account Saved Status Indicator */}
                    {(customerUser?.savedAddress || customerUser?.phone || customerAddress || customerPhone) ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span>{language === 'ar' ? 'العنوان ورقم الهاتف محفوظين دائماً في حسابك للطلبيات القادمة ✓' : 'Address and phone are saved in your account for future orders ✓'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                        <Lock className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>{language === 'ar' ? 'سيتم حفظ العنوان ورقم الهاتف تلقائياً في حسابك بمجرد إدخالهما' : 'Address and phone will be automatically stored in your account'}</span>
                      </div>
                    )}
                  </div>


                  {/* Form Error Banner */}
                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-700 font-bold flex items-center gap-2 animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Field 1: Customer Name (Mandatory) */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-neutral-800">
                        <span>{language === 'ar' ? 'اسم الزبون الكامل' : 'Customer Full Name'}</span>
                        <span className="text-rose-600 font-black ms-1">*</span>
                      </label>
                      {attemptedSubmit && !isNameValid && (
                        <span className="text-[10px] text-rose-600 font-bold">{language === 'ar' ? 'الاسم مطلوب *' : 'Name is required *'}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={customerName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomerName(val);
                        syncCustomerDeliveryDetails(val, customerPhone, customerCity, customerAddress, customerNotes);
                        if (formError && val.trim() && isPhoneValid && isAddressValid) setFormError(null);
                      }}
                      onBlur={() => syncCustomerDeliveryDetails(customerName, customerPhone, customerCity, customerAddress, customerNotes)}
                      className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none transition ${
                        attemptedSubmit && !isNameValid
                          ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500'
                          : 'border-neutral-200 focus:border-black'
                      }`}
                    />
                  </div>

                  {/* Field 2: Phone / WhatsApp (Mandatory) */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-neutral-800">
                        <span>{language === 'ar' ? 'رقم الهاتف / الواتساب للتوصيل' : 'Phone / WhatsApp'}</span>
                        <span className="text-rose-600 font-black ms-1">*</span>
                      </label>
                      {attemptedSubmit && !isPhoneValid && (
                        <span className="text-[10px] text-rose-600 font-bold">{language === 'ar' ? 'رقم الهاتف مطلوب (6 أرقام على الأقل) *' : 'Valid phone required *'}</span>
                      )}
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder=""
                      value={customerPhone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomerPhone(val);
                        syncCustomerDeliveryDetails(customerName, val, customerCity, customerAddress, customerNotes);
                        if (formError && isNameValid && val.trim().length >= 6 && isAddressValid) setFormError(null);
                      }}
                      onBlur={() => syncCustomerDeliveryDetails(customerName, customerPhone, customerCity, customerAddress, customerNotes)}
                      className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none transition ${
                        attemptedSubmit && !isPhoneValid
                          ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500'
                          : 'border-neutral-200 focus:border-black'
                      }`}
                    />
                  </div>

                  {/* Field 3: Detailed Address (Mandatory) */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-neutral-800">
                        <span>{language === 'ar' ? 'العنوان بالتفصيل' : 'Detailed Delivery Address'}</span>
                        <span className="text-rose-600 font-black ms-1">*</span>
                      </label>
                      {attemptedSubmit && !isAddressValid && (
                        <span className="text-[10px] text-rose-600 font-bold">{language === 'ar' ? 'العنوان بالتفصيل مطلوب *' : 'Address is required *'}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={customerAddress}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomerAddress(val);
                        syncCustomerDeliveryDetails(customerName, customerPhone, customerCity, val, customerNotes);
                        if (formError && isNameValid && isPhoneValid && val.trim()) setFormError(null);
                      }}
                      onBlur={() => syncCustomerDeliveryDetails(customerName, customerPhone, customerCity, customerAddress, customerNotes)}
                      className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none transition ${
                        attemptedSubmit && !isAddressValid
                          ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500'
                          : 'border-neutral-200 focus:border-black'
                      }`}
                    />
                  </div>

                  {/* Optional fields: City & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-neutral-500 font-medium block mb-1">
                        {language === 'ar' ? 'المدينة / القضاء' : 'City / District'}
                      </label>
                      <input
                        type="text"
                        placeholder=""
                        value={customerCity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomerCity(val);
                          syncCustomerDeliveryDetails(customerName, customerPhone, val, customerAddress, customerNotes);
                        }}
                        onBlur={() => syncCustomerDeliveryDetails(customerName, customerPhone, customerCity, customerAddress, customerNotes)}
                        className="w-full bg-white border border-neutral-200 focus:border-black rounded-xl px-3.5 py-2 text-xs text-black placeholder-neutral-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 font-medium block mb-1">
                        {language === 'ar' ? 'ملاحظات خاصة بالتوصيل' : 'Delivery Notes'}
                      </label>
                      <input
                        type="text"
                        placeholder=""
                        value={customerNotes}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomerNotes(val);
                          syncCustomerDeliveryDetails(customerName, customerPhone, customerCity, customerAddress, val);
                        }}
                        onBlur={() => syncCustomerDeliveryDetails(customerName, customerPhone, customerCity, customerAddress, customerNotes)}
                        className="w-full bg-white border border-neutral-200 focus:border-black rounded-xl px-3.5 py-2 text-xs text-black placeholder-neutral-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-3">
                    {/* Primary: Confirm Order & Issue Sale Invoice */}
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition cursor-pointer"
                    >
                      <Receipt className="w-4 h-4 text-white" />
                      <span>{t('storeCheckoutConfirm')}</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {lastPlacedInvoice && (
        <div 
          className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
          onClick={() => setLastPlacedInvoice(null)}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setLastPlacedInvoice(null);
            }
          }}
        >
          <div 
            className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl relative text-black cursor-default"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLastPlacedInvoice(null)}
              className="absolute top-4 end-4 text-neutral-400 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-600 font-bold shadow-md">
              <Check className="w-8 h-8 text-emerald-600 stroke-[3]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-black font-serif">
                {t('storeOrderSuccessTitle')}
              </h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                {t('storeOrderSuccessMsg')}
              </p>
            </div>

            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-start space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">{t('storeOrderNumber')}</span>
                <span className="font-mono font-bold text-black">{lastPlacedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{t('invCustomerName')}:</span>
                <span className="font-bold text-black">{lastPlacedInvoice.partyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{t('invNetTotal')}:</span>
                <span className="font-black text-black font-mono">${lastPlacedInvoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-600 font-bold pt-1 border-t border-neutral-200">
                <span>{language === 'ar' ? 'حالة المخزون:' : 'Stock status:'}</span>
                <span>{language === 'ar' ? 'تم خصم العطور تلقائياً ✅' : 'Items auto-deducted ✅'}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {onViewInvoiceReceipt && (
                <button
                  onClick={() => {
                    onViewInvoiceReceipt(lastPlacedInvoice);
                    setLastPlacedInvoice(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Receipt className="w-4 h-4 text-white" />
                  <span>{t('storePrintReceiptBtn')}</span>
                </button>
              )}

              <button
                onClick={() => setLastPlacedInvoice(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold cursor-pointer uppercase tracking-wider border border-neutral-200"
              >
                {t('storeNewOrderBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Policies Modal (Privacy, Shipping, Returns, Terms) */}
      <StorePoliciesModal
        isOpen={isPoliciesOpen}
        onClose={() => setIsPoliciesOpen(false)}
        initialTab={policyInitialTab}
        settings={settings}
      />

    </div>
  );
};
