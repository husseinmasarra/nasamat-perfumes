export type Language = 'ar' | 'en';

export type FragranceFamily = 
  | 'oriental' 
  | 'woody' 
  | 'floral' 
  | 'fresh' 
  | 'leather' 
  | 'gourmand' 
  | 'citrus' 
  | 'aromatic' 
  | 'other';

export type MaterialCategory = 
  | 'bottle' 
  | 'sprayer' 
  | 'alcohol' 
  | 'fixative' 
  | 'packaging' 
  | 'other';

export type UnitType = 'ml' | 'g' | 'piece';

export interface PerfumeOlfactoryProfile {
  storyAr: string;
  storyEn?: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  accords: string[];
  vibeAr: string;
  vibeEn?: string;
  gender: 'men' | 'women' | 'unisex';
  genderAr: string;
  season: 'all' | 'summer' | 'winter' | 'autumn' | 'spring';
  seasonAr: string;
  occasionAr: string;
  longevityAr: string;
  sillageAr: string;
  concentrationAr: string;
}

export interface FragranceOil {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
  brand: string;
  company?: string;
  family: FragranceFamily;
  targetGender?: 'men' | 'women' | 'unisex';
  density: number; // e.g. 0.95 g/ml
  costPrice: number; // Purchase price of total quantity
  initialQuantity: number; // in ml or g
  currentQuantity: number; // remaining in ml or g
  stockMl?: number;
  reorderLevelMl?: number;
  isAvailable?: boolean;
  unit: 'ml' | 'g';
  unitCost: number; // Cost per 1 ml or 1 g
  costPerMl?: number;
  costPerGram?: number;
  lowStockThreshold: number;
  imageUrl?: string; // Photo of perfume bottle / oil
  retailPrice30ml?: number; // Retail selling price 30ml ($5)
  retailPrice50ml?: number; // Retail selling price 50ml ($7)
  retailPrice100ml?: number; // Retail selling price 100ml ($12)
  wholesalePrice50ml?: number; // Wholesale price 50ml ($4.5)
  notes?: string;
  olfactoryProfile?: PerfumeOlfactoryProfile;
  createdAt: string;
  updatedAt: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  category: MaterialCategory;
  bottleCapacityMl?: number; // Only for bottles
  costPrice: number; // total cost paid
  initialQuantity: number;
  currentQuantity: number;
  unit: UnitType;
  unitCost: number; // cost per piece or per ml
  lowStockThreshold: number;
  imageUrl?: string; // Photo of bottle, pump, box, etc.
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormulaOilItem {
  oilId: string;
  percentage: number; // % of the total fragrance oil fraction (sum of oil percentages = 100%)
  volumeMl: number;   // calculated ml
  weightG: number;    // calculated grams
  cost: number;       // calculated cost
  unitCost?: number;  // unit cost per ml/g used for this oil
}

export type ConcentrationTier = 'edc' | 'edt' | 'edp' | 'extrait' | 'pure_oil' | 'custom';
export type PriceRoundingMode = 'whole' | 'half' | 'ceil_whole' | 'none';

export interface PerfumeFormula {
  id: string;
  name: string;
  bottleCapacityMl: number; // e.g. 50ml, 100ml
  concentrationPercent: number; // e.g. 20%, 30%
  concentrationTier: ConcentrationTier;
  totalOilVolumeMl: number;
  totalOilWeightG: number;
  oils: FormulaOilItem[];
  fixativePercent: number; // e.g. 1% or 2%
  fixativeVolumeMl: number;
  fixativeMaterialId?: string;
  alcoholVolumeMl: number;
  alcoholMaterialId?: string;
  bottleMaterialId?: string;
  sprayerMaterialId?: string;
  packagingMaterialId?: string;
  
  // Cost breakdown per single bottle
  oilCost: number;
  alcoholCost: number;
  fixativeCost: number;
  bottleCost: number;
  sprayerCost: number;
  packagingCost: number;
  extraCost: number;
  totalCostPerBottle: number;

