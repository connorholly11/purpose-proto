const fs = require('fs');
const { createCanvas } = require('canvas');

// Ensure the icons directory exists
const iconDir = './public/icons';
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Generate a simple app icon with text
function generateIcon(size, text) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#3b82f6'; // Blue background matching theme-color in manifest.json
  ctx.fillRect(0, 0, size, size);
  
  // Add text
  const fontSize = Math.floor(size / 4);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);
  
  return canvas.toBuffer('image/png');
}

// Generate and save the icons
const icons = [
  { size: 192, filename: 'icon-192x192.png', text: 'AI' },
  { size: 512, filename: 'icon-512x512.png', text: 'AI' },
  { size: 180, filename: 'apple-touch-icon.png', text: 'AI' }
];

icons.forEach(icon => {
  const buffer = generateIcon(icon.size, icon.text);
  fs.writeFileSync(`${iconDir}/${icon.filename}`, buffer);
  console.log(`Generated ${icon.filename}`);
});

console.log('All icons generated successfully!'); 