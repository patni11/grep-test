import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { GitHubService, GitHubRepository } from '@/lib/github'
import { 
  getUserRepositories, 
  findOrCreateRepository, 
  getRepositoryWithStats 
} from '@/lib/db/repositories'
//import { initializeDatabase } from '@/lib/db/init'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for refresh parameter
    const { searchParams } = new URL(request.url)
    const shouldRefresh = searchParams.get('refresh') === 'true'

    // First, try to get repositories from database
    const storedRepos = await getUserRepositories(session.user.id)
    
    // If we have stored repos and not forcing refresh, return cached data
    if (storedRepos.length > 0 && !shouldRefresh) {
      const reposWithStats = await Promise.all(
        storedRepos.map(async (repo) => {
          const repoWithStats = await getRepositoryWithStats(repo._id!)
          return {
            id: repo.github_repo_id,
            name: repo.repo_name,
            full_name: repo.repo_full_name,
            private: repo.is_private,
            html_url: repo.repo_url,
            description: null, // Not stored in our schema, would need to be added
            updated_at: repo.last_sync_at?.toISOString() || repo.connected_at.toISOString(),
            language: null, // Not stored in our schema, would need to be added
            stargazers_count: 0, // Not stored in our schema, would need to be added
            forks_count: 0, // Not stored in our schema, would need to be added
            isConnected: true,
            changelogCount: repoWithStats?.changelogCount || 0,
            lastSync: repo.last_sync_at,
            connectedAt: repo.connected_at,
            repoId: repo._id
          }
        })
      )

      // Get the most recent update time from stored repos
      const lastUpdated = storedRepos.reduce((latest, repo) => {
        const repoTime = repo.last_sync_at || repo.connected_at
        return !latest || repoTime > latest ? repoTime : latest
      }, null as Date | null)

      return NextResponse.json({ 
        repositories: reposWithStats,
        totalCount: reposWithStats.length,
        lastUpdated: lastUpdated?.toISOString(),
        message: 'Loaded from database'
      })
    }

    // If no stored repos or forcing refresh, fetch from GitHub
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
            })

            // Get repository with stats (changelog count)
            const repoWithStats = await getRepositoryWithStats(repoDoc._id!)

            return {
              id: gitRepo.id,
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
              changelogCount: repoWithStats?.changelogCount || 0,
              lastSync: repoDoc.last_sync_at,
              connectedAt: repoDoc.connected_at,
              repoId: repoDoc._id
            }
          } catch (error) {
            console.error(`Error processing repository ${gitRepo.full_name}:`, error)
            // Return the repository without storage status if there's an error
            return {
              id: gitRepo.id,
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
              changelogCount: 0
            }
          }
        })
      )

      return NextResponse.json({ 
        repositories: processedRepos,
        totalCount: processedRepos.length,
        lastUpdated: fetchTime.toISOString(),
        message: shouldRefresh ? 'Refreshed from GitHub' : 'Fetched from GitHub'
      })

    } catch (githubError: any) {
      console.error('GitHub API Error:', githubError)
      
      // If GitHub API fails and we have cached data, return it
      if (storedRepos.length > 0) {
        const reposWithStats = await Promise.all(
          storedRepos.map(async (repo) => {
            const repoWithStats = await getRepositoryWithStats(repo._id!)
            return {
              id: repo.github_repo_id,
              name: repo.repo_name,
              full_name: repo.repo_full_name,
              private: repo.is_private,
              html_url: repo.repo_url,
              description: null,
              updated_at: repo.last_sync_at?.toISOString() || repo.connected_at.toISOString(),
              language: null,
              stargazers_count: 0,
              forks_count: 0,
              isConnected: true,
              changelogCount: repoWithStats?.changelogCount || 0,
              lastSync: repo.last_sync_at,
              connectedAt: repo.connected_at,
              repoId: repo._id
            }
          })
        )

        // Get the most recent update time from stored repos
        const lastUpdated = storedRepos.reduce((latest, repo) => {
          const repoTime = repo.last_sync_at || repo.connected_at
          return !latest || repoTime > latest ? repoTime : latest
        }, null as Date | null)

        return NextResponse.json({ 
          repositories: reposWithStats,
          totalCount: reposWithStats.length,
          lastUpdated: lastUpdated?.toISOString(),
          warning: 'GitHub API temporarily unavailable. Showing cached repositories.',
          error: githubError.message
        })
      }

      // No cached data and GitHub API failed
      return NextResponse.json({ 
        repositories: [],
        totalCount: 0,
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