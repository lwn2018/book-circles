import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [
  1024, // App Store
  180,  // iPhone @3x
  167,  // iPad Pro @2x
  152,  // iPad @2x
  120,  // iPhone @2x, Spotlight @3x
  87,   // Settings @3x
  80,   // Spotlight @2x
  76,   // iPad @1x
  60,   // iPhone @2x
  58,   // Settings @2x
  40,   // Spotlight/Settings @1x
  29,   // Settings @1x
  20,   // Notification @1x
];

const svgPath = 'public/brand/pagepass-logo-white.svg';
const outputDir = 'public/app-icons';

// Read the SVG
const svgBuffer = fs.readFileSync(svgPath);

// Background color (dark to match app theme)
const bgColor = { r: 18, g: 18, b: 18, alpha: 1 }; // #121212

async function generateIcons() {
  for (const size of sizes) {
    // Calculate logo size (80% of icon, centered)
    const logoSize = Math.round(size * 0.75);
    const padding = Math.round((size - logoSize) / 2);
    
    try {
      // Resize SVG to fit
      const resizedLogo = await sharp(svgBuffer)
        .resize(logoSize, logoSize, { fit: 'inside' })
        .png()
        .toBuffer();
      
      // Get actual dimensions after resize
      const metadata = await sharp(resizedLogo).metadata();
      
      // Create square canvas with background
      const icon = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: bgColor
        }
      })
      .composite([{
        input: resizedLogo,
        gravity: 'center'
      }])
      .png()
      .toFile(path.join(outputDir, `icon-${size}.png`));
      
      console.log(`✓ Generated icon-${size}.png`);
    } catch (err) {
      console.error(`✗ Failed ${size}:`, err.message);
    }
  }
  
  console.log('\nDone! Icons saved to public/app-icons/');
}

generateIcons();
