import { render, screen } from '@/__tests__/test-utils'
import { StatCard } from '@/components/shared/stat-card'
import { Users } from 'lucide-react'

describe('StatCard', () => {
  it('should render basic stat card', () => {
    render(
      <StatCard
        title="Total Users"
        value={150}
        description="Active users in the system"
      />
    )

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('Active users in the system')).toBeInTheDocument()
  })

  it('should render with icon', () => {
    render(
      <StatCard
        title="Total Users"
        value={150}
        icon={<Users data-testid="users-icon" />}
      />
    )

    expect(screen.getByTestId('users-icon')).toBeInTheDocument()
  })

  it('should render positive trend', () => {
    render(
      <StatCard
        title="Revenue"
        value="£10,000"
        trend={{ value: 15.5, isPositive: true }}
      />
    )

    expect(screen.getByText('+15.5%')).toBeInTheDocument()
    expect(screen.getByText('+15.5%')).toHaveClass('text-accent')
    expect(screen.getByText('from last month')).toBeInTheDocument()
  })

  it('should render negative trend', () => {
    render(
      <StatCard
        title="Expenses"
        value="£5,000"
        trend={{ value: 8.2, isPositive: false }}
      />
    )

    expect(screen.getByText('-8.2%')).toBeInTheDocument()
    expect(screen.getByText('-8.2%')).toHaveClass('text-destructive')
  })

  it('should apply color variants', () => {
    const { rerender } = render(
      <StatCard title="Test" value="100" color="blue" />
    )

    let card = screen.getByText('Test').closest('.transition-all')
    expect(card).toHaveClass('border-l-primary')

    rerender(<StatCard title="Test" value="100" color="red" />)
    card = screen.getByText('Test').closest('.transition-all')
    expect(card).toHaveClass('border-l-secondary')

    rerender(<StatCard title="Test" value="100" color="green" />)
    card = screen.getByText('Test').closest('.transition-all')
    expect(card).toHaveClass('border-l-accent')

    rerender(<StatCard title="Test" value="100" color="yellow" />)
    card = screen.getByText('Test').closest('.transition-all')
    expect(card).toHaveClass('border-l-warning')
  })

  it('should render as link when href is provided', () => {
    render(
      <StatCard
        title="Projects"
        value={25}
        href="/projects"
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/projects')
    expect(link).toContainElement(screen.getByText('Projects'))
  })

  it('should not render optional elements when not provided', () => {
    render(<StatCard title="Simple" value={42} />)

    expect(screen.getByText('Simple')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.queryByText('from last month')).not.toBeInTheDocument()
  })

  it('should handle string values', () => {
    render(
      <StatCard
        title="Status"
        value="Active"
        description="Current system status"
      />
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})