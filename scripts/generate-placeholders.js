const fs = require('fs');
const path = require('path');

// Simple SVG placeholder generator
function generatePlaceholderSVG(width, height, text, bgColor = '#e5e7eb', textColor = '#9ca3af') {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${bgColor}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
          font-family="Arial, sans-serif" font-size="14" fill="${textColor}">
      ${text}
    </text>
  </svg>`;
}

// Generate placeholder images
const placeholders = [
  { filename: 'placeholder.png', width: 400, height: 300, text: 'Image' },
  { filename: 'default-avatar.png', width: 100, height: 100, text: 'User' },
  { filename: 'project-placeholder.png', width: 600, height: 400, text: 'Project' },
  { filename: 'chart-placeholder.png', width: 800, height: 400, text: 'Chart' },
];

const outputDir = path.join(__dirname, '..', 'public', 'images');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate SVG files
placeholders.forEach(({ filename, width, height, text }) => {
  const svgContent = generatePlaceholderSVG(width, height, text);
  const svgPath = path.join(outputDir, filename.replace('.png', '.svg'));
  
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Generated: ${svgPath}`);
});

console.log('Placeholder images generated successfully!');