import type { FragranceOil, RawMaterial } from '../types';

/**
 * Normalizes Arabic text for flexible search:
 * - Unifies alef variations (أ, إ, آ, ء -> ا)
 * - Unifies taa marbuta & haa (ة <-> ه)
 * - Unifies yaa & alef maksura (ى <-> ي)
 * - Removes tashkeel / harakat
 * - Removes extra spaces and punctuation
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // Tashkeel / diacritics
    .replace(/[^\w\s\u0600-\u06FF]/gi, ' ') // Punctuation to spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SmartFilterChip {
  id: string;
  label: string;
  labelEn: string;
  icon: string;
  query: string;
}

export const SMART_SEARCH_CHIPS: SmartFilterChip[] = [
  { id: 'bestseller', label: 'الأكثر طلباً', labelEn: 'Bestsellers', icon: '👑', query: 'توب الأكثر مبيعا' },
  { id: 'men', label: 'رجالي فخم', labelEn: "Men's Luxury", icon: '👔', query: 'رجالي' },
  { id: 'women', label: 'نسائي جذاب', labelEn: "Women's Allure", icon: '👠', query: 'نسائي' },
  { id: 'summer', label: 'صيفي ومنعش', labelEn: 'Summer Fresh', icon: '☀️', query: 'صيفي منعش اكوا برغموت' },
  { id: 'winter', label: 'شتوي وغورماند', labelEn: 'Winter & Gourmand', icon: '❄️', query: 'شتوي فانيليا تبغ دافئ' },
  { id: 'oud', label: 'عود وسهرات', labelEn: 'Oud & Evening', icon: '🪵', query: 'عود نيش عنبر سهرات' },
  { id: 'signature', label: 'تشكيلة نسمات الخاصة', labelEn: 'Nasamat Signature', icon: '🌹', query: 'تشكيلة نسمات الخاصة' },
  { id: 'low_stock', label: 'مخزون منخفض', labelEn: 'Low Stock', icon: '⚠️', query: 'منخفض' },
];

/**
 * Intelligent categorization based on code & keywords
 */
export function getOilAudienceCategory(code: string, brand: string): string {
  if (brand.includes('تشكيلة نسمات الخاصة')) return 'تشكيلة نسمات الخاصة';
  const num = parseInt(code.replace(/\D/g, ''), 10) || 0;
  if (num >= 1 && num <= 20) return 'رجالي توب';
  if (num >= 21 && num <= 40) return 'نسائي جذاب';
  if (num >= 41 && num <= 60) return 'نيش وسهرات وعود';
  if (num >= 61 && num <= 75) return 'صيفي متوسطي ومنعش';
  if (num >= 76 && num <= 90) return 'شتوي وغورماند وتبغ';
  if (num >= 91) return 'تشكيلة نسمات الخاصة';
  return 'عام';
}

export interface SearchMatchOil {
  oil: FragranceOil;
  score: number;
  matchedField: 'name' | 'code' | 'brand' | 'notes' | 'family' | 'tag';
}

/**
 * Performs fast multi-attribute text and keyword search on oils
 */
