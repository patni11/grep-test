import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { GitHubService, GitHubRepository } from '@/lib/github'
import { 
  findOrCreateRepository, 
  getRepositoryWithStats,
  getUserRepositoriesPaginated 
} from '@/lib/db/repositories'
//import { initializeDatabase } from '@/lib/db/init'

export async function GET(request: NextRequest) {
  try {
    //await initializeDatabase()
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for refresh parameter
    const { searchParams } = new URL(request.url)
    const shouldRefresh = searchParams.get('refresh') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // First, try to get repositories from database with pagination
    if (!shouldRefresh) {
      try {
        const paginatedResult = await getUserRepositoriesPaginated(session.user.id, page, limit)
        
        if (paginatedResult.repositories.length > 0) {
          const repositoriesForUI = paginatedResult.repositories.map((repo) => ({
            id: repo._id,
            github_repo_id: repo.github_repo_id,
            name: repo.repo_name,
            full_name: repo.repo_full_name,
            private: repo.is_private,
            html_url: repo.repo_url,
            description: repo.description,
            updated_at: repo.github_updated_at?.toISOString(),
            language: repo.language,
            stargazers_count: repo.stargazers_count || 0,
            forks_count: repo.forks_count || 0,
            isConnected: true,
            hasChangelogs: repo.hasChangelogs,
            latestChangelogSlug: repo.latestChangelogSlug,
            lastSync: repo.last_sync_at,
            connectedAt: repo.connected_at,
          }))

          // Get the most recent update time from stored repos
          const lastUpdated = paginatedResult.repositories.reduce((latest, repo) => {
            const repoTime = repo.last_sync_at || repo.connected_at
            return !latest || repoTime > latest ? repoTime : latest
          }, null as Date | null)

          return NextResponse.json({ 
            repositories: repositoriesForUI,
            totalCount: paginatedResult.totalCount,
            hasMore: paginatedResult.hasMore,
            currentPage: page,
            lastUpdated: lastUpdated?.toISOString(),
            message: 'Loaded from database'
          })
        }
      } catch (dbError) {
        console.error('Database error, falling back to GitHub API:', dbError)
        // Fall through to GitHub API fetch
      }
    }

    // If no stored repos, forcing refresh, or database error, fetch from GitHub
    if (!session.accessToken) {
      return NextResponse.json({ 
        error: 'GitHub access token not found. Please reconnect your GitHub account.' 
      }, { status: 400 })
    }

    const githubService = new GitHubService(session.accessToken)

    try {
      // Fetch repositories from GitHub API
      const githubRepos = await githubService.getAllRepositories()
      const fetchTime = new Date()
      
      // Process and store repositories in our database
      const processedRepos = await Promise.all(
        githubRepos.map(async (gitRepo: GitHubRepository) => {
          try {
            // Store or update repository in our database
            const repoDoc = await findOrCreateRepository({
              user_id: session.user.id,
              repo_name: gitRepo.name,
              repo_full_name: gitRepo.full_name,
              repo_url: gitRepo.html_url,
              github_repo_id: gitRepo.id,
              default_branch: gitRepo.default_branch,
              is_private: gitRepo.private,
              github_updated_at: new Date(gitRepo.updated_at),
              description: gitRepo.description,
              language: gitRepo.language,
              stargazers_count: gitRepo.stargazers_count,
              forks_count: gitRepo.forks_count,
            })

            // Get repository with stats (changelog count)
            const repoWithStats = await getRepositoryWithStats(repoDoc._id!)

            return {
              id: repoDoc._id,
              github_repo_id: gitRepo.id,
              name: gitRepo.name,
              full_name: gitRepo.full_name,
              private: gitRepo.private,
              html_url: gitRepo.html_url,
              description: gitRepo.description,
              updated_at: gitRepo.updated_at,
              language: gitRepo.language,
              stargazers_count: gitRepo.stargazers_count,
              forks_count: gitRepo.forks_count,
              // Additional fields for UI
              isConnected: true, // Since we're storing it, it's connected
              hasChangelogs: repoWithStats?.hasChangelogs || false,
              latestChangelogSlug: repoWithStats?.latestChangelogSlug,
              lastSync: repoDoc.last_sync_at,
              connectedAt: repoDoc.connected_at
            }
          } catch (error) {
            console.error(`Error processing repository ${gitRepo.full_name}:`, error)
            // Return the repository without storage status if there's an error
            return {
              id: '', // No database ID since it failed to store
              github_repo_id: gitRepo.id,
              name: gitRepo.name,
              full_name: gitRepo.full_name,
              private: gitRepo.private,
              html_url: gitRepo.html_url,
              description: gitRepo.description,
              updated_at: gitRepo.updated_at,
              language: gitRepo.language,
              stargazers_count: gitRepo.stargazers_count,
              forks_count: gitRepo.forks_count,
              isConnected: false,
              hasChangelogs: false
            }
          }
        })
      )

      // Sort repositories: with changelogs first, then by most recent activity
      const sortedRepos = processedRepos.sort((a, b) => {
        // First sort by changelog existence (hasChangelogs = true first)
        if (a.hasChangelogs !== b.hasChangelogs) {
          return b.hasChangelogs ? 1 : -1
        }
        
        // Then sort by most recent activity
        const aDate = new Date(a.updated_at)
        const bDate = new Date(b.updated_at)
        return bDate.getTime() - aDate.getTime()
      })

      // Apply pagination to sorted results
      const startIndex = (page - 1) * limit
      const paginatedRepos = sortedRepos.slice(startIndex, startIndex + limit)
      const hasMore = sortedRepos.length > startIndex + limit

      return NextResponse.json({ 
        repositories: paginatedRepos,
        totalCount: sortedRepos.length,
        hasMore,
        currentPage: page,
        lastUpdated: fetchTime.toISOString(),
        message: shouldRefresh ? 'Refreshed from GitHub' : 'Fetched from GitHub'
      })

    } catch (githubError: any) {
      console.error('GitHub API Error:', githubError)
      
      // If GitHub API fails and we have cached data, return it with pagination
      try {
        const paginatedResult = await getUserRepositoriesPaginated(session.user.id, page, limit)
        
        if (paginatedResult.repositories.length > 0) {
          const repositoriesForUI = paginatedResult.repositories.map((repo) => ({
            id: repo._id,
            github_repo_id: repo.github_repo_id,
            name: repo.repo_name,
            full_name: repo.repo_full_name,
            private: repo.is_private,
            html_url: repo.repo_url,
            description: repo.description,
            updated_at: repo.github_updated_at?.toISOString(),// || repo.github_pushed_at?.toISOString() || repo.connected_at.toISOString(),
            language: repo.language,
            stargazers_count: repo.stargazers_count || 0,
            forks_count: repo.forks_count || 0,
            isConnected: true,
            hasChangelogs: repo.hasChangelogs,
            latestChangelogSlug: repo.latestChangelogSlug,
            lastSync: repo.last_sync_at,
            connectedAt: repo.connected_at
          }))

          // Get the most recent update time from stored repos
          const lastUpdated = paginatedResult.repositories.reduce((latest, repo) => {
            const repoTime = repo.last_sync_at || repo.connected_at
            return !latest || repoTime > latest ? repoTime : latest
          }, null as Date | null)

          return NextResponse.json({ 
            repositories: repositoriesForUI,
            totalCount: paginatedResult.totalCount,
            hasMore: paginatedResult.hasMore,
            currentPage: page,
            lastUpdated: lastUpdated?.toISOString(),
            warning: 'GitHub API temporarily unavailable. Showing cached repositories.',
            error: githubError.message
          })
        }
      } catch (dbError) {
        console.error('Database error during fallback:', dbError)
      }

      // No cached data and GitHub API failed
      return NextResponse.json({ 
        repositories: [],
        totalCount: 0,
        hasMore: false,
        currentPage: page,
        error: 'GitHub API unavailable and no cached repositories found',
        details: githubError.message
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Error in repositories API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// New endpoint to connect a specific repository
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { repoId, repoFullName } = await request.json()

    if (!repoId && !repoFullName) {
      return NextResponse.json({ 
        error: 'Either repoId or repoFullName is required' 
      }, { status: 400 })
    }

    const githubService = new GitHubService(session.accessToken)

    let gitRepo: GitHubRepository

    if (repoFullName) {
      const [owner, repo] = repoFullName.split('/')
      gitRepo = await githubService.getRepository(owner, repo)
    } else {
      // If only repoId provided, we need to fetch all repos and find the matching one
      const allRepos = await githubService.getAllRepositories()
      const foundRepo = allRepos.find(repo => repo.id === repoId)
      if (!foundRepo) {
        console.log("Repository not found api/repos")
        return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
      }
      gitRepo = foundRepo
    }

    // Store repository in database
    const repoDoc = await findOrCreateRepository({
      user_id: session.user.id,
      repo_name: gitRepo.name,
      repo_full_name: gitRepo.full_name,
      repo_url: gitRepo.html_url,
      github_repo_id: gitRepo.id,
      default_branch: gitRepo.default_branch,
      is_private: gitRepo.private,
    })

    return NextResponse.json({ 
      success: true,
      repository: repoDoc
    })

  } catch (error) {
    console.error('Error connecting repository:', error)
    return NextResponse.json({ 
      error: 'Failed to connect repository',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 