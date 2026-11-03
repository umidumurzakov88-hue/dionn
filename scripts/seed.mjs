// Fills the database with demo categories, products, banners and reviews.
// Usage:  node --env-file=.env.local scripts/seed.mjs          (adds demo data if the catalog is empty)
//         node --env-file=.env.local scripts/seed.mjs --reset  (deletes ALL catalog data first)
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const reset = process.argv.includes('--reset');

const must = (r, what) => {
  if (r.error) {
    console.error(`✖ ${what}:`, r.error.message);
    process.exit(1);
  }
  return r.data;
};

const { count } = await sb.from('products').select('id', { count: 'exact', head: true });
if (count && !reset) {
  console.log(`Catalog already has ${count} products — nothing to do (use --reset to wipe and re-seed).`);
  process.exit(0);
}
if (reset) {
  for (const t of ['reviews', 'product_variants', 'products', 'categories', 'banners']) {
    must(await sb.from(t).delete().not('id', 'is', null), `clear ${t}`);
  }
  console.log('Catalog cleared.');
}

// ---------------------------------------------------------------- Categories
const CATS = [
  { slug: 'divany', ru: 'Диваны', uz: 'Divanlar', en: 'Sofas', image: '/demo/sofa-green.jpg' },
  { slug: 'kresla', ru: 'Кресла', uz: 'Kreslolar', en: 'Armchairs', image: '/demo/armchair-yellow.jpg' },
  { slug: 'stulya', ru: 'Стулья', uz: 'Stullar', en: 'Chairs', image: '/demo/chair-black.jpg' },
  { slug: 'stoly', ru: 'Столы', uz: 'Stollar', en: 'Tables', image: '/demo/desk-wood.jpg' },
  { slug: 'spalnya', ru: 'Спальня', uz: 'Yotoqxona', en: 'Bedroom', image: '/demo/bed-classic.jpg' },
  { slug: 'hranenie', ru: 'Шкафы и хранение', uz: 'Shkaflar va saqlash', en: 'Storage', image: '/demo/shelves-wall.jpg' },
  { slug: 'stolovaya', ru: 'Столовая', uz: 'Oshxona mebeli', en: 'Dining', image: '/demo/dining-green.jpg' },
];
const SUB = [
  { parent: 'divany', slug: 'pryamye-divany', ru: 'Прямые диваны', uz: "To'g'ri divanlar", en: 'Straight sofas' },
  { parent: 'divany', slug: 'kozhanye-divany', ru: 'Кожаные диваны', uz: 'Charm divanlar', en: 'Leather sofas' },
  { parent: 'stulya', slug: 'obedennye-stulya', ru: 'Обеденные стулья', uz: 'Ovqatlanish stullari', en: 'Dining chairs' },
  { parent: 'stulya', slug: 'ofisnye-kresla', ru: 'Офисные кресла', uz: 'Ofis kreslolari', en: 'Office chairs' },
  { parent: 'stulya', slug: 'barnye-stulya', ru: 'Барные стулья', uz: 'Bar stullari', en: 'Bar stools' },
  { parent: 'stoly', slug: 'pismennye-stoly', ru: 'Письменные столы', uz: 'Yozuv stollari', en: 'Desks' },
  { parent: 'stoly', slug: 'zhurnalnye-stoly', ru: 'Журнальные столики', uz: 'Jurnal stolchalari', en: 'Coffee tables' },
];

const catRows = must(
  await sb
    .from('categories')
    .insert(CATS.map((c, i) => ({ slug: c.slug, name_ru: c.ru, name_uz: c.uz, name_en: c.en, image: c.image, sort: i })))
    .select('id, slug'),
  'categories',
);
const catId = Object.fromEntries(catRows.map((c) => [c.slug, c.id]));
const subRows = must(
  await sb
    .from('categories')
    .insert(SUB.map((c, i) => ({ slug: c.slug, parent_id: catId[c.parent], name_ru: c.ru, name_uz: c.uz, name_en: c.en, sort: i })))
    .select('id, slug'),
  'subcategories',
);
Object.assign(catId, Object.fromEntries(subRows.map((c) => [c.slug, c.id])));
console.log(`✔ ${catRows.length + subRows.length} categories`);

