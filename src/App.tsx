import React, { useState, useEffect, useRef } from 'react';
import type { FragranceOil, RawMaterial, ProductionBatch, AppSettings, SavedRecipe, Invoice, CartItem, StaffMember } from './types';
import { 
  loadOils, 
  saveOils, 
  loadMaterials, 
  saveMaterials, 
  loadBatches, 
  saveBatches, 
  loadSettings, 
  saveSettings,
  loadRecipes,
  saveRecipes,
  loadInvoices,
  saveInvoices,
  loadCart,
  saveCart,
  resetAllToDefaults,
  loadStaffMembers,
  loadCurrentStaff,
  saveStaffMembers,
  saveCurrentStaffId
} from './utils/storage';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { TabsNav, type ActiveTab } from './components/TabsNav';
import { StoreTab } from './components/StoreTab';
import { CalculatorTab } from './components/CalculatorTab';
import { RecipesTab } from './components/RecipesTab';
import { InvoicesTab, InvoiceReceiptModal } from './components/InvoicesTab';
import { CatalogExcelTab } from './components/CatalogExcelTab';
import { MaterialsTab } from './components/MaterialsTab';
import { BatchesTab } from './components/BatchesTab';
import { DashboardTab } from './components/DashboardTab';
import { RecipeModal } from './components/RecipeModal';
import { BackupModal } from './components/BackupModal';
import { SmartSearchModal } from './components/SmartSearchModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { BottleLabelModal } from './components/BottleLabelModal';
import { AdminFinancialStatementModal } from './components/AdminFinancialStatementModal';
import { AiSommelierModal } from './components/AiSommelierModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { WhatsAppIcon, WhatsAppOfficialIcon, InstagramOfficialBadge, FacebookOfficialBadge, Sparkles } from './components/icons';
import { AdminSidebar, type AdminNavTab } from './components/AdminSidebar';
import { AdminProductsPricingTab } from './components/AdminProductsPricingTab';
import { AdminPOSTerminalTab } from './components/AdminPOSTerminalTab';
import { AdminModulesTab } from './components/AdminModulesTab';
import { CrmCustomersTab } from './components/CrmCustomersTab';
import { loadCustomerUser, loadCustomerBlends, loadSavingsBundles, saveSavingsBundles } from './utils/storage';
import { initPixels } from './utils/pixelTracker';
import { syncInvoiceRealtime } from './utils/supabase';
import { formatWhatsAppPhone, formatSocialUrl } from './utils/whatsappConcierge';
import type { CustomerUser, BottleLabelData, SavingsBundle } from './types';

