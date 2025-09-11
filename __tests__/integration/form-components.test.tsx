import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/test-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

describe('Form Components Integration', () => {
  it('should render complete form with all components', () => {
    const handleSubmit = jest.fn()

    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Form</CardTitle>
          <CardDescription>Complete form integration test</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter your password" />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Submit</Button>
                <Button type="button" variant="outline">Cancel</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    )

    // Check all form elements are present
    expect(screen.getByText('Test Form')).toBeInTheDocument()
    expect(screen.getByText('Complete form integration test')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should handle form input interactions', () => {
    render(
      <div>
        <Label htmlFor="test-input">Test Input</Label>
        <Input id="test-input" data-testid="test-input" />
      </div>
    )

    const input = screen.getByTestId('test-input')
    
    // Test typing in the input
    fireEvent.change(input, { target: { value: 'test value' } })
    expect(input).toHaveValue('test value')
  })

  it('should handle button variants in form context', () => {
    render(
      <div className="space-y-2">
        <Button variant="default">Primary Action</Button>
        <Button variant="secondary">Secondary Action</Button>
        <Button variant="outline">Outline Action</Button>
        <Button variant="ghost">Ghost Action</Button>
        <Button variant="link">Link Action</Button>
        <Button variant="destructive">Destructive Action</Button>
      </div>
    )

    // Check all button variants are rendered
    expect(screen.getByRole('button', { name: 'Primary Action' })).toHaveClass('bg-primary')
    expect(screen.getByRole('button', { name: 'Secondary Action' })).toHaveClass('bg-secondary')
    expect(screen.getByRole('button', { name: 'Outline Action' })).toHaveClass('border', 'border-input')
    expect(screen.getByRole('button', { name: 'Ghost Action' })).toHaveClass('hover:bg-accent')
    expect(screen.getByRole('button', { name: 'Link Action' })).toHaveClass('text-primary')
    expect(screen.getByRole('button', { name: 'Destructive Action' })).toHaveClass('bg-destructive')
  })

  it('should handle form submission with validation', () => {
    const handleSubmit = jest.fn((e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const email = formData.get('email')
      const password = formData.get('password')
      
      if (!email || !password) {
        return
      }
      
      handleSubmit.mockImplementation(() => {
        // Simulate successful form submission
      })
    })

    render(
      <form onSubmit={handleSubmit}>
        <Input name="email" placeholder="Email" data-testid="email" />
        <Input name="password" type="password" placeholder="Password" data-testid="password" />
        <Button type="submit">Submit</Button>
      </form>
    )

    const emailInput = screen.getByTestId('email')
    const passwordInput = screen.getByTestId('password')
    const submitButton = screen.getByRole('button', { name: 'Submit' })

    // Fill in form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    // Submit form
    fireEvent.click(submitButton)

    expect(handleSubmit).toHaveBeenCalled()
  })

  it('should handle disabled state across components', () => {
    render(
      <div>
        <Input disabled placeholder="Disabled input" data-testid="disabled-input" />
        <Button disabled>Disabled Button</Button>
      </div>
    )

    expect(screen.getByTestId('disabled-input')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Disabled Button' })).toBeDisabled()
  })
})