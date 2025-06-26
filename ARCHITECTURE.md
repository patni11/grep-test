# Application Architecture

I USE THIS TO TELL AI THE OVERALL ARCHITECTURE

## Overview
This is a Next.js application called "Delta" that provides automated changelog generation for GitHub repositories. Users authenticate with GitHub OAuth, connect their repositories, and can generate AI-powered changelogs from their commit history. The application provides both a management dashboard and public changelog viewing capabilities.

## Technology Stack
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Authentication**: NextAuth.js v4 with GitHub OAuth provider
- **Database**: MongoDB with native MongoDB driver (no ORM)
- **AI**: OpenAI GPT for intelligent changelog generation
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with black and white minimalist theme
- **Fonts**: Geist Sans and Geist Mono

## Core Features

### 1. GitHub OAuth Authentication
- Users sign in with GitHub OAuth to access repository data
- Scopes requested: `read:user user:email repo` for full repository access
- Access tokens are stored securely for GitHub API calls
- JWT-based session management (no database sessions)

### 2. Repository Management
- **Discovery**: Fetches all user repositories from GitHub API
- **Connection**: Users can connect repositories to enable changelog generation
- **Caching**: Repository data cached in MongoDB with sync tracking
- **Status Tracking**: Connected vs non-connected repository states
- **Pagination**: Supports paginated repository listing with load more functionality

### 3. AI-Powered Changelog Generation
- **Commit Analysis**: Fetches latest commits from GitHub API
- **Pattern Recognition**: Categorizes commits (features, fixes, improvements, etc.)
- **Content Generation**: Uses OpenAI GPT to create human-readable changelogs
- **Versioning**: Auto-generates semantic versions based on dates
- **Publishing**: Changelogs are immediately published with public URLs

### 4. Public Changelog Viewing
- **Public URLs**: Each changelog has a unique slug for public sharing
- **Markdown Rendering**: Custom markdown parser for consistent formatting
- **Responsive Design**: Mobile-friendly changelog display
- **SEO Optimization**: Proper metadata for search engines

## Application Structure

### Frontend Architecture

#### Pages (`src/app/`)
- **`page.tsx`** - Main dashboard
  - **Unauthenticated**: Sign-in interface with hero section and GitHub OAuth
  - **Authenticated**: Welcome message with repositories list
- **`layout.tsx`** - Root layout with session provider and conditional sidebar

#### Components (`src/components/`)

**Layout Components:**
- **`ConditionalSidebarLayout.tsx`** - Authentication-aware sidebar container
- **`app-sidebar.tsx`** - Navigation sidebar with user profile and logout
- **`SessionProvider.tsx`** - NextAuth session context wrapper

**Feature Components:**
- **`RepositoriesList.tsx`** - Complex repository management interface
  - Pagination with load more functionality
  - Real-time status tracking (connecting, generating)
  - Repository actions (connect, generate, view changelogs)
  - Loading states and error handling
  - Refresh capability with GitHub API sync
- **`ChangelogActions.tsx`** - Changelog sharing and export actions

**UI Components (`src/components/ui/`):**
- Complete shadcn/ui component library
- Consistent black border, white background theme
- Custom styling for accessibility and brand consistency

### Backend Architecture

#### API Routes (`src/app/api/`)

**Authentication:**
- **`auth/[...nextauth]/route.ts`** - NextAuth configuration
  - GitHub OAuth provider setup
  - Custom session and JWT callbacks
  - User data synchronization with MongoDB

**Repository Management:**
- **`repositories/route.ts`** - Primary repository API
  - GET: Fetch repositories with pagination and caching
  - POST: Connect new repositories
  - Supports both cached and live GitHub API data
  - Intelligent sorting (changelogs first, then by activity)
- **`repositories/connect/route.ts`** - Repository connection endpoint
- **`repositories/[id]/changelogs/route.ts`** - Repository-specific changelog operations

**Changelog Operations:**
- **`repositories/changelogs/generate/route.ts`** - AI changelog generation
  - Fetches commits from GitHub API
  - Stores commits for historical reference
  - Generates changelog using OpenAI
  - Creates public changelog with unique slug

**Webhooks:**
- **`webhooks/github/route.ts`** - GitHub webhook handler (placeholder for future implementation)

### Database Layer (`src/lib/db/`)

#### Collections and Schemas (`schemas.ts`)
- **Users**: GitHub profile data with access tokens
- **Repositories**: Connected repository metadata with sync tracking
- **Changelogs**: Generated changelog content with public slugs
- **Commits**: Historical commit data for reference
- **Proper indexing** for performance optimization

#### Database Operations
- **`users.ts`** - User CRUD operations and GitHub profile sync
- **`repositories.ts`** - Repository management with changelog statistics
- **`changelogs.ts`** - Changelog CRUD with AI content generation
- **`mongodb.ts`** - Connection management with development/production optimizations

### External Integrations

#### GitHub API (`src/lib/github.ts`)
- **GitHubService class** for authenticated API calls
- **Repository fetching** with metadata (stars, forks, language, etc.)
- **Commit history retrieval** with author information
- **Pagination handling** for large repository lists
- **Error handling** with proper status codes

#### OpenAI Integration (`src/lib/openai.ts`)
- **Advanced AI prompting** for changelog generation
- **Commit pattern analysis** (features, fixes, improvements, etc.)
- **Monthly commit grouping** for better organization
- **Fallback content generation** when AI is unavailable
- **Repository context awareness** (sparse vs active repos)

## Data Flow

### Authentication Flow
1. User clicks GitHub sign-in → NextAuth GitHub provider
2. OAuth redirect to GitHub → User authorization
3. GitHub returns with access token → NextAuth stores in JWT
4. Custom callbacks sync user data to MongoDB
5. Session includes user profile and GitHub access token

### Repository Discovery Flow
1. Authenticated user requests repositories
2. Check MongoDB cache for existing data
3. If cache miss or refresh requested → GitHub API call
4. Store/update repository metadata in MongoDB
5. Return paginated results with connection status

### Changelog Generation Flow
1. User clicks generate for connected repository
2. Verify user access to repository
3. Fetch recent commits from GitHub API (last 20)
4. Store commits in MongoDB for historical reference
5. Analyze commits for patterns and categorization
6. Generate changelog content using OpenAI
7. Create changelog record with unique public slug
8. Update repository to mark as having changelogs

### Public Changelog Access
1. Public URL accessed with changelog slug
2. Database lookup for published changelog
3. Custom markdown parsing and rendering
4. Responsive display with sharing capabilities

## Security Considerations

### Authentication & Authorization
- **GitHub OAuth scopes**: Minimal required permissions (`read:user user:email repo`)
- **Access token storage**: Encrypted in MongoDB with proper session management
- **API protection**: All sensitive endpoints require authentication
- **Repository access**: Verified ownership before operations

### Data Protection
- **Environment variables**: Secure credential storage
- **MongoDB connection**: Proper connection pooling and error handling
- **Public URLs**: Only published changelogs accessible via slugs
- **User isolation**: All operations scoped to authenticated user
