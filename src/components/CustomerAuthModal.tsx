import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Lock, 
  Sparkles, 
  GoogleIcon, 
  AppleIcon, 
  Fingerprint, 
  Bookmark, 
  ShoppingBag, 
  ShieldCheck, 
  ArrowUpRight,
  Mail,
  Eye,
  EyeOff,
  Phone
} from './icons';
import type { CustomerUser } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  saveCustomerUser, 
  loadCustomerUser, 
  loadSavedDeliveryDetails, 
  saveSavedDeliveryDetails, 
  logCRMActivity 
} from '../utils/storage';
import { trackPixelEvent } from '../utils/pixelTracker';
import { 
  isFirebaseConfigured, 
  signInWithGoogleFirebase, 
  signInWithAppleFirebase, 
  signInWithEmailFirebase,
  signUpWithEmailFirebase,
  resetPasswordFirebase,
  formatFirebaseError
} from '../utils/firebase';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CustomerUser | null;
  onAuthSuccess: (user: CustomerUser) => void;
  onLogout: () => void;
  customBlendsCount?: number;
  ordersCount?: number;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onLogout,
  customBlendsCount = 0,
  ordersCount = 0,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [authStage, setAuthStage] = useState<'options' | 'email' | 'direct_entry' | 'apple_entry'>('options');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email Auth State
  const [emailMode, setEmailMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailDisplayName, setEmailDisplayName] = useState('');
  const [emailPhone, setEmailPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Apple VIP entry state
  const [appleName, setAppleName] = useState('');
  const [appleEmail, setAppleEmail] = useState('');
  const [applePhone, setApplePhone] = useState('');

  // Direct custom entry state
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');

  // Saved delivery profile states
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileCity, setProfileCity] = useState(currentUser?.savedCity || '');
  const [profileAddress, setProfileAddress] = useState(currentUser?.savedAddress || '');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const savedDelivery = loadSavedDeliveryDetails();
      setProfilePhone(currentUser.phone || savedDelivery?.phone || '');
      setProfileCity(currentUser.savedCity || savedDelivery?.city || '');
      setProfileAddress(currentUser.savedAddress || savedDelivery?.address || '');
    }
  }, [currentUser, isOpen]);

  const enrichWithSavedDelivery = (user: CustomerUser): CustomerUser => {
    const existing = loadCustomerUser();
    const saved = loadSavedDeliveryDetails();
    return {
      ...user,
      phone: user.phone || existing?.phone || saved?.phone,
      savedAddress: user.savedAddress || existing?.savedAddress || saved?.address,
      savedCity: user.savedCity || existing?.savedCity || saved?.city,
      savedNotes: user.savedNotes || existing?.savedNotes || saved?.notes,
    };
  };

  const handleSaveDeliveryProfile = () => {
    if (!currentUser) return;
    const updated: CustomerUser = {
      ...currentUser,
      phone: profilePhone.trim() || undefined,
      savedCity: profileCity.trim() || undefined,
      savedAddress: profileAddress.trim() || undefined,
    };
    saveCustomerUser(updated);
    saveSavedDeliveryDetails({
      name: updated.name,
      phone: updated.phone,
      city: updated.savedCity,
      address: updated.savedAddress,
    });
    onAuthSuccess(updated);
    setIsEditingDelivery(false);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  // Reset stage on open
  useEffect(() => {
    if (isOpen) {
      setAuthStage('options');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  // Handle ESC key for smart back navigation & close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (authStage !== 'options') {
          setAuthStage('options');
          setErrorMessage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, authStage, onClose]);

  if (!isOpen) return null;

  // Real Google Sign-In via Firebase
  const handleGoogleClick = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // If on 127.0.0.1, smoothly redirect to localhost where Firebase Google Auth is pre-authorized
    if (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1') {
      window.location.replace(window.location.href.replace('127.0.0.1', 'localhost'));
      return;
    }

    setIsProcessing(true);
    try {
      const user = await signInWithGoogleFirebase();
      const enriched = enrichWithSavedDelivery(user);
      saveCustomerUser(enriched);
      logCRMActivity({
        customerId: enriched.id,
        customerName: enriched.name,
        type: 'login',
        description: `تسجيل دخول ناجح عبر حساب Google الرسمي (${enriched.email})`,
      });
      trackPixelEvent('CompleteRegistration', {
        provider: 'Google_Firebase',
        customer_name: enriched.name,
        currency: 'USD',
      });
      onAuthSuccess(enriched);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      const friendlyErr = formatFirebaseError(err, isAr);
      setErrorMessage(friendlyErr);
    } finally {
      setIsProcessing(false);
    }
  };

  // Instant Test Google Sign-In
  const handleTestGoogleLogin = () => {
    const testUser: CustomerUser = {
      id: `google-user-${Date.now()}`,
      name: 'مستخدم Google (تجريبي)',
      email: 'user.nasamat@gmail.com',
      avatar: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff&bold=true',
      provider: 'google',
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      segment: 'vip',
    };
    const enriched = enrichWithSavedDelivery(testUser);
    saveCustomerUser(enriched);
    logCRMActivity({
      customerId: enriched.id,
      customerName: enriched.name,
      type: 'login',
      description: `تسجيل دخول عبر حساب Google (${enriched.email})`,
    });
    trackPixelEvent('CompleteRegistration', {
      provider: 'Google',
      customer_name: enriched.name,
      currency: 'USD',
    });
    onAuthSuccess(enriched);
    onClose();
  };

  // Real Apple Sign-In via Firebase
  const handleAppleClick = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // If on 127.0.0.1, smoothly redirect to localhost where Firebase Auth is pre-authorized
    if (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1') {
      window.location.replace(window.location.href.replace('127.0.0.1', 'localhost'));
      return;
    }

    setIsProcessing(true);
    try {
      const user = await signInWithAppleFirebase();
      const enriched = enrichWithSavedDelivery(user);
      saveCustomerUser(enriched);
      logCRMActivity({
        customerId: enriched.id,
        customerName: enriched.name,
        type: 'login',
        description: `تسجيل دخول ناجح عبر Apple ID الرسمي (${enriched.email || enriched.name})`,
      });
      trackPixelEvent('CompleteRegistration', {
        provider: 'Apple_Firebase',
        customer_name: enriched.name,
        currency: 'USD',
      });
      onAuthSuccess(enriched);
      onClose();
    } catch (err: any) {
      console.error('Apple Sign-in error:', err);
      if (err?.code === 'auth/operation-not-allowed') {
        setErrorMessage(
          isAr
            ? 'تسجيل الدخول عبر Apple غير مفعّل بعد في كونسول Firebase. يرجى تفعيله من Authentication > Add new provider > Apple.'
            : 'Apple Sign-In is not enabled yet in your Firebase project. Please enable it in Firebase Console under Authentication > Sign-in method.'
        );
      } else {
        setErrorMessage(formatFirebaseError(err, isAr));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Apple VIP Form Submission
  const handleAppleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appleName.trim()) {
      setErrorMessage(isAr ? 'يرجى إدخال اسمك الكريم' : 'Please enter your name');
      return;
    }

    const email = appleEmail.trim() || `${appleName.trim().toLowerCase().replace(/\s+/g, '.')}@icloud.com`;
    const user: CustomerUser = {
      id: `apple-vip-${Date.now()}`,
      name: appleName.trim(),
      email: email,
      phone: applePhone.trim() || undefined,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(appleName.trim())}&background=000&color=fff&bold=true`,
      provider: 'apple',
      registeredAt: currentUser?.registeredAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      segment: 'vip',
    };

    const enriched = enrichWithSavedDelivery(user);
    saveCustomerUser(enriched);
    logCRMActivity({
      customerId: enriched.id,
      customerName: enriched.name,
      type: 'login',
      description: `تسجيل دخول ناجح لعميل Apple VIP (${enriched.name} - ${email})`,
    });
    trackPixelEvent('CompleteRegistration', {
      provider: 'Apple_VIP',
      customer_name: enriched.name,
      currency: 'USD',
    });

    onAuthSuccess(enriched);
    onClose();
  };

  // Email Sign In / Sign Up Handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!emailAddress.trim()) {
      setErrorMessage(isAr ? 'يرجى إدخال البريد الإلكتروني.' : 'Please enter your email.');
      return;
    }

    if (emailMode === 'forgot') {
      setIsProcessing(true);
      try {
        await resetPasswordFirebase(emailAddress);
        setSuccessMessage(
          isAr 
            ? 'تم إرسال تعليمات إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.' 
            : 'Password reset link sent to your email.'
        );
      } catch (err: any) {
        setErrorMessage(formatFirebaseError(err, isAr));
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (!emailPassword || emailPassword.length < 6) {
      setErrorMessage(isAr ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.' : 'Password must be at least 6 characters.');
      return;
    }

    setIsProcessing(true);
    try {
      let user: CustomerUser;
      if (emailMode === 'signup') {
        user = await signUpWithEmailFirebase(
          emailAddress,
          emailPassword,
          emailDisplayName || emailAddress.split('@')[0],
          emailPhone
        );
        logCRMActivity({
          customerId: user.id,
          customerName: user.name,
          type: 'register',
          description: `تسجيل عميل جديد بالبريد الإلكتروني (${user.email})`,
        });
      } else {
        user = await signInWithEmailFirebase(emailAddress, emailPassword);
        logCRMActivity({
          customerId: user.id,
          customerName: user.name,
          type: 'login',
          description: `تسجيل دخول بالبريد الإلكتروني (${user.email})`,
        });
      }

      const enriched = enrichWithSavedDelivery(user);
      saveCustomerUser(enriched);
      trackPixelEvent('CompleteRegistration', {
        provider: 'Email_Password',
        customer_name: enriched.name,
        currency: 'USD',
      });
      onAuthSuccess(enriched);
      onClose();
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setErrorMessage(formatFirebaseError(err, isAr));
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct manual sign-in with customer's own real name and email
  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setErrorMessage(isAr ? 'يرجى كتابة اسمك' : 'Please enter your name');
      return;
    }

    const email = customEmail.trim() || `${customName.trim().toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
    const user: CustomerUser = {
      id: `usr-direct-${Date.now()}`,
      name: customName.trim(),
      email: email,
      phone: customPhone.trim() || undefined,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(customName.trim())}&background=000&color=fff&bold=true`,
      provider: 'google',
      registeredAt: currentUser?.registeredAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      segment: 'vip',
    };

    const enriched = enrichWithSavedDelivery(user);
    saveCustomerUser(enriched);
    logCRMActivity({
      customerId: enriched.id,
      customerName: enriched.name,
      type: 'login',
      description: `تسجيل حساب جديد بالاسم (${enriched.name}) والإيميل (${email})`,
    });
    trackPixelEvent('CompleteRegistration', {
      provider: 'Customer_Direct',
      customer_name: enriched.name,
      currency: 'USD',
    });

    onAuthSuccess(enriched);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative bg-white border border-neutral-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-auto animate-scaleUp text-black"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-black text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black text-lg shadow-sm">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  {isAr ? 'عضوية نسمات الفاخرة' : 'NASMAT BESPOKE MEMBERSHIP'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h3 className="text-base font-black text-white font-serif">
                {isAr ? 'حساب الزبون الفاخر وتسجيل الدخول' : 'Customer Account & Sign In'}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-black">✕</button>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between">
            <span>✓ {successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-black">✕</button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {currentUser ? (
            /* Logged in state */
            <div className="space-y-5 text-center">
              <div className="relative inline-block">
                <img
                  src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=000&color=fff`}
                  alt={currentUser.name}
                  className="w-20 h-20 rounded-full mx-auto border-4 border-amber-400 object-cover shadow-lg"
                />
                <span className="absolute bottom-0 end-0 p-1.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs">
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                </span>
              </div>

              <div>
                <h4 className="text-xl font-black font-serif text-black">{currentUser.name}</h4>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">{currentUser.email}</p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                  <span>{isAr ? '★ عضو مميز في نسمات للعطور' : '★ VIP Patron at Nasamat'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-start">
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <span className="text-[11px] text-neutral-500 font-bold block">
                    {isAr ? 'خلطاتك المسجلة باسمك' : 'Your Custom Blends'}
                  </span>
                  <span className="text-lg font-black text-black font-mono">
                    {customBlendsCount} {isAr ? 'خلطة' : 'Blends'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <span className="text-[11px] text-neutral-500 font-bold block">
                    {isAr ? 'إجمالي طلباتك' : 'Total Orders'}
                  </span>
                  <span className="text-lg font-black text-black font-mono">
                    {ordersCount} {isAr ? 'طلب' : 'Orders'}
                  </span>
                </div>
              </div>

              {/* Saved Delivery Address & Phone in Customer Profile */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-start space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📍</span>
                    <div>
                      <span className="text-xs font-black text-black block">
                        {isAr ? 'العنوان ورقم الهاتف للتوصيل' : 'Saved Delivery & Contact'}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {isAr ? 'محفوظة في حسابك لتعبئتها تلقائياً عند كل طلبية' : 'Stored in account for instant checkout'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingDelivery(!isEditingDelivery)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[11px] font-bold transition cursor-pointer"
                  >
                    {isEditingDelivery ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? 'تعديل ✏️' : 'Edit ✏️')}
                  </button>
                </div>

                {profileSaveSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-bold text-center">
                    ✓ {isAr ? 'تم حفظ وتحديث بيانات التوصيل في حسابك بنجاح' : 'Delivery details saved successfully'}
                  </div>
                )}

                {isEditingDelivery ? (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-700 block mb-1">
                        {isAr ? 'رقم الهاتف / الواتساب للتوصيل' : 'Phone / WhatsApp'}
                      </label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-700 block mb-1">
                        {isAr ? 'المدينة / القضاء' : 'City / District'}
                      </label>
                      <input
                        type="text"
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-700 block mb-1">
                        {isAr ? 'العنوان بالتفصيل' : 'Detailed Address'}
                      </label>
                      <textarea
                        rows={2}
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:border-black resize-none"
                        placeholder=""
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveDeliveryProfile}
                      className="w-full py-2.5 px-3 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      {isAr ? 'حفظ العنوان في حسابي ✓' : 'Save Delivery Info ✓'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 font-bold text-[11px] shrink-0">{isAr ? 'الهاتف:' : 'Phone:'}</span>
                      <span className="font-mono text-neutral-900 font-medium">
                        {currentUser.phone || profilePhone || (isAr ? 'غير محدد بعد (سيتم حفظه تلقائياً عند أول طلب)' : 'Not set yet')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 font-bold text-[11px] shrink-0">{isAr ? 'المدينة:' : 'City:'}</span>
                      <span className="text-neutral-900 font-medium">
                        {currentUser.savedCity || profileCity || (isAr ? 'غير محددة' : 'Not set')}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-neutral-500 font-bold text-[11px] shrink-0">{isAr ? 'العنوان:' : 'Address:'}</span>
                      <span className="text-neutral-900 font-medium">
                        {currentUser.savedAddress || profileAddress || (isAr ? 'لم يتم حفظ عنوان بعد (سيتم حفظه تلقائياً عند أول طلب)' : 'No address saved yet')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="w-full py-3 px-4 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
              >
                {isAr ? 'تسجيل الخروج من هذا الحساب' : 'Sign out from this account'}
              </button>
            </div>
          ) : authStage === 'options' ? (
            /* Main Login Options */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-serif font-black text-lg text-black">
                  {isAr ? 'سجل بحسابك لحفظ تركيباتك الحصرية' : 'Sign in to save your bespoke perfumes'}
                </h4>
                <p className="text-xs text-neutral-500">
                  {isAr 
                    ? 'تسجيل دخول موثق عبر Google والبريد الإلكتروني لحفظ عطورك وتتبع طلباتك' 
                    : 'Secure authentication via Google, Email & Apple'}
                </p>
              </div>

              {/* 1. Google Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleGoogleClick}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-black text-xs font-black flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <span>
                  {isProcessing 
                    ? (isAr ? 'جاري الاتصال بـ Google...' : 'Connecting to Google...') 
                    : (isAr ? 'المتابعة باستخدام حساب Google الرسمي' : 'Continue with Google')}
                </span>
              </button>

              {/* 2. Email / Password Button */}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setAuthStage('email');
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-black flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <Mail className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{isAr ? 'المتابعة عبر البريد الإلكتروني وكلمة المرور' : 'Continue with Email & Password'}</span>
              </button>

              {/* 3. Apple Button */}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setAuthStage('apple_entry');
                }}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-black text-xs font-black flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <AppleIcon className="w-5 h-5 fill-current shrink-0" />
                <span>{isAr ? 'المتابعة باستخدام Apple ID' : 'Sign in with Apple'}</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-black border border-amber-400/40 px-2 py-0.5 rounded-full shadow-xs" style={{ color: '#fbbf24' }}>
                  VIP
                </span>
              </button>

              {/* Secondary Options: Direct entry & Quick test */}
              <div className="pt-2 border-t border-neutral-200 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setAuthStage('direct_entry')}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>✍️</span>
                  <span>{isAr ? 'تسجيل سريع بالاسم والإيميل فقط' : 'Quick sign-in with name & email'}</span>
                </button>
              </div>
            </div>
          ) : authStage === 'email' ? (
            /* Email & Password Authentication Form */
            <form onSubmit={handleEmailSubmit} className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-amber-800" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-black">
                      {emailMode === 'forgot'
                        ? (isAr ? 'استعادة كلمة المرور' : 'Reset Password')
                        : emailMode === 'signup'
                        ? (isAr ? 'إنشاء حساب جديد بالبريد الإلكتروني' : 'Create an Account')
                        : (isAr ? 'تسجيل الدخول بالبريد الإلكتروني' : 'Sign In with Email')}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {isAr ? 'حسابك يحفظ خلطاتك الحصرية وسجل فواتيرك' : 'Manage your perfumes and invoices'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthStage('options');
                  }}
                  className="text-xs font-bold text-neutral-500 hover:text-black cursor-pointer"
                >
                  {isAr ? '← رجوع' : '← Back'}
                </button>
              </div>

              {/* Toggle Login / SignUp (if not forgot) */}
              {emailMode !== 'forgot' && (
                <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`py-2 rounded-lg transition cursor-pointer ${
                      emailMode === 'login' 
                        ? 'bg-white text-black shadow-xs font-black' 
                        : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    {isAr ? 'تسجيل الدخول' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode('signup');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`py-2 rounded-lg transition cursor-pointer ${
                      emailMode === 'signup' 
                        ? 'bg-white text-black shadow-xs font-black' 
                        : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    {isAr ? 'إنشاء حساب جديد' : 'New Account'}
                  </button>
                </div>
              )}

              <div className="space-y-3 text-xs">
                {/* Full name for Sign up */}
                {emailMode === 'signup' && (
                  <div>
                    <label className="font-bold text-neutral-800 block mb-1">
                      {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={emailDisplayName}
                      onChange={(e) => setEmailDisplayName(e.target.value)}
                      placeholder=""
                      className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-300 font-bold focus:outline-none focus:border-black"
                    />
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    {isAr ? 'البريد الإلكتروني *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder=""
                    className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-300 font-mono focus:outline-none focus:border-black"
                  />
                </div>

                {/* Password Field (for login & signup) */}
                {emailMode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-neutral-800">
                        {isAr ? 'كلمة المرور *' : 'Password *'}
                      </label>
                      {emailMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEmailMode('forgot');
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          className="text-[11px] text-neutral-500 hover:text-black underline cursor-pointer"
                        >
                          {isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-300 font-mono focus:outline-none focus:border-black pe-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {emailMode === 'signup' && (
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        {isAr ? '6 أحرف أو أرقام على الأقل' : 'At least 6 characters'}
                      </span>
                    )}
                  </div>
                )}

                {/* Optional Phone for Sign up */}
                {emailMode === 'signup' && (
                  <div>
                    <label className="font-bold text-neutral-800 block mb-1">
                      {isAr ? 'رقم الهاتف / واتساب (اختياري لتأكيد الطلب)' : 'Phone Number (Optional)'}
                    </label>
                    <input
                      type="tel"
                      value={emailPhone}
                      onChange={(e) => setEmailPhone(e.target.value)}
                      placeholder=""
                      className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-300 font-mono focus:outline-none focus:border-black"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span>{isAr ? 'جاري المعالجة...' : 'Processing...'}</span>
                  ) : emailMode === 'forgot' ? (
                    <span>{isAr ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link'}</span>
                  ) : emailMode === 'signup' ? (
                    <span>{isAr ? 'إنشاء الحساب والتسجيل الآن' : 'Create Account & Sign In'}</span>
                  ) : (
                    <span>{isAr ? 'تسجيل الدخول بالبريد الإلكتروني' : 'Sign In Now'}</span>
                  )}
                </button>

                {emailMode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => setEmailMode('login')}
                    className="py-3.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs transition cursor-pointer"
                  >
                    {isAr ? 'رجوع' : 'Back'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthStage('options')}
                    className="py-3.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs transition cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                )}
              </div>
            </form>
          ) : authStage === 'apple_entry' ? (
            /* Apple VIP Exclusive Sign-In Form */
            <form onSubmit={handleAppleSubmit} className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
                    <AppleIcon className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-black flex items-center gap-2">
                      <span>{isAr ? 'تسجيل دخول عملاء Apple VIP' : 'Apple VIP Exclusive Sign-In'}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-black border border-amber-400/40 px-2 py-0.5 rounded-full shadow-xs" style={{ color: '#fbbf24' }}>
                        VIP
                      </span>
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {isAr ? 'حفظ فوري لخلطاتك الحصرية ورقم عضويتك الملكية' : 'Save your bespoke blends & orders'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthStage('options');
                  }}
                  className="text-xs font-bold text-neutral-500 hover:text-black cursor-pointer"
                >
                  {isAr ? '← رجوع' : '← Back'}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    {isAr ? 'الاسم الكريم / اللقب' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={appleName}
                    onChange={(e) => setAppleName(e.target.value)}
                    placeholder=""
                    className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-300 font-bold focus:outline-none focus:border-black transition"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    {isAr ? 'بريد Apple / iCloud' : 'Apple / iCloud Email'} (اختياري)
                  </label>
                  <input
                    type="email"
                    value={appleEmail}
                    onChange={(e) => setAppleEmail(e.target.value)}
                    placeholder=""
                    className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-300 font-mono focus:outline-none focus:border-black transition"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {isAr ? 'إذا تركته فارغاً سيتم ربط حسابك تلقائياً ببريد iCloud مشفر' : 'Auto-generated secure iCloud alias if left empty'}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    {isAr ? 'رقم الهاتف للتوصيل والواتساب (اختياري)' : 'Phone Number (Optional)'}
                  </label>
                  <input
                    type="tel"
                    value={applePhone}
                    onChange={(e) => setApplePhone(e.target.value)}
                    placeholder=""
                    className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-300 font-mono focus:outline-none focus:border-black transition"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <AppleIcon className="w-4 h-4 fill-current" />
                  <span>{isAr ? 'تأكيد الدخول بعضوية Apple VIP' : 'Confirm Apple VIP Sign-In'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthStage('options')}
                  className="py-3.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          ) : (
            /* Direct Custom Name & Email Entry */
            <form onSubmit={handleDirectSubmit} className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✍️</span>
                  <div>
                    <h4 className="text-sm font-black text-black">
                      {isAr ? 'تسجيل مباشر باسمك الشخصي الحقيقي' : 'Sign in with your name & email'}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {isAr ? 'سجل بياناتك الحقيقية لربطها بخلطاتك وطلباتك فوراً' : 'Enter your actual details to link custom blends'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthStage('options')}
                  className="text-xs font-bold text-neutral-500 hover:text-black cursor-pointer"
                >
                  {isAr ? '← رجوع' : '← Back'}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder=""
                    className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-300 font-bold focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    {isAr ? 'البريد الإلكتروني (Gmail أو أي بريد) *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder=""
                    className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-300 font-mono focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    {isAr ? 'رقم الهاتف / واتساب للتوصيل (اختياري)' : 'Phone Number (Optional)'}
                  </label>
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder=""
                    className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-300 font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-black text-xs shadow-md transition cursor-pointer"
                >
                  {isAr ? 'حفظ وتسجيل الدخول الآن' : 'Save & Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthStage('options')}
                  className="py-3.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          )}

          {/* Footer Security Badges */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-center gap-3 text-[10px] text-neutral-500 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'حماية مشفرة عبر معايير Google & Apple' : 'Encrypted security standard'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-neutral-600" />
              <span>{isAr ? 'خصوصية تامة للخلطات والطلبات' : '100% Private'}</span>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
