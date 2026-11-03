// Builds a square favicon from the first glyph of the logo.
import sharp from 'sharp';
const [src, out, l, t, w, h] = process.argv.slice(2);
const glyph = await sharp(src).extract({ left: +l, top: +t, width: +w, height: +h }).negate({ alpha: false }).resize(150, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const bg = Buffer.from('<svg width="256" height="256"><rect width="256" height="256" rx="56" fill="#111"/></svg>');
await sharp(bg).composite([{ input: glyph, gravity: 'center' }]).png().toFile(out);
console.log('ok', out);
