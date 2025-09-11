import { test, expect } from '@playwright/test'

test.describe('Braunwell Logo Visual Tests', () => {
  test('capture logo screenshots in different contexts', async ({ page }) => {
    // Create screenshots directory
    const screenshotDir = 'e2e/screenshots/logo-alignment'
    
    // Test 1: Login page logo
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Wait for logo to be visible
    const loginLogo = page.locator('svg').first()
    await expect(loginLogo).toBeVisible()
    
    // Take screenshot of login page logo
    await loginLogo.screenshot({ 
      path: `${screenshotDir}/logo-login-page.png`,
      animations: 'disabled'
    })
    
    // Take full page screenshot of login
    await page.screenshot({ 
      path: `${screenshotDir}/login-page-full.png`,
      fullPage: true 
    })
    
    // Test 2: Dashboard sidebar logo (requires login)
    // First, let's check if we need to create a test user
    await page.goto('/init')
    
    // Check if initialization is needed
    const needsInit = await page.locator('text="Initialize System"').isVisible().catch(() => false)
    
    if (needsInit) {
      // Fill init form
      await page.fill('input[name="name"]', 'Test Admin')
      await page.fill('input[name="email"]', 'admin@test.com')
      await page.fill('input[name="password"]', 'TestPassword123!')
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
      await page.fill('input[name="companyName"]', 'Test Company')
      await page.click('button[type="submit"]')
      
      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 })
    } else {
      // Login with existing credentials
      await page.goto('/login')
      await page.fill('input[type="email"]', 'admin@test.com')
      await page.fill('input[type="password"]', 'TestPassword123!')
      await page.click('button[type="submit"]')
      
      // Wait for dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 })
    }
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle')
    
    // Capture dashboard logo
    const dashboardLogo = page.locator('aside svg').first()
    await expect(dashboardLogo).toBeVisible()
    
    await dashboardLogo.screenshot({ 
      path: `${screenshotDir}/logo-dashboard-sidebar.png`,
      animations: 'disabled'
    })
    
    // Take full dashboard screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/dashboard-full.png`,
      fullPage: true 
    })
    
    // Test 3: Invoice page logo
    await page.goto('/invoices')
    await page.waitForLoadState('networkidle')
    
    // Check if there are any invoices, if not create one
    const noInvoices = await page.locator('text="No invoices found"').isVisible().catch(() => false)
    
    if (!noInvoices) {
      // Click on first invoice to view
      const firstInvoice = page.locator('table tbody tr').first()
      const invoiceExists = await firstInvoice.isVisible().catch(() => false)
      
      if (invoiceExists) {
        await firstInvoice.click()
        await page.waitForLoadState('networkidle')
        
        // Wait for invoice template to load
        const invoiceTemplate = page.locator('#braunwell-invoice-content')
        await expect(invoiceTemplate).toBeVisible()
        
        // Capture invoice logo
        const invoiceLogo = invoiceTemplate.locator('svg').first()
        await expect(invoiceLogo).toBeVisible()
        
        await invoiceLogo.screenshot({ 
          path: `${screenshotDir}/logo-invoice-template.png`,
          animations: 'disabled'
        })
        
        // Take full invoice screenshot
        await invoiceTemplate.screenshot({ 
          path: `${screenshotDir}/invoice-template-full.png`
        })
      }
    }
    
    // Test 4: Logo size variants
    // Create a test page to show all logo sizes
    await page.goto('/dashboard')
    
    // Inject a test div with all logo sizes using page.evaluate
    await page.evaluate(() => {
      const testDiv = document.createElement('div')
      testDiv.id = 'logo-test-container'
      testDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 40px; box-shadow: 0 0 20px rgba(0,0,0,0.1); z-index: 9999;'
      testDiv.innerHTML = `
        <style>
          .logo-test-row { display: flex; align-items: center; margin: 20px 0; gap: 20px; }
          .logo-test-label { min-width: 100px; font-family: system-ui; font-weight: 600; }
        </style>
        <h2 style="font-family: system-ui; margin-bottom: 30px;">Logo Size Variants</h2>
        <div class="logo-test-row">
          <span class="logo-test-label">Small (sm):</span>
          <div id="logo-sm"></div>
        </div>
        <div class="logo-test-row">
          <span class="logo-test-label">Medium (md):</span>
          <div id="logo-md"></div>
        </div>
        <div class="logo-test-row">
          <span class="logo-test-label">Large (lg):</span>
          <div id="logo-lg"></div>
        </div>
        <div class="logo-test-row">
          <span class="logo-test-label">Extra Large (xl):</span>
          <div id="logo-xl"></div>
        </div>
      `
      document.body.appendChild(testDiv)
    })
    
    // Note: Since we can't directly use React components in evaluate,
    // we'll take a screenshot of the existing logos on the page
    await page.waitForTimeout(500) // Brief wait for render
    
    // Take screenshot of logo test container
    const testContainer = page.locator('#logo-test-container')
    if (await testContainer.isVisible().catch(() => false)) {
      await testContainer.screenshot({ 
        path: `${screenshotDir}/logo-size-variants.png`,
        animations: 'disabled'
      })
    }
    
    // Clean up test container
    await page.evaluate(() => {
      const testDiv = document.getElementById('logo-test-container')
      if (testDiv) testDiv.remove()
    })
    
    console.log('✅ Logo screenshots captured successfully!')
    console.log(`📁 Screenshots saved to: ${screenshotDir}`)
  })
  
  test('verify logo text alignment', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Get logo element
    const logo = page.locator('svg').first()
    await expect(logo).toBeVisible()
    
    // Get bounding box of the logo
    const logoBounds = await logo.boundingBox()
    expect(logoBounds).not.toBeNull()
    
    // Verify logo has proper dimensions
    expect(logoBounds!.width).toBeGreaterThan(100)
    expect(logoBounds!.height).toBeGreaterThan(20)
    
    // Check that text element exists within SVG
    const textElement = logo.locator('text')
    await expect(textElement).toBeVisible()
    await expect(textElement).toHaveText('BRAUNWELL')
    
    // Verify text positioning attributes
    await expect(textElement).toHaveAttribute('dominant-baseline', 'middle')
    await expect(textElement).toHaveAttribute('text-anchor', 'start')
    
    console.log('✅ Logo text alignment verified!')
  })
})