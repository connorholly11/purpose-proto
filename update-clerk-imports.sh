#!/bin/bash

# Script to update Clerk imports for server components and API routes

echo "Updating Clerk imports in API routes and server components..."

# Find all TypeScript files in the API directory
find ./src/app/api -name "*.ts" -type f | while read file; do
  # Replace the import for auth
  sed -i.bak 's/import { auth } from '"'"'@clerk\/nextjs'"'"';/import { auth } from '"'"'@clerk\/nextjs\/server'"'"';/g' "$file"
  
  # Replace the import for clerkClient
  sed -i.bak 's/import { clerkClient } from '"'"'@clerk\/nextjs'"'"';/import { clerkClient } from '"'"'@clerk\/nextjs\/server'"'"';/g' "$file"
  
  # Replace the combined import
  sed -i.bak 's/import { auth, clerkClient } from '"'"'@clerk\/nextjs'"'"';/import { auth, clerkClient } from '"'"'@clerk\/nextjs\/server'"'"';/g' "$file"
  
  # Clean up backup files
  rm -f "${file}.bak"
done

echo "Updated Clerk imports in server components and API routes"
echo "Please verify these changes manually before running the application."