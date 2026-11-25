import React, { useState, useEffect } from 'react';
import type { FragranceOil, SavedRecipe, Invoice, AppSettings, BottleLabelData } from '../types';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Receipt, 
  CreditCard, 
  Check, 
  Printer, 
  UserCheck,
  Droplet,
  Truck,
  Tag,
  Maximize2,
  Minimize2
} from './icons';
import { useLanguage } from '../context/LanguageContext';

interface AdminPOSTerminalTabProps {
  oils: FragranceOil[];
  recipes: SavedRecipe[];
  settings: AppSettings;
  onSaveInvoice: (
    invoice: Invoice,
    stockChanges?: {
      deductions?: {
        oils: { id: string; amount: number }[];
        materials: { id: string; amount: number }[];
      };
    }
  ) => void;
  onViewInvoiceReceipt?: (invoice: Invoice) => void;
  onOpenBottleLabel?: (data: BottleLabelData) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

interface PosCartItem {
  id: string;
  type: 'oil' | 'recipe';
  productId: string;
  name: string;
  brand: string;
  sizeMl: number;
  price: number;
  quantity: number;
}

export const AdminPOSTerminalTab: React.FC<AdminPOSTerminalTabProps> = ({
  oils,
  recipes,
  settings,
  onSaveInvoice,
  onViewInvoiceReceipt,
  onOpenBottleLabel,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSize, setSelectedSize] = useState<30 | 50 | 100>(50);
  const [posCart, setPosCart] = useState<PosCartItem[]>([]);
  const [customerName, setCustomerName] = useState('زبون مباشر (صالة العرض)');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'whish_omt' | 'bank_card'>('cash');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [lastIssuedInvoice, setLastIssuedInvoice] = useState<Invoice | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString(isAr ? 'ar-LB' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString(isAr ? 'ar-LB' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [isAr]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen request failed, using in-app overlay:', err);
      setIsFullscreen((prev) => !prev);
    }
  };

  // Filter products for quick POS grid
  const filteredOils = oils.filter((o) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.code.toLowerCase().includes(q) ||
      o.brand.toLowerCase().includes(q) ||
      (o.barcode && o.barcode.toLowerCase().includes(q))
    );
  });

  const getPriceForSize = (item: FragranceOil | SavedRecipe, size: number) => {
    if (size === 30) return item.retailPrice30ml || 5;
    if (size === 100) return item.retailPrice100ml || 12;
    return item.retailPrice50ml || (item as any).suggestedRetailPrice || 7;
  };

  const handleAddItemToPosCart = (item: FragranceOil, size: 30 | 50 | 100) => {
    const unitPrice = getPriceForSize(item, size);
    const existingIndex = posCart.findIndex(
      (it) => it.productId === item.id && it.sizeMl === size
    );

    if (existingIndex >= 0) {
      const updated = [...posCart];
      updated[existingIndex].quantity += 1;
      setPosCart(updated);
    } else {
      setPosCart((prev) => [
        ...prev,
        {
          id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'oil',
          productId: item.id,
          name: item.name,
          brand: item.brand,
          sizeMl: size,
          price: unitPrice,
          quantity: 1,
        },
      ]);
    }
  };

  const handleUpdateQty = (cartId: string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((it) => (it.id === cartId ? { ...it, quantity: it.quantity + delta } : it))
        .filter((it) => it.quantity > 0)
    );
  };

  const handleRemoveItem = (cartId: string) => {
    setPosCart((prev) => prev.filter((it) => it.id !== cartId));
  };

  const subtotal = posCart.reduce((s, it) => s + it.price * it.quantity, 0);
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleCompleteSale = () => {
    if (posCart.length === 0) return;

    const invoiceNumber = `POS-${Date.now().toString().slice(-6)}`;
    const oilDeductions = posCart.map((it) => {
      const mlPerBottle = it.sizeMl === 30 ? 7.5 : it.sizeMl === 50 ? 12.5 : 25;
      return {
        id: it.productId,
        amount: Number((mlPerBottle * it.quantity).toFixed(2)),
      };
    });

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      type: 'sale',
      saleKind: 'retail',
      date: new Date().toISOString(),
      partyName: customerName.trim() || (isAr ? 'زبون صالة العرض' : 'Walk-in Customer'),
      partyPhone: customerPhone.trim() || undefined,
      status: 'paid',
      paymentMethod,
      items: posCart.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        referenceId: it.productId,
        name: `${it.name} (${it.sizeMl}ml)`,
        itemType: 'perfume_bottle' as const,
        sizeOrQty: it.quantity,
        unit: 'bottle' as const,
        bottleCapacityMl: it.sizeMl,
        unitPrice: it.price,
        totalPrice: it.price * it.quantity,
      })),
      subtotal,
      deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
      discount: discountAmount,
      tax: 0,
      totalAmount: total,
      paidAmount: total,
      dueAmount: 0,
      notes: deliveryFee > 0 
        ? `${isAr ? 'نقطة بيع سريعة (POS) • طلب توصيل (رسوم التوصيل: $' + deliveryFee.toFixed(2) + ')' : 'POS Order with Delivery ($' + deliveryFee.toFixed(2) + ')'}`
        : (isAr ? 'نقطة بيع سريعة (POS Terminal) — استلام فوري' : 'Quick In-Store POS Sale'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveInvoice(newInvoice, { deductions: { oils: oilDeductions, materials: [] } });
    setLastIssuedInvoice(newInvoice);
    setPosCart([]);
    setDeliveryFee(0);
    setDiscountAmount(0);
    setDiscountAmount(0);
  };

  return (
    <div className={`transition-all duration-200 text-black flex flex-col ${
      isFullscreen
        ? 'fixed inset-0 z-[100] bg-[#f8f9fa] p-3 sm:p-5 overflow-hidden h-screen w-screen animate-fadeIn'
        : 'space-y-4 w-full flex-1'
    }`}>
      {/* POS Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white border border-neutral-200 p-3 sm:p-4 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black font-serif text-black uppercase tracking-wider">
                {isAr ? 'نقطة البيع الفورية (POS Terminal)' : 'POS Terminal / Counter Cashier'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase shrink-0">
                {isAr ? '● الكاشير نشط' : '● Live'}
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-mono font-bold shrink-0">
                ⏰ {currentTime}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-medium">
              {isAr ? 'تسجيل فوري لطلبيات الزبائن بالصالة وإصدار فواتير بيع مع خصم المخزون' : 'Fast counter orders with instant receipt issuing'}
            </p>
          </div>
        </div>

        {/* Action Controls: Sizes, Wide View, Fullscreen */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Global size pill selector for fast adding */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-neutral-100 border border-neutral-200 text-xs font-bold">
            <span className="text-neutral-500 px-1 text-[11px]">{isAr ? 'الافتراضي:' : 'Default:'}</span>
            {([30, 50, 100] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`px-2.5 py-1 rounded-xl text-xs transition cursor-pointer ${
                  selectedSize === s
                    ? 'bg-black text-white shadow-xs font-black'
                    : 'text-neutral-600 hover:text-black font-semibold'
                }`}
              >
                {s}ml
              </button>
            ))}
          </div>

          {/* Toggle Sidebar Wide View button */}
          {onToggleSidebar && !isFullscreen && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold border border-neutral-200 transition cursor-pointer shadow-2xs"
              title={isAr ? 'توسيع الشاشة وإخفاء القائمة الجانبية' : 'Toggle Wide View'}
            >
              <span>{isSidebarCollapsed ? '⇥' : '⇤'}</span>
              <span className="hidden sm:inline">{isSidebarCollapsed ? (isAr ? 'إظهار القائمة' : 'Show Menu') : (isAr ? 'ملء العرض' : 'Wide View')}</span>
            </button>
          )}

          {/* Fullscreen Mode Button (Square / Clover / Toast POS Style) */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer border shadow-xs ${
              isFullscreen
                ? 'bg-amber-400 text-black border-amber-500 hover:bg-amber-300 ring-2 ring-amber-300'
                : 'bg-black text-white border-black hover:bg-neutral-800'
            }`}
            title={isAr ? 'تشغيل وضع ملء الشاشة الكامل مثل برامج الكاشير العالمية' : 'Toggle Fullscreen Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? (isAr ? 'الخروج من ملء الشاشة' : 'Exit Fullscreen') : (isAr ? '⛶ ملء الشاشة (POS Mode)' : '⛶ Fullscreen')}</span>
          </button>
        </div>
      </div>

      {/* POS Layout: 2 Columns (Products grid on start, Cart/Ticket on end) */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 ${isFullscreen ? 'h-[calc(100vh-100px)]' : ''}`}>
        
        {/* Products Grid (7 Cols on desktop, 8 Cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-3 min-h-0">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const q = searchTerm.trim().toLowerCase();
                  if (!q) return;
                  const exact = oils.find(
                    (o) =>
                      (o.barcode && o.barcode.toLowerCase() === q) ||
                      o.code.toLowerCase() === q ||
                      o.name.toLowerCase() === q
                  );
                  if (exact) {
                    handleAddItemToPosCart(exact, selectedSize);
                    setSearchTerm('');
                  }
                }
              }}
              placeholder={isAr ? 'ابحث بالاسم، الكود، أو امسح الباركود بالـ Scanner...' : 'Search by name, SKU, or scan barcode...'}
              className="w-full ps-9 pe-4 py-2.5 rounded-2xl bg-white border border-neutral-300 text-xs text-black focus:outline-none focus:border-black font-medium shadow-xs"
            />
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 overflow-y-auto p-1 flex-1 ${
            isFullscreen ? 'max-h-[calc(100vh-170px)]' : 'max-h-[calc(100vh-230px)] min-h-[480px]'
          }`}>
            {filteredOils.slice(0, 100).map((oil) => {
              const currentPrice = getPriceForSize(oil, selectedSize);
              const oilSizes = (oil.availableSizes && oil.availableSizes.length > 0)
                ? oil.availableSizes
                : [30, 50, 100];

              return (
                <div
                  key={oil.id}
                  onClick={() => handleAddItemToPosCart(oil, selectedSize)}
                  className="bg-white border border-neutral-200 hover:border-black rounded-2xl p-2.5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                      <img
                        src={oil.imageUrl || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=150&q=80'}
                        alt={oil.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-black truncate" title={oil.name}>{oil.name}</h4>
                      <p className="text-[10px] text-neutral-500 truncate">{oil.brand}</p>
                    </div>
                  </div>

                  {/* Available Bottle Sizes - Direct Click to Add Size to Cart */}
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    {oilSizes.map((sz) => {
                      const szPrice = getPriceForSize(oil, sz);
                      const isDefaultSelected = selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddItemToPosCart(oil, sz as 30 | 50 | 100);
                          }}
                          className={`py-1 px-0.5 rounded-lg text-center transition-all duration-150 border flex flex-col items-center justify-center cursor-pointer ${
                            isDefaultSelected
                              ? 'bg-black text-white border-black shadow-xs ring-1 ring-black'
                              : 'bg-neutral-50 hover:bg-neutral-900 hover:text-white text-neutral-700 border-neutral-200'
                          }`}
                          title={`${isAr ? 'إضافة حجم' : 'Add'} ${sz}ml ($${szPrice.toFixed(0)})`}
                        >
                          <span className="text-[10px] font-mono font-black leading-none">{sz}ml</span>
                          <span className={`text-[8.5px] font-mono font-bold mt-0.5 leading-none ${isDefaultSelected ? 'text-amber-300' : 'text-neutral-500'}`}>
                            ${szPrice.toFixed(0)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                    <div className="flex items-center gap-1 min-w-0">
                      {oil.barcode ? (
                        <span className="text-[9px] font-mono font-bold text-neutral-600 bg-neutral-100 px-1 py-0.2 rounded border border-neutral-200 truncate" title={`باركود: ${oil.barcode}`}>
                          📊 {oil.barcode.slice(-5)}
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-neutral-400">
                          #{oil.code || oil.id.slice(-4)}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-black text-xs text-black shrink-0">${currentPrice.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* POS Cart / Current Ticket (5 Cols on desktop, 4 Cols on xl) */}
        <div className={`lg:col-span-5 xl:col-span-4 bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-0 ${
          isFullscreen ? 'h-full overflow-hidden' : 'sticky top-3'
        }`}>
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-black" />
                <h3 className="font-bold text-sm text-black">
                  {isAr ? 'فاتورة البيع الحالية' : 'Current Ticket'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-neutral-500">
                  {posCart.reduce((s, it) => s + it.quantity, 0)} {isAr ? 'قطع' : 'items'}
                </span>
                {posCart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPosCart([])}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                    title={isAr ? 'تفريغ السلة بالكامل' : 'Clear Ticket'}
                  >
                    {isAr ? 'تفريغ' : 'Clear'}
                  </button>
                )}
              </div>
            </div>

            {/* Customer Inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-600 mb-1">{isAr ? 'اسم الزبون:' : 'Customer Name:'}</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-600 mb-1">{isAr ? 'رقم الهاتف:' : 'Phone:'}</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder=""
                  className="w-full p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Ticket Items List */}
            <div className={`space-y-2 overflow-y-auto flex-1 ${isFullscreen ? 'max-h-[calc(100vh-450px)]' : 'max-h-[300px] min-h-[140px]'}`}>
              {posCart.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  {isAr ? 'السلة فارغة، اضغط على أي عطر لإضافته' : 'Ticket is empty. Tap any perfume to add.'}
                </div>
              ) : (
                posCart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-black truncate">{item.name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {item.sizeMl}ml • ${item.price.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => handleUpdateQty(item.id, -1)}
                          className="px-2 py-1 text-neutral-600 hover:bg-neutral-100"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, 1)}
                          className="px-2 py-1 text-neutral-600 hover:bg-neutral-100"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono font-black text-black w-14 text-end">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ticket Total & Checkout */}
          <div className="space-y-3 pt-3 border-t border-neutral-100">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-1 rounded-xl text-center font-bold border transition cursor-pointer ${
                  paymentMethod === 'cash' ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                💵 {isAr ? 'نقدي (Cash)' : 'Cash'}
              </button>
              <button
                onClick={() => setPaymentMethod('whish_omt')}
                className={`py-2 px-1 rounded-xl text-center font-bold border transition cursor-pointer ${
                  paymentMethod === 'whish_omt' ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                📱 Whish / OMT
              </button>
              <button
                onClick={() => setPaymentMethod('bank_card')}
                className={`py-2 px-1 rounded-xl text-center font-bold border transition cursor-pointer ${
                  paymentMethod === 'bank_card' ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                💳 {isAr ? 'بطاقة بنكية' : 'Card'}
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span className="font-mono font-bold text-black">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-500">
                <span>{isAr ? 'خصم مخصص ($):' : 'Discount ($):'}</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-18 py-0.5 px-2 rounded border border-neutral-300 font-mono text-end text-xs"
                />
              </div>
              <div className="flex justify-between items-center text-neutral-500">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-neutral-600" />
                  <span>{isAr ? 'رسوم التوصيل ($):' : 'Delivery ($):'}</span>
                </span>
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => setDeliveryFee(0)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        deliveryFee === 0 ? 'bg-black text-white border-black' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                      }`}
                    >
                      $0
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryFee(3)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        deliveryFee === 3 ? 'bg-black text-white border-black' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                      }`}
                    >
                      $3
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryFee(4)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        deliveryFee === 4 ? 'bg-black text-white border-black' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                      }`}
                    >
                      $4
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={deliveryFee || ''}
                    onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-16 py-0.5 px-1.5 rounded border border-neutral-300 font-mono text-end text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200 text-base font-black">
                <span>{isAr ? 'الصافي المطلوب:' : 'Total Amount:'}</span>
                <span className="font-mono text-xl text-emerald-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={posCart.length === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>{isAr ? 'إصدار الفاتورة وتأكيد البيع' : 'Complete Sale & Issue Receipt'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Success Modal for Issued POS Receipt */}
      {lastIssuedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-neutral-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-600 font-bold">
              <Check className="w-7 h-7 text-emerald-600 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-black">
                {isAr ? 'تمت عملية البيع بنجاح!' : 'Sale Completed!'}
              </h3>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                {lastIssuedInvoice.invoiceNumber} • ${lastIssuedInvoice.totalAmount.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {onViewInvoiceReceipt && (
                <button
                  onClick={() => {
                    onViewInvoiceReceipt(lastIssuedInvoice);
                    setLastIssuedInvoice(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>{isAr ? 'طباعة الإيصال الفوري' : 'Print Receipt'}</span>
                </button>
              )}

              {onOpenBottleLabel && (
                <button
                  type="button"
                  onClick={() => {
                    const firstItem = lastIssuedInvoice.items[0];
                    onOpenBottleLabel({
                      perfumeName: firstItem ? firstItem.name : 'عطر نسمات الملكي',
                      bottleSizeMl: firstItem ? firstItem.sizeOrQty : 50,
                      customerName: lastIssuedInvoice.partyName !== 'زبون مباشر (صالة العرض)' ? lastIssuedInvoice.partyName : undefined,
                      concentrationPercent: 25,
                      concentrationTier: 'Extrait de Parfum',
                      batchNumber: `NAS-${lastIssuedInvoice.invoiceNumber}`,
                      formulationDate: new Date(lastIssuedInvoice.date).toISOString().split('T')[0],
                    });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <Tag className="w-4 h-4 text-black" />
                  <span>{isAr ? '🏷️ طباعة ليبل الزجاجة' : 'Print Bottle Label'}</span>
                </button>
              )}

              <button
                onClick={() => setLastIssuedInvoice(null)}
                className="w-full py-2 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold cursor-pointer"
              >
                {isAr ? 'بيعة جديدة' : 'New Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
