import type { TrackingPixelSettings } from '../types';
import { recordPixelEventLog } from './storage';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    gtag?: any;
    dataLayer?: any[];
  }
}

export type PixelStandardEvent = 
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'CompleteRegistration'
  | 'CustomBlendCreated'
  | 'Contact'
  | 'Lead'
  | 'Search';

export interface PixelEventPayload {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
  quantity?: number;
  order_id?: string;
  customer_name?: string;
  provider?: string;
  [key: string]: any;
}

let currentSettings: TrackingPixelSettings | null = null;
let isMetaInitialized = false;
let isTikTokInitialized = false;
let isGoogleInitialized = false;

/**
 * Initializes or updates tracking pixels based on AppSettings
 */
export function initPixels(settings?: TrackingPixelSettings) {
  const metaPixelId = (settings?.metaPixelId && settings.metaPixelId.trim()) || '2242721343793550';
  currentSettings = {
    metaPixelId,
    isMetaPixelEnabled: true,
    ...(settings || {}),
  };

  // 1. Meta Pixel (Facebook & Instagram)
  if (!isMetaInitialized) {
    try {
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      if (window.fbq) {
        window.fbq('init', metaPixelId);
        window.fbq('track', 'PageView');
        isMetaInitialized = true;
      }
    } catch (e) {
      console.warn('Meta Pixel initialization skipped (offline/adblock):', e);
    }
  }

  // 2. TikTok Pixel
  if (settings.isTiktokPixelEnabled && settings.tiktokPixelId && !isTikTokInitialized) {
    try {
      (function (w: any, d: any, t: any) {
        w.TiktokAnalyticsObject = t;
        const ttq = (w[t] = w[t] || []);
        ttq.methods = [
          'page',
          'track',
          'identify',
          'instances',
          'debug',
          'on',
          'off',
          'once',
          'ready',
          'alias',
          'group',
          'enableCookie',
          'disableCookie',
        ];
        ttq.setAndDefer = function (t: any, e: any) {
          t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (t: any) {
          const e = ttq._i[t] || [];
          for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
          return e;
        };
        ttq.load = function (e: any, n: any) {
          const i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
          ttq._i = ttq._i || {};
          ttq._i[e] = [];
          ttq._i[e]._u = i;
          ttq._t = ttq._t || {};
          ttq._t[e] = +new Date();
          ttq._o = ttq._o || {};
          ttq._o[e] = n || {};
          const o = document.createElement('script');
          o.type = 'text/javascript';
          o.async = !0;
          o.src = i + '?sdkid=' + e + '&lib=' + t;
          const a = document.getElementsByTagName('script')[0];
          a.parentNode?.insertBefore(o, a);
        };

        ttq.load(settings.tiktokPixelId.trim());
        ttq.page();
        isTikTokInitialized = true;
      })(window, document, 'ttq');
    } catch (e) {
      console.warn('TikTok Pixel initialization skipped (offline/adblock):', e);
    }
  }

  // 3. Google Tag (GA4 / Google Ads)
  if (settings.isGoogleTagEnabled && settings.googleTagId && !isGoogleInitialized) {
    try {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.googleTagId.trim()}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer?.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', settings.googleTagId.trim());
      isGoogleInitialized = true;
    } catch (e) {
      console.warn('Google Tag initialization skipped (offline/adblock):', e);
    }
  }
}

/**
 * Universal Event Dispatcher for all active tracking pixels
 */
export function trackPixelEvent(eventName: PixelStandardEvent, payload: PixelEventPayload = {}) {
  // Always log to internal diagnostic memory so merchant sees live conversion events
  recordPixelEventLog(eventName, payload);

  // Meta Pixel (Always fire if fbq exists)
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      let metaPayload = { ...payload };
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const testCode = searchParams.get('test_event_code') || searchParams.get('fb_test_event_code');
        if (testCode) {
          metaPayload.test_event_code = testCode;
        }
      } catch (_) {}
      window.fbq('track', eventName, metaPayload);
    } catch (_) {}
  }

  // TikTok Pixel
  if (window.ttq && currentSettings?.isTiktokPixelEnabled) {
    try {
      // Map standard event names for TikTok if needed
      const ttEvent = eventName === 'Purchase' ? 'CompletePayment' : eventName;
      window.ttq.track(ttEvent, payload);
    } catch (_) {}
  }

  // Google Tag
  if (window.gtag && currentSettings?.isGoogleTagEnabled) {
    try {
      window.gtag('event', eventName, payload);
    } catch (_) {}
  }

  // Debug visual output if test mode is enabled
  if (currentSettings?.pixelTestMode || !currentSettings) {
    console.log(`%c[NASAMAT PIXEL] Event: ${eventName}`, 'color: #10b981; font-weight: bold;', payload);
  }
}
