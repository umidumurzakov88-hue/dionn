// Dev helper: renders a numbered grid of all images in a folder.
import sharp from 'sharp';
import fs from 'fs';
const dir = process.argv[2], out = process.argv[3];
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();
const S = 200, cols = 6, rows = Math.ceil(files.length / cols);
const comps = await Promise.all(files.map(async (f, i) => {
  const img = await sharp(`${dir}/${f}`).resize(S, S - 20, { fit: 'cover' }).toBuffer();
  const label = Buffer.from(`<svg width="${S}" height="20"><rect width="100%" height="100%" fill="white"/><text x="4" y="15" font-size="14" font-family="Arial">${i}</text></svg>`);
  return [{ input: img, left: (i % cols) * S, top: Math.floor(i / cols) * S }, { input: label, left: (i % cols) * S, top: Math.floor(i / cols) * S + S - 20 }];
}));
await sharp({ create: { width: cols * S, height: rows * S, channels: 3, background: '#fff' } }).composite(comps.flat()).jpeg().toFile(out);
files.forEach((f, i) => console.log(i, f));
