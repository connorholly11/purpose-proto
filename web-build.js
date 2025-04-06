const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run the favicon generation script
console.log('Generating favicons...');
execSync('node create-favicon.js', { stdio: 'inherit' });
execSync('node create-favicon-ico.js', { stdio: 'inherit' });

// Build the web app
console.log('Building web app...');
execSync('expo export', { stdio: 'inherit' });

// Check if dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('Web build failed or dist directory not created');
  process.exit(1);
}

// Copy favicon files to the dist directory
console.log('Copying favicon files...');

// Create the favicons directory in dist/assets if it doesn't exist
const distFaviconsDir = path.join(distDir, 'assets', 'favicons');
if (!fs.existsSync(distFaviconsDir)) {
  fs.mkdirSync(distFaviconsDir, { recursive: true });
}

// Copy all favicon files
const faviconDir = path.join(__dirname, 'assets', 'favicons');
if (fs.existsSync(faviconDir)) {
  const faviconFiles = fs.readdirSync(faviconDir);
  
  faviconFiles.forEach(file => {
    const srcPath = path.join(faviconDir, file);
    const destPath = path.join(distFaviconsDir, file);
    
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} to dist/assets/favicons/`);
  });
}

// Copy favicon.ico to root directory
const faviconIcoSrc = path.join(__dirname, 'assets', 'favicon.ico');
const faviconIcoDest = path.join(distDir, 'favicon.ico');
if (fs.existsSync(faviconIcoSrc)) {
  fs.copyFileSync(faviconIcoSrc, faviconIcoDest);
  console.log(`Copied favicon.ico to dist/`);
}

// Update the index.html file with the favicon links
const indexHtmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Check if our favicon tags already exist
  if (!indexHtml.includes('rel="icon" type="image/png" sizes="16x16"')) {
    // Find the head closing tag
    const headCloseIndex = indexHtml.indexOf('</head>');
    
    if (headCloseIndex !== -1) {
      // Favicon tags to insert
      const faviconTags = `
  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="./favicon.ico">
  <link rel="icon" type="image/png" sizes="16x16" href="./assets/favicons/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="./assets/favicons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="./assets/favicons/favicon-192x192.png">
  <link rel="apple-touch-icon" sizes="152x152" href="./assets/favicons/favicon-152x152.png">
  <link rel="shortcut icon" href="./assets/favicon.png">
`;
      
      // Insert the favicon tags before the head closing tag
      indexHtml = 
        indexHtml.substring(0, headCloseIndex) + 
        faviconTags + 
        indexHtml.substring(headCloseIndex);
      
      // Write the updated HTML back to the file
      fs.writeFileSync(indexHtmlPath, indexHtml);
      console.log('Updated index.html with favicon links');
    }
  } else {
    console.log('Favicon links already exist in index.html');
  }
} else {
  console.error('index.html not found in dist directory');
}

console.log('Web build completed with favicon support'); 