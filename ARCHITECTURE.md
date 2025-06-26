# Application Architecture

## Overview
This is a Next.js application that provides changelog management for GitHub repositories. Users authenticate with GitHub OAuth and can view/manage their repositories and changelogs.

## Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Authentication**: NextAuth.js with GitHub OAuth
- **Database**: MongoDB with MongoDB Adapter
- **UI**: shadcn/ui components with Tailwind CSS
- **Design**: Black and white minimalist theme

## Authentication Flow
1. Users sign in with GitHub OAuth via NextAuth.js
2. Session data includes user profile (name, email, avatar)
3. Authentication state determines UI visibility (sidebar, features)
4. Unauthenticated users see only sign-in interface

## App Structure

### Pages (`src/app/`)
- **`page.tsx`** - Main dashboard page
  - Shows sign-in form for unauthenticated users
  - Shows welcome message + repositories list for authenticated users
- **`layout.tsx`** - Root layout with session provider and conditional sidebar
- **`auth/error/page.tsx`** - Authentication error page

### API Routes (`src/app/api/`)
- **`auth/[...nextauth]/route.ts`** - NextAuth configuration
  - GitHub OAuth provider setup
  - MongoDB adapter for session storage
  - Session and JWT callbacks
- **`repositories/route.ts`** - GitHub repositories endpoint
  - Fetches user's repositories (currently mock data)
  - Authentication required
- **`webhooks/github/route.ts`** - GitHub webhook handler (placeholder)

### Components (`src/components/`)

#### Layout Components
- **`ConditionalSidebarLayout.tsx`** - Wrapper that shows/hides sidebar based on auth
- **`app-sidebar.tsx`** - Main sidebar with navigation and user profile
- **`SessionProvider.tsx`** - NextAuth session provider wrapper

#### Feature Components
- **`RepositoriesList.tsx`** - Displays user's GitHub repositories
  - Shows connection status (connected/not connected)
  - Action buttons (View, Generate, Connect)
  - Loading and error states

#### UI Components (`src/components/ui/`)
- **shadcn/ui components**: Button, Card, Sidebar, Avatar, Badge, etc.
- **Consistent styling**: Black borders, white backgrounds, black text

### Utilities (`src/lib/`)
- **`mongodb.ts`** - MongoDB connection setup
- **`utils.ts`** - Utility functions (cn for className merging)

### Types (`src/types/`)
- **`next-auth.d.ts`** - NextAuth type extensions

## Key Features

### Conditional UI Based on Authentication
- **Unauthenticated**: Clean sign-in interface, no sidebar
- **Authenticated**: Full dashboard with sidebar, repositories, profile

### Sidebar Navigation
- **Top**: Home navigation button
- **Bottom**: User profile section with logout functionality
- **Collapsible**: Can be toggled with hamburger menu
- **Authentication-gated**: Only visible when user is signed in

### Repository Management
- **List View**: Shows user's GitHub repositories in cards
- **Status Tracking**: Connected vs not connected repositories
- **Actions**: View changelogs, generate new changelogs, connect repositories
- **Mock Data**: Currently uses placeholder data, ready for GitHub API integration

### Design System
- **Theme**: Strict black and white color scheme
- **Components**: shadcn/ui for consistency
- **Responsive**: Mobile-friendly layout
- **Accessibility**: Proper contrast and semantic HTML

## Data Flow

1. **Authentication**: GitHub OAuth → NextAuth → MongoDB session storage
2. **Repository Data**: API call → `/api/repositories` → Mock/GitHub API → Component state
3. **UI State**: Session status → Conditional rendering → Sidebar visibility
4. **User Actions**: Button clicks → Event handlers → API calls → State updates

## Future Integration Points

### GitHub API Integration
- Replace mock repository data with real GitHub API calls
- Use OAuth access token for authenticated requests
- Implement webhook handling for real-time updates

### Changelog Management
- Database schema for storing changelog data
- CRUD operations for changelog entries
- AI-powered changelog generation from commit history

### Repository Connection
- Database tracking of connected repositories
- Repository-specific settings and configurations
- Webhook setup for automated changelog triggers

## Security Considerations
- **Session Management**: Secure session storage in MongoDB
- **API Protection**: Authentication required for sensitive endpoints
- **Environment Variables**: Secure storage of OAuth credentials and secrets
- **CORS**: Proper API route protection
