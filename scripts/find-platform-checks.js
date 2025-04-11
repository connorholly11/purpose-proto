#!/usr/bin/env node

/**
 * Script to find direct Platform.OS usage in the codebase
 * This helps identify code that should be refactored to use the platform utilities
 * 
 * Run with: node scripts/find-platform-checks.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to scan
const DIRS_TO_SCAN = ['src'];
// File extensions to check
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
// Patterns to look for
const PATTERNS = [
  'Platform\\.OS\\s*===',
  '\\s+Platform\\.OS\\s+==',
  '\\s+Platform\\.OS\\s+!=',
  'Platform\\.OS\\s*!==',
  'Platform\\.select\\s*\\(\\s*{'
];

// Create a combined regex pattern
const PATTERN_REGEX = new RegExp(PATTERNS.join('|'), 'g');

// Files/directories to ignore
const IGNORE = [
  'node_modules',
  'dist',
  'build',
  '/theme/',  // Ignore our theme utilities
  'setupTests',
  'platformConsistency.test'
];

/**
 * Check if a path should be ignored
 * @param {string} filePath Path to check
 * @returns {boolean} True if the path should be ignored
 */
function shouldIgnore(filePath) {
  return IGNORE.some(ignore => filePath.includes(ignore));
}

/**
 * Find all files with the given extensions in the directory
 * @param {string} dir Directory to scan
 * @param {string[]} extensions File extensions to include
 * @returns {string[]} List of matching file paths
 */
function findFiles(dir, extensions) {
  const files = [];
  
  function scanDir(currentDir) {
    if (shouldIgnore(currentDir)) return;
    
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (shouldIgnore(fullPath)) continue;
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return files;
}

/**
 * Check a file for direct Platform.OS usage
 * @param {string} filePath Path to the file
 * @returns {Object} Object with file path and matching lines
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const matches = [];
  
  lines.forEach((line, index) => {
    if (PATTERN_REGEX.test(line)) {
      // Reset the regex state
      PATTERN_REGEX.lastIndex = 0;
      matches.push({
        line: index + 1,
        content: line.trim()
      });
    }
  });
  
  return {
    file: filePath,
    matches
  };
}

/**
 * Main function
 */
function main() {
  console.log('Scanning for direct Platform.OS usage...');
  
  let allMatches = [];
  let totalFiles = 0;
  let filesWithMatches = 0;
  
  // Process each directory
  DIRS_TO_SCAN.forEach(dir => {
    const rootDir = path.resolve(process.cwd(), dir);
    const files = findFiles(rootDir, EXTENSIONS);
    totalFiles += files.length;
    
    files.forEach(file => {
      const result = checkFile(file);
      if (result.matches.length > 0) {
        allMatches.push(result);
        filesWithMatches++;
      }
    });
  });
  
  // Print results
  console.log(`\nScanned ${totalFiles} files, found direct Platform.OS usage in ${filesWithMatches} files.`);
  
  if (allMatches.length === 0) {
    console.log('✅ No direct Platform.OS usage found! Great job!');
    return;
  }
  
  console.log('\n===== Files with direct Platform.OS usage =====\n');
  
  allMatches.forEach(file => {
    console.log(`📁 ${file.file} (${file.matches.length} matches)`);
    file.matches.forEach(match => {
      console.log(`   Line ${match.line}: ${match.content}`);
    });
    console.log('');
  });
  
  console.log('\n💡 Recommendation: Replace direct Platform.OS checks with utilities from src/theme:');
  console.log('  • Use createPlatformStyleSheet for styling');
  console.log('  • Use platformSelect for conditional values');
  console.log('  • Use shadows utility for cross-platform shadows');
  console.log('\nExample:');
  console.log('// ❌ Bad');
  console.log('const styles = StyleSheet.create({');
  console.log('  container: {');
  console.log('    padding: Platform.OS === "ios" ? 20 : 16,');
  console.log('  }');
  console.log('});');
  console.log('');
  console.log('// ✅ Good');
  console.log('import { createPlatformStyleSheet, spacing } from "../theme";');
  console.log('');
  console.log('const styles = createPlatformStyleSheet({');
  console.log('  container: {');
  console.log('    padding: spacing.md,');
  console.log('    ios: { padding: spacing.lg },');
  console.log('  }');
  console.log('});');
}

// Run the script
main();