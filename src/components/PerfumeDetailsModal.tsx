import React, { useState } from 'react';
import type { FragranceOil, SavedRecipe, BottleLabelData, CustomerReview } from '../types';
import { getPerfumeOlfactoryProfile } from '../data/perfumePyramids';
import { loadReviews, addReview, calculateProductRating } from '../utils/reviews';
import { LUXURY_PRESET_IMAGES } from '../utils/storage';
import { formatWhatsAppPhone } from '../utils/whatsappConcierge';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedOilName, getLocalizedFamily, getLocalizedBrand, getLocalizedNotes } from '../utils/i18n';
import { 
  X, 
  ShoppingBag, 
  Droplet, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Truck, 
  Check, 
  Plus, 
  Minus, 
  Flame, 
  Tag,
  Star,
  UserCheck,
  MessageCircle,
  WhatsAppOfficialIcon,
  Camera,
  Upload,
  FlaskConical,
  Award
} from './icons';

interface PerfumeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    type: 'oil' | 'recipe';
    data: FragranceOil | SavedRecipe;
    key: string;
  } | null;
  selectedSize: number;
  onSelectSize: (size: number) => void;
  quantity: number;
  onUpdateQuantity: (qty: number) => void;
  onAddToCart: (
    type: 'oil' | 'recipe',
    id: string,
    name: string,
    nameEn: string | undefined,
    brand: string,
    imageUrl: string | undefined,
    size: number,
    price: number,
    qty: number,
    oilNeededMl: number
  ) => void;
  getPriceInfo: (product: { type: 'oil' | 'recipe'; data: FragranceOil | SavedRecipe }, size: number) => {
    price: number;
    oilNeededMl: number;
    maxBottlesPossible: number;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  };
  lbpRate?: number;
  storePhone?: string;
  onOpenBottleLabel?: (data: BottleLabelData) => void;
  onUpdateOil?: (updated: FragranceOil) => void;
  onUpdateRecipe?: (updated: SavedRecipe) => void;
}

