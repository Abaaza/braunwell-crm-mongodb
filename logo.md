# Braunwell Logo Documentation

## Overview
The Braunwell logo is a custom React component that combines an abstract geometric icon with the company name. It's designed to be flexible, responsive, and accessible across different themes and sizes.

## Logo Design Elements

### 1. Icon Design
The icon is an abstract, organic shape composed of multiple curved paths that create a dynamic, interconnected pattern. It represents:
- **Connectivity**: The interweaving paths symbolize the connections between business elements in a CRM
- **Growth**: The organic, flowing nature suggests business growth and evolution
- **Technology**: The precise mathematical curves reflect the digital nature of the product

### 2. Typography
- **Font**: System UI font stack for optimal readability across platforms
- **Weight**: Bold (700) for strong brand presence
- **Letter Spacing**: 0.02em for improved readability
- **Style**: All uppercase for authority and professionalism

## Technical Implementation

### Component Structure
```tsx
<BraunwellLogo 
  size="md"           // "sm" | "md" | "lg" | "xl"
  variant="full"      // "full" | "icon"
  theme="dark"        // "light" | "dark"
  className=""        // Additional CSS classes
/>
```

### Size Specifications
- **Small (sm)**: 94×18px (full), 18×18px (icon)
- **Medium (md)**: 125×24px (full), 24×24px (icon)
- **Large (lg)**: 150×29px (full), 29×29px (icon)
- **Extra Large (xl)**: 188×36px (full), 36×36px (icon)

## How to Recreate the Logo

### Method 1: Export as SVG Files
```bash
# Create a directory for logo assets
mkdir -p public/brand

# The component already outputs clean SVG - you can copy the SVG directly
# from the component and save it as separate files
```

### Method 2: Generate Static SVG Files
Create the following files:

**braunwell-logo-dark.svg**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="125" height="24" viewBox="0 0 125 24" fill="none">
  <path fill="#000000" d="M13.214 19.267c.021-2.203-.537-3.994-1.247-4.001-.71-.007-1.304 1.773-1.326 3.976-.021 2.203.537 3.994 1.248 4 .71.008 1.303-1.772 1.325-3.975Zm-4.121-.501c1.21-1.841 1.708-3.65 1.114-4.04-.594-.39-2.055.787-3.264 2.628-1.21 1.842-1.708 3.65-1.115 4.04.594.39 2.056-.786 3.265-2.628Zm-3.2-2.642c2.012-.895 3.41-2.147 3.121-2.796-.288-.65-2.154-.45-4.167.446-2.013.895-3.41 2.147-3.122 2.796.289.65 2.155.45 4.168-.446Zm2.879-4.616c.109-.702-1.569-1.543-3.746-1.878-2.177-.335-4.03-.038-4.138.664-.108.703 1.57 1.544 3.746 1.879 2.178.335 4.03.037 4.138-.665Zm.786-1.673c.47-.532-.486-2.147-2.137-3.605-1.65-1.46-3.37-2.21-3.84-1.678-.47.532.486 2.147 2.137 3.605 1.65 1.46 3.37 2.21 3.84 1.678Zm1.554-.978c.683-.193.751-2.068.151-4.188-.6-2.12-1.64-3.681-2.323-3.488-.684.194-.752 2.069-.152 4.189s1.64 3.68 2.324 3.487Zm4.228-3.421c.642-2.108.611-3.984-.068-4.19-.68-.208-1.75 1.333-2.392 3.44-.642 2.108-.611 3.984.069 4.191.68.207 1.75-1.334 2.392-3.441Zm3.02 2.848c1.68-1.427 2.668-3.022 2.208-3.563-.46-.542-2.194.176-3.873 1.602-1.68 1.426-2.667 3.021-2.207 3.563.46.541 2.194-.176 3.873-1.602Zm1.002 4.029c2.184-.292 3.878-1.1 3.783-1.804-.094-.704-1.94-1.038-4.124-.746-2.183.292-3.877 1.1-3.783 1.804.094.704 1.94 1.038 4.124.746Zm2.813 4.459c.302-.643-1.07-1.923-3.066-2.857-1.994-.935-3.856-1.172-4.157-.528-.302.643 1.07 1.922 3.066 2.857 1.994.935 3.856 1.171 4.157.528Zm-4.196 4.746c.601-.378.138-2.196-1.034-4.061-1.173-1.865-2.611-3.07-3.213-2.692-.601.378-.138 2.196 1.034 4.061 1.173 1.865 2.611 3.07 3.213 2.692Z"/>
  <text x="28" y="15" fill="#000000" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="0.02em" dominant-baseline="middle" text-anchor="start">BRAUNWELL</text>
