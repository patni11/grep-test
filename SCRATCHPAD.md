# Implementation Plan: GitHub API Integration + MongoDB Setup

I USE THIS TO TELL AI HOW TO DO SPECIFIC TASKS PROPERLY

## Current State Analysis
- ✅ NextAuth with GitHub OAuth working
- ✅ MongoDB adapter configured for sessions
- ✅ Mock repository data in `/api/repositories`
- ✅ UI components ready for real data
- ❌ No GitHub API integration
- ❌ No user/repository/changelog data persistence

## Step 1: GitHub API Integration

### 1.1 Update NextAuth Configuration
```typescript
// Need to store GitHub access token in session
// Update callbacks in auth/[...nextauth]/route.ts
```
- Add `account` parameter to session callback
- Store `access_token` from GitHub OAuth response
- Add proper scopes for repo access (`repo`, `user:email`)

### 1.2 Create GitHub API Service
```typescript
// src/lib/github.ts
class GitHubService {
  async getRepositories(accessToken: string)
  async getCommits(accessToken: string, owner: string, repo: string)
}
```

### 1.3 Update Repository API Endpoint
- Replace mock data with real GitHub API calls
- Handle pagination for repositories
- Error handling for rate limits
- Cache repository data in MongoDB

## Step 2: MongoDB Database Schema Design

### 2.1 Collections Structure
```
Users Collection:
{
  _id: ObjectId,
  githubId: string,
  username: string,
  email: string,
  avatarUrl: string,
  accessToken: string (encrypted),
  createdAt: Date,
  updatedAt: Date
}

Repositories Collection:
{
  _id: ObjectId,
  userId: ObjectId,
  githubId: number,
  name: string,
  fullName: string,
  private: boolean,
  description: string,
  language: string,
  defaultBranch: string,
  isConnected: boolean,
  webhookId: string?,
  lastSyncAt: Date?,
  createdAt: Date,
  updatedAt: Date
}

Changelogs Collection:
{
  _id: ObjectId,
  repositoryId: ObjectId,
  version: string,
  title: string,
  content: string,
  fromCommit: string,
  toCommit: string,
  status: 'draft' | 'published',
  generatedAt: Date,
  publishedAt: Date?,
  createdAt: Date,
  updatedAt: Date
}

Commits Collection: (for changelog generation)
{
  _id: ObjectId,
  repositoryId: ObjectId,
  sha: string,
  message: string,
  author: string,
  date: Date,
  processed: boolean,
  createdAt: Date
}
```

### 2.2 Database Models/Schemas
```typescript
// src/models/User.ts
// src/models/Repository.ts  
// src/models/Changelog.ts
// src/models/Commit.ts
```

## Step 3: Database Operations Layer

### 3.1 User Operations
```typescript
// src/lib/db/users.ts
- createUser(githubData)
- getUserByGithubId(githubId)
- getUserWithRepositories(userId)
```

### 3.2 Repository Operations
```typescript
// src/lib/db/repositories.ts
- getConnectedRepositories(userId)
- updateRepositoryData(repoId, data)
```

### 3.3 Changelog Operations
```typescript
// src/lib/db/changelogs.ts
- createChangelog(repositoryId, data)
- getChangelogsByRepository(repositoryId)
- updateChangelog(changelogId, data)
- publishChangelog(changelogId)
```

## Step 4: API Endpoints Implementation

### 4.1 Update Existing Endpoints
```typescript
// /api/repositories - Replace mock with real data
- Get user from session
- Fetch from MongoDB with connection status
- Sync with GitHub if needed
- Return formatted data
```

### 4.2 New API Endpoints
```typescript
// /api/repositories/[id]/connect
// /api/repositories/[id]/disconnect  
// /api/repositories/[id]/changelogs
// /api/repositories/[id]/changelogs/generate
```

## Step 5: Data Synchronization Strategy

### 5.1 Initial User Setup
1. User signs in with GitHub OAuth
2. Create/update user record in MongoDB
3. Fetch all repositories from GitHub
4. Store repositories in MongoDB with `isConnected: false`
5. Display in UI with connection options

### 5.2 Repository Connection Flow
1. User clicks "Connect" on repository
2. Set `isConnected: true` in database
3. Set up GitHub webhook for that repository
4. Start tracking commits for changelog generation
5. Update UI to show connected state

### 5.3 Ongoing Synchronization
```typescript
// Background jobs or webhook handlers
- Webhook: Push events -> Store commits
- Webhook: Release events -> Auto-generate changelog
- Cron job: Sync repository metadata daily
- Cron job: Cleanup old commits
```

## Step 6: Frontend Updates

### 6.1 Update RepositoriesList Component
- Remove mock data logic
- Add real loading states for GitHub API calls
- Handle connection/disconnection UI updates
- Add sync button for manual refresh

### 6.2 Error Handling
- GitHub API rate limiting
- Network failures
- Database connection issues
- OAuth token expiration

## Step 7: Security Considerations

### 7.1 Token Management
- Encrypt GitHub access tokens in database
- Implement token refresh logic
- Handle token expiration gracefully

### 7.2 Webhook Security
- Verify GitHub webhook signatures
- Rate limiting for webhook endpoints
- Validate payload structure

## Step 8: Implementation Order

1. **Phase 1**: GitHub API integration
   - Update NextAuth to store access token
   - Create GitHub service
   - Update repository API endpoint

2. **Phase 2**: Basic MongoDB setup
   - Create user and repository models
   - Implement basic CRUD operations
   - User creation on first login

3. **Phase 3**: Repository management
   - Repository sync from GitHub
   - Connection/disconnection functionality
   - Update UI with real data

4. **Phase 4**: Changelog foundation
   - Changelog data model
   - Basic changelog CRUD
   - UI for viewing changelogs

5. **Phase 5**: Advanced features
   - Webhook integration
   - Automated changelog generation
   - Background synchronization

## Testing Strategy
- Unit tests for database operations
- Integration tests for GitHub API calls
- E2E tests for user flows
- Mock GitHub API for development

## Environment Variables Needed
```
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=
MONGODB_URI=
WEBHOOK_SECRET=
ENCRYPTION_KEY= (for access tokens)
```
