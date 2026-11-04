// Imports the real product photos from ../dionn_f furniture as catalog products.
// Files are named NNN_slug.jpg (main photo) + NNN_slug_2.jpg, _3 … (other angles).
// Copies the photos to public/products and upserts one product per NNN (by slug), so it is safe to re-run.
// Usage:  node --env-file=.env.local scripts/import-furniture.mjs
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SRC = path.resolve('../dionn_f furniture');
const DEST = path.resolve('public/products');

// code: [category slug, kind, name ru, name uz, name en, price (UZS), flags]
const P = {
  '002': ['pryamye-divany', 'sofa', 'Диван Siena, бежевый', 'Siena divani, bej', 'Siena sofa, beige', 6400000],
  '005': ['ofisnye-kresla', 'office', 'Кресло Aqua на колёсиках', "G'ildirakli Aqua kreslosi", 'Aqua chair on wheels', 1650000, { new: 1 }],
  '007': ['pryamye-divany', 'sofa', 'Диван Forest, зелёный', 'Forest divani, yashil', 'Forest sofa, green', 7200000],
  '010': ['pryamye-divany', 'sofa', 'Диван Sunny, жёлтый', 'Sunny divani, sariq', 'Sunny sofa, yellow', 6900000, { hit: 1 }],
  '012': ['kresla', 'set', 'Набор кресел Trio (3 шт.)', "Trio kreslolar to'plami (3 dona)", 'Trio lounge chairs (set of 3)', 7800000],
  '014': ['kresla', 'swivel', 'Вращающееся кресло Aurum', 'Aylanuvchi Aurum kreslosi', 'Aurum swivel chair', 3900000, { hit: 1 }],
  '015': ['pryamye-divany', 'sofa', 'Диван Luna с подушками', 'Yostiqli Luna divani', 'Luna sofa with cushions', 8200000, { new: 1 }],
  '019': ['kresla', 'armchair', 'Кресло Navy, синий велюр', 'Navy kreslosi, ko‘k velyur', 'Navy armchair, blue velvet', 3400000],
  '020': ['pryamye-divany', 'sofa', 'Диван Lagoon, бирюзовый', 'Lagoon divani, firuza', 'Lagoon sofa, teal', 7600000],
  '024': ['pryamye-divany', 'sofa', 'Диван Stone, серый', 'Stone divani, kulrang', 'Stone sofa, grey', 6800000],
  '025': ['kresla', 'booth', 'Кресло-кабина Orange', 'Orange kabina-kreslosi', 'Orange high-back booth chair', 5900000],
  '026': ['pryamye-divany', 'sofa', 'Диван Cream с подушками', 'Yostiqli Cream divani', 'Cream sofa with cushions', 8900000, { hit: 1 }],
  '027': ['pryamye-divany', 'sofa', 'Диван Ivory со стяжкой', 'Tikuvli Ivory divani', 'Ivory tufted sofa', 7400000],
  '028': ['obedennye-stulya', 'dining', 'Стул Shell с мягкой спинкой', 'Yumshoq suyanchiqli Shell stuli', 'Shell dining chair', 1150000],
  '029': ['pryamye-divany', 'sofa', 'Диван Ocean, синий', 'Ocean divani, ko‘k', 'Ocean sofa, blue', 7900000, { new: 1 }],
  '031': ['kresla', 'armchair', 'Кресло Cloud, серое', 'Cloud kreslosi, kulrang', 'Cloud tub chair, grey', 2900000],
  '032': ['ofisnye-kresla', 'office', 'Офисное кресло Pebble', 'Pebble ofis kreslosi', 'Pebble office chair', 1450000],
  '034': ['kresla', 'armchair', 'Кожаное кресло Onyx', 'Onyx charm kreslosi', 'Onyx leather armchair', 3600000],
  '035': ['pryamye-divany', 'sofa', 'Диван Sky с горчичными подушками', 'Xantal yostiqli Sky divani', 'Sky sofa with mustard cushions', 8400000, { hit: 1 }],
  '038': ['pryamye-divany', 'loveseat', 'Двухместный диван Mist', "Ikki o'rinli Mist divani", 'Mist loveseat', 5400000],
  '040': ['pryamye-divany', 'sofa', 'Диван Mocha', 'Mocha divani', 'Mocha sofa', 7100000],
  '041': ['kresla', 'set', 'Кресла Petal (пара)', 'Petal kreslolari (juft)', 'Petal chairs (pair)', 5200000, { new: 1 }],
  '042': ['kresla', 'armchair', 'Кресло Ruby, красный велюр', 'Ruby kreslosi, qizil velyur', 'Ruby tub chair, red velvet', 3300000, { hit: 1 }],
  '043': ['kresla', 'swivel', 'Вращающиеся кресла Terra', 'Aylanuvchi Terra kreslolari', 'Terra wingback swivel chairs', 4200000],
  '053': ['kresla', 'swivel', 'Вращающееся кресло Duo', 'Aylanuvchi Duo kreslosi', 'Duo two-tone swivel chair', 3700000, { new: 1 }],
  '056': ['kozhanye-divany', 'sofa', 'Диван Chesterfield, коричневый', 'Chesterfield divani, jigarrang', 'Chesterfield sofa, brown', 13900000, { hit: 1 }],
  '078': ['pryamye-divany', 'sofa', 'Диван Pleat, велюр', 'Pleat divani, velyur', 'Pleat velvet sofa', 11500000, { new: 1 }],
  '082': ['pryamye-divany', 'sofa', 'Диван Blush с пуфами', 'Pufli Blush divani', 'Blush sofa with poufs', 10200000],
  '083': ['kresla', 'booth', 'Кресла-кабины Duo Color', 'Duo Color kabina-kreslolari', 'Duo Color high-back booth chairs', 11200000],
  '084': ['pryamye-divany', 'sofa', 'Диван Snow, букле', 'Snow divani, bukle', 'Snow boucle sofa', 9800000, { new: 1 }],
  '085': ['kresla', 'armchair', 'Кресло Terracotta', 'Terracotta kreslosi', 'Terracotta tub chair', 3100000],
  '087': ['kresla', 'armchair', 'Кресло Rose с металлическими подлокотниками', 'Metall tirsakli Rose kreslosi', 'Rose lounge chair with metal arms', 3500000],
  '088': ['kresla', 'armchair', 'Кресло Cocoa, букле', 'Cocoa kreslosi, bukle', 'Cocoa boucle chair', 3800000, { new: 1 }],
  '090': ['kozhanye-divany', 'sofa', 'Кожаный диван Shell', 'Shell charm divani', 'Shell leather sofa', 9900000],
  '092': ['kresla', 'swivel', 'Вращающееся кресло Mosaic', 'Aylanuvchi Mosaic kreslosi', 'Mosaic swivel chair', 3200000],
  '094': ['pryamye-divany', 'sofa', 'Диван Kiss, красный', 'Kiss divani, qizil', 'Kiss lips sofa, red', 9500000, { new: 1 }],
  '095': ['kozhanye-divany', 'sofa', 'Кожаный диван Amber', 'Amber charm divani', 'Amber leather sofa', 12800000],
  '098': ['divany', 'corner', 'Угловой диван Sage', 'Sage burchak divani', 'Sage corner sofa', 11900000],
  '099': ['kresla', 'armchair', 'Кресло Contrast', 'Contrast kreslosi', 'Contrast two-tone armchair', 3400000],
  '101': ['pryamye-divany', 'sofa', 'Диван Wave, изогнутый', 'Wave divani, egilgan', 'Wave curved sofa', 9200000, { hit: 1 }],
  '102': ['ofisnye-kresla', 'office', 'Офисные кресла Team (набор)', "Team ofis kreslolari (to'plam)", 'Team office chairs (set)', 8400000],
  '103': ['pryamye-divany', 'sofabed', 'Диван-кровать Tango', 'Tango divan-karavoti', 'Tango sofa bed', 7300000],
  '105': ['barnye-stulya', 'bar', 'Барный стул Emerald', 'Emerald bar stuli', 'Emerald bar stool', 1290000, { new: 1 }],
  '107': ['divany', 'corner', 'Угловой диван Bordeaux со стяжкой', 'Tikuvli Bordeaux burchak divani', 'Bordeaux tufted corner sofa', 12500000],
  '110': ['kresla', 'armchair', 'Кресло Puff, букле', 'Puff kreslosi, bukle', 'Puff boucle chair', 3600000],
  '112': ['kresla', 'set', 'Кожаные кресла Club (пара)', 'Club charm kreslolari (juft)', 'Club leather chairs (pair)', 6400000],
  '115': ['pryamye-divany', 'loveseat', 'Двухместный диван Frost', "Ikki o'rinli Frost divani", 'Frost loveseat', 5900000],
  '116': ['kresla', 'swivel', 'Вращающееся кресло Caramel', 'Aylanuvchi Caramel kreslosi', 'Caramel swivel chair', 2700000],
  '117': ['obedennye-stulya', 'dining', 'Стул Olive с подлокотниками', 'Tirsakli Olive stuli', 'Olive dining armchair', 1390000, { hit: 1 }],
  '119': ['obedennye-stulya', 'dining', 'Стул Taupe', 'Taupe stuli', 'Taupe dining chair', 1190000],
};

