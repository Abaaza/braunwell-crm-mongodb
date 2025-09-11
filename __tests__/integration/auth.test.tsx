import { render, screen } from '@/__tests__/test-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

describe('Integration Tests', () => {
  describe('UI Components Integration', () => {
    it('should render card with button', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Click Me</Button>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('This is a test card')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument()
    })

    it('should handle nested component interactions', () => {
      const handleClick = jest.fn()
      
      render(
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
            <CardDescription>Test interactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={handleClick} variant="default">
              Primary Action
            </Button>
            <Button onClick={handleClick} variant="outline">
              Secondary Action
            </Button>
          </CardContent>
        </Card>
      )

      const primaryButton = screen.getByRole('button', { name: 'Primary Action' })
      const secondaryButton = screen.getByRole('button', { name: 'Secondary Action' })

      expect(primaryButton).toHaveClass('bg-primary')
      expect(secondaryButton).toHaveClass('border', 'border-input')

      // Test interactions
      primaryButton.click()
      secondaryButton.click()

      expect(handleClick).toHaveBeenCalledTimes(2)
    })
  })

  describe('Data Flow Integration', () => {
    it('should handle mock data rendering', () => {
      const mockData = {
        title: 'Test Project',
        description: 'Test project description',
        status: 'active',
      }

      render(
        <Card>
          <CardHeader>
            <CardTitle>{mockData.title}</CardTitle>
            <CardDescription>{mockData.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                mockData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {mockData.status}
              </span>
            </div>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Test Project')).toBeInTheDocument()
      expect(screen.getByText('Test project description')).toBeInTheDocument()
      expect(screen.getByText('active')).toBeInTheDocument()
    })
  })
})