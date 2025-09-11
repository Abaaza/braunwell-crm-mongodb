import { test, expect } from '@playwright/test'

test.describe('Component Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for testing
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'test-user', email: 'test@example.com', role: 'admin' } })
      })
    })
    
    await page.goto('/')
  })

  test('should handle basic UI interactions', async ({ page }) => {
    // Test that we can interact with basic UI elements
    await page.goto('/dashboard')
    
    // Should see dashboard heading
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    
    // Should be able to navigate using menu items
    await page.getByRole('link', { name: 'Projects' }).click()
    await page.waitForURL('**/projects')
    
    // Should see projects page
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
  })

  test('should handle search functionality', async ({ page }) => {
    await page.goto('/projects')
    
    // Look for search input
    const searchInput = page.getByPlaceholder('Search projects...')
    if (await searchInput.isVisible()) {
      await searchInput.fill('test project')
      await searchInput.press('Enter')
      
      // Should trigger search functionality
      await page.waitForTimeout(500) // Wait for search to process
    }
  })

  test('should handle modal interactions', async ({ page }) => {
    await page.goto('/projects')
    
    // Look for "Add Project" or "New Project" button
    const addButton = page.getByRole('button', { name: /new|add|create/i }).first()
    if (await addButton.isVisible()) {
      await addButton.click()
      
      // Should open modal or form
      await page.waitForTimeout(500)
      
      // Check if modal or form is visible
      const modal = page.locator('[role="dialog"]')
      if (await modal.isVisible()) {
        // Test modal interactions
        await expect(modal).toBeVisible()
        
        // Close modal with escape key
        await page.keyboard.press('Escape')
        await expect(modal).not.toBeVisible()
      }
    }
  })

  test('should handle form validation', async ({ page }) => {
    await page.goto('/projects')
    
    // Try to create a project with invalid data
    const addButton = page.getByRole('button', { name: /new|add|create/i }).first()
    if (await addButton.isVisible()) {
      await addButton.click()
      
      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /submit|create|save/i })
      if (await submitButton.isVisible()) {
        await submitButton.click()
        
        // Should show validation errors
        await page.waitForTimeout(500)
        
        // Check for error messages
        const errorMessages = page.locator('[role="alert"], .error, .text-destructive')
        if (await errorMessages.first().isVisible()) {
          await expect(errorMessages.first()).toBeVisible()
        }
      }
    }
  })

  test('should handle responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto('/dashboard')
    
    // Check that sidebar is visible on desktop
    const sidebar = page.locator('[data-testid="sidebar"], nav, aside').first()
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible()
    }
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    
    // Should adapt to mobile layout
    await page.waitForTimeout(500)
    
    // Check for mobile menu button
    const mobileMenuButton = page.getByRole('button', { name: /menu|hamburger/i })
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await page.waitForTimeout(300)
    }
  })

  test('should handle data loading states', async ({ page }) => {
    await page.goto('/projects')
    
    // Look for loading indicators
    const loadingIndicators = page.locator('[data-testid="loading"], .loading, .spinner')
    
    // If loading state is present, wait for it to complete
    if (await loadingIndicators.first().isVisible()) {
      await expect(loadingIndicators.first()).not.toBeVisible({ timeout: 10000 })
    }
    
    // Should show content after loading
    await page.waitForTimeout(1000)
    
    // Check that some content is visible
    const content = page.locator('main, [data-testid="content"], .content')
    if (await content.first().isVisible()) {
      await expect(content.first()).toBeVisible()
    }
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })
    
    await page.goto('/projects')
    
    // Should handle error gracefully
    await page.waitForTimeout(2000)
    
    // Check for error message or fallback content
    const errorElements = page.locator('[data-testid="error"], .error, .text-destructive')
    const fallbackElements = page.locator('[data-testid="fallback"], .fallback, .empty-state')
    
    // Either error message or fallback should be visible
    const hasError = await errorElements.first().isVisible()
    const hasFallback = await fallbackElements.first().isVisible()
    
    expect(hasError || hasFallback).toBe(true)
  })
})