</svg>
```

**braunwell-logo-light.svg**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="125" height="24" viewBox="0 0 125 24" fill="none">
  <path fill="#FFFFFF" d="M13.214 19.267c.021-2.203-.537-3.994-1.247-4.001-.71-.007-1.304 1.773-1.326 3.976-.021 2.203.537 3.994 1.248 4 .71.008 1.303-1.772 1.325-3.975Zm-4.121-.501c1.21-1.841 1.708-3.65 1.114-4.04-.594-.39-2.055.787-3.264 2.628-1.21 1.842-1.708 3.65-1.115 4.04.594.39 2.056-.786 3.265-2.628Zm-3.2-2.642c2.012-.895 3.41-2.147 3.121-2.796-.288-.65-2.154-.45-4.167.446-2.013.895-3.41 2.147-3.122 2.796.289.65 2.155.45 4.168-.446Zm2.879-4.616c.109-.702-1.569-1.543-3.746-1.878-2.177-.335-4.03-.038-4.138.664-.108.703 1.57 1.544 3.746 1.879 2.178.335 4.03.037 4.138-.665Zm.786-1.673c.47-.532-.486-2.147-2.137-3.605-1.65-1.46-3.37-2.21-3.84-1.678-.47.532.486 2.147 2.137 3.605 1.65 1.46 3.37 2.21 3.84 1.678Zm1.554-.978c.683-.193.751-2.068.151-4.188-.6-2.12-1.64-3.681-2.323-3.488-.684.194-.752 2.069-.152 4.189s1.64 3.68 2.324 3.487Zm4.228-3.421c.642-2.108.611-3.984-.068-4.19-.68-.208-1.75 1.333-2.392 3.44-.642 2.108-.611 3.984.069 4.191.68.207 1.75-1.334 2.392-3.441Zm3.02 2.848c1.68-1.427 2.668-3.022 2.208-3.563-.46-.542-2.194.176-3.873 1.602-1.68 1.426-2.667 3.021-2.207 3.563.46.541 2.194-.176 3.873-1.602Zm1.002 4.029c2.184-.292 3.878-1.1 3.783-1.804-.094-.704-1.94-1.038-4.124-.746-2.183.292-3.877 1.1-3.783 1.804.094.704 1.94 1.038 4.124.746Zm2.813 4.459c.302-.643-1.07-1.923-3.066-2.857-1.994-.935-3.856-1.172-4.157-.528-.302.643 1.07 1.922 3.066 2.857 1.994.935 3.856 1.171 4.157.528Zm-4.196 4.746c.601-.378.138-2.196-1.034-4.061-1.173-1.865-2.611-3.07-3.213-2.692-.601.378-.138 2.196 1.034 4.061 1.173 1.865 2.611 3.07 3.213 2.692Z"/>
  <text x="28" y="15" fill="#FFFFFF" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="0.02em" dominant-baseline="middle" text-anchor="start">BRAUNWELL</text>
</svg>
```

