import type { 
  FragranceOil, 
  RawMaterial, 
  ProductionBatch, 
  AppSettings, 
  SavedRecipe, 
  Invoice, 
  CartItem, 
  CategoryNavConfig, 
  CustomerCustomBlend,
  CustomerUser,
  TrackingPixelSettings,
  CRMActivityLog,
  SavingsBundle,
  CrmLeadRecord
} from '../types';
import { INITIAL_OILS, INITIAL_RAW_MATERIALS, INITIAL_BATCHES, INITIAL_SETTINGS, INITIAL_RECIPES, INITIAL_INVOICES } from '../data/initialData';

const STORAGE_KEYS = {
  OILS: 'nasamat_oils_v5',
  MATERIALS: 'nasamat_materials_v3',
  BATCHES: 'nasamat_batches_v2',
  SETTINGS: 'nasamat_settings_v2',
  RECIPES: 'nasamat_recipes_v1',
  INVOICES: 'nasamat_invoices_v1',
  CART: 'nasamat_cart_v1',
  NAV_CATEGORIES: 'nasamat_nav_categories_v2',
  CUSTOMER_BLENDS: 'nasamat_customer_blends_v1',
  CUSTOMER_USER: 'nasamat_customer_user_v1',
  SAVED_DELIVERY: 'nasamat_saved_delivery_v1',
  SAVINGS_BUNDLES: 'nasamat_savings_bundles_v1',
  CRM_NOTES: 'nasamat_crm_notes_v1',
  CRM_ACTIVITY: 'nasamat_crm_activity_v1',
  CRM_LEADS: 'nasamat_crm_leads_v2',
  CRM_DELETED_LEADS: 'nasamat_crm_deleted_leads_v1',
  PIXEL_SETTINGS: 'nasamat_pixel_settings_v1',
  PIXEL_EVENTS_LOG: 'nasamat_pixel_events_log_v1',
};

export const INITIAL_NAV_CATEGORIES: CategoryNavConfig[] = [
  {
    id: 'home',
    labelAr: 'الرئيسية واكتشف',
    labelEn: 'Discover & Home',
    imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80',
    countAr: 'نسمات بيروت',
    countEn: 'Beirut Atelier',
  },
  {
    id: 'all',
    labelAr: 'كل العطور',
    labelEn: 'All Scents',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80',
    countAr: '',
    countEn: '',
  },
  {
    id: 'men',
    labelAr: 'عطور رجالية',
    labelEn: "Men's Perfume",
    imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=300&q=80',
    countAr: '',
    countEn: '',
  },
  {
    id: 'women',
    labelAr: 'عطور نسائية',
    labelEn: "Women's Perfume",
    imageUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=300&q=80',
    countAr: '',
    countEn: '',
  },
  {
    id: 'unisex',
    labelAr: 'للجنسين ونيش',
    labelEn: 'Unisex & Niche',
    imageUrl: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=300&q=80',
    countAr: '',
    countEn: '',
  },
  {
    id: 'signatures',
    labelAr: 'خلطات ملكية',
    labelEn: 'Royal Blends',
    imageUrl: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=300&q=80',
    countAr: '',
    countEn: '',
  },
  {
    id: 'oriental',
    labelAr: 'عطور شرقية وعود',
    labelEn: 'Oriental & Royal Oud',
    imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80',
    countAr: '',
    countEn: '',
  },
  {
    id: 'musk',
    labelAr: 'مسك الطهارة والبودرة',
    labelEn: 'Musk & Powder Collection',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80',
    countAr: '',
    countEn: '',
  },
  {
    id: 'home_linen',
    labelAr: 'معطرات جو ومفارش',
    labelEn: 'Home & Linen Atmosphere',
    imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=300&q=80',
    countAr: '',
    countEn: '',
  },
  {
    id: 'bakhoor',
    labelAr: 'بخور ومباخر ملكية',
    labelEn: 'Bakhoor & Royal Incense',
    imageUrl: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=300&q=80',
    countAr: 'تشكيلة فاخرة',
    countEn: 'Royal Collection',
  },
  {
    id: 'mix-perfume',
    labelAr: 'ركّب عطرك',
    labelEn: 'Mix Perfume',
    imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=300&q=80',
    countAr: 'مختبر تفاعلي',
    countEn: 'Bespoke Lab',
  },
  {
    id: 'bundles',
    labelAr: 'باقات التوفير',
    labelEn: 'Bundles',
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=300&q=80',
    countAr: 'شحن مجاني',
    countEn: 'Free Delivery',
  },
  {
    id: 'atelier',
    labelAr: 'قصة الدار والمختبر',
    labelEn: 'Atelier Story',
    imageUrl: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=300&q=80',
    countAr: 'حرفية بيروت',
    countEn: 'Beirut Atelier',
  },
  {
    id: 'delivery',
    labelAr: 'التوصيل والدفع',
    labelEn: 'Delivery & COD',
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80',
    countAr: 'كل لبنان',
    countEn: 'Lebanon Wide',
  },
];

