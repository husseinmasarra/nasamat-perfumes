import type { FragranceOil, SavedRecipe, PerfumeOlfactoryProfile, FragranceFamily } from '../types';

/**
 * Curated Olfactory Database for Iconic Haute Parfumerie Fragrances & Signatures
 */
export const CURATED_PERFUME_PROFILES: Record<string, PerfumeOlfactoryProfile> = {
  // --- Dior Sauvage ---
  'sauvage': {
    storyAr: 'عطر الجاذبية الرجالية الخام والانطلاق اللامحدود. يفتتح العطر بنسمات برغموت كالابريا العاصف المشبع برائحة الفلفل الحار، ليتحول إلى قلب أروماتيكي نقي يعانق قاعدة أسطورية من الأمبروكسان وخشب الأرز تمنح حضوراً كاريزمياً لا يُنسى.',
    storyEn: 'A composition of raw freshness and magnetic masculine power, combining zesty Calabrian bergamot with fiery pepper and an unforgettable ambroxan trail.',
    topNotes: ['برغموت كالابريا الفوار', 'فلفل سيتشوان الحار', 'رذاذ الفلفل الأسود'],
    heartNotes: ['خزامى بروفانس الأروماتي', 'فلفل وردي', 'إبرة الراعي', 'صمغ الإليمي الراتنجي'],
    baseNotes: ['أمبروكسان نقي فائق الثبات', 'خشب الأرز الأطلسي', 'اللابدانوم الدافئ'],
    accords: ['حمضيات منعشة', 'توابل دافئة وحارة', 'عنبري عميق', 'أروماتيك رجالي'],
    vibeAr: 'كاريزما رجالية طاغية وجاذبية لافتة للأنظار',
    gender: 'men',
    genderAr: 'عطر رجالي كاريزمي (الأكثر مبيعاً)',
    season: 'all',
    seasonAr: 'مثالي لجميع الفصول والمناخات',
    occasionAr: 'المناسبات، العمل، اللقاءات الخاصة والاستخدام اليومي الراقي',
    longevityAr: 'ثبات فائق يدوم 24 - 48 ساعة على الملابس (Extrait de Parfum)',
    sillageAr: 'فوحان قوي يترك أثراً فخماً أينما مررت',
    concentrationAr: 'Extrait de Parfum تركيز نيش مضاعف',
  },

  // --- Bleu de Chanel ---
  'bleu-de-chanel': {
    storyAr: 'تجسيد الأناقة الباريسية والحرية المطلقة. يمتزج فيه بريق الجريب فروت والليمون الحامض مع أسرار البخور الشرقي وأخشاب الصندل الكاليدوني، مما يجعله العطر الأزرق الأكثر رقياً وفخامة في تاريخ العطور.',
    storyEn: 'An ode to masculine freedom with captivating citrus freshness over a rich base of frankincense and Caledonian sandalwood.',
    topNotes: ['الجريب فروت الصقلي', 'ليمون إيطالي', 'نعناع بارد', 'فلفل وردي'],
    heartNotes: ['زنجبيل منعش', 'جوزة الطيب', 'ياسمين ناعم', 'أيزو إي سوبر'],
    baseNotes: ['البخور الملكي المدخن', 'خشب الصندل الكاليدوني', 'خشب الأرز', 'الباتشولي'],
    accords: ['حمضيات منعشة', 'خشبي راقٍ', 'بخور شرقي', 'أروماتيك دافئ'],
    vibeAr: 'أناقة ملكية كلاسيكية ورقي هادئ يفرض احترامه',
    gender: 'men',
    genderAr: 'عطر رجالي كلاسيكي راقٍ',
    season: 'all',
    seasonAr: 'مناسب لكافة فصول السنة صيفاً وشتاءً',
    occasionAr: 'الاجتماعات الرسمية، الأعمال، والسهرات الراقية',
    longevityAr: 'ثبات يدوم 24 - 36 ساعة على الملابس',
    sillageAr: 'فوحان ناعم وممتد يفيض جاذبية وغموضاً',
    concentrationAr: 'Extrait de Parfum فاخر',
  },

  // --- Creed Aventus ---
  'creed-aventus': {
    storyAr: 'عطر القوة والانتصار ورمز القيادة الملكية. استلهم من حياة الأباطرة العظماء؛ يمتزج فيه عبير الأناناس الدخاني والتفاح المقرمش مع خشب البتولا والباتشولي النبيل، وينتهي بقاعدة مسكية عنبرية تأسر الحواس وتفرض هيبة لا تضاهى.',
    storyEn: 'The king of luxury fragrances celebrating strength, success and vision with smoky blackcurrant, pineapple, and rich birch wood.',
    topNotes: ['أناناس ملكي مدخن', 'برغموت إيطالي', 'كشمش أسود فرنسي', 'تفاح أخضر مقرمش'],
    heartNotes: ['خشب البتولا المدخن', 'باتشولي نقي', 'ياسمين مغربي', 'ورد مجفف'],
    baseNotes: ['عنبر الحوت النادر', 'مسك أبيض ملكي', 'طحلب البلوط', 'فانيليا ناعمة'],
    accords: ['فواكه مدخنة', 'خشبي جلدي', 'مسكي نقي', 'أروماتيك استثنائي'],
    vibeAr: 'هيبة قيادية، نجاح مطلق، وفخامة لا يمكن تجاهلها',
    gender: 'men',
    genderAr: 'عطر النخبة والرجال القياديين',
    season: 'all',
    seasonAr: 'استثنائي في الربيع، الصيف والخريف',
    occasionAr: 'المناسبات الكبرى، حفلات الزفاف، واجتماعات كبار الشخصيات',
    longevityAr: 'ثبات يدوم 36 - 48 ساعة على الأقمشة',
    sillageAr: 'فوحان أسطوري ملحوظ يجذب الإطراء أينما تواجدت',
    concentrationAr: 'Extrait de Parfum نيش ملكي',
  },

  // --- Baccarat Rouge 540 Extrait ---
  'baccarat-rouge-540': {
    storyAr: 'التحفة الكريستالية التي قلبت موازين العطور العالمية. سيمفونية ساحرة من الزعفران النادر واللوز المر تذوب في دفء خشب الأرز وعنبر الحوت، لتمنح إحساساً بالنقاء المخملي والترف الذي لا يقاوم.',
    storyEn: 'A luminous and intense fragrance where Egyptian grandiflorum jasmine and saffron blend with bitter almond and sensual ambergris.',
    topNotes: ['زعفران كشميري أحمر', 'لوز مر فاخر', 'برتقال دموي'],
    heartNotes: ['ياسمين مصري جرانديفلوروم', 'خشب الأرز الأطلسي', 'عنبر أبيض كريستالي'],
    baseNotes: ['عنبر الحوت الحقيقي', 'إيفرنيل مخملي', 'مسك خشبي دافئ'],
    accords: ['عنبري سكري دافئ', 'لوز مكرمل', 'خشبي فاخر', 'زعفراني نبيل'],
    vibeAr: 'ترف مخملي باذخ، سحر حسي، وثراء استثنائي',
    gender: 'unisex',
    genderAr: 'عطر النيش الملكي الأرقى للجنسين',
    season: 'all',
    seasonAr: 'ساحر في الخريف، الشتاء، والأمسيات المعتدلة',
    occasionAr: 'السهرات الفخمة، اللقاءات الرومانسية، والمناسبات المميزة',
    longevityAr: 'ثبات خارق يدوم لأيام على الملابس والمعاطف',
    sillageAr: 'فوحان مغناطيسي يملأ المكان بنعومة وثبات دائم',
    concentrationAr: '28% Extrait de Parfum فائق التركيز',
  },

  // --- Ombre Nomade ---
  'ombre-nomade': {
    storyAr: 'رحلة أسطورية في أعماق الصحراء تحت سماء مرصعة بالنجوم. يلتقي عود أسام الداكن مع رقة الورد البتلي وعبق البخور والزعفران، ليكتب ملحمة عطرية شرقية من العيار الثقيل لمن يعشق التميز المطلق.',
    storyEn: 'An immortal vortex of dark oud wood, fiery incense, benzoin tears, and gentle hints of raspberry designed for connoisseurs of raw opulence.',
    topNotes: ['توت العليق الأسود', 'زعفران إيراني دافئ', 'بخور البخور الصومالي'],
    heartNotes: ['عود أسام الطبيعي الداكن', 'ورد سنتيفوليا المائي', 'بتولا قطبي'],
    baseNotes: ['بنزوين دموي دافئ', 'جلد فاخر مدخن', 'عنبر داكن'],
    accords: ['عود مدخن', 'جلدي شرقي', 'بخور عميق', 'ورد مخملي'],
    vibeAr: 'فخامة هائلة، حضور مهيب، وعظمة شرقية لا مثيل لها',
    gender: 'unisex',
    genderAr: 'عطر شرقي نيش فاخر للجنسين',
    season: 'winter',
    seasonAr: 'مثالي للشتاء، الخريف، والأجواء الباردة',
    occasionAr: 'الأعراس، المناسبات الرسمية، والسهرات الكبرى',
    longevityAr: 'ثبات دائم يتجاوز 48 ساعة على الملابس',
    sillageAr: 'فوحان هائل يملأ المكان بقوة وثقة مطلقة',
    concentrationAr: '30% Extrait de Parfum عالي الفخامة',
  },

  // --- Parfums de Marly Delina ---
  'delina': {
    storyAr: 'العطر الأنثوي الأكثر إثارة وإعجاباً حول العالم. باقة مخملية ساحرة من الورد التركي والفاوانيا محاطة بحلاوة الليتشي وانتعاش الراوند والبرغموت، لتجسد الرقة الملكية وجاذبية الأنوثة الطاغية.',
    storyEn: 'A sensual bouquet dominated by Turkish rose, lily of the valley and peony, enhanced by tangy lychee and warm cashmere wood.',
    topNotes: ['ليتشي استوائي منعش', 'راوند حامضي حلو', 'برغموت إيطالي', 'جوزة الطيب'],
    heartNotes: ['ورد تركي ملكي', 'زهور الفاوانيا', 'مسك الروم', 'بتلات الفانيليا'],
    baseNotes: ['خشب الكشميران الناعم', 'خشب الأرز', 'مسك أبيض', 'بخور البخور'],
    accords: ['زهري مخملي', 'فواكه منعشة', 'مسكي ناعم', 'أنثوي فائق الجاذبية'],
    vibeAr: 'أنوثة ملكية فائقة، سحر لا يقاوم، ورقة تأسر القلوب',
    gender: 'women',
    genderAr: 'عطر أنثوي ملكي ساحر (رقم 1 نسائياً)',
    season: 'all',
    seasonAr: 'خلاب في الربيع والصيف وجميع أوقات السنة',
    occasionAr: 'المناسبات السعيدة، الحفلات، والاستخدام اليومي الأنيق',
    longevityAr: 'ثبات يدوم 24 - 48 ساعة على الفساتين والأقمشة',
    sillageAr: 'فوحان فواح يترك خلفك هالة زهرية مبهرة',
    concentrationAr: 'Extrait de Parfum أنثوي خالص',
  },

  // --- Black Afgano ---
  'black-afgano': {
    storyAr: 'العطر الغامض الذي لا يشبه أي عطر آخر. مستوحى من نبتة الحشيش الهندي والراتنجات المدخنة وأجود أنواع التبغ والعود، يخلق هالة من السحر والجاذبية الداكنة والجرأة المطلقة.',
    storyEn: 'An enigmatic, daring potion celebrating the temporary effects of bliss with rich cannabis notes, green herbs, incense, and dark wood.',
    topNotes: ['أعشاب خضراء داكنة', 'نوتات عشبية برية'],
    heartNotes: ['راتنجات مدخنة', 'تبغ محروق', 'خشب داكن', 'بن قهوة محمص'],
    baseNotes: ['عود مدخن', 'بخور كثيف', 'عنبر خام'],
    accords: ['بخور كثيف', 'تبغ وعود', 'عشبي داكن', 'خشبي غامض'],
    vibeAr: 'غموض ساحر، جرأة مطلقة، وهيبة استثنائية لمن يجرؤ فقط',
    gender: 'unisex',
    genderAr: 'عطر النيش الداكن والأكثر جرأة للجنسين',
    season: 'winter',
    seasonAr: 'خاص بالشتاء، الليالي الباردة، والأجواء الممطرة',
    occasionAr: 'السهرات الخاصة، المناسبات الشتوية، والظهور المتميز',
    longevityAr: 'ثبات دائم 48 ساعة وأكثر على الملابس الثقيلة',
    sillageAr: 'فوحان كثيف وغامض يستحوذ على الأجواء',
    concentrationAr: '30% Extrait de Parfum مكثف جداً',
  },

  // --- Kilian Angels' Share ---
  'angels-share': {
    storyAr: 'عطر الدفء والإغراء الفاخر المستوحى من حصة الملائكة في صناعة الكونياك المعتق. تمازج آسر لزيت الكونياك الفرنسي مع عيدان القرفة المعتقة وحبوب التونكا وخشب البلوط وفانيليا البرالين.',
    storyEn: 'An intoxicating gourmand masterpiece blending rare cognac essence with oak wood, cinnamon bark, and rich praline vanilla.',
    topNotes: ['كونياك فرنسي معتق', 'قطرات الكراميل الدافئ'],
    heartNotes: ['قرفة سيلانية', 'حبوب التونكا المحمصة', 'خشب البلوط الفرنسي'],
    baseNotes: ['فانيليا مدغشقر البوربون', 'حلوى البرالين', 'خشب الصندل الدافئ'],
    accords: ['غورماند سكري دافئ', 'كونياك معتق', 'توابل قرفة', 'فانيليا كراميل'],
    vibeAr: 'دفء جذاب، إغراء لذيذ، وسحر شتوي يسرق الأنظار',
    gender: 'unisex',
    genderAr: 'عطر شتوي سكري دافئ للجنسين',
    season: 'winter',
    seasonAr: 'العطر الأمثل للشتاء والخريف والأمسيات الرومانسية',
    occasionAr: 'سهرات الشتاء، اللقاءات الدافئة، والمناسبات الاحتفالية',
    longevityAr: 'ثبات يدوم 24 - 48 ساعة على الصوف والملابس',
    sillageAr: 'فوحان دافئ مريح يجذب المدح والإطراء فوراً',
    concentrationAr: 'Extrait de Parfum سكري فاخر',
  },

  // --- Tom Ford Tobacco Vanille ---
  'tobacco-vanille': {
    storyAr: 'كلاسيكية نادي النبلاء الإنجليزي في أبهى صورها. أوراق التبغ الفاخر المتبل بالقرنفل والزنجبيل، ينصهر مع الفانيليا الكريمية وحبوب التونكا والفواكه المجففة في تناغم ساحر ينبض بالفخامة.',
    storyEn: 'Opulent, warm, and iconic—a modern take on an old-world gentleman\'s club with rich tobacco leaf, aromatic spices, and creamy vanilla.',
    topNotes: ['أوراق التبغ الشقراء الفاخرة', 'توابل شرقية حارة', 'زنجبيل'],
    heartNotes: ['فانيليا كريمية نقية', 'كاكاو مر', 'حبوب التونكا', 'زهر التبغ'],
    baseNotes: ['فواكه مجففة معسلة', 'أخشاب ثمينة دافئة'],
    accords: ['تبغ عسلي', 'فانيليا دافئة', 'توابل حلوة', 'خشبي غني'],
    vibeAr: 'هيبة كلاسيكية راقية، دفء كاريزمي، وذوق أرستقراطي رفيع',
    gender: 'unisex',
    genderAr: 'عطر النخبة والذوق الرفيع للجنسين',
    season: 'winter',
    seasonAr: 'العطر الأروع في الشتاء والأجواء الباردة',
    occasionAr: 'اللقاءات الرسمية، الأمسيات الشتوية، والسهرات الكلاسيكية',
    longevityAr: 'ثبات أسطوري يتعدى 48 ساعة على الملابس',
    sillageAr: 'فوحان دافئ غني يملأ الأرجاء بكل ثقة',
    concentrationAr: '28% Extrait de Parfum مكثف',
  },

  // --- Louis Vuitton Imagination ---
  'imagination': {
    storyAr: 'عطر الانطلاق والخيال اللامحدود. انتعاش الحمضيات الإيطالية الصافية ممزوجاً بأوراق الشاي الأسود الصيني النادر والزنجبيل النيجيري على قاعدة نقية من الأمبروكسان تمنح شعوراً بالنظافة الملكية والانتعاش الفاخر طوال اليوم.',
    storyEn: 'The spirit of boundless travel and clean luxury—sparkling Italian citruses blended with rare black tea, Nigerian ginger, and ambrox.',
    topNotes: ['سيترون صقلي', 'برغموت كالابريا', 'برتقال حلو'],
    heartNotes: ['شاي أسود صيني نادر', 'زنجبيل نيجيري', 'قرفة سيلانية'],
    baseNotes: ['أمبروكسان نقي', 'خشب الغاياك', 'لبان البخور'],
    accords: ['حمضيات صيفية', 'شاي أسود أروماتيك', 'نظافة فاخرة', 'توابل منعشة'],
    vibeAr: 'نظافة استثنائية، انتعاش ملكي، وأناقة صيفية متألقة',
    gender: 'men',
    genderAr: 'عطر النظافة والانتعاش الملكي للرجال',
    season: 'summer',
    seasonAr: 'العطر الصيفي الأول بلا منازع وللأيام المشمسة',
    occasionAr: 'الدوام، الاستخدام اليومي الصيفي، الخروجات الراقية والشاطئية',
    longevityAr: 'ثبات استثنائي لعطر حمضي يدوم 18 - 24 ساعة',
    sillageAr: 'فوحان نقي جذاب يعطي شعوراً مستمراً بالانتعاش',
    concentrationAr: 'Extrait de Parfum منعش مكثف',
  },

  // --- Good Girl Carolina Herrera ---
  'good-girl': {
    storyAr: 'عطر التناقض الجريء الذي يجمع بين البراءة والتمرد. يمزج بين بياض الياسمين ومسك الروم المشرق مع الجانب المظلم للكاكاو المحمص وحبوب التونكا والقهوة الإثيوبية، ليخلق جاذبية أنثوية صارخة لا تُقاوم.',
    storyEn: 'An alluring blend of light and dark notes: sweet jasmine and tuberose contrast with decadent cocoa, roasted tonka bean, and almond.',
    topNotes: ['لوز محلى', 'قهوة غنية', 'برغموت', 'ليمون منعش'],
    heartNotes: ['مسك الروم الملكي', 'ياسمين سامباك أبيض', 'زهر البرتقال', 'سوسن ناعم'],
    baseNotes: ['حبوب التونكا المحمصة', 'كاكاو مخملي', 'فانيليا كراميل', 'خشب الصندل'],
    accords: ['زهري أبيض مشرق', 'كاكاو وقرفة', 'حلو دافئ', 'أنثوي جريء'],
    vibeAr: 'جاذبية مغناطيسية، كاريزما أنثوية، وسحر سهرات لا يُنسى',
    gender: 'women',
    genderAr: 'عطر أنثوي جذاب للسهرات والمناسبات',
    season: 'all',
    seasonAr: 'رائع في الخريف، الشتاء، والأمسيات الخاصة',
    occasionAr: 'السهرات، اللقاءات الرومانسية، وحفلات العشاء',
    longevityAr: 'ثبات يدوم 24 - 36 ساعة على الملابس',
    sillageAr: 'فوحان جذاب يترك بصمة أنثوية طاغية',
    concentrationAr: 'Extrait de Parfum عالي الثبات',
  },

  // --- YSL Libre Intense ---
  'libre': {
    storyAr: 'صرخة الحرية والأنوثة الواثقة. صياغة عصرية تلتقي فيها زهور الخزامى الفرنسية مع زهر البرتقال المغربي الحارق، مدعومة بجاذبية الفانيليا والأوركيد المخملي لتمنح شعوراً بالقوة والجاذبية الملكية.',
    storyEn: 'A blazing statement of freedom with French lavender, sensual Moroccan orange blossom, and orchid-infused bourbon vanilla.',
    topNotes: ['خزامى فرنسي', 'برتقال ماندارين', 'برغموت كالابريا'],
    heartNotes: ['خزامى نقي', 'زهر برتقال مغربي', 'أوركيد مخملي', 'ياسمين سامباك'],
    baseNotes: ['فانيليا مدغشقر', 'حبوب التونكا', 'عنبر الحوت', 'نجيل الهند'],
    accords: ['زهور بيضاء', 'خزامى أروماتيك', 'فانيليا دافئة', 'أنثوي قيادي'],
    vibeAr: 'ثقة مطلقة، حضور قيادي، وأنوثة قوية ساحرة',
    gender: 'women',
    genderAr: 'عطر المرأة الواثقة والقيادية',
    season: 'all',
    seasonAr: 'مناسب لجميع فصول السنة والأمسيات الراقية',
    occasionAr: 'اجتماعات العمل الهامة، السهرات، والمناسبات الرسمية',
    longevityAr: 'ثبات يدوم 24 - 40 ساعة على الملابس',
    sillageAr: 'فوحان قوي يفرض وجوده بنعومة وأناقة',
    concentrationAr: 'Extrait de Parfum مكثف',
  },

  // --- Tom Ford Oud Wood ---
  'oud-wood': {
    storyAr: 'العود بأسلوب توم فورد المعاصر: ناعم، راقٍ، وخالٍ من الحدة. تركيبة دخانية مبهرة من خشب العود النادر وأخشاب الورد والماركوسة، مع رشة من حبوب الهيل وفلفل سيتشوان وفانيليا العنبر.',
    storyEn: 'One of the most rare, precious, and expensive ingredients in a perfumer\'s arsenal, wrapped in rosewood, cardamom, and amber.',
    topNotes: ['حبوب الهيل الأخضر', 'فلفل سيتشوان', 'خشب الورد البرازيلي'],
    heartNotes: ['خشب العود النادر', 'خشب الصندل الدافئ', 'نجيل الهند الترابي'],
    baseNotes: ['حبوب التونكا', 'فانيليا ناعمة', 'عنبر ذهبي'],
    accords: ['خشبي دافئ', 'عود ناعم راقٍ', 'توابل عطرية', 'عنبري دخاني'],
    vibeAr: 'فخامة هادئة، ذوق مخملي رفيع، ورقي أصحاب المقامات',
    gender: 'unisex',
    genderAr: 'عطر العود الكلاسيكي الأرقى للجنسين',
    season: 'all',
    seasonAr: 'مثالي للخريف والشتاء والأيام الباردة والمعتدلة',
    occasionAr: 'اللقاءات الرسمية، الأعمال الراقية، والمناسبات الهادئة',
    longevityAr: 'ثبات يدوم 24 - 36 ساعة على الملابس',
    sillageAr: 'فوحان أنيق غير مزعج يحيط بك بهالة من الوقار',
    concentrationAr: 'Extrait de Parfum راقٍ',
  },

  // --- Stronger With You Intensely ---
  'stronger-with-you': {
    storyAr: 'قصة الحب والشغف الشبابي الملتهب. عطر شرقي دافئ يفيض بطاقة القرفة المشتعلة والفلفل الوردي مع حلوى التوفي المحلاة وفانيليا السويدي ولمسات اللافندر الجذاب.',
    storyEn: 'An intense, addictive love potion packed with spicy cinnamon, glazed chestnut, sage, and rich vanilla.',
    topNotes: ['فلفل وردي مشرق', 'عرعر بري', 'أوراق البنفسج'],
    heartNotes: ['قرفة حارة دافئة', 'خزامى ناعم', 'ميرمية', 'كستناء مكرملة'],
    baseNotes: ['فانيليا دافئة', 'حبوب التونكا', 'عنبر ذهبي', 'خشب الأرز'],
    accords: ['حلو مكرمل', 'توابل دافئة', 'فانيليا غنية', 'خشبي شرقي'],
    vibeAr: 'جاذبية رومانسية آسرة، حيوية شبابية، وإحساس بالدفء الحنون',
    gender: 'men',
    genderAr: 'العطر الأكثر رومانسية وجاذبية للشباب',
    season: 'winter',
    seasonAr: 'الأفضل في الخريف والشتاء والأجواء الباردة',
    occasionAr: 'المواعيد الرومانسية، اللقاءات الدافئة، والسهرات الشبابية',
    longevityAr: 'ثبات يدوم 24 - 40 ساعة على الملابس',
    sillageAr: 'فوحان قوي يملأ المكان بحلاوة دافئة محبوبة',
    concentrationAr: 'Extrait de Parfum دافئ',
  },

  // --- Xerjoff Erba Pura ---
  'erba-pura': {
    storyAr: 'سلة فواكه متوسطية محلاة بالمسك الصافي. باقة مشرقة من البرتقال الصقلي والليمون وبرغموت كالابريا تغوص في أعماق من المسك الأبيض النقي والفانيليا التي تدوم لأيام.',
    storyEn: 'A luscious basket of Mediterranean fruits layered over an alluring white musk and amber base with immense staying power.',
    topNotes: ['برتقال صقلي مشرق', 'ليمون كالابريا', 'برغموت إيطالي'],
    heartNotes: ['سلة فواكه استوائية مجمعة', 'عصير الفواكه المنعش'],
    baseNotes: ['مسك أبيض ملكي فائق النقاء', 'فانيليا مدغشقر', 'عنبر دافئ'],
    accords: ['فواكه استوائية', 'مسكي نقي', 'حمضيات مشمسة', 'حلو مبهج'],
    vibeAr: 'بهجة متدفقة، طاقة إيجابية، وإشراقة فخمة تدوم طويلاً',
    gender: 'unisex',
    genderAr: 'عطر الفواكه والمسك النيش للجنسين',
    season: 'all',
    seasonAr: 'خلاب في الصيف والربيع والمواسم المشمسة',
    occasionAr: 'النزهات، المناسبات، والظهور المبهج الفاتن',
    longevityAr: 'ثبات هائل يدوم لأيام على الملابس',
    sillageAr: 'فوحان فواح جداً يملأ كل ركن في المكان',
    concentrationAr: '28% Extrait de Parfum نيش إيطالي',
  },

  // --- Nasamat Signatures (rec-1 to rec-5) ---
  'rec-1': {
    storyAr: 'الخلطة الملكية الأكثر طلباً وشهرة في بوتيك نسمات بيروت: تمازج حلاوة الزعفران والعنبر الكريستالي من باكارات روج 540 مع انتعاش وقوة الأناناس والبتولا المدخن من كريد أفنتوس. تناغم عبقري يخلق عطراً فريداً لا مثيل له في الأسواق.',
    storyEn: 'The iconic Nasamat Beirut signature fusion: the crystalline amber-saffron sweetness of Baccarat Rouge 540 meets the smoky pineapple power of Creed Aventus.',
    topNotes: ['برغموت كالابريا', 'أناناس مدخن', 'زعفران كشميري أحمر', 'كشمش أسود'],
    heartNotes: ['ياسمين مصري', 'خشب البتولا المدخن', 'عنبر أبيض كريستالي', 'باتشولي نقي'],
    baseNotes: ['عنبر الحوت النادر', 'خشب الأرز الأطلسي', 'إيفرنيل مخملي', 'مسك ملكي'],
    accords: ['عنبري سكري', 'فواكه مدخنة', 'خشبي راقٍ', 'ملكي حصري'],
    vibeAr: 'عظمة ملكية حصرية، بصمة فريدة لا تتكرر، وتفرد تام عن الجميع',
    gender: 'unisex',
    genderAr: 'خلطة نسمات الحصرية للجنسين (الأكثر طلباً)',
    season: 'all',
    seasonAr: 'ساحر في كافة الفصول والمناسبات',
    occasionAr: 'المناسبات الكبرى، الأفراح، واللقاءات الراقية',
    longevityAr: 'ثبات دائم 36 - 48 ساعة على الملابس',
    sillageAr: 'فوحان ملكي جبار يثير الفضول والإعجاب فوراً',
    concentrationAr: 'Extrait de Parfum خلطة خاصة',
  },

  'rec-2': {
    storyAr: 'خلطة الفخامة والهيبة المطلقة للمناسبات الراقية: تمازج عود أسام الداكن المدخن من أومبر نوماد مع نعومة الجلد الإيطالي الفاخر ولمسات التوت البري من توسكان ليزر. حضور مهيب لا ينسى.',
    storyEn: 'Uncompromising prestige: Dark Assam oud and incense tears blended with Italian Tuscan leather and tart raspberry.',
    topNotes: ['توت العليق البري', 'زعفران دافئ', 'بخور صومالي فاخر'],
    heartNotes: ['عود أسام الطبيعي', 'ورد بلغاري مقطر', 'صمغ البنزوين'],
    baseNotes: ['جلد إيطالي مدبوغ', 'عنبر داكن', 'أخشاب قطبية نادرة'],
    accords: ['جلدي فاخر', 'عود وبخور', 'توت مدخن', 'شرقي هائل'],
    vibeAr: 'هيبة السلاطين، وقار أسطوري، وشخصية قيادية لا تقهر',
    gender: 'men',
    genderAr: 'خلطة السلاطين الحصرية للرجال',
    season: 'winter',
    seasonAr: 'مخصص للشتاء، الخريف، والأمسيات الرسمية الباردة',
    occasionAr: 'الأعراس الفخمة، كبار المناسبات، والاجتماعات القيادية',
    longevityAr: 'ثبات يتعدى 48 ساعة على المعاطف والأقمشة',
    sillageAr: 'فوحان هائل وثابت يفرض احترامه في أي مجلس',
    concentrationAr: '28% Extrait de Parfum ثقيل وفاخر',
  },

  'rec-3': {
    storyAr: 'إبداع أنثوي آسر يجمع نعومة الورد التركي والليتشي المخملي من ديلينا مع جاذبية الكاكاو والتونكا والقهوة من غود جيرل. عطر الأنوثة الفائقة التي تأسر الألباب.',
    storyEn: 'Sensual feminine velvet: Parfums de Marly Delina combined with Carolina Herrera Good Girl for breathtaking allure.',
    topNotes: ['ليتشي استوائي', 'راوند حامضي حلو', 'برغموت', 'قهوة خفيفة'],
    heartNotes: ['ورد تركي ملكي', 'فاوانيا مائية', 'ياسمين أبيض', 'مسك الروم'],
    baseNotes: ['حبوب التونكا المحمصة', 'كاكاو مخملي', 'فانيليا كشميرية', 'مسك'],
    accords: ['زهري مخملي', 'فواكه حلوة', 'كاكاو وتونكا', 'أنثوي فائق الإثارة'],
    vibeAr: 'رقة مخملية، جاذبية أنثوية ساحرة، وأناقة راقية لا تقاوم',
    gender: 'women',
    genderAr: 'خلطة نسمات الحصرية للنساء',
    season: 'all',
    seasonAr: 'مناسب لكافة الفصول والأجواء السعيدة',
    occasionAr: 'السهرات، المناسبات الخاصة، والاستخدام اليومي الأنيق',
    longevityAr: 'ثبات يدوم 24 - 40 ساعة على الملابس',
    sillageAr: 'فوحان ناعم ساحر يترك أثراً مليئاً بالرقة والإعجاب',
    concentrationAr: 'Extrait de Parfum أنثوي خاص',
  },

  'rec-4': {
    storyAr: 'خلطة منعشة فائقة الأناقة تحاكي نسمات صخور الروشة وشواطئ جبيل والبترون: برتقال الماندرين والشاي الأسود مع مياه البحر الباردة في توليفة إيماجينيشن وأفترنون سويم.',
    storyEn: 'Mediterranean Riviera breeze: Louis Vuitton Afternoon Swim fused with LV Imagination for supreme summer luxury.',
    topNotes: ['ماندرين صقلي', 'برتقال شمسي', 'برغموت إيطالي', 'جريب فروت'],
    heartNotes: ['شاي أسود نادر', 'زنجبيل نيجيري', 'رذاذ بحري منعش'],
    baseNotes: ['أمبروكسان نقي', 'خشب الغاياك', 'مسك أبيض نظيف'],
    accords: ['حمضيات مشمسة', 'أكواتيك بحري', 'شاي وزنجبيل', 'نظافة فاخرة'],
    vibeAr: 'انتعاش البحر الأبيض المتوسط، نظافة راقية، وأناقة صيفية متألقة',
    gender: 'unisex',
    genderAr: 'خلطة الريفييرا الصيفية للجنسين',
    season: 'summer',
    seasonAr: 'الخلطة الصيفية المثالية للأيام الحارة والمشمسة',
    occasionAr: 'الدوام اليومي، الرحلات الشاطئية، والخروجات الصيفية',
    longevityAr: 'ثبات رائع يدوم 18 - 24 ساعة على الملابس',
    sillageAr: 'فوحان نقي مبهج ينشر نسمات باردة منعشة',
    concentrationAr: 'Extrait de Parfum صيفي',
  },

  'rec-5': {
    storyAr: 'عطر الدفء والإغراء الشتوي: لمسات الكونياك الفرنسي والقرفة المعتقة من آنجلز شير مع حلاوة فانيليا مدغشقر والتبغ العسلي الفاخر من توباكو فانيلا.',
    storyEn: 'Warm decadent luxury: Kilian Angels\' Share blended with Tom Ford Tobacco Vanille for unforgettable cold nights.',
    topNotes: ['كونياك فرنسي معتق', 'توابل شرقية دافئة', 'أوراق تبغ شقراء'],
    heartNotes: ['قرفة سيلانية', 'خشب البلوط', 'حبوب التونكا', 'كاكاو مر'],
    baseNotes: ['فانيليا مدغشقر البوربون', 'برالين كراميل', 'أخشاب دافئة', 'عنبر'],
    accords: ['غورماند دافئ', 'كونياك وتبغ', 'قرفة وفانيليا', 'شتوي فاخر'],
    vibeAr: 'دفء شتوي لذيذ، سحر كلاسيكي مريح، وجاذبية لا تقاوم',
    gender: 'unisex',
    genderAr: 'خلطة إكسير الشتاء الحصرية للجنسين',
    season: 'winter',
    seasonAr: 'الخلطة الأجمل لليالي الشتاء والأجواء الباردة',
    occasionAr: 'السهرات الشتوية، اللقاءات الدافئة، والمناسبات الاحتفالية',
    longevityAr: 'ثبات دائم يتجاوز 48 ساعة على الملابس الشتوية',
    sillageAr: 'فوحان دافئ مريح يغمر الحاضرين بالبهجة والأناقة',
    concentrationAr: '26% - 28% Extrait de Parfum شتوي مركز',
  },
};

