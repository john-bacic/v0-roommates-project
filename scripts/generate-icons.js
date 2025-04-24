const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const sizes = [192, 512];
  const iconDir = path.join(__dirname, '../public/icons');
  
  // Ensure the directory exists
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }
  
  for (const size of sizes) {
    const svgPath = path.join(iconDir, `icon-${size}x${size}.svg`);
    const pngPath = path.join(iconDir, `icon-${size}x${size}.png`);
    
    if (fs.existsSync(svgPath)) {
      try {
        await sharp(svgPath)
          .png()
          .toFile(pngPath);
        console.log(`Generated ${pngPath}`);
      } catch (error) {
        console.error(`Error generating ${pngPath}:`, error);
      }
    } else {
      console.error(`Source SVG not found: ${svgPath}`);
    }
  }
}

generateIcons().catch(console.error);