export const LUXURY_PRESET_IMAGES = [
  { name: 'عطر كلاسيكي ملكي', nameEn: 'Royal Classic Flacon', url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
  { name: 'عطر ذهبي فاخر', nameEn: 'Luxury Gold Perfume', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80' },
  { name: 'عطور رجالية سوداء', nameEn: 'Flacon Noir Masculin', url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80' },
  { name: 'عطور نسائية وردية', nameEn: 'Rose Blush Feminine', url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=600&q=80' },
  { name: 'عطور نيش شفافة', nameEn: 'Crystal Niche Flacon', url: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=600&q=80' },
  { name: 'مختبر وتركيب العطور', nameEn: 'Artisan Perfume Atelier', url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80' },
  { name: 'باقات هدايا وتوفير', nameEn: 'Luxury Gift Sets', url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' },
  { name: 'توصيل سريع وطرود', nameEn: 'Express Delivery Parcels', url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80' },
  { name: 'عود وعنبر ملكي', nameEn: 'Royal Oud & Amber', url: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=600&q=80' },
  { name: 'عطر زمردي وأخضر', nameEn: 'Emerald Green Flacon', url: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=600&q=80' },
  { name: 'زهور وبساتين غراس', nameEn: 'Grasse French Florals', url: 'https://images.unsplash.com/photo-1583445013765-46c20c4a6772?auto=format&fit=crop&w=600&q=80' },
  { name: 'بخاخ ذهبي أنتيك', nameEn: 'Antique Gold Sprayer', url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=600&q=80' },
];

export function loadNavCategories(): CategoryNavConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NAV_CATEGORIES);
    if (raw) {
      const saved: CategoryNavConfig[] = JSON.parse(raw);
      // Auto-strip product count numbers from countAr / countEn for clean luxury UI
      saved.forEach((c) => {
        if (c.countAr && /\d+/.test(c.countAr)) c.countAr = '';
        if (c.countEn && /\d+/.test(c.countEn)) c.countEn = '';
      });
      // Auto-merge any missing default categories while preserving custom edits
      const existingIds = new Set(saved.map((c) => c.id));
      const missing = INITIAL_NAV_CATEGORIES.filter((c) => !existingIds.has(c.id));
      if (missing.length > 0) {
        const merged = [...saved, ...missing];
        saveNavCategories(merged);
        return merged;
      }
      return saved;
    }
    return INITIAL_NAV_CATEGORIES;
  } catch (e) {
    console.error('Failed to load nav categories', e);
    return INITIAL_NAV_CATEGORIES;
  }
}

export function saveNavCategories(categories: CategoryNavConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NAV_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save nav categories', e);
  }
}

export function loadOils(): FragranceOil[] {
  try {
    const rawV5 = localStorage.getItem(STORAGE_KEYS.OILS);
    if (rawV5) {
      const list: FragranceOil[] = JSON.parse(rawV5);
      return list.map((o) => {
        let img = o.imageUrl;
        // Fix old generic images
        if (o.code === 'NAS-003' && img && img.includes('photo-1523293182086-7651a899d37f')) {
          img = 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80'; // Creed Aventus smoky niche flacon
        } else if (o.code === 'NAS-001' && img && img.includes('photo-1523293182086-7651a899d37f')) {
          img = 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=600&q=80'; // Sauvage dark obsidian flacon
        } else if (o.code === 'NAS-040' && img && img.includes('photo-1595425970377-c9703cf48b6d')) {
          img = 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80'; // Baccarat Rouge gold amber crystal
        } else if (img && img.includes('photo-1615397349754-cfa2066a298e')) {
          img = 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80'; // Luxury gold flacon instead of cosmetic tube
        }
        return {
          ...o,
          imageUrl: img,
          retailPrice30ml: o.retailPrice30ml !== undefined ? Number(o.retailPrice30ml) : 5,
          retailPrice50ml: o.retailPrice50ml !== undefined ? Number(o.retailPrice50ml) : 7,
          retailPrice100ml: o.retailPrice100ml !== undefined ? Number(o.retailPrice100ml) : 12,
          wholesalePrice50ml: o.wholesalePrice50ml !== undefined ? Number(o.wholesalePrice50ml) : 4.5,
        };
      });
    }

    // Migrate to retail prices: 30ml = $5, 50ml = $7, 100ml = $12, wholesale 50ml = $4.5
    const rawOld = 
      localStorage.getItem('nasamat_oils_v4') || 
      localStorage.getItem('nasamat_oils_v3') || 
      localStorage.getItem('nasamat_oils_v2');
      
    if (rawOld) {
      const list: FragranceOil[] = JSON.parse(rawOld);
      const migrated = list.map((o) => ({
        ...o,
        retailPrice30ml: 5,
        retailPrice50ml: 7,
        retailPrice100ml: 12,
        wholesalePrice50ml: 4.5,
      }));
      localStorage.setItem(STORAGE_KEYS.OILS, JSON.stringify(migrated));
      return migrated;
    }

    return INITIAL_OILS;
  } catch (e) {
    console.error('Failed to load oils from storage', e);
    return INITIAL_OILS;
  }
}

export function saveOils(oils: FragranceOil[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.OILS, JSON.stringify(oils));
  } catch (e) {
    console.error('Failed to save oils to storage', e);
  }
}

export function loadMaterials(): RawMaterial[] {
  try {
    const rawV3 = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    if (rawV3) return JSON.parse(rawV3);

    const rawV2 = localStorage.getItem('nasamat_materials_v2');
    if (rawV2) {
      const v2List: RawMaterial[] = JSON.parse(rawV2);
      const initialMap = new Map(INITIAL_RAW_MATERIALS.map((m) => [m.id, m]));
      const migrated = v2List.map((m) => {
        const init = initialMap.get(m.id);
        return {
          ...m,
          imageUrl: m.imageUrl || init?.imageUrl,
        };
      });
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(migrated));
      return migrated;
    }

    return INITIAL_RAW_MATERIALS;
  } catch (e) {
    console.error('Failed to load materials from storage', e);
    return INITIAL_RAW_MATERIALS;
  }
}

export function saveMaterials(materials: RawMaterial[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  } catch (e) {
    console.error('Failed to save materials to storage', e);
  }
}

export function loadBatches(): ProductionBatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BATCHES);
    if (!raw) return INITIAL_BATCHES;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load batches from storage', e);
    return INITIAL_BATCHES;
  }
}

export function saveBatches(batches: ProductionBatch[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  } catch (e) {
    console.error('Failed to save batches to storage', e);
  }
}

export const PERMANENT_KEYS = {
  PHONE: 'nasamat_permanent_phone',
  FACEBOOK: 'nasamat_permanent_facebook',
  INSTAGRAM: 'nasamat_permanent_instagram',
  STORE_NAME: 'nasamat_permanent_store_name',
  STORE_LOCATION: 'nasamat_permanent_store_location',
  STORE_BIO: 'nasamat_permanent_store_bio',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed: Partial<AppSettings> = raw ? JSON.parse(raw) : {};

    // Dedicated permanent overrides: never lose or revert user settings
    const permPhone = localStorage.getItem(PERMANENT_KEYS.PHONE);
    const permFacebook = localStorage.getItem(PERMANENT_KEYS.FACEBOOK);
    const permInstagram = localStorage.getItem(PERMANENT_KEYS.INSTAGRAM);
    const permStoreName = localStorage.getItem(PERMANENT_KEYS.STORE_NAME);
    const permStoreLocation = localStorage.getItem(PERMANENT_KEYS.STORE_LOCATION);
    const permStoreBio = localStorage.getItem(PERMANENT_KEYS.STORE_BIO);

    // Resolve storePhone: if permPhone exists, use it. If parsed has old placeholder, upgrade to permPhone or real phone
    let storePhone = permPhone || parsed.storePhone || INITIAL_SETTINGS.storePhone;
    if (storePhone === '+961 70 000 000' || storePhone === '70000000') {
      storePhone = permPhone || '+961 81 713 408';
    }

    const facebookUrl = (permFacebook !== null && permFacebook.trim() !== '') 
      ? permFacebook 
      : (parsed.facebookUrl?.trim() ? parsed.facebookUrl : INITIAL_SETTINGS.facebookUrl);
    const instagramUrl = (permInstagram !== null && permInstagram.trim() !== '') 
      ? permInstagram 
      : (parsed.instagramUrl?.trim() ? parsed.instagramUrl : INITIAL_SETTINGS.instagramUrl);
    const storeName = permStoreName || parsed.storeName || INITIAL_SETTINGS.storeName;
    const storeLocation = permStoreLocation || parsed.storeLocation || INITIAL_SETTINGS.storeLocation;
    const storeBio = permStoreBio || parsed.storeBio || INITIAL_SETTINGS.storeBio;

    return {
      ...INITIAL_SETTINGS,
      ...parsed,
      storeName,
      storePhone,
      storeLocation,
      storeBio,
      facebookUrl,
      instagramUrl,
      theme: parsed.theme || 'light',
      adminPassword: parsed.adminPassword || '1234',
      adminSecretSlug: parsed.adminSecretSlug || 'nasmat-vault-77',
      lbpRate: parsed.lbpRate === 89500 || !parsed.lbpRate ? 90000 : parsed.lbpRate,
    };
  } catch (e) {
    console.error('Failed to load settings from storage', e);
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

    // Also persist permanently into immutable backup keys
    if (settings.storePhone && settings.storePhone !== '+961 70 000 000') {
      localStorage.setItem(PERMANENT_KEYS.PHONE, settings.storePhone.trim());
    }
    if (settings.facebookUrl !== undefined) {
      localStorage.setItem(PERMANENT_KEYS.FACEBOOK, settings.facebookUrl.trim());
    }
    if (settings.instagramUrl !== undefined) {
      localStorage.setItem(PERMANENT_KEYS.INSTAGRAM, settings.instagramUrl.trim());
    }
    if (settings.storeName) {
      localStorage.setItem(PERMANENT_KEYS.STORE_NAME, settings.storeName.trim());
    }
    if (settings.storeLocation) {
      localStorage.setItem(PERMANENT_KEYS.STORE_LOCATION, settings.storeLocation.trim());
    }
    if (settings.storeBio) {
      localStorage.setItem(PERMANENT_KEYS.STORE_BIO, settings.storeBio.trim());
    }

    // Broadcast update event so all open views / components re-render immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nasamat_settings_updated', { detail: settings }));
    }
  } catch (e) {
    console.error('Failed to save settings to storage', e);
  }
}