// Short descriptions per kind: (ru, uz, en)
const DESC = {
  sofa: [
    'Мягкий и удобный диван для гостиной. Наполнитель из пены высокой плотности, прочный деревянный каркас и износостойкая обивка.',
    "Mehmonxona uchun yumshoq va qulay divan. Yuqori zichlikdagi ko'pik, mustahkam yog'och karkas va chidamli qoplama.",
    'A soft, comfortable living-room sofa. High-density foam, a sturdy wooden frame and hard-wearing upholstery.',
  ],
  loveseat: [
    'Компактный двухместный диван — идеален для небольшой гостиной, спальни или кабинета.',
    "Ixcham ikki o'rinli divan — kichik mehmonxona, yotoqxona yoki kabinet uchun ideal.",
    'A compact two-seater — perfect for a small living room, bedroom or study.',
  ],
  corner: [
    'Вместительный угловой диван для всей семьи. Глубокая посадка и мягкие подушки.',
    "Butun oila uchun keng burchak divani. Chuqur o'tirish joyi va yumshoq yostiqlar.",
    'A roomy corner sofa for the whole family. Deep seat and soft cushions.',
  ],
  sofabed: [
    'Диван-кровать с механизмом раскладывания: днём — диван, ночью — полноценное спальное место.',
    "Yoyiladigan mexanizmli divan-karavot: kunduzi divan, kechasi to'liq yotoq joyi.",
    'A sofa bed with a fold-out mechanism: a sofa by day, a full bed by night.',
  ],
  armchair: [
    'Уютное мягкое кресло — для отдыха, чтения или как яркий акцент интерьера.',
    "Shinam yumshoq kreslo — dam olish, kitob o'qish yoki interyerda yorqin aksent uchun.",
    'A cozy upholstered armchair — for relaxing, reading or as a bold accent piece.',
  ],
  swivel: [
    'Кресло на вращающемся основании (360°). Подойдёт для гостиной, спальни, офиса или лаунж-зоны.',
    'Aylanuvchi asosdagi kreslo (360°). Mehmonxona, yotoqxona, ofis yoki lounge zonasi uchun mos.',
    'A chair on a 360° swivel base. Great for a living room, bedroom, office or lounge area.',
  ],
  set: [
    'Комплект мягких кресел в едином стиле — для гостиной, кафе или зоны ожидания.',
    "Yagona uslubdagi yumshoq kreslolar to'plami — mehmonxona, kafe yoki kutish zonasi uchun.",
    'A matching set of upholstered chairs — for a living room, café or waiting area.',
  ],
  booth: [
    'Кресло с высокой спинкой и боковинами — создаёт личное пространство в офисе, коворкинге или лобби.',
    "Baland suyanchiq va yon devorli kreslo — ofis, kovorking yoki lobbida shaxsiy joy yaratadi.",
    'A high-back booth chair that creates a private nook in an office, co-working space or lobby.',
  ],
  office: [
    'Удобное кресло на колёсиках с регулировкой высоты — для домашнего офиса и рабочего места.',
    "Balandligi sozlanadigan g'ildirakli qulay kreslo — uy ofisi va ish joyi uchun.",
    'A comfortable height-adjustable chair on castors — for a home office or workspace.',
  ],
  dining: [
    'Мягкий обеденный стул на металлических ножках — для кухни, столовой или кафе.',
    "Metall oyoqli yumshoq ovqatlanish stuli — oshxona, ovqatlanish xonasi yoki kafe uchun.",
    'An upholstered dining chair on metal legs — for a kitchen, dining room or café.',
  ],
  bar: [
    'Барный стул с мягким сиденьем и подставкой для ног — для кухонного острова и барной стойки.',
    "Yumshoq o'rindiqli va oyoq qo'yish joyli bar stuli — oshxona oroli va bar peshtaxtasi uchun.",
    'A padded bar stool with a footrest — for a kitchen island or bar counter.',
  ],
};