export function smartSearchOils(oils: FragranceOil[], rawQuery: string): FragranceOil[] {
  const query = rawQuery.trim();
  if (!query) return oils;

  const normalizedQuery = normalizeArabicText(query);
  const queryWords = normalizedQuery.split(' ').filter(Boolean);

  // Check special keywords
  const isLookingForLowStock = normalizedQuery.includes('منخفض') || normalizedQuery.includes('ناقص') || normalizedQuery.includes('نفد');
  const isLookingForMen = normalizedQuery.includes('رجال') || normalizedQuery.includes('رجالي');
  const isLookingForWomen = normalizedQuery.includes('نسا') || normalizedQuery.includes('نسائي') || normalizedQuery.includes('بنات');
  const isLookingForSignature = normalizedQuery.includes('نسمات') || normalizedQuery.includes('خاصه');
  const isLookingForSummer = normalizedQuery.includes('صيف') || normalizedQuery.includes('منعش') || normalizedQuery.includes('بحر') || normalizedQuery.includes('حمضيات');
  const isLookingForWinter = normalizedQuery.includes('شتو') || normalizedQuery.includes('داف') || normalizedQuery.includes('تبغ') || normalizedQuery.includes('فانيليا');
  const isLookingForOud = normalizedQuery.includes('عود') || normalizedQuery.includes('نيش') || normalizedQuery.includes('سهر');

  const matches: SearchMatchOil[] = [];

  for (const oil of oils) {
    let score = 0;
    let matchedField: SearchMatchOil['matchedField'] = 'name';

    const normalizedName = normalizeArabicText(oil.name);
    const normalizedCode = normalizeArabicText(oil.code);
    const normalizedBrand = normalizeArabicText(oil.brand);
    const normalizedNotes = normalizeArabicText(oil.notes || '');
    const category = getOilAudienceCategory(oil.code, oil.brand);
    const normalizedCategory = normalizeArabicText(category);

    const isLow = oil.currentQuantity <= oil.lowStockThreshold;

    // Filter by special intent
    if (isLookingForLowStock && isLow) {
      score += 50;
      matchedField = 'tag';
    }
    if (isLookingForSignature && oil.brand.includes('تشكيلة نسمات الخاصة')) {
      score += 45;
      matchedField = 'tag';
    }
    if (isLookingForMen && normalizedCategory.includes('رجال')) {
      score += 35;
      matchedField = 'tag';
    }
    if (isLookingForWomen && normalizedCategory.includes('نسا')) {
      score += 35;
      matchedField = 'tag';
    }
    if (isLookingForSummer && (normalizedCategory.includes('صيف') || oil.family === 'fresh' || oil.family === 'citrus')) {
      score += 35;
      matchedField = 'tag';
    }
    if (isLookingForWinter && (normalizedCategory.includes('شتو') || oil.family === 'gourmand' || oil.family === 'leather' || oil.family === 'woody')) {
      score += 35;
      matchedField = 'tag';
    }
    if (isLookingForOud && (normalizedName.includes('عود') || normalizedNotes.includes('عود') || oil.family === 'oriental')) {
      score += 35;
      matchedField = 'tag';
    }

    // Exact or substring matches across words
    let matchedAllWords = true;
    for (const word of queryWords) {
      if (normalizedName.includes(word)) {
        score += 30;
        matchedField = 'name';
      } else if (normalizedCode.includes(word)) {
        score += 40;
        matchedField = 'code';
      } else if (normalizedBrand.includes(word)) {
        score += 20;
        matchedField = 'brand';
      } else if (normalizedNotes.includes(word)) {
        score += 15;
        matchedField = 'notes';
      } else if (normalizedCategory.includes(word)) {
        score += 15;
        matchedField = 'tag';
      } else {
        matchedAllWords = false;
      }
    }

    // Direct exact phrase matches
    if (normalizedName.includes(normalizedQuery)) {
      score += 40;
      matchedField = 'name';
    }
    if (normalizedNotes.includes(normalizedQuery)) {
      score += 25;
      matchedField = 'notes';
    }

    if (score > 0 || matchedAllWords) {
      matches.push({ oil, score, matchedField });
    }
  }

  // Sort by highest relevance score
  matches.sort((a, b) => b.score - a.score);
  return matches.map((m) => m.oil);
}

/**
 * Smart search for raw materials & bottles
 */
export function smartSearchMaterials(materials: RawMaterial[], rawQuery: string): RawMaterial[] {
  const query = rawQuery.trim();
  if (!query) return materials;

  const normalizedQuery = normalizeArabicText(query);
  const words = normalizedQuery.split(' ').filter(Boolean);

  return materials.filter((mat) => {
    const normName = normalizeArabicText(mat.name);
    const normNotes = normalizeArabicText(mat.notes || '');
    const capStr = String(mat.bottleCapacityMl || '');

    // Check if query matches capacity number (e.g. "30", "50", "100")
    if (mat.bottleCapacityMl && words.includes(capStr)) return true;

    return words.every((w) => normName.includes(w) || normNotes.includes(w) || capStr.includes(w));
  });
}
