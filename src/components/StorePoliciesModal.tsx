import React, { useState } from 'react';
import { X, ShieldCheck, Truck, RotateCcw, FileText, CheckCircle2 } from './icons';
import { useLanguage } from '../context/LanguageContext';
import type { AppSettings } from '../types';
import { formatWhatsAppPhone } from '../utils/whatsappConcierge';

export type PolicyTab = 'privacy' | 'shipping' | 'returns' | 'terms';

interface StorePoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyTab;
  settings: AppSettings;
}

export const StorePoliciesModal: React.FC<StorePoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  settings,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white text-neutral-900 w-full max-w-2xl max-h-[88vh] rounded-3xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-neutral-950 text-white px-5 sm:px-7 py-4.5 flex items-center justify-between border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-amber-400 tracking-wide font-serif">
                {isAr ? 'سياسات وضمانات نسمات للعطور' : 'Nasamat Perfumes Policies & Guarantees'}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {isAr ? 'مختبر بيروت للعطور الفاخرة • التزام بالجودة والشفافية' : 'Beirut Atelier • Luxury Standards & Trust'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer border border-neutral-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-neutral-100 p-2 border-b border-neutral-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-neutral-900 text-amber-400 shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200/70'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'shipping'
                ? 'bg-neutral-900 text-amber-400 shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200/70'
            }`}
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'الشحن والتوصيل' : 'Shipping & Delivery'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('returns')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'returns'
                ? 'bg-neutral-900 text-amber-400 shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200/70'
            }`}
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'الضمان والاستبدال' : 'Returns & Guarantee'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-neutral-900 text-amber-400 shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200/70'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'شروط الخدمة' : 'Terms of Service'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-4 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">
                    {isAr ? 'التزام الخصوصية وحماية بيانات الزبائن' : 'Data Privacy & Customer Security Commitment'}
                  </h4>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    {isAr
                      ? 'نحن في نسمات للعطور نحترم خصوصيتكم ونلتزم بحماية كافة بياناتكم الشخصية وفقاً لأعلى معايير الأمان الدولية وسياسات Meta و Google.'
                      : 'At Nasamat Perfumes, we strictly protect customer confidentiality in compliance with international privacy protocols, Meta Ads, and Google policies.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-neutral-900">
                  {isAr ? '1. ما هي البيانات التي نجمعها؟' : '1. Information We Collect'}
                </h3>
                <p>
                  {isAr
                    ? 'نجمع فقط المعلومات الضرورية لإتمام طلبك وتوصيله إليك، مثل الاسم ورقم الهاتف وعنوان التوصيل داخل لبنان، وتفاصيل العطور المرغوبة.'
                    : 'We only collect essential details to fulfill your fragrance order: full name, contact phone number, delivery address across Lebanon, and bespoke formula notes.'}
                </p>

                <h3 className="font-bold text-neutral-900">
                  {isAr ? '2. كيف نستخدم معلوماتك؟' : '2. How Your Information is Used'}
                </h3>
                <p>
                  {isAr
                    ? 'تُستخدم بياناتك حصرياً لمعالجة طلبيتك، التنسيق مع مندوب التوصيل، وإرسال تفاصيل فاتورة العطر عبر واتساب أو الاتصال المباشر. لا نقوم إطلاقاً ببيع أو تأجير أو مشاركة بياناتك مع أي طرف ثالث لأغراض تسويقية.'
                    : 'Your information is used strictly to prepare your flacons, arrange courier delivery, and provide WhatsApp concierge support. We never sell, lease, or share your data with third parties.'}
                </p>

                <h3 className="font-bold text-neutral-900">
                  {isAr ? '3. ملفات تعريف الارتباط وبكسل التتبع (Cookies & Tracking Pixels)' : '3. Cookies & Conversion Tracking'}
                </h3>
                <p>
                  {isAr
                    ? 'نستخدم أدوات تحليلية قياسية (مثل Meta Pixel) لقياس فاعلية حملاتنا الإعلانية وتحسين تجربة التصفح في المتجر دون تخزين أي بيانات مالية حساسة.'
                    : 'We use standard conversion tracking tools (such as Meta Pixel) to monitor campaign effectiveness and optimize your browsing experience without storing sensitive payment data.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 flex items-start gap-3">
                <Truck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">
                    {isAr ? 'توصيل سريع لكافة المناطق اللبنانية خلال 24 - 48 ساعة' : 'Fast Express Delivery Across Lebanon (24 - 48 Hours)'}
                  </h4>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    {isAr
                      ? `خدمة التوصيل تغطي بيروت، جبل لبنان، الشمال، الجنوب، والبقاع. الشحن مجاني للطلبات بقيمة ${settings.freeDeliveryThreshold}$ فما فوق.`
                      : `Delivery covers Beirut, Mount Lebanon, North, South, and Bekaa. Free shipping applies to orders of $${settings.freeDeliveryThreshold} or more.`}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-neutral-900">
                  {isAr ? '1. تكلفة ومواعيد الشحن' : '1. Delivery Rates & Schedules'}
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>{isAr ? `رسوم التوصيل القياسية لكافة المناطق: ${settings.defaultDeliveryFee}$ فقط (أو ما يعادلها بالليرة).` : `Standard delivery fee across all areas: $${settings.defaultDeliveryFee} (or LBP equivalent).`}</li>
                  <li>{isAr ? `توصيل مجاني بالكامل لأي طلب بقيمة ${settings.freeDeliveryThreshold}$ وأكثر.` : `100% Free Shipping on all orders of $${settings.freeDeliveryThreshold} and above.`}</li>
                  <li>{isAr ? 'مدة التوصيل: 24 ساعة داخل بيروت وضواحيها، وخلال 24-48 ساعة لباقي المحافظات.' : 'Transit time: 24 hours within Beirut & suburbs, 24-48 hours for other districts.'}</li>
                </ul>

                <h3 className="font-bold text-neutral-900">
                  {isAr ? '2. طرق الدفع المعتمدة' : '2. Payment Methods'}
                </h3>
                <p>
                  {isAr
                    ? 'الدفع عند الاستلام نقداً (Cash on Delivery) بالدولار الأمريكي (USD) أو بالليرة اللبنانية (LBP) حسب سعر الصرف المعلن في المتجر، كما يمكن الدفع المسبق عبر Whish Money أو OMT عند الرغبة.'
                    : 'Payment is made upon receipt in Cash (USD or LBP) at the official store rate. Pre-payment via Whish Money or OMT is also available upon request.'}
                </p>

                <h3 className="font-bold text-neutral-900">
                  {isAr ? '3. ضمان التغليف وحماية الزجاجة' : '3. Flacon Protection & Safe Packaging'}
                </h3>
                <p>
                  {isAr
                    ? 'تُغلّف زجاجات نسمات بعناية فائقة داخل عبوات مبطنة ممتصة للصدمات لحمايتها من الكسر أو التسريب أثناء النقل.'
                    : 'Every bottle is sealed and wrapped with high-grade shock-absorbent cushioning to guarantee pristine delivery without leaks or damage.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">
                    {isAr ? 'الضمان الملكي لتركيز العطور (Extrait de Parfum 33%)' : 'Royal Concentration Guarantee (Extrait 33%)'}
                  </h4>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    {isAr
                      ? 'نضمن نقاء الزيوت الفرنسية والسويسرية بنسبة تركيز 33% فعلية لتحقيق ثبات عالي وفوحان استثنائي.'
                      : 'We guarantee authentic Swiss and French grade oils formulated at full 33% Extrait ratio for outstanding sillage and 24-48hr longevity.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-neutral-900">
                  {isAr ? '1. سياسة الاستبدال والتعويض الفوري' : '1. Replacement & Damage Protection'}
                </h3>
                <p>
                  {isAr
                    ? 'في حال وصول أي زجاجة بها كسر أو خلل مصنعي في البخاخ أثناء الشحن، يتم استبدالها فوراً بزجاجة جديدة مجاناً وبدون أي تكاليف إضافية.'
                    : 'In the rare event of transit damage or an atomizer defect, we provide immediate free replacement with no extra shipping fees.'}
                </p>

                <h3 className="font-bold text-neutral-900">
                  {isAr ? '2. طبيعة الخلطات الخاصة بالاسم' : '2. Custom Blends Policy'}
                </h3>
                <p>
                  {isAr
                    ? 'نظراً لأن العطور المركبة بالاسم والخلطات الحصرية تُصاغ وتُطبَع خصيصاً لكل عميل، فإنها غير قابلة للإرجاع بعد بدء استخدامها، ولكننا نلتزم بتقديم التعديل والتعتيق اللازم لضمان رضاكم التام.'
                    : 'Because bespoke formulas and personalized flacons are custom-compounded per individual client, opened bottles cannot be restocked, but our atelier offers complimentary recalibration if needed.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-3">
                <h3 className="font-bold text-neutral-900">
                  {isAr ? '1. المصداقية الحرفية للمختبر' : '1. Artisan Craftsmanship Standards'}
                </h3>
                <p>
                  {isAr
                    ? 'تعتمد نسمات على أجود الزيوت العطرية العالمية النقية ويتم تعتيق كل خلطة في مختبر بيروت وفق النسب الكيميائية الآمنة ومعايير IFRA الدولية للعطور.'
                    : 'Nasamat blends only pure, allergen-compliant oils macerated under strict international IFRA fragrance safety standards.'}
                </p>

                <h3 className="font-bold text-neutral-900">
                  {isAr ? '2. تأكيد وحجز الطلبيات' : '2. Order Confirmation'}
                </h3>
                <p>
                  {isAr
                    ? 'يتم تأكيد الطلبات عبر واتساب أو الاتصال الهاتفي لضمان دقة العنوان واختيار العطر المناسب قبل إرسال الطلبية مع شركة الشحن.'
                    : 'Orders are verified via WhatsApp or phone confirmation to ensure exact formula specs and delivery precision prior to courier dispatch.'}
                </p>

                <h3 className="font-bold text-neutral-900">
                  {isAr ? '3. خدمة العملاء والاستفسارات' : '3. Concierge Contact Channels'}
                </h3>
                <p>
                  {isAr
                    ? `فريق خدمة العملاء متاح يومياً لمساعدتك عبر واتساب: ${settings.storePhone} أو عبر زيارة صفحاتنا الرسمية على إنستغرام وفيسبوك.`
                    : `Our concierge team is available daily via WhatsApp at ${settings.storePhone} or through our official Instagram and Facebook pages.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-neutral-50 px-5 sm:px-7 py-3 border-t border-neutral-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-neutral-500 font-mono">
            {isAr ? 'نسمات للعطور الفاخرة • بيروت، لبنان' : 'Nasamat Haute Parfumerie • Beirut, Lebanon'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition cursor-pointer"
          >
            {isAr ? 'حسناً، فهمت' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
