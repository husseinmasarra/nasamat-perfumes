import type { Language, FragranceFamily, MaterialCategory, ConcentrationTier, RecipeCategory } from '../types';

export const DICTIONARY = {
  ar: {
    // Brand & Header
    brandTitle: 'نسمات',
    brandSubtitle: '| مختبر صياغة وتركيب العطور',
    brandTheme: 'ROSE GOLD & VELVET 🌹',
    brandDesc: 'نظام نسمات لإدارة الزيوت العطرية والمواد الأولية، وحاسبة النسب والتراكيز بالمل والجرام',
    portalCustomer: 'صفحة الزبائن (المتجر)',
    portalAdmin: 'صفحة الإدارة والتحكم',
    portalCustomerShort: 'صفحة الزبائن',
    portalAdminShort: 'صفحة الإدارة',
    portalCustomerDesc: 'متجر العطور الفاخرة — تشكيلة 2026 الحصرية وتوصيل فوري لكافة الأراضي اللبنانية',
    portalAdminDesc: 'لوحة الإدارة الشاملة — إدارة المخزون، الحسابات، فواتير المبيع والشراء، والوصفات',
    switchToAdmin: 'دخول الإدارة 🔒',
    switchToCustomer: 'زيارة صفحة الزبائن 🛍️',
    adminAuthModalTitle: 'دخول لوحة الإدارة والتحكم 🔒',
    adminAuthModalSubtitle: 'هذه المنطقة مخصصة لإدارة المتجر ومختبر العطور — يرجى إدخال كلمة المرور',
    adminPasswordLabel: 'كلمة مرور الإدارة',
    adminPasswordPlaceholder: 'أدخل كلمة المرور',
    adminPasswordError: 'كلمة المرور غير صحيحة، يرجى المحاولة مجدداً',
    adminLoginBtn: 'دخول الإدارة',
    adminLogoutBtn: 'قفل الإدارة / خروج 🔒',
    adminSettingsPasswordTitle: 'كلمة مرور صفحة الإدارة',
    adminSettingsPasswordDesc: 'حدد كلمة المرور المطلوبة للوصول إلى لوحة التحكم والإدارة لحماية بياناتك',
    adminCurrentPasswordLabel: 'كلمة المرور الحالية للإدارة',
    adminNewPasswordPlaceholder: 'أدخل كلمة مرور جديدة',
    adminPasswordUpdated: 'تم تحديث كلمة مرور الإدارة بنجاح',
    smartSearchBtn: 'البحث السريع',
    lowStockWarning: 'عناصر قاربت على النفاد',
    currencyLabel: 'العملة:',
    backupReportsBtn: 'النسخ والتقارير',
    resetDefaultsBtn: 'افتراضي',
    langToggleBtn: 'English',

    // Navigation Tabs
    tabStore: 'بوتيك الزبائن والسلة',
    tabStoreBadge: 'متجر فاخر',
    tabCalculator: 'حاسبة ومختبر التركيب',
    tabCalculatorBadge: 'مختبر حرفي',
    tabRecipes: 'خلطات ووصفات مميزة',
    tabInvoices: 'فواتير الشراء والمبيع',
    tabCatalog: 'جدول الأصناف (Excel)',
    tabMaterials: 'المواد الأولية والزجاجات',
    tabBatches: 'سجل التشغيلات والإنتاج',
    tabDashboard: 'لوحة الإحصائيات والمخزون',

    // Common Actions
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    confirm: 'تأكيد',
    print: 'طباعة',
    export: 'تصدير',
    import: 'استيراد',
    search: 'بحث',
    restock: 'تزويد المخزون',
    actions: 'الإجراءات',
    status: 'الحالة',
    notes: 'ملاحظات',
    all: 'الكل',
    healthy: 'كافٍ / ممتاز',
    low: 'منخفض',
    outOfStock: 'نفد',
    ml: 'مل',
    gram: 'غرام',
    piece: 'قطعة',

    // Categories
    catAll: 'كل الأصناف',
    catMen: 'رجالي توب',
    catWomen: 'نسائي جذاب',
    catNiche: 'نيش وعود وسهرات',
    catSummer: 'صيفي متوسطي',
    catWinter: 'شتوي وغورماند وتبغ',
    catSignature: 'خلطات نسمات الخاصة',

    // Fragrance Families
    familyOriental: 'شرقي',
    familyWoody: 'خشبي',
    familyFloral: 'زهري',
    familyFresh: 'منعش / أكوا',
    familyLeather: 'جلدي / بخور',
    familyGourmand: 'غورماند / فانيليا',
    familyCitrus: 'حمضيات',
    familyAromatic: 'أروماتك',
    familyOther: 'أخرى',

    // Material Categories
    matBottle: 'الزجاجات والعبوات',
    matSprayer: 'البخاخات والأغطية',
    matAlcohol: 'كحول ومذيبات العطور',
    matFixative: 'المثبتات والمحسنات',
    matPackaging: 'علب وتغليف وملصقات',
    matOther: 'مستلزمات أخرى',

    // Calculator Tab
    calcTitle: 'حاسبة تركيب العطور والمقادير الدقيقة',
    calcSubtitle: 'حدد سعة الزجاجة ونسبة التركيز، وسيقوم النظام بحساب أحجام وأوزان الزيوت والكحول والمثبت وتكلفتها',
    calcBottleSize: 'سعة الزجاجة',
    calcCustomSize: 'سعة مخصصة',
    calcConcentrationTier: 'درجة ونوع التركيز',
    calcOilPercent: 'نسبة الزيت العطري',
    calcFixativePercent: 'نسبة المثبت المضاف',
    calcOilSelection: 'اختيار الزيت العطري',
    calcBlendOilBtn: '+ دمج زيت آخر (Blend)',
    calcBottleMat: 'الزجاجة المستخدمة',
    calcSprayerMat: 'نوع البخاخ والغطاء',
    calcBoxMat: 'العلبة الكرتونية',
    calcAlcoholMat: 'نوع الكحول المستخدم',
    calcFixativeMat: 'نوع المثبت المستخدم',
    calcFormulationTable: 'جدول النسب والمقادير المحسوبة للزجاجة الواحدة',
    calcColComponent: 'المكون',
    calcColVolume: 'الحجم (مل)',
    calcColWeight: 'الوزن (غرام)',
    calcColRatio: 'النسبة %',
    calcColCost: 'التكلفة',
    calcCostSummary: 'ملخص التكلفة والتسعير في السوق اللبناني',
    calcCostPerBottle: 'تكلفة العبوة الواحدة',
    calcSuggestedRetail: 'سعر البيع المقترح',
    calcNetProfit: 'صافي الربح المتوقع',
    calcProfitMargin: 'هامش الربح',
    calcLebanonStandards: 'تسعير السوق اللبناني المعتمد',
    calcRetail30: 'مفرق 30 مل: 5$',
    calcRetail50: 'مفرق 50 مل: 7$',
    calcRetail100: 'مفرق 100 مل: 12$',
    calcWholesale50: 'جملة 50 مل: 4.50$',
    calcBottlesToProduce: 'عدد الزجاجات المطلوب تصنيعها في هذه التشغيلة:',
    calcExecuteBtn: 'تنفيذ وخصم المقادير من المخزون',
    calcPrintRecipeBtn: 'طباعة بطاقة التركيب المخبرية',
    calcResetBtn: 'إعادة ضبط المعادلة',
    calcStockWarning: 'تحذير: المخزون المتوفر غير كافٍ لتنفيذ هذه الكمية!',
    calcSaveAsRecipeBtn: '⭐ حفظ كوصفة مميزة',
    calcLoadRecipeBtn: '✨ خلطة من الوصفات المحفوظة',
    calcSelectRecipePlaceholder: '-- اختر خلطة جاهزة للتحميل الفوري --',

    // Recipes Tab
    recipesTitle: 'مكتبة خلطات نسمات المميزة والوصفات المحفوظة',
    recipesSubtitle: 'ابتكار وحفظ خلطات العطور الخاصة مع نسب الزيوت الدقيقة وصياغتها فورياً في الحاسبة بضغطة زر',
    recipesAddBtn: '+ ابتكار خلطة جديدة',
    recipesSearchPlaceholder: 'بحث في الخلطات، النوتات العطرية، الزيوت المكونة...',
    recipesFilterCategory: 'التصنيف:',
    recipeFilterAll: 'جميع الخلطات',
    recipeFilterSignature: 'خلطات نسمات الحصرية',
    recipeFilterMen: 'خلطات رجالية',
    recipeFilterWomen: 'خلطات نسائية',
    recipeFilterUnisex: 'خلطات للجنسين',
    recipeFilterOriental: 'عود وشرقي',
    recipeFilterFresh: 'منعش وصيفي',
    recipeFilterGourmand: 'غورماند وسهرات',
    recipeKpiTotal: 'إجمالي الخلطات المحفوظة',
    recipeKpiSignatures: 'خلطات نسمات الحصرية',
    recipeKpiAvgCost: 'متوسط تكلفة التصنيع',
    recipeKpiAvgPrice: 'متوسط سعر البيع المقترح',
    recipeFormulateInCalc: 'صياغة فورية في الحاسبة',
    recipeEdit: 'تعديل الخلطة',
    recipeDuplicate: 'نسخ الخلطة',
    recipeDelete: 'حذف الخلطة',
    recipeDeleteConfirm: 'هل أنت متأكد من حذف هذه الخلطة العطرية؟ لا يمكن التراجع عن هذا الإجراء.',
    recipeSaveModalTitle: 'حفظ التركيبة الحالية كوصفة مميزة جديدة',
    recipeEditModalTitle: 'تعديل بيانات الخلطة العطرية',
    recipeNewModalTitle: 'ابتكار وحفظ خلطة عطرية جديدة',
    recipeNameAr: 'اسم الخلطة (بالعربية)',
    recipeNameEn: 'اسم الخلطة (بالإنجليزية)',
    recipeCategory: 'تصنيف الخلطة',
    recipeTargetGender: 'الفئة المستهدفة',
    recipeSeason: 'الموسم المفضل',
    recipeBottleCapacity: 'سعة الزجاجة الافتراضية',
    recipeConcentrationTier: 'درجة التركيز',
    recipeConcentrationPercent: 'نسبة التركيز %',
    recipeFixativePercent: 'نسبة المثبت %',
    recipeRetailPrice: 'سعر البيع المقترح ($)',
    recipeOilsComposition: 'المكونات العطرية والنسب المئوية',
    recipeAddOilBtn: '+ إضافة زيت عطري آخر',
    recipeTotalPercent: 'مجموع النسب:',
    recipeMustEqual100: 'يجب أن يكون مجموع نسب الزيوت 100% تماماً',
    recipeScentPyramid: 'الهرم العطري والنوتات (قمة، قلب، قاعدة)',
    recipeDescription: 'وصف الخلطة وسر تميزها',
    recipeCompositionBar: 'مخطط توزيع نسب الزيوت في الخلطة',
    recipeBadgeMaster: 'خلطة أصلية معتمدة',
    recipeBadgeCustom: 'خلطة مخصصة',
    recipeExactMeasures: 'المقادير والعيارات المخبرية الدقيقة',
    recipeExactMeasuresSub: 'أوزان وأحجام المكونات المحسوبة بالميزان الرقمي والملل لهذه الزجاجة',
    recipeSelectBatchSize: 'اختر سعة الزجاجة لمعاينة العيارات:',
    recipeTotalOilsLabel: 'مجموع الزيوت العطرية',
    recipeAlcohol96Label: 'كحول عطور نقي 96%',
    recipeFixativeLabel: 'المثبت (Fixative)',
    recipeTotalLiquidLabel: 'إجمالي السائل النهائي',
    recipeLabSheetModalBtn: '📋 بطاقة الصياغة والخطوات المخبرية',
    recipeLabSheetModalTitle: 'بطاقة الصياغة المخبرية المعتمدة للخلطة',
    recipeLabScaleHint: 'يُفضل وزن الزيوت بالميزان الرقمي بدقة 0.01 غرام لضمان تطابق الرائحة بنسبة 100%',
    recipeStepsTitle: 'خطوات التحضير والصياغة الاحترافية (6 خطوات)',
    recipeStep1Text: '1. تعقيم القارورة بالنيتروجين أو قطرات كحول نقي والتجفيف التام.',
    recipeStep2Text: '2. وزن الزيوت العطرية بالميزان الرقمي (0.01g) بدقة قطرة بقطرة حسب الجدول أدناه.',
    recipeStep3Text: '3. التقليب والتدوير الهادئ لمدة 60 ثانية لاندماج جزيئات الزيوت العطرية.',
    recipeStep4Text: '4. إضافة المثبت النقي ومزجه بالكامل مع الزيوت.',
    recipeStep5Text: '5. سكب كحول العطور النقي 96% تدريجياً بدرجة حرارة الغرفة (20°C).',
    recipeStep6Text: '6. التعتيق (Maceration): إغلاق القارورة وحفظها في مكان مظلم وبارد (16-18°C) لمدة 14 إلى 21 يوماً للثبات والفوحان الملكي.',
    recipeLiveMeasurementsTitle: 'المقادير والعيارات الحية للزجاجة المختارة:',
    genderUnisex: 'للجنسين (Unisex)',
    genderMen: 'رجالي (Men)',
    genderWomen: 'نسائي (Women)',
    seasonAll: 'كل الفصول',
    seasonSummer: 'صيفي منعش',
    seasonWinter: 'شتوي دافئ',
    seasonAutumn: 'خريفي',
    seasonSpring: 'ربيعي',

    // Invoices Tab
    invTitle: 'إدارة فواتير الشراء والمبيع الرسمية',
    invSubtitle: 'تسجيل ومتابعة مبيعات العطور والزيوت الخام، فواتير التوريد من الموردين، وإصدار إيصالات مطبوعة وخصم المخزون',
    invNewSaleBtn: '+ فاتورة مبيع جديدة',
    invNewPurchaseBtn: '+ فاتورة شراء وتوريد',
    invSearchPlaceholder: 'بحث برقم الفاتورة، العميل، المورد، الأصناف...',
    invFilterAll: 'جميع الفواتير',
    invFilterSales: 'فواتير المبيع فقط',
    invFilterPurchases: 'فواتير الشراء فقط',
    invFilterPaid: 'المدفوعة بالكامل',
    invFilterDue: 'الآجلة / المستحقة',
    invKpiTotalSales: 'إجمالي المبيعات',
    invKpiTotalPurchases: 'إجمالي المشتريات',
    invKpiNetProfit: 'صافي أرباح المبيعات',
    invKpiDueBalance: 'الذمم والمستحقات الآجلة',
    invColNo: 'رقم الفاتورة',
    invColType: 'النوع',
    invColDate: 'التاريخ',
    invColParty: 'العميل / المورد',
    invColItemsCount: 'الأصناف',
    invColTotal: 'الإجمالي',
    invColPaid: 'المدفوع',
    invColStatus: 'الحالة',
    invColPayment: 'طريقة الدفع',
    invColActions: 'الإجراءات',
    invTypeSale: 'فاتورة مبيع',
    invTypePurchase: 'فاتورة شراء',
    invKindRetail: 'مفرق',
    invKindWholesale: 'جملة',
    invStatusPaid: 'مدفوعة',
    invStatusPartial: 'دفعة جزئية',
    invStatusDue: 'آجلة / ذمة',
    invPayCash: 'نقدي (Cash)',
    invPayWhish: 'Whish Money / OMT',
    invPayCard: 'بطاقة بنكية',
    invPayOther: 'أخرى',
    invModalNewSaleTitle: 'إنشاء فاتورة مبيع جديدة (عطور وزيوت)',
    invModalNewPurchaseTitle: 'تسجيل فاتورة شراء وتوريد مواد أولية',
    invCustomerName: 'اسم العميل / الزبون',
    invSupplierName: 'اسم المورد / الشركة',
    invPhone: 'رقم الهاتف / واتساب',
    invSaleKind: 'نوع البيع',
    invPaymentMethod: 'طريقة السداد',
    invPaymentStatus: 'حالة الدفع',
    invItemType: 'نوع الصنف',
    invItemPerfume: 'عطر جاهز معبأ (زجاجة)',
    invItemRawOil: 'زيت عطري خام بالمل',
    invItemRawMaterial: 'مواد أولية وزجاجات وتغليف',
    invItemCustom: 'صنف / خدمة مخصصة',
    invAddItemBtn: '+ إضافة صنف للفاتورة',
    invColItemName: 'الصنف / العطر',
    invColQty: 'الكمية',
    invColUnitPrice: 'سعر الوحدة',
    invColLineTotal: 'الإجمالي',
    invSubtotal: 'المجموع الفرعي',
    invDiscount: 'الخصم',
    invTax: 'الضريبة',
    invNetTotal: 'المبلغ الإجمالي النهائي',
    invPaidAmount: 'المبلغ المدفوع',
    invDueRemaining: 'المتبقي (الذمة)',
    invAutoDeductStock: 'خصم الكميات المباعة من رصيد المخزون تلقائياً',
    invAutoRestock: 'إضافة الكميات المشتراة إلى رصيد المخزون تلقائياً',
    invPrintAction: 'طباعة الفاتورة',
    invDeleteAction: 'حذف',
    invDeleteConfirm: 'هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.',
    invPrintReceipt: 'فاتورة رسمية / إيصال قبض',
    invOfficialBoutique: 'نسمات للعطور الفاخرة - بيروت',
    invThankYou: 'شكراً لتعاملكم مع نسمات للعطور الملكية',

    // Customer Storefront & Cart (صفحة الزبائن والمتجر)
    storeHeroTitle: 'بوتيك نسمات للعطور الملكية — بيروت',
    storeHeroSubtitle: 'تسوّق أرقى العطور العالمية والخلطات الحصرية بنسب تركيز وثبات عالية وفخامة لا تضاهى',
    storeKioskToggle: 'عرض المتجر للزبائن فقط',
    storeExitKiosk: 'العودة للوحة الإدارة والمختبر',
    storeSearchPlaceholder: 'ابحث عن عطر، ماركة، نوتات عطرية، فانيليا، عود، برغموت...',
    storeFilterAll: 'كل العطور',
    storeFilterSignatures: 'خلطات نسمات الحصرية ⭐',
    storeFilterMen: 'عطور رجالية 👔',
    storeFilterWomen: 'عطور نسائية 🌸',
    storeFilterUnisex: 'للجنسين 🌟',
    storeFilterOriental: 'شرقي وعود 🕌',
    storeFilterFresh: 'منعش وصيفي 🌊',
    storeFilterGourmand: 'فانيليا وحلويات 🍫',
    storeSortFeatured: 'الأكثر طلباً وشهرة',
    storeSortPriceAsc: 'السعر: من الأقل للأعلى',
    storeSortPriceDesc: 'السعر: من الأعلى للأقل',
    storeSortName: 'الاسم (أ - ي)',
    storeBottleSize: 'اختر الحجم المطلوب:',
    storeSize30ml: '30 ملل (حجم الجيب)',
    storeSize50ml: '50 ملل (الأكثر طلباً)',
    storeSize100ml: '100 ملل (حجم التوفير الفاخر)',
    storePriceTag: 'سعر المبيع:',
    storeStockStatus: 'حالة المخزون:',
    storeInStockBottles: 'متوفر للطلب الفوري',
    storeLowStockBottles: 'كمية محدودة جداً!',
    storeOutOfStockBottles: 'نفد مؤقتاً',
    storeQuantity: 'الكمية:',
    storeAddToCart: 'أضف إلى السلة',
    storeAddedToast: 'تمت إضافة العطر إلى السلة بنجاح!',
    storeViewCart: 'سلة المشتريات',
    storeCartItemsCount: 'منتجات في السلة',
    storeCartEmpty: 'سلة المشتريات فارغة حالياً',
    storeCartEmptyDesc: 'تصفح قائمة العطور والخلطات الملكية وأضف عطورك المفضلة لبدء التسوق',
    storeContinueShopping: 'متابعة التسوق',
    clearCart: 'إفراغ السلة',
    storeCartSubtotal: 'المجموع الجزئي:',
    storeCartDelivery: 'التوصيل لكافة الأراضي اللبنانية:',
    storeCartFreeDeliveryBadge: 'توصيل مجاني للطلبات فوق $25',
    storeCartTotal: 'المجموع الإجمالي:',
    storeCartLbpEstimate: 'التقدير بالليرة اللبنانية (سعر الصرف):',
    storeCustomerDetailsTitle: 'معلومات الزبون والتوصيل (الاسم، العنوان، والهاتف إلزامية)',
    storeCustomerName: '',
    storeCustomerPhone: '',
    storeCustomerCity: '',
    storeCustomerAddress: '',
    storeCustomerNotes: '',
    storeRequiredFieldsAlert: 'يرجى إدخال الاسم، والعنوان، ورقم الهاتف لإتمام الطلبية بنجاح.',
    storeCheckoutConfirm: 'تأكيد الطلب وإنشاء فاتورة مبيع',
    storeCheckoutWhatsApp: 'إرسال الطلب عبر الواتساب مباشرة 💬',
    storeOrderSuccessTitle: 'تم تأكيد طلبكم بنجاح! 🌹',
    storeOrderSuccessMsg: 'شكراً لاختياركم نسمات! تم حجز العطور من المخزون وتجهيز الفاتورة للتوصيل.',
    storeOrderNumber: 'رقم الطلب / الفاتورة:',
    storePrintReceiptBtn: 'معاينة وطباعة إيصال الطلب',
    storeNewOrderBtn: 'طلب جديد',
    storeQuickViewModalTitle: 'تفاصيل العطر واختيار الحجم المناسب',
    storeQuickViewSelectSize: 'انقر على كرت الحجم لاختيار المقاس:',
    storeSizeDesc30: 'حجم حقيبة وسفر عملي ومثالي للتنقل اليومي',
    storeSizeDesc50: 'الحجم الأكثر طلباً ورواجاً — تركيز إكستري ثبات وفوحان رائع',
    storeSizeDesc100: 'الحجم الملكي الفاخر — توفير وقيمة مضاعفة تدوم طويلاً',
    storeCardClickHint: '✨ اضغط لاختيار المقاس',
    storeSelectedBadge: 'محدد حالياً',
    storeSizeCardSelectBtn: 'اختيار هذا المقاس',

    // Catalog Excel Tab
    catalogTitle: 'جدول الأصناف والزيوت العطرية (Excel View)',
    catalogSubtitle: 'استعراض وإدارة 100 صنف من الزيوت العطرية المركزة، التكاليف، المخزون، والأسعار في لبنان',
    catalogAddOilBtn: 'إضافة زيت عطري جديد',
    catalogExportCsv: 'تصدير Excel / CSV',
    catalogSearchPlaceholder: 'بحث برقم الصنف، الاسم، الماركة المستوحاة، النوتات العطرية...',
    catalogFilterCategory: 'التصنيف:',
    catalogFilterFamily: 'العائلة العطرية:',
    catalogFilterStock: 'حالة المخزون:',
    catalogColIndex: '#',
    catalogColPhoto: 'الصورة',
    catalogColCode: 'الكود',
    catalogColName: 'اسم الزيت العطري',
    catalogColBrand: 'الماركة المستوحاة / المورد',
    catalogColFamily: 'العائلة',
    catalogColDensity: 'الكثافة (g/ml)',
    catalogColCostMl: 'التكلفة / مل',
    catalogColCostG: 'التكلفة / غرام',
    catalogColPrices: 'الأسعار في لبنان',
    catalogColStock: 'المخزون الحالي',
    catalogColStockValue: 'قيمة المخزون',
    catalogColStatus: 'الحالة',
    catalogColNotes: 'نوتات وملاحظات',
    catalogColActions: 'الإجراءات',
    catalogRestockModalTitle: 'تزويد مخزون الزيت العطري',
    catalogEditModalTitle: 'تعديل بيانات الزيت العطري',
    catalogNewModalTitle: 'إضافة زيت عطري جديد للمختبر',
    catalogFormulateAction: 'صياغة في الحاسبة',
    catalogRestockAction: 'تزويد المخزون',
    catalogEditAction: 'تعديل البيانات',
    catalogDeleteAction: 'حذف الصنف',
    catalogPhotoModalTitle: 'معاينة صورة العطر',

    // Materials Tab
    matTitle: 'المواد الأولية ومستلزمات التعبئة والتغليف',
    matSubtitle: 'إدارة الكحول العطري النقي، المثبتات، الزجاجات بمختلف الأحجام، البخاخات، والعلب الفاخرة',
    matAddBtn: 'إضافة مادة أولية جديدة',
    matSearchPlaceholder: 'بحث في المواد الأولية، الكحول، الزجاجات...',
    matColName: 'اسم المادة',
    matColCategory: 'التصنيف',
    matColCapacity: 'السعة / المواصفة',
    matColStock: 'المخزون الحالي',
    matColUnitCost: 'تكلفة الوحدة',
    matColTotalCost: 'إجمالي القيمة',
    matNewModalTitle: 'إضافة مادة أولية جديدة',
    matEditModalTitle: 'تعديل بيانات المادة الأولية',
    matRestockModalTitle: 'تزويد مخزون المادة الأولية',

    // Batches Tab
    batchTitle: 'سجل التشغيلات وتاريخ الإنتاج',
    batchSubtitle: 'أرشيف كامل لكافة دفعات العطور المصنعة مع تفاصيل التكاليف والأرباح المحققة',
    batchKpiProduced: 'إجمالي زجاجات العطور المنتجة',
    batchKpiCost: 'إجمالي تكاليف الإنتاج',
    batchKpiProfit: 'إجمالي الأرباح المتوقعة',
    batchSearchPlaceholder: 'بحث برقم التشغيلة، اسم العطر، ملاحظات...',
    batchColNo: 'رقم التشغيلة',
    batchColDate: 'تاريخ الصنع',
    batchColFormula: 'اسم العطر والتركيبة',
    batchColDetails: 'المواصفات',
    batchColQuantity: 'الكمية',
    batchColUnitCost: 'تكلفة العبوة',
    batchColTotalCost: 'التكلفة الإجمالية',
    batchColRevenue: 'المبيعات المتوقعة',
    batchColProfit: 'صافي الربح',
    batchViewCard: 'بطاقة التركيب',

    // Dashboard Tab
    dashTitle: 'لوحة الإحصائيات وإدارة المخزون',
    dashSubtitle: 'نظرة شاملة على مؤشرات الأداء، الأصول، الأصناف الأكثر تميزاً، وحالة المستودع',
    dashKpiOils: 'أصناف الزيوت العطرية',
    dashKpiMaterials: 'المواد الأولية والعبوات',
    dashKpiBatches: 'التشغيلات المنفذة',
    dashKpiTotalStock: 'إجمالي قيمة المخزون',
    dashFeaturedTitle: 'أبرز 10 عطور مطلوبة في السوق اللبناني',
    dashFeaturedSubtitle: 'عطور متكاملة جاهزة للتركيب الفوري بضغطة زر واحدة',
    dashHealthTitle: 'مؤشر سلامة وصحة المخزون',
    dashHealthSubtitle: 'متابعة الأصناف التي قاربت على النفاد لطلبها مسبقاً',
    dashSettingsTitle: 'إعدادات النظام والمتجر',
    dashSettingsSubtitle: 'تخصيص بيانات المتجر وهوية العلامة التجارية',
    dashStoreName: 'اسم المتجر / العلامة',
    dashStorePhone: 'رقم الهاتف / واتساب',
    dashStoreLocation: 'المدينة / العنوان',
    dashStoreBio: 'الوصف التعريفي',
    dashDefaultMargin: 'هامش الربح الافتراضي %',
    dashSaveSettingsBtn: 'حفظ الإعدادات',

    // Quick Search Modal
    searchModalTitle: 'دليل البحث في العطور والمواد',
    searchModalPlaceholder: 'ابحث بالاسم، النوتة العطرية، المناسبة، الكود، أو الزجاجات...',
    searchSuggestions: 'اقتراحات البحث:',
    searchTabOils: 'الزيوت والعطور',
    searchTabMaterials: 'المواد والزجاجات',
    searchActionFormulate: 'صياغة في الحاسبة',
    searchActionCatalog: 'عرض بالجدول',
    searchActionRestock: 'تزويد المخزون',
    searchEmpty: 'لم يتم العثور على نتائج تطابق بحثك',

    // Smart Search Chips
    chipBestseller: 'الأكثر طلباً',
    chipMen: 'رجالي فخم',
    chipWomen: 'نسائي جذاب',
    chipSummer: 'صيفي ومنعش',
    chipWinter: 'شتوي وغورماند',
    chipOud: 'عود وسهرات',
    chipSignature: 'تشكيلة نسمات الخاصة',
    chipLowStock: 'مخزون منخفض',

    // Recipe Card Modal
    recipeTitle: 'بطاقة تركيب وصياغة عطرية مخبرية',
    recipeBatchNo: 'رقم التشغيلة:',
    recipeDate: 'تاريخ الإنتاج:',
    recipePerfume: 'العطر المستهدف:',
    recipeBottleSize: 'سعة العبوة:',
    recipeConcentration: 'درجة التركيز:',
    recipeProducedBottles: 'عدد الزجاجات المنتجة:',
    recipeBreakdownTitle: 'المقادير الدقيقة الموزونة للتشغيلة كاملة',
    recipeInstructions: 'تعليمات التعتيق والتعبئة:',
    recipeInst1: 'رج المكونات بلطف حتى تمام الامتزاج والتجانس.',
    recipeInst2: 'حفظ الزجاجة في مكان بارد ومظلم (15-20°C) لمدة 48 ساعة على الأقل.',
    recipeInst3: 'للحصول على أقصى أداء وفوحان وثبات يفضل تعتيق العطر 7 إلى 14 يوماً.',
    recipePrintBtn: 'طباعة البطاقة المخبرية',

    // Backup & Reports Modal
    backupTitle: 'النسخ الاحتياطي وإدارة البيانات',
    backupSubtitle: 'حفظ وتصدير واسترجاع بيانات المخزون والمعادلات والتشغيلات بأمان',
    backupExportJson: 'تصدير نسخة كاملة (JSON)',
    backupImportJson: 'استيراد نسخة محفوظة (JSON)',
    backupExportExcel: 'تصدير جدول الزيوت (Excel/CSV)',
    backupResetAll: 'استعادة البيانات الافتراضية التجريبية',

    // Footer
    footerCopy: 'مختبر نسمات لصياغة وتركيب العطور • إصدار متطور 2026',
    footerAccuracy: 'نسمات • دقة حسابات بالمل والغرام وخصم فوري من المخزون',
  },

  en: {
    // Brand & Header
    brandTitle: 'Nasamat',
    brandSubtitle: '| Perfume Formulation Lab',
    brandTheme: 'ROSE GOLD & VELVET 🌹',
    brandDesc: 'Nasamat System for Fragrance Oils, Raw Materials, and Batch Formulation Calculator (ml & g)',
    portalCustomer: 'Customer Store',
    portalAdmin: 'Admin Management Portal',
    portalCustomerShort: 'Customer Page',
    portalAdminShort: 'Admin Page',
    portalCustomerDesc: 'Haute Parfumerie Boutique — Beirut 2026 Collection with Express Lebanon Delivery',
    portalAdminDesc: 'Executive Management — Inventory, Financials, Sales/Purchase Invoices & Lab Formulations',
    switchToAdmin: 'Admin Portal 🔒',
    switchToCustomer: 'Customer Store 🛍️',
    adminAuthModalTitle: 'Admin Portal Access 🔒',
    adminAuthModalSubtitle: 'Restricted area for store management and formulation lab — please enter password',
    adminPasswordLabel: 'Admin Password',
    adminPasswordPlaceholder: 'Enter admin password',
    adminPasswordError: 'Incorrect password, please try again',
    adminLoginBtn: 'Unlock Admin',
    adminLogoutBtn: 'Lock Admin / Logout 🔒',
    adminSettingsPasswordTitle: 'Admin Portal Password',
    adminSettingsPasswordDesc: 'Set the security password required to access the admin portal and protect your store data',
    adminCurrentPasswordLabel: 'Current Admin Password',
    adminNewPasswordPlaceholder: 'Enter new password',
    adminPasswordUpdated: 'Admin password updated successfully',
    smartSearchBtn: 'Quick Search',
    lowStockWarning: 'items low in stock',
    currencyLabel: 'Currency:',
    backupReportsBtn: 'Backup & Reports',
    resetDefaultsBtn: 'Reset',
    langToggleBtn: 'Arabic',

    // Navigation Tabs
    tabStore: 'Boutique & Cart',
    tabStoreBadge: 'Luxury Store',
    tabCalculator: 'Calculator & Formulation Lab',
    tabCalculatorBadge: 'Artisan Lab',
    tabRecipes: 'Signature Recipes & Blends',
    tabInvoices: 'Invoices & Billing',
    tabCatalog: 'Fragrance Catalog (Excel)',
    tabMaterials: 'Raw Materials & Bottles',
    tabBatches: 'Production Batches',
    tabDashboard: 'Analytics & Inventory Dashboard',

    // Common Actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    print: 'Print',
    export: 'Export',
    import: 'Import',
    search: 'Search',
    restock: 'Restock',
    actions: 'Actions',
    status: 'Status',
    notes: 'Notes',
    all: 'All',
    healthy: 'Optimal / In Stock',
    low: 'Low Stock',
    outOfStock: 'Out of Stock',
    ml: 'ml',
    gram: 'g',
    piece: 'pcs',

    // Categories
    catAll: 'All Scents',
    catMen: "Top Men's",
    catWomen: "Attractive Women's",
    catNiche: 'Niche, Oud & Evening',
    catSummer: 'Mediterranean Fresh',
    catWinter: 'Winter & Gourmand',
    catSignature: 'Nasamat Signature Blends',

    // Fragrance Families
    familyOriental: 'Oriental',
    familyWoody: 'Woody',
    familyFloral: 'Floral',
    familyFresh: 'Fresh / Aquatic',
    familyLeather: 'Leather / Incense',
    familyGourmand: 'Gourmand / Vanilla',
    familyCitrus: 'Citrus',
    familyAromatic: 'Aromatic',
    familyOther: 'Other',

    // Material Categories
    matBottle: 'Bottles & Flacons',
    matSprayer: 'Sprayers & Caps',
    matAlcohol: 'Perfumer Alcohol & Solvents',
    matFixative: 'Fixatives & Modifiers',
    matPackaging: 'Boxes, Packaging & Labels',
    matOther: 'Other Supplies',

    // Calculator Tab
    calcTitle: 'Perfume Formulation & Precision Lab Calculator',
    calcSubtitle: 'Select bottle size and concentration; the system computes precise volumes, weights, alcohol, fixatives, and batch costs',
    calcBottleSize: 'Bottle Size',
    calcCustomSize: 'Custom Size',
    calcConcentrationTier: 'Concentration Grade',
    calcOilPercent: 'Fragrance Oil %',
    calcFixativePercent: 'Fixative Added %',
    calcOilSelection: 'Select Fragrance Oil',
    calcBlendOilBtn: '+ Blend Another Oil',
    calcBottleMat: 'Selected Bottle',
    calcSprayerMat: 'Sprayer & Cap Type',
    calcBoxMat: 'Packaging Box',
    calcAlcoholMat: 'Perfumer Alcohol',
    calcFixativeMat: 'Fixative Modifier',
    calcFormulationTable: 'Calculated Recipe Breakdown per Single Bottle',
    calcColComponent: 'Component',
    calcColVolume: 'Volume (ml)',
    calcColWeight: 'Weight (g)',
    calcColRatio: 'Ratio %',
    calcColCost: 'Cost',
    calcCostSummary: 'Cost Breakdown & Lebanese Market Pricing',
    calcCostPerBottle: 'Cost per Single Bottle',
    calcSuggestedRetail: 'Suggested Retail Price',
    calcNetProfit: 'Expected Net Profit',
    calcProfitMargin: 'Profit Margin',
    calcLebanonStandards: 'Lebanese Market Benchmarks',
    calcRetail30: 'Retail 30ml: $5',
    calcRetail50: 'Retail 50ml: $7',
    calcRetail100: 'Retail 100ml: $12',
    calcWholesale50: 'Wholesale 50ml: $4.50',
    calcBottlesToProduce: 'Number of bottles to manufacture in this batch:',
    calcExecuteBtn: 'Execute & Deduct from Stock',
    calcPrintRecipeBtn: 'Print Lab Formulation Card',
    calcResetBtn: 'Reset Formulation',
    calcStockWarning: 'Warning: Insufficient stock to produce this quantity!',
    calcSaveAsRecipeBtn: '⭐ Save as Signature Recipe',
    calcLoadRecipeBtn: '✨ Load Saved Recipe',
    calcSelectRecipePlaceholder: '-- Select a saved recipe for instant loading --',

    // Recipes Tab
    recipesTitle: 'Signature Perfume Recipes & Master Blends Library',
    recipesSubtitle: 'Craft, preserve, and manage bespoke perfume formulations with exact oil ratios and 1-click lab formulation',
    recipesAddBtn: '+ Craft New Blend',
    recipesSearchPlaceholder: 'Search blends, scent notes, constituent oils...',
    recipesFilterCategory: 'Category:',
    recipeFilterAll: 'All Recipes',
    recipeFilterSignature: 'Nasamat Signatures',
    recipeFilterMen: "Men's Blends",
    recipeFilterWomen: "Women's Blends",
    recipeFilterUnisex: 'Unisex Blends',
    recipeFilterOriental: 'Oud & Oriental',
    recipeFilterFresh: 'Fresh & Summer',
    recipeFilterGourmand: 'Gourmand & Evening',
    recipeKpiTotal: 'Total Saved Recipes',
    recipeKpiSignatures: 'Nasamat Signatures',
    recipeKpiAvgCost: 'Avg Formulation Cost',
    recipeKpiAvgPrice: 'Avg Suggested Retail',
    recipeFormulateInCalc: 'Formulate in Lab',
    recipeEdit: 'Edit Recipe',
    recipeDuplicate: 'Duplicate Recipe',
    recipeDelete: 'Delete Recipe',
    recipeDeleteConfirm: 'Are you sure you want to delete this signature recipe? This action cannot be undone.',
    recipeSaveModalTitle: 'Save Current Blend as New Signature Recipe',
    recipeEditModalTitle: 'Edit Saved Perfume Recipe',
    recipeNewModalTitle: 'Craft & Save New Signature Recipe',
    recipeNameAr: 'Blend Name (Arabic)',
    recipeNameEn: 'Blend Name (English)',
    recipeCategory: 'Blend Category',
    recipeTargetGender: 'Target Audience',
    recipeSeason: 'Preferred Season',
    recipeBottleCapacity: 'Default Bottle Size',
    recipeConcentrationTier: 'Concentration Grade',
    recipeConcentrationPercent: 'Concentration %',
    recipeFixativePercent: 'Fixative Added %',
    recipeRetailPrice: 'Suggested Retail Price ($)',
    recipeOilsComposition: 'Fragrance Oils Composition & %',
    recipeAddOilBtn: '+ Add Another Fragrance Oil',
    recipeTotalPercent: 'Total Ratio:',
    recipeMustEqual100: 'The sum of oil percentages must equal 100% exactly',
    recipeScentPyramid: 'Olfactory Pyramid (Top, Heart, Base)',
    recipeDescription: 'Recipe Description & Creative Concept',
    recipeCompositionBar: 'Oil Composition Ratio Breakdown',
    recipeBadgeMaster: 'Master Certified Blend',
    recipeBadgeCustom: 'Custom Blend',
    recipeExactMeasures: 'Exact Laboratory Measurements & Weights',
    recipeExactMeasuresSub: 'Calculated weights (g) on digital scale and volumes (ml) for this bottle',
    recipeSelectBatchSize: 'Select bottle capacity for exact recipe ratios:',
    recipeTotalOilsLabel: 'Total Fragrance Oils',
    recipeAlcohol96Label: 'Pure Perfume Alcohol 96%',
    recipeFixativeLabel: 'Fixative',
    recipeTotalLiquidLabel: 'Total Finished Liquid',
    recipeLabSheetModalBtn: '📋 Master Lab Formulation Sheet & Method',
    recipeLabSheetModalTitle: 'Certified Master Perfume Formulation Sheet',
    recipeLabScaleHint: 'Weighing oils on a 0.01g digital scale ensures 100% olfactory consistency across batches',
    recipeStepsTitle: 'Certified 6-Step Perfume Formulation Method',
    recipeStep1Text: '1. Sanitize the glass bottle with nitrogen or pure alcohol and dry thoroughly.',
    recipeStep2Text: '2. Accurately weigh fragrance oils drop by drop on a 0.01g digital balance per formula.',
    recipeStep3Text: '3. Gently swirl in a circular motion for 60 seconds to homogenize oil molecules.',
    recipeStep4Text: '4. Add pure fixative and blend until completely dissolved.',
    recipeStep5Text: '5. Gradually pour 96% pure perfumer alcohol at room temperature (20°C).',
    recipeStep6Text: '6. Maceration: seal tightly and rest in a cool, dark environment (16-18°C) for 14-21 days for royal sillage and longevity.',
    recipeLiveMeasurementsTitle: 'Live Calculated Bottle Measurements:',
    genderUnisex: 'Unisex',
    genderMen: 'Men',
    genderWomen: 'Women',
    seasonAll: 'All Seasons',
    seasonSummer: 'Summer Fresh',
    seasonWinter: 'Winter Warm',
    seasonAutumn: 'Autumn',
    seasonSpring: 'Spring',

    // Invoices Tab
    invTitle: 'Official Sales & Purchase Invoicing',
    invSubtitle: 'Manage retail and wholesale sales, supplier purchases, stock adjustments, and printable receipts',
    invNewSaleBtn: '+ New Sales Invoice',
    invNewPurchaseBtn: '+ New Purchase Invoice',
    invSearchPlaceholder: 'Search invoice #, customer, supplier, items...',
    invFilterAll: 'All Invoices',
    invFilterSales: 'Sales Only',
    invFilterPurchases: 'Purchases Only',
    invFilterPaid: 'Fully Paid',
    invFilterDue: 'Due / Unpaid',
    invKpiTotalSales: 'Total Sales Revenue',
    invKpiTotalPurchases: 'Total Purchases',
    invKpiNetProfit: 'Net Sales Profit',
    invKpiDueBalance: 'Outstanding Due',
    invColNo: 'Invoice #',
    invColType: 'Type',
    invColDate: 'Date',
    invColParty: 'Customer / Supplier',
    invColItemsCount: 'Items',
    invColTotal: 'Total',
    invColPaid: 'Paid',
    invColStatus: 'Status',
    invColPayment: 'Payment',
    invColActions: 'Actions',
    invTypeSale: 'Sales Invoice',
    invTypePurchase: 'Purchase Invoice',
    invKindRetail: 'Retail',
    invKindWholesale: 'Wholesale',
    invStatusPaid: 'Paid',
    invStatusPartial: 'Partial',
    invStatusDue: 'Due',
    invPayCash: 'Cash',
    invPayWhish: 'Whish Money / OMT',
    invPayCard: 'Bank Card',
    invPayOther: 'Other',
    invModalNewSaleTitle: 'Create New Sales Invoice (Perfumes & Oils)',
    invModalNewPurchaseTitle: 'Record Supplier Purchase Invoice',
    invCustomerName: 'Customer Name',
    invSupplierName: 'Supplier / Company Name',
    invPhone: 'Phone / WhatsApp',
    invSaleKind: 'Sale Type',
    invPaymentMethod: 'Payment Method',
    invPaymentStatus: 'Payment Status',
    invItemType: 'Item Type',
    invItemPerfume: 'Bottled Perfume',
    invItemRawOil: 'Raw Fragrance Oil (ml)',
    invItemRawMaterial: 'Raw Materials & Bottles',
    invItemCustom: 'Custom Item',
    invAddItemBtn: '+ Add Item to Invoice',
    invColItemName: 'Item / Fragrance',
    invColQty: 'Quantity',
    invColUnitPrice: 'Unit Price',
    invColLineTotal: 'Total',
    invSubtotal: 'Subtotal',
    invDiscount: 'Discount',
    invTax: 'Tax / VAT',
    invNetTotal: 'Total Payable',
    invPaidAmount: 'Amount Paid',
    invDueRemaining: 'Remaining Due',
    invAutoDeductStock: 'Auto-deduct sold items from warehouse stock',
    invAutoRestock: 'Auto-increment stock for purchased items',
    invPrintAction: 'Print Invoice',
    invDeleteAction: 'Delete',
    invDeleteConfirm: 'Are you sure you want to delete this invoice? This action cannot be undone.',
    invPrintReceipt: 'Official Invoice / Receipt',
    invOfficialBoutique: 'Nasamat Luxury Perfumes - Beirut',
    invThankYou: 'Thank you for choosing Nasamat Royal Perfumes',

    // Customer Storefront & Cart
    storeHeroTitle: 'Nasamat Luxury Perfumes Boutique — Beirut',
    storeHeroSubtitle: 'Shop exquisite inspired fragrances & royal blends crafted with superior concentration and longevity',
    storeKioskToggle: 'Customer Kiosk View',
    storeExitKiosk: 'Back to Admin & Lab Panel',
    storeSearchPlaceholder: 'Search perfumes, inspired brands, notes, vanilla, oud, citrus...',
    storeFilterAll: 'All Perfumes',
    storeFilterSignatures: 'Nasamat Signatures ⭐',
    storeFilterMen: "Men's Top 👔",
    storeFilterWomen: "Women's 🌸",
    storeFilterUnisex: 'Unisex 🌟',
    storeFilterOriental: 'Oud & Oriental 🕌',
    storeFilterFresh: 'Fresh & Summer 🌊',
    storeFilterGourmand: 'Vanilla & Gourmand 🍫',
    storeSortFeatured: 'Featured & Best Sellers',
    storeSortPriceAsc: 'Price: Low to High',
    storeSortPriceDesc: 'Price: High to Low',
    storeSortName: 'Name (A - Z)',
    storeBottleSize: 'Select Bottle Size:',
    storeSize30ml: '30 ml (Pocket size)',
    storeSize50ml: '50 ml (Best Seller)',
    storeSize100ml: '100 ml (Luxury Value)',
    storePriceTag: 'Selling Price:',
    storeStockStatus: 'Stock Status:',
    storeInStockBottles: 'In Stock & Ready',
    storeLowStockBottles: 'Limited Stock!',
    storeOutOfStockBottles: 'Temporarily Out of Stock',
    storeQuantity: 'Quantity:',
    storeAddToCart: 'Add to Cart',
    storeAddedToast: 'Perfume added to cart successfully!',
    storeViewCart: 'Shopping Cart',
    storeCartItemsCount: 'Items in cart',
    storeCartEmpty: 'Your shopping cart is currently empty',
    storeCartEmptyDesc: 'Explore our curated royal blends and inspired collection to add your favorites',
    storeContinueShopping: 'Continue Shopping',
    clearCart: 'Clear Cart',
    storeCartSubtotal: 'Subtotal:',
    storeCartDelivery: 'Delivery across Lebanon:',
    storeCartFreeDeliveryBadge: 'Free Delivery for orders over $25',
    storeCartTotal: 'Grand Total:',
    storeCartLbpEstimate: 'Estimated in LBP (Market Rate):',
    storeCustomerDetailsTitle: 'Customer & Delivery Info (Name, Address & Phone Required)',
    storeCustomerName: '',
    storeCustomerPhone: '',
    storeCustomerCity: '',
    storeCustomerAddress: '',
    storeCustomerNotes: '',
    storeRequiredFieldsAlert: 'Please provide Name, Detailed Address, and Phone Number to complete your order.',
    storeCheckoutConfirm: 'Confirm Order & Issue Sale Invoice',
    storeCheckoutWhatsApp: 'Order via WhatsApp Directly 💬',
    storeOrderSuccessTitle: 'Order Confirmed Successfully! 🌹',
    storeOrderSuccessMsg: 'Thank you for choosing Nasamat! Your order has been reserved from stock and invoice prepared for delivery.',
    storeOrderNumber: 'Order / Invoice #:',
    storePrintReceiptBtn: 'Preview & Print Order Receipt',
    storeNewOrderBtn: 'Place Another Order',
    storeQuickViewModalTitle: 'Perfume Details & Bottle Size Selection',
    storeQuickViewSelectSize: 'Click on a card to select bottle size:',
    storeSizeDesc30: 'Handy travel & pocket size for on-the-go daily freshness',
    storeSizeDesc50: 'Bestseller ideal classic — Extrait concentration with stellar longevity',
    storeSizeDesc100: 'Royal luxury size — double volume with superior economy, ideal for gifts',
    storeCardClickHint: '✨ Click to select size',
    storeSelectedBadge: 'Selected',
    storeSizeCardSelectBtn: 'Select this size',

    // Catalog Excel Tab
    catalogTitle: 'Fragrance Oils Catalog (Excel View)',
    catalogSubtitle: 'Manage 100 concentrated fragrance oils, costs, stock levels, and Lebanese market pricing',
    catalogAddOilBtn: 'Add New Fragrance Oil',
    catalogExportCsv: 'Export Excel / CSV',
    catalogSearchPlaceholder: 'Search by code, name, inspired brand, olfactory notes...',
    catalogFilterCategory: 'Category:',
    catalogFilterFamily: 'Fragrance Family:',
    catalogFilterStock: 'Stock Status:',
    catalogColIndex: '#',
    catalogColPhoto: 'Photo',
    catalogColCode: 'Code',
    catalogColName: 'Fragrance Name',
    catalogColBrand: 'Inspired Brand / House',
    catalogColFamily: 'Family',
    catalogColDensity: 'Density (g/ml)',
    catalogColCostMl: 'Cost / ml',
    catalogColCostG: 'Cost / g',
    catalogColPrices: 'Lebanon Prices',
    catalogColStock: 'Current Stock',
    catalogColStockValue: 'Stock Value',
    catalogColStatus: 'Status',
    catalogColNotes: 'Notes & Pyramid',
    catalogColActions: 'Actions',
    catalogRestockModalTitle: 'Restock Fragrance Oil',
    catalogEditModalTitle: 'Edit Fragrance Oil Details',
    catalogNewModalTitle: 'Add New Fragrance Oil to Lab',
    catalogFormulateAction: 'Formulate in Lab',
    catalogRestockAction: 'Restock Oil',
    catalogEditAction: 'Edit Details',
    catalogDeleteAction: 'Delete Oil',
    catalogPhotoModalTitle: 'Perfume Photo Preview',

    // Materials Tab
    matTitle: 'Raw Materials & Packaging Inventory',
    matSubtitle: 'Manage pure perfumer alcohol, fixatives, glass bottles (30ml, 50ml, 100ml), sprayers, and luxury boxes',
    matAddBtn: 'Add Raw Material',
    matSearchPlaceholder: 'Search raw materials, alcohol, bottles, sprayers...',
    matColName: 'Material Name',
    matColCategory: 'Category',
    matColCapacity: 'Capacity / Spec',
    matColStock: 'Current Stock',
    matColUnitCost: 'Unit Cost',
    matColTotalCost: 'Total Value',
    matNewModalTitle: 'Add New Raw Material',
    matEditModalTitle: 'Edit Raw Material Details',
    matRestockModalTitle: 'Restock Raw Material',

    // Batches Tab
    batchTitle: 'Production Batches & Manufacturing Log',
    batchSubtitle: 'Complete archive of all manufactured perfume batches with cost and profit analytics',
    batchKpiProduced: 'Total Perfume Bottles Produced',
    batchKpiCost: 'Total Production Costs',
    batchKpiProfit: 'Total Expected Net Profit',
    batchSearchPlaceholder: 'Search by batch #, perfume name, notes...',
    batchColNo: 'Batch #',
    batchColDate: 'Date',
    batchColFormula: 'Fragrance & Formula',
    batchColDetails: 'Specs',
    batchColQuantity: 'Qty',
    batchColUnitCost: 'Unit Cost',
    batchColTotalCost: 'Total Cost',
    batchColRevenue: 'Expected Revenue',
    batchColProfit: 'Net Profit',
    batchViewCard: 'Recipe Card',

    // Dashboard Tab
    dashTitle: 'Analytics & Inventory Dashboard',
    dashSubtitle: 'Comprehensive overview of KPIs, assets, top Lebanese market performers, and warehouse health',
    dashKpiOils: 'Fragrance Oils',
    dashKpiMaterials: 'Raw Materials & Packaging',
    dashKpiBatches: 'Batches Produced',
    dashKpiTotalStock: 'Total Stock Value',
    dashFeaturedTitle: 'Top 10 High-Demand Fragrances in Lebanon',
    dashFeaturedSubtitle: 'Pre-configured master fragrances ready for instant one-click formulation',
    dashHealthTitle: 'Inventory Health & Stock Safety',
    dashHealthSubtitle: 'Monitor items nearing reorder thresholds to prevent stockouts',
    dashSettingsTitle: 'Store & System Settings',
    dashSettingsSubtitle: 'Customize boutique branding, contact details, and formulation defaults',
    dashStoreName: 'Boutique / Brand Name',
    dashStorePhone: 'Phone / WhatsApp',
    dashStoreLocation: 'City / Address',
    dashStoreBio: 'Boutique Description',
    dashDefaultMargin: 'Default Profit Margin %',
    dashSaveSettingsBtn: 'Save Settings',

    // Quick Search Modal
    searchModalTitle: 'Fragrance & Material Directory Search',
    searchModalPlaceholder: 'Search by scent name, notes, season, code, or bottles...',
    searchSuggestions: 'Quick Suggestions:',
    searchTabOils: 'Fragrance Oils',
    searchTabMaterials: 'Materials & Bottles',
    searchActionFormulate: 'Formulate in Lab',
    searchActionCatalog: 'View in Excel',
    searchActionRestock: 'Restock Stock',
    searchEmpty: 'No results matched your search query',

    // Smart Search Chips
    chipBestseller: 'Bestsellers',
    chipMen: "Men's Luxury",
    chipWomen: "Women's Allure",
    chipSummer: 'Summer Fresh',
    chipWinter: 'Winter & Gourmand',
    chipOud: 'Oud & Evening',
    chipSignature: 'Nasamat Signature',
    chipLowStock: 'Low Stock',

    // Recipe Card Modal
    recipeTitle: 'Laboratory Perfume Formulation Card',
    recipeBatchNo: 'Batch #:',
    recipeDate: 'Production Date:',
    recipePerfume: 'Fragrance Name:',
    recipeBottleSize: 'Bottle Capacity:',
    recipeConcentration: 'Concentration Grade:',
    recipeProducedBottles: 'Bottles Produced:',
    recipeBreakdownTitle: 'Exact Weighted Ingredients for Complete Batch',
    recipeInstructions: 'Maceration & Bottling Instructions:',
    recipeInst1: 'Gently swirl until oil, alcohol, and fixatives are completely homogenised.',
    recipeInst2: 'Store in a dark, temperature-controlled environment (15-20°C) for at least 48 hours.',
    recipeInst3: 'For optimal projection, sillage, and longevity, macerate between 7 to 14 days.',
    recipePrintBtn: 'Print Lab Card',

    // Backup & Reports Modal
    backupTitle: 'Backup & Data Management',
    backupSubtitle: 'Safely backup, export, and restore inventory, formulas, and batch records',
    backupExportJson: 'Export Complete Backup (JSON)',
    backupImportJson: 'Import Backup File (JSON)',
    backupExportExcel: 'Export Fragrance Oils (Excel/CSV)',
    backupResetAll: 'Reset to Factory Defaults',

    // Footer
    footerCopy: 'Nasamat Perfume Formulation Lab • Advanced Edition 2026',
    footerAccuracy: 'Nasamat • Precision formulation in ml & grams with instant stock deduction',
  },
};

