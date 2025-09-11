const { chromium } = require('playwright');

(async () => {
  console.log('Starting screenshot capture...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3002/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'logo-login-page.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved as logo-login-page.png');
    
    // Try to capture just the logo
    const logo = await page.$('svg');
    if (logo) {
      await logo.screenshot({ path: 'logo-only.png' });
      console.log('✅ Logo screenshot saved as logo-only.png');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();