export function loadRecipes(): SavedRecipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECIPES);
    if (!raw) return INITIAL_RECIPES;
    const list: SavedRecipe[] = JSON.parse(raw);
    return list.map((r) => {
      let img = r.imageUrl;
      if (!img || img.includes('photo-1615397349754-cfa2066a298e')) {
        img = 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80';
      }
      return {
        ...r,
        imageUrl: img,
        suggestedRetailPrice: r.suggestedRetailPrice !== undefined ? Number(r.suggestedRetailPrice) : 7,
        retailPrice30ml: r.retailPrice30ml !== undefined ? Number(r.retailPrice30ml) : 5,
        retailPrice50ml: r.retailPrice50ml !== undefined ? Number(r.retailPrice50ml) : (r.suggestedRetailPrice || 7),
        retailPrice100ml: r.retailPrice100ml !== undefined ? Number(r.retailPrice100ml) : 12,
        wholesalePrice50ml: r.wholesalePrice50ml !== undefined ? Number(r.wholesalePrice50ml) : 4.5,
      };
    });
  } catch (e) {
    console.error('Failed to load recipes from storage', e);
    return INITIAL_RECIPES;
  }
}

export function saveRecipes(recipes: SavedRecipe[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  } catch (e) {
    console.error('Failed to save recipes to storage', e);
  }
}

