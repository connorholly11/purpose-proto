const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Build the web app first
console.log('Building web app...');
execSync('expo export', { stdio: 'inherit' });

// Check if dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('Web build failed or dist directory not created');
  process.exit(1);
}

// Generate a simple favicon directly
console.log('Generating favicon...');

// Use canvas to create a simple favicon
const { createCanvas } = require('canvas');

// Create a 192x192 canvas for the favicon
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

// Create favicon sizes
const sizes = [16, 32, 64, 128, 152, 192];
const faviconDir = path.join(distDir, 'assets');
if (!fs.existsSync(faviconDir)) {
  fs.mkdirSync(faviconDir, { recursive: true });
}

// Save the main favicon
const buffer = canvas.toBuffer('image/png');
const faviconPath = path.join(faviconDir, 'favicon.png');
fs.writeFileSync(faviconPath, buffer);
console.log(`Created favicon: ${faviconPath}`);

// Save favicon.ico directly to dist root using 16x16 version
const iconCanvas16 = createCanvas(16, 16);
const iconCtx16 = iconCanvas16.getContext('2d');
iconCtx16.drawImage(canvas, 0, 0, size, size, 0, 0, 16, 16);
const iconBuffer16 = iconCanvas16.toBuffer('image/png');
const faviconIcoPath = path.join(distDir, 'favicon.ico');
fs.writeFileSync(faviconIcoPath, iconBuffer16);
console.log(`Created favicon.ico: ${faviconIcoPath}`);

// Update the index.html file with the favicon links
const indexHtmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Replace or add favicon links
  const headEndIndex = indexHtml.indexOf('</head>');
  if (headEndIndex !== -1) {
    // Find and remove any existing favicon links
    const linkPattern = /<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)[^>]*>/g;
    indexHtml = indexHtml.replace(linkPattern, '');
    
    // Add our favicon links
    const faviconLinks = `
  <!-- Favicons -->
  <link rel="icon" href="favicon.ico" sizes="any">
  <link rel="icon" type="image/png" href="assets/favicon.png">
  <link rel="apple-touch-icon" href="assets/favicon.png">
`;
    
    indexHtml = 
      indexHtml.substring(0, headEndIndex) + 
      faviconLinks +
      indexHtml.substring(headEndIndex);
      
    fs.writeFileSync(indexHtmlPath, indexHtml);
    console.log('Updated index.html with favicon links');
  }
}

console.log('Web build completed with favicon support'); 