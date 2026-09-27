const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const userRaw = 'C:/Users/kenke/.gemini/antigravity-ide/brain/e20a754d-7dc9-4532-8ed3-d5ab31b29a4a/.user_uploaded/media_1790317518011.jpg';
const destUserWebp = path.join(__dirname, '..', 'public', 'hero-bg-user.webp');
const destMainWebp = path.join(__dirname, '..', 'public', 'hero-bg.webp');

async function processUserImage() {
  console.log('Processing user image to 4K WebP...');
  
  // 1. Upscale to 4K (3840x2141) with Lanczos3 and unsharp mask
  const upscaledBuffer = await sharp(userRaw)
    .resize(3840, 2141, { kernel: 'lanczos3', fit: 'cover' })
    .sharpen({ sigma: 1.5, m1: 1.0, m2: 2.2 })
    .toBuffer();

  // 2. Create a subtle top dark vignette overlay to guarantee 100% text readability
  // From pure black at the very top (0% to 28%) smoothly fading to transparent (52%)
  const svgOverlay = Buffer.from(`
    <svg width="3840" height="2141" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="darkTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#101010" stop-opacity="0.8" />
          <stop offset="20%" stop-color="#101010" stop-opacity="0.5" />
          <stop offset="42%" stop-color="#101010" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="3840" height="2141" fill="url(#darkTop)" />
    </svg>
  `);

  // 3. Composite and save as WebP with high quality
  const result = await sharp(upscaledBuffer)
    .composite([{ input: svgOverlay, blend: 'over' }])
    .webp({ quality: 92, effort: 5 })
    .toFile(destUserWebp);

  console.log('Saved hero-bg-user.webp:', (result.size / 1024).toFixed(1), 'KB');

  // Copy to hero-bg.webp as active background
  fs.copyFileSync(destUserWebp, destMainWebp);
  console.log('Copied to hero-bg.webp');
}

processUserImage().catch(console.error);