// ---------------------------------------------------------------- Products
const spec = (ru, uz, en, value) => ({ ru, uz, en, value });
const S = {
  material: (v) => spec('Материал', 'Material', 'Material', v),
  upholstery: (v) => spec('Обивка', 'Qoplama', 'Upholstery', v),
  size: (v) => spec('Размеры (Ш×Г×В)', "O'lchamlari (E×Ch×B)", 'Dimensions (W×D×H)', v),
  seats: (v) => spec('Посадочных мест', "O'rindiqlar soni", 'Seats', v),
  frame: (v) => spec('Каркас', 'Karkas', 'Frame', v),
  warranty: (v) => spec('Гарантия', 'Kafolat', 'Warranty', v),
  country: (v) => spec('Производство', 'Ishlab chiqarilgan', 'Made in', v),
  load: (v) => spec('Макс. нагрузка', 'Maks. yuklama', 'Max load', v),
};
const color = (ru, uz, en, hex, extra = {}) => ({ group_name: 'color', name_ru: ru, name_uz: uz, name_en: en, color_hex: hex, ...extra });
const size = (ru, uz, en, price) => ({ group_name: 'size', name_ru: ru, name_uz: uz, name_en: en, price });

const D = (ru, uz, en) => ({ description_ru: ru, description_uz: uz, description_en: en });