const AppContent: React.FC = () => {
  const { language, t } = useLanguage();

  // Seamlessly ensure localhost is used for Firebase Auth compatibility
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1') {
      window.location.replace(window.location.href.replace('127.0.0.1', 'localhost'));
    }
  }, []);
  
  // Admin authentication state (stored in sessionStorage for session duration)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('nasamat_admin_auth') === 'true';
    } catch (_) {
      return false;
    }
  });
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [pendingAdminTab, setPendingAdminTab] = useState<AdminNavTab | ActiveTab | null>(null);

  // Portal Mode: 'customer' (صفحة الزبائن - المتجر الفاخر والسلة) or 'admin' (صفحة الإدارة - لوحة القيادة والمختبر)
  const [portal, setPortal] = useState<'customer' | 'admin'>(() => {
    try {
      const isAuth = sessionStorage.getItem('nasamat_admin_auth') === 'true';
      const saved = localStorage.getItem('nasamat_portal_mode');
      if (isAuth && saved === 'admin') return 'admin';
    } catch (_) {}
    return 'customer';
  });

  const [adminTab, setAdminTab] = useState<AdminNavTab>('pos');
  const [isMobileAdminSidebarOpen, setIsMobileAdminSidebarOpen] = useState(false);
  const [isPosSidebarCollapsed, setIsPosSidebarCollapsed] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const isAuth = sessionStorage.getItem('nasamat_admin_auth') === 'true';
      const savedPortal = localStorage.getItem('nasamat_portal_mode');
      if (isAuth && savedPortal === 'admin') return 'dashboard';
    } catch (_) {}
    return 'store';
  });

  const [oils, setOils] = useState<FragranceOil[]>(loadOils);
  const [materials, setMaterials] = useState<RawMaterial[]>(loadMaterials);
  const [batches, setBatches] = useState<ProductionBatch[]>(loadBatches);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [recipes, setRecipes] = useState<SavedRecipe[]>(loadRecipes);
  const [invoices, setInvoices] = useState<Invoice[]>(loadInvoices);
  const [cart, setCart] = useState<CartItem[]>(loadCart);

  // Savings Bundles State (Curated & Priced by Manager)
  const [savingsBundles, setSavingsBundles] = useState<SavingsBundle[]>(loadSavingsBundles);
  const handleUpdateSavingsBundles = (updated: SavingsBundle[]) => {
    setSavingsBundles(updated);
    saveSavingsBundles(updated);
  };

  // Customer User Auth State (Google / Apple account)
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(loadCustomerUser);
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState(false);

  // Staff Roles & Permissions System State
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(loadStaffMembers);
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(loadCurrentStaff);

  const handleSwitchStaff = (staff: StaffMember) => {
    setCurrentStaff(staff);
    saveCurrentStaffId(staff.id);
    if (staff.role !== 'owner' && !staff.allowedTabs.includes(adminTab)) {
      const fallbackTab = (staff.allowedTabs[0] || 'pos') as AdminNavTab;
      setAdminTab(fallbackTab);
    }
  };

  const handleUpdateStaffMembers = (updatedList: StaffMember[]) => {
    setStaffMembers(updatedList);
    saveStaffMembers(updatedList);
    const updatedCurrent = updatedList.find((s) => s.id === currentStaff.id);
    if (updatedCurrent) {
      setCurrentStaff(updatedCurrent);
    }
  };

  // Initialize Tracking Pixels (Meta, TikTok, Google Tag)
  useEffect(() => {
    initPixels(settings.trackingPixels);
  }, [settings.trackingPixels]);

  // Synchronize settings instantly across components and storage
  useEffect(() => {
    const handleSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<AppSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        setSettings(loadSettings());
      }
    };
    window.addEventListener('nasamat_settings_updated', handleSettingsUpdated);
    window.addEventListener('storage', handleSettingsUpdated);
    return () => {
      window.removeEventListener('nasamat_settings_updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleSettingsUpdated);
    };
  }, []);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<Invoice | null>(null);
  const [recipeModalBatch, setRecipeModalBatch] = useState<ProductionBatch | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isSmartSearchOpen, setIsSmartSearchOpen] = useState(false);
  
  // Bottle Sticker Label Modal state
  const [isBottleLabelOpen, setIsBottleLabelOpen] = useState(false);
  const [selectedBottleLabelData, setSelectedBottleLabelData] = useState<BottleLabelData | null>(null);

  // Manager Daily & Monthly Financial Statement Modal
  const [isFinancialStatementOpen, setIsFinancialStatementOpen] = useState(false);

  // AI Perfume Sommelier & Concierge Modal (Levels 1-5 Architecture)
  const [isAiSommelierOpen, setIsAiSommelierOpen] = useState(false);

  useEffect(() => {
    const handleOpenAi = () => setIsAiSommelierOpen(true);
    window.addEventListener('nasamat_open_ai_sommelier', handleOpenAi);
    return () => window.removeEventListener('nasamat_open_ai_sommelier', handleOpenAi);
  }, []);

  const handleOpenBottleLabel = (data: BottleLabelData) => {
    setSelectedBottleLabelData(data);
    setIsBottleLabelOpen(true);
  };
  const [selectedOilForCalculator, setSelectedOilForCalculator] = useState<string | undefined>();
  const [selectedRecipeForCalculator, setSelectedRecipeForCalculator] = useState<SavedRecipe | null>(null);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState<string | undefined>();

  // Secret Admin Access click counter (5 rapid clicks on footer copyright)
  const secretClickCountRef = useRef(0);
  const secretClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSecretAdminTrigger = () => {
    if (portal === 'admin') {
      handleSelectPortal('customer');
    } else {
      handleSelectPortal('admin');
    }
  };

  const handleFooterCopyrightClick = () => {
    if (secretClickTimerRef.current) clearTimeout(secretClickTimerRef.current);
    secretClickCountRef.current += 1;
    if (secretClickCountRef.current >= 5) {
      secretClickCountRef.current = 0;
      handleSecretAdminTrigger();
    } else {
      secretClickTimerRef.current = setTimeout(() => {
        secretClickCountRef.current = 0;
      }, 2500);
    }
  };

  // Anti-Guessing URL Security & Secret Admin Access
  useEffect(() => {
    const secretSlug = (settings.adminSecretSlug || 'nasmat-vault-77').toLowerCase().replace(/^#/, '');

    const checkHashSecurity = () => {
      if (typeof window === 'undefined') return;
      const rawHash = (window.location.hash || '').toLowerCase().replace(/^#/, '').trim();
      const rawSearch = (window.location.search || '').toLowerCase();

      // STRICT PROTECTION AGAINST GUESSING:
      // Block commonly guessed admin routes: #admin, #dashboard, #login, #portal, #root, ?admin=true
      const guessablePaths = ['admin', 'dashboard', 'login', 'portal', 'administrator', 'root', 'cpanel'];
      if (guessablePaths.includes(rawHash) || rawSearch.includes('admin=true')) {
        // Clear immediately and prevent access or prompt from appearing
        try {
          history.replaceState(null, '', window.location.pathname);
        } catch (_) {}
        return;
      }

      // Direct shortcut for CRM & Meta Ads Leads Page (#crm or #customers)
      if (rawHash === 'crm' || rawHash === 'customers') {
        if (!isAdminAuthenticated) {
          setPendingAdminTab('customers');
          setIsAdminAuthModalOpen(true);
        } else {
          setPortal('admin');
          setAdminTab('customers');
        }
        return;
      }

      // Check for the authentic secret unguessable admin slug
      if (rawHash && rawHash === secretSlug) {
        if (!isAdminAuthenticated) {
          setPendingAdminTab('dashboard');
          setIsAdminAuthModalOpen(true);
        } else {
          setPortal('admin');
          setAdminTab('overview');
        }
        // Stealthily clear hash so the secret slug does not stay exposed in browser bar
        try {
          history.replaceState(null, '', window.location.pathname);
        } catch (_) {}
      }
    };

    checkHashSecurity();
    window.addEventListener('hashchange', checkHashSecurity);
    return () => window.removeEventListener('hashchange', checkHashSecurity);
  }, [settings.adminSecretSlug, isAdminAuthenticated]);

  // Global Keyboard Shortcuts (Ctrl+K for search, Ctrl+Shift+A for Secret Admin, ESC for back navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + K for Smart Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSmartSearchOpen((prev) => !prev);
        return;
      }
      // Secret Admin Combo: Ctrl + Shift + A or Alt + Shift + A
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSecretAdminTrigger();
        return;
      }

      // HIERARCHICAL ESCAPE (ESC) KEY HANDLER
      if (e.key === 'Escape') {
        // Priority 1: Top-level Modals
        if (isAiSommelierOpen) {
          setIsAiSommelierOpen(false);
          return;
        }
        if (isAdminAuthModalOpen) {
          setIsAdminAuthModalOpen(false);
          setPendingAdminTab(null);
          return;
        }
        if (isCustomerAuthOpen) {
          setIsCustomerAuthOpen(false);
          return;
        }
        if (selectedReceiptInvoice) {
          setSelectedReceiptInvoice(null);
          return;
        }
        if (recipeModalBatch) {
          setRecipeModalBatch(null);
          return;
        }
        if (isBackupOpen) {
          setIsBackupOpen(false);
          return;
        }
        if (isSmartSearchOpen) {
          setIsSmartSearchOpen(false);
          return;
        }
        if (isCartOpen) {
          setIsCartOpen(false);
          return;
        }
        if (isBottleLabelOpen) {
          setIsBottleLabelOpen(false);
          return;
        }

        // Priority 2: Admin Portal Navigation
        if (portal === 'admin') {
          if (isMobileAdminSidebarOpen) {
            setIsMobileAdminSidebarOpen(false);
            return;
          }
          if (adminTab !== 'overview') {
            setAdminTab('overview');
            return;
          }
          // If already at overview, Esc takes them back to the customer storefront
          handleSelectPortal('customer');
          return;
        }

        // Priority 3: Customer Boutique internal views & drawers
        window.dispatchEvent(new CustomEvent('nasmat_escape'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    portal, 
    adminTab, 
    isMobileAdminSidebarOpen, 
    isAdminAuthModalOpen, 
    isCustomerAuthOpen, 
    selectedReceiptInvoice, 
    recipeModalBatch, 
    isBackupOpen, 
    isSmartSearchOpen, 
    isCartOpen,
    isBottleLabelOpen
  ]);

  // Auto-save portal mode
  useEffect(() => {
    try {
      localStorage.setItem('nasamat_portal_mode', portal);
    } catch (_) {}
  }, [portal]);

  // Auto-save on state change
  useEffect(() => {
    saveOils(oils);
  }, [oils]);

  useEffect(() => {
    saveMaterials(materials);
  }, [materials]);

  useEffect(() => {
    saveBatches(batches);
  }, [batches]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveRecipes(recipes);
  }, [recipes]);

  useEffect(() => {
    saveInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  // Apply theme class to document element
  useEffect(() => {
    const isLight = (settings.theme || 'light') === 'light';
    if (isLight) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [settings.theme]);

  const handleToggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  // ================= CART HANDLERS =================
  const handleAddToCart = (newItem: Omit<CartItem, 'id'>) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.referenceId === newItem.referenceId && item.sizeMl === newItem.sizeMl
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      }
      const cartId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      return [...prev, { ...newItem, id: cartId }];
    });
  };

  const handleUpdateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleConfirmStoreOrder = (
    newInvoice: Invoice,
    deductions: {
      oils: { id: string; amount: number }[];
      materials: { id: string; amount: number }[];
    }
  ) => {
    handleSaveInvoice(newInvoice, { deductions });
  };

  // ================= OIL HANDLERS =================
  const handleAddOil = (newOil: FragranceOil) => {
    setOils((prev) => [newOil, ...prev]);
  };

  const handleUpdateOil = (updatedOil: FragranceOil) => {
    setOils((prev) => prev.map((o) => (o.id === updatedOil.id ? updatedOil : o)));
  };

  const handleDeleteOil = (id: string) => {
    setOils((prev) => prev.filter((o) => o.id !== id));
  };

  const handleRestockOil = (id: string, additionalQty: number, additionalCost?: number) => {
    setOils((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const newCurQty = Number((o.currentQuantity + additionalQty).toFixed(2));
        const newInitQty = Number((o.initialQuantity + additionalQty).toFixed(2));
        let newTotalCost = o.costPrice;
        let newUnitCost = o.unitCost;

        if (additionalCost !== undefined && additionalCost > 0) {
          newTotalCost = Number((o.costPrice + additionalCost).toFixed(2));
          newUnitCost = Number((newTotalCost / newInitQty).toFixed(4));
        }

        return {
          ...o,
          currentQuantity: newCurQty,
          initialQuantity: newInitQty,
          costPrice: newTotalCost,
          unitCost: newUnitCost,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // ================= MATERIAL HANDLERS =================
  const handleAddMaterial = (newMat: RawMaterial) => {
    setMaterials((prev) => [newMat, ...prev]);
  };

  const handleUpdateMaterial = (updatedMat: RawMaterial) => {
    setMaterials((prev) => prev.map((m) => (m.id === updatedMat.id ? updatedMat : m)));
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleRestockMaterial = (id: string, additionalQty: number, additionalCost?: number) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newCurQty = Number((m.currentQuantity + additionalQty).toFixed(2));
        const newInitQty = Number((m.initialQuantity + additionalQty).toFixed(2));
        let newTotalCost = m.costPrice;
        let newUnitCost = m.unitCost;

        if (additionalCost !== undefined && additionalCost > 0) {
          newTotalCost = Number((m.costPrice + additionalCost).toFixed(2));
          newUnitCost = Number((newTotalCost / newInitQty).toFixed(3));
        }

        return {
          ...m,
          currentQuantity: newCurQty,
          initialQuantity: newInitQty,
          costPrice: newTotalCost,
          unitCost: newUnitCost,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // ================= PRODUCTION & DEDUCTION HANDLER =================
  const handleExecuteProduction = (
    newBatch: ProductionBatch,
    deductions: {
      oils: { id: string; amount: number }[];
      materials: { id: string; amount: number }[];
    }
  ) => {
    // 1. Deduct oils
    setOils((prevOils) =>
      prevOils.map((oil) => {
        const item = deductions.oils.find((d) => d.id === oil.id);
        if (!item) return oil;
        const remaining = Math.max(0, Number((oil.currentQuantity - item.amount).toFixed(2)));
        return {
          ...oil,
          currentQuantity: remaining,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    // 2. Deduct raw materials (alcohol, fixatives, bottles, sprayers, boxes)
    setMaterials((prevMats) =>
      prevMats.map((mat) => {
        const item = deductions.materials.find((d) => d.id === mat.id);
        if (!item) return mat;
        const remaining = Math.max(0, Number((mat.currentQuantity - item.amount).toFixed(2)));
        return {
          ...mat,
          currentQuantity: remaining,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    // 3. Record batch
    setBatches((prevBatches) => [newBatch, ...prevBatches]);
  };

  const handleDeleteBatch = (id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
  };

  // ================= RECIPE HANDLERS =================
  const handleSaveRecipe = (newOrUpdated: SavedRecipe) => {
    setRecipes((prev) => {
      const exists = prev.some((r) => r.id === newOrUpdated.id);
      if (exists) {
        return prev.map((r) => (r.id === newOrUpdated.id ? newOrUpdated : r));
      }
      return [newOrUpdated, ...prev];
    });
  };

  const handleDeleteRecipe = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleFormulateRecipe = (recipe: SavedRecipe) => {
    setSelectedRecipeForCalculator(recipe);
    setActiveTab('calculator');
  };

  // ================= INVOICE HANDLERS =================
  const handleSaveInvoice = (
    newOrUpdated: Invoice,
    stockChanges?: {
      deductions?: { oils: { id: string; amount: number }[]; materials: { id: string; amount: number }[] };
      additions?: { oils: { id: string; amount: number; cost?: number }[]; materials: { id: string; amount: number; cost?: number }[] };
    }
  ) => {
    // 1. Update Invoices state
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === newOrUpdated.id);
      if (exists) {
        return prev.map((inv) => (inv.id === newOrUpdated.id ? newOrUpdated : inv));
      }
      return [newOrUpdated, ...prev];
    });

    // 2. Handle stock deductions if any (for sales)
    if (stockChanges?.deductions) {
      if (stockChanges.deductions.oils && stockChanges.deductions.oils.length > 0) {
        setOils((prevOils) =>
          prevOils.map((oil) => {
            const item = stockChanges.deductions!.oils.find((d) => d.id === oil.id);
            if (!item) return oil;
            const remaining = Math.max(0, Number((oil.currentQuantity - item.amount).toFixed(2)));
            return { ...oil, currentQuantity: remaining, updatedAt: new Date().toISOString() };
          })
        );
      }
      if (stockChanges.deductions.materials && stockChanges.deductions.materials.length > 0) {
        setMaterials((prevMats) =>
          prevMats.map((mat) => {
            const item = stockChanges.deductions!.materials.find((d) => d.id === mat.id);
            if (!item) return mat;
            const remaining = Math.max(0, Number((mat.currentQuantity - item.amount).toFixed(2)));
            return { ...mat, currentQuantity: remaining, updatedAt: new Date().toISOString() };
          })
        );
      }
    }

    // 3. Handle stock additions if any (for purchases)
    if (stockChanges?.additions) {
      if (stockChanges.additions.oils && stockChanges.additions.oils.length > 0) {
        stockChanges.additions.oils.forEach((add) => {
          handleRestockOil(add.id, add.amount, add.cost);
        });
      }
      if (stockChanges.additions.materials && stockChanges.additions.materials.length > 0) {
        stockChanges.additions.materials.forEach((add) => {
          handleRestockMaterial(add.id, add.amount, add.cost);
        });
      }
    }

    // Realtime Supabase Cloud sync if online & configured
    if (newOrUpdated.type === 'sale') {
      syncInvoiceRealtime(newOrUpdated).catch((err) => {
        console.warn('Real-time Supabase sync notice:', err);
      });
    }
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  // ================= GENERAL SETTINGS & RESTORE =================
  const handleUpdateCurrency = (currency: string) => {
    setSettings((prev) => ({ ...prev, currency }));
  };

  const handleResetDefaults = () => {
    const res = resetAllToDefaults();
    setOils(res.oils);
    setMaterials(res.materials);
    setBatches(res.batches);
    setSettings(res.settings);
    setRecipes(res.recipes);
    setInvoices(res.invoices);
    setCart([]);
  };

  const handleImportData = (data: {
    oils: FragranceOil[];
    materials: RawMaterial[];
    batches: ProductionBatch[];
    settings?: AppSettings;
    recipes?: SavedRecipe[];
    invoices?: Invoice[];
  }) => {
    if (data.oils) setOils(data.oils);
    if (data.materials) setMaterials(data.materials);
    if (data.batches) setBatches(data.batches);
    if (data.settings) setSettings(data.settings);
    if (data.recipes) setRecipes(data.recipes);
    if (data.invoices) setInvoices(data.invoices);
  };

  const lowStockCount =
    oils.filter((o) => o.currentQuantity <= o.lowStockThreshold).length +
    materials.filter((m) => m.currentQuantity <= m.lowStockThreshold).length;

  const handleSelectPortal = (newPortal: 'customer' | 'admin') => {
    if (newPortal === 'admin') {
      if (!isAdminAuthenticated) {
        setPendingAdminTab('pos');
        setIsAdminAuthModalOpen(true);
        return;
      }
      setPortal('admin');
      setAdminTab('pos');
    } else {
      setPortal('customer');
      setActiveTab('store');
    }
  };

  const handleNavigateToTab = (tab: ActiveTab) => {
    if (tab === 'store') {
      setPortal('customer');
      setActiveTab('store');
    } else {
      if (!isAdminAuthenticated) {
        setPendingAdminTab(tab);
        setIsAdminAuthModalOpen(true);
        return;
      }
      setPortal('admin');
      setActiveTab(tab);
    }
  };

  const handleAdminAuthenticate = (enteredPassword: string): boolean => {
    const requiredPassword = settings.adminPassword || '1234';
    if (enteredPassword.trim() === requiredPassword.trim()) {
      setIsAdminAuthenticated(true);
      try {
        sessionStorage.setItem('nasamat_admin_auth', 'true');
      } catch (_) {}
      setIsAdminAuthModalOpen(false);
      setPortal('admin');
      if (pendingAdminTab) {
        setAdminTab(pendingAdminTab as AdminNavTab);
      } else {
        setAdminTab('pos');
      }
      setPendingAdminTab(null);
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem('nasamat_admin_auth');
    } catch (_) {}
    setPortal('customer');
    setActiveTab('store');
  };

  const handleGoHome = () => {
    setPortal('customer');
    setActiveTab('store');
    window.dispatchEvent(new CustomEvent('nasamat_go_home'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen bg-white text-black flex flex-col w-full max-w-full overflow-x-hidden ${language === 'ar' ? "font-['Almarai',sans-serif]" : "font-sans font-['Montserrat']"}`}>
      
      {/* Top Header */}
      <Header
        portal={portal}
        onSelectPortal={handleSelectPortal}
        onGoHome={handleGoHome}
        oils={oils}
        materials={materials}
        settings={settings}
        cartCount={cart.reduce((s, it) => s + it.quantity, 0)}
        customerUser={customerUser}
        onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
        onOpenCart={() => {
          setPortal('customer');
          setActiveTab('store');
          setIsCartOpen(true);
        }}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenSmartSearch={() => setIsSmartSearchOpen(true)}
        onResetDefaults={handleResetDefaults}
        onUpdateCurrency={handleUpdateCurrency}
        onToggleTheme={handleToggleTheme}
        onLogout={portal === 'admin' ? handleAdminLogout : undefined}
      />

      {/* ================= PORTAL 1: CUSTOMER BOUTIQUE ================= */}
      {portal === 'customer' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-6 lg:p-8">
          <StoreTab
            oils={oils}
            recipes={recipes}
            materials={materials}
            settings={settings}
            cart={cart}
            customerUser={customerUser}
            onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
            onUpdateCustomerUser={(u) => setCustomerUser(u)}
            onAddToCart={handleAddToCart}
            onUpdateCartQty={handleUpdateCartQty}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onConfirmOrder={handleConfirmStoreOrder}
            onViewInvoiceReceipt={(inv) => setSelectedReceiptInvoice(inv)}
            isCartOpen={isCartOpen}
            onCloseCart={() => setIsCartOpen(false)}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenAdmin={() => handleSelectPortal('admin')}
            onUpdateOil={handleUpdateOil}
            onUpdateRecipe={handleSaveRecipe}
            savingsBundles={savingsBundles}
            onUpdateSavingsBundles={handleUpdateSavingsBundles}
          />
        </main>
      )}

      {/* ================= PORTAL 2: ADMIN SIDEBAR & WORKSPACE (AS IN IMAGE) ================= */}
      {portal === 'admin' && (
        <div className="flex-1 flex w-full min-h-[calc(100vh-64px)]">
          {/* Vertical Admin Sidebar matching media_1795121443094_2b8f2dff.png */}
          {(!isPosSidebarCollapsed || adminTab !== 'pos') && (
            <AdminSidebar
              currentTab={adminTab}
              onSelectTab={(tab) => setAdminTab(tab)}
              onViewStorefront={() => handleSelectPortal('customer')}
              onLogout={handleAdminLogout}
              onOpenFinancialStatement={() => setIsFinancialStatementOpen(true)}
              lowStockCount={lowStockCount}
              ordersCount={invoices.length}
              productsCount={oils.length + recipes.length}
              customersCount={invoices.length}
              isMobileOpen={isMobileAdminSidebarOpen}
              onCloseMobile={() => setIsMobileAdminSidebarOpen(false)}
              currentStaff={currentStaff}
              onSwitchUser={() => setAdminTab('staff')}
            />
          )}

          {/* Admin Main Workspace Area */}
          <div className="flex-1 min-w-0 bg-[#fafafa] flex flex-col">
            {/* Admin Mobile Header Bar */}
            <div className="lg:hidden p-3 bg-white border-b border-neutral-200 flex items-center justify-between">
              <button
                onClick={() => setIsMobileAdminSidebarOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-bold"
              >
                <span>☰</span>
                <span>{language === 'ar' ? 'القائمة الجانبية' : 'Menu'}</span>
              </button>
              <div className="font-bold text-xs text-neutral-800">
                {language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Portal'}
              </div>
            </div>

            {/* Admin Workspace Navigation & Back Controls Bar */}
            <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                {adminTab !== 'pos' && (
                  <button
                    onClick={() => setAdminTab('pos')}
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    title={language === 'ar' ? 'الرجوع إلى نقطة البيع (POS)' : 'Back to POS Terminal'}
                  >
                    <span className="text-sm transition-transform group-hover:-translate-x-1">←</span>
                    <span>{language === 'ar' ? 'الرجوع لنقطة البيع (POS)' : 'Back to POS'}</span>
                  </button>
                )}
                <button
                  onClick={() => handleSelectPortal('customer')}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition cursor-pointer border border-neutral-200"
                  title={language === 'ar' ? 'معاينة متجر الزبائن الفاخر' : 'View Boutique Store'}
                >
                  <span>🛍️</span>
                  <span>{language === 'ar' ? 'معاينة المتجر' : 'Store'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{language === 'ar' ? 'جلسة الإدارة محمية ضد التخمين' : 'Protected Session'}</span>
                </span>
              </div>
            </div>

            {/* Dynamic Content Body based on selected Sidebar item */}
            <div className={`flex-1 overflow-y-auto ${
              adminTab === 'pos' 
                ? 'p-2 sm:p-3 lg:p-4 w-full max-w-none' 
                : 'p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto'
            }`}>
              
              {/* 1. POS Terminal (Item 1 in Sidebar) */}
              {adminTab === 'pos' && (
                <AdminPOSTerminalTab
                  oils={oils}
                  recipes={recipes}
                  settings={settings}
                  onSaveInvoice={handleSaveInvoice}
                  onViewInvoiceReceipt={(inv) => setSelectedReceiptInvoice(inv)}
                  onOpenBottleLabel={handleOpenBottleLabel}
                  isSidebarCollapsed={isPosSidebarCollapsed}
                  onToggleSidebar={() => setIsPosSidebarCollapsed((prev) => !prev)}
                  currentStaff={currentStaff}
                />
              )}

              {/* 2. Products & Individual Pricing (Item 3 in Sidebar - User Request) */}
              {adminTab === 'products' && (
                <AdminProductsPricingTab
                  oils={oils}
                  recipes={recipes}
                  settings={settings}
                  onUpdateOil={handleUpdateOil}
                  onUpdateRecipe={handleSaveRecipe}
                  onAddOil={handleAddOil}
                />
              )}

              {/* 3. Orders & Invoices (Item 2 in Sidebar) */}
              {adminTab === 'orders' && (
                <InvoicesTab
                  invoices={invoices}
                  oils={oils}
                  materials={materials}
                  recipes={recipes}
                  settings={settings}
                  onSaveInvoice={handleSaveInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                  onOpenBottleLabel={handleOpenBottleLabel}
                />
              )}

              {/* 4. Overview & Analytics (Item 5 in Sidebar) */}
              {adminTab === 'overview' && (
                <DashboardTab
                  oils={oils}
                  materials={materials}
                  batches={batches}
                  settings={settings}
                  onNavigateToTab={(tab) => {
                    if (tab === 'calculator') setAdminTab('calculator');
                    else if (tab === 'recipes') setAdminTab('recipes');
                    else if (tab === 'invoices') setAdminTab('orders');
                    else if (tab === 'materials') setAdminTab('suppliers');
                    else if (tab === 'catalog') setAdminTab('products');
                  }}
                  onUpdateSettings={setSettings}
                  onRestockOil={handleRestockOil}
                  onRestockMaterial={handleRestockMaterial}
                  onOpenBackup={() => setIsBackupOpen(true)}
                />
              )}

              {/* 5. Lab Formulation & Calculator */}
              {adminTab === 'calculator' && (
                <CalculatorTab
                  oils={oils}
                  materials={materials}
                  settings={settings}
                  recipes={recipes}
                  initialSelectedOilId={selectedOilForCalculator}
                  initialRecipe={selectedRecipeForCalculator}
                  onExecuteProduction={handleExecuteProduction}
                  onPrintRecipe={(batch) => setRecipeModalBatch(batch)}
                  onSaveRecipe={handleSaveRecipe}
                />
              )}

              {/* 6. Signature Recipes */}
              {adminTab === 'recipes' && (
                <RecipesTab
                  recipes={recipes}
                  oils={oils}
                  materials={materials}
                  settings={settings}
                  onFormulateRecipe={handleFormulateRecipe}
                  onSaveRecipe={handleSaveRecipe}
                  onDeleteRecipe={handleDeleteRecipe}
                />
              )}

              {/* 7. Suppliers & Raw Materials (Item 12 in Sidebar) */}
              {adminTab === 'suppliers' && (
                <MaterialsTab
                  materials={materials}
                  settings={settings}
                  onAddMaterial={handleAddMaterial}
                  onUpdateMaterial={handleUpdateMaterial}
                  onDeleteMaterial={handleDeleteMaterial}
                  onRestockMaterial={handleRestockMaterial}
                />
              )}

              {/* 8. Production Batches History */}
              {adminTab === 'batches' && (
                <BatchesTab
                  batches={batches}
                  settings={settings}
                  onDeleteBatch={handleDeleteBatch}
                  onPrintRecipe={(batch) => setRecipeModalBatch(batch)}
                />
              )}

              {/* 9. Dedicated CRM & Meta Ads Customers Page */}
              {adminTab === 'customers' && (
                <CrmCustomersTab
                  invoices={invoices}
                  settings={settings}
                  onUpdateSettings={setSettings}
                  onSelectTab={(t) => setAdminTab(t as any)}
                />
              )}

              {/* 10. Specialized Sidebar Modules (Coupons, Categories, Hero, Brands, Menu, Pixel, Staff, Settings) */}
              {['coupons', 'categories', 'hero-banner', 'brands', 'menu-builder', 'pixel', 'staff', 'settings'].includes(adminTab) && (
                <AdminModulesTab
                  module={adminTab as any}
                  oils={oils}
                  recipes={recipes}
                  invoices={invoices}
                  settings={settings}
                  onUpdateSettings={setSettings}
                  onOpenBackup={() => setIsBackupOpen(true)}
                  onResetDefaults={handleResetDefaults}
                  onSelectTab={(t) => setAdminTab(t as any)}
                  onOpenBottleLabel={handleOpenBottleLabel}
                  savingsBundles={savingsBundles}
                  onUpdateSavingsBundles={handleUpdateSavingsBundles}
                  currentStaff={currentStaff}
                  onUpdateCurrentStaff={handleSwitchStaff}
                  staffMembers={staffMembers}
                  onUpdateStaffMembers={handleUpdateStaffMembers}
                />
              )}

            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="no-print bg-white border-t border-neutral-200 py-4 px-6 text-center text-xs text-neutral-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
          {portal === 'customer' ? (
            <div className="flex items-center justify-center gap-2">
              <span
                onClick={handleFooterCopyrightClick}
                className="cursor-default select-none text-neutral-700 font-medium"
                title="نسمات للعطور الفاخرة — بيروت"
              >
                {t('footerCopy')}
              </span>
              <span
                onClick={handleFooterCopyrightClick}
                className="text-neutral-300 hover:text-neutral-400 cursor-pointer select-none text-sm px-1"
                title="·"
              >
                ·
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  ⚙️ {language === 'ar' ? 'جلسة الإدارة نشطة' : 'Admin Session Active'}
                </span>
                <span className="text-neutral-300">|</span>
                <button
                  onClick={() => handleSelectPortal('customer')}
                  className="hover:underline cursor-pointer font-bold text-neutral-700 hover:text-black"
                >
                  🛍️ {language === 'ar' ? 'معاينة متجر الزبائن' : 'Customer Store'}
                </button>
                <span className="text-neutral-300">·</span>
                <button
                  onClick={handleAdminLogout}
                  className="hover:underline cursor-pointer font-bold text-rose-600 hover:text-rose-800"
                >
                  🔒 {language === 'ar' ? 'قفل وخروج' : 'Lock & Exit'}
                </button>
              </div>
              <span className="text-neutral-500 font-medium text-[11px]">{t('footerAccuracy')}</span>
            </div>
          )}
        </div>
      </footer>

      {/* Modals */}
      {selectedReceiptInvoice && (
        <InvoiceReceiptModal
          invoice={selectedReceiptInvoice}
          settings={settings}
          onClose={() => setSelectedReceiptInvoice(null)}
        />
      )}

      <RecipeModal
        batch={recipeModalBatch}
        settings={settings}
        oils={oils}
        materials={materials}
        onClose={() => setRecipeModalBatch(null)}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        oils={oils}
        materials={materials}
        batches={batches}
        settings={settings}
        recipes={recipes}
        invoices={invoices}
        onImportData={handleImportData}
        onResetDefaults={handleResetDefaults}
      />

      {/* Admin Password Authentication Security Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => {
          setIsAdminAuthModalOpen(false);
          setPendingAdminTab(null);
        }}
        onAuthenticate={handleAdminAuthenticate}
      />

      {/* Customer Google/Apple Auth Modal */}
      <CustomerAuthModal
        isOpen={isCustomerAuthOpen}
        onClose={() => setIsCustomerAuthOpen(false)}
        currentUser={customerUser}
        onAuthSuccess={(user) => {
          setCustomerUser(user);
        }}
        onLogout={() => {
          setCustomerUser(null);
        }}
        customBlendsCount={loadCustomerBlends().filter(b => b.customerName?.toLowerCase() === customerUser?.name.toLowerCase()).length}
        ordersCount={invoices.filter(i => i.partyName?.toLowerCase() === customerUser?.name.toLowerCase()).length}
      />

      {/* Global Quick Search Modal */}
      <SmartSearchModal
        isOpen={isSmartSearchOpen}
        onClose={() => setIsSmartSearchOpen(false)}
        oils={oils}
        materials={materials}
        onSelectOilForCalculator={(oilId) => {
          setSelectedOilForCalculator(oilId);
          setActiveTab('calculator');
        }}
        onSelectOilForCatalog={(oilCode) => {
          setCatalogSearchTerm(oilCode);
          setActiveTab('catalog');
        }}
        onSelectMaterial={() => {
          setActiveTab('materials');
        }}
      />

      {/* Luxury Perfume Bottle Sticker Label Modal */}
      <BottleLabelModal
        isOpen={isBottleLabelOpen}
        onClose={() => setIsBottleLabelOpen(false)}
        initialData={selectedBottleLabelData}
      />

      {/* Manager Daily & Monthly Financial Statement & Audit Reconciliation Modal */}
      {isFinancialStatementOpen && (
        <AdminFinancialStatementModal
          isOpen={isFinancialStatementOpen}
          onClose={() => setIsFinancialStatementOpen(false)}
          invoices={invoices}
          settings={settings}
          isAdminAuthenticated={isAdminAuthenticated}
        />
      )}

      {/* AI Perfume Sommelier & Concierge Modal (Levels 1-5 Architecture) */}
      <AiSommelierModal
        isOpen={isAiSommelierOpen}
        onClose={() => setIsAiSommelierOpen(false)}
        oils={oils}
        recipes={recipes}
        settings={settings}
        onAddToCart={handleAddToCart}
      />

      {/* PWA Install on Desktop & Mobile Manager */}
      <PwaInstallPrompt />

      {/* Floating AI Perfume Sommelier Concierge Trigger (Level 5 Agent) */}
      {portal === 'customer' && (
        <div className="fixed bottom-6 end-5 z-40">
          <button
            type="button"
            onClick={() => setIsAiSommelierOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-black hover:bg-neutral-900 text-amber-400 font-black text-xs shadow-2xl shadow-black/80 hover:scale-105 active:scale-95 transition-all duration-300 border border-amber-400/60 cursor-pointer"
            title={language === 'ar' ? 'استشر خبير ومستشار نسمات الذكي (AI Sommelier)' : 'Ask Nasamat AI Sommelier'}
            aria-label="AI Perfume Sommelier"
          >
            <div className="w-6 h-6 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <span className="font-extrabold tracking-wide text-amber-300">
              {language === 'ar' ? 'خبير نسمات الذكي' : 'AI Sommelier'}
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        </div>
      )}

      {/* Floating Official Luxury Social Media Suite (WhatsApp, Instagram, Facebook) */}
      {portal === 'customer' && (
        <div className="fixed bottom-5 start-5 z-40 flex flex-col items-center gap-2.5">
          {/* Secondary Official Badges: Facebook */}
          <a
            href={formatSocialUrl(settings.facebookUrl, 'facebook')}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook Page"
            title={language === 'ar' ? 'صفحة فيسبوك الرسمية' : 'Official Facebook Page'}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center bg-white hover:scale-115 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer border border-neutral-200"
          >
            <FacebookOfficialBadge className="w-11 h-11 sm:w-12 sm:h-12" />
          </a>

          {/* Secondary Official Badges: Instagram */}
          <a
            href={formatSocialUrl(settings.instagramUrl, 'instagram')}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram Profile"
            title={language === 'ar' ? 'حساب إنستغرام الرسمي' : 'Official Instagram Profile'}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-white hover:scale-115 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer border border-neutral-200"
          >
            <InstagramOfficialBadge className="w-11 h-11 sm:w-12 sm:h-12" />
          </a>

          {/* Primary Official WhatsApp Concierge Button */}
          <a
            href={`https://wa.me/${formatWhatsAppPhone(settings.storePhone)}?text=${encodeURIComponent(
              language === 'ar'
                ? 'مرحباً نسمات، أود التواصل والاستفسار بخصوص عطوركم الفاخرة.'
                : 'Hello Nasamat, I would like to inquire about your luxury perfumes.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact via WhatsApp"
            title={language === 'ar' ? 'تواصل فوري عبر واتساب' : 'Chat via WhatsApp'}
            className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer drop-shadow-2xl"
          >
            {/* Concentric Aura Rings */}
            <div className="pulse-ring-aura" />
            <div className="pulse-ring-aura-secondary" />

            {/* Official WhatsApp Logo SVG */}
            <WhatsAppOfficialIcon className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 group-hover:rotate-6 transition-transform filter drop-shadow-lg" />

            {/* Online Indicator Badge */}
            <span className="absolute top-0 end-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-xs"></span>
            </span>
          </a>
        </div>
      )}

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
