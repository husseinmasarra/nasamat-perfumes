---
name: pre-deploy-check
description: Production readiness and pre-deployment audit framework covering the 10 critical pillars of production systems (Env Vars, Secrets, Debug Mode, Migrations & Schema, Security & Permissions, Input Validation, HTTPS & SSL, Logging & Error Tracking, Performance & Monitoring, and Rollback Strategy). Use before publishing, deploying, or promoting code to production.
---

# Pre-Deploy Production Readiness Checklist (10/10 Pillars)

Inspired by the industry-standard pre-flight deployment audit (Eng. Hossam Hashem: *"أهم 10 حاجات — مش معنى إن مشروعك شغال محلياً إنه جاهز للنشر"*).

Before deploying any web application, store, or API to production (Vercel, Cloudflare, Netlify, or VPS), execute this rigorous 10-point audit to guarantee zero downtime, zero data leakage, and a rock-solid user experience.

---

## The 10 Critical Pillars

```
PRE-DEPLOY CHECK [10 / 10]
=========================================
[01] ENV VARS    : Environment Configuration
[02] SECRETS     : Secret & API Key Sanitization
[03] DEBUG MODE  : Production Mode & Logging Cleanliness
[04] MIGRATIONS  : Database Schemas & Consistency
[05] SECURITY    : Headers, CORS, CSRF & Access Control
[06] VALIDATION  : Input Sanitization & Type Safety
[07] HTTPS / SSL : Mixed Content & Secure Transport
[08] LOGGING     : Error Handling & Error Boundaries
[09] MONITORING  : Performance, Bundle Size & Vitals
[10] ROLLBACK    : Disaster Recovery & Rollback Plan
=========================================
```

---

### 01. ENV VARS (Environment Variables)
- [ ] Ensure all required environment variables are defined in the production hosting dashboard (e.g., Vercel Project Settings ➔ Environment Variables).
- [ ] Verify that no `.env.local` or `.env.development` overrides are accidentally checked into Git.
- [ ] Validate runtime variable fallbacks: Check that code gracefully handles missing optional variables without crashing.
- [ ] Confirm domain-specific variables (e.g., `VITE_SITE_URL`, `NEXT_PUBLIC_APP_URL`) match the final live production domain, not `localhost:5173`.

### 02. SECRETS (Credentials & Sensitive Data)
- [ ] **Zero Secrets in Client Bundles**: Audit frontend code to ensure private keys (Stripe Secret Key, Supabase `service_role` key, database passwords, private certificates) are never prefixed with client-exposed prefixes (like `VITE_` or `NEXT_PUBLIC_`).
- [ ] Ensure `.gitignore` properly includes `.env`, `.env.*.local`, `*.pem`, `*.key`, and temporary export files.
- [ ] Verify that third-party API keys exposed to the client (Google Maps, Meta Pixel ID, Supabase Anon Key) are restricted by domain referrer in their respective provider consoles.

### 03. DEBUG MODE (Production Optimization)
- [ ] Verify production build flags (`NODE_ENV=production`).
- [ ] Strip verbose debug logging (`console.log`, `console.dir`, test dumps) from production bundles.
- [ ] Confirm mock/demo banners, watermark placeholders, and sample testing data are either hidden or toggleable only by authenticated administrators.
- [ ] Verify developer error overlays (e.g., Vite/Next error modals) are disabled for public visitors.

### 04. MIGRATIONS & SCHEMA CONSISTENCY
- [ ] Verify remote database schema matches local expectations (tables, columns, foreign keys, indexes).
- [ ] Confirm Row Level Security (RLS) is enabled and active on all production database tables.
- [ ] Test backward compatibility: If a new migration is applied, ensure it does not break active sessions or in-flight orders.
- [ ] Run automated or manual database backup before running any production migration.

### 05. SECURITY (Headers, CORS & Access Controls)
- [ ] **Content Security Policy & Security Headers**: Configure HTTP security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN` (or `DENY` if embedding is prohibited)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [ ] **CORS Configuration**: Restrict API endpoints and webhooks to authorized origins.
- [ ] **Authentication & Authorization**: Verify that administrative routes and actions require valid server-verified sessions or password verification.

### 06. VALIDATION & SANITIZATION
- [ ] **Input Sanitization**: Ensure all customer inputs (names, phone numbers, addresses, custom blend notes, checkout details) are sanitized to prevent XSS.
- [ ] **Phone Number & Currency Formatting**: Validate format integrity (e.g., Lebanese international prefixes `+961`, numeric currency rounding).
- [ ] **Cart & Order Integrity**: Prevent negative quantities, zero-price tampering, or NaN values during calculations.

### 07. HTTPS & SECURE TRANSPORT
- [ ] Enforce HTTPS redirection on all HTTP requests.
- [ ] Eliminate Mixed Content: Ensure all external assets (images, fonts, scripts, CDNs) use `https://`.
- [ ] Cookies: Verify authentication and session cookies include `Secure`, `HttpOnly`, and `SameSite=Lax` or `SameSite=Strict`.

### 08. LOGGING & ERROR RECOVERY
- [ ] Ensure top-level React Error Boundaries wrap the application so unexpected JavaScript exceptions render a graceful fallback UI rather than a blank white screen.
- [ ] Verify background sync operations (Google Sheets webhooks, Supabase real-time sync, pixel tracking) fail silently without interrupting the checkout or order experience for the customer.
- [ ] Ensure sensitive customer PII (credit cards, passwords) is never written to public logs.

### 09. MONITORING & PERFORMANCE
- [ ] **Build Verification**: Run `npm run build` locally or in CI and verify exit code 0.
- [ ] **Bundle Size**: Inspect generated chunk sizes; ensure large dependencies are code-split.
- [ ] **Asset Optimization**: Verify images use WebP/AVIF where possible and lazy loading is enabled for below-the-fold catalog items.
- [ ] **Core Web Vitals**: Audit LCP (Largest Contentful Paint), CLS (Cumulative Layout Shift), and INP (Interaction to Next Paint).

### 10. ROLLBACK STRATEGY (Disaster Recovery)
- [ ] Confirm version control state: Working branch is committed, clean, and tagged with a release version (e.g., `v1.2.0`).
- [ ] Instant Rollback Ready: On Vercel, know how to promote the previous deployment with 1 click if any critical defect appears.
- [ ] Data Export & Fallback: Ensure manual JSON/CSV backup of current products, customers, and inventory is downloaded before deployment.

---

## Quick Audit CLI Runner

Before deploying, run this quick command sequence:

```powershell
# 1. Typecheck and build verification
npm run build

# 2. Check for leftover console.log statements in source code
Select-String -Path "src\**\*.ts","src\**\*.tsx" -Pattern "console\.log\("

# 3. Check git status for uncommitted changes
git status
```
