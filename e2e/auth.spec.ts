import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // When visiting the root, should redirect to login
    await page.waitForURL('/login')
    
    // Should show login form
    await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should show validation errors
    await expect(page.getByText('Invalid email address')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in login form
    await page.getByLabel('Email').fill('admin@braunwell.com')
    await page.getByLabel('Password').fill('admin123')
    
    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard')
    
    // Should show dashboard content
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('should logout successfully', async ({ page, context }) => {
    // Set up authenticated session
    await context.addCookies([{
      name: 'session-token',
      value: 'test-token',
      domain: 'localhost',
      path: '/',
    }])
    
    await page.goto('/dashboard')
    
    // Click user menu
    await page.getByRole('button', { name: /user menu/i }).click()
    
    // Click logout
    await page.getByRole('menuitem', { name: 'Logout' }).click()
    
    // Should redirect to login
    await page.waitForURL('/login')
    
    // Should clear session cookie
    const cookies = await context.cookies()
    expect(cookies.find(c => c.name === 'session-token')).toBeUndefined()
  })

  test('should restrict access to admin pages', async ({ page, context }) => {
    // Set up authenticated non-admin session
    await context.addCookies([{
      name: 'session-token',
      value: 'user-token',
      domain: 'localhost',
      path: '/',
    }])
    
    // Try to access admin page
    await page.goto('/users')
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard')
    
    // Should show access denied message
    await expect(page.getByText('You do not have permission to access this page')).toBeVisible()
  })
})