export const PerfumeDetailsModal: React.FC<PerfumeDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedSize,
  onSelectSize,
  quantity,
  onUpdateQuantity,
  onAddToCart,
  getPriceInfo,
  lbpRate = 90000,
  storePhone = '+961 70 000 000',
  onOpenBottleLabel,
  onUpdateOil,
  onUpdateRecipe,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'pyramid' | 'story' | 'performance' | 'reviews'>('pyramid');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoInputUrl, setPhotoInputUrl] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSavePhoto = () => {
    if (!photoInputUrl.trim()) return;
    if (isRecipe && onUpdateRecipe) {
      onUpdateRecipe({
        ...rec!,
        imageUrl: photoInputUrl.trim(),
      });
    } else if (!isRecipe && onUpdateOil) {
      onUpdateOil({
        ...oil!,
        imageUrl: photoInputUrl.trim(),
      });
    }
    setIsEditingPhoto(false);
  };

  // Reviews Engine State
  const [reviewsList, setReviewsList] = useState<CustomerReview[]>(() => loadReviews());
  const [showAddReviewForm, setShowAddReviewForm] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewCity, setReviewCity] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewLongevity, setReviewLongevity] = useState<'12h' | '24h' | '48h'>('24h');
  const [reviewSillage, setReviewSillage] = useState<'soft' | 'moderate' | 'strong' | 'beast'>('strong');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Sync reviews when product changes
  React.useEffect(() => {
    if (isOpen) {
      setReviewsList(loadReviews());
      setShowAddReviewForm(false);
      setReviewSubmitted(false);
    }
  }, [isOpen, product]);

  // Escape key handler
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const isRecipe = product.type === 'recipe';
  const rec = isRecipe ? (product.data as SavedRecipe) : null;
  const oil = !isRecipe ? (product.data as FragranceOil) : null;

  const name = isRecipe ? rec!.name : oil!.name;
  const nameEn = isRecipe ? rec!.nameEn : oil!.nameEn;
  const displayName = isAr ? name : (nameEn || getLocalizedOilName(name, 'en'));
  const displaySecondary = isAr ? nameEn : (nameEn && nameEn !== name ? name : undefined);
  const brand = isRecipe 
    ? (isAr ? 'خلطة نسمات الملكية الخاصة (Nasamat Signature)' : 'Nasamat Private Reserve Signature') 
    : (isAr ? oil!.brand : getLocalizedBrand(oil!.brand, 'en'));
  const imageUrl = isRecipe ? rec!.imageUrl : oil!.imageUrl;
  const family = isRecipe 
    ? (isAr ? 'خلطة ملكية خاصة' : 'Royal Bespoke Blend') 
    : getLocalizedFamily(oil!.family, language);

  // Olfactory Profile
  const profile = getPerfumeOlfactoryProfile(product.data);

  // Price & Stock info
  const info = getPriceInfo(product, selectedSize);
  const { price, stockStatus, maxBottlesPossible } = info;
  const lineTotal = price * quantity;
  const lbpTotal = Math.round(lineTotal * lbpRate);

  // Dynamic bottle options filtered by product availability (supports custom sizes)
  const productAvailableSizes = (product?.data as any)?.availableSizes;
  const availableList: number[] = Array.isArray(productAvailableSizes) && productAvailableSizes.length > 0
    ? productAvailableSizes
    : [30, 50, 100];

  const sizes = availableList.map((sz) => {
    let subtitle = isAr ? `حجم ${sz} مل` : `${sz}ml bottle`;
    if (sz <= 12) subtitle = isAr ? 'تولة / دهن مركز فاخر' : 'Pure Tola / Attar';
    else if (sz <= 20) subtitle = isAr ? 'عينة وتجربة وسفر' : 'Discovery / Travel';
    else if (sz === 30) subtitle = isAr ? 'حجم حقيبة / سفر' : 'Pocket / Travel Flacon';
    else if (sz === 50) subtitle = isAr ? 'الأكثر طلباً وتوفيراً' : 'Most Popular & Best Value';
    else if (sz === 100) subtitle = isAr ? 'حجم الفخامة الملكية' : 'Grand Luxury Flacon';
    else if (sz >= 150) subtitle = isAr ? 'حجم صالونات كبير' : 'Grand Salon Flacon';

    return {
      size: sz,
      label: `${sz}ml`,
      subtitle,
      price: getPriceInfo(product, sz).price,
      popular: sz === 50 || (availableList.length === 1),
    };
  });

  // Dynamic Ratings & Review metrics
  const productKey = product ? product.key : '';
  const productReviews = reviewsList.filter((r) => r.productKey === productKey);
  const ratingMetrics = calculateProductRating(productKey, reviewsList);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) return;

    const created = addReview({
      productKey,
      productName: name,
      authorName: reviewAuthor.trim(),
      authorCity: reviewCity.trim() || (isAr ? 'بيروت' : 'Beirut'),
      rating: reviewRating,
      longevity: reviewLongevity,
      sillage: reviewSillage,
      comment: reviewComment.trim(),
      verified: true,
    });

    setReviewsList((prev) => [created, ...prev]);
    setReviewComment('');
    setReviewSubmitted(true);
    setShowAddReviewForm(false);
    setTimeout(() => setReviewSubmitted(false), 3500);
  };

  // WhatsApp concierge handler
  const handleWhatsAppConsultation = () => {
    const cleanPhone = formatWhatsAppPhone(storePhone);
    const msg = isAr
      ? `مرحباً نسمات للعطور، أود الاستفسار وطلب عطر: ${name} (${selectedSize} ملل بسعر $${price.toFixed(2)}). هل هو متوفر للشحن؟`
      : `Hello Nasamat Perfumes, I would like to inquire about ordering: ${nameEn || name} (${selectedSize}ml for $${price.toFixed(2)}). Is it available for delivery?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn cursor-pointer"
      onClick={onClose}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative bg-white border border-neutral-300 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto animate-scaleUp text-black cursor-default"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                  HAUTE PARFUMERIE DOSSIER
                </span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-mono">
                  EXTRAIT DE PARFUM
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white font-serif">
                {isAr ? 'الهوية العطرية وتفاصيل المكونات' : 'Olfactory Identity & Fragrance Notes'}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-3.5 sm:p-6 max-h-[88dvh] sm:max-h-[82vh] overflow-y-auto space-y-4 sm:space-y-6">
          
          {/* Hero Section: Flacon + Editorial Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-neutral-50 rounded-2xl p-4 sm:p-5 border border-neutral-200">
            {/* Flacon Visual */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative w-32 h-40 sm:w-40 sm:h-52 rounded-2xl overflow-hidden bg-white border border-neutral-300 shadow-md flex items-center justify-center">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={displayName} 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                    <Droplet className="w-10 h-10" />
                  </div>
                )}
                <span className="absolute top-2 start-2 bg-black text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow">
                  {isRecipe ? (isAr ? '★ خلطة ملكية' : '★ Royal Blend') : 'Extrait de Parfum'}
                </span>
                <span className="absolute bottom-2 end-2 bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded-md shadow font-mono">
                  {selectedSize}ML
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhotoInputUrl(imageUrl || '');
                  setIsEditingPhoto(true);
                }}
                className="mt-2 w-full text-[11px] font-bold text-neutral-700 hover:text-black flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-neutral-300 bg-white shadow-2xs hover:border-black transition cursor-pointer"
                title={isAr ? 'تعديل أو استبدال صورة هذا العطر' : 'Change or edit perfume bottle image'}
              >
                <Camera className="w-3.5 h-3.5 text-neutral-600" />
                <span>{isAr ? 'تغيير صورة العطر' : 'Change Image'}</span>
              </button>
            </div>

            {/* Perfume Identity */}
            <div className="flex-1 text-center sm:text-start space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                  {isAr ? profile.genderAr : (profile.gender === 'men' ? "Men's Luxury" : profile.gender === 'women' ? "Women's Niche" : "Unisex Extrait")}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-200 text-neutral-800 text-[10px] font-bold">
                  {family}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {stockStatus === 'in_stock'
                    ? (isAr ? `✓ متوفر بالمختبر (${maxBottlesPossible} عبوة)` : `✓ In Stock (${maxBottlesPossible} bottles)`)
                    : stockStatus === 'low_stock'
                    ? (isAr ? '⚠️ كمية محدودة' : '⚠️ Limited Stock')
                    : (isAr ? 'نفذت الكمية' : 'Out of Stock')}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-black font-serif leading-tight">
                {displayName}
              </h2>
              {displaySecondary && (
                <p className="text-xs text-neutral-500 font-mono font-semibold tracking-wide">
                  {displaySecondary}
                </p>
              )}

              <div className="text-xs text-neutral-600 font-bold flex items-center justify-center sm:justify-start gap-1">
                <span className="text-neutral-400">{isAr ? 'مستوحى من دار:' : 'Inspired by House:'}</span>
                <span className="text-black font-black">{brand}</span>
              </div>

              {/* Star Rating Badge (Click to open reviews) */}
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className="flex items-center justify-center sm:justify-start gap-2 pt-1 hover:opacity-85 transition cursor-pointer group"
                title={isAr ? 'عرض تقييمات وآراء الزبائن' : 'View Customer Reviews'}
              >
                <div className="flex items-center text-amber-500 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < Math.round(ratingMetrics.averageRating) ? '★' : '☆'}</span>
                  ))}
                </div>
                <span className="text-xs font-black text-black font-mono">{ratingMetrics.averageRating}</span>
                <span className="text-[11px] text-neutral-500 underline decoration-dotted group-hover:text-black">
                  ({productReviews.length} {isAr ? (productReviews.length === 1 ? 'تقييم موثق' : 'تقييمات موثقة') : (productReviews.length === 1 ? 'Verified Review' : 'Verified Reviews')})
                </span>
              </button>

              {/* Main Accords (التوافقات العطرية البارزة) */}
              <div className="pt-2">
                <div className="text-[11px] font-black text-neutral-500 mb-1.5 uppercase tracking-wider">
                  {isAr ? 'التوافقات العطرية الأساسية:' : 'Main Olfactory Accords:'}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  {profile.accords.map((accord, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white border border-neutral-300 text-neutral-800 text-[11px] font-bold shadow-2xs"
                    >
                      {getLocalizedNotes(accord, language)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Pills between sections */}
          <div className="flex border-b border-neutral-200">
            <button
              type="button"
              onClick={() => setActiveTab('pyramid')}
              className={`flex-1 pb-3 text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'pyramid'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-black'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>{isAr ? 'الهرم العطري والمكونات' : 'Olfactory Pyramid'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('story')}
              className={`flex-1 pb-3 text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'story'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-black'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'قصة العطر وجاذبيته' : 'Fragrance Story'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('performance')}
              className={`flex-1 pb-3 text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'performance'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-black'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{isAr ? 'الثبات والفوحان' : 'Longevity & Sillage'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 pb-3 text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-black'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{isAr ? `آراء وتجارب الزبائن (${productReviews.length})` : `Customer Reviews (${productReviews.length})`}</span>
            </button>
          </div>

          {/* Tab 1: 3-Tier Olfactory Pyramid */}
          {activeTab === 'pyramid' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center sm:text-start">
                <h4 className="text-sm font-black text-black flex items-center justify-center sm:justify-start gap-1.5">
                  <span>{isAr ? 'الهرم العطري الثلاثي (The Olfactory Pyramid)' : 'The Olfactory Pyramid'}</span>
                </h4>
                <p className="text-xs text-neutral-500">
                  {isAr ? 'تطور نفحات العطر على بشرتك وملابسك من اللحظة الأولى وحتى استقراره النهائي' : 'How the fragrance notes unfold on your skin from opening spray to final dry-down'}
                </p>
              </div>

              {/* 3 Pyramid Tiers */}
              <div className="space-y-3">
                
                {/* 1. Top Notes (القمة العطرية) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-400 text-black flex items-center justify-center text-xs font-black">
                        🍋
                      </span>
                      <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                        {isAr ? 'قمة العطر (Top Notes) • الانطباع الأول' : 'Top Notes (Opening) • First Impression'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                      {isAr ? 'أول 15 - 30 دقيقة' : 'First 15 - 30 minutes'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                    {isAr ? 'النفحات المنعشة والفوارة التي تستقبلك فور رش العطر لتبهر الحواس وتمنحك شعوراً فورياً بالحيوية والجاذبية.' : 'The sparkling opening notes that immediately greet your senses with vibrant allure.'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.topNotes.map((note, i) => (
                      <span 
                        key={i} 
                        className="px-2.5 py-1 rounded-xl bg-white text-black font-bold text-xs border border-amber-300 shadow-2xs"
                      >
                        • {getLocalizedNotes(note, language)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Heart Notes (قلب العطر) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/70 border-2 border-rose-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-rose-400 text-white flex items-center justify-center text-xs font-black">
                        🌹
                      </span>
                      <span className="text-xs font-black text-rose-950 uppercase tracking-wider">
                        {isAr ? 'قلب العطر (Heart Notes) • جوهر الهوية والنبض' : 'Heart Notes (Core) • True Identity'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-200/60 px-2 py-0.5 rounded-full">
                      {isAr ? 'يدوم 2 - 6 ساعات' : 'Lasts 2 - 6 hours'}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-900 leading-relaxed font-medium">
                    {isAr ? 'الروح الحقيقية والنبض العطري الذي يحدد شخصية العطر وسحره الفاتن ويثير إعجاب كل من يقترب منك.' : 'The heart and character that defines the fragrance sillage, enchanting everyone in your wake.'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.heartNotes.map((note, i) => (
                      <span 
                        key={i} 
                        className="px-2.5 py-1 rounded-xl bg-white text-black font-bold text-xs border border-rose-300 shadow-2xs"
                      >
                        • {getLocalizedNotes(note, language)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3. Base Notes (قاعدة العطر) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-900 text-white border-2 border-neutral-800 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-400 text-black flex items-center justify-center text-xs font-black">
                        🪵
                      </span>
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                        {isAr ? 'قاعدة العطر (Base Notes) • سر الثبات والفوحان الملكي' : 'Base Notes (Dry Down) • Royal Sillage'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-black bg-amber-400 px-2 py-0.5 rounded-full">
                      {isAr ? 'يدوم 24 - 48 ساعة' : 'Lasts 24 - 48 hours'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed font-medium">
                    {isAr ? 'المرتكز الأثقل والأفخم الذي يلتصق بالأنسجة والأقمشة ليمنحك بصمة عطرية أسطورية وهالة ملكية لا تزول.' : 'The rich, enduring foundation that anchors to fabrics, creating an unforgettable royal aura.'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.baseNotes.map((note, i) => (
                      <span 
                        key={i} 
                        className="px-2.5 py-1 rounded-xl bg-neutral-800 text-white font-bold text-xs border border-neutral-700 shadow-2xs"
                      >
                        • {getLocalizedNotes(note, language)}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: The Sensory Story */}
          {activeTab === 'story' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex items-center gap-2 text-black font-serif font-black text-base">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>{isAr ? 'قصة العطر وسحره الفاتن' : 'Sensory Story & Inspiration'}</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-medium">
                  {isAr ? profile.storyAr : (profile.storyEn || profile.storyAr)}
                </p>
                {isAr && profile.storyEn && (
                  <p className="text-xs text-neutral-500 font-mono italic pt-2 border-t border-neutral-200">
                    "{profile.storyEn}"
                  </p>
                )}
              </div>

              {/* Aura / Vibe Card */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="text-[11px] font-black text-amber-900 uppercase">
                    {isAr ? 'طابع الانطباع والأثر' : 'Aura & Impression'}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-black">
                    {isAr ? profile.vibeAr : (profile.vibeEn || 'Commanding Charisma, Absolute Success & Unforgettable Presence')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Performance & Wear Matrix */}
          {activeTab === 'performance' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Concentration */}
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-500 font-black">{isAr ? 'نسبة التركيز' : 'Concentration'}</div>
                    <div className="text-xs font-black text-black">{isAr ? profile.concentrationAr : 'Extrait de Parfum (Double Strength)'}</div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{isAr ? 'زيت عطري نقي مضاعف للثبات' : 'Pure concentrated perfume oil for optimal performance'}</p>
                  </div>
                </div>

                {/* Longevity */}
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-500 font-black">{isAr ? 'نسبة الثبات' : 'Longevity'}</div>
                    <div className="text-xs font-black text-black">{isAr ? profile.longevityAr : '24 - 48 Hours on Fabrics'}</div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{isAr ? 'ضمان استمرار الرائحة على الملابس' : 'Guaranteed long-lasting trail on fabrics'}</p>
                  </div>
                </div>

                {/* Sillage */}
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold text-xs shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-500 font-black">{isAr ? 'قوة الفوحان (Sillage)' : 'Sillage & Projection'}</div>
                    <div className="text-xs font-black text-black">{isAr ? profile.sillageAr : 'Strong & Enveloping Trail'}</div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{isAr ? 'يترك أثراً فخماً أينما مررت' : 'Leaves a luxurious aura wherever you pass'}</p>
                  </div>
                </div>

                {/* Season */}
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    ☀️
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-500 font-black">{isAr ? 'الفصول الموصى بها' : 'Recommended Seasons'}</div>
                    <div className="text-xs font-black text-black">{isAr ? profile.seasonAr : 'All Seasons & Weather'}</div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{isAr ? 'تدرج متناغم مع حرارة الجو' : 'Balanced harmony across varying temperatures'}</p>
                  </div>
                </div>

                {/* Occasion */}
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    👔
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-500 font-black">{isAr ? 'المناسبات المقترحة' : 'Suggested Occasions'}</div>
                    <div className="text-xs font-black text-black">{isAr ? profile.occasionAr : 'Executive, Evening, Weddings & Daily Signature'}</div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 4: Verified Customer Reviews & Social Proof */}
          {activeTab === 'reviews' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Reviews Summary Header */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center md:text-start">
                  <div className="flex flex-col items-center justify-center bg-white border border-neutral-300 rounded-2xl w-20 h-20 shadow-xs">
                    <span className="text-2xl font-black text-black font-mono leading-none">
                      {ratingMetrics.averageRating}
                    </span>
                    <div className="text-amber-500 text-xs tracking-tighter mt-1">★★★★★</div>
                    <span className="text-[9px] text-neutral-500 mt-0.5">
                      {productReviews.length} {isAr ? 'تقييم' : 'reviews'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-black flex items-center justify-center md:justify-start gap-1.5">
                      <span>{isAr ? 'تجارب حقيقية موثقة لزبائن نسمات' : 'Verified Reviews from Nasamat Patrons'}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </h4>
                    <p className="text-xs text-neutral-600">
                      {isAr ? 'تقييمات فعلية من زبائن اقتنوا وارتدوا العطر في بيروت ومختلف المناطق اللبنانية' : 'Authentic feedback from fragrance lovers across Beirut and all Lebanese regions'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                        ✓ {ratingMetrics.longevity24hPlusPercent}% {isAr ? 'أكدوا ثبات 24 ساعة+' : 'Confirmed 24h+ Longevity'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-700" />
                        <span>{ratingMetrics.sillageStrongPercent}% {isAr ? 'فوحان قوي وفتاك' : 'Strong Projection & Sillage'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddReviewForm(!showAddReviewForm)}
                  className="px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition shadow-xs shrink-0"
                >
                  <MessageCircle className="w-4 h-4 text-amber-400" />
                  <span>{showAddReviewForm ? (isAr ? 'إلغاء التقييم' : 'Cancel Review') : (isAr ? '✍️ أضف تجربتك وتقييمك' : '✍️ Write a Review')}</span>
                </button>
              </div>

              {/* Review Submitted Toast */}
              {reviewSubmitted && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <span>✓</span>
                  <span>{isAr ? 'شكراً لك! تم تسجيل ونشر تقييمك وتجربتك العطرية بنجاح 🌹.' : 'Thank you! Your verified review has been published successfully 🌹.'}</span>
                </div>
              )}

              {/* Add Review Form */}
              {showAddReviewForm && (
                <form onSubmit={handleSubmitReview} className="p-5 rounded-2xl bg-white border-2 border-neutral-300 space-y-4 animate-scaleUp text-xs">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <span className="font-black text-sm text-black">{isAr ? `كتابة تقييم لعطر ${displayName}` : `Write a Review for ${displayName}`}</span>
                    <span className="text-neutral-400 text-[11px]">{isAr ? 'التقييم يظهر فوراً للجميع' : 'Visible to all customers immediately'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">{isAr ? 'اسمك الكريم:' : 'Your Name:'}</label>
                      <input
                        type="text"
                        value={reviewAuthor}
                        onChange={(e) => setReviewAuthor(e.target.value)}
                        placeholder=""
                        className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-medium focus:border-black focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">{isAr ? 'المدينة / المنطقة:' : 'City / District:'}</label>
                      <input
                        type="text"
                        value={reviewCity}
                        onChange={(e) => setReviewCity(e.target.value)}
                        placeholder=""
                        className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-medium focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">{isAr ? 'التقييم العام بالنجوم:' : 'Overall Star Rating:'}</label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-bold"
                      >
                        <option value={5}>{isAr ? '★★★★★ (5 نجوم - ممتاز ملوكي)' : '★★★★★ (5 Stars - Royal Excellence)'}</option>
                        <option value={4}>{isAr ? '★★★★☆ (4 نجوم - جيد جداً)' : '★★★★☆ (4 Stars - Very Good)'}</option>
                        <option value={3}>{isAr ? '★★★☆☆ (3 نجوم - متوسط)' : '★★★☆☆ (3 Stars - Moderate)'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">{isAr ? 'مدة الثبات على الملابس:' : 'Longevity on Fabric:'}</label>
                      <select
                        value={reviewLongevity}
                        onChange={(e) => setReviewLongevity(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-bold"
                      >
                        <option value="48h">{isAr ? 'ثبات خرافي (48 ساعة+)' : 'Incredible Longevity (48h+)'}</option>
                        <option value="24h">{isAr ? 'ثبات ممتاز (24 ساعة)' : 'Excellent (24 Hours)'}</option>
                        <option value="12h">{isAr ? 'ثبات يوم كامل (12 ساعة)' : 'Full Day (12 Hours)'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">{isAr ? 'درجة الفوحان (Sillage):' : 'Sillage Strength:'}</label>
                      <select
                        value={reviewSillage}
                        onChange={(e) => setReviewSillage(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-bold"
                      >
                        <option value="beast">{isAr ? 'فوحان وحش هائل (ملفت جداً)' : 'Beast Mode Projection'}</option>
                        <option value="strong">{isAr ? 'فوحان قوي (مسافة ذراعين)' : 'Strong Sillage (Arm-length)'}</option>
                        <option value="moderate">{isAr ? 'فوحان معتدل هادئ' : 'Moderate & Elegant'}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">{isAr ? 'رأيك وتجربتك بالتفصيل:' : 'Your Detailed Experience:'}</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      placeholder=""
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs leading-relaxed focus:border-black focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddReviewForm(false)}
                      className="px-4 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 font-bold"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold shadow-sm"
                    >
                      {isAr ? 'إرسال التقييم' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-3">
                {productReviews.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                    <div className="text-2xl">🌹</div>
                    <div className="font-bold text-xs text-neutral-700">{isAr ? 'كن أول من يقيّم هذا العطر الفاخر!' : 'Be the first to review this luxury perfume!'}</div>
                    <p className="text-[11px] text-neutral-500">{isAr ? 'شارك زوار المتجر تجربتك العطرية مع ثبات وفوحان هذا العطر.' : 'Share your sensory experience with fellow perfume lovers.'}</p>
                  </div>
                ) : (
                  productReviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                            {rev.authorName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-xs text-black flex items-center gap-1.5">
                              <span>{rev.authorName}</span>
                              {rev.verified && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                                  <UserCheck className="w-2.5 h-2.5" />
                                  <span>{isAr ? 'مشتري موثق' : 'Verified Patron'}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-medium">
                              {rev.authorCity} • {new Date(rev.createdAt).toLocaleDateString(isAr ? 'ar-LB' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 text-xs font-black">
                            {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-mono text-[10px] font-bold">
                            {rev.longevity === '48h' ? (isAr ? '48 ساعة+' : '48h+') : rev.longevity === '24h' ? (isAr ? '24 ساعة' : '24h') : (isAr ? '12 ساعة' : '12h')}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-700 leading-relaxed font-medium bg-neutral-50/60 p-2.5 rounded-xl border border-neutral-100">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Size Selector Cards */}
          <div className="space-y-2 pt-2 border-t border-neutral-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-black" />
                <span>{isAr ? 'اختر حجم العبوة المطلوب:' : 'Select Desired Bottle Size:'}</span>
              </span>
              <span className="text-neutral-500 font-medium">
                {isAr ? 'بتركيز Extrait de Parfum' : 'Extrait de Parfum Concentration'}
              </span>
            </div>

            <div className={`grid gap-2.5 ${
              sizes.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : sizes.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
            }`}>
              {sizes.map((tier) => {
                const isSelected = selectedSize === tier.size;
                return (
                  <div
                    key={tier.size}
                    onClick={() => onSelectSize(tier.size)}
                    className={`relative p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-lg scale-[1.02]'
                        : 'bg-white text-black border-neutral-300 hover:border-black hover:bg-neutral-50'
                    }`}
                  >
                    {tier.popular && (
                      <span className={`absolute -top-2.5 start-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase shadow-sm ${
                        isSelected ? 'bg-amber-400 text-black' : 'bg-black text-white'
                      }`}>
                        {isAr ? '★ الأكثر طلباً' : '★ Most Popular'}
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black uppercase">{tier.label}</span>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        isSelected ? 'bg-white text-black border-white' : 'border-neutral-400'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="my-1.5">
                      <div className="text-xl font-black font-mono">
                        ${tier.price.toFixed(2)}
                      </div>
                      <div className={`text-[11px] font-semibold ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {tier.subtitle}
                      </div>
                    </div>

                    <div className={`text-center py-1 rounded-lg text-[10px] font-bold mt-1 ${
                      isSelected ? 'bg-neutral-800 text-amber-300' : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      {isSelected ? (isAr ? '✓ تم الاختيار' : '✓ Selected') : (isAr ? 'انقر للتحديد' : 'Click to Select')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quantity Stepper & Price Calculation */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Stepper */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-black text-neutral-700">{isAr ? 'الكمية:' : 'Quantity:'}</span>
              <div className="flex items-center bg-white border border-neutral-300 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(quantity - 1)}
                  disabled={quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center text-black hover:bg-neutral-100 rounded-lg disabled:opacity-30 cursor-pointer font-black"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-black text-black font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(quantity + 1)}
                  disabled={quantity >= 20 || quantity >= maxBottlesPossible}
                  className="w-8 h-8 flex items-center justify-center text-black hover:bg-neutral-100 rounded-lg disabled:opacity-30 cursor-pointer font-black"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Price calculation */}
            <div className="text-center sm:text-end w-full sm:w-auto">
              <div className="text-xs text-neutral-500 font-medium">
                {quantity} {isAr ? 'عبوة' : 'bottles'} × ${price.toFixed(2)} ({selectedSize}ml)
              </div>
              <div className="text-2xl font-black text-black font-mono">
                ${lineTotal.toFixed(2)}
                <span className="text-xs text-neutral-500 font-sans ms-2 font-bold">
                  ≈ {lbpTotal.toLocaleString()} L.L.
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Add To Cart & WhatsApp Concierge */}
          <div className="space-y-2.5 pt-2">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onAddToCart(
                    product.type,
                    product.data.id,
                    name,
                    nameEn,
                    brand,
                    imageUrl,
                    selectedSize,
                    price,
                    quantity,
                    info.oilNeededMl
                  );
                  onClose();
                }}
                disabled={stockStatus === 'out_of_stock'}
                className="flex-1 py-4 px-6 rounded-2xl font-black text-sm bg-black hover:bg-neutral-800 text-white uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition cursor-pointer disabled:opacity-40"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{isAr ? `أضف إلى السلة الآن ($${lineTotal.toFixed(2)})` : `Add to Cart ($${lineTotal.toFixed(2)})`}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppConsultation}
                className="py-4 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer shrink-0"
              >
                <WhatsAppOfficialIcon className="w-5 h-5 fill-current" />
                <span>{isAr ? 'طلب استشارة عبر واتساب' : 'Inquire via WhatsApp'}</span>
              </button>
            </div>

            {/* Quality & Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-neutral-600 font-medium pt-2 border-t border-neutral-100">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-neutral-800" />
                <span>{isAr ? 'توصيل سريع لكافة الأراضي اللبنانية خلال 24 - 48 ساعة' : 'Fast Delivery Across Lebanon in 24 - 48h'}</span>
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'ضمان ثبات وفوحان دائم أو استرجاع كامل' : 'Guaranteed Longevity & Sillage or Full Return'}</span>
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Photo Edit Modal for Perfume */}
      {isEditingPhoto && (
        <div 
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsEditingPhoto(false)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden text-black animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-black">{isAr ? `تغيير صورة العطر: ${displayName}` : `Change Perfume Image: ${displayName}`}</h3>
                  <p className="text-[11px] text-neutral-500">{isAr ? 'رفع صورة من جهازك أو وضع رابط أو اختيار زجاجة فاخرة' : 'Upload from device, enter direct URL, or select preset bottle'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingPhoto(false)}
                className="w-7 h-7 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-600 hover:text-black flex items-center justify-center cursor-pointer"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-black shrink-0 bg-white shadow-sm">
                  <img
                    src={photoInputUrl || imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="inline-flex py-2 px-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs items-center gap-2 shadow-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <span>{isAr ? 'رفع صورة من جهازك' : 'Upload Image from Device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-neutral-500">{isAr ? 'يدعم صور PNG و JPG و WEBP من هاتفك أو حاسوبك' : 'Supports PNG, JPG, and WEBP files'}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {isAr ? 'أو أدخل رابط الصورة المباشر (URL):' : 'Or enter direct image URL:'}
                </label>
                <input
                  type="url"
                  value={photoInputUrl}
                  onChange={(e) => setPhotoInputUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-black flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'أو اختر زجاجة فاخرة جاهزة بنقرة واحدة:' : 'Or choose a luxury flacon preset:'}</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {LUXURY_PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoInputUrl(preset.url)}
                      className={`p-1 rounded-xl border transition cursor-pointer flex flex-col items-center ${
                        photoInputUrl === preset.url ? 'border-black bg-neutral-100 ring-2 ring-black' : 'border-neutral-200 hover:border-black'
                      }`}
                      title={isAr ? preset.name : (preset.nameEn || 'Luxury Perfume')}
                    >
                      <div className="w-12 h-14 rounded-lg overflow-hidden bg-neutral-100">
                        <img src={preset.url} alt={isAr ? preset.name : (preset.nameEn || 'Luxury Perfume')} className="w-full h-full object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditingPhoto(false)}
                className="px-4 py-2 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-xs font-bold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                className="px-5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5 text-white" />
                <span>{isAr ? 'حفظ الصورة' : 'Save Image'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