  // Pricing
  suggestedRetailPrice: number;
  unroundedPrice?: number;
  profitPerBottle: number;
  profitMarginPercent: number;
  roundingMode?: PriceRoundingMode;
  benchmarkMarginPercent?: number;
  
  notes?: string;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  formula: PerfumeFormula;
  bottlesCount: number; // Number of bottles created in this batch
  totalBatchCost: number;
  totalExpectedRevenue: number;
  totalExpectedProfit: number;
  notes?: string;
  createdAt: string;
}

export interface TrackingPixelSettings {
  metaPixelId?: string; // Meta (Facebook & Instagram) Pixel ID (e.g. "123456789012345")
  isMetaPixelEnabled?: boolean;
  metaAccessToken?: string; // Meta Conversions API (CAPI) System User Access Token
  metaTestEventCode?: string; // Meta Test Event Code (e.g. "TEST12345")
  metaLeadWebhookUrl?: string; // Meta Lead Ads Webhook URL endpoint
  isMetaCapiEnabled?: boolean; // Whether Conversions API (CAPI) is active
  tiktokPixelId?: string; // TikTok Pixel ID (e.g. "CXXXXXXXXXXXXX")
  isTiktokPixelEnabled?: boolean;
  snapchatPixelId?: string; // Snapchat Pixel ID
  isSnapchatPixelEnabled?: boolean;
  googleTagId?: string; // Google Analytics 4 / Google Ads (e.g. "G-XXXXXX")
  isGoogleTagEnabled?: boolean;
  pixelTestMode?: boolean; // In-browser visual event debugger
}

export interface FirebaseConfigSettings {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  isFirebaseEnabled?: boolean;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  provider: 'google' | 'apple' | 'email' | 'device_passkey' | 'guest';
  registeredAt: string;
  lastLoginAt: string;
  savedAddress?: string;
  savedCity?: string;
  savedNotes?: string;
  notes?: string;
  segment?: 'vip' | 'regular' | 'new' | 'connoisseur';
}

export interface CRMCustomerProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  provider?: 'google' | 'apple' | 'email' | 'device_passkey' | 'guest' | 'manual';
  avatar?: string;
  segment: 'vip' | 'regular' | 'new' | 'connoisseur' | 'inactive';
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  firstSeenDate: string;
  customBlendsCount: number;
  notes?: string;
  tags?: string[];
  city?: string;
}

