# WellTrack - Health and Wellness Tracking Application

## Overview
WellTrack is a comprehensive health and wellness tracking application built with a modern full-stack architecture. The application provides users with tools to monitor various aspects of their health including mood, water intake, meals, sleep, exercise, stretching routines, mental health journaling, and weight tracking. It features a clean, responsive interface with real-time data visualization and progress tracking capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Router for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Next.js with hot module replacement and development optimizations

### Backend Architecture
- **Runtime**: Node.js with Next.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Development**: Development mode uses Vite middleware for seamless full-stack development

### Database & ORM
- **Database**: PostgreSQL (configured for Supabase serverless)
- **Schema Management**: Supabase for migrations and schema management
- **Connection**: @supabase/serverless for serverless PostgreSQL connections

## Key Components

### Data Models
The application tracks multiple health metrics through well-defined schemas:
- **Users**: Basic user authentication and identification
- **Mood Entries**: Daily mood tracking with emoji representation and notes
- **Water Intake**: Hydration tracking with amount and timestamps
- **Meals**: Food logging with calorie tracking and meal categorization
- **Sleep Entries**: Sleep duration and quality monitoring
- **Exercise**: Workout tracking with completion status and timers
- **Stretching**: Flexible routine management with drag-and-drop reordering
- **Journal Entries**: Mental health journaling with mood tags and ratings
- **Weight Entries**: Weight tracking with historical data and progress visualization

### UI Components
- **Responsive Sidebar Navigation**: Fixed navigation with health-themed icons
- **Interactive Tracking Widgets**: Real-time input forms for each health metric
- **Progress Visualization**: Dashboard with summary cards and progress indicators
- **Timer Functionality**: Built-in timers for exercises and breathing exercises
- **Drag-and-Drop Interface**: Reorderable stretching routines
- **Toast Notifications**: User feedback for successful actions and errors

### Database Integration
The application now uses a PostgreSQL database with Supabase for persistent data storage. All health tracking data is stored in the database with proper relationships and data integrity. The system automatically creates database tables on first run and handles migrations through Drizzle Kit.

- OAuth2 authentication flow for secure API access
- Automatic data synchronization for steps, heart rate, and activities
- Manual data entry preserved for meals, water intake, and sleep tracking
- Real-time fitness dashboard with progress visualization
- Weight data sync from Google Fit when available

### Authentication Strategy
Currently implements a mock user system with a hardcoded user ID for development purposes. The architecture is prepared for future authentication implementation with user sessions and proper authorization.

## Data Flow

### Client-Side Data Management
1. React Query manages all server state with automatic caching and background updates
2. Optimistic updates provide immediate user feedback
3. Query invalidation ensures data consistency after mutations
4. Custom hooks abstract API interactions for reusable data fetching

### API Communication
1. RESTful endpoints handle CRUD operations for each health metric
2. Centralized API request function handles authentication and error management
3. Type-safe request/response handling with TypeScript interfaces
4. Automatic JSON serialization and error boundary handling

### Real-Time Features
- Breathing exercise timer with phase-based guidance
- Exercise timers with start/pause/reset functionality
- Live progress tracking with immediate visual feedback
- Session-based data persistence for uninterrupted user experience

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React, React DOM, React Query for frontend framework
- **Routing**: App Router for lightweight client-side routing
- **Forms**: React Hook Form with Zod resolvers for type-safe form validation
- **UI Primitives**: Extensive Radix UI component library for accessible components

### Database & Backend
- **Database**: Supabase for scalable and secure data storage serverless PostgreSQL 
- **Server**: Next.js (Supabase) with middleware for JSON parsing and CORS
- **Validation**: Zod for runtime type checking and schema validation
- **Session Management**: Connect-pg-simple for PostgreSQL-based session storage

### Development Tools
- **Build System**: Next.js with React plugin and TypeScript support
- **Styling**: Tailwind CSS with PostCSS for processing
- **Development**: TSX for TypeScript execution, ESBuild for production builds
- **Code Quality**: TypeScript strict mode with comprehensive type checking

### UI Enhancement Libraries
- **Icons**: Lucide React for consistent iconography
- **Styling Utilities**: class-variance-authority and clsx for conditional styling
- **Date Handling**: date-fns for date manipulation and formatting
- **Carousel**: Embla Carousel for interactive component carousels

## Deployment Strategy