export function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!raw) return INITIAL_INVOICES;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load invoices from storage', e);
    return INITIAL_INVOICES;
  }
}

export function saveInvoices(invoices: Invoice[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  } catch (e) {
    console.error('Failed to save invoices to storage', e);
  }
}

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load cart from storage', e);
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  } catch (e) {
    console.error('Failed to save cart to storage', e);
  }
}

export const INITIAL_CUSTOMER_BLENDS: CustomerCustomBlend[] = [
  {
    id: 'blend-royal-01',
    name: 'خلطة الملوك الخاصة',
    customerName: 'الأستاذ وسام حيدر',
    sizeMl: 50,
    totalOilMl: 12.5,
    alcoholMl: 37.5,
    concentrationPercent: 25,
    ingredients: [
      {
        oilId: 'oil-1',
        oilName: 'أفنتوس رويال',
        oilCode: 'NAS-001',
        oilBrand: 'العالمية',
        percentage: 60,
        ml: 7.5,
      },
      {
        oilId: 'oil-2',
        oilName: 'باكارات روج 540',
        oilCode: 'NAS-002',
        oilBrand: 'العالمية',
        percentage: 40,
        ml: 5.0,
      },
    ],
    totalPrice: 8.0,
    notes: 'الحجم: 50 ملل (إكستري) • إجمالي الزيت: 12.5 ملل • كحول: 37.5 ملل\n• أفنتوس رويال [NAS-001]: 7.5 ملل (60%)\n• باكارات روج 540 [NAS-002]: 5.0 ملل (40%)',
    createdAt: new Date().toISOString(),
  },
];

