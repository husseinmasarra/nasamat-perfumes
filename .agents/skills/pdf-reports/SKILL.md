---
name: pdf-reports
description: High-fidelity PDF and printable document generator for luxury invoices, POS receipts, customer certificates, and laboratory batch reports. Use whenever building or refining print-ready layouts or PDF exports.
---

# Luxury PDF & Printable Reports Skill

Provides expert guidelines for generating pixel-perfect, elegant printable documents and PDFs for luxury perfume brands (A4 invoices, 80mm POS thermal receipts, bespoke compounding certificates, and laboratory production sheets).

## Core Principles
1. **Pristine Print Styling**: Dedicated `@media print` rules ensuring backgrounds, borders, and typography render crisp without browser clutter (headers, footers, URLs).
2. **Arabic Typography & Bidi Excellence**: Full RTL support with luxury typography (Amiri, Cairo, Tajawal), tabular numeral alignment (`font-variant-numeric: tabular-nums`), and clean bilingual metadata.
3. **Dual Print Formats**:
   - **A4 Executive Invoices & Lab Sheets**: Formal layout, multi-column tables, gold foil branding accents, batch lot codes, and signature blocks.
   - **80mm POS Thermal Slips**: High-contrast monochrome, compact padding, QR code inclusion, and barcode-ready spacing.

---

## Technical Guidelines

### 1. Print CSS Architecture
```css
@media print {
  /* Reset page margins and unneeded elements */
  @page {
    size: A4 portrait;
    margin: 12mm 15mm;
  }
  
  body {
    background: #ffffff !important;
    color: #111827 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  /* Hide UI navigation, buttons, and close icons */
  .no-print, header, nav, .print-btn, .modal-backdrop {
    display: none !important;
  }

  /* Prevent awkward page cuts */
  .print-page-break {
    page-break-before: always;
  }
  
  .print-avoid-break, tr, .invoice-card {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
```

### 2. POS Thermal Receipt (80mm) Rules
- Container width: exactly `80mm` or `300px max-width`.
- Text alignment: RTL with clear dashed dividers (`border-b border-dashed border-gray-400`).
- Typography: Monospace or crisp sans-serif with high contrast (`#000000` text on `#ffffff`).
- Include: Store brand, timestamp, invoice serial (`INV-YYYYMMDD-XXXX`), line items with quantity & unit price, delivery fee breakdown, total, and footer QR code / WhatsApp contact.

### 3. Laboratory Compounding Batch Sheet
- Purpose: Perfumer formulation and batch blending in the lab.
- Fields:
  - Formulation Code & Custom Blend Name.
  - Fragrance Oils Breakdown (Code, Name, Grams / Percentage, Specific Gravity).
  - Solvent / Ethanol 96% Addition & Fixative calculation.
  - Quality Control checklist: Clarity check, Maceration date, Shelf-life date, Perfumer signature.

### 4. Direct Browser Print Invocation
- Use `window.print()` triggered via clean modal or detached printable iframe.
- Ensure event listeners restore view state cleanly upon print dialogue closure.