const PRODUCTS = [
  {
    cat: 'pryamye-divany', slug: 'divan-verona-velvet', sku: 'DN-SF-101',
    ru: 'Диван Verona, велюр', uz: 'Verona divani, velyur', en: 'Verona sofa, velvet',
    ...D(
      'Элегантный трёхместный диван Verona в бархатистом велюре. Глубокая посадка, мягкие подушки из пены высокой плотности и устойчивые деревянные ножки.\nИдеально подходит для гостиной в современном или классическом стиле.',
      "Baxmal velyurdagi nafis uch o'rinli Verona divani. Chuqur o'tirish joyi, yuqori zichlikdagi ko'pikli yumshoq yostiqlar va mustahkam yog'och oyoqlar.\nZamonaviy yoki klassik uslubdagi mehmonxona uchun ideal.",
      'An elegant three-seater Verona sofa in plush velvet. Deep seat, soft high-density foam cushions and sturdy wooden legs.\nPerfect for a modern or classic living room.',
    ),
    price: 8900000, old_price: 10500000, images: ['/demo/sofa-green.jpg', '/demo/banner-living.jpg'], is_hit: true, is_new: false,
    specs: [S.upholstery('Велюр'), S.frame('Массив сосны, фанера'), S.size('220×95×85 см'), S.seats('3'), S.warranty('18 месяцев')],
    variants: [color('Изумрудный', 'Zumrad', 'Emerald', '#1f4d3f', { image: '/demo/sofa-green.jpg' }), color('Горчичный', 'Xantal', 'Mustard', '#d9a32b', { image: '/demo/sofa-yellow.jpg' }), color('Терракот', 'Terrakota', 'Terracotta', '#c2512b', { image: '/demo/sofa-orange.jpg' })],
  },
  {
    cat: 'kozhanye-divany', slug: 'divan-milano-leather', sku: 'DN-SF-102',
    ru: 'Кожаный диван Milano', uz: 'Milano charm divani', en: 'Milano leather sofa',
    ...D(
      'Трёхместный диван Milano из натуральной кожи с винтажной патиной. Классический силуэт, который с годами становится только красивее.',
      "Vintaj patinali tabiiy charmdan tayyorlangan uch o'rinli Milano divani. Yillar o'tgan sari yanada chiroyli bo'lib boradigan klassik siluet.",
      'A three-seater Milano sofa in genuine leather with a vintage patina. A classic silhouette that only gets better with age.',
    ),
    price: 15900000, images: ['/demo/sofa-leather.jpg', '/demo/banner-boho.jpg'], is_hit: true, is_new: true,
    specs: [S.upholstery('Натуральная кожа'), S.frame('Массив бука'), S.size('230×92×80 см'), S.seats('3'), S.warranty('24 месяца')],
    variants: [size('3-местный', "3 o'rinli", '3-seater', 15900000), size('2-местный', "2 o'rinli", '2-seater', 12400000)],
  },
  {
    cat: 'pryamye-divany', slug: 'divan-oslo-grey', sku: 'DN-SF-103',
    ru: 'Диван Oslo, рогожка', uz: 'Oslo divani, rogojka', en: 'Oslo sofa, woven fabric',
    ...D(
      'Лаконичный диван Oslo в скандинавском стиле с каретной стяжкой на спинке. Износостойкая ткань рогожка легко чистится.',
      "Orqa tomonida karetka tikuvli skandinav uslubidagi lakonik Oslo divani. Chidamli rogojka matosi oson tozalanadi.",
      'A minimal Scandinavian-style Oslo sofa with a button-tufted back. The durable woven fabric is easy to clean.',
    ),
    price: 6700000, images: ['/demo/sofa-grey.jpg', '/demo/sofa-blue.jpg'], is_new: true,
    specs: [S.upholstery('Рогожка'), S.frame('Массив сосны'), S.size('210×90×82 см'), S.seats('3'), S.warranty('18 месяцев')],
    variants: [color('Серый', 'Kulrang', 'Grey', '#8d8f93', { image: '/demo/sofa-grey.jpg' }), color('Голубой', 'Havorang', 'Light blue', '#9db1c7', { image: '/demo/sofa-blue.jpg' })],
  },
  {
    cat: 'kresla', slug: 'kreslo-sunny', sku: 'DN-AC-201',
    ru: 'Кресло Sunny с высокой спинкой', uz: 'Baland suyanchiqli Sunny kreslosi', en: 'Sunny wingback armchair',
    ...D(
      'Яркое кресло Sunny с высокой спинкой и «ушками» — уютное место для чтения. Ножки из массива бука.',
      "Baland suyanchiqli va «quloqchali» yorqin Sunny kreslosi — kitob o'qish uchun shinam joy. Oyoqlari buk yog'ochidan.",
      'A bright Sunny wingback armchair — a cozy reading spot. Solid beech legs.',
    ),
    price: 3200000, old_price: 3900000, images: ['/demo/armchair-yellow.jpg', '/demo/armchair-mustard.jpg'], is_hit: true,
    specs: [S.upholstery('Велюр'), S.frame('Массив бука'), S.size('78×82×102 см'), S.warranty('12 месяцев')],
    variants: [color('Жёлтый', 'Sariq', 'Yellow', '#e3a72f', { image: '/demo/armchair-yellow.jpg' }), color('Горчичный', 'Xantal', 'Mustard', '#c8961e', { image: '/demo/armchair-mustard.jpg' })],
  },
  {
    cat: 'kresla', slug: 'kreslo-lounge-tilda', sku: 'DN-AC-202',
    ru: 'Кресло Tilda на вращающейся опоре', uz: 'Aylanuvchi Tilda kreslosi', en: 'Tilda swivel lounge chair',
    ...D(
      'Мягкое кресло Tilda с вращением на 360° на деревянной крестовине. Подойдёт для гостиной, спальни или кабинета.',
      "Yog'och krestovinadagi 360° aylanadigan yumshoq Tilda kreslosi. Mehmonxona, yotoqxona yoki kabinet uchun mos.",
      'A soft Tilda lounge chair with 360° swivel on a wooden base. Great for a living room, bedroom or study.',
    ),
    price: 2850000, images: ['/demo/chair-lounge.jpg'], is_new: true,
    specs: [S.upholstery('Букле'), S.frame('Металл, массив дуба'), S.size('70×72×88 см'), S.load('120 кг'), S.warranty('12 месяцев')],
    variants: [],
  },
  {
    cat: 'kresla', slug: 'kreslo-royal-tufted', sku: 'DN-AC-203',
    ru: 'Кресло Royal с каретной стяжкой', uz: 'Karetka tikuvli Royal kreslosi', en: 'Royal tufted armchair',
    ...D(
      'Изящное кресло Royal в классическом стиле: каретная стяжка, резные ножки и мягкая обивка молочного цвета.',
      "Klassik uslubdagi nafis Royal kreslosi: karetka tikuv, o'yma oyoqlar va sutrang yumshoq qoplama.",
      'A graceful classic Royal armchair: button tufting, turned legs and soft milk-white upholstery.',
    ),
    price: 2400000, images: ['/demo/chair-tufted.jpg'],
    specs: [S.upholstery('Велюр'), S.frame('Массив бука'), S.size('62×60×86 см'), S.warranty('12 месяцев')],
    variants: [],
  },
  {
    cat: 'obedennye-stulya', slug: 'stul-nordic-black', sku: 'DN-CH-301',
    ru: 'Стул Nordic с мягким сиденьем', uz: "Yumshoq o'rindiqli Nordic stuli", en: 'Nordic chair with padded seat',
    ...D(
      'Популярный стул в скандинавском стиле: эргономичное пластиковое сиденье с мягкой подушкой и ножки из массива бука.',
      "Skandinav uslubidagi mashhur stul: yumshoq yostiqli ergonomik plastik o'rindiq va buk yog'ochidan oyoqlar.",
      'A popular Scandinavian-style chair: ergonomic shell seat with a soft cushion and solid beech legs.',
    ),
    price: 690000, old_price: 850000, images: ['/demo/chair-black.jpg', '/demo/dining-set.jpg'], is_hit: true,
    specs: [S.material('Пластик PP, массив бука'), S.size('49×53×83 см'), S.load('120 кг'), S.warranty('12 месяцев')],
    variants: [color('Чёрный', 'Qora', 'Black', '#1a1a1a'), color('Белый', 'Oq', 'White', '#f2f2f0'), color('Серый', 'Kulrang', 'Grey', '#9a9a9a')],
  },
  {
    cat: 'obedennye-stulya', slug: 'stul-elegant-grey', sku: 'DN-CH-302',
    ru: 'Стул Elegant с высокой спинкой', uz: 'Baland suyanchiqli Elegant stuli', en: 'Elegant high-back chair',
    ...D(
      'Обеденный стул Elegant с высокой фигурной спинкой. Мягкая обивка, ножки из массива дуба.',
      "Baland shaklli suyanchiqli Elegant ovqatlanish stuli. Yumshoq qoplama, eman yog'ochidan oyoqlar.",
      'An Elegant dining chair with a tall shaped back. Soft upholstery, solid oak legs.',
    ),
    price: 1250000, images: ['/demo/chair-dining-grey.jpg'], is_new: true,
    specs: [S.upholstery('Рогожка'), S.material('Массив дуба'), S.size('52×58×98 см'), S.warranty('12 месяцев')],
    variants: [],
  },
  {
    cat: 'obedennye-stulya', slug: 'stul-classic-wood', sku: 'DN-CH-303',
    ru: 'Деревянный стул Classic', uz: "Classic yog'och stuli", en: 'Classic wooden chair',
    ...D(
      'Стул Classic из массива дерева с плетёным сиденьем — тёплый натуральный акцент для кухни или дачи.',
      "To'qilgan o'rindiqli yog'ochdan Classic stul — oshxona yoki dala hovli uchun iliq tabiiy aksent.",
      'A Classic solid-wood chair with a woven seat — a warm natural accent for a kitchen or country house.',
    ),
    price: 540000, images: ['/demo/chair-wood.jpg'],
    specs: [S.material('Массив дерева, ротанг'), S.size('45×48×90 см'), S.warranty('12 месяцев')],
    variants: [],
  },
  {
    cat: 'ofisnye-kresla', slug: 'stol-i-kreslo-workspace', sku: 'DN-OF-401',
    ru: 'Офисное кресло ErgoPro', uz: 'ErgoPro ofis kreslosi', en: 'ErgoPro office chair',
    ...D(
      'Эргономичное офисное кресло с поддержкой поясницы, регулировкой высоты и механизмом качания. Сетчатая спинка не даёт перегреваться.',
      "Bel qismini qo'llab-quvvatlovchi, balandligi sozlanadigan va tebranish mexanizmli ergonomik ofis kreslosi. To'rli suyanchiq qizib ketishning oldini oladi.",
      'An ergonomic office chair with lumbar support, height adjustment and tilt mechanism. The mesh back keeps you cool.',
    ),
    price: 1890000, old_price: 2300000, images: ['/demo/desk-office.jpg'], is_hit: true,
    specs: [S.material('Сетка, пластик, хром'), S.load('130 кг'), S.warranty('24 месяца')],
    variants: [color('Серый', 'Kulrang', 'Grey', '#6e7378'), color('Чёрный', 'Qora', 'Black', '#1d1d1d')],
  },
  {
    cat: 'barnye-stulya', slug: 'barnyy-stul-loft', sku: 'DN-BS-501',
    ru: 'Барный стул Loft', uz: 'Loft bar stuli', en: 'Loft bar stool',
    ...D(
      'Высокий барный стул Loft из массива дерева с подставкой для ног. Подходит для кухонного острова и барной стойки.',
      "Oyoq qo'yish joyi bo'lgan yog'ochdan baland Loft bar stuli. Oshxona oroli va bar peshtaxtasi uchun mos.",
      'A tall Loft bar stool in solid wood with a footrest. Fits a kitchen island or bar counter.',
    ),
    price: 620000, images: ['/demo/stool-bar.jpg'],
    specs: [S.material('Массив бука'), S.size('40×40×75 см'), S.load('110 кг'), S.warranty('12 месяцев')],
    variants: [size('Высота 65 см', 'Balandligi 65 sm', 'Height 65 cm', 590000), size('Высота 75 см', 'Balandligi 75 sm', 'Height 75 cm', 620000)],
  },
  {
    cat: 'pismennye-stoly', slug: 'pismennyy-stol-oak', sku: 'DN-TB-601',
    ru: 'Письменный стол Oak Studio', uz: 'Oak Studio yozuv stoli', en: 'Oak Studio desk',
    ...D(
      'Минималистичный письменный стол из шпона дуба на тонких металлических ножках. Для домашнего офиса и учёбы.',
      "Ingichka metall oyoqlardagi eman shponidan minimalistik yozuv stoli. Uy ofisi va o'qish uchun.",
      'A minimalist oak-veneer desk on slim metal legs. For a home office or studying.',
    ),
    price: 2650000, images: ['/demo/desk-wood.jpg'], is_new: true,
    specs: [S.material('Шпон дуба, металл'), S.size('120×60×75 см'), S.warranty('18 месяцев')],
    variants: [size('120×60 см', '120×60 sm', '120×60 cm', 2650000), size('140×70 см', '140×70 sm', '140×70 cm', 2990000)],
  },
  {
    cat: 'zhurnalnye-stoly', slug: 'stolik-round-white', sku: 'DN-TB-602',
    ru: 'Круглый столик Tulip', uz: 'Tulip dumaloq stolchasi', en: 'Tulip round table',
    ...D(
      'Круглый столик Tulip с белой столешницей и деревянными ножками — для кофе, завтрака или как приставной столик.',
      "Oq stol usti va yog'och oyoqli Tulip dumaloq stolchasi — qahva, nonushta uchun yoki yonma-yon stolcha sifatida.",
      'A Tulip round table with a white top and wooden legs — for coffee, breakfast or as a side table.',
    ),
    price: 980000, images: ['/demo/stool-table.jpg', '/demo/dining-round.jpg'],
    specs: [S.material('МДФ, массив бука'), S.size('Ø 80×75 см'), S.warranty('12 месяцев')],
    variants: [],
  },
  {
    cat: 'spalnya', slug: 'krovat-provence', sku: 'DN-BD-701',
    ru: 'Кровать Provence с мягким изголовьем', uz: 'Yumshoq bosh qismli Provence karavoti', en: 'Provence bed with upholstered headboard',
    ...D(
      'Двуспальная кровать Provence с высоким мягким изголовьем и каретной стяжкой. Ортопедическое основание входит в комплект.',
      "Baland yumshoq bosh qismli va karetka tikuvli ikki kishilik Provence karavoti. Ortopedik asos to'plamga kiradi.",
      'A Provence double bed with a tall tufted headboard. Orthopedic base included.',
    ),
    price: 9800000, old_price: 11200000, images: ['/demo/bed-classic.jpg', '/demo/bed-linen.jpg'], is_hit: true,
    specs: [S.upholstery('Велюр'), S.frame('Массив сосны, ЛДСП'), S.size('180×200 см'), S.warranty('24 месяца')],
    variants: [size('160×200 см', '160×200 sm', '160×200 cm', 8900000), size('180×200 см', '180×200 sm', '180×200 cm', 9800000)],
  },
  {
    cat: 'hranenie', slug: 'stellazh-cube', sku: 'DN-ST-801',
    ru: 'Настенные полки Cube', uz: 'Cube devor javonlari', en: 'Cube wall shelves',
    ...D(
      'Набор навесных полок Cube для гостиной: книги, декор, техника. Комбинируйте модули как вам удобно.',
      "Mehmonxona uchun Cube osma javonlar to'plami: kitoblar, dekor, texnika. Modullarni o'zingizga qulay tarzda birlashtiring.",
      'A set of Cube wall shelves for the living room: books, decor, electronics. Combine the modules any way you like.',
    ),
    price: 1750000, images: ['/demo/shelves-wall.jpg'], is_new: true,
    specs: [S.material('ЛДСП, МДФ'), S.size('180×30×120 см'), S.warranty('12 месяцев')],
    variants: [],
  },
  {
    cat: 'hranenie', slug: 'shkaf-pillar', sku: 'DN-ST-802',
    ru: 'Шкаф-пенал Pillar', uz: 'Pillar shkaf-penali', en: 'Pillar tall cabinet',
    ...D(
      'Узкий шкаф-пенал Pillar с открытыми полками и дверцей. Отличное решение для небольших пространств.',
      "Ochiq javonli va eshikli tor Pillar shkaf-penali. Kichik joylar uchun ajoyib yechim.",
      'A slim Pillar tall cabinet with open shelves and a door. A great solution for small spaces.',
    ),
    price: 2100000, images: ['/demo/wardrobe-shelf.jpg'],
    stock_status: 'preorder',
    specs: [S.material('ЛДСП (дуб сонома)'), S.size('45×35×200 см'), S.warranty('12 месяцев')],
    variants: [],
  },
  {
    cat: 'hranenie', slug: 'komod-golden', sku: 'DN-ST-803',
    ru: 'Комод Golden с латунными ручками', uz: 'Latun tutqichli Golden komodi', en: 'Golden sideboard with brass handles',
    ...D(
      'Стильный комод Golden с фасадами в рейку и латунными ручками. Вместительные ящики и полки внутри.',
      "Reykali fasadlar va latun tutqichli zamonaviy Golden komodi. Ichida sig'imli tortmalar va javonlar.",
      'A stylish Golden sideboard with fluted fronts and brass handles. Roomy drawers and shelves inside.',
    ),
    price: 4300000, images: ['/demo/sideboard.jpg'], is_new: true,
    specs: [S.material('МДФ, металл'), S.size('160×42×80 см'), S.warranty('18 месяцев')],
    variants: [],
  },
  {
    cat: 'stolovaya', slug: 'obedennaya-gruppa-emerald', sku: 'DN-DN-901',
    ru: 'Обеденная группа Emerald (стол + 6 стульев)', uz: "Emerald ovqatlanish to'plami (stol + 6 stul)", en: 'Emerald dining set (table + 6 chairs)',
    ...D(
      'Комплект для столовой: стол из массива дерева и шесть стульев в изумрудном велюре. Идеален для семейных ужинов.',
      "Oshxona uchun to'plam: yog'ochdan stol va zumrad velyurdagi oltita stul. Oilaviy kechki ovqatlar uchun ideal.",
      'A dining set: a solid-wood table and six chairs in emerald velvet. Perfect for family dinners.',
    ),
    price: 14500000, old_price: 16900000, images: ['/demo/dining-green.jpg', '/demo/banner-dining.jpg'], is_hit: true,
    specs: [S.material('Массив дуба, велюр'), S.size('Стол 200×100×76 см'), S.seats('6'), S.warranty('24 месяца')],
    variants: [],
  },
  {
    cat: 'stolovaya', slug: 'obedennaya-gruppa-light', sku: 'DN-DN-902',
    ru: 'Обеденная группа Light (стол + 4 стула)', uz: "Light ovqatlanish to'plami (stol + 4 stul)", en: 'Light dining set (table + 4 chairs)',
    ...D(
      'Светлый обеденный комплект в скандинавском стиле — стол и четыре мягких стула. Подходит для кухни-гостиной.',
      "Skandinav uslubidagi yorug' ovqatlanish to'plami — stol va to'rtta yumshoq stul. Oshxona-mehmonxona uchun mos.",
      'A light Scandinavian-style dining set — a table and four upholstered chairs. Great for an open-plan kitchen.',
    ),
    price: 7400000, images: ['/demo/dining-set.jpg', '/demo/dining-round.jpg'],
    specs: [S.material('МДФ, массив бука, рогожка'), S.size('Стол 140×80×75 см'), S.seats('4'), S.warranty('18 месяцев')],
    variants: [],
  },
];

