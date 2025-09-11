Braunwell CRM - Complete Engineering Specification
🎯 Project Overview
Braunwell CRM is a modern, real-time Customer Relationship Management system designed for small UK businesses. It supports projects and contacts with comprehensive task management, audit logging, and role-based permissions. that will be deployed on versal and convex.dev .
🛠️ Technical Stack
Frontend Framework
•	Next.js 15.3.5
•	React  with TypeScript
•	Node.js runtime environment
UI Libraries & Components
•	shadcn/ui: Modern component library built on Radix UI primitives
o	Components: Avatar, Badge, Button, Card, Dialog, Dropdown Menu, Form, Input, Label, Select, Skeleton, Table, Tabs, Textarea
•	Radix UI: Unstyled, accessible component primitives
•	Lucide React: Icon library (use h-5 w-5 as standard size)
•	Framer Motion: Animation library for smooth transitions
•	Sonner: Toast notification system
Styling System
•	Tailwind CSS
•	DaisyUI v5: Additional component styles (optional enhancement)
Backend & Database
•	Convex : Serverless, real-time database with TypeScript support 
dev:hidden-kudu-495|eyJ2MiI6IjRlMjFiNzEwYmM5MTRmYjNiZjBhZjMyYWQ0MjczMjY0In0=
https://hidden-kudu-495.convex.cloud
https://hidden-kudu-495.convex.site
•	Built-in real-time subscriptions for live updates
•	Automatic API generation from TypeScript functions
Form & Validation
•	React Hook Form : Form state management
•	Zod: Schema validation library
•	@hookform/resolvers: Integration between React Hook Form and Zod
Authentication & Security
•	Custom JWT-based authentication (session tokens)
•	bcryptjs: Password hashing (using base64 for demo - NOT production ready)
•	cookies-next: Cookie management for session storage
•	Role-based access control (Admin/User)
Utilities
•	date-fns: Date formatting and manipulation
•	TypeScript: Full type safety across the application
🎨 Design System
Color Palette (Google-Inspired)
Primary Blue: #4285F4    /* Main CTAs, links, primary actions */
Secondary Red: #EA4335   /* Errors, destructive actions, alerts */
Accent Green: #34A853    /* Success states, positive metrics,  items */
Warning Yellow: #FBBC04  /* Warnings, pending states, attention needed */
Neutral Gray: #5F6368    /* Body text, borders, secondary elements */
Light Gray: #F8F9FA      /* Backgrounds, cards, subtle surfaces */
White: #FFFFFF           /* Primary background, clean surfaces */
Typography System
•	Font Family: System fonts with Google Sans fallback
•	Heading Sizes:
o	h1: 3rem (48px) - Page titles
o	h2: 2rem (32px) - Section headers
o	h3: 1.5rem (24px) - Subsections
o	h4: 1.25rem (20px) - Card titles
•	Body Text: 1rem (16px) with 1.5 line height
•	Responsive Scaling: All headings scale down on mobile
Component Design Patterns
Cards
•	White background with subtle shadow: shadow-sm hover:shadow-md
•	Colored left border for categorization (4px width)
•	Padding: p-6 (24px)
•	Border radius: rounded-lg
•	Hover state: Slight elevation and shadow increase
Buttons
•	Primary: Solid blue background with white text
•	Secondary: White background with colored border
•	Destructive: Red background for delete actions
•	Ghost: Transparent with hover background
•	Gradient: Primary CTAs use blue-to-purple gradient
•	Standard sizes: sm, md (default), lg
•	All buttons have hover and focus states
Form Inputs
•	Clean borders with focus ring
•	Glass morphism effect on focus
•	Error states with red border and message
•	Label positioning above input
•	Placeholder text in lighter gray
Animations
•	Page transitions: Fade in with slight upward movement
•	Card hover: Scale(1.02) with shadow increase
•	Stagger children: 0.1s delay between list items
•	Loading states: Skeleton pulse animation
•	Toast notifications: Slide in from bottom-right
Special Effects
•	Glass Morphism:
•	Gradient Overlays: Mesh gradients for backgrounds
•	Glow Effects: Colored shadows for emphasis
•	Smooth Scrolling: Custom scrollbar styling
📊 Database Schema
Users Table
{
  email: string;              // Unique email address
  passwordHash: string;       // Base64 encoded (demo only)
  role: "admin" | "user";     // Role-based permissions
  name: string;               // Display name
  isActive?: boolean;         // Account status
  lastLoginAt?: number;       // Unix timestamp
  createdAt: number;          // Unix timestamp
  updatedAt: number;          // Unix timestamp
}
Sessions Table
{
  userId: Id<"users">;        // Reference to user
  token: string;              // Random session token
  expiresAt: number;          // Unix timestamp (7 days)
}
Contacts Table
{
  name: string;               // Full name
  email: string;              // Unique email
  phone: string;              // UK format validated
  company?: string;           // Optional company name
  notes?: string;             // Additional notes
  createdBy: Id<"users">;     // User who created
  createdAt: number;          // Unix timestamp
  updatedAt: number;          // Unix timestamp
}
Projects Table
{
  name: string;               // Project name
  description?: string;       // Optional description
  status: "open" | "closed";  // Project status
  expectedRevenueGBP: number; // Revenue in pounds
  startDate?: number;         // Unix timestamp
  endDate?: number;           // Unix timestamp
  createdBy: Id<"users">;     // Creator user
  createdAt: number;          // Unix timestamp
  updatedAt: number;          // Unix timestamp
}
Tasks Table
{
  title: string;              // Task title
  description?: string;       // Optional details
  status: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  dueDate?: number;           // Unix timestamp
  projectId: Id<"projects">; // Parent project
  assignedTo?: Id<"users">;  // Assigned user
  createdBy: Id<"users">;    // Creator
  createdAt: number;          // Unix timestamp
  updatedAt: number;          // Unix timestamp
}
Audit Logs Table
{
  action: string;             // created, updated, deleted
  entityType: string;         // projects, contacts, tasks
  entityId: string;           // ID of affected entity
  userId: Id<"users">;        // User who performed action
  changes?: string;           // JSON string of changes
  timestamp: number;          // Unix timestamp
}
🏗️ Application Architecture
📱 Page Features & Components
1. Dashboard Page
Route: /dashboard
Components:
•	Hero section with personalized greeting
•	4 stat cards showing:
o	Total Projects (with trend %)
o	Active Tasks (todo + in_progress)
o	Expected Revenue (sum in GBP)
o	Recent Contacts (last 7 days)
•	Quick Actions grid (admin only):
o	Create Project button
o	Create Task button
o	Create Contact button
•	Recent Activity timeline (last 5 items)
•	Recent Contacts list (last 5 with avatars)
Data Requirements:
•	Real-time project counts
•	Task statistics by status
•	Revenue calculations
•	Activity feed from audit logs
2. Projects Page
Route: /projects
Features:
•	Grid/List view toggle
•	Create Project button (admin only)
•	Search by project name
•	Filter by status (All/Open/Closed)
•	Sort by: Date Created, Name, Revenue
•	Project cards displaying:
o	Name and status badge
o	Expected revenue (formatted as £X,XXX)
o	Contact count
o	Last updated date
o	Action menu (View/Edit/Archive/Delete)
•	Pagination (12 items per page)
Modals:
•	Create/Edit Project Dialog
•	Delete Confirmation Dialog
3. Contacts Page
Route: /contacts
Features:
•	Grid/List view toggle
•	Create Contact button (admin only)
•	Search across name/email/phone
•	Filter by associated project
•	Sort by: Name, Email, Date Added
•	Contact cards/rows showing:
o	Avatar with initial
o	Name and company
o	Email and phone
o	Project count badge
o	Quick actions (Email/Call/Edit/Delete)
•	Bulk actions menu
•	Import/Export buttons (placeholders)
UK-Specific:
•	Phone validation for UK formats
•	+44 or 0 prefix support
4. Tasks Page
Route: /tasks
Views:
•	Kanban Board (default):
o	3 columns: To Do, In Progress, Done
o	Drag-and-drop between columns
o	Task count per column
•	List View:
o	Table format with inline editing
o	Status dropdown
o	Priority indicators
Task Cards Display:
•	Title (truncated if long)
•	Priority badge (color-coded)
•	Due date (red if overdue)
•	Project name
•	Assignee avatar
Filters:
•	Search by title/description
•	Filter by priority
•	Filter by status
•	Filter by project
•	Show only overdue
5. Analytics Page
Route: /analytics
Components:
•	Revenue chart (monthly)
•	Project status distribution
•	Task completion rate
•	Contact growth chart
•	Top performing projects
•	Activity heatmap
6. Profile Page
Route: /profile
Features:
•	User information display
•	Avatar upload (placeholder)
•	Change password form
•	Activity history
•	Preferences section
7. Settings Page
Route: /settings
Sections:
•	General settings
•	Notification preferences
•	Data & Privacy
•	Export options
•	System information
8. Users Page (Admin Only)
Route: /users
Features:
•	User list table
•	Create user button
•	Edit user roles
•	Activate/Deactivate users
•	Last login tracking
🔐 Authentication Flow
Login Process
1.	User enters email/password on /login
2.	Frontend sends credentials to auth.login mutation
3.	Backend validates credentials (base64 hash comparison)
4.	Creates session with 7-day expiry
5.	Returns session token
6.	Frontend stores token in httpOnly cookie
7.	Redirects to /dashboard
Session Management
•	Tokens stored in cookies using cookies-next
•	AuthProvider validates token on mount
•	Protected routes check authentication status
•	Automatic redirect to login if unauthorized
•	Logout clears session and cookie
Permission Model
Admin Role:
•	Full CRUD on all entities
•	Access to user management
•	View audit logs
•	Delete permissions
User Role:
•	Read all data
•	Create/Edit own tasks
•	Update project status only
•	No delete permissions
•	No user management access
🚀 Implementation Guidelines
Key Implementation Notes
1.	Real-time Updates:
o	Use Convex useQuery hooks for live data
o	Implement optimistic updates for better UX
o	Handle loading and error states
2.	Form Handling:
o	Use React Hook Form for all forms
o	Implement Zod schemas for validation
o	Show inline validation errors
o	Toast notifications for success/error
3.	Responsive Design:
o	Mobile-first approach
o	Test on various screen sizes
o	Collapsible navigation on mobile
o	Touch-friendly interfaces
4.	Performance:
o	Implement pagination for lists
o	Use React.memo for expensive components
o	Lazy load routes
o	Optimize images and assets
5.	UK Localization:
o	Format currency as GBP (£)
o	Validate UK phone numbers
o	Use DD/MM/YYYY date format
o	Consider UK business terminology
6.	Security Considerations:
o	Never expose sensitive data
o	Implement proper CORS headers
o	Use HTTPS in production
o	Sanitize user inputs
o	Implement rate limiting
Testing Checklist
•	 Authentication flow works correctly
•	 Permissions are enforced properly
•	 Real-time updates work across tabs
•	 Forms validate correctly
•	 Responsive design on all devices
•	 UK-specific features work
•	 Audit logs capture all actions
•	 Performance is acceptable
•	 Error states are handled gracefully
•	 Accessibility standards are met
🎯 Business Rules
o	2 hardcoded users (admin@braunwell.com, user@braunwell.com)
2.	Validation Rules:
o	Email must be unique for contacts
o	UK phone numbers only
o	Projects must have positive revenue
o	Tasks must be linked to projects
3.	Audit Requirements:
o	Log all create/update/delete operations
o	Include user, timestamp, and changes
o	Retain logs for compliance
1. Dashboard Page (/dashboard/page.tsx)  
Components Needed:
•	 Hero welcome section with gradient text
•	 4 stat cards with colored accents (blue, red, green, yellow)
•	 Quick actions grid (3 cards)
•	 Recent activity timeline
•	 Recent contacts list
•	 Background gradient mesh (subtle)
Data Requirements:
•	Total projects count
•	Active tasks count
•	Total revenue
•	Recent contacts (last 5)
•	Recent activities (last 4)
Testing Checklist:
•	 Responsive on mobile/tablet/desktop
•	 All stats load correctly
•	 Quick actions work for admin users
•	 Recent contacts link properly
•	 Animations are smooth
2. Projects Page (/projects/page.tsx)  
Components Needed:
•	 Page header with title and create button
•	 Search bar with icon
•	 Status filter dropdown
•	 Project cards grid (3 columns desktop, 1 mobile)
•	 Pagination component
•	 Empty state illustration
•	 Project dialog (create/edit)
Features:
•	 Real-time search
•	 Status filtering (all/open/closed)
•	 Sort by date/name/revenue
•	 Bulk actions toolbar
•	 Export to CSV
Card Design:
•	Blue left border for open projects
•	Green left border for closed projects
•	Show: Name, status badge, revenue, contacts, date
•	Dropdown menu: View, Edit, Delete, Archive
Testing Checklist:
•	 Search filters results correctly
•	 Pagination works with filters
•	 Create project dialog validates properly
•	 Edit preserves existing data
•	 Delete shows confirmation
•	 Mobile responsive cards
3. Project Detail Page (/projects/[id]/page.tsx)
Components Needed:
•	 Breadcrumb navigation
•	 Project header with status badge
•	 Info cards row (revenue, contacts, tasks)
•	 Tabs component (Overview, Tasks, Contacts, Activity)
•	 Task list with inline status change
•	 Contact list with unlink option
•	 Activity timeline
•	 Edit/Delete floating action buttons
Features:
•	 Real-time updates
•	 Inline task creation
•	 Contact search and link
•	 Status change with confirmation
•	 Revenue tracking chart
•	 Export project report
Testing Checklist:
•	 All tabs load correct data
•	 Task status updates work
•	 Contact linking/unlinking works
•	 Breadcrumb navigation works
•	 Loading states show properly
4. Contacts Page (/contacts/page.tsx)  
Components Needed:
•	 Page header with create button
•	 Search bar with filters
•	 View toggle (grid/list)
•	 Contact cards with avatars
•	 Pagination
•	 Contact dialog
•	 Import contacts button
Card Design:
•	Colored avatar based on name
•	Show: Name, email, phone, projects count
•	Quick actions: Email, Call, View, Edit
•	Hover effect with shadow
Features:
•	 Search by name/email/phone
•	 Filter by project association
•	 Sort alphabetically/by date
•	 Bulk email functionality
•	 Import from CSV
•	 Export contacts
Testing Checklist:
•	 UK phone formatting works
•	 Search is case-insensitive
•	 Grid/list toggle maintains state
•	 Create validates email uniqueness
•	 Pagination preserves filters
5. Contact Detail Page (/contacts/[id]/page.tsx)
Components Needed:
•	 Contact header with avatar
•	 Contact info card
•	 Projects association list
•	 Communication timeline
•	 Notes section
•	 Activity history
•	 Edit/Delete actions
Features:
•	 Add/remove projects
•	 Log communications
•	 Add notes with timestamps
•	 Email integration placeholder
•	 Call history
•	 Tags management
Testing Checklist:
•	 All contact data displays
•	 Project associations update
•	 Notes save properly
•	 Activity logs correctly
•	 Mobile layout works
6. Tasks Page (/tasks/page.tsx)  
Components Needed:
•	 Page header with create button
•	 Search and multi-filter bar
•	 Kanban board view
•	 List view toggle
•	 Task cards with drag-drop
•	 Task dialog
•	 Bulk actions toolbar (placeholder)
Kanban Columns:
•	To Do (gray border)
•	In Progress (blue border)
•	Done (green border)
Task Card Design:
•	Priority indicator (colored dot)
•	Title and description preview
•	Assignee avatar
•	Due date with overdue warning
•	Project tag
•	Quick actions menu
Features:
•	 Drag and drop between columns
•	 Quick status update
•	 Priority filtering
•	 Assignee filtering
•	 Due date sorting
•	 Bulk status change
•	 Task templates
Testing Checklist:
•	 Drag and drop works smoothly
•	 Filters combine correctly
•	 Create task validates required fields
•	 Due date warnings show
•	 Mobile view works without drag
7. Analytics Page (/analytics/page.tsx)  
Components Needed:
•	 Date range picker
•	 Export button
•	 4 metric cards (colored)
•	 Revenue chart (line) - placeholder
•	 Project status chart (donut) - placeholder
•	 Task completion chart (bar) - placeholder
•	 Top projects table
•	 Performance insights grid
Charts Design:
•	Use Chart.js or Recharts
•	Google colors for data points
•	Responsive sizing
•	Hover tooltips
•	Legend with toggles
Features:
•	 Real-time data updates
•	 Date range filtering
•	 Comparison periods
•	 Export to PDF/Excel
•	 Custom metrics builder
•	 Saved reports
Testing Checklist:
•	 Charts render with data
•	 Date picker updates all metrics
•	 Export generates correct format
•	 Charts are responsive
•	 Loading states work
8. Users Page (/users/page.tsx) - Admin Only  
Components Needed:
•	 Access control wrapper
•	 User stats cards
•	 User table with actions
•	 Role filter
•	 Search bar
•	 Invite user button (placeholder)
•	 Bulk actions
Table Columns:
•	Avatar + Name
•	Email
•	Role badge
•	Status (Active/Inactive)
•	Last login
•	Projects count
•	Actions
Features:
•	 Role management
•	 Account activation/deactivation
•	 Password reset
•	 Activity logs
•	 Permissions matrix
•	 Bulk role assignment
Testing Checklist:
•	 Non-admins redirected
•	 Role changes apply immediately
•	 Can't delete self
•	 Search works on all fields
•	 Bulk actions confirm
9. Profile Page (/profile/page.tsx)  
Components Needed:
•	 Profile header with avatar
•	 Personal info form
•	 Password change form
•	 Notification preferences
•	 Theme toggle (placeholder)
•	 Activity log
•	 Danger zone (delete account)
Design:
•	Two-column layout on desktop
•	White cards with shadows
•	Form sections with dividers
•	Success/error states
•	Loading states on save
Features:
•	 Avatar upload
•	 Email verification
•	 2FA setup
•	 API keys management
•	 Export personal data
•	 Account deletion
Testing Checklist:
•	 Forms validate properly
•	 Password strength indicator
•	 Changes save successfully
•	 Avatar upload works
•	 Theme toggle persists
10. Settings Page (/settings/page.tsx) -   
Components Needed:
•	 Settings navigation tabs
•	 General settings form
•	 Email configuration
•	 Integration settings
•	 Backup/restore
•	 System logs (admin)
Tabs:
•	General
•	Notifications
•	Integrations
•	Security
•	Backup
•	System (admin only)
Testing Checklist:
•	 All forms save properly
•	 Validations work
•	 Admin sections hidden for users
•	 Changes apply immediately
🛠️ Implementation Order
Phase 1: Core Pages (Week 1)
1.	 Dashboard - Set the design standard ()
2.	Projects listing - Establish card patterns
3.	Contacts listing - Reuse patterns
4.	Tasks listing - Kanban implementation
Phase 2: Detail Pages (Week 2)
5.	Project detail - Complex data display
6.	Contact detail - Communication features
7.	Profile - Forms and validation
8.	Settings -  page creation
Phase 3: Advanced Features (Week 3)
9.	Analytics - Chart integration
10.	Users management - Admin features
11.	Bulk actions - All pages
12.	Export/Import - All applicable pages
🧪 Testing Strategy
Unit Testing
•	 Component rendering tests
•	 Form validation tests
•	 Data transformation tests
•	 Permission checks
Integration Testing
•	 API calls with Convex
•	 Navigation flows
•	 Data persistence
•	 Real-time updates
E2E Testing
•	 Complete user journeys
•	 Admin workflows
•	 Mobile responsiveness
•	 Performance metrics
Manual Testing Checklist
For each page:
•	 Desktop Chrome/Firefox/Safari
•	 Mobile iOS/Android
•	 Tablet landscape/portrait
•	 Slow network conditions
•	 Large datasets (100+ items)
•	 Accessibility (keyboard nav)
•	 Dark mode (if implemented)
🚀 Performance Optimization
1.	Code Splitting
o	Lazy load heavy components
o	Dynamic imports for dialogs
o	Route-based splitting
2.	Data Optimization
o	Implement virtual scrolling
o	Pagination over infinite scroll
o	Debounce search inputs
o	Cache API responses
3.	Asset Optimization
o	Optimize images
o	Use SVGs for icons
o	Minimize CSS bundle
o	Tree-shake unused code
📝 Component Library
Shared Components to Create
1.	 PageHeader - Consistent page titles ()
2.	 SearchBar - Reusable search with icon ()
3.	 FilterBar - Multi-select filters ()
4.	 DataCard - Consistent card styling ()
5.	 EmptyState - Illustrated empty states ()
6.	 Pagination - Consistent pagination ()
7.	BulkActions - Floating toolbar
8.	ExportButton - Dropdown export options
9.	 StatCard - Metric display cards ()
10.	ActivityItem - Timeline entries
Dialog Components
1.	ConfirmDialog - Consistent confirmations
2.	FormDialog - Base for create/edit
3.	ImportDialog - File upload handling
Layout Components
1.	TabsLayout - Consistent tab navigation
2.	GridLayout - Responsive grids
3.	TableLayout - Consistent tables
📊 Progress Tracker
 Components
