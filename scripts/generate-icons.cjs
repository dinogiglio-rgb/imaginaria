const sharp = require('sharp');
const path = require('path');

const SOURCE = path.join(__dirname, '../src/assets/logo.png');
const OUT = path.join(__dirname, '../public');
const BG = { r: 250, g: 249, b: 246, alpha: 1 }; // #FAF9F6 Paper Cream

async function generateIcon(size, filename) {
  const padding = Math.round(size * 0.1);
  const logoSize = size - padding * 2;

  const logo = await sharp(SOURCE)
    .resize(logoSize, logoSize, { fit: 'contain', background: BG })
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG }
  })
    .composite([{ input: logo, top: padding, left: padding }])
    .png()
    .toFile(path.join(OUT, filename));

  console.log(`✅ Generato: ${filename} (${size}x${size})`);
}

async function main() {
  await generateIcon(512, 'pwa-512x512.png');
  await generateIcon(192, 'pwa-192x192.png');
  await generateIcon(180, 'apple-touch-icon.png');
  console.log('🎉 Icone generate con successo!');
}

main().catch(console.error);
