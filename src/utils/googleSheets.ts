/**
 * Google Sheets CRM & Inventory Integration Engine
 * Provides direct export, clipboard copying for Sheet pasting (Ctrl+V),
 * Google Apps Script Webhook live sync, and Sheet embedding.
 */

export interface CRMCustomerExportItem {
  name: string;
  phone?: string;
  email?: string;
  segment?: string;
  ordersCount: number;
  totalSpent: number;
  aov?: number;
  lastOrderDate?: string;
  blendsCount?: number;
  blendsNames?: string;
  notes?: string;
  registeredVia?: string;
}

/**
 * Downloads a structured CSV file pre-formatted with UTF-8 BOM
 * for instant 100% Arabic-compatible opening in Google Sheets / Excel.
 */
export function exportCrmToGoogleSheetsCsv(customers: CRMCustomerExportItem[], filename = 'nasamat-crm-customers.csv') {
  const headers = [
    'اسم الزبون',
    'رقم الهاتف / واتساب',
    'البريد الإلكتروني',
    'طريقة التسجيل',
    'تصنيف الزبون',
    'إجمالي عدد الطلبات',
    'إجمالي الإنفاق ($)',
    'متوسط قيمة السلة ($)',
    'تاريخ آخر طلبية',
    'عدد الخلطات المسجلة',
    'تفاصيل الخلطات الخاصة',
    'ملاحظات التاجر CRM',
    'تاريخ التصدير'
  ];

  const formatCell = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const clean = String(val).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = customers.map((c) => [
    c.name,
    c.phone || '',
    c.email || '',
    c.registeredVia || (c.email?.includes('gmail') ? 'Google' : c.email?.includes('icloud') ? 'Apple' : 'مباشر'),
    c.segment === 'vip' ? '👑 كبار الشخصيات VIP' :
      c.segment === 'connoisseur' ? '🧪 مصمم خلطات خاصة' :
      c.segment === 'regular' ? '⭐ زبون دائم' : '🆕 زبون جديد',
    c.ordersCount || 0,
    `$${(c.totalSpent || 0).toFixed(2)}`,
    `$${c.ordersCount ? (c.totalSpent / c.ordersCount).toFixed(2) : (c.totalSpent || 0).toFixed(2)}`,
    c.lastOrderDate || '—',
    c.blendsCount || 0,
    c.blendsNames || '—',
    c.notes || '',
    new Date().toLocaleDateString('ar-LB')
  ]);

  const csvContent = [
    headers.map(formatCell).join(','),
    ...rows.map((row) => row.map(formatCell).join(','))
  ].join('\r\n');

  // Prepend UTF-8 BOM (\uFEFF) to guarantee Arabic text displays flawlessly in Google Sheets and Excel
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
 * Copies the CRM customer table as Tab-Separated Values (TSV) to clipboard.
 * Allows the user to simply open any Google Sheet, click cell A1, and press Ctrl+V
 * to instantly populate all headers and customer data!
 */
export async function copyCrmForGoogleSheets(customers: CRMCustomerExportItem[]): Promise<boolean> {
  const headers = [
    'اسم الزبون',
    'رقم الهاتف',
    'البريد الإلكتروني',
    'التصنيف',
    'الطلبات',
    'الإنفاق ($)',
    'متوسط السلة ($)',
    'آخر طلب',
    'عدد الخلطات',
    'الخلطات الخاصة',
    'ملاحظات التاجر CRM'
  ];

  const rows = customers.map((c) => [
    c.name,
    c.phone || '',
    c.email || '',
    c.segment === 'vip' ? 'VIP 👑' : c.segment === 'connoisseur' ? 'خلطات 🧪' : c.segment === 'regular' ? 'دائم ⭐' : 'جديد 🆕',
    c.ordersCount || 0,
    (c.totalSpent || 0).toFixed(2),
    c.ordersCount ? (c.totalSpent / c.ordersCount).toFixed(2) : '0.00',
    c.lastOrderDate || '—',
    c.blendsCount || 0,
    (c.blendsNames || '—').replace(/[\r\n\t]/g, ' '),
    (c.notes || '').replace(/[\r\n\t]/g, ' ')
  ]);

  const tsv = [
    headers.join('\t'),
    ...rows.map((r) => r.join('\t'))
  ].join('\n');

  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch (e) {
    console.error('Clipboard copy failed', e);
    return false;
  }
}

/**
 * Sends customer data payload to a Google Apps Script Webhook.
 * Uses text/plain to avoid CORS preflight issues with Google Apps Script.
 */
export async function syncCustomersToGoogleSheetWebhook(
  webhookUrl: string,
  customers: CRMCustomerExportItem[]
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'يرجى إدخال رابط Webhook صالح لـ Google Apps Script' };
  }

  try {
    const payload = {
      action: 'sync_customers',
      store: 'نَسَمَات للعطور الفاخرة',
      timestamp: new Date().toISOString(),
      count: customers.length,
      customers: customers.map((c) => ({
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        segment: c.segment || 'regular',
        ordersCount: c.ordersCount || 0,
        totalSpent: c.totalSpent || 0,
        aov: c.ordersCount ? Number((c.totalSpent / c.ordersCount).toFixed(2)) : 0,
        lastOrderDate: c.lastOrderDate || '',
        blendsCount: c.blendsCount || 0,
        blendsNames: c.blendsNames || '',
        notes: c.notes || ''
      }))
    };

    // Google Apps Script requires simple POST without custom headers or mode: no-cors
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Apps Script web apps respond with redirect 302
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      message: `تم إرسال ومزامنة ${customers.length} زبون إلى Google Sheet بنجاح ✅`
    };
  } catch (error: any) {
    console.error('Google Sheet sync error:', error);
    return {
      success: false,
      message: error?.message || 'حدث خطأ أثناء الاتصال بـ Google Sheet'
    };
  }
}