export type TranslationKey = keyof typeof DICTIONARY['ar'];

export function t(key: TranslationKey, lang: Language): string {
  const dict = DICTIONARY[lang] || DICTIONARY['ar'];
  return dict[key] || DICTIONARY['ar'][key] || key;
}

/**
 * Extracts clean localized fragrance name
 * E.g. "سافاج (Sauvage Dior)" -> "Sauvage Dior (سافاج)" in English
 */
export function getLocalizedOilName(fullName: string, lang: Language): string {
  if (!fullName) return '';
  if (lang === 'ar') return fullName;
  
  // If there's an English part in parentheses: "كريد أفنتوس (Creed Aventus)"
  const match = fullName.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (/[a-zA-Z]/.test(candidate)) {
      return candidate;
    }
  }

  // If the text before parentheses is English: "Creed Aventus (كريد أفنتوس)"
  const matchEnglishBefore = fullName.match(/^([a-zA-Z0-9\s'’&.-]+)\s*\(/);
  if (matchEnglishBefore && matchEnglishBefore[1]) {
    return matchEnglishBefore[1].trim();
  }

  // If already pure English
  if (/^[a-zA-Z0-9\s'’&.,-]+$/.test(fullName.trim())) {
    return fullName.trim();
  }

  // Common fragrance mappings
  const commonMap: Record<string, string> = {
    'أفنتوس': 'Creed Aventus',
    'كريد أفنتوس': 'Creed Aventus',
    'سوفاج': 'Dior Sauvage',
    'ديور سوفاج': 'Dior Sauvage',
    'باكارات روج': 'Baccarat Rouge 540',
    'باكارات': 'Baccarat Rouge 540',
    'بلاك فانتوم': 'Black Phantom',
    'توباكو فانيلا': 'Tobacco Vanille',
    'توسكان ليدر': 'Tuscan Leather',
    'ليبر': 'YSL Libre',
    'ليبر إنتنس': 'YSL Libre Intense',
    'بلو دي شانيل': 'Bleu de Chanel',
    'شانيل بلو': 'Bleu de Chanel',
    'شانيل نمرة 5': 'Chanel No. 5',
    'عود وود': 'Oud Wood',
    'توم فورد عود وود': 'Tom Ford Oud Wood',
    'عنبر نوي': 'Ambre Nuit',
    'عود أصفهان': 'Oud Ispahan',
    'غري ديور': 'Gris Dior',
    'سكاندال': 'Scandal',
    'إنفيكتوس': 'Invictus',
    'ون ميليون': '1 Million',
    'لا في إي بيل': 'La Vie Est Belle',
    'سيكريت بومبشيل': 'Bombshell',
    'سترونجر ويذ يو': 'Stronger With You',
    'أكوا دي جيو': 'Acqua Di Gio',
    'سوفريج': 'Dior Sauvage',
    'هافاتي': 'Halfeti',
    'سيدرات بوازيه': 'Cedrat Boise',
    'رد توباكو': 'Red Tobacco',
    'إمبريال فالي': 'Imperial Valley',
    'خلطة الملوك': 'Royal Blend',
    'خلطة نسمات': 'Nasamat Signature Blend',
    'مسك الطهارة': 'Pure White Musk',
    'مسك الرمان': 'Pomegranate Musk',
    'عود ملكي': 'Royal Agarwood',
  };

  for (const [arKey, enVal] of Object.entries(commonMap)) {
    if (fullName.includes(arKey)) {
      return enVal;
    }
  }

  // Clean out Arabic characters if Latin exists
  const latinOnly = fullName.replace(/[\u0600-\u06FF()]/g, '').trim();
  if (latinOnly.length >= 3) {
    return latinOnly;
  }

  // If purely Arabic with no match, return a clean English title instead of Arabic
  return 'Nasamat Private Reserve';
}

/**
 * Translates fragrance notes and olfactory pyramid terms to English
 */
export function getLocalizedNotes(notesText: string, lang: Language): string {
  if (!notesText || lang === 'ar') return notesText;

  let result = notesText;
  // Normalize Arabic prefixes before replacing
  result = result.replace(/ال(?=[\u0600-\u06FF])/g, '');
  result = result.replace(/ال([A-Za-z])/g, '$1');

  const notesMap: [RegExp, string][] = [
    // Marketing & Subtitle descriptors
    [/-\s*الرقم 1 مبيعاً في لبنان للرجال/gi, '• #1 Best Seller in Lebanon'],
    [/-\s*كلاسيكي راقي صيفي وشتوي/gi, '• All-Season Timeless Classic'],
    [/-\s*ملك العطور الرجالية/gi, '• The King of Men Fragrances'],
    [/-\s*ملكة العطور النسائية في بيروت/gi, '• Beirut Queen of Scents'],
    [/-\s*فخم جداً شتوي/gi, '• Opulent Luxury Signature'],
    [/-\s*شبابي رياضي عالي الفوحان/gi, '• Vibrant High-Sillage Sport'],
    [/الأكثر طلباً وتوفيراً|الأكثر طلباً|الأكثر مبيعاً/gi, 'Best Seller'],
    [/خلطة ملكية|خلطة خاصة/gi, 'Royal Signature Blend'],

    // Raw Olfactory Notes
    [/برغموت كاليبريا|برغموت كالابريا|برغموت/gi, 'Bergamot'],
    [/فلفل سيتشوان|فلفل أسود|فلفل وردي|فلفل/gi, 'Pepper'],
    [/خزامى بروفانس|خزامى|لافندر/gi, 'Lavender'],
    [/باتشولي إندونيسي|باتشولي/gi, 'Patchouli'],
    [/إبرة الراعي/gi, 'Geranium'],
    [/أمبروكسان نقي|أمبروكسان/gi, 'Ambroxan'],
    [/خشب الأرز الأطلسي|خشب الأرز|أرز/gi, 'Cedarwood'],
    [/خشب الصندل/gi, 'Sandalwood'],
    [/عنبر الحوت|عنبر أبيض|عنبر ملكي|عنبر/gi, 'Ambergris / Amber'],
    [/أناناس ملكي مدخن|أناناس ملكي|أناناس/gi, 'Smoked Pineapple'],
    [/تفاح فرنسي|تفاح أخضر|تفاح/gi, 'Apple'],
    [/كشمش أسود/gi, 'Blackcurrant'],
    [/زعفران كشميري|زعفران نقي|زعفران/gi, 'Saffron'],
    [/لوز مر|لوز محمص|لوز/gi, 'Bitter Almond'],
    [/ياسمين مصري|ياسمين غرانديفلوروم|ياسمين/gi, 'Jasmine'],
    [/مسك أبيض|مسك الحرير|مسك نقي|مسك/gi, 'White Musk'],
    [/فانيليا مدغشقر|فانيليا بوردو|فانيليا/gi, 'Bourbon Vanilla'],
    [/حبوب التونكا|تونكا فنزويلية|تونكا/gi, 'Tonka Bean'],
    [/جلد إيطالي|جلود مدبوغة|جلود فاخرة|جلود|جلد/gi, 'Italian Leather'],
    [/عود كمبودي|عود هندي معتق|عود ملكي|عود/gi, 'Royal Oud'],
    [/بخور عماني|بخور ملكي|بخور/gi, 'Royal Incense'],
    [/نوتات مائية|نوتات بحرية|أكوا/gi, 'Aquatic Marine Notes'],
    [/هيل غواتيمالي|هيل أخضر|هيل/gi, 'Cardamom'],
    [/قرفة سيلانية|قرفة/gi, 'Ceylon Cinnamon'],
    [/زهر البرتقال|نيرولي/gi, 'Orange Blossom & Neroli'],
    [/فيتيفر هايتي|فيتيفر|نجيل الهند/gi, 'Haitian Vetiver'],
    [/كراميل مملح|كراميل/gi, 'Salted Caramel'],
    [/توت بري|توت العليق|توت/gi, 'Wild Berries'],
    [/ماندارين صقلي|ماندارين|يوسفي/gi, 'Sicilian Mandarin'],
    [/جريب فروت وردي|جريب فروت/gi, 'Pink Grapefruit'],
    [/ليمون إيطالي|ليمون صقلي|ليمون/gi, 'Italian Lemon'],
    [/ورد تركي|ورد بلغاري|ورد مجفف/gi, 'Turkish Damascena Rose'],
    [/ليتشي/gi, 'Lychee'],
    [/راوند/gi, 'Rhubarb'],
    [/سوسن فاخر|سوسن/gi, 'Noble Florentine Iris'],
    [/بذور خبازي/gi, 'Ambrette Seeds'],
    [/ورق غار/gi, 'Bay Leaf'],
    [/صمغ إليمي|إليمي/gi, 'Elemi Resin'],
    [/لابدانوم/gi, 'Labdanum'],
    [/خشب بتولا مدخن|خشب بتولا|بتولا/gi, 'Smoked Birch Wood'],
    [/طحلب بلوط|طحلب سنديان|أوكموس/gi, 'Oakmoss'],
    [/أيزو إي سوبر|ايزو اي سوبر/gi, 'Iso E Super'],
    [/قهوة محمصة|قهوة/gi, 'Roasted Coffee'],
    [/شوكولاتة داكنة|كاكاو/gi, 'Dark Chocolate'],
    [/راتنج البنزوين|بنزوين/gi, 'Benzoin'],
    [/تبغ كوبي|أوراق التبغ|تبغ/gi, 'Cuban Tobacco'],
    [/عسل بري|عسل/gi, 'Wild Honey'],
    [/شاي أخضر|شاي أسود/gi, 'Tea Accords'],
    [/زهور فرنسية|زهور بيضاء|زهور/gi, 'French Florals'],
    [/فواكه مدخنة|فواكه استوائية|فواكه/gi, 'Smoked Fruits'],
    [/حمضيات منعشة/gi, 'Fresh Citrus'],
    [/توابل دافئة وحارة|توابل حارة/gi, 'Warm & Spicy'],
    [/عنبري عميق|عنبري دافئ/gi, 'Deep Amber'],
    [/أروماتيك رجالي|أروماتيك دافئ|أروماتك/gi, 'Warm Aromatic'],
    [/أروماتيك استثنائي|أروماتيك/gi, 'Refined Aromatic'],
    [/خشبي راقٍ|خشبي عميق|خشبي/gi, 'Refined Woody'],
    [/بخور شرقي|بخور ملكي/gi, 'Oriental Incense'],
    [/جلدي ملكي|جلدي/gi, 'Royal Italian Leather'],
    [/زهري أنيق|زهري ناعم/gi, 'Elegant Floral'],
    [/سكري ولذيذ|غورماند/gi, 'Gourmand & Sweet'],
    [/بودري ناعم|بودري/gi, 'Soft Powdery'],
    [/زنجبيل منعش|زنجبيل/gi, 'Fresh Ginger'],
    [/جوزة الطيب/gi, 'Nutmeg'],
    [/افتتاحية حارة/gi, 'Spicy Opening'],
    [/قلب زهري/gi, 'Floral Heart'],
    [/قاعدة خشبية/gi, 'Woody Base'],

    // Descriptors & Origins
    [/إيطالي|إيطالية/gi, 'Italian'],
    [/فرنسي|فرنسية/gi, 'French'],
    [/مغربي|مغربية/gi, 'Moroccan'],
    [/صقلي|صقلية/gi, 'Sicilian'],
    [/كشميري|كشميرية/gi, 'Kashmiri'],
    [/مدخن|مدخنة/gi, 'Smoked'],
    [/نقي|صافي/gi, 'Pure'],
    [/ملكي|ملكية/gi, 'Royal'],
    [/فاخر|فاخرة/gi, 'Luxury'],
    [/نادر/gi, 'Rare'],
    [/مقرمش|مقرمشة/gi, 'Crisp'],
    [/فوار|فوارة/gi, 'Sparkling'],
    [/حار|حارة/gi, 'Spicy'],
    [/ناعم|ناعمة/gi, 'Smooth'],
    [/دافئ|دافئة/gi, 'Warm'],
    [/منعش|منعشة/gi, 'Fresh']
  ];

  for (const [pattern, replacement] of notesMap) {
    result = result.replace(pattern, replacement);
  }

  // Replace common connectives
  result = result
    .replace(/و\s*/g, ', ')
    .replace(/مع\s*/g, 'with ')
    .replace(/من\s*/g, 'of ')
    .replace(/في\s*/g, 'in ')
    .replace(/بلمسة\s*/g, 'with a touch of ')
    .replace(/نفحات\s*/g, 'notes of ')
    .replace(/مزيج\s*/g, 'blend of ');

  // Strip trailing Arabic relative suffixes attached to English words (e.g. Leatherي -> Leather)
  result = result.replace(/([A-Za-z])(?:ي|ة|ات|ية)\b/g, '$1');

  // Purge any remaining Arabic characters completely
  if (/[\u0600-\u06FF]/.test(result)) {
    result = result.replace(/[\u0600-\u06FF]/g, '').trim();
  }

  // Format commas and clean double spaces
  result = result
    .replace(/[،؛]/g, ',')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(,\s*)+/g, ', ')
    .replace(/\s*-\s*-+\s*/g, ' - ')
    .replace(/\s*-\s*(\d+)?\s*(in)?\s*$/gi, '')
    .replace(/^,\s*|,\s*$/g, '')
    .replace(/^\s*-\s*|\s*-\s*$/g, '')
    .trim();

  if (result.length < 3) {
    return 'Bergamot, Ambergris, Royal Woods & Pure French Florals';
  }
  return result;
}

/**
 * Localizes Brand/Supplier name
 */
export function getLocalizedBrand(brand: string, lang: Language): string {
  if (lang === 'ar') return brand;
  if (!brand) return 'Nasamat';
  if (brand.includes('نسمات')) return 'Nasamat';
  if (brand.includes('لوزي')) return 'Luzi (Switzerland)';
  if (brand.includes('جيفودان')) return 'Givaudan (Switzerland)';
  if (brand.includes('مان')) return 'Mane (France)';
  if (brand.includes('تشكيلة نسمات الخاصة')) return 'Nasamat Signature Collection';
  if (brand.includes('فروماكس')) return 'Fromax (France)';
  if (brand.includes('آي إف إف')) return 'IFF (USA)';
  if (brand.includes('إس بي آي') || brand.includes('CPL')) return 'CPL Aromas (UK)';
  if (brand.includes('سيمرايز')) return 'Symrise (Germany)';
  if (brand.includes('فيرمنيش')) return 'Firmenich (Switzerland)';
  
  // Extract english in parentheses if present
  const match = brand.match(/\(([^)]+)\)/);
  if (match && match[1]) return match[1].replace(/[\u0600-\u06FF]/g, '').trim();

  // If Latin exists
  const latinOnly = brand.replace(/[\u0600-\u06FF()]/g, '').trim();
  if (latinOnly.length >= 2) return latinOnly;

  return 'Nasamat';
}

/**
 * Localizes Fragrance Family
 */
export function getLocalizedFamily(family: FragranceFamily, lang: Language): string {
  if (lang === 'ar') {
    switch (family) {
      case 'oriental': return 'شرقي';
      case 'woody': return 'خشبي';
      case 'floral': return 'زهري';
      case 'fresh': return 'منعش / أكوا';
      case 'leather': return 'جلدي / بخور';
      case 'gourmand': return 'غورماند / فانيليا';
      case 'citrus': return 'حمضيات';
      case 'aromatic': return 'أروماتك';
      case 'other': return 'أخرى';
      default: return family;
    }
  } else {
    switch (family) {
      case 'oriental': return 'Oriental';
      case 'woody': return 'Woody';
      case 'floral': return 'Floral';
      case 'fresh': return 'Fresh / Aquatic';
      case 'leather': return 'Leather / Smoky';
      case 'gourmand': return 'Gourmand / Sweet';
      case 'citrus': return 'Citrus';
      case 'aromatic': return 'Aromatic';
      case 'other': return 'Other';
      default: return family;
    }
  }
}

/**
 * Localizes Audience / Scent Category
 */
export function getLocalizedCategory(category: string, lang: Language): string {
  if (lang === 'ar') return category;
  if (category.includes('رجالي')) return "Top Men's";
  if (category.includes('نسائي')) return "Attractive Women's";
  if (category.includes('نيش') || category.includes('سهرات') || category.includes('عود')) return 'Niche, Oud & Evening';
  if (category.includes('صيفي')) return 'Mediterranean Fresh';
  if (category.includes('شتوي')) return 'Winter & Gourmand';
  if (category.includes('نسمات')) return 'Nasamat Signature Blends';
  if (category.includes('الكل') || category === 'all') return 'All Scents';
  return category;
}

/**
 * Localizes Material Name
 */
export function getLocalizedMaterialName(name: string, lang: Language): string {
  if (lang === 'ar') return name;
  if (name.includes('كحول إيثيلي')) return 'Pure Perfumer Ethanol 96% (Treated for Perfumes)';
  if (name.includes('مثبت عطور جلايكول')) return 'Perfume Fixative (DPG / Glucam P-20)';
  if (name.includes('أمبروكسان نقي')) return 'Pure Ambroxan Micro-powder (Diffuser Booster)';
  if (name.includes('آيزو إي سوبر')) return 'Iso E Super (Velvet Sillage & Aura)';
  if (name.includes('زجاجة فاخرة كريستال 50')) return 'Luxury Crystal Bottle 50ml (Cylindrical)';
  if (name.includes('زجاجة بريميوم 100')) return 'Premium Heavy-Base Bottle 100ml';
  if (name.includes('زجاجة جيب 30')) return 'Pocket Spray Bottle 30ml (Fine Mist)';
  if (name.includes('بخاخ فاخر ذهبي')) return 'Rose Gold Luxury Sprayer Pump 18mm';
  if (name.includes('بخاخ فضي كروم')) return 'Silver Chrome Sprayer with Magnetic Cap';
  if (name.includes('علبة نسمات الملكية الفاخرة 50')) return 'Nasamat Royal Velvet Box 50ml';
  if (name.includes('علبة نسمات الملكية الفاخرة 100')) return 'Nasamat Royal Velvet Box 100ml';
  if (name.includes('علبة نسمات الفاخرة 30')) return 'Nasamat Luxury Box 30ml';
  if (name.includes('مضخات وسرنجات')) return 'Laboratory Syringes & Pipettes (10ml & 50ml)';
  if (name.includes('قمع صب زجاجي')) return 'Mini Laboratory Glass Funnel';

  // If already has english
  const match = name.match(/\(([^)]+)\)/);
  if (match && match[1]) return match[1];
  return name;
}

