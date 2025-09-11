import { test, expect } from '@playwright/test'

test.describe('User Journey: Login → View Projects → Create Project', () => {
  test('complete user journey from login to project creation', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto('/')
    await page.waitForURL('/login')
    
    // Step 2: Login with valid credentials
    await test.step('Login', async () => {
      await page.getByLabel('Email').fill('admin@braunwell.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // Wait for dashboard to load
      await page.waitForURL('/dashboard')
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    })
    
    // Step 3: Navigate to projects
    await test.step('Navigate to projects', async () => {
      // Click on projects in sidebar
      await page.getByRole('link', { name: 'Projects' }).click()
      await page.waitForURL('/projects')
      
      // Verify projects page loaded
      await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
      
      // Check if project list or empty state is shown
      const projectsExist = await page.locator('[data-testid="project-card"]').count() > 0
      if (!projectsExist) {
        await expect(page.getByText('No projects found')).toBeVisible()
      }
    })
    
    // Step 4: Create a new project
    await test.step('Create new project', async () => {
      // Click create project button
      await page.getByRole('button', { name: /Create Project|New Project/i }).click()
      
      // Wait for modal/form to appear
      await expect(page.getByRole('dialog')).toBeVisible()
      
      // Fill in project details
      await page.getByLabel('Project Name').fill('E2E Test Project')
      await page.getByLabel('Company').fill('Test Company Ltd')
      await page.getByLabel('Description').fill('This is a test project created by E2E tests')
      
      // Select status
      await page.getByLabel('Status').selectOption('open')
      
      // Enter revenue
      await page.getByLabel('Expected Revenue (GBP)').fill('50000')
      
      // Set dates
      const today = new Date().toISOString().split('T')[0]
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      await page.getByLabel('Start Date').fill(today)
      await page.getByLabel('End Date').fill(futureDate)
      
      // Submit form
      await page.getByRole('button', { name: /Create|Save/i }).click()
      
      // Wait for success message
      await expect(page.getByText(/Project created successfully/i)).toBeVisible()
      
      // Verify project appears in list
      await expect(page.getByText('E2E Test Project')).toBeVisible()
    })
    
    // Step 5: View the created project
    await test.step('View project details', async () => {
      // Click on the project card/row
      await page.getByText('E2E Test Project').click()
      
      // Wait for project detail page
      await expect(page.getByRole('heading', { name: 'E2E Test Project' })).toBeVisible()
      
      // Verify project details are displayed
      await expect(page.getByText('Test Company Ltd')).toBeVisible()
      await expect(page.getByText('£50,000.00')).toBeVisible()
      await expect(page.getByText('Open')).toBeVisible()
    })
    
    // Step 6: Add a task to the project
    await test.step('Add task to project', async () => {
      // Click add task button
      await page.getByRole('button', { name: /Add Task/i }).click()
      
      // Fill task form
      await page.getByLabel('Task Title').fill('Complete initial setup')
      await page.getByLabel('Description').fill('Set up project infrastructure and initial documentation')
      await page.getByLabel('Priority').selectOption('high')
      
      // Submit task
      await page.getByRole('button', { name: /Create|Add/i }).click()
      
      // Verify task appears
      await expect(page.getByText('Complete initial setup')).toBeVisible()
      await expect(page.getByText('High Priority')).toBeVisible()
    })
    
    // Step 7: Navigate back to dashboard
    await test.step('Return to dashboard', async () => {
      await page.getByRole('link', { name: 'Dashboard' }).click()
      await page.waitForURL('/dashboard')
      
      // Verify the new project appears in recent projects
      await expect(page.getByText('E2E Test Project')).toBeVisible()
    })
  })
  
  test('should handle errors gracefully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel('Email').fill('admin@braunwell.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('/dashboard')
    
    // Navigate to projects
    await page.getByRole('link', { name: 'Projects' }).click()
    
    // Try to create project with invalid data
    await page.getByRole('button', { name: /Create Project|New Project/i }).click()
    
    // Submit empty form
    await page.getByRole('button', { name: /Create|Save/i }).click()
    
    // Should show validation errors
    await expect(page.getByText('Project name is required')).toBeVisible()
    await expect(page.getByText('Revenue must be a positive number')).toBeVisible()
  })
  
  test('should search and filter projects', async ({ page }) => {
    // Login and navigate to projects
    await page.goto('/login')
    await page.getByLabel('Email').fill('admin@braunwell.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('/dashboard')
    
    await page.getByRole('link', { name: 'Projects' }).click()
    await page.waitForURL('/projects')
    
    // Use search functionality
    await page.getByPlaceholder(/Search projects/i).fill('Website')
    await page.keyboard.press('Enter')
    
    // Wait for filtered results
    await page.waitForTimeout(500) // Wait for debounce
    
    // Check that results are filtered
    const projectCards = page.locator('[data-testid="project-card"]')
    const count = await projectCards.count()
    
    if (count > 0) {
      // Verify all visible projects contain "Website"
      for (let i = 0; i < count; i++) {
        const text = await projectCards.nth(i).textContent()
        expect(text?.toLowerCase()).toContain('website')
      }
    }
    
    // Clear search
    await page.getByPlaceholder(/Search projects/i).clear()
    await page.keyboard.press('Enter')
    
    // Apply status filter
    await page.getByRole('button', { name: /Filter|Status/i }).click()
    await page.getByRole('checkbox', { name: 'Open' }).check()
    await page.getByRole('button', { name: 'Apply' }).click()
    
    // Verify filtered results show only open projects
    const statusBadges = page.locator('[data-testid="status-badge"]')
    const statusCount = await statusBadges.count()
    
    for (let i = 0; i < statusCount; i++) {
      const status = await statusBadges.nth(i).textContent()
      expect(status).toBe('Open')
    }
  })
})