// ---------------------------------------------------------------- Photos
const groups = {};
for (const f of fs.readdirSync(SRC).filter((f) => /\.jpe?g$/i.test(f))) {
  const m = f.match(/^(\d{3})_(.+?)(?:_(\d+))?\.jpe?g$/i);
  if (!m) continue;
  const [, code, name, n] = m;
  (groups[code] ??= { name, files: [] }).files.push({ f, n: n ? Number(n) : 1 });
}
// Start clean so replaced photos don't linger; a content hash in the name busts browser/CDN caches.
fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });
for (const g of Object.values(groups)) {
  g.files.sort((a, b) => a.n - b.n);
  g.images = await Promise.all(
    g.files.map(async ({ f, n }) => {
      const buf = await squareOnWhite(path.join(SRC, f));
      const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
      const out = `${g.name}${n > 1 ? `-${n}` : ''}-${hash}.jpg`;
      fs.writeFileSync(path.join(DEST, out), buf);
      return `/products/${out}`;
    }),
  );
}

// Product boxes on the site are square: shrink the whole photo to fit a square
// (with a small margin) and fill the leftover space with white, so nothing gets cut off.
async function squareOnWhite(file) {
  const SIZE = 1200, INNER = Math.round(SIZE * 0.9);
  const white = { r: 255, g: 255, b: 255, alpha: 1 };
  const { data, info } = await sharp(file).flatten({ background: white }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  // Some photos have an off-white/light-grey studio background: push near-white pixels to pure white
  // (smooth ramp, so light fabric stays untouched) so the photo blends into the white padding.
  const LO = 228, HI = 240;
  for (let i = 0; i < data.length; i += 3) {
    const m = Math.min(data[i], data[i + 1], data[i + 2]);
    if (m <= LO) continue;
    const t = Math.min(1, (m - LO) / (HI - LO));
    for (let c = 0; c < 3; c++) data[i + c] += Math.round((255 - data[i + c]) * t);
  }
  const fitted = await sharp(data, { raw: info }).resize(INNER, INNER, { fit: 'contain', background: white }).png().toBuffer();
  return sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: white } })
    .composite([{ input: fitted, gravity: 'center' }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}
const missing = Object.keys(groups).filter((c) => !P[c]);
if (missing.length) console.warn('⚠ no product data for:', missing.join(', '));
console.log(`✔ ${Object.values(groups).reduce((a, g) => a + g.images.length, 0)} photos copied to public/products`);

// ---------------------------------------------------------------- Products
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data: cats, error: ce } = await sb.from('categories').select('id, slug');
if (ce) throw ce;
const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

const warranty = { ru: 'Гарантия', uz: 'Kafolat', en: 'Warranty', value: '12 месяцев' };
const rows = Object.entries(P)
  .filter(([code]) => groups[code])
  .map(([code, [cat, kind, ru, uz, en, price, flags = {}]], i) => {
    if (!catId[cat]) throw new Error(`unknown category ${cat}`);
    const [dru, duz, den] = DESC[kind];
    return {
      slug: `${groups[code].name}-${code}`,
      sku: `DN-F-${code}`,
      category_id: catId[cat],
      name_ru: ru,
      name_uz: uz,
      name_en: en,
      description_ru: dru,
      description_uz: duz,
      description_en: den,
      price,
      images: groups[code].images,
      specs: [warranty],
      stock_status: 'in_stock',
      is_new: !!flags.new,
      is_hit: !!flags.hit,
      sort: 100 + i,
    };
  });

const { error } = await sb.from('products').upsert(rows, { onConflict: 'slug' });
if (error) throw error;
console.log(`✔ ${rows.length} products added/updated`);
