import React, { useState, useEffect } from 'react';
import { X, Sparkles, Download, CheckCircle2 } from './icons';
import { useLanguage } from '../context/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showToastBanner, setShowToastBanner] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if already running as installed standalone app
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for beforeinstallprompt event (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user dismissed recently
      const dismissedUntil = localStorage.getItem('nasamat_pwa_dismissed_until');
      if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
        setShowToastBanner(true);
      }
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowToastBanner(false);
      setShowModal(false);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    // Global custom event trigger from any button (e.g. Drawer, Header, Footer)
    const handleManualTrigger = () => {
      handleOpenInstall();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('nasamat_open_pwa_install', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('nasamat_open_pwa_install', handleManualTrigger);
    };
  }, []);

  const handleOpenInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowToastBanner(false);
        }
      });
    } else {
      // Show instructional walkthrough modal
      setShowModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowToastBanner(false);
    // Dismiss for 3 days
    localStorage.setItem('nasamat_pwa_dismissed_until', String(Date.now() + 3 * 24 * 60 * 60 * 1000));
  };

  if (isStandalone) return null;

  return (
    <>
      {/* 1. Subtle Floating Install Bottom Banner (First-time visitors) */}
      {showToastBanner && !showModal && (
        <div className="fixed bottom-20 start-4 end-4 sm:start-auto sm:end-6 sm:bottom-6 z-40 max-w-sm bg-neutral-950 text-white p-3.5 rounded-2xl border border-amber-500/35 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-400/40 shrink-0 bg-black p-0.5">
              <img src="/logo.png" alt="Nasamat" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-amber-400 truncate">
                {isAr ? 'تثبيت تطبيق نسمات' : 'Install Nasamat App'}
              </h4>
              <p className="text-[10px] text-neutral-300 truncate">
                {isAr ? 'وصول فوري من سطح المكتب أو الهاتف' : 'Instant desktop & mobile access'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenInstall}
              className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-extrabold text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تثبيت' : 'Install'}</span>
            </button>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="p-1 rounded-lg text-neutral-400 hover:text-white transition cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Success Toast if installed */}
      {installedSuccess && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-emerald-200 border border-emerald-500/50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">
            {isAr ? 'تم تثبيت تطبيق نسمات بنجاح على جهازك! ✦' : 'Nasamat App successfully installed on your device! ✦'}
          </span>
        </div>
      )}

      {/* 3. Instructional Walkthrough Modal for iOS & Browsers */}
      {showModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-neutral-950 text-white w-full max-w-md rounded-3xl border border-amber-500/35 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-start"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-amber-400/40 bg-black p-0.5 shadow-md">
                  <img src="/logo.png" alt="Nasamat Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-amber-400">
                    {isAr ? 'تثبيت تطبيق نسمات على جهازك' : 'Install Nasamat on Your Device'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    {isAr ? 'يعمل كأي تطبيق أصلي على سطح المكتب والشاشة الرئيسية' : 'Runs like a native app with zero browser bars'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instructions based on device */}
            {isIos ? (
              <div className="space-y-3.5 text-xs text-neutral-300">
                <p className="font-bold text-amber-300">
                  {isAr ? 'طريقة التثبيت على أجهزة iPhone / iPad عبر سفاري:' : 'Installation on iPhone / iPad via Safari:'}
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                    <p className="leading-relaxed">
                      {isAr ? 'اضغط على زر المشاركة (Share) أسفل متصفح سفاري' : 'Tap the Share button at the bottom of Safari'} 
                      <span className="inline-block mx-1 font-bold text-white">⎋</span>
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                    <p className="leading-relaxed">
                      {isAr ? 'مرر للأسفل واختر "إضافة إلى الشاشة الرئيسية"' : 'Scroll down and tap "Add to Home Screen"'} 
                      <span className="inline-block mx-1 font-bold text-white">⊞</span>
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                    <p className="leading-relaxed">
                      {isAr ? 'اضغط "إضافة (Add)" في أعلى اليمين، وسيظهر التطبيق فوراً على شاشتك!' : 'Tap "Add" in the top right, and the icon appears on your home screen!'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs text-neutral-300">
                <p className="font-bold text-amber-300">
                  {isAr ? 'طريقة التثبيت على الكمبيوتر (Windows / Mac / Chrome / Edge):' : 'Installation on Desktop (Windows / Mac / Chrome / Edge):'}
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                    <p className="leading-relaxed">
                      {isAr 
                        ? 'انقر على أيقونة التثبيت ⊕ أو الكمبيوتر الصغيرة الموجودة في شريط العنوان (URL Bar) أعلى المتصفح.' 
                        : 'Click the install icon ⊕ in your browser address bar at the top.'}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                    <p className="leading-relaxed">
                      {isAr 
                        ? 'أو اضغط على قائمة المتصفح (⋮) ثم اختر "تثبيت تطبيق نسمات (Install App)".' 
                        : 'Or click the browser menu (⋮) and select "Install Nasamat App".'}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                    <p className="leading-relaxed">
                      {isAr 
                        ? 'سيتم وضع أيقونة نسمات على سطح المكتب وقائمة ابدأ وتفتح كنافذة مستقلة فائقة السرعة!' 
                        : 'A desktop shortcut will be created, launching full-screen with maximum speed!'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition cursor-pointer shadow-md"
              >
                {isAr ? 'حسناً، سأقوم بالتثبيت الآن' : 'Got it, Install Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Helper to dispatch install prompt from any button across the app
 */
export function triggerPwaInstall() {
  window.dispatchEvent(new CustomEvent('nasamat_open_pwa_install'));
}
