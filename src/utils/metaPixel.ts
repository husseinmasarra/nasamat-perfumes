// ============================================================================
// META PIXEL (FACEBOOK PIXEL) E-COMMERCE TRACKING SUITE
// Pixel ID: 2242721343793550 (Nasamat Perfumes)
// ============================================================================

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

/**
 * Safely call window.fbq if available
 */
export const trackFbq = (eventType: 'track' | 'trackCustom', eventName: string, params?: Record<string, any>) => {
  if (typeof window === 'undefined') return;

  try {
    // Check if test_event_code is present in URL (e.g. from Events Manager test tool)
    const urlParams = new URLSearchParams(window.location.search);
    const testCode = urlParams.get('test_event_code');
    const enrichedParams = { ...params };
    if (testCode && !enrichedParams.test_event_code) {
      enrichedParams.test_event_code = testCode;
    }

    if (typeof window.fbq === 'function') {
      if (enrichedParams && Object.keys(enrichedParams).length > 0) {
        window.fbq(eventType, eventName, enrichedParams);
      } else {
        window.fbq(eventType, eventName);
      }
      console.log(`[Meta Pixel] Tracked ${eventType}: ${eventName}`, enrichedParams);
    } else {
      console.debug(`[Meta Pixel] fbq not ready for: ${eventName}`);
    }
  } catch (err) {
    console.warn('[Meta Pixel] Tracking error:', err);
  }
};

/**
 * Standard E-Commerce Events
 */
export const MetaPixel = {
  // PageView
  pageView: (pageName?: string) => {
    trackFbq('track', 'PageView', pageName ? { page_name: pageName } : undefined);
  },

  // ViewContent - When customer views a perfume modal
  viewContent: (product: {
    id: string;
    name: string;
    price: number;
    currency?: string;
    category?: string;
    brand?: string;
  }) => {
    trackFbq('track', 'ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      content_category: product.category || 'Perfumes',
      value: product.price,
      currency: product.currency || 'USD',
      brand: product.brand || 'نسمات',
    });
  },

  // AddToCart - When customer adds a perfume bottle to the cart
  addToCart: (item: {
    id: string;
    name: string;
    price: number;
    size?: number | string;
    quantity?: number;
    currency?: string;
  }) => {
    trackFbq('track', 'AddToCart', {
      content_ids: [item.id],
      content_name: item.name,
      content_type: 'product',
      value: item.price * (item.quantity || 1),
      currency: item.currency || 'USD',
      size: item.size ? `${item.size}ml` : undefined,
      quantity: item.quantity || 1,
    });
  },

  // InitiateCheckout - When customer opens checkout drawer or starts placing order
  initiateCheckout: (cartTotal: number, itemCount: number, currency: string = 'USD') => {
    trackFbq('track', 'InitiateCheckout', {
      value: cartTotal,
      currency,
      num_items: itemCount,
      content_type: 'product',
    });
  },

  // Purchase - When order is confirmed (WhatsApp or Online Cash)
  purchase: (order: {
    orderId: string;
    total: number;
    currency?: string;
    itemCount: number;
  }) => {
    trackFbq('track', 'Purchase', {
      content_type: 'product',
      value: order.total,
      currency: order.currency || 'USD',
      num_items: order.itemCount,
      order_id: order.orderId,
    });
  },

  // Contact / Lead - When customer clicks WhatsApp Chat or Inquiry
  contact: (channel: 'whatsapp' | 'instagram' | 'phone') => {
    trackFbq('track', 'Contact', {
      channel,
      method: 'chat_inquiry',
    });
  },
};
