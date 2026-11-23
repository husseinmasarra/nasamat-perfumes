/**
 * WhatsApp VIP Concierge & Customer Care Engine
 * Nasamat Haute Parfumerie
 */

import type { Invoice } from '../types';

export type WhatsAppVIPActionType = 'compounding' | 'delivery' | 'satisfaction' | 'receipt';

export const OFFICIAL_SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/nasamat.purfume/',
  facebook: 'https://www.facebook.com/profile.php?id=61596789873419',
  whatsapp: '96181713408',
};

/**
 * Normalizes and formats social media URLs (Instagram, Facebook) so they ALWAYS
 * open cleanly on mobile phones (iOS & Android) and desktop.
 * - Handles empty values by falling back to official accounts.
 * - Removes leading '@' handles and builds absolute https:// URLs.
 * - Ensures native apps (Instagram / Facebook) or browser tabs open without relative-path bugs.
 */
export function formatSocialUrl(url: string | undefined | null, platform: 'instagram' | 'facebook'): string {
  if (!url || !url.trim()) {
    return OFFICIAL_SOCIAL_LINKS[platform];
  }
  let clean = url.trim();

  // If user only typed @handle or handle
  if (platform === 'instagram') {
    if (clean.startsWith('@')) clean = clean.slice(1);
    if (!clean.includes('instagram.com')) {
      return `https://www.instagram.com/${clean}/`;
    }
  } else if (platform === 'facebook') {
    if (clean.startsWith('@')) clean = clean.slice(1);
    if (!clean.includes('facebook.com')) {
      return `https://www.facebook.com/${clean}`;
    }
  }

  // Prepend https:// if protocol is missing
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }

  return clean;
}

export interface WhatsAppVIPOrderData {
  customerName: string;
  customerPhone: string;
  invoiceNumber: string;
  totalAmount: number;
  totalAmountLbp?: number;
  customerAddress?: string;
  customerCity?: string;
  itemsSummary?: string;
  storeName?: string;
}

/**
 * Formats a phone number for direct wa.me URLs.
 * Automatically handles Lebanese formats (e.g. 81713408, 03123456, 70000000) and international (+961...)
 */
export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '96170000000';
  let digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '96170000000';

  if (digits.startsWith('00961')) {
    digits = digits.slice(5);
  } else if (digits.startsWith('961')) {
    digits = digits.slice(3);
  }

  // Strip leading 0 if present (e.g. 03123456 -> 3123456, 081713408 -> 81713408)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Prepend Lebanon international dialing code (961)
  return `961${digits}`;
}

/**
 * Formats a phone number for human-readable luxury display (e.g. +961 81 713 408)
 */
export function formatDisplayPhone(phone?: string): string {
  const formatted = formatWhatsAppPhone(phone);
  if (formatted.startsWith('961')) {
    const local = formatted.slice(3);
    if (local.length === 8) {
      return `+961 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
    } else if (local.length === 7) {
      return `+961 ${local.slice(0, 1)} ${local.slice(1, 4)} ${local.slice(4)}`;
    }
  }
  return phone || '+961 70 000 000';
}

export function formatWhatsAppVIPMessage(
  type: WhatsAppVIPActionType,
  data: WhatsAppVIPOrderData
): string {
  const store = data.storeName || 'نسمات للعطور الفاخرة';
  const name = data.customerName.trim() || 'عميلنا العزيز';
  const inv = data.invoiceNumber;
  const total = `$${data.totalAmount.toFixed(2)}`;
  const totalLbp = data.totalAmountLbp ? ` (${data.totalAmountLbp.toLocaleString()} ل.ل)` : '';
  const address = [data.customerCity, data.customerAddress].filter(Boolean).join(' - ') || 'عنوانكم الكريم';
  const items = data.itemsSummary ? `\n📦 *محتويات الطلبية:* ${data.itemsSummary}` : '';

  switch (type) {
    case 'compounding':
      return `مرحباً بك أستاذ(ة) *${name}*
تحية عطرة من *${store}*،

نود إعلامكم بأن طلبيتكم رقم *(${inv})* قد تم استلامها، وجارٍ الآن صياغة وتركيب عطوركم الملكية يدوياً داخل مختبرنا في بيروت بتركيز *إكستري دو بارفان (Extrait de Parfum)* لضمان أقصى درجات الثبات والفوحان الفاخر.${items}

سنوافيكم بإشعار التوصيل فور اكتمال التعتيق والتغليف الملكي.`;

    case 'delivery':
      return `مرحباً بك أستاذ(ة) *${name}*
تحية طيبة من *${store}*،

عطوركم الفاخرة أصبحت جاهزة وانطلقت الآن مع مندوب التوصيل في طريقها إليكم!
🏠 *العنوان:* ${address}
📄 *رقم الطلبية:* ${inv}
💵 *المبلغ المطلوب عند الاستلام:* *${total}*${totalLbp}${items}

يرجى إبقاء خطكم متاحاً للتنسيق مع مندوب التوصيل. نتمنى لكم تجربة عطرية ساحرة.`;

    case 'satisfaction':
      return `مرحباً بك أستاذ(ة) *${name}*
نسعد دائماً بخدمتكم في *${store}*،

نأمل أن تكون قد استمتعت بنفحات عطوركم الملكية ووصلتكم بأفضل حال! 
يهمنا جداً معرفة انطباعكم الكريم عن:
⭐ *درجة ثبات وفوحان العطر*
⭐ *سرعة وجودة التوصيل*

رأيكم تاج نعتز به دائماً، ويسعدنا دائماً إعادة تركيب خلطاتكم المفضلة في أي وقت.`;

    case 'receipt':
      return `*إيصال وفاتورة رسمية من ${store}*
---------------------------------
👤 *العميل:* ${name}
📄 *رقم الفاتورة:* ${inv}
🏠 *العنوان:* ${address}${items}
---------------------------------
💰 *الإجمالي المطلوب:* *${total}*${totalLbp}
✅ *الحالة:* تم التأكيد والتوصيل بالضمان الذهبي لنقاء الزيوت 100%.

شكراً لاختياركم نسمات للعطور الملكية.`;

    default:
      return `مرحباً ${name}، نتواصل معكم بخصوص طلبيتكم رقم ${inv} من ${store}.`;
  }
}

export function openWhatsAppVIP(
  type: WhatsAppVIPActionType,
  data: WhatsAppVIPOrderData
): void {
  const cleanPhone = formatWhatsAppPhone(data.customerPhone);
  if (!cleanPhone || cleanPhone === '96170000000') {
    alert('رقم هاتف الزبون غير مسجل أو غير صالح للتواصل عبر واتساب.');
    return;
  }
  const text = formatWhatsAppVIPMessage(type, data);
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function getOrderDataFromInvoice(invoice: Invoice, lbpRate = 90000, storeName?: string): WhatsAppVIPOrderData {
  const itemsSummary = (invoice.items || [])
    .map((it) => `${it.name}${it.bottleCapacityMl ? ` (${it.bottleCapacityMl}ml)` : ''} × ${it.sizeOrQty}`)
    .join('، ');

  return {
    customerName: invoice.partyName || 'عميلنا العزيز',
    customerPhone: invoice.partyPhone || '',
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: invoice.totalAmount,
    totalAmountLbp: Math.round(invoice.totalAmount * lbpRate),
    customerAddress: invoice.notes?.includes('العنوان:') 
      ? invoice.notes.split('العنوان:')[1]?.split('\n')[0]?.trim() 
      : '',
    itemsSummary,
    storeName,
  };
}