/**
 * Localizes Material Category
 */
export function getLocalizedMaterialCategory(category: MaterialCategory, lang: Language): { label: string; icon: string } {
  if (lang === 'ar') {
    switch (category) {
      case 'bottle': return { label: 'الزجاجات والعبوات', icon: '🏺' };
      case 'sprayer': return { label: 'البخاخات والأغطية', icon: '✨' };
      case 'alcohol': return { label: 'كحول ومذيبات العطور', icon: '🧪' };
      case 'fixative': return { label: 'المثبتات والمحسنات', icon: '💧' };
      case 'packaging': return { label: 'علب وتغليف وملصقات', icon: '📦' };
      case 'other': return { label: 'مستلزمات أخرى', icon: '📎' };
      default: return { label: category, icon: '📦' };
    }
  } else {
    switch (category) {
      case 'bottle': return { label: 'Bottles & Flacons', icon: '🏺' };
      case 'sprayer': return { label: 'Sprayers & Caps', icon: '✨' };
      case 'alcohol': return { label: 'Perfumer Alcohol', icon: '🧪' };
      case 'fixative': return { label: 'Fixatives & Modifiers', icon: '💧' };
      case 'packaging': return { label: 'Boxes & Packaging', icon: '📦' };
      case 'other': return { label: 'Other Accessories', icon: '📎' };
      default: return { label: category, icon: '📦' };
    }
  }
}

