/**
 * Customer Reviews & Social Proof Engine
 * Nasamat Haute Parfumerie
 */

import type { CustomerReview } from '../types';

const REVIEWS_STORAGE_KEY = 'nasamat_reviews_v1';

export const INITIAL_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-1',
    productKey: 'oil-40', // Baccarat Rouge 540 Extrait
    productName: 'باكارات روج 540 إكستري (MFK Baccarat Rouge 540 Extrait)',
    authorName: 'طارق حداد',
    authorCity: 'بيروت - الأشرفية',
    rating: 5,
    longevity: '48h',
    sillage: 'beast',
    comment: 'الزيت نقي جداً ورائحته متطابقة 100% مع العطر الأصلي. رشيت العطر على الجاكيت وبقيت الرائحة واضحة لأكثر من يومين. فوحان ملوكي.',
    verified: true,
    createdAt: '2026-11-10T14:30:00Z',
  },
  {
    id: 'rev-2',
    productKey: 'oil-40',
    productName: 'باكارات روج 540 إكستري (MFK Baccarat Rouge 540 Extrait)',
    authorName: 'سارة شمس الدين',
    authorCity: 'صيدا',
    rating: 5,
    longevity: '24h',
    sillage: 'strong',
    comment: 'أجمل تركيب جربته في لبنان. تركيز الإكستري الملكي واضح على البشرة ويعطي هالة ساحرة. كل من يمر يسألني عن العطر.',
    verified: true,
    createdAt: '2026-11-14T11:15:00Z',
  },
  {
    id: 'rev-3',
    productKey: 'oil-41', // Ombre Nomade
    productName: 'أومبر نوماد (Louis Vuitton Ombre Nomade)',
    authorName: 'كريم خوري',
    authorCity: 'المتن / بكفيا',
    rating: 5,
    longevity: '48h',
    sillage: 'beast',
    comment: 'وحش فوحان حقيقي! العود والورد والتوت بتدرج نقي جداً وبدون أي رائحة كحول مزعجة. أنصح به بقوة لكل عشاق الفخامة.',
    verified: true,
    createdAt: '2026-11-08T18:40:00Z',
  },
  {
    id: 'rev-4',
    productKey: 'oil-41',
    productName: 'أومبر نوماد (Louis Vuitton Ombre Nomade)',
    authorName: 'روني الجميل',
    authorCity: 'جونية',
    rating: 5,
    longevity: '24h',
    sillage: 'strong',
    comment: 'ثبات أسطوري وفخامة لا تضاهى. تعامل المحل وخدمة التوصيل سريعة جداً ووصلني العطر مغلف كهدية ملكية.',
    verified: true,
    createdAt: '2026-11-16T16:20:00Z',
  },
  {
    id: 'rev-5',
    productKey: 'oil-42', // Sauvage Elixir
    productName: 'سوفاج إلكسير (Dior Sauvage Elixir)',
    authorName: 'جاد نصر',
    authorCity: 'طرابلس',
    rating: 5,
    longevity: '24h',
    sillage: 'beast',
    comment: 'تركيز فائق القوة، نفحات التوابل والخزامى وخشب الصندل متوازنة بأعلى درجات الدقة. أفضل متجر تركيب في لبنان.',
    verified: true,
    createdAt: '2026-11-12T09:45:00Z',
  },
  {
    id: 'rev-6',
    productKey: 'oil-46', // Tobacco Vanille
    productName: 'توباكو فانيل (Tom Ford Tobacco Vanille)',
    authorName: 'مايا كنعان',
    authorCity: 'بيروت - الحمرا',
    rating: 5,
    longevity: '24h',
    sillage: 'strong',
    comment: 'دافئ ومغري جداً للشتاء، الفانيليا والتبغ الفاخر مع حبوب التونكا. أخذت حجم 100 ملل وسأطلب مجدداً بالتأكيد.',
    verified: true,
    createdAt: '2026-11-15T20:10:00Z',
  },
  {
    id: 'rev-7',
    productKey: 'oil-45', // Tuscan Leather
    productName: 'توسكان ليزر (Tom Ford Tuscan Leather)',
    authorName: 'جورج سلامة',
    authorCity: 'زحلة',
    rating: 5,
    longevity: '48h',
    sillage: 'beast',
    comment: 'رائحة الجلد الفاخر مع توت العليق والزعفران. دقة الصياغة تضاهي الأصل تماماً وسعر الـ 50 ملل ممتاز وموفر جداً.',
    verified: true,
    createdAt: '2026-11-05T13:00:00Z',
  },
  {
    id: 'rev-8',
    productKey: 'recipe-1', // Nasamat Royal Oud
    productName: 'عود ملكي استثنائي (Nasamat Royal Oud)',
    authorName: 'الشيخ عبد الله عيتاني',
    authorCity: 'بيروت - فردان',
    rating: 5,
    longevity: '48h',
    sillage: 'beast',
    comment: 'خلطة خاصة نادرة تليق بالمناسبات الكبرى. ثبات استمر على الثوب 3 أيام. بارك الله في حرفيتكم.',
    verified: true,
    createdAt: '2026-11-02T17:30:00Z',
  },
  {
    id: 'rev-9',
    productKey: 'recipe-2', // Imperial Velvet Rose
    productName: 'روز مخملي ملكي (Imperial Velvet Rose)',
    authorName: 'نور الحاج',
    authorCity: 'صيدا',
    rating: 5,
    longevity: '24h',
    sillage: 'strong',
    comment: 'خلطة نسمات الأنثوية الساحرة، الورد الدمشقي مع العود الخفيف والبرالينيه. رائحة تسحر كل من يشمها.',
    verified: true,
    createdAt: '2026-11-18T15:00:00Z',
  }
];

export function loadReviews(): CustomerReview[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) {
      saveReviews(INITIAL_REVIEWS);
      return INITIAL_REVIEWS;
    }
    const parsed: CustomerReview[] = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_REVIEWS;
  } catch (e) {
    console.error('Failed to load reviews', e);
    return INITIAL_REVIEWS;
  }
}

export function saveReviews(reviews: CustomerReview[]): void {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.error('Failed to save reviews', e);
  }
}

export function getReviewsForProduct(productKey: string, reviewsList?: CustomerReview[]): CustomerReview[] {
  const all = reviewsList || loadReviews();
  return all.filter((r) => r.productKey === productKey);
}

export function addReview(newReview: Omit<CustomerReview, 'id' | 'createdAt'>): CustomerReview {
  const current = loadReviews();
  const created: CustomerReview = {
    ...newReview,
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [created, ...current];
  saveReviews(updated);
  return created;
}

export function calculateProductRating(productKey: string, reviewsList?: CustomerReview[]): {
  averageRating: number;
  totalReviews: number;
  longevity24hPlusPercent: number;
  sillageStrongPercent: number;
} {
  const productReviews = getReviewsForProduct(productKey, reviewsList);
  if (productReviews.length === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      longevity24hPlusPercent: 95,
      sillageStrongPercent: 90,
    };
  }

  const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = Number((sum / productReviews.length).toFixed(1));

  const longevityHigh = productReviews.filter((r) => r.longevity === '24h' || r.longevity === '48h').length;
  const longevityPercent = Math.round((longevityHigh / productReviews.length) * 100);

  const sillageHigh = productReviews.filter((r) => r.sillage === 'strong' || r.sillage === 'beast').length;
  const sillagePercent = Math.round((sillageHigh / productReviews.length) * 100);

  return {
    averageRating: avg,
    totalReviews: productReviews.length,
    longevity24hPlusPercent: longevityPercent,
    sillageStrongPercent: sillagePercent,
  };
}
