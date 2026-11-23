---
name: excel-xlsx-export
description: Professional spreadsheet export and data transformation for perfume inventory, oil stocks, formulations, sales ledgers, and financial analytics. Use whenever building or optimizing CSV/XLSX export functions.
---

# Excel & XLSX Export Skill

Expert guidelines and utility patterns for exporting structured tabular data (raw fragrance oils, batch inventory, POS sales, customer records, and custom formulas) to Microsoft Excel, Google Sheets, and CSV formats.

## Core Principles
1. **Flawless Arabic UTF-8 Support**: Always prepend the UTF-8 Byte Order Mark (`\uFEFF`) to prevent Arabic characters from becoming garbled/corrupted when opened directly in Microsoft Excel.
2. **Formula Integrity & Number Formatting**: Clean conversion of financial values (USD/IQD), percentages, and weights (grams/milliliters) without accidental string-to-number parse failures.
3. **Structured Multi-Column Layouts**: Proper column headers, predictable ordering, and escaped commas/quotes in CSV streams.

---

## Technical Implementations

### 1. Robust UTF-8 CSV Generator for Arabic Text
```typescript
export function exportToCsv<T>(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  // 1. Format row entries with proper escaping
  const formatCell = (cell: unknown): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(formatCell).join(','),
    ...rows.map(row => row.map(formatCell).join(','))
  ].join('\r\n');

  // 2. Prepend UTF-8 BOM (\uFEFF)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 3. Trigger download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### 2. Standard Perfume Data Schemas

#### A. Fragrance Oils Inventory Export
- Columns:
  1. `كود الزيت` (Oil Code, e.g., NAS-001)
  2. `اسم الزيت` (Oil Name)
  3. `الشركة المصنعة` (Manufacturer, e.g., العالمية, جيفودان, فيرمينش)
  4. `العائلة العطرية` (Olfactory Family: شرقي, خشبي, زهري, حمضي)
  5. `الكمية المتوفرة (غرام)` (Stock Quantity in Grams)
  6. `سعر التكلفة لكل غرام` (Cost per Gram)
  7. `سعر البيع لكل غرام` (Retail Price per Gram)
  8. `حالة المخزون` (Stock Status: متوفر, منخفض, نافذ)

#### B. Sales & Orders Export
- Columns:
  1. `رقم الفاتورة` (Invoice Serial)
  2. `التاريخ والوقت` (Timestamp)
  3. `اسم العميل` (Customer Name)
  4. `رقم الهاتف` (Phone Number)
  5. `نوع الطلب` (Order Type: بيع مباشر POS, متجر إلكتروني, تركيبة خاصة)
  6. `المنتجات والتفاصيل` (Items Summary)
  7. `أجور التوصيل` (Delivery Fee)
  8. `المجموع الصافي ($)` (Total Amount)
  9. `طريقة الدفع` (Payment Method: نقدي, بطاقة, زين كاش)

### 3. Google Sheets Direct Integration
- Ensure exported CSV or JSON can be mapped directly into Google Sheets via the `gsheets` plugin or standard File > Import workflow.
