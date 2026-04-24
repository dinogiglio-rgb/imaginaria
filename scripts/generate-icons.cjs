const sharp = require('sharp');
const path = require('path');

const SOURCE = path.join(__dirname, '../src/assets/logo.png');
const OUT = path.join(__dirname, '../public');

const BG_CORAL = { r: 255, g: 127, b: 106, alpha: 1 }; // #FF7F6A

async function generateIcon(size, filename, bg) {
  const padding = Math.round(size * 0.12);
  const logoSize = size - padding * 2;

  const logo = await sharp(SOURCE)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: bg }
  })
    .composite([{ input: logo, top: padding, left: padding }])
    .png()
    .toFile(path.join(OUT, filename));

  console.log(`✅ Generato: ${filename}`);
}

async function generateTransparentLogo(size, filename) {
  await sharp(SOURCE)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT, filename));
  console.log(`✅ Generato: ${filename}`);
}

async function main() {
  await generateIcon(512, 'pwa-512x512.png', BG_CORAL);
  await generateIcon(192, 'pwa-192x192.png', BG_CORAL);
  await generateIcon(180, 'apple-touch-icon.png', BG_CORAL);
  await generateTransparentLogo(400, 'logo-transparent.png');
  console.log('🎉 Tutto generato!');
}

main().catch(console.error);