/**
 * Intelligent helper to extract or synthesize a rich Olfactory Profile
 * for any perfume oil or recipe in the boutique.
 */
export function getPerfumeOlfactoryProfile(item: FragranceOil | SavedRecipe): PerfumeOlfactoryProfile {
  // 1. Direct custom profile attached to item
  if (item.olfactoryProfile) {
    return item.olfactoryProfile;
  }

  // 2. Lookup in curated profiles by code, id, or key keywords
  const code = ('code' in item && item.code) ? item.code.toLowerCase() : '';
  const id = item.id ? item.id.toLowerCase() : '';
  const name = item.name ? item.name.toLowerCase() : '';
  const nameEn = ('nameEn' in item && item.nameEn) ? item.nameEn.toLowerCase() : '';

  // Check recipes rec-1 .. rec-5
  if (id in CURATED_PERFUME_PROFILES) {
    return CURATED_PERFUME_PROFILES[id];
  }
  if (code in CURATED_PERFUME_PROFILES) {
    return CURATED_PERFUME_PROFILES[code];
  }

  // Check name match against known keys
  const matchKey = Object.keys(CURATED_PERFUME_PROFILES).find((key) => {
    return name.includes(key) || nameEn.includes(key);
  });
  if (matchKey) {
    return CURATED_PERFUME_PROFILES[matchKey];
  }

  // Keyword mappings for popular fragrances
  if (name.includes('سافاج') || nameEn.includes('sauvage')) return CURATED_PERFUME_PROFILES['sauvage'];
  if (name.includes('بلو دي شانيل') || nameEn.includes('bleu de chanel')) return CURATED_PERFUME_PROFILES['bleu-de-chanel'];
  if (name.includes('أفنتوس') || nameEn.includes('aventus')) return CURATED_PERFUME_PROFILES['creed-aventus'];
  if (name.includes('باكارات') || nameEn.includes('baccarat')) return CURATED_PERFUME_PROFILES['baccarat-rouge-540'];
  if (name.includes('أومبر نوماد') || nameEn.includes('ombre nomade')) return CURATED_PERFUME_PROFILES['ombre-nomade'];
  if (name.includes('ديلينا') || nameEn.includes('delina')) return CURATED_PERFUME_PROFILES['delina'];
  if (name.includes('بلاك أفغانو') || nameEn.includes('black afgano')) return CURATED_PERFUME_PROFILES['black-afgano'];
  if (name.includes('آنجلز شير') || nameEn.includes('angels share')) return CURATED_PERFUME_PROFILES['angels-share'];
  if (name.includes('توباكو فاني') || nameEn.includes('tobacco vanille')) return CURATED_PERFUME_PROFILES['tobacco-vanille'];
  if (name.includes('إيماجينيشن') || nameEn.includes('imagination')) return CURATED_PERFUME_PROFILES['imagination'];
  if (name.includes('غود جيرل') || nameEn.includes('good girl')) return CURATED_PERFUME_PROFILES['good-girl'];
  if (name.includes('ليبر') || nameEn.includes('libre')) return CURATED_PERFUME_PROFILES['libre'];
  if (name.includes('عود وود') || nameEn.includes('oud wood')) return CURATED_PERFUME_PROFILES['oud-wood'];
  if (name.includes('سترونجر ويذ يو') || nameEn.includes('stronger with you')) return CURATED_PERFUME_PROFILES['stronger-with-you'];
  if (name.includes('إيربا بورا') || nameEn.includes('erba pura')) return CURATED_PERFUME_PROFILES['erba-pura'];

  // 3. Fallback: Intelligent dynamic synthesizer using existing item metadata
  const isRecipe = 'category' in item;
  const rawNotes = (isRecipe ? (item as SavedRecipe).scentNotes || (item as SavedRecipe).description : (item as FragranceOil).notes) || '';
  const family: FragranceFamily = isRecipe ? 'oriental' : (item as FragranceOil).family || 'fresh';

  // Parse notes if formatted like "قمة: ... | قلب: ... | قاعدة: ..."
  let parsedTop: string[] = [];
  let parsedHeart: string[] = [];
  let parsedBase: string[] = [];

  if (rawNotes.includes('قمة:') || rawNotes.includes('قلب:') || rawNotes.includes('قاعدة:')) {
    const parts = rawNotes.split(/[|•\n]/);
    parts.forEach((p) => {
      const clean = p.trim();
      if (clean.startsWith('قمة:')) {
        parsedTop = clean.replace('قمة:', '').split(/[,،]/).map(s => s.trim()).filter(Boolean);
      } else if (clean.startsWith('قلب:')) {
        parsedHeart = clean.replace('قلب:', '').split(/[,،]/).map(s => s.trim()).filter(Boolean);
      } else if (clean.startsWith('قاعدة:')) {
        parsedBase = clean.replace('قاعدة:', '').split(/[,،]/).map(s => s.trim()).filter(Boolean);
      }
    });
  } else if (rawNotes.length > 0) {
    // Split by commas
    const noteTokens = rawNotes.split(/[,،\-\|]/).map(s => s.trim()).filter(s => s.length > 1 && !s.includes('مبيعاً') && !s.includes('الرقم'));
    if (noteTokens.length >= 3) {
      parsedTop = [noteTokens[0]];
      parsedHeart = [noteTokens[1]];
      parsedBase = noteTokens.slice(2);
    } else if (noteTokens.length === 2) {
      parsedTop = [noteTokens[0]];
      parsedHeart = [noteTokens[1]];
      parsedBase = ['مسك فاخر', 'عنبر نقي'];
    } else if (noteTokens.length === 1) {
      parsedTop = [noteTokens[0]];
      parsedHeart = ['خلاصة زهور نقية'];
      parsedBase = ['أخشاب ثمينة'];
    }
  }

  // Family defaults if notes were sparse
  const familyDefaults = getFamilyProfileDefaults(family);

  const finalTop = parsedTop.length > 0 ? parsedTop : familyDefaults.topNotes;
  const finalHeart = parsedHeart.length > 0 ? parsedHeart : familyDefaults.heartNotes;
  const finalBase = parsedBase.length > 0 ? parsedBase : familyDefaults.baseNotes;

  const storyAr = isRecipe 
    ? ((item as SavedRecipe).description || `توليفة ملكية خاصة من إبداعات نسمات، تجمع أندر الزيوت العطرية بتركيز إكستري ليمنحك ثباتاً وفوحاناً استثنائياً يلفت الأنظار في كافة المناسبات.`)
    : `عطر فاخر يجسد التناغم المثالي بين انتعاش الافتتاحية وعمق القاعدة العطرية. صُمم للمرأة والرجل العصري الباحث عن التميز والجاذبية، مصبوغاً بتركيز Extrait de Parfum ليضمن لك بقاء الرائحة على الملابس ليومين كاملين.`;

  return {
    storyAr,
    storyEn: isRecipe ? (item as SavedRecipe).descriptionEn : undefined,
    topNotes: finalTop,
    heartNotes: finalHeart,
    baseNotes: finalBase,
    accords: familyDefaults.accords,
    vibeAr: familyDefaults.vibeAr,
    gender: isRecipe ? ((item as SavedRecipe).targetGender || 'unisex') : 'unisex',
    genderAr: isRecipe && (item as SavedRecipe).targetGender === 'men' ? 'عطر رجالي راقٍ' : isRecipe && (item as SavedRecipe).targetGender === 'women' ? 'عطر أنثوي جذاب' : 'عطر ملكي للجنسين',
    season: isRecipe ? ((item as SavedRecipe).season || 'all') : familyDefaults.season,
    seasonAr: familyDefaults.seasonAr,
    occasionAr: familyDefaults.occasionAr,
    longevityAr: 'ثبات استثنائي يدوم 24 - 48 ساعة على الملابس (Extrait de Parfum)',
    sillageAr: 'فوحان ملحوظ يترك انطباعاً راقياً في كل مكان',
    concentrationAr: 'Extrait de Parfum عالي النقاء',
  };
}