**braunwell-icon.svg**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path fill="#000000" d="M13.214 19.267c.021-2.203-.537-3.994-1.247-4.001-.71-.007-1.304 1.773-1.326 3.976-.021 2.203.537 3.994 1.248 4 .71.008 1.303-1.772 1.325-3.975Zm-4.121-.501c1.21-1.841 1.708-3.65 1.114-4.04-.594-.39-2.055.787-3.264 2.628-1.21 1.842-1.708 3.65-1.115 4.04.594.39 2.056-.786 3.265-2.628Zm-3.2-2.642c2.012-.895 3.41-2.147 3.121-2.796-.288-.65-2.154-.45-4.167.446-2.013.895-3.41 2.147-3.122 2.796.289.65 2.155.45 4.168-.446Zm2.879-4.616c.109-.702-1.569-1.543-3.746-1.878-2.177-.335-4.03-.038-4.138.664-.108.703 1.57 1.544 3.746 1.879 2.178.335 4.03.037 4.138-.665Zm.786-1.673c.47-.532-.486-2.147-2.137-3.605-1.65-1.46-3.37-2.21-3.84-1.678-.47.532.486 2.147 2.137 3.605 1.65 1.46 3.37 2.21 3.84 1.678Zm1.554-.978c.683-.193.751-2.068.151-4.188-.6-2.12-1.64-3.681-2.323-3.488-.684.194-.752 2.069-.152 4.189s1.64 3.68 2.324 3.487Zm4.228-3.421c.642-2.108.611-3.984-.068-4.19-.68-.208-1.75 1.333-2.392 3.44-.642 2.108-.611 3.984.069 4.191.68.207 1.75-1.334 2.392-3.441Zm3.02 2.848c1.68-1.427 2.668-3.022 2.208-3.563-.46-.542-2.194.176-3.873 1.602-1.68 1.426-2.667 3.021-2.207 3.563.46.541 2.194-.176 3.873-1.602Zm1.002 4.029c2.184-.292 3.878-1.1 3.783-1.804-.094-.704-1.94-1.038-4.124-.746-2.183.292-3.877 1.1-3.783 1.804.094.704 1.94 1.038 4.124.746Zm2.813 4.459c.302-.643-1.07-1.923-3.066-2.857-1.994-.935-3.856-1.172-4.157-.528-.302.643 1.07 1.922 3.066 2.857 1.994.935 3.856 1.171 4.157.528Zm-4.196 4.746c.601-.378.138-2.196-1.034-4.061-1.173-1.865-2.611-3.07-3.213-2.692-.601.378-.138 2.196 1.034 4.061 1.173 1.865 2.611 3.07 3.213 2.692Z"/>
</svg>
```

### Method 3: Create Design Files

#### Adobe Illustrator / Figma Recreation
1. **Icon Path**: Copy the path data from the SVG and paste into your design tool
2. **Typography Settings**:
   - Font: System UI or Inter
   - Size: 14px
   - Weight: Bold (700)
   - Letter Spacing: 2%
   - Case: Uppercase
3. **Spacing**: 28px between icon and text
4. **Colors**: 
   - Dark theme: #000000
   - Light theme: #FFFFFF

## Usage Guidelines

### Do's:
- ✅ Use the component for consistent rendering across the app
- ✅ Maintain aspect ratio when scaling
- ✅ Ensure sufficient contrast with backgrounds
- ✅ Use appropriate size variants for different contexts

### Don'ts:
- ❌ Don't modify the icon paths
- ❌ Don't change the font or letter spacing
- ❌ Don't use colors other than black or white
- ❌ Don't stretch or distort the logo

## Export Script
To generate all logo variants as static files:

```javascript
// export-logos.js
const fs = require('fs');
const path = require('path');

const logoVariants = {
  'braunwell-logo-dark.svg': { theme: 'dark', variant: 'full' },
  'braunwell-logo-light.svg': { theme: 'light', variant: 'full' },
  'braunwell-icon-dark.svg': { theme: 'dark', variant: 'icon' },
  'braunwell-icon-light.svg': { theme: 'light', variant: 'icon' }
};

// Create export directory
const exportDir = path.join(__dirname, 'public', 'brand');
if (!fs.existsSync(exportDir)){
    fs.mkdirSync(exportDir, { recursive: true });
}

// Generate SVG files based on the component logic
Object.entries(logoVariants).forEach(([filename, config]) => {
  // SVG generation logic here
  // Copy the appropriate SVG from the component based on config
});
```

## Component Location
The logo component is located at: `/components/shared/braunwell-logo.tsx`

## Integration Examples

### In React/Next.js:
```tsx
import { BraunwellLogo } from '@/components/shared/braunwell-logo'

// Header usage
<BraunwellLogo size="md" theme="dark" />

// Mobile navigation
<BraunwellLogo variant="icon" size="sm" />

// Footer
<BraunwellLogo size="lg" theme="light" />
```

### In HTML:
```html
<img src="/brand/braunwell-logo-dark.svg" alt="Braunwell" width="125" height="24">
```

## Favicon Generation
For favicon usage, export the icon variant at multiple sizes:
- 16×16px
- 32×32px
- 192×192px (Android)
- 512×512px (PWA)

---

Last updated: January 2025