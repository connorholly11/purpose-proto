/**
 * Cleanup Dependencies Script
 * 
 * This script analyzes the package.json file and identifies:
 * 1. Unused dependencies
 * 2. Backend-only dependencies that should be removed
 * 3. Duplicate dependencies
 * 4. Dependencies that can be consolidated
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Backend-only dependencies that should be removed from frontend
const BACKEND_ONLY_DEPS = [
  'express',
  'cors',
  '@types/express',
  '@types/cors',
  'ts-node-dev',
  'node-cron',
  '@clerk/clerk-sdk-node'
];

// Load package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check imports in source code
function findImportsInFiles() {
  console.log('Analyzing imports in source code...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const imports = {};
  
  // Get all TypeScript files
  const files = execSync(`find ${srcDir} -type f -name "*.ts" -o -name "*.tsx"`)
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean);
  
  // For each file, extract imports
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Match import statements
      const importRegex = /import.*?from ['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        // Only check package imports (not relative paths)
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          // Extract the package name (before any /)
          const packageName = importPath.split('/')[0];
          
          if (!imports[packageName]) {
            imports[packageName] = [];
          }
          
          if (!imports[packageName].includes(file)) {
            imports[packageName].push(file);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  });
  
  return imports;
}

// Main function
function analyzePackageJson() {
  console.log('Analyzing package.json for cleanup opportunities...');
  
  const { dependencies = {}, devDependencies = {} } = packageJson;
  const allDependencies = { ...dependencies, ...devDependencies };
  
  // Find used imports
  const usedImports = findImportsInFiles();
  
  // Check for backend-only dependencies
  const backendDeps = [];
  Object.keys(allDependencies).forEach(dep => {
    if (BACKEND_ONLY_DEPS.includes(dep)) {
      backendDeps.push(dep);
    }
  });
  
  // Check for unused dependencies
  const unusedDeps = [];
  Object.keys(allDependencies).forEach(dep => {
    // Skip React, Next.js, and other core packages
    const coreDeps = ['react', 'react-dom', 'next'];
    if (coreDeps.includes(dep)) {
      return;
    }
    
    // Check if this dependency is imported anywhere
    if (!usedImports[dep] && !dep.startsWith('@types/')) {
      unusedDeps.push(dep);
    }
  });
  
  // Print results
  console.log('\n=== Migration Cleanup Report ===\n');
  
  if (backendDeps.length > 0) {
    console.log('Backend-only dependencies to remove:');
    backendDeps.forEach(dep => {
      console.log(`  - ${dep}`);
    });
  } else {
    console.log('✓ No backend-only dependencies found');
  }
  
  console.log('\nPotentially unused dependencies (verify before removing):');
  if (unusedDeps.length > 0) {
    unusedDeps.forEach(dep => {
      console.log(`  - ${dep}`);
    });
  } else {
    console.log('✓ No potentially unused dependencies found');
  }
  
  console.log('\nMost used dependencies:');
  const sortedImports = Object.entries(usedImports)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  
  sortedImports.forEach(([dep, files]) => {
    console.log(`  - ${dep}: ${files.length} files`);
  });
  
  console.log('\nRecommended actions:');
  
  if (backendDeps.length > 0) {
    console.log(`1. Remove backend-only dependencies from package.json:`);
    console.log(`   npm uninstall ${backendDeps.join(' ')}`);
    console.log('');
  }
  
  if (unusedDeps.length > 0) {
    console.log('2. Verify and consider removing unused dependencies');
    console.log('');
  }
  
  console.log('3. Run npm dedupe to remove duplicate packages');
  console.log('');
  
  console.log('4. Update to @clerk/nextjs if still using @clerk/clerk-expo');
  console.log('');
  
  console.log('5. Run npm audit to check for security vulnerabilities');
}

// Run the analysis
analyzePackageJson();