function getFamilyProfileDefaults(family: FragranceFamily) {
  switch (family) {
    case 'fresh':
    case 'citrus':
      return {
        topNotes: ['برغموت إيطالي فوار', 'ليمون صقلي', 'نعناع مائي بارد'],
        heartNotes: ['زهر البرتقال', 'زنجبيل منعش', 'أكوا بحرية'],
        baseNotes: ['أمبروكسان نقي', 'مسك أبيض', 'خشب الأرز'],
        accords: ['حمضيات منعشة', 'مائي صيفي', 'أروماتيك نقي', 'نظافة فاخرة'],
        vibeAr: 'حيوية وانتعاش مشرق وإحساس دائم بالنظافة الملكية',
        season: 'summer' as const,
        seasonAr: 'مثالي للصيف، الربيع، والأيام المشمسة',
        occasionAr: 'الدوام اليومي، الرياضة، والأنشطة الصيفية',
      };
    case 'woody':
      return {
        topNotes: ['حبوب الهيل', 'فلفل أسود', 'برغموت خفيف'],
        heartNotes: ['خشب الأرز الأطلسي', 'نجيل الهند الترابي', 'صندل ناعم'],
        baseNotes: ['خشب الغاياك', 'أمبروكسان', 'مسك دافئ'],
        accords: ['خشبي نبيل', 'ترابي دافئ', 'توابل عطرية', 'وقار ورجولة'],
        vibeAr: 'هيبة وثقة ووقار يعكس شخصية قيادية ناضجة',
        season: 'all' as const,
        seasonAr: 'مناسب لجميع الفصول خاصة الخريف والشتاء',
        occasionAr: 'الاجتماعات الرسمية، العمل، والمناسبات الراقية',
      };
    case 'oriental':
      return {
        topNotes: ['زعفران كشميري', 'بخور صومالي', 'توت بري'],
        heartNotes: ['عود أسام الفاخر', 'ورد دمشقي', 'صمغ البنزوين'],
        baseNotes: ['عنبر الحوت', 'مسك ملكي', 'أخشاب نادرة'],
        accords: ['شرقي باذخ', 'عود وبخور', 'عنبري دافئ', 'توابل نبيلة'],
        vibeAr: 'فخامة شرقية باذخة وأناقة ملكية تفرض هيبتها',
        season: 'winter' as const,
        seasonAr: 'الأمثل في الشتاء، الخريف، والأمسيات الباردة',
        occasionAr: 'الأفراح، المناسبات الكبرى، والسهرات الرسمية',
      };
    case 'floral':
      return {
        topNotes: ['راوند حلو', 'ليتشي منعش', 'برغموت خفيف'],
        heartNotes: ['ورد تركي ملكي', 'ياسمين أبيض', 'فاوانيا مائية'],
        baseNotes: ['فانيليا كشميرية', 'مسك أبيض مخملي', 'خشب الأرز'],
        accords: ['زهري رقيق', 'أنثوي ساحر', 'فواكه منعشة', 'مسكي ناعم'],
        vibeAr: 'أنوثة ملكية رقيقة وجاذبية رومانسية تأسر القلوب',
        season: 'all' as const,
        seasonAr: 'رائع في الربيع والصيف وجميع الأوقات',
        occasionAr: 'اللقاءات الخاصة، المناسبات السعيدة، والاستخدام اليومي الأنيق',
      };
    case 'leather':
      return {
        topNotes: ['زعفران حار', 'توت العليق', 'زعتر بري'],
        heartNotes: ['جلد سويدي فاخر', 'ياسمين ليلي', 'لبان'],
        baseNotes: ['جلد إيطالي مدبوغ', 'عنبر دافئ', 'أخشاب مدخنة'],
        accords: ['جلدي فاخر', 'توت مدخن', 'عنبري دافئ', 'هيبة رجالية'],
        vibeAr: 'جرأة وفخامة أرستقراطية تعبر عن القوة والتميز',
        season: 'winter' as const,
        seasonAr: 'مثالي للشتاء، الخريف، والأجواء الباردة',
        occasionAr: 'السهرات الفخمة، كبار المناسبات، والظهور المتميز',
      };
    case 'gourmand':
      return {
        topNotes: ['كراميل دافئ', 'لوز محمص', 'قهوة خفيفة'],
        heartNotes: ['قرفة سيلانية', 'حبوب التونكا', 'كاكاو مخملي'],
        baseNotes: ['فانيليا مدغشقر', 'سكر بني معتق', 'خشب الصندل'],
        accords: ['غورماند سكري دافئ', 'فانيليا كراميل', 'توابل حلوة', 'جاذبية دافئة'],
        vibeAr: 'دفء جذاب ولذة عطرية لا تقاوم تمنح شعوراً بالراحة والسعادة',
        season: 'winter' as const,
        seasonAr: 'مثالي لليالي الشتاء الباردة والأمسيات الدافئة',
        occasionAr: 'المواعيد الرومانسية، سهرات الشتاء، واللقاءات الدافئة',
      };
    case 'aromatic':
    default:
      return {
        topNotes: ['خزامى بروفانس', 'إكليل الجبل', 'جريب فروت صقلي'],
        heartNotes: ['إبرة الراعي', 'ميرمية عطرية', 'فلفل وردي'],
        baseNotes: ['خشب الصندل', 'طحلب البلوط', 'مسك أبيض'],
        accords: ['أروماتيك راقٍ', 'عشبي نقي', 'حمضيات متوازنة', 'رجالي كلاسيكي'],
        vibeAr: 'أناقة يومية متجددة وراحة نفسية وانتعاش دائم',
        season: 'all' as const,
        seasonAr: 'مناسب لكافة الفصول والأجواء',
        occasionAr: 'العمل، الرياضة، واللقاءات اليومية المريحة',
      };
  }
}