/**
 * Localizes Concentration Tiers
 */
export function getLocalizedTier(tier: ConcentrationTier, lang: Language): { label: string; desc: string; defaultPercent: number } {
  if (lang === 'en') {
    switch (tier) {
      case 'edc':
        return {
          label: 'Eau de Cologne (EDC)',
          desc: 'Light & refreshing (3% - 5%) - lasts ~2 hours',
          defaultPercent: 5,
        };
      case 'edt':
        return {
          label: 'Eau de Toilette (EDT)',
          desc: 'Moderate daily wear (8% - 15%) - lasts 3 - 5 hours',
          defaultPercent: 12,
        };
      case 'edp':
        return {
          label: 'Eau de Parfum (EDP)',
          desc: 'Most popular & optimal (EDP) - lasts 6 - 8 hours',
          defaultPercent: 22,
        };
      case 'extrait':
        return {
          label: 'Extrait de Parfum',
          desc: 'Ultra-luxurious pure extract (Extrait) - lasts 12+ hours',
          defaultPercent: 30,
        };
      case 'pure_oil':
        return {
          label: 'Pure Concentrated Oil (CPO)',
          desc: '100% pure undiluted perfume oil without alcohol',
          defaultPercent: 100,
        };
      case 'custom':
        return {
          label: 'Custom Formulation',
          desc: 'Manual percentage adjustment based on customer preference',
          defaultPercent: 20,
        };
    }
  }

  // Arabic
  switch (tier) {
    case 'edc':
      return {
        label: 'أو دو كولونيا (Eau de Cologne)',
        desc: 'تركيز خفيف ومنعش (3% - 5%) - يدوم ساعتين تقريباً',
        defaultPercent: 5,
      };
    case 'edt':
      return {
        label: 'أو دو تواليت (Eau de Toilette)',
        desc: 'تركيز يومي معتدل (8% - 15%) - يدوم 3 - 5 ساعات',
        defaultPercent: 12,
      };
    case 'edp':
      return {
        label: 'أو دو بارفان (Eau de Parfum)',
        desc: 'التركيز الأكثر طلباً ومثالية (EDP) - ثبات 6 - 8 ساعات',
        defaultPercent: 22,
      };
    case 'extrait':
      return {
        label: 'إكستري دي بارفان (Extrait de Parfum)',
        desc: 'خلاصة عطرية مركزة ملكية (Extrait) - ثبات عالي جداً +12 ساعة',
        defaultPercent: 30,
      };
    case 'pure_oil':
      return {
        label: 'زيت مركز نقي 100% (دهن عطر)',
        desc: 'زيت عطري خام نقي 100% خالي تماماً من الكحول',
        defaultPercent: 100,
      };
    case 'custom':
      return {
        label: 'تركيز مخصص (Custom)',
        desc: 'تحديد النسبة المئوية يدوياً حسب رغبة العميل',
        defaultPercent: 20,
      };
  }
}