export function loadCustomerBlends(): CustomerCustomBlend[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMER_BLENDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_BLENDS, JSON.stringify(INITIAL_CUSTOMER_BLENDS));
      return INITIAL_CUSTOMER_BLENDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return INITIAL_CUSTOMER_BLENDS;
  } catch (e) {
    console.error('Failed to load customer blends from storage', e);
    return INITIAL_CUSTOMER_BLENDS;
  }
}

export function saveCustomerBlends(blends: CustomerCustomBlend[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_BLENDS, JSON.stringify(blends));
  } catch (e) {
    console.error('Failed to save customer blends to storage', e);
  }
}

export function resetAllToDefaults(): {
  oils: FragranceOil[];
  materials: RawMaterial[];
  batches: ProductionBatch[];
  settings: AppSettings;
  recipes: SavedRecipe[];
  invoices: Invoice[];
} {
  // Preserve custom phone and social media links so store contact info is NEVER wiped
  const currentSettings = loadSettings();
  const preservedSettings: AppSettings = {
    ...INITIAL_SETTINGS,
    storePhone: currentSettings.storePhone || INITIAL_SETTINGS.storePhone,
    facebookUrl: currentSettings.facebookUrl || INITIAL_SETTINGS.facebookUrl,
    instagramUrl: currentSettings.instagramUrl || INITIAL_SETTINGS.instagramUrl,
    storeName: currentSettings.storeName || INITIAL_SETTINGS.storeName,
    storeLocation: currentSettings.storeLocation || INITIAL_SETTINGS.storeLocation,
    storeBio: currentSettings.storeBio || INITIAL_SETTINGS.storeBio,
  };

  localStorage.setItem(STORAGE_KEYS.OILS, JSON.stringify(INITIAL_OILS));
  localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(INITIAL_RAW_MATERIALS));
  localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(INITIAL_BATCHES));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(preservedSettings));
  localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(INITIAL_RECIPES));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
  return {
    oils: INITIAL_OILS,
    materials: INITIAL_RAW_MATERIALS,
    batches: INITIAL_BATCHES,
    settings: preservedSettings,
    recipes: INITIAL_RECIPES,
    invoices: INITIAL_INVOICES,
  };
}

export function exportDatabaseBackup(data: {
  oils: FragranceOil[];
  materials: RawMaterial[];
  batches: ProductionBatch[];
  settings: AppSettings;
  recipes?: SavedRecipe[];
  invoices?: Invoice[];
}) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `nasamat_perfume_backup_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportOilsToCsv(oils: FragranceOil[], currency: string) {
  const headers = [
    'اسم الزيت',
    'الكود',
    'الشركة / المصدر',
    'العائلة العطرية',
    'الكثافة (جم/مل)',
    'سعر الشراء الإجمالي',
    'الكمية الابتدائية (مل)',
    'الكمية المتبقية (مل)',
    `سعر التكلفة لكل مل (${currency})`,
    `سعر بيع 30 مل (${currency})`,
    `سعر بيع 50 مل (${currency})`,
    `سعر بيع 100 مل (${currency})`,
    `سعر جملة 50 مل (${currency})`,
    'ملاحظات'
  ];
  const rows = oils.map(o => [
    `"${o.name}"`,
    `"${o.code}"`,
    `"${o.brand}"`,
    `"${o.family}"`,
    o.density,
    o.costPrice,
    o.initialQuantity,
    o.currentQuantity,
    o.unitCost,
    o.retailPrice30ml || 5,
    o.retailPrice50ml || 7,
    o.retailPrice100ml || 12,
    o.wholesalePrice50ml || 4.5,
    `"${o.notes || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nasamat_fragrance_oils_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Customer User Auth storage
export function loadCustomerUser(): CustomerUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMER_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCustomerUser(user: CustomerUser): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save customer user', e);
  }
}

export function clearCustomerUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_USER);
  } catch (e) {
    console.error('Failed to clear customer user', e);
  }
}

export interface SavedDeliveryDetails {
  name?: string;
  phone?: string;
  city?: string;
  address?: string;
  notes?: string;
}

export function loadSavedDeliveryDetails(): SavedDeliveryDetails | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_DELIVERY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSavedDeliveryDetails(details: SavedDeliveryDetails): void {
  try {
    const existing = loadSavedDeliveryDetails() || {};
    const merged = { ...existing, ...details };
    localStorage.setItem(STORAGE_KEYS.SAVED_DELIVERY, JSON.stringify(merged));
  } catch (e) {
    console.error('Failed to save delivery details', e);
  }
}

