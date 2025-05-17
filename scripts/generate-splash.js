const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateSplash() {
  const splashDir = path.join(__dirname, '../public');
  const svgPath = path.join(splashDir, 'splash.svg');
  const pngPath = path.join(splashDir, 'splash.png');
  
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

generateSplash().catch(console.error);
