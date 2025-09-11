# BraunewellCRM - Remaining Action Items

This document lists all remaining tasks from the worklist.md specification that haven't been implemented yet. Review and remove any items that aren't needed for your MVP.

## 1. Missing Shared Components

### High Priority Components
- [x] **FilterBar** - Multi-select filters component for list pages (COMPLETED)
- [x] **BulkActions** - Floating toolbar for bulk operations (COMPLETED)
- [x] **ActivityItem** - Reusable timeline entry component (COMPLETED)

### Dialog Components
- [x] **ConfirmDialog** - Consistent confirmation dialogs (COMPLETED)
- [x] **FormDialog** - Base dialog for create/edit operations (COMPLETED)
- [x] **ImportDialog** - File upload handling with validation (COMPLETED)

### Layout Components
- [x] **TabsLayout** - Consistent tab navigation wrapper (COMPLETED)
- [x] **GridLayout** - Responsive grid wrapper (COMPLETED)
- [x] **TableLayout** - Consistent table wrapper with sorting (COMPLETED)

## 2. Placeholder Features by Page

### Analytics Page (/analytics)
- [ ] Replace placeholder charts with real implementations using Chart.js or Recharts
  - [x] Revenue chart (monthly line chart) (COMPLETED with Recharts)
  - [x] Project status distribution (donut chart) (COMPLETED with Recharts)  
  - [x] Task completion rate (bar chart) (COMPLETED with Recharts)
  - [x] Contact growth chart (area chart) (COMPLETED with Recharts)
- [x] Implement date range picker functionality (COMPLETED)
- [x] Create custom metrics builder (COMPLETED)
- [x] Implement saved reports feature (COMPLETED)
- [x] Add comparison periods feature (COMPLETED)

### Projects Page (/projects)
- [x] Add bulk actions toolbar (COMPLETED)
- [x] Add sort functionality (by date/name/revenue) (COMPLETED)
- [x] Add advanced filtering with FilterBar component (COMPLETED)
- [x] Add PAYMENT TRACKER TO TRACK WHAT THE CUSTOMER PAYED SO FAR. (COMPLETED)
- [x] Add COMPANY NAME NEXT TO THE TITLE OF THE PROJECT. (COMPLETED)

### Contacts Page (/contacts)
- [x] Implement filter by project association (COMPLETED)
- [x] Add bulk actions (delete) (COMPLETED)
- [x] Add sort functionality (COMPLETED)

### Tasks Page (/tasks)
- [x] Add bulk actions toolbar (COMPLETED)
- [x] Implement bulk status change (COMPLETED)
- [x] Create task templates feature (COMPLETED)
- [x] Add recurring tasks functionality (COMPLETED)
- [x] Implement task dependencies (COMPLETED)

### Settings Page (/settings)
- [x] Implement General settings form (COMPLETED - with backend integration)
- [x] Add Backup/restore functionality (COMPLETED)
- [x] Implement System logs viewer (admin only) (COMPLETED)

### Profile Page (/profile)
- [x] Enable avatar upload functionality (COMPLETED - with base64 storage)

### Users Page (/users)
- [x] Create permissions matrix UI (COMPLETED)
- [x] Add user activity tracking (COMPLETED)
- [x] Create user audit log viewer (COMPLETED - accessible at /settings/logs)

### Project Detail Page (/projects/[id])
- [x] Enable project-contact associations (COMPLETED)
- [x] Replace revenue tracking chart placeholder (COMPLETED with Recharts)
- [x] Add project timeline view (COMPLETED)
- [x] Implement project templates (COMPLETED)
- [x] Add project duplication feature (COMPLETED)
- [x] Create project archiving functionality (COMPLETED)
- [x] Add PAYMENT TRACKER TO TRACK WHAT THE CUSTOMER PAYED SO FAR. (COMPLETED)
- [x] Add COMPANY NAME NEXT TO THE TITLE OF THE PROJECT. (COMPLETED)



### Contact Detail Page (/contacts/[id])
- [x] Replace mock data for communications with real storage (COMPLETED)
- [x] Replace mock data for notes with real storage (COMPLETED)
- [x] Add tags management with backend (COMPLETED)

## 3. Backend/Integration Issues

### Immediate Fixes
- [x] Fix projectContacts.ts integration (COMPLETED)
- [x] Implement real storage for contact communications (COMPLETED)
- [x] Implement real storage for contact notes (COMPLETED)


## 4. General Features Not Implemented

### Performance Optimizations
- [x] Implement virtual scrolling for large lists (COMPLETED)
- [x] Add query result caching (COMPLETED)
- [x] Optimize bundle size with code splitting (COMPLETED)
- [x] Implement lazy loading for images (COMPLETED)


### UK Localization
- [ ] Add UK tax calculations (VAT)
- [ ] Create UK-specific invoice templates

### Advanced Features
- [ ] Real-time notifications system
- [ ] Advanced search with full-text search
- [ ] Custom fields for entities
- [ ] Reporting dashboard builder
- [ ] Mobile app (React Native)

## 5. Testing Infrastructure

### Unit Testing
- [ ] Set up Jest and React Testing Library
- [ ] Write component unit tests
- [ ] Add form validation tests
- [ ] Create utility function tests
- [ ] Add hook tests

### Integration Testing
- [ ] Set up Convex testing utilities
- [ ] Write API integration tests
- [ ] Add authentication flow tests
- [ ] Create permission tests

### E2E Testing
- [ ] Set up Playwright or Cypress
- [ ] Write user journey tests
- [ ] Add cross-browser tests
- [ ] Create mobile responsiveness tests
- [ ] Add performance tests

### Testing Documentation
- [ ] Create testing guidelines
- [ ] Document test data setup
- [ ] Add CI/CD pipeline configuration

## 7. Security Enhancements

- [x] Implement proper password hashing (replace base64) (COMPLETED - using PBKDF2 with SHA-256)
- [ ] Add rate limiting
- [ ] Implement CSRF protection
- [ ] Add security headers
- [ ] Create audit trail for sensitive operations
- [ ] Implement data encryption at rest

## Priority Recommendations

### MVP Essentials (Do First)
1. ~~Fix projectContacts.ts integration~~ (COMPLETED)
2. ~~Add project selection to task creation~~ (COMPLETED)
3. ~~Add contact selection to project creation~~ (COMPLETED)
4. ~~Replace mock data with real storage~~ (COMPLETED)

### Nice to Have (Do Later)
1. Advanced analytics and charts
2. Bulk operations
3. Import/export features
4. Dark mode
5. Mobile app

### Consider Removing
2. Custom metrics builder
4. Advanced reporting features
5. Mobile app (focus on responsive web)

---

**Note**: This list is comprehensive based on the original specification. Many items may not be necessary for an MVP. Review each section and remove items that aren't critical for your initial launch.