export interface CRMActivityLog {
  id: string;
  customerId?: string;
  customerName: string;
  type: 'login' | 'register' | 'order' | 'blend_created' | 'note_added' | 'cart_abandoned';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AppSettings {
  currency: string;
  language?: Language;
  defaultOilDensity: number;
  defaultFixativePercent: number;
  defaultProfitMargin: number;
  defaultConcentrationPercent?: number;
  theme: 'dark' | 'light';
  storeName?: string;
  storePhone?: string;
  storeLocation?: string;
  storeBio?: string;
  facebookUrl?: string; // Facebook Page link (e.g. https://facebook.com/...)
  instagramUrl?: string; // Instagram Profile link (e.g. https://instagram.com/...)
  lastBackupDate?: string;
  adminPassword?: string;
  adminSecretSlug?: string; // Secret non-guessable slug for admin portal (default: 'nasmat-vault-77')
  lbpRate?: number; // Lebanese exchange rate (e.g. 90,000 LBP / USD)
  defaultDeliveryFee?: number; // Delivery fee in USD ($)
  freeDeliveryThreshold?: number; // Minimum cart subtotal for free delivery
  isFreeDeliveryEnabled?: boolean; // Whether free delivery threshold is active
  deliveryNotes?: string;
  crmGoogleSheetUrl?: string; // Connected Google Sheet view/embed URL
  crmGoogleSheetWebhookUrl?: string; // Google Apps Script Webhook URL for live auto-sync
  trackingPixels?: TrackingPixelSettings;
  firebaseConfig?: FirebaseConfigSettings;
}

export interface SavingsBundle {
  id: string;
  name: string;
  nameEn?: string;
  subtitle?: string;
  description: string;
  descriptionEn?: string;
  bottlesCount: number; // e.g. 2, 3, 4
  bottleSizeMl: number; // default 50
  price: number; // Manager's custom bundle price
  originalPrice: number; // Crossed-out original price
  savingBadgeAr?: string; // e.g. "وفّر $1.00", "وفّر $3 + شحن مجاني"
  badge?: string;
  freeDelivery: boolean; // whether includes free delivery
  isFeatured?: boolean; // badge "الأكثر طلباً وتوفيراً"
  imageUrl: string;
  features?: string[];
  featuresAr?: string[];
  featuresEn?: string[];
  isActive: boolean;
  selectionMode?: 'all' | 'custom';
  allowedPerfumeSelection?: 'all' | 'custom';
  selectedItemIds?: string[];
  selectedPerfumes?: string[]; // IDs/names of specific perfumes chosen by manager
}

export type RecipeCategory = 
  | 'signature' 
  | 'men' 
  | 'women' 
  | 'unisex' 
  | 'oriental' 
  | 'fresh' 
  | 'gourmand' 
  | 'custom';

export interface RecipeOilItem {
  oilId: string;
  percentage: number; // percentage in the fragrance oil blend (sum = 100%)
  notes?: string;
}

export interface SavedRecipe {
  id: string;
  code: string; // e.g. "NAS-REC-001"
  name: string; // Arabic name
  nameEn: string; // English name
  description: string;
  descriptionEn?: string;
  category: RecipeCategory;
  bottleCapacityMl: number; // default e.g. 50
  concentrationPercent: number; // default e.g. 25
  concentrationTier: ConcentrationTier;
  fixativePercent: number; // default e.g. 1.5
  oils: RecipeOilItem[];
  suggestedRetailPrice?: number; // Retail price in USD ($)
  retailPrice30ml?: number; // Selling price for 30ml
  retailPrice50ml?: number; // Selling price for 50ml
  retailPrice100ml?: number; // Selling price for 100ml
  wholesalePrice50ml?: number; // Wholesale price for 50ml
  targetGender?: 'unisex' | 'men' | 'women';
  season?: 'all' | 'summer' | 'winter' | 'autumn' | 'spring';
  scentNotes?: string; // Olfactory pyramid
  olfactoryProfile?: PerfumeOlfactoryProfile;
  imageUrl?: string;
  isSignature?: boolean;
  isMaster?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceType = 'sale' | 'purchase';
export type InvoiceStatus = 'paid' | 'partial' | 'due';
export type PaymentMethod = 'cash' | 'whish_omt' | 'bank_card' | 'other';
export type InvoiceItemType = 'perfume_bottle' | 'raw_oil' | 'raw_material' | 'custom';

export interface InvoiceItem {
  id: string;
  itemType: InvoiceItemType;
  referenceId?: string; // oilId or materialId or recipeId
  name: string;
  sizeOrQty: number; // e.g. 50 (ml) or 2 (bottles/pieces)
  unit: 'bottle' | 'ml' | 'g' | 'piece';
  bottleCapacityMl?: number; // 30, 50, 100 for perfume bottles
  unitPrice: number; // Unit selling price or unit purchase cost
  totalPrice: number; // line total (sizeOrQty * unitPrice)
  cogsCost?: number; // Cost of goods sold for this line (for profit computation)
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-S-2026-001" or "INV-P-2026-001"
  type: InvoiceType; // 'sale' | 'purchase'
  saleKind?: 'retail' | 'wholesale'; // مفرق أو جملة
  date: string; // ISO date string
  partyName: string; // Customer name (sale) or Supplier name (purchase)
  partyPhone?: string;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  items: InvoiceItem[];
  subtotal: number;
  deliveryFee?: number; // delivery fee in $
  discount: number; // discount amount in $
  tax: number; // tax amount in $
  totalAmount: number; // subtotal - discount + tax + (deliveryFee || 0)
  paidAmount: number;
  dueAmount: number;
  totalCogsCost?: number; // Total cost of goods for sales
  netProfit?: number; // totalAmount - totalCogsCost for sales
  stockDeducted?: boolean; // whether stock was auto-adjusted upon creating
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string; // unique item id in cart
  itemType: 'oil' | 'recipe';
  referenceId: string; // oil.id or recipe.id
  name: string;
  nameEn?: string;
  brand?: string;
  imageUrl?: string;
  sizeMl: number; // 30, 50, 100
  unitPrice: number; // selling price for chosen size
  quantity: number; // number of bottles
  oilQuantityPerBottleMl: number; // ml of oil per bottle
  notes?: string;
}

export interface CategoryNavConfig {
  id: string;
  labelAr: string;
  labelEn: string;
  imageUrl: string;
  countAr?: string;
  countEn?: string;
}

export interface CustomBlendIngredient {
  oilId: string;
  oilName: string;
  oilNameEn?: string;
  oilCode?: string;
  oilBrand?: string;
  percentage: number; // e.g. 50
  ml?: number; // Exact calculated volume in ml based on chosen size
}

export interface CustomerCustomBlend {
  id: string;
  name: string; // Customer chosen bespoke perfume name
  customerName?: string;
  sizeMl: number; // 30, 50, 100
  totalOilMl?: number; // Total fragrance oil needed in ml (e.g. 12.5 ml for 50ml bottle)
  alcoholMl?: number; // Perfumer alcohol needed in ml (e.g. 37.5 ml for 50ml bottle)
  concentrationPercent?: number; // e.g. Extrait tier
  ingredients: CustomBlendIngredient[]; // The oils selected by name from project
  totalPrice: number;
  notes?: string;
  createdAt: string;
}

export interface BottleLabelData {
  perfumeName: string;
  perfumeNameEn?: string;
  brand?: string;
  customerName?: string;
  bottleSizeMl: number; // 30, 50, 100
  concentrationPercent?: number; // 25
  concentrationTier?: string; // 'Extrait de Parfum'
  batchNumber?: string;
  formulationDate: string;
  notes?: string;
  ingredientsText?: string;
  qrCodeUrl?: string;
}

export interface CustomerReview {
  id: string;
  productKey: string; // e.g. 'oil-40' or 'recipe-1'
  productName: string;
  authorName: string;
  authorCity?: string;
  rating: number; // 1 to 5
  longevity: '12h' | '24h' | '48h';
  sillage: 'soft' | 'moderate' | 'strong' | 'beast';
  comment: string;
  verified: boolean;
  createdAt: string;
}

// Meta Ads & WhatsApp CRM Lead Record
export type CrmLeadSource = 'ADS' | 'CTWA' | 'WA' | 'WEBSITE' | 'INSTAGRAM' | 'MANUAL';
export type CrmLeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'ORDER_PLACED' | 'VIP' | 'ARCHIVED';
export type CrmGenderCategory = 'WOMEN' | 'MEN' | 'UNISEX';

export interface CrmLeadRecord {
  id: string;
  leadNumber?: number; // e.g. 216
  name: string;
  phone?: string;
  email?: string;
  genderCategory?: CrmGenderCategory; // 'WOMEN' | 'MEN' | 'UNISEX'
  source: CrmLeadSource; // 'ADS' | 'CTWA' | 'WA' | 'WEBSITE' | 'INSTAGRAM' | 'MANUAL'
  adCampaign?: string;
  status: CrmLeadStatus;
  date: string;
  time?: string;
  followUpDate?: string;
  followUpNotes?: string;
  segment: 'vip' | 'regular' | 'new' | 'connoisseur';
  ordersCount: number;
  totalSpent: number;
  customBlendsCount: number;
  notes?: string;
  address?: string;
  city?: string;
  avatar?: string;
  provider?: 'google' | 'apple' | 'email' | 'device_passkey' | 'guest';
}

