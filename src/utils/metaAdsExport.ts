import { CrmLeadRecord } from '../types';

/**
 * Meta Ads Custom Audience Exporter & Conversions API (CAPI) Integration
 * Formats data according to Meta Graph API and Ads Manager specs.
 */

/**
 * Normalizes Lebanese and international phone numbers into E.164 standard (+961...)
 */
export function normalizePhoneForMeta(rawPhone?: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  
  // If Lebanese local format (e.g. 03..., 70..., 71..., 76..., 78..., 79..., 81...)
  if (digits.startsWith('961')) {
    return `+${digits}`;
  }
  if (digits.length === 8 && (digits.startsWith('3') || digits.startsWith('7') || digits.startsWith('8'))) {
    return `+961${digits}`;
  }
  if (digits.length === 7 && digits.startsWith('1')) {
    return `+961${digits}`;
  }
  if (digits.startsWith('0')) {
    return `+961${digits.slice(1)}`;
  }
  return `+${digits}`;
}

/**
 * Exports leads list as a CSV compatible with Meta Ads Manager Custom Audiences
 * Columns: email, phone, fn, ln, ct, country, value, currency
 */
export function exportMetaCustomAudienceCsv(leads: CrmLeadRecord[], filename = 'nasamat-meta-custom-audience.csv') {
  const headers = ['email', 'phone', 'fn', 'ln', 'ct', 'country', 'value', 'currency'];

  const rows = leads.map((lead) => {
    const parts = (lead.name || '').trim().split(/\s+/);
    const fn = parts[0] || '';
    const ln = parts.slice(1).join(' ') || fn;
    const phone = normalizePhoneForMeta(lead.phone);
    const email = (lead.email || '').trim().toLowerCase();
    const city = (lead.city || 'Beirut').trim();
    const country = 'LB';
    const value = (lead.totalSpent || 0).toFixed(2);
    const currency = 'USD';

    return [
      `"${email}"`,
      `"${phone}"`,
      `"${fn.replace(/"/g, '""')}"`,
      `"${ln.replace(/"/g, '""')}"`,
      `"${city.replace(/"/g, '""')}"`,
      `"${country}"`,
      value,
      currency
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Fires a Meta Conversions API (CAPI) server-side event
 */
export async function sendMetaCapiEvent(
  pixelId: string,
  accessToken: string,
  eventName: 'Lead' | 'Purchase' | 'InitiateCheckout',
  lead: CrmLeadRecord,
  testEventCode?: string
): Promise<{ success: boolean; message: string; response?: any }> {
  if (!pixelId || !accessToken) {
    return {
      success: false,
      message: 'يرجى إدخال Meta Pixel ID و Access Token أولاً'
    };
  }

  const endpoint = `https://graph.facebook.com/v19.0/${pixelId.trim()}/events?access_token=${accessToken.trim()}`;

  const eventTime = Math.floor(Date.now() / 1000);
  const normalizedPhone = normalizePhoneForMeta(lead.phone);

  const payload: any = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime,
        action_source: 'website',
        event_source_url: window.location.href,
        user_data: {
          client_user_agent: navigator.userAgent,
          ...(lead.email ? { em: [lead.email.toLowerCase()] } : {}),
          ...(normalizedPhone ? { ph: [normalizedPhone.replace(/\+/g, '')] } : {}),
          ...(lead.city ? { ct: [lead.city.toLowerCase()] } : {}),
          country: ['lb']
        },
        custom_data: {
          currency: 'USD',
          value: lead.totalSpent || (eventName === 'Lead' ? 0 : 25),
          content_name: 'عطور نسمات الفاخرة',
          lead_source: lead.source,
          lead_id: lead.id
        }
      }
    ]
  };

  if (testEventCode?.trim()) {
    payload.test_event_code = testEventCode.trim();
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.events_received) {
      return {
        success: true,
        message: `تم إرسال حدث ${eventName} بنجاح إلى Meta Conversions API!`,
        response: data
      };
    } else {
      return {
        success: false,
        message: data.error?.message || 'فشل إرسال الحدث إلى Meta CAPI',
        response: data
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'خطأ في الاتصال بخوادم Meta Graph API'
    };
  }
}
