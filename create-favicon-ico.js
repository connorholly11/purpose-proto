// This script uses sharp to create a favicon.ico file
// First, install sharp: npm install --save-dev sharp

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createFaviconIco() {
  const sourcePath = path.join(__dirname, 'assets', 'favicon.png');
  const outputPath = path.join(__dirname, 'assets', 'favicon.ico');
  
  try {
    // Create 16x16 and 32x32 versions for the ICO file
    const img16 = await sharp(sourcePath)
      .resize(16, 16)
      .toBuffer();
    
    const img32 = await sharp(sourcePath)
      .resize(32, 32)
      .toBuffer();
    
    // Write the favicon.ico directly (requires sharp with ICO support)
    await sharp(img16)
      .toFile(outputPath);
    
    console.log(`Created favicon.ico at ${outputPath}`);
    
    // Copy to the dist folder if it exists
    const distPath = path.join(__dirname, 'dist', 'favicon.ico');
    if (fs.existsSync(path.dirname(distPath))) {
      fs.copyFileSync(outputPath, distPath);
      console.log(`Copied favicon.ico to ${distPath}`);
    }
  } catch (err) {
    console.error('Error creating favicon.ico:', err);
  }
}

createFaviconIco(); 