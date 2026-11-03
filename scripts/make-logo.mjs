// Turns the original logo (black on white) into a trimmed transparent PNG.
// Usage: node scripts/make-logo.mjs <source.png> public/brand/logo.png
import sharp from 'sharp';

const [src, out] = process.argv.slice(2);
const trimmed = await sharp(src)
  .trim({ threshold: 20 })
  .extend({ top: 4, bottom: 4, left: 4, right: 4, background: '#ffffff' })
  .toBuffer();
const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
  data[i] = data[i + 1] = data[i + 2] = 0;
  data[i + 3] = Math.max(0, Math.min(255, Math.round((255 - lum) * 1.15)));
}
await sharp(data, { raw: info }).png().toFile(out);
console.log(`${out}: ${info.width}x${info.height}`);
