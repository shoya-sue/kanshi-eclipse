// This script generates PWA icons in different sizes
// To use this script, you need to have a source icon (preferably 512x512 or larger)
// and the 'sharp' package installed: npm install --save-dev sharp

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.join(__dirname, '../src/assets/eclipse-logo.png');
const outputDir = path.join(__dirname, '../public/icons');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  try {
    for (const size of sizes) {
      await sharp(inputFile)
        .resize(size, size)
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      console.log(`Generated icon-${size}x${size}.png`);
    }
    
    // Generate maskable icon
    await sharp(inputFile)
      .resize(512, 512)
      .extend({
        top: 64,
        bottom: 64,
        left: 64,
        right: 64,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFile(path.join(outputDir, 'icon-maskable.png'));
    console.log('Generated icon-maskable.png');
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

// Note: This script requires a source icon to be present
// For now, we'll create placeholder icons
async function createPlaceholderIcons() {
  console.log('Creating placeholder PWA icons...');
  
  for (const size of sizes) {
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#6B46C1"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="${size * 0.3}px" font-weight="bold">E</text>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Created placeholder icon-${size}x${size}.png`);
  }
  
  // Create maskable icon
  const maskableSvg = `
    <svg width="640" height="640" xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="640" fill="white"/>
      <rect x="64" y="64" width="512" height="512" fill="#6B46C1"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="153px" font-weight="bold">E</text>
    </svg>
  `;
  
  await sharp(Buffer.from(maskableSvg))
    .png()
    .toFile(path.join(outputDir, 'icon-maskable.png'));
  console.log('Created placeholder icon-maskable.png');
  
  // Create shortcuts icons
  const shortcuts = [
    { name: 'gas-tracker', color: '#3B82F6' },
    { name: 'transaction-analyzer', color: '#10B981' },
    { name: 'wallet', color: '#8B5CF6' }
  ];
  
  for (const shortcut of shortcuts) {
    const shortcutSvg = `
      <svg width="96" height="96" xmlns="http://www.w3.org/2000/svg">
        <rect width="96" height="96" fill="${shortcut.color}"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="48px" font-weight="bold">${shortcut.name.charAt(0).toUpperCase()}</text>
      </svg>
    `;
    
    await sharp(Buffer.from(shortcutSvg))
      .png()
      .toFile(path.join(outputDir, `${shortcut.name}-icon.png`));
    console.log(`Created ${shortcut.name}-icon.png`);
  }
  
  // Create screenshot placeholders
  const screenshotsDir = path.join(__dirname, '../public/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const screenshots = [
    { name: 'desktop-home', width: 1280, height: 800 },
    { name: 'mobile-home', width: 375, height: 812 }
  ];
  
  for (const screenshot of screenshots) {
    const screenshotSvg = `
      <svg width="${screenshot.width}" height="${screenshot.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${screenshot.width}" height="${screenshot.height}" fill="#1F2937"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="48px" font-weight="bold">Eclipse Chain Tools</text>
      </svg>
    `;
    
    await sharp(Buffer.from(screenshotSvg))
      .png()
      .toFile(path.join(screenshotsDir, `${screenshot.name}.png`));
    console.log(`Created ${screenshot.name}.png`);
  }
  
  console.log('All placeholder icons and screenshots created successfully!');
}

// Run the placeholder icon creation
createPlaceholderIcons().catch(console.error);

export { generateIcons, createPlaceholderIcons };