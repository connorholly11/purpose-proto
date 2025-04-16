// Theme color definitions

// Type for theme keys
export type ThemeKey = 'blue' | 'skyblue' | 'purple' | 'red' | 'green' | 'yellow' | 'orange' | 'teal' | 'pink';

// Theme options with display names and colors
export const themeOptions: Record<ThemeKey, {name: string, color: string, gradient: string}> = {
  blue: { 
    name: "Blue", 
    color: "#1976d2",
    gradient: "linear-gradient(to right, #3b82f6, #06b6d4)"
  },
  skyblue: { 
    name: "Sky Blue", 
    color: "#0ea5e9",
    gradient: "linear-gradient(to right, #38bdf8, #0284c7)"
  },
  purple: { 
    name: "Purple", 
    color: "#7c3aed",
    gradient: "linear-gradient(to right, #8b5cf6, #ec4899)"
  },
  red: { 
    name: "Red", 
    color: "#dc2626",
    gradient: "linear-gradient(to right, #ef4444, #f97316)"
  },
  green: { 
    name: "Green", 
    color: "#16a34a",
    gradient: "linear-gradient(to right, #22c55e, #10b981)"
  },
  yellow: { 
    name: "Yellow", 
    color: "#eab308",
    gradient: "linear-gradient(to right, #facc15, #fbbf24)"
  },
  orange: { 
    name: "Orange", 
    color: "#ea580c",
    gradient: "linear-gradient(to right, #f97316, #fb923c)"
  },
  teal: { 
    name: "Teal", 
    color: "#0d9488",
    gradient: "linear-gradient(to right, #14b8a6, #06b6d4)"
  },
  pink: { 
    name: "Pink", 
    color: "#db2777",
    gradient: "linear-gradient(to right, #ec4899, #f472b6)"
  }
};

// CSS variable mapping for themes
export const themeVariables = {
  blue: {
    background: '#f0f8ff',
    foreground: '#0f2942',
    primaryLight: '#f0f8ff',
    primaryMedium: '#64b5f6',
    primaryDark: '#1976d2',
    gradientFrom: '#3b82f6',
    gradientTo: '#06b6d4',
    gradientDarkFrom: '#1d4ed8',
    gradientDarkTo: '#0ea5e9',
    borderColor: '#dbeafe',
    buttonText: '#1d4ed8',
    buttonHover: '#dbeafe'
  },
  skyblue: {
    background: '#f0f9ff',
    foreground: '#0c4a6e',
    primaryLight: '#e0f2fe',
    primaryMedium: '#38bdf8',
    primaryDark: '#0ea5e9',
    gradientFrom: '#38bdf8',
    gradientTo: '#0284c7',
    gradientDarkFrom: '#0369a1',
    gradientDarkTo: '#0ea5e9',
    borderColor: '#bae6fd',
    buttonText: '#0284c7',
    buttonHover: '#e0f2fe'
  },
  purple: {
    background: '#f5f3ff',
    foreground: '#2e1065',
    primaryLight: '#f5f3ff',
    primaryMedium: '#a78bfa',
    primaryDark: '#7c3aed',
    gradientFrom: '#8b5cf6',
    gradientTo: '#ec4899',
    gradientDarkFrom: '#6d28d9',
    gradientDarkTo: '#db2777',
    borderColor: '#ede9fe',
    buttonText: '#7c3aed',
    buttonHover: '#ede9fe'
  },
  red: {
    background: '#fff5f5',
    foreground: '#7f1d1d',
    primaryLight: '#fee2e2',
    primaryMedium: '#f87171',
    primaryDark: '#dc2626',
    gradientFrom: '#ef4444',
    gradientTo: '#f97316',
    gradientDarkFrom: '#b91c1c',
    gradientDarkTo: '#c2410c',
    borderColor: '#fee2e2',
    buttonText: '#dc2626',
    buttonHover: '#fee2e2'
  },
  green: {
    background: '#f0fff4',
    foreground: '#1a4731',
    primaryLight: '#dcfce7',
    primaryMedium: '#4ade80',
    primaryDark: '#16a34a',
    gradientFrom: '#22c55e',
    gradientTo: '#10b981',
    gradientDarkFrom: '#15803d',
    gradientDarkTo: '#0f766e',
    borderColor: '#dcfce7',
    buttonText: '#16a34a',
    buttonHover: '#dcfce7'
  },
  yellow: {
    background: '#fefce8',
    foreground: '#713f12',
    primaryLight: '#fef9c3',
    primaryMedium: '#facc15',
    primaryDark: '#eab308',
    gradientFrom: '#facc15',
    gradientTo: '#fbbf24',
    gradientDarkFrom: '#ca8a04',
    gradientDarkTo: '#d97706',
    borderColor: '#fef9c3',
    buttonText: '#ca8a04',
    buttonHover: '#fef9c3'
  },
  orange: {
    background: '#fff7ed',
    foreground: '#7c2d12',
    primaryLight: '#ffedd5',
    primaryMedium: '#fb923c',
    primaryDark: '#ea580c',
    gradientFrom: '#f97316',
    gradientTo: '#fb923c',
    gradientDarkFrom: '#c2410c',
    gradientDarkTo: '#ea580c',
    borderColor: '#fed7aa',
    buttonText: '#ea580c',
    buttonHover: '#ffedd5'
  },
  teal: {
    background: '#f0fdfd',
    foreground: '#134e4a',
    primaryLight: '#ccfbf1',
    primaryMedium: '#2dd4bf',
    primaryDark: '#0d9488',
    gradientFrom: '#14b8a6',
    gradientTo: '#06b6d4',
    gradientDarkFrom: '#0f766e',
    gradientDarkTo: '#0891b2',
    borderColor: '#ccfbf1',
    buttonText: '#0d9488',
    buttonHover: '#ccfbf1'
  },
  pink: {
    background: '#fdf2f8',
    foreground: '#831843',
    primaryLight: '#fce7f3',
    primaryMedium: '#f472b6',
    primaryDark: '#db2777',
    gradientFrom: '#ec4899',
    gradientTo: '#f472b6',
    gradientDarkFrom: '#be185d',
    gradientDarkTo: '#db2777',
    borderColor: '#fce7f3',
    buttonText: '#db2777',
    buttonHover: '#fce7f3'
  }
};