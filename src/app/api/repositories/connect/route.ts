import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { GitHubService } from '@/lib/github'
import { findOrCreateRepository, updateRepositorySync } from '@/lib/db/repositories'
import { initializeDatabase } from '@/lib/db/init'

export async function POST(request: NextRequest) {
  try {
    // Initialize database on first access
    //await initializeDatabase()
    
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

    try {
      let gitRepo

      if (repoFullName) {
        const [owner, repo] = repoFullName.split('/')
        if (!owner || !repo) {
          return NextResponse.json({ error: 'Invalid repository format' }, { status: 400 })
        }
        gitRepo = await githubService.getRepository(owner, repo)
      } else {
        // If only repoId provided, we need to fetch all repos and find the matching one
        const allRepos = await githubService.getAllRepositories()
        const foundRepo = allRepos.find(repo => repo.id === repoId)
        if (!foundRepo) {
            console.log("repository not found api/repos/connect")
          return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
        }
        gitRepo = foundRepo
      }

      // Store or update repository in database
      const repoDoc = await findOrCreateRepository({
        user_id: session.user.id,
        repo_name: gitRepo.name,
        repo_full_name: gitRepo.full_name,
        repo_url: gitRepo.html_url,
        github_repo_id: gitRepo.id,
        default_branch: gitRepo.default_branch,
        is_private: gitRepo.private,
      })

      // Update sync timestamp
      await updateRepositorySync(repoDoc._id!)

      // TODO: Set up GitHub webhook for this repository
      // This would involve creating a webhook that points to /api/webhooks/github
      // and subscribes to push events to automatically generate changelogs

      return NextResponse.json({ 
        success: true,
        message: 'Repository connected successfully',
        repository: {
          id: repoDoc._id,
          name: repoDoc.repo_name,
          full_name: repoDoc.repo_full_name,
          connected_at: repoDoc.connected_at,
          last_sync_at: repoDoc.last_sync_at
        }
      })

    } catch (githubError: any) {
      console.error('GitHub API Error:', githubError)
      
      if (githubError.status === 404) {
        return NextResponse.json({ 
          error: 'Repository not found or you do not have access to it' 
        }, { status: 404 })
      } else if (githubError.status === 403) {
        return NextResponse.json({ 
          error: 'Access denied. Please check your GitHub permissions.' 
        }, { status: 403 })
      } else {
        return NextResponse.json({ 
          error: 'Failed to access GitHub repository',
          details: githubError.message
        }, { status: 500 })
      }
    }

  } catch (error) {
    console.error('Error connecting repository:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 