---
name: vercel-deployment
description: Vercel cloud deployment, custom domain configuration, Vite SPA routing rewrites, environment variables, and build optimization. Use whenever deploying, configuring vercel.json, or managing cloud hosting.
---

# Vercel Cloud Deployment Skill

Guidelines and configuration presets for deploying the Nasamat Perfume platform to Vercel with high performance, edge caching, and seamless Single-Page Application (SPA) client routing.

## 1. Project Configuration (`vercel.json`)
For Vite/React applications, ensure `vercel.json` provides rewrite rules so direct URLs and sub-routes (such as `/admin`, `/store`, `/pos`) resolve directly to `index.html`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 2. Environment Variables Checklist
Configure these in the Vercel Dashboard under **Project Settings > Environment Variables** (or via `.env.production`):

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Cloud Supabase project REST URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key for client queries |
| `VITE_STORE_PHONE` | Primary WhatsApp concierge number |

---

## 3. Pre-Flight Deployment Checklist
Before pushing to production or triggering a deployment:
1. **Local Build Test**: Run `npm run build` locally to verify 0 TypeScript and bundling errors.
2. **Asset Optimization**: Ensure all hero and product images in `public/` or `assets/` are compressed WebP/JPG to guarantee sub-second initial load.
3. **PWA & Offline Manifest**: Verify `manifest.json` and service workers (if enabled) load without MIME type errors.

---

## 4. Custom Domain & SSL Setup
1. In Vercel Project Dashboard, navigate to **Settings > Domains**.
2. Add your custom domain (e.g., `nasamat-parfums.com` or `shop.perfume.iq`).
3. Add the recommended DNS records in your domain registrar:
   - **Type A**: `76.76.21.21` (for apex root)
   - **Type CNAME**: `cname.vercel-dns.com` (for `www` subdomain)
4. Vercel automatically generates and renews Let's Encrypt SSL/TLS certificates.
