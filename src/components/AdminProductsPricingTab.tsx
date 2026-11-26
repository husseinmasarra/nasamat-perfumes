import React, { useState, useMemo, useEffect } from 'react';
import type { FragranceOil, SavedRecipe, AppSettings, FragranceFamily } from '../types';
import { 
  Tag, 
  Search, 
  Filter, 
  Check, 
  DollarSign, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  Sliders, 
  RotateCcw,
  Eye,
  Award,
  Camera,
  Upload,
  Droplet,
  FlaskConical,
  Package,
  Database,
  Trash2,
  X
} from './icons';
import { useLanguage } from '../context/LanguageContext';
import { LUXURY_PRESET_IMAGES, generatePerfumeBarcode, recordDeletedProductId } from '../utils/storage';
import {
  PERFUME_PRESETS_DATABASE,
  POPULAR_DATABASE_BRANDS,
  searchPerfumeDatabase,
  findBestMatchingPerfume,
  type PerfumePresetSpec
} from '../data/perfumeDatabase';
import { PerfumeMarketDatabaseModal } from './PerfumeMarketDatabaseModal';

export type ProductDepartment = 'perfume' | 'makeup' | 'accessories' | 'bakhoor' | 'other';

export const PRODUCT_DEPARTMENTS: {
  id: ProductDepartment;
  labelAr: string;
  labelEn: string;
  icon: string;
  codePrefix: string;
  descAr: string;
  subCategories: string[];
}[] = [
  {
    id: 'perfume',
    labelAr: 'عطورات فاخرة وتولات',
    labelEn: 'Luxury Perfumes & Attars',
    icon: '🧴',
    codePrefix: 'NAS',
    descAr: 'عطور سكب وتركيب، بخاخ EDP/Extrait، دهن عود وتولات نقية، أو عطور أصلية معلبة',
    subCategories: ['عطر رجالي', 'عطر نسائي', 'عطر للجنسين', 'دهن عود ومسك', 'عطر نيش فاخر'],
  },
  {
    id: 'makeup',
    labelAr: 'مكياج ومستحضرات تجميل',
    labelEn: 'Makeup & Cosmetics',
    icon: '💄',
    codePrefix: 'MKP',
    descAr: 'أحمر شفاه، كحل وماسكارا، ظلال عيون، فاونديشن وبودرة، عناية شخصية',
    subCategories: ['أحمر شفاه وروج', 'ماسكارا وكحل', 'باليت وظلال عيون', 'كريم أساس وفاونديشن', 'بودرة وبلاشر', 'محددات وفرش'],
  },
  {
    id: 'accessories',
    labelAr: 'إكسسوارات وهدايا ومباخر',
    labelEn: 'Accessories & Gifts',
    icon: '💍',
    codePrefix: 'ACC',
    descAr: 'مباخر كريستال ملكية، سلاسل وأساور، أطقم هدايا، زجاجات عطور كريستال فارغة',
    subCategories: ['مباخر كريستال فاخرة', 'أطقم هدايا وتوزيعات', 'سلاسل وأساور ومجوهرات', 'زجاجات تعبئة كريستال', 'إكسسوارات شخصية'],
  },
  {
    id: 'bakhoor',
    labelAr: 'بخور ومعطرات جو',
    labelEn: 'Bakhoor & Home Scents',
    icon: '🪔',
    codePrefix: 'BKH',
    descAr: 'بخور خشب طبيعي، معمول دوسري وملكي، معطرات مفارش وأجواء 500مل',
    subCategories: ['بخور خشب مروكي وسيلاني', 'معمول ومبثوث ملكي', 'معطر مفارش وأجواء 500مل', 'لبان حوجري معطر'],
  },
  {
    id: 'other',
    labelAr: 'منتجات متنوعة أخرى',
    labelEn: 'General Boutique Items',
    icon: '📦',
    codePrefix: 'PRD',
    descAr: 'أي منتجات كماليات أو معروضات أخرى تباع في البوتيك بالقطعة',
    subCategories: ['منتجات عامة', 'أطقم موسمية', 'عروض خاصة'],
  },
];

export interface SizePriceEntry {
  size: number;
  price: number;
  label?: string;
  isDefault?: boolean;
}

export type PerfumePresentationType = 'spray' | 'oil_attar' | 'sample' | 'custom';

export const PERFUME_TYPE_CONFIG: Record<
  PerfumePresentationType,
  { labelAr: string; labelEn: string; icon: string; descAr: string; defaultSizes: SizePriceEntry[] }
> = {
  spray: {
    labelAr: 'عطر بخاخ فاخر (Extrait / EDP)',
    labelEn: 'Luxury Spray Perfume',
    icon: '🧴',
    descAr: 'أحجام رذاذ فواحة شائعة: 30مل، 50مل، 100مل',
    defaultSizes: [
      { size: 30, price: 5, label: '30ml' },
      { size: 50, price: 7, label: '50ml', isDefault: true },
      { size: 100, price: 12, label: '100ml' },
    ],
  },
  oil_attar: {
    labelAr: 'دهن عود ومسك وتولات نقية',
    labelEn: 'Pure Oud, Attar & Tolas',
    icon: '🛢️',
    descAr: 'مقاسات التولات التراثية: ربع تولة (3مل)، نصف تولة (6مل)، تولة كاملة (12مل)',
    defaultSizes: [
      { size: 3, price: 6, label: 'ربع تولة (3ml)' },
      { size: 6, price: 10, label: 'نصف تولة (6ml)' },
      { size: 12, price: 18, label: 'تولة كاملة (12ml)', isDefault: true },
    ],
  },
  sample: {
    labelAr: 'عينات وتوزيعات وتجربة وسفر',
    labelEn: 'Discovery & Travel Vials',
    icon: '🧪',
    descAr: 'مقاسات مصغرة للحقيبة والتجربة: 5مل، 10مل، 15مل',
    defaultSizes: [
      { size: 5, price: 2, label: '5ml' },
      { size: 10, price: 3, label: '10ml', isDefault: true },
      { size: 15, price: 4, label: '15ml' },
    ],
  },
  custom: {
    labelAr: 'مقاسات وأسعار مخصصة يدوياً',
    labelEn: 'Custom Defined Sizes',
    icon: '👑',
    descAr: 'أدخل أي مقاس بالملل وسعر مخصص بحرية تامة',
    defaultSizes: [
      { size: 50, price: 7, label: '50ml', isDefault: true },
    ],
  },
};

const POPULAR_BRANDS = [
  'Dior',
  'Chanel',
  'Creed',
  'Tom Ford',
  'Yves Saint Laurent',
  'Giorgio Armani',
  'Louis Vuitton',
  'Maison Francis Kurkdjian',
  'Nishane',
  'Roja Dove',
  'Kilian',
  'Parfums de Marly',
  'Amouage',
  'Xerjoff',
  'Brecourt',
  'نسمات',
];

const FRAGRANCE_FAMILIES_LIST: { id: FragranceFamily; labelAr: string; labelEn: string }[] = [
  { id: 'oriental', labelAr: 'شرقي فاخر (عنبر، عود، توابل)', labelEn: 'Oriental (Amber, Oud, Spices)' },
  { id: 'woody', labelAr: 'خشبي ملكي (صندل، أرز، باتشولي)', labelEn: 'Woody (Sandalwood, Cedar, Patchouli)' },
  { id: 'fresh', labelAr: 'منعش صيفي (مائي، بحري)', labelEn: 'Fresh & Aquatic' },
  { id: 'citrus', labelAr: 'حمضيات فوارة (برغموت، ليمون، برتقال)', labelEn: 'Citrus (Bergamot, Lemon)' },
  { id: 'floral', labelAr: 'زهري راقٍ (ياسمين، ورد، مسك الروم)', labelEn: 'Floral (Jasmine, Rose, Tuberose)' },
  { id: 'aromatic', labelAr: 'أروماتيك كاريزمي (لافندر، هيل، أعشاب)', labelEn: 'Aromatic (Lavender, Cardamom)' },
  { id: 'gourmand', labelAr: 'سويت وفانيليا (شوكولاتة، كراميل)', labelEn: 'Gourmand (Vanilla, Sweet)' },
  { id: 'leather', labelAr: 'جلدي دخاني نيش (جلد إيطالي، بخور)', labelEn: 'Leather & Smoky Niche' },
  { id: 'other', labelAr: 'تصنيف ملكي خاص / نيش', labelEn: 'Special Niche / Other' },
];

interface AdminProductsPricingTabProps {
  oils: FragranceOil[];
  recipes: SavedRecipe[];
  settings: AppSettings;
  onUpdateOil: (updatedOil: FragranceOil) => void;
  onUpdateRecipe?: (updatedRecipe: SavedRecipe) => void;
  onAddOil?: (newOil: FragranceOil) => void;
  onDeleteOil?: (id: string) => void;
  onDeleteRecipe?: (id: string) => void;
  autoOpenAddModal?: boolean;
}

