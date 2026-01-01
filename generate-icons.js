const sharp = require('sharp');
const path = require('path');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#FFC000"/>
  <!-- Umbrella canopy - simple dome -->
  <path d="M256 120 C140 120 80 200 80 280 L256 280 L432 280 C432 200 372 120 256 120 Z" fill="white"/>
  <!-- Umbrella handle - centered pole -->
  <rect x="246" y="280" width="20" height="110" fill="white"/>
  <!-- Umbrella hook - curved handle centered with pole -->
  <path d="M256 390 L256 410 Q256 440 226 440 Q196 440 196 410" stroke="white" stroke-width="20" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

async function generateIcons() {
    const svgBuffer = Buffer.from(svg);
    
    // Generate 192x192 icon
    await sharp(svgBuffer)
        .resize(192, 192)
        .png()
        .toFile(path.join(__dirname, 'public', 'icon-192.png'));
    console.log('Created icon-192.png');
    
    // Generate 512x512 icon
    await sharp(svgBuffer)
        .resize(512, 512)
        .png()
        .toFile(path.join(__dirname, 'public', 'icon-512.png'));
    console.log('Created icon-512.png');
}

generateIcons().catch(console.error);
