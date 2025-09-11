# Dashboard Builder System Documentation

## Overview

The Dashboard Builder is a comprehensive reporting and analytics system for the Braunewell CRM application. It provides users with the ability to create, customize, save, and share interactive dashboards with various chart types, data visualizations, and automated reporting capabilities.

## Features

### 🎨 Dashboard Builder
- **Drag-and-drop interface** for widget placement
- **Multiple widget types**: Metric cards, bar charts, line charts, pie charts, donut charts, gauges, progress bars, tables, heatmaps, funnel charts, and scatter plots
- **Real-time preview mode** to see dashboards as end users would
- **Grid-based layout system** with visual guides
- **Widget configuration** with extensive customization options

### 📊 Chart Types & Widgets

#### Basic Widgets
- **Metric Cards**: Display single KPI values with trend indicators
- **Tables**: Structured data display with pagination
- **Progress Bars**: Multiple progress indicators in one widget

#### Chart Types
- **Bar Charts**: Compare values across categories
- **Line Charts**: Show trends over time
- **Area Charts**: Filled line charts for cumulative data
- **Pie Charts**: Show proportions of a whole
- **Donut Charts**: Modern pie charts with center space
- **Gauge Charts**: Display progress or percentage values
- **Heatmaps**: Grid-based intensity visualization
- **Funnel Charts**: Show conversion or process flows
- **Scatter Plots**: Show relationships between variables

### 🔧 Data Configuration
- **Multiple data sources**: Projects, tasks, contacts, payments, invoices
- **Advanced filtering**: Field-based filters with multiple operators
- **Aggregation functions**: Count, sum, average, min, max
- **Date range selection**: Today, week, month, quarter, year, custom ranges
- **Group by options**: Organize data by different dimensions

### 📋 Template System
- **Pre-built templates** for common use cases:
  - Executive Dashboard
  - Sales Dashboard
  - Project Management Dashboard
  - Financial Dashboard
- **Custom template creation** from existing dashboards
- **Template categories** for better organization
- **Usage tracking** to show popular templates
- **Template sharing** between users

### 📤 Export Capabilities
- **Multiple formats**: PDF, Excel, CSV, JSON
- **Export configuration**: Include/exclude charts and data
- **Date range filtering** for exports
- **Export history** with download links
- **Automated cleanup** of expired exports

### 🕒 Automated Reporting
- **Scheduled reports** with multiple frequencies:
  - Daily
  - Weekly (specific day of week)
  - Monthly (specific day of month)
  - Quarterly
- **Multiple recipients** per schedule
- **Email delivery** with attachments
- **Timezone support** for accurate delivery
- **Error handling** with retry logic
- **Schedule management** (activate/deactivate)

### 🔄 Real-time Features
- **Auto-refresh intervals** for widgets
- **Live data updates** when dashboard is active
- **Performance optimization** with data caching
- **Loading states** and error handling

## Technical Architecture

### Database Schema

#### Dashboards Table
```typescript
interface Dashboard {
  name: string
  description?: string
  layout: Widget[]
  tags?: string[]
  isTemplate?: boolean
  isPublic: boolean
  isDefault?: boolean
  category?: string
  createdBy: UserId
  createdAt: number
  updatedAt: number
  lastAccessedAt?: number
  accessCount?: number
}
```

#### Widget Configuration
```typescript
interface Widget {
  id: string
  type: WidgetType
  position: { x: number, y: number, w: number, h: number }
  config: {
    title: string
    dataSource: DataSource
    filters?: Filter[]
    aggregation?: AggregationType
    field?: string
    groupBy?: string
    dateRange?: string
    refreshInterval?: number
    customColors?: string[]
    showLegend?: boolean
    showGrid?: boolean
    showTooltip?: boolean
    animationEnabled?: boolean
  }
}
```

#### Dashboard Templates
```typescript
interface DashboardTemplate {
  name: string
  description?: string
  category: string
  layout: Widget[]
  tags?: string[]
  isBuiltIn?: boolean
  usageCount?: number
  createdBy: UserId
  createdAt: number
  updatedAt: number
}
```

#### Scheduled Reports
```typescript
interface ScheduledReport {
  name: string
  description?: string
  dashboardId: DashboardId
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    dayOfWeek?: number
    dayOfMonth?: number
    time: string
    timezone: string
  }
  recipients: Recipient[]
  format: 'pdf' | 'excel' | 'csv'
  isActive: boolean
  lastSentAt?: number
  nextSendAt: number
  errorCount?: number
  lastError?: string
}
```

### API Endpoints

#### Dashboard Management
- `dashboards.list` - Get user's dashboards
- `dashboards.get` - Get specific dashboard
- `dashboards.create` - Create new dashboard
- `dashboards.update` - Update dashboard
- `dashboards.remove` - Delete dashboard
- `dashboards.setDefault` - Set default dashboard
- `dashboards.getDashboardData` - Get widget data