/**
 * Data format for real-time single order syncing to Google Sheet webhook
 */
export interface SingleOrderWebhookItem {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  customerAddress?: string;
  itemsDescription: string;
  subtotal: number;
  deliveryFee: number;
  totalUsd: number;
  totalLbp: number;
  notes?: string;
  paymentMethod?: string;
  date?: string;
}

/**
 * Sends a single placed order immediately to the Google Apps Script Webhook
 * so it appears in the store owner's Google Sheet in real time.
 */
export async function syncSingleOrderToGoogleSheetWebhook(
  webhookUrl: string,
  order: SingleOrderWebhookItem
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'رابط Webhook غير مضبوط' };
  }

  try {
    const payload = {
      action: 'new_order',
      store: 'نَسَمَات للعطور الفاخرة',
      timestamp: new Date().toISOString(),
      order
    };

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      message: `تم إرسال الطلب ${order.orderNumber} إلى Google Sheet بنجاح ✅`
    };
  } catch (error: any) {
    console.error('Google Sheet single order sync error:', error);
    return {
      success: false,
      message: error?.message || 'حدث خطأ أثناء إرسال الطلب'
    };
  }
}

/**
 * Converts a standard Google Sheet sharing URL into an embeddable preview URL
 */
export function getGoogleSheetEmbedUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // If it's a standard edit URL: https://docs.google.com/spreadsheets/d/KEY/edit...
  // Convert to preview: https://docs.google.com/spreadsheets/d/KEY/preview
  if (url.includes('/edit')) {
    return url.replace(/\/edit.*$/, '/preview');
  }
  return url;
}

/**
 * Ready-to-use Google Apps Script template for store owner to paste into
 * Extensions > Apps Script inside their Google Sheet
 */
