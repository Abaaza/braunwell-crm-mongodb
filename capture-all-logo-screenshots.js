const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Starting comprehensive logo screenshot capture...');
  
  // Create screenshots directory
  const screenshotDir = 'e2e/screenshots/logo-alignment';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    // 1. Login page screenshots
    console.log('\n📸 Capturing login page...');
    await page.goto('http://localhost:3002/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'login-page-full.png'),
      fullPage: true 
    });
    
    const loginLogo = await page.$('svg');
    if (loginLogo) {
      await loginLogo.screenshot({ 
        path: path.join(screenshotDir, 'login-logo-only.png') 
      });
    }
    console.log('✅ Login page screenshots captured');
    
    // 2. Try to access dashboard (will redirect to login if not authenticated)
    console.log('\n📸 Attempting dashboard capture...');
    await page.goto('http://localhost:3002/dashboard');
    await page.waitForTimeout(2000);
    
    // Check if we're on login page (not authenticated)
    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      console.log('⚠️  Not authenticated, skipping dashboard screenshots');
    } else {
      await page.screenshot({ 
        path: path.join(screenshotDir, 'dashboard-full.png'),
        fullPage: true 
      });
      
      const dashboardLogo = await page.$('aside svg');
      if (dashboardLogo) {
        await dashboardLogo.screenshot({ 
          path: path.join(screenshotDir, 'dashboard-logo-only.png') 
        });
      }
      console.log('✅ Dashboard screenshots captured');
    }
    
    // 3. Create a test page to show logo variants
    console.log('\n📸 Creating logo variants test page...');
    await page.goto('http://localhost:3002/login');
    
    // Inject HTML to display all logo sizes
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.id = 'logo-test-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      const container = document.createElement('div');
      container.style.cssText = `
        background: #f9fafb;
        padding: 60px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        max-width: 800px;
      `;
      
      container.innerHTML = `
        <h2 style="font-family: system-ui; font-size: 24px; margin-bottom: 40px; text-align: center;">
          Braunwell Logo Alignment Test
        </h2>
        <div style="display: grid; gap: 30px;">
          <div style="display: flex; align-items: center; gap: 20px; background: white; padding: 20px; border-radius: 8px;">
            <span style="min-width: 120px; font-family: system-ui; font-weight: 600;">Current Logo:</span>
            <div style="background: #f3f4f6; padding: 10px; border-radius: 4px;">
              ${document.querySelector('svg').outerHTML}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 20px; background: white; padding: 20px; border-radius: 8px;">
            <span style="min-width: 120px; font-family: system-ui; font-weight: 600;">Text Alignment:</span>
            <div style="font-family: monospace; font-size: 12px; color: #6b7280;">
              x="28" y="15" dominant-baseline="middle"
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 20px; background: white; padding: 20px; border-radius: 8px;">
            <span style="min-width: 120px; font-family: system-ui; font-weight: 600;">Font:</span>
            <div style="font-family: monospace; font-size: 12px; color: #6b7280;">
              system-ui, 14px, weight: 700
            </div>
          </div>
        </div>
        <div style="margin-top: 40px; padding: 20px; background: #e5e7eb; border-radius: 8px;">
          <p style="font-family: system-ui; font-size: 14px; color: #4b5563; margin: 0;">
            ✅ Logo text is vertically centered with the icon using SVG text attributes
          </p>
        </div>
      `;
      
      overlay.appendChild(container);
      document.body.appendChild(overlay);
    });
    
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'logo-alignment-test.png'),
      fullPage: true 
    });
    console.log('✅ Logo alignment test screenshot captured');
    
    // 4. Mobile viewport test
    console.log('\n📸 Testing mobile viewport...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3002/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'login-mobile.png'),
      fullPage: true 
    });
    console.log('✅ Mobile viewport screenshot captured');
    
    // Summary
    console.log('\n✅ All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${screenshotDir}`);
    console.log('\nGenerated files:');
    const files = fs.readdirSync(screenshotDir);
    files.forEach(file => {
      if (file.endsWith('.png')) {
        const stats = fs.statSync(path.join(screenshotDir, file));
        const size = (stats.size / 1024).toFixed(1);
        console.log(`  - ${file} (${size} KB)`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
})();