let made = 0;
for (const [i, p] of PRODUCTS.entries()) {
  const { cat, variants, ru, uz, en, ...rest } = p;
  const row = must(
    await sb
      .from('products')
      .insert({
        ...rest,
        category_id: catId[cat],
        name_ru: ru,
        name_uz: uz,
        name_en: en,
        stock_status: rest.stock_status ?? 'in_stock',
        is_new: rest.is_new ?? false,
        is_hit: rest.is_hit ?? false,
        sort: i,
      })
      .select('id')
      .single(),
    `product ${p.slug}`,
  );
  if (variants.length) {
    must(await sb.from('product_variants').insert(variants.map((v, k) => ({ ...v, product_id: row.id, sort: k, stock: 10 }))), `variants ${p.slug}`);
  }
  made++;
}
console.log(`✔ ${made} products`);

// ---------------------------------------------------------------- Banners
must(
  await sb.from('banners').insert([
    {
      title_ru: 'Мебель, в которой хочется жить',
      title_uz: 'Yashagingiz keladigan mebel',
      title_en: 'Furniture you want to live with',
      subtitle_ru: 'Бесплатная доставка по всему Узбекистану и рассрочка 0%',
      subtitle_uz: "Butun O'zbekiston bo'ylab bepul yetkazib berish va 0% muddatli to'lov",
      subtitle_en: 'Free delivery across Uzbekistan and 0% installments',
      image: '/demo/banner-living.jpg',
      link: '/catalog',
      sort: 0,
    },
    {
      title_ru: 'Скидки до 20% на диваны',
      title_uz: 'Divanlarga 20% gacha chegirma',
      title_en: 'Up to 20% off sofas',
      subtitle_ru: 'Обновите гостиную уже этой осенью',
      subtitle_uz: 'Mehmonxonangizni shu kuzda yangilang',
      subtitle_en: 'Refresh your living room this autumn',
      image: '/demo/banner-loft.jpg',
      link: '/catalog?category=divany',
      sort: 1,
    },
    {
      title_ru: 'Столовые группы для всей семьи',
      title_uz: 'Butun oila uchun ovqatlanish to‘plamlari',
      title_en: 'Dining sets for the whole family',
      subtitle_ru: 'Стол и стулья в едином стиле',
      subtitle_uz: 'Yagona uslubdagi stol va stullar',
      subtitle_en: 'A table and chairs in one style',
      image: '/demo/banner-dining.jpg',
      link: '/catalog?category=stolovaya',
      sort: 2,
    },
  ]),
  'banners',
);
console.log('✔ 3 banners');