export const GOOGLE_SHEET_APPS_SCRIPT_TEMPLATE = `// ========================================================
// نظام مزامنة متجر نسمات للعطور مع Google Sheets (v2.0)
// يستقبل تلقائياً:
// 1. الطلبيات الجديدة فور إتمام الزبون للطلب من هاتفه.
// 2. تحديثات قاعدة الزبائن والـ CRM.
//
// طريقة التفعيل:
// 1. افتح جدول Google جديد (أو جدولك الحالي).
// 2. من القائمة العلوية اضغط: Extensions (الإضافات) > Apps Script.
// 3. احذف أي كود موجود والصق هذا الكود كاملاً بدلاً منه.
// 4. اضغط Deploy (نشر) > New deployment (نشر جديد).
// 5. اختر النوع: Web app (تطبيق ويب).
// 6. اختر: Who has access -> Anyone (أي شخص).
// 7. انسخ رابط الويب Web App URL والصقه في لوحة تحكم نسمات!
// ========================================================

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ----------------------------------------------------
    // الحالة الأولى: طلبية جديدة فورية (Real-time Live Order)
    // ----------------------------------------------------
    if (data.action === "new_order" && data.order) {
      var ordSheet = ss.getSheetByName("الطلبيات (Orders)");
      if (!ordSheet) {
        ordSheet = ss.insertSheet("الطلبيات (Orders)");
      }
      ordSheet.setRightToLeft(true);

      // إنشاء الترويسة إذا كانت الورقة جديدة
      if (ordSheet.getLastRow() === 0) {
        ordSheet.appendRow([
          "رقم الطلب",
          "تاريخ ووقت الطلب",
          "اسم الزبون",
          "رقم الهاتف / واتساب",
          "المدينة / المنطقة",
          "العنوان التفصيلي",
          "الأصناف المطلوبة",
          "المجموع الجزئي ($)",
          "كلفة التوصيل ($)",
          "الإجمالي النهائي ($)",
          "المعادل (ليرة لبنانية)",
          "طريقة الدفع",
          "ملاحظات الزبون",
          "حالة الطلب"
        ]);
        var header = ordSheet.getRange(1, 1, 1, 14);
        header.setBackground("#0f172a");
        header.setFontColor("#f8fafc");
        header.setFontWeight("bold");
        header.setHorizontalAlignment("center");
        ordSheet.setFrozenRows(1);
      }

      var o = data.order;
      // إدراج الطلب الجديد في الصف الثاني (ليظهر أولاً دائماً)
      ordSheet.insertRowBefore(2);
      var newRow = [
        o.orderNumber || "",
        o.date || new Date().toLocaleString("ar-LB"),
        o.customerName || "",
        o.customerPhone || "",
        o.customerCity || "",
        o.customerAddress || "",
        o.itemsDescription || "",
        o.subtotal || 0,
        o.deliveryFee || 0,
        o.totalUsd || 0,
        o.totalLbp ? o.totalLbp.toLocaleString() : "",
        o.paymentMethod || "الدفع عند الاستلام",
        o.notes || "",
        "طلب جديد (قيد المراجعة)"
      ];
      ordSheet.getRange(2, 1, 1, 14).setValues([newRow]);
      ordSheet.getRange(2, 1, 1, 14).setHorizontalAlignment("center");
      ordSheet.getRange(2, 7).setHorizontalAlignment("right"); // الأصناف

      return ContentService.createTextOutput(JSON.stringify({ status: "success", type: "new_order", orderNumber: o.orderNumber }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ----------------------------------------------------
    // الحالة الثانية: مزامنة وتحديث قاعدة الزبائن (CRM)
    // ----------------------------------------------------
    if (data.customers && data.customers.length > 0) {
      var crmSheet = ss.getSheetByName("الزبائن (CRM)");
      if (!crmSheet) {
        crmSheet = ss.insertSheet("الزبائن (CRM)");
      }
      crmSheet.setRightToLeft(true);

      if (crmSheet.getLastRow() === 0) {
        crmSheet.appendRow([
          "اسم الزبون",
          "رقم الهاتف / واتساب",
          "البريد الإلكتروني",
          "التصنيف",
          "إجمالي الطلبات",
          "إجمالي المشتريات ($)",
          "متوسط السلة ($)",
          "آخر طلبية",
          "عدد الخلطات",
          "الخلطات المسجلة",
          "ملاحظات التاجر (CRM)",
          "تاريخ آخر مزامنة"
        ]);
        var crmHeader = crmSheet.getRange(1, 1, 1, 12);
        crmHeader.setBackground("#0f172a");
        crmHeader.setFontColor("#f8fafc");
        crmHeader.setFontWeight("bold");
        crmHeader.setHorizontalAlignment("center");
        crmSheet.setFrozenRows(1);
      }

      // مسح البيانات القديمة وكتابة القائمة الحديثة
      if (crmSheet.getLastRow() > 1) {
        crmSheet.deleteRows(2, crmSheet.getLastRow() - 1);
      }

      var rows = [];
      for (var i = 0; i < data.customers.length; i++) {
        var c = data.customers[i];
        rows.push([
          c.name,
          c.phone,
          c.email,
          c.segment,
          c.ordersCount,
          c.totalSpent,
          c.aov,
          c.lastOrderDate,
          c.blendsCount,
          c.blendsNames,
          c.notes,
          new Date().toLocaleString("ar-LB")
        ]);
      }

      if (rows.length > 0) {
        crmSheet.getRange(2, 1, rows.length, 12).setValues(rows);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", type: "crm_sync", count: data.customers.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "ignored", message: "No action performed" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
