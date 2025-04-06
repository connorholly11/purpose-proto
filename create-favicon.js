const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a 192x192 canvas for the favicon (larger size for better quality)
const size = 192;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Set up gradient background
const gradient = ctx.createLinearGradient(0, 0, size, size);
gradient.addColorStop(0, '#6366f1'); // Indigo
gradient.addColorStop(1, '#8b5cf6'); // Purple

// Fill background
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, size, size);

// Draw robot/AI face
ctx.fillStyle = '#ffffff';

// Draw circular face
ctx.beginPath();
ctx.arc(size/2, size/2, size/3, 0, Math.PI * 2);
ctx.fill();

// Draw eyes
ctx.fillStyle = '#6366f1';
// Left eye
ctx.beginPath();
ctx.arc(size/2 - size/8, size/2 - size/16, size/12, 0, Math.PI * 2);
ctx.fill();
// Right eye
ctx.beginPath();
ctx.arc(size/2 + size/8, size/2 - size/16, size/12, 0, Math.PI * 2);
ctx.fill();

// Draw mouth (slightly curved upward line)
ctx.strokeStyle = '#6366f1';
ctx.lineWidth = 4;
ctx.beginPath();
ctx.moveTo(size/2 - size/8, size/2 + size/8);
ctx.quadraticCurveTo(size/2, size/2 + size/6, size/2 + size/8, size/2 + size/8);
ctx.stroke();

// Add antenna
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(size/2, size/2 - size/6);
ctx.lineTo(size/2, size/2 - size/3);
ctx.stroke();

// Add small circle at the top of the antenna
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.arc(size/2, size/2 - size/3, 4, 0, Math.PI * 2);
ctx.fill();

// Save to assets directory
const buffer = canvas.toBuffer('image/png');
const faviconPath = path.join(__dirname, 'assets', 'favicon.png');
fs.writeFileSync(faviconPath, buffer);

console.log(`Favicon saved to: ${faviconPath}`);

// Also create different sizes for various devices
const sizes = [16, 32, 64, 128, 152, 192];

// Create a folder for different favicon sizes
const faviconDir = path.join(__dirname, 'assets', 'favicons');
if (!fs.existsSync(faviconDir)) {
  fs.mkdirSync(faviconDir);
}

// Generate different sizes
sizes.forEach(iconSize => {
  const iconCanvas = createCanvas(iconSize, iconSize);
  const iconCtx = iconCanvas.getContext('2d');
  
  // Draw the scaled image
  iconCtx.drawImage(canvas, 0, 0, size, size, 0, 0, iconSize, iconSize);
  
  // Save the icon
  const iconBuffer = iconCanvas.toBuffer('image/png');
  const iconPath = path.join(faviconDir, `favicon-${iconSize}x${iconSize}.png`);
  fs.writeFileSync(iconPath, iconBuffer);
  
  console.log(`Created favicon: ${iconPath}`);
});

// Create a favicon.ico file (16x16 and 32x32)
console.log("Note: favicon.ico is not created by this script as it requires additional libraries."); 