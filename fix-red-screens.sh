#!/bin/bash
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== Red Screen Fix Script ===${NC}"
echo -e "This script will prepare your environment and rebuild the iOS app to fix the red screens."

# Make .env file
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"
  echo "INCLUDE_INSTABUG_PLUGIN=true" > .env
  echo -e "${GREEN}Created .env file successfully${NC}"
else
  # Check if the required variable exists, add if not
  if ! grep -q "INCLUDE_INSTABUG_PLUGIN=true" .env; then
    echo -e "${YELLOW}Adding INCLUDE_INSTABUG_PLUGIN to .env file...${NC}"
    echo "INCLUDE_INSTABUG_PLUGIN=true" >> .env
    echo -e "${GREEN}Updated .env file successfully${NC}"
  else
    echo -e "${GREEN}INCLUDE_INSTABUG_PLUGIN already in .env file${NC}"
  fi
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}Successfully installed dependencies${NC}"

# Run prebuild for iOS
echo -e "${YELLOW}Running prebuild for iOS...${NC}"
npm run prebuild:ios
echo -e "${GREEN}Prebuild completed successfully${NC}"

# Install pods
echo -e "${YELLOW}Installing pods...${NC}"
if command -v pod &> /dev/null; then
  cd ios && pod install && cd ..
  echo -e "${GREEN}Successfully installed pods${NC}"
else
  echo -e "${YELLOW}CocoaPods not found, using npx pod-install instead...${NC}"
  npx pod-install
  echo -e "${GREEN}Successfully installed pods via npx${NC}"
fi

# Instructions for next steps
echo -e "\n${CYAN}=== Next Steps ===${NC}"
echo -e "1. Start the dev client:"
echo -e "   ${GREEN}npx expo start --dev-client${NC}"
echo -e "2. If needed, you can disable bridgeless mode:"
echo -e "   ${GREEN}EXPO_NO_DEV_CLIENT_BRIDGELESS=1 npx expo start --dev-client${NC}"
echo -e "3. Open the app on your iOS device or simulator"
echo -e "\n${GREEN}Setup completed successfully!${NC}"