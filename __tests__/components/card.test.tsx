import React from 'react'
import { render, screen } from '@/__tests__/test-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'

describe('Card', () => {
  it('should render card with all parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card Title</CardTitle>
          <CardDescription>Test card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here</p>
        </CardContent>
        <CardFooter>
          <p>Card footer</p>
        </CardFooter>
      </Card>
    )

    expect(screen.getByText('Test Card Title')).toBeInTheDocument()
    expect(screen.getByText('Test card description')).toBeInTheDocument()
    expect(screen.getByText('Card content goes here')).toBeInTheDocument()
    expect(screen.getByText('Card footer')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <Card className="custom-card-class">
        <CardContent>Test content</CardContent>
      </Card>
    )

    const card = screen.getByText('Test content').closest('.custom-card-class')
    expect(card).toBeInTheDocument()
  })

  it('should render minimal card', () => {
    render(
      <Card>
        <CardContent>Just content</CardContent>
      </Card>
    )

    expect(screen.getByText('Just content')).toBeInTheDocument()
  })

  it('should handle nested content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>
            <span data-testid="nested-title">Nested Title</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </div>
        </CardContent>
      </Card>
    )

    expect(screen.getByTestId('nested-title')).toBeInTheDocument()
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument()
  })
})