•	 PageHeader component
•	 SearchBar component
•	 FilterBar component
•	 DataCard component
•	 EmptyState component (with variations)
•	 Pagination component (with variations)
•	 StatCard component (with variations)
 Pages
•	 Dashboard page (Google-style redesign)
•	 Projects page (with search, filters, stats)
•	 Contacts page (grid/list view, search, filters)
•	 Tasks page (Kanban board, drag-drop, list view)
•	 Analytics page (charts placeholders, metrics, insights)
•	 Users page (admin only, role management)
•	 Profile page (personal info, settings, activity)
•	 Settings page (multi-tab configuration)
Navigation Updated
•	 All pages added to sidebar navigation
•	 Admin-only section for Users page
•	 Quick access to Settings from navbar
Remaining Pages
1.	Project Detail page (/projects/[id]/page.tsx)
2.	Contact Detail page (/contacts/[id]/page.tsx)
Design Achievements
•	 Consistent Google color palette throughout
•	 White background with subtle shadows
•	 Responsive design on all pages
•	 Smooth animations with Framer Motion
•	 Reusable shared components
•	 Clean, modern UI with Google-style cards
•	 Proper admin access controls
•	 Form validation and user feedback
🎯 Success Criteria
1.	Visual Consistency
o	All pages use Google color palette
o	Consistent spacing and typography
o	Unified component styling
o	Smooth animations
2.	Functionality
o	All CRUD operations work
o	Real-time updates function
o	Search/filter/sort work correctly
o	Exports generate properly
3.	Performance
o	Pages load < 2 seconds
o	Smooth animations (60fps)
o	No memory leaks
o	Optimized bundle size
4.	Accessibility
o	WCAG 2.1 AA compliant
o	Keyboard navigable
o	Screen reader friendly
o	High contrast mode
5.	Responsiveness
o	Works on all devices
o	Touch-friendly on mobile
o	Readable on all screens
o	No horizontal scroll