/**
 * Updates customer user with new delivery address and phone,
 * persisting both in the user object and in local delivery cache.
 */
export function updateCustomerDeliveryInfo(
  updates: { phone?: string; address?: string; city?: string; notes?: string }
): CustomerUser | null {
  try {
    const user = loadCustomerUser();
    if (user) {
      const updatedUser: CustomerUser = {
        ...user,
        phone: updates.phone !== undefined ? updates.phone.trim() : user.phone,
        savedAddress: updates.address !== undefined ? updates.address.trim() : user.savedAddress,
        savedCity: updates.city !== undefined ? updates.city.trim() : user.savedCity,
        savedNotes: updates.notes !== undefined ? updates.notes.trim() : user.savedNotes,
      };
      saveCustomerUser(updatedUser);
      saveSavedDeliveryDetails({
        name: updatedUser.name,
        phone: updatedUser.phone,
        city: updatedUser.savedCity,
        address: updatedUser.savedAddress,
        notes: updatedUser.savedNotes,
      });
      return updatedUser;
    } else {
      saveSavedDeliveryDetails(updates);
      return null;
    }
  } catch (e) {
    console.error('Failed to update customer delivery info', e);
    return null;
  }
}

// CRM Merchant Notes on customers (keyed by customer key/name)
export function loadCRMNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_NOTES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCRMNotes(notes: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_NOTES, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save CRM notes', e);
  }
}

// Initial Realistic Leads matching the StyLuxe CRM & Meta Ads screenshot
export const INITIAL_CRM_LEADS: CrmLeadRecord[] = [
  {
    id: 'lead-216',
    leadNumber: 216,
    name: 'KATIA FRANGI',
    phone: '+961 34 582 31',
    genderCategory: 'WOMEN',
    source: 'CTWA',
    adCampaign: 'Meta Extrait Women Glamour',
    status: 'NEW',
    date: '21/11/2026',
    time: '19:23',
    segment: 'new',
    ordersCount: 0,
    totalSpent: 0,
    customBlendsCount: 0,
    city: 'Beirut',
    notes: 'تواصلت عبر إعلان واتساب CTWA - مهتمة بعطور الفانيليا والعود الناعم'
  },
  {
    id: 'lead-215',
    leadNumber: 215,
    name: 'HADO',
    phone: '+961 71 333 614',
    genderCategory: 'WOMEN',
    source: 'WA',
    status: 'NEW',
    date: '21/11/2026',
    time: '18:16',
    segment: 'new',
    ordersCount: 0,
    totalSpent: 0,
    customBlendsCount: 0,
    city: 'Tripoli',
    notes: 'استفسار عن أسعار باقات التوفير 3 زجاجات 50 ملل'
  },
  {
    id: 'lead-214',
    leadNumber: 214,
    name: 'AYA',
    phone: '+961 71 045 037',
    genderCategory: 'WOMEN',
    source: 'CTWA',
    adCampaign: 'Instagram Stories Bestsellers',
    status: 'NEW',
    date: '21/11/2026',
    time: '17:13',
    segment: 'new',
    ordersCount: 0,
    totalSpent: 0,
    customBlendsCount: 0,
    city: 'Saida',
    notes: 'طلبت تجربة مسك الطهارة والبودرة'
  },
  {
    id: 'lead-213',
    leadNumber: 213,
    name: 'M',
    phone: '+961 81 695 876',
    genderCategory: 'WOMEN',
    source: 'CTWA',
    status: 'NEW',
    date: '21/11/2026',
    time: '16:55',
    segment: 'new',
    ordersCount: 0,
    totalSpent: 0,
    customBlendsCount: 0,
    city: 'Jounieh',
    notes: 'إعلان فيسبوك - تريد بكج إهداء فخم مع كرت خاص'
  },
  {
    id: 'lead-212',
    leadNumber: 212,
    name: 'HANADI YEHYA',
    phone: '+961 34 723 58',
    genderCategory: 'WOMEN',
    source: 'ADS',
    adCampaign: 'Meta Feed Conversion Campaign',
    status: 'NEW',
    date: '21/11/2026',
    time: '16:46',
    segment: 'new',
    ordersCount: 0,
    totalSpent: 0,
    customBlendsCount: 0,
    city: 'Beirut',
    notes: 'تفضل العطور الزهرية الفرنسية'
  },
  {
    id: 'lead-211',
    leadNumber: 211,
    name: 'C',
    phone: '+961 79 466 582',
    genderCategory: 'WOMEN',
    source: 'WA',
    status: 'NEW',
    date: '21/11/2026',
    time: '13:03',
    segment: 'new',
    ordersCount: 0,
    totalSpent: 0,
    customBlendsCount: 0,
    city: 'Byblos'
  },
  {
    id: 'lead-210',
    leadNumber: 210,
    name: 'R',
    phone: '+961 34 212 39',
    genderCategory: 'WOMEN',
    source: 'CTWA',
    adCampaign: 'Meta Reel Video Ad',
    status: 'NEW',
    date: '21/11/2026',
    time: '11:26',
    segment: 'new',
    ordersCount: 0,
    totalSpent: 0,
    customBlendsCount: 0,
    city: 'Beirut'
  },
  {
    id: 'lead-209',
    leadNumber: 209,
    name: 'JD',
    phone: '+961 78 805 938',
    genderCategory: 'WOMEN',
    source: 'WA',
    status: 'NEW',
    date: '21/11/2026',
    time: '10:31',
    segment: 'new',
    ordersCount: 0,
    totalSpent: 0,
    customBlendsCount: 0,
    city: 'Zahle'
  },
  {
    id: 'lead-208',
    leadNumber: 208,
    name: 'RAZAN',
    phone: '+961 30 663 40',
    genderCategory: 'WOMEN',
    source: 'CTWA',
    status: 'NEW',
    date: '21/11/2026',
    time: '10:17',
    segment: 'new',
    ordersCount: 0,
    totalSpent: 0,
    customBlendsCount: 0,
    city: 'Chouf'
  },
  {
    id: 'lead-207',
    leadNumber: 207,
    name: 'DARINE',
    phone: '+961 70 928 672',
    genderCategory: 'WOMEN',
    source: 'CTWA',
    status: 'NEW',
    date: '21/11/2026',
    time: '09:32',
    segment: 'new',
    ordersCount: 0,
    totalSpent: 0,
    customBlendsCount: 0,
    city: 'Beirut'
  },
  {
    id: 'lead-206',
    leadNumber: 206,
    name: 'DANA ASHKAR',
    phone: '+961 76 391 106',
    genderCategory: 'WOMEN',
    source: 'ADS',
    status: 'NEW',
    date: '21/11/2026',
    time: '09:11',
    segment: 'new',
    ordersCount: 0,
    totalSpent: 0,
    customBlendsCount: 0,
    city: 'Beirut'
  }
];