### Development Environment
- **Local Development**: next dev server with hot module replacement
- **API Integration**: Next js server runs alongside Next in development mode
- **Database**: Local or cloud PostgreSQL instance with environment-based configuration
- **Environment Variables**: DATABASE_URL and other configuration through .env.local files

### Production Build Process
1. **Frontend Build**: Vite compiles React application to static assets
2. **Backend Build**: ESBuild bundles server code for Node.js execution
3. **Database Migration**: Supabase handles schema deployment & migrations
4. **Asset Serving**: Next.js serves built React application in production mode

### Production Deployment
- **Server Deployment**: Next.js server serves both API and static frontend
- **Database**: Serverless PostgreSQL (Supabase) for scalable data storage
- **Static Assets**: Optimized and minified frontend bundle
- **Session Storage**: PostgreSQL-based session persistence for user state


# File Tree: wellness-app

Generated on: 9/6/2025, 11:55:59 AM
Root path: `c:\Users\karan\OneDrive\Desktop\wellness-app`

```
├── 📁 .git/ 🚫 (auto-hidden)
├── 📁 .next/ 🚫 (auto-hidden)
├── 📁 .vscode/ 🚫 (auto-hidden)
├── 📁 app/
│   ├── 📁 auth/
│   │   ├── 📁 forgot-password/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 login/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 reset-password/
│   │   │   └── 📄 page.tsx
│   │   └── 📁 signup/
│   │       └── 📄 page.tsx
│   ├── 📁 breathing/
│   │   └── 📄 page.tsx
│   ├── 📁 dashboard/
│   │   ├── 📁 breathing/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 fitness/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 journal/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 meals/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 mood/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 sleep/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 stretching/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 water/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 weight/
│   │   │   └── 📄 page.tsx
│   │   ├── 📄 layout.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 fitness/
│   │   └── 📄 page.tsx
│   ├── 📁 journal/
│   │   └── 📄 page.tsx
│   ├── 📁 meals/
│   │   └── 📄 page.tsx
│   ├── 📁 mood/
│   │   └── 📄 page.tsx
│   ├── 📁 privacy/
│   │   └── 📄 page.tsx
│   ├── 📁 sleep/
│   │   └── 📄 page.tsx
│   ├── 📁 stretching/
│   │   └── 📄 page.tsx
│   ├── 📁 terms/
│   │   └── 📄 page.tsx
│   ├── 📁 water/
│   │   └── 📄 page.tsx
│   ├── 📁 weight/
│   │   └── 📄 page.tsx
│   ├── 🎨 globals.css
│   ├── 📄 layout.tsx
│   └── 📄 page.tsx
├── 📁 components/
│   ├── 📁 auth/
│   │   ├── 📄 auth-layout.tsx
│   │   ├── 📄 auth-provider.tsx
│   │   ├── 📄 forgot-password-form.tsx
│   │   ├── 📄 login-form.tsx
│   │   ├── 📄 protected-route.tsx
│   │   ├── 📄 reset-password-form.tsx
│   │   └── 📄 signup-form.tsx
│   ├── 📁 ui/
│   │   ├── 📄 accordion.tsx
│   │   ├── 📄 alert-dialog.tsx
│   │   ├── 📄 alert.tsx
│   │   ├── 📄 aspect-ratio.tsx
│   │   ├── 📄 avatar.tsx
│   │   ├── 📄 badge.tsx
│   │   ├── 📄 breadcrumb.tsx
│   │   ├── 📄 button.tsx
│   │   ├── 📄 calendar.tsx
│   │   ├── 📄 card.tsx
│   │   ├── 📄 carousel.tsx
│   │   ├── 📄 chart.tsx
│   │   ├── 📄 checkbox.tsx
│   │   ├── 📄 collapsible.tsx
│   │   ├── 📄 command.tsx
│   │   ├── 📄 context-menu.tsx
│   │   ├── 📄 dialog.tsx
│   │   ├── 📄 drawer.tsx
│   │   ├── 📄 dropdown-menu.tsx
│   │   ├── 📄 form.tsx
│   │   ├── 📄 hover-card.tsx
│   │   ├── 📄 input-otp.tsx
│   │   ├── 📄 input.tsx
│   │   ├── 📄 label.tsx
│   │   ├── 📄 menubar.tsx
│   │   ├── 📄 navigation-menu.tsx
│   │   ├── 📄 pagination.tsx
│   │   ├── 📄 popover.tsx
│   │   ├── 📄 progress.tsx
│   │   ├── 📄 resizable.tsx
│   │   ├── 📄 scroll-area.tsx
│   │   ├── 📄 select.tsx
│   │   ├── 📄 separator.tsx
│   │   ├── 📄 sheet.tsx
│   │   ├── 📄 sidebar.tsx
│   │   ├── 📄 skeleton.tsx
│   │   ├── 📄 slider.tsx
│   │   ├── 📄 sonner.tsx
│   │   ├── 📄 table.tsx
│   │   ├── 📄 tabs.tsx
│   │   ├── 📄 textarea.tsx
│   │   ├── 📄 toggle-group.tsx
│   │   ├── 📄 toggle.tsx
│   │   └── 📄 tooltip.tsx
│   ├── 📄 app-sidebar.tsx
│   ├── 📄 breathing-exercise.tsx
│   ├── 📄 dashboard-header.tsx
│   ├── 📄 dashboard-shell.tsx
│   ├── 📄 fitness-tracker.tsx
│   ├── 📄 health-dashboard.tsx
│   ├── 📄 meal-tracker.tsx
│   ├── 📄 mental-health-journal.tsx
│   ├── 📄 mode-toggle.tsx
│   ├── 📄 mood-tracker.tsx
│   ├── 📄 nav-main.tsx
│   ├── 📄 nav-projects.tsx
│   ├── 📄 nav-user.tsx
│   ├── 📄 seesion-cleanup-provider.tsx
│   ├── 📄 sleep-tracker.tsx
│   ├── 📄 stretch-sequence.tsx
│   ├── 📄 team-switcher.tsx
│   ├── 📄 theme-provider.tsx
│   ├── 📄 water-tracker.tsx
│   └── 📄 weight-tracker.tsx
├── 📁 hooks/
│   └── 📄 use-mobile.ts
├── 📁 lib/
│   ├── 📄 auth-debug.ts
│   ├── 📄 auth-errors.ts
│   ├── 📄 auth-server.ts
│   ├── 📄 auth.ts
│   ├── 📄 middleware.ts
│   ├── 📄 supabase.ts
│   ├── 📄 utils.ts
│   └── 📄 validation.ts
├── 📁 node_modules/ 🚫 (auto-hidden)
├── 📁 public/
│   └── 📁 images/
│       ├── 🖼️ child-pose.jpg
│       ├── 🖼️ forward-fold.jpg
│       ├── 🖼️ neck-stretch.jpg
│       ├── 🖼️ seated-forward-bend.jpg
│       ├── 🖼️ seated-twist.jpg
│       ├── 🖼️ shoulder-stretch.jpg
│       ├── 🖼️ supine-twist.jpg
│       └── 🖼️ wrist-stretch.jpg
├── 📁 supabase/
│   ├── 📁 .branches/
│   │   └── 📄 _current_branch
│   ├── 📁 .temp/
│   │   ├── 📄 cli-latest
│   │   ├── 📄 gotrue-version
│   │   ├── 📄 pooler-url
│   │   ├── 📄 postgres-version
│   │   ├── 📄 project-ref
│   │   ├── 📄 rest-version
│   │   └── 📄 storage-version
│   ├── 📁 migrations/
│   │   ├── 🗄️ 20250821180511_user_remote_schema.sql
│   │   ├── 🗄️ 20250821180916_remote_schema.sql
│   │   └── 🗄️ 20250821181307_remote_schema.sql
│   ├── 🚫 .gitignore
│   └── ⚙️ config.toml
├── 🔒 .env 🚫 (auto-hidden)
├── 📄 .env.development 🚫 (auto-hidden)
├── 📄 .env.example 🚫 (auto-hidden)
├── 📄 .env.local 🚫 (auto-hidden)
├── 📄 .env.production 🚫 (auto-hidden)
├── 🚫 .gitignore
├── 📄 .hintrc
├── 📖 README.md
├── 📄 components.json
├── 📄 eslint.config.mjs
├── 📄 next-env.d.ts 🚫 (auto-hidden)
├── 📄 next.config.ts
├── 📄 package-lock.json
├── 📄 package.json
├── 📄 postcss.config.mjs
└── 📄 tsconfig.json
```