// ---------------------------------------------------------------- Reviews
const { data: someProducts } = await sb.from('products').select('id, slug').limit(6);
const pid = (slug) => someProducts?.find((p) => p.slug === slug)?.id ?? null;
must(
  await sb.from('reviews').insert([
    { product_id: pid('divan-verona-velvet'), name: 'Дилноза', rating: 5, text: 'Диван просто шикарный, цвет как на фото. Привезли на следующий день и бесплатно. Спасибо!', is_approved: true },
    { product_id: pid('divan-milano-leather'), name: 'Азиз', rating: 5, text: 'Кожа качественная, сидеть очень удобно. Менеджер помог с рассрочкой за 10 минут.', is_approved: true },
    { product_id: pid('divan-oslo-grey'), name: 'Madina', rating: 4, text: "Divan juda qulay, mato sifatli. Yetkazib berish biroz kechikdi, lekin umuman mamnunman.", is_approved: true },
    { product_id: null, name: 'Сергей', rating: 5, text: 'Заказывали обеденную группу и кровать. Всё собрали аккуратно, качество отличное.', is_approved: true },
    { product_id: null, name: 'Jasur', rating: 5, text: "Narxlar hamyonbop, xizmat a'lo darajada. Do'stlarimga tavsiya qilaman!", is_approved: true },
    { product_id: null, name: 'Анна', rating: 5, text: 'Красивая мебель и приятный сервис. Отдельное спасибо за уведомления в Telegram о статусе заказа.', is_approved: true },
  ]),
  'reviews',
);
console.log('✔ 6 reviews');

// ---------------------------------------------------------------- Promo
await sb.from('promo_codes').upsert({ code: 'DIONN10', type: 'percent', value: 10, min_total: 1000000, is_active: true });
console.log('✔ promo code DIONN10 (−10% from 1 000 000 сум)');
console.log('\nDone! Open http://localhost:3000');
