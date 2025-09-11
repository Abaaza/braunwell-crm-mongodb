import { test } from '@playwright/test'

test.describe('Braunwell Logo Screenshots', () => {
  test('capture login page logo', async ({ page }) => {
    // Simple test to capture login page logo
    await page.goto('/login')
    
    // Wait a bit for page to load
    await page.waitForTimeout(2000)
    
    // Take screenshot of entire login page
    await page.screenshot({ 
      path: 'e2e/screenshots/logo-alignment/login-page-with-logo.png',
      fullPage: true 
    })
    
    console.log('✅ Login page screenshot captured!')
  })
})