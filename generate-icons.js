const sharp = require('sharp');
const path = require('path');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#FFC000"/>
  <text x="256" y="310" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">CC</text>
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