/**
 * Localizes Recipe Category
 */
export function getLocalizedRecipeCategory(cat: RecipeCategory, lang: Language): { label: string; icon: string } {
  if (lang === 'ar') {
    switch (cat) {
      case 'signature': return { label: 'خلطات نسمات الحصرية', icon: '⭐' };
      case 'men': return { label: 'خلطات رجالية', icon: '👔' };
      case 'women': return { label: 'خلطات نسائية', icon: '🌸' };
      case 'unisex': return { label: 'خلطات للجنسين', icon: '✨' };
      case 'oriental': return { label: 'عود ونفحات شرقية', icon: '🕌' };
      case 'fresh': return { label: 'منعش وصيفي', icon: '🌊' };
      case 'gourmand': return { label: 'غورماند وفانيليا', icon: '🍫' };
      case 'custom': return { label: 'خلطة مخصصة', icon: '🧪' };
      default: return { label: cat, icon: '✨' };
    }
  } else {
    switch (cat) {
      case 'signature': return { label: 'Nasamat Signatures', icon: '⭐' };
      case 'men': return { label: "Men's Blends", icon: '👔' };
      case 'women': return { label: "Women's Blends", icon: '🌸' };
      case 'unisex': return { label: 'Unisex Blends', icon: '✨' };
      case 'oriental': return { label: 'Oud & Oriental', icon: '🕌' };
      case 'fresh': return { label: 'Fresh & Summer', icon: '🌊' };
      case 'gourmand': return { label: 'Gourmand & Vanilla', icon: '🍫' };
      case 'custom': return { label: 'Custom Blend', icon: '🧪' };
      default: return { label: cat, icon: '✨' };
    }
  }
}

/**
 * Localizes Target Gender
 */
export function getLocalizedGender(gender: 'unisex' | 'men' | 'women' | undefined, lang: Language): string {
  if (lang === 'ar') {
    if (gender === 'men') return 'رجالي';
    if (gender === 'women') return 'نسائي';
    return 'للجنسين';
  } else {
    if (gender === 'men') return 'Men';
    if (gender === 'women') return 'Women';
    return 'Unisex';
  }
}

/**
 * Localizes Season
 */
export function getLocalizedSeason(season: 'all' | 'summer' | 'winter' | 'autumn' | 'spring' | undefined, lang: Language): string {
  if (lang === 'ar') {
    switch (season) {
      case 'summer': return 'صيفي';
      case 'winter': return 'شتوي';
      case 'autumn': return 'خريفي';
      case 'spring': return 'ربيعي';
      default: return 'كل الفصول';
    }
  } else {
    switch (season) {
      case 'summer': return 'Summer';
      case 'winter': return 'Winter';
      case 'autumn': return 'Autumn';
      case 'spring': return 'Spring';
      default: return 'All Seasons';
    }
  }
}