export const AdminProductsPricingTab: React.FC<AdminProductsPricingTabProps> = ({
  oils,
  recipes,
  settings,
  onUpdateOil,
  onUpdateRecipe,
  onAddOil,
  onDeleteOil,
  onDeleteRecipe,
  autoOpenAddModal = false,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'oil' | 'recipe' | 'makeup' | 'accessories' | 'bakhoor' | 'other'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_desc' | 'price_asc' | 'margin'>('name');

  // Local draft prices for unsaved inputs { [productId]: { p30, p50, p100, wholesale } }
  const [priceDrafts, setPriceDrafts] = useState<Record<string, { p30: number; p50: number; p100: number; wholesale: number }>>({});
  const [barcodeDrafts, setBarcodeDrafts] = useState<Record<string, string>>({});
  const [sizeDrafts, setSizeDrafts] = useState<Record<string, number[]>>({});
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Batch Pricing Modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTarget, setBatchTarget] = useState<'all' | 'brand' | 'family'>('all');
  const [batchTargetValue, setBatchTargetValue] = useState('');
  const [batchPrice30, setBatchPrice30] = useState('5');
  const [batchPrice50, setBatchPrice50] = useState('7');
  const [batchPrice100, setBatchPrice100] = useState('12');

  // Fragrance Photo Editor Modal state (تعديل صور العطور حصرياً من المدير)
  const [editingPhotoItem, setEditingPhotoItem] = useState<{
    id: string;
    name: string;
    code: string;
    imageUrl?: string;
    type: 'oil' | 'recipe';
    rawOil?: FragranceOil;
    rawRecipe?: SavedRecipe;
  } | null>(null);
  const [photoInputUrl, setPhotoInputUrl] = useState('');

  const openEditPhoto = (item: any) => {
    setEditingPhotoItem(item);
    setPhotoInputUrl(item.imageUrl || '');
  };

  const handleSaveProductPhoto = () => {
    if (!editingPhotoItem) return;
    const url = photoInputUrl.trim() || undefined;

    if (editingPhotoItem.type === 'oil' && editingPhotoItem.rawOil) {
      onUpdateOil({
        ...editingPhotoItem.rawOil,
        imageUrl: url,
        updatedAt: new Date().toISOString(),
      });
    } else if (editingPhotoItem.type === 'recipe' && editingPhotoItem.rawRecipe && onUpdateRecipe) {
      onUpdateRecipe({
        ...editingPhotoItem.rawRecipe,
        imageUrl: url,
        updatedAt: new Date().toISOString(),
      });
    }
    setEditingPhotoItem(null);
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPhotoInputUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Canvas-based client-side image compression for PC uploads (keeps images crisp ~80-120KB)
  const compressImageFile = (file: File, maxWidth = 900, maxHeight = 900, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Image decode error'));
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsDataURL(file);
    });
  };

  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [uploadedImageMeta, setUploadedImageMeta] = useState<{ name: string; sizeKb: number } | null>(null);

  // ================= NEW FRAGRANCE / PRODUCT ADDITION MODAL =================
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMarketDbModalOpen, setIsMarketDbModalOpen] = useState(false);
  const [addSuccessToast, setAddSuccessToast] = useState('');
  
  // Fragrance Database Auto-Fetch & Auto-Suggest
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [selectedDbBrand, setSelectedDbBrand] = useState<string>('الكل');
  const [isDbSectionExpanded, setIsDbSectionExpanded] = useState(true);
  const [autofillSuccessNotice, setAutofillSuccessNotice] = useState<string | null>(null);

  const [newFragrance, setNewFragrance] = useState({
    // Multi-department attributes
    department: 'perfume' as ProductDepartment,
    subCategory: '',
    directPrice: '25',
    compareAtPrice: '35',
    costPriceInput: '10',
    wholesalePriceInput: '18',
    stockCount: '10',
    colorOrShade: '',
    specification: '',
    description: '',
    // Basic identifiers
    name: '',
    nameEn: '',
    code: '',
    brand: 'نسمات',
    family: 'oriental' as FragranceFamily,
    targetGender: 'unisex' as 'men' | 'women' | 'unisex',
    barcode: '',
    perfumeType: 'spray' as PerfumePresentationType,
    sizeEntries: [
      { size: 30, price: 5, label: '30ml' },
      { size: 50, price: 7, label: '50ml', isDefault: true },
      { size: 100, price: 12, label: '100ml' },
    ] as SizePriceEntry[],
    availableSizes: [30, 50, 100] as number[],
    retailPrice30ml: '5',
    retailPrice50ml: '7',
    retailPrice100ml: '12',
    wholesalePrice50ml: '4.5',
    unitCost: '0.15',
    density: '0.95',
    stockMl: '500',
    reorderLevelMl: '100',
    imageUrl: LUXURY_PRESET_IMAGES[0]?.url || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80',
    // Original Packaged Perfume attributes (عطور أصلية معلبة وجاهزة)
    isOriginalPackaged: false,
    singleBottleSizeMl: '100',
    singleBottlePrice: '85',
    originalRetailPrice: '120',
    packageStockCount: '5',
    packageCostPrice: '55',
    concentration: 'Eau de Parfum',
    batchCode: '',
    countryOfOrigin: 'فرنسا (France)',
    boxCondition: 'sealed' as 'sealed' | 'tester' | 'unboxed',
    notes: '',
    topNotes: '',
    heartNotes: '',
    baseNotes: '',
  });

  // Auto-open modal if requested via sidebar prop
  useEffect(() => {
    if (autoOpenAddModal) {
      handleOpenAddModal();
    }
  }, [autoOpenAddModal]);

  // Manual Size Entry inputs
  const [manualSizeMl, setManualSizeMl] = useState('');
  const [manualPriceUsd, setManualPriceUsd] = useState('');
  const [manualLabel, setManualLabel] = useState('');

  // Switch perfume type & auto-populate corresponding luxury size template
  const handleSelectPerfumeType = (typeKey: PerfumePresentationType) => {
    const config = PERFUME_TYPE_CONFIG[typeKey];
    if (!config) return;
    setNewFragrance((prev) => ({
      ...prev,
      perfumeType: typeKey,
      sizeEntries: [...config.defaultSizes],
      availableSizes: config.defaultSizes.map((s) => s.size),
      retailPrice30ml: String(config.defaultSizes.find((s) => s.size === 30)?.price || prev.retailPrice30ml),
      retailPrice50ml: String(config.defaultSizes.find((s) => s.size === 50)?.price || config.defaultSizes[0]?.price || prev.retailPrice50ml),
      retailPrice100ml: String(config.defaultSizes.find((s) => s.size === 100)?.price || prev.retailPrice100ml),
    }));
  };

  // Add custom manual size & price
  const handleAddManualSize = () => {
    const sz = parseInt(manualSizeMl.trim(), 10);
    const pr = parseFloat(manualPriceUsd.trim());
    if (isNaN(sz) || sz <= 0) return;
    if (isNaN(pr) || pr < 0) return;

    setNewFragrance((prev) => {
      const filtered = prev.sizeEntries.filter((e) => e.size !== sz);
      const newEntry: SizePriceEntry = {
        size: sz,
        price: pr,
        label: manualLabel.trim() || `${sz}ml`,
        isDefault: prev.sizeEntries.length === 0,
      };
      const updated = [...filtered, newEntry].sort((a, b) => a.size - b.size);
      return {
        ...prev,
        sizeEntries: updated,
        availableSizes: updated.map((e) => e.size),
      };
    });
    setManualSizeMl('');
    setManualPriceUsd('');
    setManualLabel('');
  };

  // Quick toggle common bottle size badge
  const handleQuickToggleSize = (sz: number, defaultSuggestedPrice?: number) => {
    setNewFragrance((prev) => {
      const exists = prev.sizeEntries.some((e) => e.size === sz);
      let updated: SizePriceEntry[];
      if (exists) {
        if (prev.sizeEntries.length <= 1) return prev; // Keep at least one size
        updated = prev.sizeEntries.filter((e) => e.size !== sz);
      } else {
        const base50 = prev.sizeEntries.find((e) => e.size === 50)?.price || 7;
        const suggested = defaultSuggestedPrice !== undefined ? defaultSuggestedPrice : (
          sz === 30 ? 5 : sz === 50 ? 7 : sz === 100 ? 12 : sz <= 12 ? Math.max(5, sz * 1.5) : Math.max(1, Math.round((sz / 50) * base50))
        );
        let label = `${sz}ml`;
        if (sz === 3) label = 'ربع تولة (3ml)';
        else if (sz === 6) label = 'نصف تولة (6ml)';
        else if (sz === 12) label = 'تولة كاملة (12ml)';
        updated = [...prev.sizeEntries, { size: sz, price: Math.max(0.5, suggested), label }].sort((a, b) => a.size - b.size);
      }
      return {
        ...prev,
        sizeEntries: updated,
        availableSizes: updated.map((e) => e.size),
      };
    });
  };

  // Update inline size price
  const handleUpdateSizePrice = (size: number, newPrice: number) => {
    setNewFragrance((prev) => ({
      ...prev,
      sizeEntries: prev.sizeEntries.map((e) => (e.size === size ? { ...e, price: newPrice } : e)),
    }));
  };

  // Remove size
  const handleRemoveSize = (size: number) => {
    setNewFragrance((prev) => {
      if (prev.sizeEntries.length <= 1) return prev;
      const updated = prev.sizeEntries.filter((e) => e.size !== size);
      return {
        ...prev,
        sizeEntries: updated,
        availableSizes: updated.map((e) => e.size),
      };
    });
  };

  // Compute matched presets from database based on query & brand filter
  const dbSearchResults = useMemo(() => {
    return searchPerfumeDatabase(dbSearchQuery, selectedDbBrand, 16);
  }, [dbSearchQuery, selectedDbBrand]);

  // Dynamic inline match suggestion when typing in name input
  const inlineMatch = useMemo(() => {
    const q = newFragrance.name.trim() || newFragrance.nameEn.trim();
    if (!q || q.length < 2) return null;
    const match = findBestMatchingPerfume(q);
    if (!match) return null;
    // Hide inline hint if user has already imported this exact perfume
    if (newFragrance.name.trim() === match.nameAr && newFragrance.brand.trim() === match.brand) {
      return null;
    }
    return match;
  }, [newFragrance.name, newFragrance.nameEn, newFragrance.brand]);

  // Autofill handler from preset
  const handleAutofillFromPreset = (preset: PerfumePresetSpec) => {
    const cleanName = preset.nameAr.replace(/\s*\([^)]*\)/g, '').trim() || preset.nameAr;
    setNewFragrance((prev) => ({
      ...prev,
      name: cleanName,
      nameEn: preset.nameEn,
      brand: preset.brand,
      family: preset.family,
      targetGender: preset.targetGender,
      topNotes: preset.topNotes,
      heartNotes: preset.heartNotes,
      baseNotes: preset.baseNotes,
      notes: preset.description,
      retailPrice30ml: String(preset.suggestedPrice30ml),
      retailPrice50ml: String(preset.suggestedPrice50ml),
      retailPrice100ml: String(preset.suggestedPrice100ml),
      wholesalePrice50ml: String(preset.suggestedWholesalePrice50ml),
      unitCost: String(preset.typicalCostPerMl),
      imageUrl: preset.imageUrl || prev.imageUrl,
      sizeEntries: [
        { size: 30, price: preset.suggestedPrice30ml, label: '30ml' },
        { size: 50, price: preset.suggestedPrice50ml, label: '50ml', isDefault: true },
        { size: 100, price: preset.suggestedPrice100ml, label: '100ml' },
      ],
      availableSizes: [30, 50, 100],
    }));
    setAutofillSuccessNotice(
      isAr
        ? `✨ تم جلب مواصفات "${cleanName}" (${preset.brand}) والهرم العطري والتصنيف بنجاح!`
        : `✨ Specifications for "${preset.nameEn}" (${preset.brand}) successfully auto-filled!`
    );
    setTimeout(() => setAutofillSuccessNotice(null), 5500);
  };

  const handleOpenAddModal = (dept: ProductDepartment = 'perfume') => {
    const deptConfig = PRODUCT_DEPARTMENTS.find((d) => d.id === dept) || PRODUCT_DEPARTMENTS[0];
    const prefix = deptConfig.codePrefix;
    const existingNums = oils
      .map((o) => {
        const m = o.code.match(new RegExp(`${prefix}-(\\d+)`, 'i'));
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : oils.length + 1;
    const autoCode = `${prefix}-${String(nextNum).padStart(3, '0')}`;

    setDbSearchQuery('');
    setSelectedDbBrand('الكل');
    setAutofillSuccessNotice(null);
    setIsDbSectionExpanded(true);
    setUploadedImageMeta(null);

    const defaultImg = dept === 'makeup' ? (LUXURY_PRESET_IMAGES[3]?.url || LUXURY_PRESET_IMAGES[0]?.url) :
                       dept === 'accessories' ? (LUXURY_PRESET_IMAGES[6]?.url || LUXURY_PRESET_IMAGES[0]?.url) :
                       dept === 'bakhoor' ? (LUXURY_PRESET_IMAGES[5]?.url || LUXURY_PRESET_IMAGES[0]?.url) :
                       dept === 'other' ? (LUXURY_PRESET_IMAGES[7]?.url || LUXURY_PRESET_IMAGES[0]?.url) :
                       (LUXURY_PRESET_IMAGES[0]?.url || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80');

    setNewFragrance({
      department: dept,
      subCategory: deptConfig.subCategories[0] || '',
      directPrice: dept === 'makeup' ? '18' : dept === 'accessories' ? '35' : dept === 'bakhoor' ? '22' : '25',
      compareAtPrice: dept === 'makeup' ? '25' : dept === 'accessories' ? '50' : dept === 'bakhoor' ? '30' : '35',
      costPriceInput: dept === 'makeup' ? '8' : dept === 'accessories' ? '14' : dept === 'bakhoor' ? '9' : '10',
      wholesalePriceInput: dept === 'makeup' ? '13' : dept === 'accessories' ? '24' : dept === 'bakhoor' ? '15' : '18',
      stockCount: '10',
      colorOrShade: '',
      specification: '',
      description: '',
      name: '',
      nameEn: '',
      code: autoCode,
      barcode: generatePerfumeBarcode(autoCode, '6281'),
      perfumeType: 'spray',
      sizeEntries: [
        { size: 30, price: 5, label: '30ml' },
        { size: 50, price: 7, label: '50ml', isDefault: true },
        { size: 100, price: 12, label: '100ml' },
      ],
      availableSizes: [30, 50, 100],
      brand: 'نسمات',
      family: 'oriental',
      targetGender: 'unisex',
      retailPrice30ml: '5',
      retailPrice50ml: '7',
      retailPrice100ml: '12',
      wholesalePrice50ml: '4.5',
      unitCost: '0.15',
      density: '0.95',
      stockMl: '500',
      reorderLevelMl: '100',
      imageUrl: defaultImg,
      isOriginalPackaged: false,
      singleBottleSizeMl: '100',
      singleBottlePrice: '85',
      originalRetailPrice: '120',
      packageStockCount: '5',
      packageCostPrice: '55',
      concentration: 'Eau de Parfum',
      batchCode: '',
      countryOfOrigin: 'فرنسا (France)',
      boxCondition: 'sealed' as 'sealed' | 'tester' | 'unboxed',
      notes: '',
      topNotes: '',
      heartNotes: '',
      baseNotes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSelectDepartment = (dept: ProductDepartment) => {
    const deptConfig = PRODUCT_DEPARTMENTS.find((d) => d.id === dept) || PRODUCT_DEPARTMENTS[0];
    const prefix = deptConfig.codePrefix;
    const existingNums = oils
      .map((o) => {
        const m = o.code.match(new RegExp(`${prefix}-(\\d+)`, 'i'));
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : oils.length + 1;
    const autoCode = `${prefix}-${String(nextNum).padStart(3, '0')}`;

    const defaultImg = dept === 'makeup' ? (LUXURY_PRESET_IMAGES[3]?.url || LUXURY_PRESET_IMAGES[0]?.url) :
                       dept === 'accessories' ? (LUXURY_PRESET_IMAGES[6]?.url || LUXURY_PRESET_IMAGES[0]?.url) :
                       dept === 'bakhoor' ? (LUXURY_PRESET_IMAGES[5]?.url || LUXURY_PRESET_IMAGES[0]?.url) :
                       dept === 'other' ? (LUXURY_PRESET_IMAGES[7]?.url || LUXURY_PRESET_IMAGES[0]?.url) :
                       (LUXURY_PRESET_IMAGES[0]?.url);

    setNewFragrance((prev) => ({
      ...prev,
      department: dept,
      subCategory: deptConfig.subCategories[0] || '',
      code: autoCode,
      barcode: generatePerfumeBarcode(autoCode, '6281'),
      imageUrl: prev.imageUrl && prev.imageUrl !== LUXURY_PRESET_IMAGES[0]?.url ? prev.imageUrl : defaultImg,
      directPrice: dept === 'makeup' ? '18' : dept === 'accessories' ? '35' : dept === 'bakhoor' ? '22' : '25',
      compareAtPrice: dept === 'makeup' ? '25' : dept === 'accessories' ? '50' : dept === 'bakhoor' ? '30' : '35',
      costPriceInput: dept === 'makeup' ? '8' : dept === 'accessories' ? '14' : dept === 'bakhoor' ? '9' : '10',
      wholesalePriceInput: dept === 'makeup' ? '13' : dept === 'accessories' ? '24' : dept === 'bakhoor' ? '15' : '18',
    }));
  };

  const handleOpenAddModalWithPreset = (preset: PerfumePresetSpec) => {
    setIsMarketDbModalOpen(false);
    handleOpenAddModal('perfume');
    setTimeout(() => {
      handleAutofillFromPreset(preset);
    }, 60);
  };

  const handleNewFragranceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingImage(true);
    const origSizeKb = Math.round(file.size / 1024);
    try {
      const compressedDataUrl = await compressImageFile(file, 900, 900, 0.85);
      const approxCompressedKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
      setUploadedImageMeta({ name: file.name, sizeKb: approxCompressedKb || origSizeKb });
      setNewFragrance((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
    } catch (err) {
      console.warn('Canvas compression fallback', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setNewFragrance((prev) => ({ ...prev, imageUrl: event.target!.result as string }));
          setUploadedImageMeta({ name: file.name, sizeKb: origSizeKb });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleSaveNewFragrance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFragrance.name.trim()) return;

    const newOilId = `oil-${Date.now()}`;
    const code = newFragrance.code.trim() || `NAS-${String(oils.length + 1).padStart(3, '0')}`;

    // Handling for non-perfume departments (Makeup, Accessories, Bakhoor, General Items)
    if (newFragrance.department !== 'perfume') {
      const directPrice = parseFloat(newFragrance.directPrice.trim()) || 25;
      const compareAt = parseFloat(newFragrance.compareAtPrice.trim()) || Number((directPrice * 1.35).toFixed(1));
      const costPrice = parseFloat(newFragrance.costPriceInput.trim()) || Number((directPrice * 0.45).toFixed(1));
      const wholesalePrice = parseFloat(newFragrance.wholesalePriceInput.trim()) || Number((directPrice * 0.75).toFixed(1));
      const stockPieces = parseInt(newFragrance.stockCount.trim(), 10) || 10;
      
      const defaultDesc = newFragrance.department === 'makeup' 
        ? 'مستحضر تجميل فاخر عالي الجودة يدوم طويلاً' 
        : newFragrance.department === 'accessories' 
        ? 'إكسسوار راقٍ بتصميم استثنائي للمناسبات والهدايا' 
        : newFragrance.department === 'bakhoor' 
        ? 'بخور ملكي ومعطر فاخر ذو فوحان وثبات مميز' 
        : 'منتج فاخر حصري من دار نسمات';

      const finalDesc = newFragrance.description.trim() || defaultDesc;

      const newProductItem: FragranceOil = {
        id: newOilId,
        code,
        name: newFragrance.name.trim(),
        nameEn: newFragrance.nameEn.trim() || newFragrance.name.trim(),
        company: newFragrance.brand.trim() || 'نسمات',
        brand: newFragrance.brand.trim() || 'نسمات',
        family: 'other',
        targetGender: newFragrance.targetGender,
        density: 1,
        costPrice: Number((costPrice * stockPieces).toFixed(2)),
        initialQuantity: stockPieces,
        currentQuantity: stockPieces,
        stockMl: stockPieces,
        reorderLevelMl: 2,
        lowStockThreshold: 2,
        isAvailable: true,
        unit: 'piece',
        costPerGram: costPrice,
        costPerMl: costPrice,
        unitCost: costPrice,
        retailPrice30ml: directPrice,
        retailPrice50ml: directPrice,
        retailPrice100ml: directPrice,
        wholesalePrice50ml: wholesalePrice,
        sizePrices: { 1: directPrice },
        customSizes: [{ size: 1, price: directPrice, label: isAr ? 'قطعة واحدة' : '1 Piece' }],
        perfumeType: 'custom',
        barcode: newFragrance.barcode.trim() || generatePerfumeBarcode(code, '6281'),
        availableSizes: [1],
        notes: finalDesc,
        imageUrl: newFragrance.imageUrl.trim() || LUXURY_PRESET_IMAGES[0]?.url,
        // Department / Universal product properties
        productNature: newFragrance.department,
        department: newFragrance.department,
        category: newFragrance.subCategory.trim() || undefined,
        colorOrShade: newFragrance.colorOrShade.trim() || undefined,
        specification: newFragrance.specification.trim() || undefined,
        // Packaged item handling
        isOriginalPackaged: true,
        packageStockCount: stockPieces,
        singleBottleSizeMl: 1,
        singleBottlePrice: directPrice,
        originalRetailPrice: compareAt,
        concentration: newFragrance.department === 'makeup' ? 'COSMETICS' :
                       newFragrance.department === 'accessories' ? 'ACCESSORY' :
                       newFragrance.department === 'bakhoor' ? 'BAKHOOR' : 'BOUTIQUE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (onAddOil) {
        onAddOil(newProductItem);
      }

      setIsAddModalOpen(false);
      const deptName = newFragrance.department === 'makeup' ? 'مستحضر المكياج' :
                       newFragrance.department === 'accessories' ? 'الإكسسوار' :
                       newFragrance.department === 'bakhoor' ? 'البخور' : 'المنتج';
      setAddSuccessToast(
        isAr
          ? `تمت إضافة ${deptName} "${newProductItem.name}" (${newProductItem.code}) ونشره بنجاح في الكتالوج والمتجر!`
          : `Product "${newProductItem.name}" (${newProductItem.code}) added & published successfully!`
      );
      setTimeout(() => setAddSuccessToast(''), 4500);
      return;
    }

    const notesParts: string[] = [];
    if (newFragrance.notes.trim()) notesParts.push(newFragrance.notes.trim());
    if (newFragrance.topNotes.trim()) notesParts.push(`قمة: ${newFragrance.topNotes.trim()}`);
    if (newFragrance.heartNotes.trim()) notesParts.push(`قلب: ${newFragrance.heartNotes.trim()}`);
    if (newFragrance.baseNotes.trim()) notesParts.push(`قاعدة: ${newFragrance.baseNotes.trim()}`);
    const finalNotes = notesParts.join(' | ') || 'صياغة فاخرة خاصة من أنقى الزيوت العطرية السويسرية والفرنسية';

    const sortedEntries = [...newFragrance.sizeEntries].sort((a, b) => a.size - b.size);
    const availableSizes = sortedEntries.length > 0 ? sortedEntries.map((e) => e.size) : [30, 50, 100];
    const sizePrices: Record<number, number> = {};
    sortedEntries.forEach((e) => {
      sizePrices[e.size] = e.price;
    });

    const isOriginal = newFragrance.isOriginalPackaged;
    const origBottleSize = parseInt(newFragrance.singleBottleSizeMl.trim(), 10) || 100;
    const origBottlePrice = parseFloat(newFragrance.singleBottlePrice.trim()) || 85;
    const origBottleCost = parseFloat(newFragrance.packageCostPrice.trim()) || 55;
    const origStockCount = parseInt(newFragrance.packageStockCount.trim(), 10) || 5;

    let finalAvailableSizes = availableSizes;
    let finalSizePrices = sizePrices;
    let finalP50 = sizePrices[50] !== undefined ? sizePrices[50] : (sortedEntries[0]?.price || 7);
    let finalP30 = sizePrices[30] !== undefined ? sizePrices[30] : (parseFloat(newFragrance.retailPrice30ml) || 5);
    let finalP100 = sizePrices[100] !== undefined ? sizePrices[100] : (parseFloat(newFragrance.retailPrice100ml) || 12);
    let finalWholesale = parseFloat(newFragrance.wholesalePrice50ml) || Number((finalP50 * 0.7).toFixed(1));
    const dens = parseFloat(newFragrance.density) || 0.95;
    let finalCost = parseFloat(newFragrance.unitCost) || 0.15;
    const stock = parseFloat(newFragrance.stockMl) || 500;
    let finalStockMl = stock;
    const reorder = parseFloat(newFragrance.reorderLevelMl) || 100;

    if (isOriginal) {
      finalAvailableSizes = [origBottleSize];
      finalSizePrices = { [origBottleSize]: origBottlePrice };
      finalP50 = origBottlePrice;
      finalP30 = origBottlePrice;
      finalP100 = origBottlePrice;
      finalWholesale = parseFloat(newFragrance.wholesalePrice50ml.trim()) || Number((origBottlePrice * 0.75).toFixed(1));
      finalStockMl = origStockCount * origBottleSize;
      finalCost = Number((origBottleCost / origBottleSize).toFixed(3));
    }

    const newOilItem: FragranceOil = {
      id: newOilId,
      code,
      name: newFragrance.name.trim(),
      nameEn: newFragrance.nameEn.trim() || newFragrance.name.trim(),
      company: newFragrance.brand.trim() || 'نسمات',
      brand: newFragrance.brand.trim() || 'نسمات',
      family: newFragrance.family,
      targetGender: newFragrance.targetGender,
      density: dens,
      costPrice: isOriginal ? Number((origBottleCost * origStockCount).toFixed(2)) : Number((finalCost * finalStockMl).toFixed(2)),
      initialQuantity: finalStockMl,
      currentQuantity: finalStockMl,
      stockMl: finalStockMl,
      reorderLevelMl: isOriginal ? (2 * origBottleSize) : reorder,
      lowStockThreshold: isOriginal ? (2 * origBottleSize) : reorder,
      isAvailable: true,
      unit: 'ml',
      costPerGram: Number((finalCost / dens).toFixed(3)),
      costPerMl: finalCost,
      unitCost: finalCost,
      retailPrice30ml: finalP30,
      retailPrice50ml: finalP50,
      retailPrice100ml: finalP100,
      wholesalePrice50ml: finalWholesale,
      sizePrices: finalSizePrices,
      customSizes: isOriginal ? [{ size: origBottleSize, price: origBottlePrice, label: `${origBottleSize}ml` }] : sortedEntries,
      perfumeType: isOriginal ? 'custom' : newFragrance.perfumeType,
      barcode: newFragrance.barcode.trim() || generatePerfumeBarcode(code, '6281'),
      availableSizes: finalAvailableSizes,
      notes: finalNotes,
      imageUrl: newFragrance.imageUrl.trim() || LUXURY_PRESET_IMAGES[0]?.url,
      // Original Packaged specifics
      isOriginalPackaged: isOriginal,
      packageStockCount: isOriginal ? origStockCount : undefined,
      singleBottleSizeMl: isOriginal ? origBottleSize : undefined,
      singleBottlePrice: isOriginal ? origBottlePrice : undefined,
      originalRetailPrice: isOriginal ? (parseFloat(newFragrance.originalRetailPrice.trim()) || Number((origBottlePrice * 1.35).toFixed(1))) : undefined,
      concentration: isOriginal ? newFragrance.concentration.trim() : undefined,
      batchCode: isOriginal ? newFragrance.batchCode.trim() : undefined,
      countryOfOrigin: isOriginal ? newFragrance.countryOfOrigin.trim() : undefined,
      boxCondition: isOriginal ? newFragrance.boxCondition : undefined,
      productNature: isOriginal ? 'perfume_original' : 'perfume_crafted',
      department: 'perfume',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (onAddOil) {
      onAddOil(newOilItem);
    }

    setIsAddModalOpen(false);
    setAddSuccessToast(
      isAr
        ? `تمت إضافة عطر "${newOilItem.name}" (${newOilItem.code}) وتصنيفه بنجاح في الكتالوج والمتجر!`
        : `Fragrance "${newOilItem.name}" (${newOilItem.code}) added & categorized successfully!`
    );
    setTimeout(() => setAddSuccessToast(''), 4500);
  };

  // Unique brands & families
  const allBrands = useMemo(() => {
    const set = new Set<string>();
    oils.forEach((o) => o.brand && set.add(o.brand));
    return Array.from(set).sort();
  }, [oils]);

  const allFamilies = useMemo(() => {
    const set = new Set<string>();
    oils.forEach((o) => o.family && set.add(o.family));
    return Array.from(set).sort();
  }, [oils]);

  // Combined product list
  const combinedProducts = useMemo(() => {
    const list: Array<{
      id: string;
      key: string;
      type: 'oil' | 'recipe';
      name: string;
      nameEn?: string;
      code: string;
      barcode: string;
      availableSizes: number[];
      brand: string;
      family: string;
      imageUrl?: string;
      costPerMl: number;
      estimatedBottleCost50: number;
      p30: number;
      p50: number;
      p100: number;
      wholesale: number;
      isOriginalPackaged?: boolean;
      packageStockCount?: number;
      productNature?: string;
      department?: string;
      colorOrShade?: string;
      specification?: string;
      rawOil?: FragranceOil;
      rawRecipe?: SavedRecipe;
    }> = [];

    // Fragrance Oils & Multi-Department Products
    oils.forEach((oil) => {
      const drafts = priceDrafts[oil.id];
      const p30 = drafts ? drafts.p30 : (oil.retailPrice30ml !== undefined ? oil.retailPrice30ml : 5);
      const p50 = drafts ? drafts.p50 : (oil.singleBottlePrice || oil.retailPrice50ml || 7);
      const p100 = drafts ? drafts.p100 : (oil.retailPrice100ml !== undefined ? oil.retailPrice100ml : 12);
      const wholesale = drafts ? drafts.wholesale : (oil.wholesalePrice50ml !== undefined ? oil.wholesalePrice50ml : 4.5);

      const costPerMl = oil.unitCost || 0.15;
      const estimatedBottleCost50 = oil.isOriginalPackaged
        ? (oil.costPrice && oil.packageStockCount ? Number((oil.costPrice / oil.packageStockCount).toFixed(2)) : Number((costPerMl * (oil.singleBottleSizeMl || 100)).toFixed(2)))
        : Number((costPerMl * 12.5 + 1.10).toFixed(2));

      list.push({
        id: oil.id,
        key: `oil-${oil.id}`,
        type: 'oil',
        name: oil.name,
        code: oil.code,
        barcode: oil.barcode || generatePerfumeBarcode(oil.code, '6281'),
        availableSizes: oil.availableSizes && oil.availableSizes.length > 0 ? oil.availableSizes : [30, 50, 100],
        brand: oil.brand,
        family: oil.family,
        imageUrl: oil.imageUrl,
        costPerMl,
        estimatedBottleCost50,
        p30,
        p50,
        p100,
        wholesale,
        isOriginalPackaged: oil.isOriginalPackaged,
        packageStockCount: oil.packageStockCount,
        productNature: oil.productNature,
        department: oil.department,
        colorOrShade: oil.colorOrShade,
        specification: oil.specification,
        rawOil: oil,
      });
    });

    // Signature Recipes
    recipes.forEach((rec) => {
      const drafts = priceDrafts[rec.id];
      const p30 = drafts ? drafts.p30 : (rec.retailPrice30ml !== undefined ? rec.retailPrice30ml : 5);
      const p50 = drafts ? drafts.p50 : (rec.retailPrice50ml !== undefined ? rec.retailPrice50ml : (rec.suggestedRetailPrice || 7));
      const p100 = drafts ? drafts.p100 : (rec.retailPrice100ml !== undefined ? rec.retailPrice100ml : 12);
      const wholesale = drafts ? drafts.wholesale : (rec.wholesalePrice50ml !== undefined ? rec.wholesalePrice50ml : 4.5);

      const estimatedBottleCost50 = 3.20; // Artisan signature recipe estimated cost

      list.push({
        id: rec.id,
        key: `recipe-${rec.id}`,
        type: 'recipe',
        name: rec.name,
        nameEn: rec.nameEn,
        code: rec.code,
        barcode: rec.barcode || generatePerfumeBarcode(rec.code, '6282'),
        availableSizes: rec.availableSizes && rec.availableSizes.length > 0 ? rec.availableSizes : [30, 50, 100],
        brand: isAr ? 'خلطة نسمات الملكية' : 'Nasamat Signature',
        family: rec.category,
        imageUrl: rec.imageUrl,
        costPerMl: 0.18,
        estimatedBottleCost50,
        p30,
        p50,
        p100,
        wholesale,
        rawRecipe: rec,
      });
    });

    return list;
  }, [oils, recipes, priceDrafts, isAr]);

  // Filter & Search
  const filteredProducts = useMemo(() => {
    return combinedProducts.filter((p) => {
      if (selectedType !== 'all') {
        if (selectedType === 'oil') {
          if (p.type !== 'oil' || (p.productNature && p.productNature !== 'perfume_crafted' && p.productNature !== 'perfume_original')) return false;
        } else if (selectedType === 'recipe') {
          if (p.type !== 'recipe') return false;
        } else if (selectedType === 'makeup') {
          if (p.productNature !== 'makeup') return false;
        } else if (selectedType === 'accessories') {
          if (p.productNature !== 'accessories') return false;
        } else if (selectedType === 'bakhoor') {
          if (p.productNature !== 'bakhoor') return false;
        } else if (selectedType === 'other') {
          if (p.productNature !== 'other') return false;
        }
      }
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      if (selectedFamily !== 'all' && p.family !== selectedFamily) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchEn = p.nameEn ? p.nameEn.toLowerCase().includes(query) : false;
        const matchBrand = p.brand.toLowerCase().includes(query);
        const matchCode = p.code.toLowerCase().includes(query);
        const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(query) : false;
        if (!matchName && !matchEn && !matchBrand && !matchCode && !matchBarcode) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_desc') return b.p50 - a.p50;
      if (sortBy === 'price_asc') return a.p50 - b.p50;
      if (sortBy === 'margin') {
        const marginA = ((a.p50 - a.estimatedBottleCost50) / a.p50);
        const marginB = ((b.p50 - b.estimatedBottleCost50) / b.p50);
        return marginB - marginA;
      }
      return a.name.localeCompare(b.name, 'ar');
    });
  }, [combinedProducts, selectedType, selectedBrand, selectedFamily, searchTerm, sortBy]);

  // Handle draft price change
  const handlePriceChange = (id: string, field: 'p30' | 'p50' | 'p100' | 'wholesale', val: number) => {
    setPriceDrafts((prev) => {
      const current = prev[id] || {
        p30: combinedProducts.find((p) => p.id === id)?.p30 || 5,
        p50: combinedProducts.find((p) => p.id === id)?.p50 || 7,
        p100: combinedProducts.find((p) => p.id === id)?.p100 || 12,
        wholesale: combinedProducts.find((p) => p.id === id)?.wholesale || 4.5,
      };

      return {
        ...prev,
        [id]: {
          ...current,
          [field]: val >= 0 ? val : 0,
        },
      };
    });
  };

  // Save price for individual product
  const handleSaveIndividualPrice = (item: (typeof combinedProducts)[0]) => {
    const draft = priceDrafts[item.id] || {
      p30: item.p30,
      p50: item.p50,
      p100: item.p100,
      wholesale: item.wholesale,
    };
    const draftBarcode = barcodeDrafts[item.id] !== undefined ? barcodeDrafts[item.id].trim() : item.barcode;
    const draftSizes = sizeDrafts[item.id] || item.availableSizes || [30, 50, 100];

    if (item.type === 'oil' && item.rawOil) {
      const updated: FragranceOil = {
        ...item.rawOil,
        barcode: draftBarcode,
        availableSizes: draftSizes,
        retailPrice30ml: Number(draft.p30),
        retailPrice50ml: Number(draft.p50),
        retailPrice100ml: Number(draft.p100),
        wholesalePrice50ml: Number(draft.wholesale),
        updatedAt: new Date().toISOString(),
      };
      onUpdateOil(updated);
    } else if (item.type === 'recipe' && item.rawRecipe && onUpdateRecipe) {
      const updated: SavedRecipe = {
        ...item.rawRecipe,
        barcode: draftBarcode,
        availableSizes: draftSizes,
        suggestedRetailPrice: Number(draft.p50),
        retailPrice30ml: Number(draft.p30),
        retailPrice50ml: Number(draft.p50),
        retailPrice100ml: Number(draft.p100),
        wholesalePrice50ml: Number(draft.wholesale),
        updatedAt: new Date().toISOString(),
      };
      onUpdateRecipe(updated);
    }

    setSavedFeedback(item.id);
    setTimeout(() => setSavedFeedback(null), 2500);
  };

  const handleDeleteProduct = (p: (typeof combinedProducts)[0]) => {
    const isAr = language === 'ar';
    const confirmMsg = isAr
      ? `هل أنت متأكد تماماً من حذف عطر "${p.name}" (${p.code}) نهائياً من المتجر؟\n\nلن يعود للظهور في المتجر أو خزانة العطور إطلاقاً.`
      : `Are you sure you want to permanently delete "${p.name}" (${p.code})? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    recordDeletedProductId(p.id);
    if (p.code) recordDeletedProductId(p.code);

    if (p.type === 'recipe') {
      onDeleteRecipe?.(p.id);
    } else {
      onDeleteOil?.(p.id);
    }

    setSavedFeedback(null);
  };

  // Apply batch price updates
  const handleApplyBatchPrices = () => {
    const n30 = parseFloat(batchPrice30) || 5;
    const n50 = parseFloat(batchPrice50) || 7;
    const n100 = parseFloat(batchPrice100) || 12;

    oils.forEach((oil) => {
      let match = true;
      if (batchTarget === 'brand' && oil.brand !== batchTargetValue) match = false;
      if (batchTarget === 'family' && oil.family !== batchTargetValue) match = false;

      if (match) {
        onUpdateOil({
          ...oil,
          retailPrice30ml: n30,
          retailPrice50ml: n50,
          retailPrice100ml: n100,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    setPriceDrafts({});
    setIsBatchModalOpen(false);
  };

  // Top summary calculations
  const avg50 = combinedProducts.length > 0 
    ? (combinedProducts.reduce((s, it) => s + it.p50, 0) / combinedProducts.length).toFixed(2)
    : '7.00';

  const avgProfit = combinedProducts.length > 0
    ? (combinedProducts.reduce((s, it) => s + (it.p50 - it.estimatedBottleCost50), 0) / combinedProducts.length).toFixed(2)
    : '4.00';

  return (
    <div className="space-y-6 animate-fadeIn text-black">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-amber-400 flex items-center justify-center text-lg shadow-sm">
              <Tag className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-serif text-black uppercase tracking-wider">
                {isAr ? 'تسعير كل منتج على حدى وإدارة الأسعار' : 'Individual Product Pricing & Catalog'}
              </h1>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                {isAr 
                  ? 'تحكم كامل في أسعار بيع كل عطر (30ml, 50ml, 100ml والجملة) مع حساب فوري لهامش الربح والتكلفة' 
                  : 'Set custom retail and wholesale prices for every single fragrance flacon independently'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Add New Fragrance, Batch Adjuster & Market Database */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMarketDbModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black text-xs font-black shadow-md border border-amber-500 transition-all cursor-pointer"
          >
            <Database className="w-4 h-4 text-black stroke-[2.5]" />
            <span className="text-black font-black">
              {isAr ? `قاعدة بيانات عطور السوق (${PERFUME_PRESETS_DATABASE.length} عطر)` : `Market Perfumes (${PERFUME_PRESETS_DATABASE.length})`}
            </span>
          </button>

          <button
            onClick={() => handleOpenAddModal('perfume')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-black shadow-md border border-black transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400 stroke-[3]" />
            <span className="text-white font-black">{isAr ? 'إضافة منتج جديد (عطور • مكياج • إكسسوار)' : 'Add Product (All Departments)'}</span>
          </button>

          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black text-xs font-black shadow-xs border border-neutral-300 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-black" />
            <span className="text-black font-black">{isAr ? 'تعديل أسعار جماعي' : 'Batch Price Adjuster'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {addSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5 text-emerald-600 stroke-[3] shrink-0" />
            <span className="font-bold text-xs sm:text-sm">{addSuccessToast}</span>
          </div>
          <button
            onClick={() => setAddSuccessToast('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4.5 rounded-2xl shadow-xs space-y-1">
          <div className="text-neutral-900 text-xs font-black uppercase tracking-wider">
            {isAr ? 'إجمالي المنتجات المسعرة' : 'Total Priced Products'}
          </div>
          <div className="text-2xl font-black text-black font-serif">
            {combinedProducts.length} <span className="text-xs font-bold text-neutral-600">{isAr ? 'عطر ووصفة' : 'items'}</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <span>✓</span>
            <span>{isAr ? 'تحديث فوري في متجر الزبائن والسلة' : 'Live synced with storefront'}</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4.5 rounded-2xl shadow-xs space-y-1">
          <div className="text-neutral-900 text-xs font-black uppercase tracking-wider">
            {isAr ? 'متوسط سعر قارورة 50ml' : 'Avg 50ml Selling Price'}
          </div>
          <div className="text-2xl font-black text-black font-mono">
            ${avg50}
          </div>
          <div className="text-[11px] text-neutral-600 font-semibold">
            {isAr ? 'حجم المبيعات القياسي والأكثر طلباً' : 'Bestseller baseline size'}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4.5 rounded-2xl shadow-xs space-y-1">
          <div className="text-neutral-900 text-xs font-black uppercase tracking-wider">
            {isAr ? 'متوسط صافي الربح للقارورة' : 'Avg Net Profit / Bottle'}
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            +${avgProfit}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold">
            {isAr ? 'هامش ربح ممتاز ~70% إلى 80%' : '~70-80% gross profit margin'}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4.5 rounded-2xl shadow-xs space-y-1">
          <div className="text-neutral-900 text-xs font-black uppercase tracking-wider">
            {isAr ? 'خلطات نسمات الملكية' : 'Signature Blends'}
          </div>
          <div className="text-2xl font-black text-amber-700 font-serif">
            {recipes.length} <span className="text-xs font-bold text-neutral-600">{isAr ? 'وصفة خاصة' : 'recipes'}</span>
          </div>
          <div className="text-[11px] text-amber-800 font-bold">
            {isAr ? 'وصفات حصرية بتسعير مستقل' : 'Exclusive artisan signatures'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAr ? 'ابحث باسم العطر، الكود، أو الماركة...' : 'Search fragrance, code or brand...'}
              className="w-full ps-9 pe-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:outline-none focus:border-black font-medium"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black font-bold focus:outline-none cursor-pointer"
          >
            <option value="all">{isAr ? 'كل الأقسام والمنتجات' : 'All Departments'}</option>
            <option value="oil">{isAr ? 'عطورات وزيوت فاخرة 🧴' : 'Perfumes & Oils'}</option>
            <option value="makeup">{isAr ? 'مكياج ومستحضرات 💄' : 'Makeup & Cosmetics'}</option>
            <option value="accessories">{isAr ? 'إكسسوارات وهدايا 💍' : 'Accessories & Gifts'}</option>
            <option value="bakhoor">{isAr ? 'بخور ومعطرات جو 🪔' : 'Bakhoor & Scents'}</option>
            <option value="recipe">{isAr ? 'خلطات نسمات الملكية ★' : 'Signature Blends'}</option>
            <option value="other">{isAr ? 'منتجات عامة ومتنوعة 📦' : 'Other Products'}</option>
          </select>

          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black font-bold focus:outline-none cursor-pointer max-w-[160px]"
          >
            <option value="all">{isAr ? 'كل الماركات' : 'All Brands'}</option>
            {allBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Family Filter */}
          <select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black font-bold focus:outline-none cursor-pointer max-w-[160px]"
          >
            <option value="all">{isAr ? 'كل العائلات' : 'All Families'}</option>
            {allFamilies.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-bold">{isAr ? 'ترتيب:' : 'Sort:'}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black font-bold focus:outline-none cursor-pointer"
          >
            <option value="name">{isAr ? 'الاسم أبجدياً' : 'Name (A-Z)'}</option>
            <option value="price_desc">{isAr ? 'السعر (الأعلى أولاً)' : 'Price (High to Low)'}</option>
            <option value="price_asc">{isAr ? 'السعر (الأقل أولاً)' : 'Price (Low to High)'}</option>
            <option value="margin">{isAr ? 'هامش الربح (الأعلى أولاً)' : 'Highest Profit Margin'}</option>
          </select>
        </div>
      </div>

      {/* Products & Individual Pricing List */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100 border-b-2 border-neutral-300 text-black font-black uppercase tracking-wider text-xs">
                <th className="py-3.5 px-4 text-start font-black text-black">{isAr ? 'المنتج / العطر والأحجام' : 'Fragrance & Sizes'}</th>
                <th className="py-3.5 px-3 text-center font-black text-black">{isAr ? 'الباركود (Barcode)' : 'Barcode'}</th>
                <th className="py-3.5 px-3 text-center font-black text-black">{isAr ? 'التكلفة المقدرة (50ml)' : 'Est. Cost (50ml)'}</th>
                <th className="py-3.5 px-3 text-center bg-amber-100/90 text-amber-950 font-black border-x border-amber-300">
                  {isAr ? 'سعر 30ml ($)' : '30ml Price ($)'}
                </th>
                <th className="py-3.5 px-3 text-center bg-amber-200 text-amber-950 font-black border-e border-amber-400">
                  {isAr ? 'سعر 50ml ($) ★' : '50ml Price ($) ★'}
                </th>
                <th className="py-3.5 px-3 text-center bg-amber-100/90 text-amber-950 font-black border-e border-amber-300">
                  {isAr ? 'سعر 100ml ($)' : '100ml Price ($)'}
                </th>
                <th className="py-3.5 px-3 text-center text-black font-black">
                  {isAr ? 'سعر الجملة ($)' : 'Wholesale ($)'}
                </th>
                <th className="py-3.5 px-3 text-center font-black text-black">{isAr ? 'هامش الربح (50ml)' : 'Profit / Margin'}</th>
                <th className="py-3.5 px-4 text-center font-black text-black">{isAr ? 'الإجراءات والتحكم' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredProducts.map((p) => {
                const profit50 = Number((p.p50 - p.estimatedBottleCost50).toFixed(2));
                const marginPercent = p.p50 > 0 ? Math.round((profit50 / p.p50) * 100) : 0;
                const isSaved = savedFeedback === p.id;
                const isDraftModified = priceDrafts[p.id] !== undefined || barcodeDrafts[p.id] !== undefined || sizeDrafts[p.id] !== undefined;

                return (
                  <tr key={p.key} className="hover:bg-neutral-50/80 transition-colors">
                    {/* Fragrance Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEditPhoto(p)}
                          className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-300 overflow-hidden shrink-0 relative shadow-2xs group/img cursor-pointer text-start"
                          title={isAr ? 'تعديل صورة هذا العطر (خاص بالمدير)' : 'Change Fragrance Photo (Admin Only)'}
                        >
                          <img 
                            src={p.imageUrl || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=150&q=80'} 
                            alt={p.name} 
                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" 
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-4 h-4 text-white" />
                          </div>
                          {p.type === 'recipe' && (
                            <span className="absolute bottom-0 start-0 end-0 bg-amber-500 text-black font-black text-[8px] text-center uppercase tracking-tighter">
                              ROYAL
                            </span>
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="font-black text-sm text-black flex items-center gap-1.5 flex-wrap">
                            <span className="text-black font-black text-sm tracking-wide">{p.name}</span>
                            {p.productNature === 'makeup' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-black flex items-center gap-1">
                                <span>💄</span>
                                <span>{isAr ? `مكياج (${p.packageStockCount || 0} حبة)` : `Cosmetics (${p.packageStockCount || 0})`}</span>
                              </span>
                            )}
                            {p.productNature === 'accessories' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 font-black flex items-center gap-1">
                                <span>💍</span>
                                <span>{isAr ? `إكسسوار (${p.packageStockCount || 0} حبة)` : `Accessory (${p.packageStockCount || 0})`}</span>
                              </span>
                            )}
                            {p.productNature === 'bakhoor' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black flex items-center gap-1">
                                <span>🪔</span>
                                <span>{isAr ? `بخور ومعطر (${p.packageStockCount || 0} علبة)` : `Bakhoor (${p.packageStockCount || 0})`}</span>
                              </span>
                            )}
                            {p.productNature === 'other' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-900 border border-neutral-300 font-black flex items-center gap-1">
                                <span>📦</span>
                                <span>{isAr ? `منتج (${p.packageStockCount || 0} حبة)` : `Item (${p.packageStockCount || 0})`}</span>
                              </span>
                            )}
                            {p.isOriginalPackaged && (!p.productNature || p.productNature === 'perfume_original') && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black shadow-2xs border border-amber-400 flex items-center gap-1">
                                <span>💎</span>
                                <span>{isAr ? `عطر أصلي معلب (${p.packageStockCount || 0} حبة)` : `Original Boxed (${p.packageStockCount || 0})`}</span>
                              </span>
                            )}
                            {p.type === 'recipe' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 font-black">
                                {isAr ? 'خلطة ملكية' : 'Signature'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-800 font-semibold flex items-center gap-2 mt-1 flex-wrap">
                            <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] border border-neutral-300 shadow-2xs">{p.code}</span>
                            <span>•</span>
                            <span className="text-black font-black">{p.brand}</span>
                            {p.colorOrShade && (
                              <>
                                <span>•</span>
                                <span className="text-rose-700 font-bold">{isAr ? `درجة:` : `Shade:`} {p.colorOrShade}</span>
                              </>
                            )}
                            {p.specification && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-700 font-bold">{p.specification}</span>
                              </>
                            )}
                            {!p.colorOrShade && !p.specification && (
                              <>
                                <span>•</span>
                                <span className="text-neutral-700 font-bold capitalize">{p.family}</span>
                              </>
                            )}
                          </div>

                          {/* Available Sizes / Units */}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {p.productNature && p.productNature !== 'perfume_crafted' && p.productNature !== 'perfume_original' ? (
                              <span className="text-[10px] font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-300">
                                {isAr ? `المخزون المتوفر: ${p.packageStockCount || 0} قطعة • بيع مباشر بالوحدة` : `Stock: ${p.packageStockCount || 0} pcs • Unit retail`}
                              </span>
                            ) : (
                              <>
                                <span className="text-[10px] text-neutral-500 font-bold">{isAr ? 'الأحجام:' : 'Sizes:'}</span>
                                {(() => {
                                  const currentSizes = sizeDrafts[p.id] || p.availableSizes || [30, 50, 100];
                                  const allDisplaySizes = Array.from(new Set([...currentSizes, 30, 50, 100])).sort((a, b) => a - b);
                                  return allDisplaySizes.map((sz) => {
                                    const isAvail = currentSizes.includes(sz);
                                    return (
                                      <button
                                        key={sz}
                                        type="button"
                                        onClick={() => {
                                          const next = isAvail ? currentSizes.filter((s) => s !== sz) : [...currentSizes, sz].sort((a, b) => a - b);
                                          setSizeDrafts((prev) => ({ ...prev, [p.id]: next }));
                                        }}
                                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono transition border cursor-pointer ${
                                          isAvail
                                            ? 'bg-neutral-900 text-amber-300 border-neutral-900 shadow-2xs'
                                            : 'bg-neutral-100 text-neutral-400 border-dashed border-neutral-300 line-through'
                                        }`}
                                        title={isAr ? `تبديل توفر حجم ${sz} مل (مفعّل: ${isAvail ? 'نعم' : 'لا'})` : `Toggle ${sz}ml`}
                                      >
                                        {sz}ml
                                      </button>
                                    );
                                  });
                                })()}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Barcode Cell */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-white border border-neutral-300 rounded-xl px-2 py-1 shadow-2xs">
                        <span className="text-neutral-400 font-mono text-xs" title="رمز الباركود">📊</span>
                        <input
                          type="text"
                          value={barcodeDrafts[p.id] !== undefined ? barcodeDrafts[p.id] : p.barcode}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setBarcodeDrafts((prev) => ({ ...prev, [p.id]: val }));
                          }}
                          placeholder="Barcode"
                          className="w-24 font-mono text-xs font-bold text-neutral-900 text-center focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const auto = generatePerfumeBarcode(p.code);
                            setBarcodeDrafts((prev) => ({ ...prev, [p.id]: auto }));
                          }}
                          title={isAr ? 'توليد باركود تلقائي' : 'Auto-generate barcode'}
                          className="text-neutral-400 hover:text-black font-bold text-xs p-0.5 cursor-pointer"
                        >
                          ⚡
                        </button>
                      </div>
                    </td>

                    {/* Est. Cost per 50ml */}
                    <td className="py-3.5 px-3 text-center font-mono text-neutral-600 font-semibold">
                      ${p.estimatedBottleCost50.toFixed(2)}
                    </td>

                    {/* Price 30ml Input */}
                    <td className="py-2.5 px-3 text-center bg-amber-50/20 border-x border-amber-200/30">
                      <div className="inline-flex items-center justify-center">
                        <span className="text-neutral-400 font-mono me-1">$</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={p.p30}
                          onChange={(e) => handlePriceChange(p.id, 'p30', parseFloat(e.target.value) || 0)}
                          className="w-16 py-1.5 px-2 rounded-lg bg-white border border-neutral-300 font-mono font-bold text-center text-xs text-black focus:outline-none focus:border-black"
                        />
                      </div>
                    </td>

                    {/* Price 50ml Input (PRIMARY BESTSELLER) */}
                    <td className="py-2.5 px-3 text-center bg-amber-100/30 border-e border-amber-300/40">
                      <div className="inline-flex items-center justify-center">
                        <span className="text-neutral-500 font-mono me-1 font-bold">$</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={p.p50}
                          onChange={(e) => handlePriceChange(p.id, 'p50', parseFloat(e.target.value) || 0)}
                          className="w-18 py-1.5 px-2 rounded-lg bg-white border-2 border-amber-400 font-mono font-black text-center text-xs text-black focus:outline-none focus:border-black shadow-xs"
                        />
                      </div>
                    </td>

                    {/* Price 100ml Input */}
                    <td className="py-2.5 px-3 text-center bg-amber-50/20 border-e border-amber-200/30">
                      <div className="inline-flex items-center justify-center">
                        <span className="text-neutral-400 font-mono me-1">$</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={p.p100}
                          onChange={(e) => handlePriceChange(p.id, 'p100', parseFloat(e.target.value) || 0)}
                          className="w-16 py-1.5 px-2 rounded-lg bg-white border border-neutral-300 font-mono font-bold text-center text-xs text-black focus:outline-none focus:border-black"
                        />
                      </div>
                    </td>

                    {/* Wholesale Input */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center justify-center">
                        <span className="text-neutral-400 font-mono me-1">$</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={p.wholesale}
                          onChange={(e) => handlePriceChange(p.id, 'wholesale', parseFloat(e.target.value) || 0)}
                          className="w-16 py-1.5 px-2 rounded-lg bg-white border border-neutral-200 font-mono text-center text-xs text-neutral-800 focus:outline-none focus:border-black"
                        />
                      </div>
                    </td>

                    {/* Live Margin Calculation */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-mono font-bold ${profit50 > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {profit50 > 0 ? `+$${profit50}` : `-$${Math.abs(profit50)}`}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          marginPercent >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {marginPercent}% {isAr ? 'هامش' : 'margin'}
                        </span>
                      </div>
                    </td>

                    {/* Quick Save & Permanent Delete Action Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveIndividualPrice(p)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                            isSaved
                              ? 'bg-emerald-600 text-white'
                              : isDraftModified
                              ? 'bg-black text-white hover:bg-neutral-800 animate-pulse'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
                          }`}
                          title={isAr ? 'حفظ السعر الفردي لهذا العطر' : 'Save individual price'}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>{isAr ? 'تم الحفظ ✅' : 'Saved'}</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>{isAr ? 'حفظ السعر' : 'Save'}</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 rounded-xl text-rose-500 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition cursor-pointer shadow-2xs"
                          title={isAr ? `حذف عطر "${p.name}" نهائياً من المتجر` : `Delete product "${p.name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Price Adjuster Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-neutral-200 text-black">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-black uppercase">
                    {isAr ? 'تعديل أسعار جماعي للمنتجات' : 'Batch Price Adjuster'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isAr ? 'تطبيق أسعار موحدة على مجموعة عطور أو ماركة محددة' : 'Set standardized prices for groups'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  {isAr ? 'نطاق التطبيق:' : 'Apply to:'}
                </label>
                <select
                  value={batchTarget}
                  onChange={(e) => setBatchTarget(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all">{isAr ? 'كافة المنتجات والعطور (الكل)' : 'All Fragrances'}</option>
                  <option value="brand">{isAr ? 'حسب الماركة المحددة' : 'Specific Brand'}</option>
                  <option value="family">{isAr ? 'حسب العائلة العطرية' : 'Specific Family'}</option>
                </select>
              </div>

              {batchTarget === 'brand' && (
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    {isAr ? 'اختر الماركة:' : 'Select Brand:'}
                  </label>
                  <select
                    value={batchTargetValue}
                    onChange={(e) => setBatchTargetValue(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="">{isAr ? '-- اختر ماركة --' : '-- Choose Brand --'}</option>
                    {allBrands.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {batchTarget === 'family' && (
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    {isAr ? 'اختر العائلة العطرية:' : 'Select Family:'}
                  </label>
                  <select
                    value={batchTargetValue}
                    onChange={(e) => setBatchTargetValue(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="">{isAr ? '-- اختر عائلة --' : '-- Choose Family --'}</option>
                    {allFamilies.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">{isAr ? 'سعر 30ml ($):' : '30ml ($):'}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={batchPrice30}
                    onChange={(e) => setBatchPrice30(e.target.value)}
                    className="w-full p-2 rounded-xl border border-neutral-300 font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-amber-900 mb-1">{isAr ? 'سعر 50ml ($) ★:' : '50ml ($) ★:'}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={batchPrice50}
                    onChange={(e) => setBatchPrice50(e.target.value)}
                    className="w-full p-2 rounded-xl border-2 border-amber-400 font-mono font-bold text-center bg-amber-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">{isAr ? 'سعر 100ml ($):' : '100ml ($):'}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={batchPrice100}
                    onChange={(e) => setBatchPrice100(e.target.value)}
                    className="w-full p-2 rounded-xl border border-neutral-300 font-mono font-bold text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
              <button
                onClick={handleApplyBatchPrices}
                className="flex-1 py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                {isAr ? 'تطبيق الأسعار الآن' : 'Apply Changes'}
              </button>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FRAGRANCE PHOTO EDITOR MODAL (تعديل صور العطور حصرياً من المدير) ================= */}
      {editingPhotoItem && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setEditingPhotoItem(null)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden text-black animate-scaleUp my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-black text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Camera className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">
                    {isAr ? 'تعديل صورة العطر (خاص بالمدير)' : 'Edit Fragrance Photo (Admin)'}
                  </h3>
                  <p className="text-[11px] text-neutral-300">
                    <span className="font-mono text-amber-400 font-bold">{editingPhotoItem.code}</span> • {editingPhotoItem.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPhotoItem(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Preview & File Upload */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-black/80 shadow-md bg-white shrink-0 p-0.5">
                  <img
                    src={photoInputUrl || editingPhotoItem.imageUrl || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80'}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="font-black text-neutral-900 text-sm">
                    {editingPhotoItem.name}
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs cursor-pointer shadow-xs transition">
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <span>{isAr ? 'رفع صورة من جهازك' : 'Upload from Device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Direct URL */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  {isAr ? 'أو أدخل رابط الصورة المباشر (URL):' : 'Or Direct Image URL:'}
                </label>
                <input
                  type="url"
                  value={photoInputUrl}
                  onChange={(e) => setPhotoInputUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                />
              </div>

              {/* Presets */}
              <div className="space-y-1.5 pt-1">
                <label className="block font-bold text-neutral-700">
                  {isAr ? 'أو اختر من صور زجاجات العطور الفاخرة:' : 'Or choose preset photo:'}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {LUXURY_PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoInputUrl(preset.url)}
                      className={`p-1 rounded-xl border transition cursor-pointer flex flex-col items-center ${
                        photoInputUrl === preset.url ? 'border-black bg-neutral-100 ring-2 ring-black' : 'border-neutral-200 hover:border-black'
                      }`}
                      title={preset.name}
                    >
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-100">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingPhotoItem(null)}
                className="px-4 py-2 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-xs font-bold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveProductPhoto}
                className="px-5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4 text-white stroke-[3]" />
                <span>{isAr ? 'حفظ الصورة' : 'Save Photo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= COMPREHENSIVE MULTI-DEPARTMENT PRODUCT ADDITION MODAL ================= */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden text-black animate-scaleUp my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-black text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Plus className="w-5 h-5 text-amber-400 stroke-[3]" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white">
                    {isAr ? 'إضافة منتج جديد شامل (عطور • مكياج • إكسسوار • بخور)' : 'Add New Product (All Departments)'}
                  </h3>
                  <p className="text-[11px] text-neutral-300">
                    {isAr 
                      ? 'إدخال سهل وتفصيلي للمنتج مع إمكانية رفع الصورة مباشرة من جهاز الكمبيوتر' 
                      : 'Easy addition with department customization and direct computer photo upload'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1.5 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNewFragrance} className="p-5 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto text-xs">
              
              {/* 1. Department Selector (عطورات، مكياج، إكسسوارات، بخور، أخرى) */}
              <div className="space-y-1.5">
                <label className="block font-black text-neutral-800 text-xs">
                  {isAr ? '1. اختر قسم ونوع المنتج المراد إضافته:' : '1. Select Product Department:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PRODUCT_DEPARTMENTS.map((dept) => {
                    const isSelected = newFragrance.department === dept.id;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleSelectDepartment(dept.id)}
                        className={`p-2.5 rounded-2xl border-2 text-start transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-md ring-2 ring-amber-400/50'
                            : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-black hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xl">{dept.icon}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            isSelected ? 'bg-amber-400 text-black' : 'bg-neutral-200 text-neutral-700'
                          }`}>
                            {dept.codePrefix}
                          </span>
                        </div>
                        <div className="font-black text-[11px] leading-tight">
                          {isAr ? dept.labelAr : dept.labelEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Prominent Computer Image Upload Card (رفع الصورة من الكمبيوتر) */}
              <div className="p-4 rounded-2xl bg-neutral-50 border-2 border-dashed border-amber-400/80 hover:border-amber-500 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-black text-amber-400 flex items-center justify-center font-bold shadow-xs">
                      <Camera className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <span className="font-black text-xs text-neutral-900 block">
                        {isAr ? '2. صورة المنتج (رفع مباشر وسريع من جهاز الكمبيوتر)' : '2. Product Image (Upload from Computer)'}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {isAr ? 'اختر صورة من ملفات جهازك — يتم ضغطها وتحسينها تلقائياً لأعلى نقاوة وسرعة' : 'Select an image from your computer — auto-compressed for speed'}
                      </span>
                    </div>
                  </div>
                  {uploadedImageMeta && (
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                      ✓ {uploadedImageMeta.name} (~{uploadedImageMeta.sizeKb}KB)
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Live Image Preview */}
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-black/80 bg-white shadow-md shrink-0 group">
                    <img
                      src={newFragrance.imageUrl || LUXURY_PRESET_IMAGES[0]?.url}
                      alt="Product Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = LUXURY_PRESET_IMAGES[0]?.url;
                      }}
                    />
                    {isCompressingImage && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-[10px] font-bold">
                        <span className="animate-spin text-base">⏳</span>
                        <span>{isAr ? 'جاري التحسين...' : 'Compressing...'}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* File input button */}
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-amber-300 hover:text-white font-black text-xs cursor-pointer shadow-md transition active:scale-95">
                        <Upload className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                        <span>{isAr ? '🖥️ اختيار صورة من الكمبيوتر' : '🖥️ Choose from Computer'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleNewFragranceImageUpload}
                          className="hidden"
                        />
                      </label>

                      {newFragrance.imageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewFragrance((prev) => ({ ...prev, imageUrl: '' }));
                            setUploadedImageMeta(null);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-neutral-300 hover:border-rose-400 hover:bg-rose-50 text-neutral-600 hover:text-rose-700 text-[11px] font-bold transition cursor-pointer"
                        >
                          {isAr ? 'إزالة الصورة' : 'Remove'}
                        </button>
                      )}

                      <span className="text-[10px] text-neutral-400">
                        {isAr ? 'يدعم PNG, JPG, WebP أو رابط مباشر أدناه' : 'PNG, JPG, WebP or direct URL'}
                      </span>
                    </div>

                    {/* URL Input */}
                    <input
                      type="url"
                      value={newFragrance.imageUrl}
                      onChange={(e) => setNewFragrance({ ...newFragrance, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full p-2 rounded-xl border border-neutral-300 font-mono text-[11px] bg-white focus:outline-none focus:border-black"
                    />

                    {/* Quick presets row */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                      <span className="text-[10px] font-bold text-neutral-500 shrink-0">
                        {isAr ? 'أو صور فاخرة جاهزة:' : 'Presets:'}
                      </span>
                      {LUXURY_PRESET_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewFragrance({ ...newFragrance, imageUrl: preset.url })}
                          className={`w-7 h-7 rounded-lg overflow-hidden border shrink-0 transition cursor-pointer ${
                            newFragrance.imageUrl === preset.url ? 'ring-2 ring-black border-black' : 'border-neutral-300 hover:border-black'
                          }`}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {newFragrance.department === 'perfume' ? (
                <>
                  {/* ================= SMART FRAGRANCE DATABASE AUTO-FETCH ASSISTANT ================= */}
              <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-black text-amber-400 flex items-center justify-center font-bold shadow-xs">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-xs sm:text-sm text-neutral-900">
                          {isAr ? 'المساعد الذكي: قاعدة بيانات العطور العالمية والنيش' : 'Smart Fragrance Database Auto-Fill'}
                        </h4>
                        <span className="text-[10px] bg-amber-400/20 text-amber-900 border border-amber-400/40 font-bold px-2 py-0.5 rounded-full">
                          {isAr ? `${PERFUME_PRESETS_DATABASE.length} عطر موثق` : `${PERFUME_PRESETS_DATABASE.length} Curated Perfumes`}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600">
                        {isAr
                          ? 'ابحث باسم العطر أو اختر الدار لجلب الهرم العطري، الملاحظات الشمية، الفئة والأسعار المقترحة فوراً بنقرة واحدة.'
                          : 'Search by fragrance name or brand to autofill olfactory pyramid, notes & suggested pricing in 1 click.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDbSectionExpanded(!isDbSectionExpanded)}
                    className="text-neutral-600 hover:text-black text-xs font-bold px-2.5 py-1 rounded-lg border border-neutral-300 bg-white cursor-pointer shadow-2xs"
                  >
                    {isDbSectionExpanded ? (isAr ? 'طي ▲' : 'Collapse ▲') : (isAr ? 'عرض المكتبة ▼' : 'Expand ▼')}
                  </button>
                </div>

                {/* Autofill Success Notice */}
                {autofillSuccessNotice && (
                  <div className="p-3 bg-amber-500 text-black font-bold text-xs rounded-xl flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="text-base shrink-0">✨</span>
                      <span>{autofillSuccessNotice}</span>
                    </div>
                    <span className="text-[11px] font-bold bg-black text-amber-300 px-3 py-1 rounded-lg shrink-0 whitespace-nowrap shadow-xs font-mono">
                      {isAr ? 'تم الاستيراد بنجاح' : 'Applied'}
                    </span>
                  </div>
                )}

                {isDbSectionExpanded && (
                  <div className="space-y-3 pt-1">
                    {/* Search Input Bar */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        value={dbSearchQuery}
                        onChange={(e) => setDbSearchQuery(e.target.value)}
                        placeholder={isAr ? 'ابحث باسم العطر بالعربية أو الإنكليزية (سوفاج، أفينتوس، بكرات، توم فورد، عود، لويس فويتون...)...' : 'Search perfume name (Sauvage, Aventus, Baccarat, Tom Ford, Oud...)...'}
                        className="w-full pr-10 pl-9 py-2.5 rounded-xl border border-neutral-300 bg-white font-medium text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-2xs"
                      />
                      {dbSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setDbSearchQuery('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black font-bold text-xs p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Brand Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                      <span className="text-[10px] font-bold text-neutral-500 shrink-0">
                        {isAr ? 'دور العطور:' : 'Houses:'}
                      </span>
                      {POPULAR_DATABASE_BRANDS.slice(0, 15).map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => setSelectedDbBrand(brand)}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition shrink-0 cursor-pointer ${
                            selectedDbBrand === brand
                              ? 'bg-black text-amber-400 border-black shadow-xs'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                          }`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>

                    {/* Database Search Results Grid */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {dbSearchResults.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {dbSearchResults.map((preset) => (
                            <div
                              key={preset.id}
                              className="p-2.5 rounded-xl border border-neutral-200 bg-white hover:border-amber-400 hover:shadow-xs transition flex flex-col justify-between gap-2"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-black text-neutral-900 text-xs">
                                      {preset.nameAr}
                                    </span>
                                    <span className="text-[10px] font-mono text-neutral-500">
                                      ({preset.nameEn})
                                    </span>
                                  </div>
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[9px] shrink-0">
                                    {preset.brand}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1.5 text-[10px] text-neutral-600">
                                  <span className="font-medium">
                                    {preset.family === 'oriental' ? 'شرقي' :
                                     preset.family === 'woody' ? 'خشبي' :
                                     preset.family === 'citrus' ? 'حمضيات' :
                                     preset.family === 'fresh' ? 'منعش' :
                                     preset.family === 'floral' ? 'زهري' :
                                     preset.family === 'leather' ? 'جلدي' :
                                     preset.family === 'gourmand' ? 'سويت' : 'أروماتيك'}
                                  </span>
                                  <span className="text-neutral-400">•</span>
                                  <span>
                                    {preset.targetGender === 'men' ? 'رجالي' : preset.targetGender === 'women' ? 'نسائي' : 'للجنسين'}
                                  </span>
                                  <span className="text-neutral-400">•</span>
                                  <span className="font-mono text-emerald-700 font-bold">
                                    50ml: ${preset.suggestedPrice50ml}
                                  </span>
                                </div>

                                {/* Pyramid preview */}
                                <div className="text-[10px] text-neutral-600 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100 leading-tight">
                                  <span className="text-neutral-800 font-bold">الهرم العطري: </span>
                                  <span>{preset.topNotes} ← {preset.heartNotes} ← {preset.baseNotes}</span>
                                </div>
                              </div>

                              {/* Quick Autofill Action Button */}
                              <button
                                type="button"
                                onClick={() => handleAutofillFromPreset(preset)}
                                className="w-full py-1.5 px-3 rounded-lg bg-black hover:bg-neutral-800 text-amber-400 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-[0.98]"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>{isAr ? 'استيراد المواصفات والهرم العطري فوراً ⚡' : 'Auto-Fill Specifications ⚡'}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-neutral-500 bg-white rounded-xl border border-dashed border-neutral-300">
                          {isAr 
                            ? `لم يتم العثور على عطور تطابق "${dbSearchQuery}". يمكنك إدخال بيانات العطر يدوياً بالأسفل.` 
                            : `No perfumes found matching "${dbSearchQuery}". You can enter custom details below.`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Product Nature Toggle (عطر سكب وتركيب VS عطر أصلي معلب جاهز) */}
              <div className="bg-neutral-100 p-1.5 rounded-2xl border border-neutral-300">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewFragrance({ ...newFragrance, isOriginalPackaged: false })}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                      !newFragrance.isOriginalPackaged
                        ? 'bg-black text-amber-300 shadow-md'
                        : 'bg-transparent text-neutral-600 hover:text-black hover:bg-neutral-200/60'
                    }`}
                  >
                    <span>🧴</span>
                    <span>{isAr ? 'عطر سكب وتركيب فاخر (زيوت)' : 'Blended & Decanted Perfume'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewFragrance({ ...newFragrance, isOriginalPackaged: true })}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                      newFragrance.isOriginalPackaged
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md border border-amber-400'
                        : 'bg-transparent text-neutral-600 hover:text-black hover:bg-neutral-200/60'
                    }`}
                  >
                    <span>💎</span>
                    <span>{isAr ? 'عطر أصلي 100% معلب جاهز' : '100% Original Boxed Perfume'}</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Basic Information */}
              <div className="space-y-3">
                <div className="font-black text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-neutral-200">
                  <Tag className="w-3.5 h-3.5 text-black" />
                  <span>{isAr ? '1. معلومات وهوية العطر' : '1. Fragrance Identity'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      {isAr ? 'اسم العطر بالعربية (الاسم التجاري) *:' : 'Perfume Name (Arabic) *:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newFragrance.name}
                      onChange={(e) => setNewFragrance({ ...newFragrance, name: e.target.value })}
                      placeholder={isAr ? 'مثال: عنبر نوي الملكي، ديور هوم إنتنس' : 'e.g. Amber Nuit Royal'}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-xs focus:outline-none focus:border-black"
                    />
                    {/* Live Inline Database Match Pill */}
                    {inlineMatch && (
                      <div className="mt-1.5 p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] flex items-center justify-between gap-2 animate-fadeIn shadow-2xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">💡</span>
                          <span>
                            {isAr ? 'عطر مطابق في قاعدة البيانات:' : 'Matching perfume detected:'}{' '}
                            <strong className="text-black">{inlineMatch.nameAr}</strong> ({inlineMatch.brand})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAutofillFromPreset(inlineMatch)}
                          className="px-2.5 py-1 rounded-lg bg-black text-amber-400 hover:text-white font-bold text-[10px] transition shrink-0 cursor-pointer shadow-2xs"
                        >
                          {isAr ? '⚡ جلب المواصفات تلقائياً' : '⚡ Auto-Fill Specs'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      {isAr ? 'اسم العطر بالإنكليزية:' : 'Perfume Name (English):'}
                    </label>
                    <input
                      type="text"
                      value={newFragrance.nameEn}
                      onChange={(e) => setNewFragrance({ ...newFragrance, nameEn: e.target.value })}
                      placeholder="e.g. Amber Nuit Extrait"
                      className="w-full p-2.5 rounded-xl border border-neutral-300 font-medium text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      {isAr ? 'كود العطر (SKU) *:' : 'Perfume Code (SKU) *:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newFragrance.code}
                      onChange={(e) => setNewFragrance({ ...newFragrance, code: e.target.value.toUpperCase() })}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono font-bold text-xs focus:outline-none focus:border-black bg-neutral-50"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-neutral-700">
                        {isAr ? 'الباركود (Barcode):' : 'Barcode:'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const auto = generatePerfumeBarcode(newFragrance.code || 'NAS-NEW');
                          setNewFragrance({ ...newFragrance, barcode: auto });
                        }}
                        className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                      >
                        ⚡ {isAr ? 'توليد تلقائي' : 'Auto'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newFragrance.barcode}
                      onChange={(e) => setNewFragrance({ ...newFragrance, barcode: e.target.value.trim() })}
                      placeholder="e.g. 62810001001"
                      className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono font-bold text-xs focus:outline-none focus:border-black bg-neutral-50"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      {isAr ? 'الماركة / دار العطر المستوحى منها:' : 'Brand / Fragrance House:'}
                    </label>
                    <input
                      type="text"
                      value={newFragrance.brand}
                      onChange={(e) => setNewFragrance({ ...newFragrance, brand: e.target.value })}
                      placeholder="Dior, Chanel, Creed, نسمات..."
                      className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-xs focus:outline-none focus:border-black"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {POPULAR_BRANDS.slice(0, 5).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setNewFragrance({ ...newFragrance, brand: b })}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                            newFragrance.brand === b ? 'bg-black text-white border-black font-bold' : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:border-black'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Categorization & Target Audience */}
              <div className="space-y-3 pt-2">
                <div className="font-black text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-neutral-200">
                  <Filter className="w-3.5 h-3.5 text-black" />
                  <span>{isAr ? '2. التصنيف والعائلة العطرية والفئة' : '2. Category & Target Audience'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      {isAr ? 'التصنيف / العائلة العطرية *:' : 'Olfactory Family *:'}
                    </label>
                    <select
                      value={newFragrance.family}
                      onChange={(e) => setNewFragrance({ ...newFragrance, family: e.target.value as FragranceFamily })}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-xs focus:outline-none focus:border-black bg-white cursor-pointer"
                    >
                      {FRAGRANCE_FAMILIES_LIST.map((f) => (
                        <option key={f.id} value={f.id}>
                          {isAr ? f.labelAr : f.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      {isAr ? 'الفئة المستهدفة *:' : 'Target Audience *:'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'men' as const, ar: 'رجالي', en: 'Men' },
                        { id: 'women' as const, ar: 'نسائي', en: 'Women' },
                        { id: 'unisex' as const, ar: 'للجنسين', en: 'Unisex' },
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setNewFragrance({ ...newFragrance, targetGender: g.id })}
                          className={`py-2 px-1 text-center font-bold text-xs rounded-xl border transition cursor-pointer ${
                            newFragrance.targetGender === g.id
                              ? 'bg-black text-white border-black shadow-xs'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black'
                          }`}
                        >
                          {isAr ? g.ar : g.en}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Original Packaged Perfume Specific Identity Fields */}
                {newFragrance.isOriginalPackaged && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-300 rounded-2xl space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="text-base">💎</span>
                      <h4 className="font-black text-xs text-amber-950">
                        {isAr ? 'بيانات الأصالة والكرتونة الرسمية (للعطر المعلب الجاهز):' : 'Authenticity & Box Specifications:'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block font-bold text-neutral-700 text-[10px] mb-1">
                          {isAr ? 'تركيز العطر (Concentration):' : 'Concentration:'}
                        </label>
                        <select
                          value={newFragrance.concentration}
                          onChange={(e) => setNewFragrance({ ...newFragrance, concentration: e.target.value })}
                          className="w-full p-2 rounded-xl border border-neutral-300 font-bold text-xs bg-white focus:outline-none focus:border-black"
                        >
                          <option value="Eau de Parfum">Eau de Parfum (EDP)</option>
                          <option value="Parfum / Extrait">Parfum / Extrait de Parfum</option>
                          <option value="Eau de Toilette">Eau de Toilette (EDT)</option>
                          <option value="Eau de Cologne">Eau de Cologne (EDC)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 text-[10px] mb-1">
                          {isAr ? 'بلد الصنع (Country of Origin):' : 'Country of Origin:'}
                        </label>
                        <input
                          type="text"
                          value={newFragrance.countryOfOrigin}
                          onChange={(e) => setNewFragrance({ ...newFragrance, countryOfOrigin: e.target.value })}
                          placeholder="فرنسا، إيطاليا، عمان..."
                          className="w-full p-2 rounded-xl border border-neutral-300 font-bold text-xs bg-white focus:outline-none focus:border-black"
                        >
                        </input>
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 text-[10px] mb-1">
                          {isAr ? 'حالة التغليف والعلبة:' : 'Box Condition:'}
                        </label>
                        <select
                          value={newFragrance.boxCondition}
                          onChange={(e) => setNewFragrance({ ...newFragrance, boxCondition: e.target.value as any })}
                          className="w-full p-2 rounded-xl border border-neutral-300 font-bold text-xs bg-white focus:outline-none focus:border-black"
                        >
                          <option value="sealed">{isAr ? 'مغلف بالسولوفان (Sealed)' : 'Brand New Sealed'}</option>
                          <option value="tester">{isAr ? 'علبة تستر أصلية (Tester Box)' : 'Official Tester Box'}</option>
                          <option value="unboxed">{isAr ? 'بدون كرتونة (Unboxed)' : 'Unboxed'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 text-[10px] mb-1">
                          {isAr ? 'باتش كود العبوة (Batch Code):' : 'Batch Code:'}
                        </label>
                        <input
                          type="text"
                          value={newFragrance.batchCode}
                          onChange={(e) => setNewFragrance({ ...newFragrance, batchCode: e.target.value.toUpperCase() })}
                          placeholder="e.g. 3M01 / 22A01"
                          className="w-full p-2 rounded-xl border border-neutral-300 font-mono font-bold text-xs bg-white text-center focus:outline-none focus:border-black uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Perfume Sizing & Pricing */}
              <div className="space-y-3.5 pt-2">
                <div className="font-black text-neutral-900 uppercase tracking-wider text-[11px] flex items-center justify-between pb-1 border-b border-neutral-200">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-black" />
                    <span>
                      {newFragrance.isOriginalPackaged 
                        ? (isAr ? '3. سعر وتكلفة العبوة الأصلية ومخزون الحبات' : '3. Original Box Pricing & Inventory') 
                        : (isAr ? '3. نوع العطر وتحديد المقاسات والأسعار يدوياً' : '3. Perfume Type & Custom Sizing')}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-900 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {newFragrance.isOriginalPackaged 
                      ? (isAr ? 'عطر أصلي معلب جاهز للبيع' : 'Ready Boxed Retail') 
                      : (isAr ? 'تخصيص حر حسب نوع العطر' : 'Flexible Sizes & Prices')}
                  </span>
                </div>

                {newFragrance.isOriginalPackaged ? (
                  /* ================= ORIGINAL PACKAGED PERFUME RETAIL PRICING & INVENTORY ================= */
                  <div className="space-y-3 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white p-4 rounded-2xl border border-amber-300">
                    <div className="flex items-center gap-2 p-2.5 bg-black text-amber-300 rounded-xl text-xs font-bold shadow-xs">
                      <span className="text-base">💎</span>
                      <span>
                        {isAr 
                          ? 'هذا منتج أصلي معلب جاهز للبيع: يُباع بالعبوة/الحبة الكاملة، ويُحسب المخزون بعدد العلب المتوفرة مباشرة.'
                          : 'Original Retail Product: Sold as ready-made sealed bottles, stock tracked by number of physical units.'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-neutral-800 text-xs mb-1">
                          {isAr ? 'حجم / سعة العلبة الأصلية (ملل) *:' : 'Bottle Size (ML) *:'}
                        </label>
                        <select
                          value={newFragrance.singleBottleSizeMl}
                          onChange={(e) => setNewFragrance({ ...newFragrance, singleBottleSizeMl: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono font-black text-xs bg-white focus:outline-none focus:border-black"
                        >
                          <option value="30">30 ml</option>
                          <option value="50">50 ml</option>
                          <option value="75">75 ml</option>
                          <option value="100">100 ml (الحجم القياسي الشائع)</option>
                          <option value="125">125 ml</option>
                          <option value="150">150 ml</option>
                          <option value="200">200 ml</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-800 text-xs mb-1">
                          {isAr ? 'سعر البيع للزبون ($) *:' : 'Retail Selling Price ($) *:'}
                        </label>
                        <div className="flex items-center bg-white border-2 border-amber-400 rounded-xl px-2.5 py-1.5 shadow-2xs">
                          <span className="text-neutral-500 font-mono font-black text-xs me-1">$</span>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            required
                            value={newFragrance.singleBottlePrice}
                            onChange={(e) => setNewFragrance({ ...newFragrance, singleBottlePrice: e.target.value })}
                            placeholder="85"
                            className="w-full font-mono font-black text-sm text-black bg-transparent focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-800 text-xs mb-1">
                          {isAr ? 'السعر الأصلي قبل الخصم ($):' : 'Compare-At Price ($):'}
                        </label>
                        <div className="flex items-center bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5">
                          <span className="text-neutral-400 font-mono text-xs me-1">$</span>
                          <input
                            type="number"
                            step="0.5"
                            value={newFragrance.originalRetailPrice}
                            onChange={(e) => setNewFragrance({ ...newFragrance, originalRetailPrice: e.target.value })}
                            placeholder="120"
                            className="w-full font-mono font-bold text-xs text-neutral-700 bg-transparent focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-amber-200">
                      <div>
                        <label className="block font-bold text-neutral-800 text-xs mb-1">
                          {isAr ? 'تكلفة شراء العلبة الواحدة ($):' : 'Unit Cost Price ($):'}
                        </label>
                        <div className="flex items-center bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5">
                          <span className="text-neutral-400 font-mono text-xs me-1">$</span>
                          <input
                            type="number"
                            step="0.5"
                            value={newFragrance.packageCostPrice}
                            onChange={(e) => setNewFragrance({ ...newFragrance, packageCostPrice: e.target.value })}
                            placeholder="55"
                            className="w-full font-mono font-bold text-xs text-neutral-900 bg-transparent focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-800 text-xs mb-1">
                          {isAr ? 'عدد العلب المتوفرة بالمخزون (حبة) *:' : 'Stock Quantity (Bottles/Boxes) *:'}
                        </label>
                        <div className="flex items-center bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5">
                          <span className="text-neutral-400 font-mono text-xs me-1">📦</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            required
                            value={newFragrance.packageStockCount}
                            onChange={(e) => setNewFragrance({ ...newFragrance, packageStockCount: e.target.value })}
                            placeholder="5"
                            className="w-full font-mono font-black text-xs text-neutral-900 bg-transparent focus:outline-none text-center"
                          />
                          <span className="text-[10px] text-neutral-500 font-bold ms-1">{isAr ? 'علبة' : 'units'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-800 text-xs mb-1">
                          {isAr ? 'سعر الجملة للعلبة ($):' : 'Wholesale Price ($):'}
                        </label>
                        <div className="flex items-center bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5">
                          <span className="text-neutral-400 font-mono text-xs me-1">$</span>
                          <input
                            type="number"
                            step="0.5"
                            value={newFragrance.wholesalePrice50ml}
                            onChange={(e) => setNewFragrance({ ...newFragrance, wholesalePrice50ml: e.target.value })}
                            placeholder="65"
                            className="w-full font-mono font-bold text-xs text-neutral-900 bg-transparent focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= COMPOUNDED & CUSTOM SIZE PRESETS ================= */
                  <>
                    {/* Perfume Presentation Type Selector */}
                    <div>
                      <label className="block font-bold text-neutral-800 text-xs mb-1.5">
                        {isAr ? 'اختر نوع العطر (لتطبيق المقاسات المناسبة تلقائياً):' : 'Select Perfume Type:'}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(Object.keys(PERFUME_TYPE_CONFIG) as PerfumePresentationType[]).map((typeKey) => {
                          const cfg = PERFUME_TYPE_CONFIG[typeKey];
                          const isSelected = newFragrance.perfumeType === typeKey;
                          return (
                            <button
                              key={typeKey}
                              type="button"
                              onClick={() => handleSelectPerfumeType(typeKey)}
                              className={`p-2.5 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-neutral-950 text-white border-neutral-950 shadow-md ring-1 ring-amber-400'
                                  : 'bg-neutral-50 hover:bg-white text-neutral-800 border-neutral-200 hover:border-black'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-base">{cfg.icon}</span>
                                <span className="text-xs font-black truncate">{isAr ? cfg.labelAr : cfg.labelEn}</span>
                              </div>
                              <span className={`text-[9.5px] leading-tight ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                {isAr ? cfg.descAr : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Sizes & Price List for this Perfume */}
                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-black">
                            {isAr ? 'المقاسات المعتمدة وأسعار البيع المخصصة ($):' : 'Configured Sizes & Prices ($):'}
                          </h4>
                          <p className="text-[10px] text-neutral-500">
                            {isAr ? 'يمكنك تعديل سعر أي مقاس مباشرة أو حذفه بنقرة واحدة' : 'Directly edit price or delete size'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-neutral-200 text-neutral-700">
                          {newFragrance.sizeEntries.length} {isAr ? 'مقاسات معتمدة' : 'Sizes'}
                        </span>
                      </div>

                      {/* Configured Size Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {newFragrance.sizeEntries.map((entry) => {
                          return (
                            <div
                              key={entry.size}
                              className="bg-white p-2.5 rounded-xl border border-neutral-300 shadow-2xs flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                  <span className="font-mono font-black text-xs text-black">{entry.size}ml</span>
                                </div>
                                <div className="text-[10px] text-neutral-500 truncate font-semibold">
                                  {entry.label || `${entry.size}ml`}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <div className="flex items-center bg-neutral-50 border border-neutral-300 rounded-lg px-1.5 py-1">
                                  <span className="text-[11px] text-neutral-500 font-mono me-0.5">$</span>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    value={entry.price}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      handleUpdateSizePrice(entry.size, val);
                                    }}
                                    className="w-12 text-center font-mono font-black text-xs text-neutral-900 bg-transparent focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSize(entry.size)}
                                  disabled={newFragrance.sizeEntries.length <= 1}
                                  title={isAr ? 'حذف هذا المقاس' : 'Delete size'}
                                  className="text-neutral-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-neutral-400 p-1 cursor-pointer transition font-bold"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Manual Size & Price Adder */}
                      <div className="pt-2 border-t border-neutral-200">
                        <label className="block font-bold text-neutral-700 text-[10px] mb-1.5">
                          {isAr ? '➕ إضافة مقاس مخصص يدوياً (أدخل الحجم وسعر البيع):' : '➕ Add Custom Size & Price Manually:'}
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex-1 min-w-[90px]">
                            <input
                              type="number"
                              min="1"
                              placeholder={isAr ? 'الحجم بالملل (مثلاً 15)' : 'Size in ml (e.g. 15)'}
                              value={manualSizeMl}
                              onChange={(e) => setManualSizeMl(e.target.value)}
                              className="w-full p-2 rounded-xl border border-neutral-300 font-mono text-xs bg-white text-center focus:outline-none focus:border-black font-bold"
                            />
                          </div>

                          <div className="flex-1 min-w-[90px]">
                            <div className="flex items-center bg-white border border-neutral-300 rounded-xl px-2 py-1.5">
                              <span className="text-xs text-neutral-400 font-mono me-1">$</span>
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                placeholder={isAr ? 'سعر البيع' : 'Price'}
                                value={manualPriceUsd}
                                onChange={(e) => setManualPriceUsd(e.target.value)}
                                className="w-full font-mono text-xs bg-transparent text-center focus:outline-none font-bold"
                              />
                            </div>
                          </div>

                          <div className="flex-1 min-w-[110px]">
                            <input
                              type="text"
                              placeholder={isAr ? 'وصف الحجم (مثلاً تولة)' : 'Label (Optional)'}
                              value={manualLabel}
                              onChange={(e) => setManualLabel(e.target.value)}
                              className="w-full p-2 rounded-xl border border-neutral-300 text-xs bg-white text-center focus:outline-none focus:border-black"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleAddManualSize}
                            disabled={!manualSizeMl.trim() || !manualPriceUsd.trim()}
                            className="px-3.5 py-2 rounded-xl bg-black text-amber-300 hover:bg-neutral-800 disabled:opacity-40 text-xs font-black shadow-xs transition cursor-pointer shrink-0"
                          >
                            {isAr ? '+ إضافة المقاس' : '+ Add Size'}
                          </button>
                        </div>
                      </div>

                      {/* Quick Toggle Popular Sizes Badges */}
                      <div className="pt-2 border-t border-neutral-200">
                        <span className="text-[10px] text-neutral-500 font-bold block mb-1">
                          {isAr ? 'مقاسات سريعة شائعة (انقر للإضافة أو الحذف السريع):' : 'Quick Popular Sizes (click to toggle):'}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[3, 6, 10, 12, 15, 20, 30, 50, 80, 100, 150, 200].map((sz) => {
                            const isAdded = newFragrance.sizeEntries.some((e) => e.size === sz);
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => handleQuickToggleSize(sz)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition border cursor-pointer flex items-center gap-1 ${
                                  isAdded
                                    ? 'bg-neutral-900 text-amber-300 border-neutral-900 shadow-2xs'
                                    : 'bg-white text-neutral-600 border-neutral-300 hover:border-black'
                                }`}
                              >
                                <span>{isAdded ? '✓' : '+'}</span>
                                <span>{sz}ml</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Wholesale Price & Inventory Cost */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                        <label className="block font-bold text-neutral-700 text-[10px] mb-1">
                          {isAr ? 'سعر الجملة للعبوة المعتادة ($):' : 'Wholesale Bottle ($):'}
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          required
                          value={newFragrance.wholesalePrice50ml}
                          onChange={(e) => setNewFragrance({ ...newFragrance, wholesalePrice50ml: e.target.value })}
                          className="w-full p-1.5 rounded-lg border border-neutral-300 font-mono font-bold text-center text-xs bg-white"
                        />
                      </div>

                      <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                        <label className="block font-bold text-neutral-700 text-[10px] mb-1">
                          {isAr ? 'تكلفة الملي/الجرام الصافي ($):' : 'Oil Cost Per ML ($):'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newFragrance.unitCost}
                          onChange={(e) => setNewFragrance({ ...newFragrance, unitCost: e.target.value })}
                          className="w-full p-1.5 rounded-lg border border-neutral-300 font-mono font-bold text-center text-xs bg-white"
                        />
                      </div>

                      <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                        <label className="block font-bold text-neutral-700 text-[10px] mb-1">
                          {isAr ? 'الكمية بالمخزون (ملل):' : 'Stock Quantity (ML):'}
                        </label>
                        <input
                          type="number"
                          value={newFragrance.stockMl}
                          onChange={(e) => setNewFragrance({ ...newFragrance, stockMl: e.target.value })}
                          className="w-full p-1.5 rounded-lg border border-neutral-300 font-mono font-bold text-center text-xs bg-white"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Section 4: Olfactory Pyramid & Notes */}
              <div className="space-y-3 pt-2">
                <div className="font-black text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-neutral-200">
                  <FlaskConical className="w-3.5 h-3.5 text-black" />
                  <span>{isAr ? '4. الهرم العطري والملاحظات الشمية' : '4. Olfactory Pyramid & Notes'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      {isAr ? 'الافتتاحية (قمة العطر):' : 'Top Notes:'}
                    </label>
                    <input
                      type="text"
                      value={newFragrance.topNotes}
                      onChange={(e) => setNewFragrance({ ...newFragrance, topNotes: e.target.value })}
                      placeholder="برغموت، فلفل وردي..."
                      className="w-full p-2 rounded-xl border border-neutral-300 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      {isAr ? 'القلب (قلب العطر):' : 'Heart Notes:'}
                    </label>
                    <input
                      type="text"
                      value={newFragrance.heartNotes}
                      onChange={(e) => setNewFragrance({ ...newFragrance, heartNotes: e.target.value })}
                      placeholder="ياسمين، خشب الأرز..."
                      className="w-full p-2 rounded-xl border border-neutral-300 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      {isAr ? 'القاعدة (قاعدة العطر):' : 'Base Notes:'}
                    </label>
                    <input
                      type="text"
                      value={newFragrance.baseNotes}
                      onChange={(e) => setNewFragrance({ ...newFragrance, baseNotes: e.target.value })}
                      placeholder="عنبر، مسك أبيض، عود..."
                      className="w-full p-2 rounded-xl border border-neutral-300 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    {isAr ? 'قصة أو وصف العطر السريع:' : 'Fragrance Story / Description:'}
                  </label>
                  <textarea
                    rows={2}
                    value={newFragrance.notes}
                    onChange={(e) => setNewFragrance({ ...newFragrance, notes: e.target.value })}
                    placeholder={isAr ? 'عطر فاخر يجسد الرقي والفخامة مع ثبات وفوحان استثنائي...' : 'Luxury artisan formulation...'}
                    className="w-full p-2 rounded-xl border border-neutral-300 text-xs bg-white"
                  />
                </div>
              </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Department Banner & Guide */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-black text-white border border-neutral-700 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1 bg-white/10 rounded-xl">
                        {newFragrance.department === 'makeup' ? '💄' :
                         newFragrance.department === 'accessories' ? '💍' :
                         newFragrance.department === 'bakhoor' ? '🪔' : '🛍️'}
                      </span>
                      <div>
                        <div className="font-black text-xs sm:text-sm text-amber-300">
                          {newFragrance.department === 'makeup' ? (isAr ? 'إضافة مستحضر تجميل / مكياج فاخر' : 'Add Luxury Cosmetics / Makeup') :
                           newFragrance.department === 'accessories' ? (isAr ? 'إضافة إكسسوار راقٍ / مجوهرات وهدايا' : 'Add Luxury Accessories & Jewelry') :
                           newFragrance.department === 'bakhoor' ? (isAr ? 'إضافة بخور ملكي / عود ومعطرات' : 'Add Royal Bakhoor & Incense') :
                           (isAr ? 'إضافة منتج بوتيك عام' : 'Add Boutique Product')}
                        </div>
                        <p className="text-[11px] text-neutral-300">
                          {isAr
                            ? 'أدخل بيانات وتفاصيل المنتج والأسعار مباشرة لنشره فوراً في المتجر والمخزون.'
                            : 'Fill product details, pricing and stock count to immediately publish.'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                      {newFragrance.department.toUpperCase()}
                    </span>
                  </div>

                  {/* Section: Basic Identity */}
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-neutral-200">
                    <div className="font-black text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-neutral-200">
                      <Tag className="w-3.5 h-3.5 text-black" />
                      <span>{isAr ? '1. معلومات وهوية المنتج الأساسية' : '1. Product Identity'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1 text-xs">
                          {isAr ? 'اسم المنتج بالعربية *:' : 'Product Name (Arabic) *:'}
                        </label>
                        <input
                          type="text"
                          required
                          value={newFragrance.name}
                          onChange={(e) => setNewFragrance({ ...newFragrance, name: e.target.value })}
                          placeholder={
                            newFragrance.department === 'makeup' ? (isAr ? 'مثال: أحمر شفاه مخملي غير لامع' : 'e.g. Velvet Matte Lipstick') :
                            newFragrance.department === 'accessories' ? (isAr ? 'مثال: مبخرة كريستال ملكية بحواف ذهبية' : 'e.g. Crystal Royal Incense Burner') :
                            newFragrance.department === 'bakhoor' ? (isAr ? 'مثال: بخور مروكي فاخر دبل سوبر' : 'e.g. Double Super Maroki Bakhoor') :
                            (isAr ? 'مثال: معطر مفارش وأجواء VIP' : 'e.g. VIP Atmosphere Mist')
                          }
                          className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-xs focus:outline-none focus:border-black"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 mb-1 text-xs">
                          {isAr ? 'اسم المنتج بالإنكليزية:' : 'Product Name (English):'}
                        </label>
                        <input
                          type="text"
                          value={newFragrance.nameEn}
                          onChange={(e) => setNewFragrance({ ...newFragrance, nameEn: e.target.value })}
                          placeholder={
                            newFragrance.department === 'makeup' ? 'Velvet Matte Lipstick #02' :
                            newFragrance.department === 'accessories' ? 'Royal Gold-Rimmed Crystal Burner' :
                            newFragrance.department === 'bakhoor' ? 'Maroki Royal Double Super' :
                            'Boutique Luxury Item'
                          }
                          className="w-full p-2.5 rounded-xl border border-neutral-300 font-medium text-xs focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    {/* Brand & Subcategory */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1 text-xs">
                          {isAr ? 'الماركة / دار الصنع:' : 'Brand / House:'}
                        </label>
                        <input
                          type="text"
                          value={newFragrance.brand}
                          onChange={(e) => setNewFragrance({ ...newFragrance, brand: e.target.value })}
                          placeholder={isAr ? 'نسمات، هدى بيوتي، سواروفسكي...' : 'Brand name...'}
                          className="w-full p-2 rounded-xl border border-neutral-300 font-bold text-xs focus:outline-none focus:border-black"
                        />
                        {/* Quick brand chips */}
                        <div className="flex items-center gap-1 overflow-x-auto pt-1.5 scrollbar-thin">
                          {(newFragrance.department === 'makeup'
                            ? ['نسمات بيوتي', 'Huda Beauty', 'Dior', 'MAC', 'Charlotte Tilbury', 'Kiko']
                            : newFragrance.department === 'accessories'
                            ? ['نسمات كولكشن', 'Swarovski', 'Pandora', 'Cartier', 'Tiffany', 'Van Cleef']
                            : newFragrance.department === 'bakhoor'
                            ? ['نسمات الملكية', 'عبد الصمد القرشي', 'الماجد للعود', 'أجمل', 'العربية للعود']
                            : ['دار نسمات', 'Boutique Nasamat', 'Luxury Collection']
                          ).map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setNewFragrance({ ...newFragrance, brand: b })}
                              className={`text-[9px] px-2 py-0.5 rounded-md border font-semibold shrink-0 cursor-pointer transition ${
                                newFragrance.brand === b
                                  ? 'bg-black text-amber-300 border-black'
                                  : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:border-black'
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 mb-1 text-xs">
                          {isAr ? 'التصنيف الفرعي للمنتج:' : 'Sub-Category:'}
                        </label>
                        <input
                          type="text"
                          value={newFragrance.subCategory}
                          onChange={(e) => setNewFragrance({ ...newFragrance, subCategory: e.target.value })}
                          placeholder={isAr ? 'أحمر شفاه، مباخر، معمول، قلائد...' : 'Subcategory...'}
                          className="w-full p-2 rounded-xl border border-neutral-300 font-bold text-xs focus:outline-none focus:border-black"
                        />
                        {/* Quick category chips */}
                        <div className="flex items-center gap-1 overflow-x-auto pt-1.5 scrollbar-thin">
                          {(newFragrance.department === 'makeup'
                            ? ['أحمر شفاه', 'باليت ظلال', 'كريم أساس', 'مسكارا', 'بلاشر', 'محدد شفاه']
                            : newFragrance.department === 'accessories'
                            ? ['مباخر ملكية', 'سلاسل وقلائد', 'أساور', 'خواتم', 'علب هدايا فاخرة', 'ساعات راقية']
                            : newFragrance.department === 'bakhoor'
                            ? ['بخور مروكي', 'عود كلمنتان', 'معمول ملكي', 'مبثوث فاخر', 'رقائق عود']
                            : ['معطرات مفارش', 'شموع عطرية', 'بكج هدايا VIP', 'لوشن للجسم']
                          ).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewFragrance({ ...newFragrance, subCategory: c })}
                              className={`text-[9px] px-2 py-0.5 rounded-md border font-semibold shrink-0 cursor-pointer transition ${
                                newFragrance.subCategory === c
                                  ? 'bg-black text-amber-300 border-black'
                                  : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:border-black'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Department-Specific Feature: Color/Shade OR Specification/Material */}
                    {newFragrance.department === 'makeup' ? (
                      <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block font-black text-rose-950 text-xs">
                            {isAr ? '💄 درجة اللون أو رقم الشيد (Color Shade):' : '💄 Color Shade / Number:'}
                          </label>
                          <span className="text-[10px] text-rose-700 font-bold">
                            {isAr ? 'يظهر للزبون في بطاقة المنتج لاختيار الدرجة' : 'Shown to customers'}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={newFragrance.colorOrShade}
                          onChange={(e) => setNewFragrance({ ...newFragrance, colorOrShade: e.target.value })}
                          placeholder={isAr ? 'مثال: #02 Velvet Rose، 08 Red Ruby، وردي طبيعي...' : 'e.g. #02 Velvet Rose, 08 Red Ruby...'}
                          className="w-full p-2 rounded-xl border border-rose-300 font-bold text-xs bg-white focus:outline-none focus:border-rose-600"
                        />
                        <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 scrollbar-thin">
                          {['#01 Nude Glow', '#02 Velvet Rose', '#03 Ruby Red', '#04 Berry Pink', '#05 Coral Sun', '01 Fair Ivory', '02 Natural Beige'].map((shade) => (
                            <button
                              key={shade}
                              type="button"
                              onClick={() => setNewFragrance({ ...newFragrance, colorOrShade: shade })}
                              className="text-[9px] px-2 py-0.5 rounded-md bg-white border border-rose-200 hover:border-rose-500 font-bold text-rose-900 shrink-0 cursor-pointer"
                            >
                              {shade}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block font-black text-amber-950 text-xs">
                            {newFragrance.department === 'bakhoor'
                              ? (isAr ? '🪔 الوزن أو حجم العبوة وحالة الكسرات:' : '🪔 Weight / Grade:')
                              : (isAr ? '💎 مواصفات الخامة والمقاس:' : '💎 Material & Specifications:')}
                          </label>
                          <span className="text-[10px] text-amber-800 font-bold">
                            {isAr ? 'يظهر للزبون كبيان فخامة للمنتج' : 'Product specifications'}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={newFragrance.specification}
                          onChange={(e) => setNewFragrance({ ...newFragrance, specification: e.target.value })}
                          placeholder={
                            newFragrance.department === 'bakhoor'
                              ? (isAr ? 'مثال: تولة (12 غرام) دبل سوبر، أوقية (30 غرام) كسر مباخر...' : 'e.g. 1 Tola (12g), Double Super...')
                              : (isAr ? 'مثال: كريستال بوهيمي منقوش ذهب، فضة إسترليني 925، ستانلس ستيل مطلي...' : 'e.g. Bohemian Crystal, 925 Sterling Silver...')
                          }
                          className="w-full p-2 rounded-xl border border-amber-300 font-bold text-xs bg-white focus:outline-none focus:border-amber-600"
                        />
                        <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 scrollbar-thin">
                          {(newFragrance.department === 'bakhoor'
                            ? ['تولة فاخرة (12 غرام)', 'أوقية كاملة (30 غرام)', 'ثمن كيلو (125 غرام)', 'كسر مباخر دبل سوبر بيور']
                            : ['كريستال بوهيمي منقوش ذهب', 'فضة إسترليني 925', 'ستانلس ستيل مطلي ذهب 18K', 'جلد طبيعي فاخر']
                          ).map((spec) => (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => setNewFragrance({ ...newFragrance, specification: spec })}
                              className="text-[9px] px-2 py-0.5 rounded-md bg-white border border-amber-200 hover:border-amber-500 font-bold text-amber-900 shrink-0 cursor-pointer"
                            >
                              {spec}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Code & Barcode */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-bold text-neutral-700 text-xs">
                            {isAr ? 'كود المنتج (SKU) *:' : 'Product Code (SKU) *:'}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const prefix = newFragrance.department === 'makeup' ? 'MKP' :
                                             newFragrance.department === 'accessories' ? 'ACC' :
                                             newFragrance.department === 'bakhoor' ? 'BKH' : 'PRD';
                              const autoCode = `${prefix}-${String(oils.length + 1).padStart(3, '0')}`;
                              setNewFragrance({ ...newFragrance, code: autoCode });
                            }}
                            className="text-[10px] text-amber-800 hover:text-black font-bold cursor-pointer"
                          >
                            {isAr ? '⚡ توليد كود' : '⚡ Auto-code'}
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={newFragrance.code}
                          onChange={(e) => setNewFragrance({ ...newFragrance, code: e.target.value.toUpperCase() })}
                          className="w-full p-2 rounded-xl border border-neutral-300 font-mono font-bold text-xs focus:outline-none focus:border-black bg-neutral-50"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-bold text-neutral-700 text-xs">
                            {isAr ? 'الباركود (Barcode):' : 'Barcode:'}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const auto = generatePerfumeBarcode(newFragrance.code || 'PRD-001', '6281');
                              setNewFragrance({ ...newFragrance, barcode: auto });
                            }}
                            className="text-[10px] text-amber-800 hover:text-black font-bold cursor-pointer"
                          >
                            {isAr ? '⚡ توليد باركود تلقائي' : '⚡ Generate Barcode'}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={newFragrance.barcode}
                          onChange={(e) => setNewFragrance({ ...newFragrance, barcode: e.target.value })}
                          placeholder="6281000..."
                          className="w-full p-2 rounded-xl border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black bg-neutral-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Pricing & Stock */}
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-neutral-200">
                    <div className="font-black text-neutral-900 uppercase tracking-wider text-[11px] flex items-center justify-between pb-1 border-b border-neutral-200">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-black" />
                        <span>{isAr ? '2. الأسعار والمخزون المالي' : '2. Pricing & Inventory'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        USD ($)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Selling Price */}
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border-2 border-amber-400">
                        <label className="block font-black text-amber-950 text-xs mb-1">
                          {isAr ? 'سعر البيع للزبون ($) *:' : 'Selling Price ($) *:'}
                        </label>
                        <div className="flex items-center bg-white rounded-lg border border-amber-300 px-2 py-1">
                          <span className="font-mono text-xs font-bold text-amber-800 me-1">$</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            required
                            value={newFragrance.directPrice}
                            onChange={(e) => setNewFragrance({ ...newFragrance, directPrice: e.target.value })}
                            className="w-full font-mono font-black text-sm text-neutral-900 bg-transparent focus:outline-none"
                          />
                        </div>
                        <span className="text-[9px] text-amber-900/80 font-bold block mt-1">
                          {isAr ? 'السعر الأساسي بالمتجر' : 'Primary store price'}
                        </span>
                      </div>

                      {/* Compare At Price */}
                      <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                        <label className="block font-bold text-neutral-700 text-xs mb-1">
                          {isAr ? 'السعر قبل الخصم ($):' : 'Compare-At Price ($):'}
                        </label>
                        <div className="flex items-center bg-white rounded-lg border border-neutral-300 px-2 py-1">
                          <span className="font-mono text-xs font-bold text-neutral-500 me-1">$</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={newFragrance.compareAtPrice}
                            onChange={(e) => setNewFragrance({ ...newFragrance, compareAtPrice: e.target.value })}
                            placeholder="35"
                            className="w-full font-mono font-bold text-sm text-neutral-600 bg-transparent focus:outline-none line-through"
                          />
                        </div>
                        <span className="text-[9px] text-neutral-500 block mt-1">
                          {isAr ? 'يظهر مشطوباً كعرض خاص' : 'Slashed promo price'}
                        </span>
                      </div>

                      {/* Cost Price */}
                      <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                        <label className="block font-bold text-neutral-700 text-xs mb-1">
                          {isAr ? 'سعر التكلفة ($):' : 'Cost Price ($):'}
                        </label>
                        <div className="flex items-center bg-white rounded-lg border border-neutral-300 px-2 py-1">
                          <span className="font-mono text-xs font-bold text-neutral-500 me-1">$</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={newFragrance.costPriceInput}
                            onChange={(e) => setNewFragrance({ ...newFragrance, costPriceInput: e.target.value })}
                            placeholder="10"
                            className="w-full font-mono font-bold text-sm text-neutral-900 bg-transparent focus:outline-none"
                          />
                        </div>
                        <span className="text-[9px] text-neutral-500 block mt-1">
                          {isAr ? 'لحساب صافي الأرباح' : 'For margin calculation'}
                        </span>
                      </div>

                      {/* Wholesale Price */}
                      <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                        <label className="block font-bold text-neutral-700 text-xs mb-1">
                          {isAr ? 'سعر الجملة ($):' : 'Wholesale Price ($):'}
                        </label>
                        <div className="flex items-center bg-white rounded-lg border border-neutral-300 px-2 py-1">
                          <span className="font-mono text-xs font-bold text-neutral-500 me-1">$</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={newFragrance.wholesalePriceInput}
                            onChange={(e) => setNewFragrance({ ...newFragrance, wholesalePriceInput: e.target.value })}
                            placeholder="18"
                            className="w-full font-mono font-bold text-sm text-neutral-900 bg-transparent focus:outline-none"
                          />
                        </div>
                        <span className="text-[9px] text-neutral-500 block mt-1">
                          {isAr ? 'لطلبات الجملة والموزعين' : 'For bulk/wholesale'}
                        </span>
                      </div>
                    </div>

                    {/* Stock in Pieces and Profit Margin Indicator */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                        <label className="block font-bold text-neutral-800 text-xs mb-1">
                          {isAr ? 'عدد القطع المتوفرة بالمخزون (الكمية):' : 'Available Stock (Pieces):'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            required
                            value={newFragrance.stockCount}
                            onChange={(e) => setNewFragrance({ ...newFragrance, stockCount: e.target.value })}
                            className="w-28 p-2 rounded-lg border border-neutral-300 font-mono font-black text-sm text-center bg-white focus:outline-none focus:border-black"
                          />
                          <span className="text-xs font-bold text-neutral-600">
                            {isAr ? 'قطعة / عبوة جاهزة للبيع' : 'pieces available'}
                          </span>
                        </div>
                      </div>

                      {/* Live Profit Margin Badge */}
                      {(() => {
                        const sell = parseFloat(newFragrance.directPrice) || 0;
                        const cost = parseFloat(newFragrance.costPriceInput) || 0;
                        const profit = sell - cost;
                        const marginPercent = cost > 0 ? ((profit / cost) * 100).toFixed(0) : 0;
                        return (
                          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-emerald-800 uppercase">
                                {isAr ? 'تحليل الربح الصافي المقدر للقطعة:' : 'Estimated Net Profit Per Unit:'}
                              </div>
                              <div className="text-base font-black font-mono text-emerald-950">
                                +${profit > 0 ? profit.toFixed(2) : '0.00'}
                              </div>
                            </div>
                            <span className="text-xs font-black font-mono px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-2xs">
                              {cost > 0 ? `+${marginPercent}% هامش ربح` : (isAr ? 'هامش ربح ممتاز' : 'Great Margin')}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Section: Description / Features */}
                  <div className="space-y-2 bg-white p-4 rounded-2xl border border-neutral-200">
                    <label className="block font-bold text-neutral-800 text-xs">
                      {isAr ? '3. وصف المنتج ومميزاته الفاخرة:' : '3. Product Description & Highlights:'}
                    </label>
                    <textarea
                      rows={3}
                      value={newFragrance.description}
                      onChange={(e) => setNewFragrance({ ...newFragrance, description: e.target.value })}
                      placeholder={
                        newFragrance.department === 'makeup'
                          ? (isAr ? 'مثال: أحمر شفاه غني بالمرطبات الطبيعية يدوم حتى 12 ساعة، قوام كريمي مخملي خفيف على الشفاه...' : 'Rich moisturizing velvet lipstick...')
                          : newFragrance.department === 'accessories'
                          ? (isAr ? 'مثال: مبخرة كريستال فاخرة مصنوعة يدوياً بتصميم ملكي مناسب للمجالس والمناسبات الراقية...' : 'Handcrafted royal crystal incense burner...')
                          : (isAr ? 'مثال: بخور ملكي معتق بنفحات العود الفاخر والمسك، فوحان ممتاز يدوم طويلاً...' : 'Royal aged bakhoor with rich oud notes...')
                      }
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:outline-none focus:border-black font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="p-4 border-t border-neutral-200 bg-neutral-50 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-black cursor-pointer flex items-center gap-2 shadow-md transition"
                >
                  <Plus className="w-4 h-4 text-amber-400 stroke-[3]" />
                  <span>
                    {isAr
                      ? (newFragrance.department === 'perfume'
                          ? 'حفظ ونشر العطر في المتجر فوراً'
                          : `حفظ ونشر ${newFragrance.department === 'makeup' ? 'مستحضر المكياج' : newFragrance.department === 'accessories' ? 'الإكسسوار' : newFragrance.department === 'bakhoor' ? 'البخور' : 'المنتج'} في المتجر فوراً`)
                      : 'Save & Publish Product'}
                  </span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Market Fragrances Encyclopedia & Database Modal */}
      <PerfumeMarketDatabaseModal
        isOpen={isMarketDbModalOpen}
        onClose={() => setIsMarketDbModalOpen(false)}
        onSelectForAdd={handleOpenAddModalWithPreset}
        onFormulateInCalculator={(preset) => {
          setIsMarketDbModalOpen(false);
          // Dispatch global calculator opener
          window.dispatchEvent(new CustomEvent('nasamat_open_calculator', { detail: { perfume: preset } }));
        }}
      />

    </div>
  );
};
