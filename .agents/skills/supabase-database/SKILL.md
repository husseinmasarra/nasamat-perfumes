---
name: supabase-database
description: Supabase PostgreSQL cloud integration, database schema architecture, real-time sync, and offline-first storage for perfume inventory, customer blends, and orders. Use whenever setting up, querying, or migrating database tables.
---

# Supabase Database Skill

Architecture, schema definitions, and client synchronization guidelines for integrating Supabase PostgreSQL with the Nasamat Perfume platform.

## Architecture: Offline-First Hybrid
1. **Local Speed & Offline Resilience**: The app continues to work instantly via `localStorage` even without an active internet connection.
2. **Cloud Sync**: When online, Supabase synchronizes inventory stock, customer bespoke compounding formulas, and orders across multiple devices and staff terminals.

---

## PostgreSQL Database Schema

```sql
-- 1. Fragrance Oils Catalog Table
CREATE TABLE IF NOT EXISTS fragrance_oils (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g. 'NAS-001'
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'العالمية',
    olfactory_family TEXT NOT NULL, -- 'شرقي', 'خشبي', 'زهري', etc.
    stock_grams NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_per_gram NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    retail_per_gram NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customer Bespoke Formulations
CREATE TABLE IF NOT EXISTS customer_blends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blend_name TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    bottle_size_ml INTEGER NOT NULL,
    oil_concentration_pct INTEGER NOT NULL DEFAULT 30,
    ingredients JSONB NOT NULL, -- Array of { code, name, percentage, grams }
    notes TEXT,
    price_usd NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sales & POS Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    order_type TEXT NOT NULL DEFAULT 'pos', -- 'pos', 'storefront', 'bespoke'
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE fragrance_oils ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_blends ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
```

---

## Client Synchronization Pattern

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Synchronize Customer Blends with Cloud Fallback
export async function syncCustomerBlend(blend: any) {
  // Always persist locally first
  const localKey = 'nasamat_customer_blends_v1';
  const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
  const updated = [blend, ...existing.filter((b: any) => b.id !== blend.id)];
  localStorage.setItem(localKey, JSON.stringify(updated));

  // Sync to Supabase if connected
  if (supabase) {
    try {
      const { error } = await supabase.from('customer_blends').upsert([blend]);
      if (error) console.warn('Supabase sync warning:', error.message);
    } catch (err) {
      console.warn('Network offline, saved to local storage.');
    }
  }
}
```
