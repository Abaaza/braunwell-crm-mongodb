const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Lambda function...');

// Clean dist directory
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}

// Compile TypeScript
console.log('Compiling TypeScript...');
execSync('npx tsc --project server/tsconfig.json', { stdio: 'inherit' });

// Copy package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lambdaPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  dependencies: {
    ...packageJson.dependencies,
    'serverless-http': packageJson.devDependencies['serverless-http']
  }
};

fs.writeFileSync(
  path.join(distPath, 'package.json'),
  JSON.stringify(lambdaPackageJson, null, 2)
);

console.log('Lambda build complete!');