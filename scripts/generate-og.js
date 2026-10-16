const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processOgImage() {
  const rootDir = path.resolve(__dirname, '..');
  const sourceImage = 'C:/Users/Denzel/.gemini/antigravity/brain/9c6e9abc-ce99-4bf2-8c3f-61e1a131ccd2/noir_casefile_og_banner_1792132643892.jpg';
  const publicOg = path.join(rootDir, 'public', 'og-image.png');
  const appOg = path.join(rootDir, 'src', 'app', 'opengraph-image.png');
  const twitterOg = path.join(rootDir, 'src', 'app', 'twitter-image.png');

  // SVG overlay for branding & typography that looks stunning on social shares
  const overlaySvg = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Dark gradient across bottom and left for text legibility -->
        <linearGradient id="vignette" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#09090b" stop-opacity="0.95" />
          <stop offset="45%" stop-color="#09090b" stop-opacity="0.75" />
          <stop offset="75%" stop-color="#09090b" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#09090b" stop-opacity="0.3" />
        </linearGradient>

        <linearGradient id="sideDark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#09090b" stop-opacity="0.85" />
          <stop offset="40%" stop-color="#09090b" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#09090b" stop-opacity="0.1" />
        </linearGradient>

        <linearGradient id="amberText" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#fef3c7" />
          <stop offset="60%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#d97706" />
        </linearGradient>

        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.9" />
        </filter>
      </defs>

      <!-- Gradient Overlays -->
      <rect width="1200" height="630" fill="url(#vignette)" />
      <rect width="1200" height="630" fill="url(#sideDark)" />

      <!-- Top Border Gold Bar -->
      <rect x="0" y="0" width="1200" height="6" fill="#f59e0b" />

      <!-- Top Badge / Header Tag -->
      <g transform="translate(60, 52)">
        <rect x="0" y="0" width="220" height="34" rx="6" fill="#7f1d1d" fill-opacity="0.9" stroke="#dc2626" stroke-width="1.5" />
        <text x="110" y="22" font-family="'Courier New', monospace" font-size="13" font-weight="900" fill="#fecaca" text-anchor="middle" letter-spacing="3">UNSOLVED HOMICIDE</text>
      </g>

      <!-- Main Title -->
      <g filter="url(#shadow)" transform="translate(60, 410)">
        <text x="0" y="0" font-family="'Arial Black', Impact, sans-serif" font-size="78" font-weight="900" fill="url(#amberText)" letter-spacing="4">NOIR CASEFILE</text>
        <text x="0" y="52" font-family="'Georgia', serif" font-style="italic" font-size="28" fill="#e4e4e7" letter-spacing="1">Procedural AI Murder Mystery · Find the Crack in the Alibi</text>
      </g>

      <!-- Bottom Feature Badges -->
      <g transform="translate(60, 530)" font-family="'Courier New', monospace" font-size="14" font-weight="bold">
        <!-- Badge 1 -->
        <rect x="0" y="0" width="210" height="32" rx="4" fill="#18181b" stroke="#3f3f46" stroke-width="1" />
        <text x="105" y="21" fill="#f59e0b" text-anchor="middle">🔍 Procedural Cases</text>

        <!-- Badge 2 -->
        <rect x="225" y="0" width="230" height="32" rx="4" fill="#18181b" stroke="#3f3f46" stroke-width="1" />
        <text x="340" y="21" fill="#f59e0b" text-anchor="middle">🎙️ Interrogate Suspects</text>

        <!-- Badge 3 -->
        <rect x="470" y="0" width="200" height="32" rx="4" fill="#18181b" stroke="#3f3f46" stroke-width="1" />
        <text x="570" y="21" fill="#f59e0b" text-anchor="middle">⚖️ File Indictment</text>
      </g>
    </svg>
  `);

  console.log('Rendering 1200x630 OpenGraph social preview images...');

  const baseImage = await sharp(sourceImage)
    .resize(1200, 630, { fit: 'cover', position: 'center' })
    .composite([{ input: overlaySvg, top: 0, left: 0 }])
    .png({ quality: 90 })
    .toBuffer();

  fs.writeFileSync(publicOg, baseImage);
  fs.writeFileSync(appOg, baseImage);
  fs.writeFileSync(twitterOg, baseImage);

  console.log('✓ Successfully created public/og-image.png');
  console.log('✓ Successfully created src/app/opengraph-image.png');
  console.log('✓ Successfully created src/app/twitter-image.png');
}

processOgImage().catch(console.error);
