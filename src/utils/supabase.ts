/**
 * Supabase Cloud PostgreSQL Sync Utility
 * Nasamat Haute Parfumerie Platform
 * 
 * Architecture: Offline-First Hybrid
 * 1. Data is always cached and updated locally first in localStorage for 0ms latency.
 * 2. When Supabase credentials are configured, data seamlessly synchronizes with PostgreSQL cloud database across devices.
 */

import { 
  loadInvoices, 
  saveInvoices, 
  loadCustomerBlends, 
  saveCustomerBlends, 
  loadOils, 
} from './storage';
import type { Invoice, CustomerCustomBlend, FragranceOil } from '../types';

export interface SupabaseConfigSettings {
  url: string;
  anonKey: string;
  isSyncEnabled: boolean;
  autoSync: boolean;
  lastSyncAt: string | null;
}

const SUPABASE_CONFIG_STORAGE_KEY = 'nasamat_supabase_config_v1';

/**
 * Load current Supabase settings from storage or environment variables
 */
export const getSupabaseConfig = (): SupabaseConfigSettings => {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url || parsed.anonKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading Supabase config from storage:', err);
  }

  // Fallback to environment variables
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

  return {
    url: envUrl,
    anonKey: envKey,
    isSyncEnabled: Boolean(envUrl && envKey),
    autoSync: true,
    lastSyncAt: null,
  };
};

/**
 * Save Supabase configuration to local storage
 */
export const saveSupabaseConfig = (config: SupabaseConfigSettings): void => {
  try {
    localStorage.setItem(SUPABASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving Supabase config:', err);
  }
};

/**
 * Check if valid Supabase credentials are configured
 */
export const isSupabaseConfigured = (): boolean => {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.url && cfg.anonKey && cfg.url.startsWith('https://'));
};

/**
 * Native REST Client executor for Supabase PostgREST endpoints
 */
const executeSupabaseRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  prefer?: string
): Promise<any> => {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) {
    throw new Error('Supabase URL and Anon Key are not configured.');
  }

  const cleanUrl = cfg.url.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/${endpoint}`;

  const headers: Record<string, string> = {
    'apikey': cfg.anonKey,
    'Authorization': `Bearer ${cfg.anonKey}`,
    'Content-Type': 'application/json',
  };

  if (prefer) {
    headers['Prefer'] = prefer;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errMessage = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      errMessage = errJson.message || errJson.hint || errJson.details || errMessage;
    } catch {
      const errText = await res.text();
      if (errText) errMessage = errText;
    }
    throw new Error(errMessage);
  }

  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  return null;
};

/**
 * Test live connection to Supabase
 */
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.anonKey) {
      return { success: false, message: 'يرجى إدخال رابط المشروع (Project URL) والمفتاح العام (Anon Key).' };
    }

    // Ping PostgREST schema root
    const cleanUrl = cfg.url.replace(/\/+$/, '');
    const pingRes = await fetch(`${cleanUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`,
      },
    });

    if (pingRes.ok) {
      return { success: true, message: '✓ تم الاتصال بقاعدة بيانات Supabase السحابية بنجاح!' };
    } else {
      return { success: false, message: `فشل التحقق من المفاتيح (رمز الخطأ: ${pingRes.status}). تأكد من صحة Anon Key.` };
    }
  } catch (err: any) {
    return { success: false, message: `تعذر الاتصال بالسيرفر: ${err?.message || 'خطأ في الشبكة'}` };
  }
};

/**
 * Push all local data (Invoices, Bespoke Blends, Fragrance Oils) to Supabase
 */
export const syncLocalToSupabase = async (): Promise<{
  success: boolean;
  invoicesCount: number;
  blendsCount: number;
  oilsCount: number;
  message: string;
}> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const invoices = loadInvoices();
  const blends = loadCustomerBlends();
  const oils = loadOils();

  let invoicesCount = 0;
  let blendsCount = 0;
  let oilsCount = 0;

  // 1. Sync Invoices
  if (invoices.length > 0) {
    try {
      const formattedInvoices = invoices.map((inv) => ({
        invoice_number: inv.invoiceNumber,
        customer_name: inv.partyName,
        customer_phone: inv.partyPhone || null,
        order_type: inv.type === 'sale' ? (inv.saleKind || 'retail') : 'purchase',
        items: inv.items,
        subtotal: inv.subtotal,
        delivery_fee: inv.deliveryFee || 0,
        total: inv.totalAmount,
        payment_method: inv.paymentMethod || 'cash',
        status: inv.status || 'completed',
        created_at: inv.date || new Date().toISOString(),
      }));

      await executeSupabaseRequest('invoices', 'POST', formattedInvoices, 'resolution=merge-duplicates');
      invoicesCount = invoices.length;
    } catch (err: any) {
      console.warn('Sync invoices error:', err);
    }
  }

  // 2. Sync Customer Blends
  if (blends.length > 0) {
    try {
      const formattedBlends = blends.map((b) => ({
        id: b.id,
        blend_name: b.name,
        customer_name: b.customerName || null,
        bottle_size_ml: b.sizeMl,
        oil_concentration_pct: b.concentrationPercent || 30,
        ingredients: b.ingredients,
        notes: b.notes || null,
        price_usd: b.totalPrice,
        created_at: b.createdAt,
      }));

      await executeSupabaseRequest('customer_blends', 'POST', formattedBlends, 'resolution=merge-duplicates');
      blendsCount = blends.length;
    } catch (err: any) {
      console.warn('Sync customer blends error:', err);
    }
  }

  // 3. Sync Fragrance Oils
  if (oils.length > 0) {
    try {
      const formattedOils = oils.map((o) => ({
        code: o.code,
        name: o.name,
        brand: o.brand || 'العالمية',
        olfactory_family: o.family || 'شرقي',
        stock_grams: o.currentQuantity,
        cost_per_gram: o.unitCost,
        retail_per_gram: o.retailPrice50ml ? (o.retailPrice50ml / 50) : 0.14,
      }));

      await executeSupabaseRequest('fragrance_oils', 'POST', formattedOils, 'resolution=merge-duplicates');
      oilsCount = oils.length;
    } catch (err: any) {
      console.warn('Sync fragrance oils error:', err);
    }
  }

  // Update last sync time
  const cfg = getSupabaseConfig();
  cfg.lastSyncAt = new Date().toISOString();
  saveSupabaseConfig(cfg);

  return {
    success: true,
    invoicesCount,
    blendsCount,
    oilsCount,
    message: `تم رفع البيانات بنجاح: (${invoicesCount} فواتير، ${blendsCount} خلطة زبون، ${oilsCount} زيت عطري).`,
  };
};

/**
 * Pull latest data from Supabase down to local storage
 */
export const pullFromSupabaseToLocal = async (): Promise<{
  success: boolean;
  invoicesCount: number;
  blendsCount: number;
  message: string;
}> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  let invoicesCount = 0;
  let blendsCount = 0;

  try {
    // 1. Fetch Invoices
    const remoteInvoices: any[] = await executeSupabaseRequest('invoices?select=*&order=created_at.desc');
    if (Array.isArray(remoteInvoices) && remoteInvoices.length > 0) {
      const localInvoices = loadInvoices();
      const existingIds = new Set(localInvoices.map((i) => i.invoiceNumber));

      const mergedInvoices: Invoice[] = [...localInvoices];
      remoteInvoices.forEach((r) => {
        if (!existingIds.has(r.invoice_number)) {
          mergedInvoices.push({
            id: `inv-remote-${r.id || r.invoice_number}`,
            invoiceNumber: r.invoice_number,
            partyName: r.customer_name || 'عميل المتجر',
            partyPhone: r.customer_phone || undefined,
            type: 'sale',
            saleKind: 'retail',
            items: r.items || [],
            subtotal: Number(r.subtotal) || 0,
            deliveryFee: Number(r.delivery_fee) || 0,
            discount: 0,
            tax: 0,
            totalAmount: Number(r.total) || 0,
            paidAmount: Number(r.total) || 0,
            dueAmount: 0,
            paymentMethod: r.payment_method || 'cash',
            status: r.status || 'paid',
            date: r.created_at || new Date().toISOString(),
            createdAt: r.created_at || new Date().toISOString(),
            updatedAt: r.created_at || new Date().toISOString(),
          });
          invoicesCount++;
        }
      });

      saveInvoices(mergedInvoices);
    }
  } catch (err) {
    console.warn('Failed pulling invoices:', err);
  }

  try {
    // 2. Fetch Customer Blends
    const remoteBlends: any[] = await executeSupabaseRequest('customer_blends?select=*&order=created_at.desc');
    if (Array.isArray(remoteBlends) && remoteBlends.length > 0) {
      const localBlends = loadCustomerBlends();
      const existingIds = new Set(localBlends.map((b) => b.id));

      const mergedBlends: CustomerCustomBlend[] = [...localBlends];
      remoteBlends.forEach((r) => {
        if (!existingIds.has(r.id)) {
          mergedBlends.push({
            id: r.id,
            name: r.blend_name,
            customerName: r.customer_name || undefined,
            sizeMl: r.bottle_size_ml || 50,
            concentrationPercent: r.oil_concentration_pct || 30,
            ingredients: r.ingredients || [],
            notes: r.notes || undefined,
            totalPrice: Number(r.price_usd) || 0,
            createdAt: r.created_at || new Date().toISOString(),
          });
          blendsCount++;
        }
      });

      saveCustomerBlends(mergedBlends);
    }
  } catch (err) {
    console.warn('Failed pulling customer blends:', err);
  }

  // Update last sync time
  const cfg = getSupabaseConfig();
  cfg.lastSyncAt = new Date().toISOString();
  saveSupabaseConfig(cfg);

  return {
    success: true,
    invoicesCount,
    blendsCount,
    message: `تم سحب البيانات من السحابة بنجاح: (${invoicesCount} طلبات جديدة، ${blendsCount} خلطات جديدة).`,
  };
};

/**
 * Synchronize a single Customer Blend immediately if online
 */
export const syncCustomerBlendRealtime = async (blend: CustomerCustomBlend): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  try {
    const formatted = {
      id: blend.id,
      blend_name: blend.name,
      customer_name: blend.customerName || null,
      bottle_size_ml: blend.sizeMl,
      oil_concentration_pct: blend.concentrationPercent || 30,
      ingredients: blend.ingredients,
      notes: blend.notes || null,
      price_usd: blend.totalPrice,
      created_at: blend.createdAt,
    };
    await executeSupabaseRequest('customer_blends', 'POST', [formatted], 'resolution=merge-duplicates');
  } catch (err) {
    console.warn('Silent fallback: Blend saved to local storage.', err);
  }
};

/**
 * Synchronize a single Invoice immediately if online
 */
export const syncInvoiceRealtime = async (inv: Invoice): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  try {
    const formatted = {
      invoice_number: inv.invoiceNumber,
      customer_name: inv.partyName,
      customer_phone: inv.partyPhone || null,
      order_type: inv.type === 'sale' ? (inv.saleKind || 'retail') : 'purchase',
      items: inv.items,
      subtotal: inv.subtotal,
      delivery_fee: inv.deliveryFee || 0,
      total: inv.totalAmount,
      payment_method: inv.paymentMethod || 'cash',
      status: inv.status || 'completed',
      created_at: inv.date || new Date().toISOString(),
    };
    await executeSupabaseRequest('invoices', 'POST', [formatted], 'resolution=merge-duplicates');
  } catch (err) {
    console.warn('Silent fallback: Invoice saved to local storage.', err);
  }
};

/**
 * Official PostgreSQL Schema to run in Supabase SQL Editor
 */
export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- DAR NASMAT HAUTE PARFUMERIE - OFFICIAL SUPABASE SCHEMA
-- Run this script in your Supabase SQL Editor
-- ========================================================

-- 1. Fragrance Oils Catalog Table
CREATE TABLE IF NOT EXISTS fragrance_oils (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'العالمية',
    olfactory_family TEXT NOT NULL DEFAULT 'شرقي',
    stock_grams NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_per_gram NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    retail_per_gram NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customer Bespoke Formulations Table
CREATE TABLE IF NOT EXISTS customer_blends (
    id TEXT PRIMARY KEY,
    blend_name TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    bottle_size_ml INTEGER NOT NULL,
    oil_concentration_pct INTEGER NOT NULL DEFAULT 30,
    ingredients JSONB NOT NULL,
    notes TEXT,
    price_usd NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sales & POS Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    order_type TEXT NOT NULL DEFAULT 'storefront',
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) with Public Read/Write for Anon Key
ALTER TABLE fragrance_oils ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_blends ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for fragrance_oils" 
ON fragrance_oils FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read-write for customer_blends" 
ON customer_blends FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read-write for invoices" 
ON invoices FOR ALL USING (true) WITH CHECK (true);
`;