#### Template Management
- `dashboardTemplates.list` - Get available templates
- `dashboardTemplates.get` - Get specific template
- `dashboardTemplates.create` - Create template
- `dashboardTemplates.createFromTemplate` - Create dashboard from template
- `dashboardTemplates.seedBuiltInTemplates` - Seed default templates

#### Export Management
- `reportExports.list` - Get export history
- `reportExports.create` - Start new export
- `reportExports.processExport` - Process export job
- `reportExports.remove` - Delete export

#### Scheduling Management
- `scheduledReports.list` - Get scheduled reports
- `scheduledReports.create` - Create schedule
- `scheduledReports.update` - Update schedule
- `scheduledReports.toggleActive` - Enable/disable schedule
- `scheduledReports.markAsSent` - Mark report as sent

## File Structure

```
/components/dashboard/
├── charts/
│   └── extended-charts.tsx      # Extended chart components
├── dashboard-builder.tsx        # Main builder interface
├── dashboard-widget.tsx         # Individual widget component
├── export-dialog.tsx           # Export functionality
└── schedule-dialog.tsx         # Scheduling interface

/app/(dashboard)/analytics/
├── builder/
│   └── page.tsx                # Dashboard builder page
├── templates/
│   └── page.tsx                # Template gallery
└── page.tsx                    # Enhanced analytics page

/convex/
├── dashboards.ts               # Dashboard API functions
├── dashboardTemplates.ts       # Template API functions
├── reportExports.ts            # Export API functions
├── scheduledReports.ts         # Scheduling API functions
└── schema.ts                   # Database schema
```

## Usage Guide

### Creating a New Dashboard

1. Navigate to Analytics → Dashboards → Create Dashboard
2. Use the drag-and-drop interface to add widgets
3. Configure each widget's data source and visualization options
4. Preview the dashboard to ensure it looks correct
5. Save the dashboard with a descriptive name

### Using Templates

1. Go to Analytics → Browse Templates
2. Browse available templates by category
3. Preview templates to see their layout
4. Click "Use Template" to create a dashboard from the template
5. Customize the dashboard as needed

### Setting Up Automated Reports

1. Open a dashboard and click Export → Schedule Reports
2. Create a new schedule with desired frequency
3. Add recipients who should receive the reports
4. Choose the export format (PDF, Excel, CSV)
5. Set the delivery time and timezone
6. Activate the schedule

### Exporting Dashboards

1. Open any dashboard
2. Click Export → Export Dashboard
3. Choose the desired format and options
4. Configure date range and included content
5. Start the export and download when ready

## Best Practices

### Dashboard Design
- **Keep it focused**: Limit dashboards to 6-8 widgets for optimal readability
- **Use consistent colors**: Apply a consistent color scheme across widgets
- **Logical grouping**: Group related metrics together
- **Clear titles**: Use descriptive titles for widgets and dashboards

### Performance Optimization
- **Appropriate refresh intervals**: Don't set refresh intervals too low
- **Efficient filtering**: Use specific filters to reduce data load
- **Cache considerations**: Be aware of data caching for frequently accessed dashboards

### Data Accuracy
- **Consistent date ranges**: Ensure date ranges make sense for the data being displayed
- **Appropriate aggregations**: Choose the right aggregation method for each metric
- **Filter validation**: Test filters to ensure they return expected results

## Security Considerations

- **Access control**: Dashboards respect user permissions for underlying data
- **Public dashboards**: Use caution when making dashboards public
- **Export security**: Exported files contain potentially sensitive data
- **Scheduled reports**: Ensure recipient lists are appropriate for the data being shared

## Troubleshooting

### Common Issues

1. **Widgets not loading data**
   - Check data source permissions
   - Verify filter configurations
   - Ensure date ranges are valid

2. **Export failures**
   - Check export file size limits
   - Verify dashboard has data for the selected date range
   - Review export error messages

3. **Scheduled reports not sending**
   - Verify schedule is active
   - Check recipient email addresses
   - Review error logs for the schedule

4. **Performance issues**
   - Reduce the number of widgets per dashboard
   - Increase refresh intervals
   - Optimize filters and date ranges

## Future Enhancements

- **Advanced chart types**: Sankey diagrams, treemaps, candlestick charts
- **Real-time collaboration**: Multiple users editing dashboards simultaneously
- **Advanced filtering**: Cross-widget filtering and drill-down capabilities
- **Mobile optimization**: Responsive design for mobile devices
- **API access**: External API for dashboard data
- **Advanced sharing**: Embed dashboards in external websites
- **Data connectors**: Integration with external data sources
- **Custom calculations**: User-defined formulas and calculations

## Support

For technical support or feature requests related to the Dashboard Builder system, please refer to the main project documentation or contact the development team.