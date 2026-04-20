import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logoPath = join(__dirname, '../src/assets/logo.png');
const publicDir = join(__dirname, '../public');

mkdirSync(publicDir, { recursive: true });

const CORAL = { r: 255, g: 127, b: 106, alpha: 1 };

const sizes = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32,  name: 'favicon-32x32.png' },
  { size: 16,  name: 'favicon-16x16.png' },
];

for (const { size, name } of sizes) {
  const padding = Math.round(size * 0.12);
  const logoSize = size - padding * 2;

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: CORAL
    }
  })
  .composite([{
    input: await sharp(logoPath)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile(join(publicDir, name));

  console.log(`✅ Generata: ${name} (${size}x${size})`);
}

console.log('🎉 Tutte le icone generate in /public');