export function loadCrmLeads(): CrmLeadRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_LEADS);
    const parsed = raw ? JSON.parse(raw) : INITIAL_CRM_LEADS;
    const isSupplierOrInvalid = (name: string) => {
      const k = (name || '').toLowerCase();
      return k.includes('لوزي') || k.includes('luzi') || k.includes('قوارير') || k.includes('الشرق') || k.includes('مورد');
    };
    const baseList = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CRM_LEADS;
    const cleaned = baseList.filter((l) => !isSupplierOrInvalid(l.name));
    if (!raw || cleaned.length !== (Array.isArray(parsed) ? parsed.length : 0)) {
      saveCrmLeads(cleaned);
    }
    return cleaned;
  } catch (e) {
    console.error('Failed to load CRM leads', e);
    return INITIAL_CRM_LEADS;
  }
}

export function saveCrmLeads(leads: CrmLeadRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_LEADS, JSON.stringify(leads));
    window.dispatchEvent(new CustomEvent('nasamat_crm_leads_updated'));
  } catch (e) {
    console.error('Failed to save CRM leads', e);
  }
}

// CRM Activity Log
export function loadCRMActivity(): CRMActivityLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_ACTIVITY);
    return raw ? JSON.parse(raw) : [
      {
        id: 'act-init-1',
        customerName: 'وسام حيدر',
        type: 'blend_created',
        description: 'قام بتركيب خلطة مخصصة 50 ملل (خلطة الملوك الملكية)',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'act-init-2',
        customerName: 'سارة خليل',
        type: 'login',
        description: 'تسجيل الدخول عبر Google من هاتف محمول',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      }
    ];
  } catch {
    return [];
  }
}

