const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a 64x64 canvas for the favicon
const size = 64;
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
ctx.arc(size/2 - 8, size/2 - 4, 5, 0, Math.PI * 2);
ctx.fill();
// Right eye
ctx.beginPath();
ctx.arc(size/2 + 8, size/2 - 4, 5, 0, Math.PI * 2);
ctx.fill();

// Draw mouth (slightly curved upward line)
ctx.strokeStyle = '#6366f1';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(size/2 - 8, size/2 + 8);
ctx.quadraticCurveTo(size/2, size/2 + 12, size/2 + 8, size/2 + 8);
ctx.stroke();

// Add antenna
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(size/2, size/2 - 16);
ctx.lineTo(size/2, size/2 - 24);
ctx.stroke();

// Add small circle at the top of the antenna
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.arc(size/2, size/2 - 24, 2, 0, Math.PI * 2);
ctx.fill();

// Save to assets directory
const buffer = canvas.toBuffer('image/png');
const faviconPath = path.join(__dirname, 'assets', 'favicon.png');
fs.writeFileSync(faviconPath, buffer);

console.log(`Favicon saved to: ${faviconPath}`); 