export function logCRMActivity(activity: Omit<CRMActivityLog, 'id' | 'timestamp'>): void {
  try {
    const existing = loadCRMActivity();
    const entry: CRMActivityLog = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [entry, ...existing].slice(0, 50); // Keep last 50 activities
    localStorage.setItem(STORAGE_KEYS.CRM_ACTIVITY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nasamat_crm_activity_updated'));
  } catch (e) {
    console.error('Failed to log CRM activity', e);
  }
}

// Pixel Events Log (for Admin Live Diagnostics)
export interface PixelEventRecord {
  id: string;
  eventName: string;
  platform: 'Meta' | 'TikTok' | 'Snapchat' | 'Google' | 'All';
  data: any;
  timestamp: string;
}

export function loadPixelEventsLog(): PixelEventRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PIXEL_EVENTS_LOG);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordPixelEventLog(eventName: string, data: any, platform: 'Meta' | 'TikTok' | 'Snapchat' | 'Google' | 'All' = 'All'): void {
  try {
    const existing = loadPixelEventsLog();
    const entry: PixelEventRecord = {
      id: `px-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      eventName,
      platform,
      data,
      timestamp: new Date().toISOString(),
    };
    const updated = [entry, ...existing].slice(0, 40); // Keep last 40 events
    localStorage.setItem(STORAGE_KEYS.PIXEL_EVENTS_LOG, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nasamat_pixel_event_logged', { detail: entry }));
  } catch (e) {
    console.error('Failed to record pixel event log', e);
  }
}

// Initial default luxury savings bundles
export const INITIAL_SAVINGS_BUNDLES: SavingsBundle[] = [
  {
    id: 'bundle-duo',
    name: 'باقة النيش الثنائية',
    nameEn: 'Niche Duo Bundle',
    description: 'عطران 50ml من اختيارك بتركيز إكستري',
    descriptionEn: '2 x 50ml flacons of your choice',
    bottlesCount: 2,
    bottleSizeMl: 50,
    price: 13,
    originalPrice: 14,
    savingBadgeAr: 'وفّر $1.00',
    freeDelivery: false,
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80',
    featuresAr: [
      'عطران فاخران 50 ملل من أي تشكيلة',
      'تركيز Extrait de Parfum فائق الثبات',
      'تغليف إهدائي فاخر',
    ],
    isActive: true,
    allowedPerfumeSelection: 'all',
  },
  {
    id: 'bundle-trio',
    name: 'باقة النخبة الثلاثية',
    nameEn: 'Elite Trio Bundle',
    description: '3 عطور 50ml من اختيارك + توصيل مجاني لكل لبنان',
    descriptionEn: '3 x 50ml flacons + Free Lebanon Delivery',
    bottlesCount: 3,
    bottleSizeMl: 50,
    price: 18,
    originalPrice: 21,
    savingBadgeAr: 'وفر $3 + شحن مجاني',
    freeDelivery: true,
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=400&q=80',
    featuresAr: [
      '3 زجاجات 50 ملل من أي عطور تفضلها',
      'توصيل مجاني فوري لكافة مناطق لبنان 🚚',
      'تغليف إهدائي وبوكس فاخر',
    ],
    isActive: true,
    allowedPerfumeSelection: 'all',
  },
  {
    id: 'bundle-quad',
    name: 'باقة العائلة الملكية',
    nameEn: 'Royal Quad Bundle',
    description: '4 عطور 50ml ملكية + شحن مجاني لكافة مناطق لبنان',
    descriptionEn: '4 x 50ml flacons + Free Delivery',
    bottlesCount: 4,
    bottleSizeMl: 50,
    price: 24,
    originalPrice: 28,
    savingBadgeAr: 'وفّر $4 + شحن مجاني',
    freeDelivery: true,
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80',
    featuresAr: [
      '4 زجاجات 50 ملل من أفخم الاختيارات',
      'توصيل مجاني لكافة المحافظات اللبنانية',
      'بوكس هدايا فاخر + عينات مجانية إضافية',
    ],
    isActive: true,
    allowedPerfumeSelection: 'all',
  },
];

export function loadSavingsBundles(): SavingsBundle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVINGS_BUNDLES);
    if (!raw) return INITIAL_SAVINGS_BUNDLES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SAVINGS_BUNDLES;
  } catch {
    return INITIAL_SAVINGS_BUNDLES;
  }
}

export function saveSavingsBundles(bundles: SavingsBundle[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVINGS_BUNDLES, JSON.stringify(bundles));
  } catch (e) {
    console.error('Failed to save savings bundles', e);
  }
}

// CRM Permanently Deleted Lead Keys (names / IDs)
export function loadCrmDeletedLeadKeys(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_DELETED_LEADS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCrmDeletedLeadKeys(keys: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_DELETED_LEADS, JSON.stringify(keys));
  } catch (e) {
    console.error('Failed to save deleted CRM lead keys', e);
  }
}

export function addCrmDeletedLeadKey(keyOrName: string): void {
  try {
    const existing = loadCrmDeletedLeadKeys();
    const normalized = keyOrName.trim().toLowerCase();
    if (normalized && !existing.includes(normalized)) {
      saveCrmDeletedLeadKeys([...existing, normalized]);
    }
  } catch (e) {
    console.error('Failed to add deleted CRM lead key', e);
  }
}
