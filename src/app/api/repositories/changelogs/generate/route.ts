import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { GitHubService, GitHubCommit } from '@/lib/github'
import { checkUserRepositoryAccess, updateRepositoryChangelogStatus } from '@/lib/db/repositories'
import { 
  createChangelog, 
  generateChangelogContent, 
  storeCommits 
} from '@/lib/db/changelogs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get repository data from request body
    const { repoId, repoFullName } = await request.json()

    if (!repoId || !repoFullName) {
      return NextResponse.json({ 
        error: 'Repository ID and full name are required' 
      }, { status: 400 })
    }

    // Check if user has access to this repository
    const repository = await checkUserRepositoryAccess(session.user.id, repoId, repoFullName)
    //console.log("repository", repository)
    
    if (!repository) {
      return NextResponse.json({ 
        error: 'Repository not found or access denied' 
      }, { status: 404 })
    }

    const githubService = new GitHubService(session.accessToken)
    const [owner, repo] = repository.repo_full_name.split('/')

    try {
      // Fetch latest commits from GitHub
      //console.log(`Fetching commits for ${repository.repo_full_name}...`)
      const githubCommits: GitHubCommit[] = await githubService.getLatestCommits(owner, repo, 20)

      if (githubCommits.length === 0) {
        return NextResponse.json({ 
          error: 'No commits found in repository' 
        }, { status: 404 })
      }

      // Transform GitHub commits to our format
      const commitData = githubCommits.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author_name: commit.commit.author.name,
        author_email: commit.commit.author.email,
        committed_at: commit.commit.author.date
      }))

      // Store commits in our database for future reference
      await storeCommits(repoId, commitData)

      // Generate changelog content using AI
      const { title, content, version } = await generateChangelogContent({
        commits: commitData,
        repoName: repository.repo_name,
        repoFullName: repository.repo_full_name,
        repoUrl: repository.repo_url,
        isPrivate: repository.is_private
      })

      // Create changelog in database
      const changelog = await createChangelog({
        repo_id: repoId,
        title,
        version,
        content,
        commit_hashes: commitData.map(c => c.sha),
        from_commit: githubCommits[githubCommits.length - 1]?.sha, // Oldest commit in the range
        to_commit: githubCommits[0]?.sha, // Latest commit
        is_published: true // Automatically publish for immediate public access
      })

      // Update repository to mark it as having changelogs
      await updateRepositoryChangelogStatus(repoId, true)

      return NextResponse.json({
        success: true,
        changelog: {
          id: changelog._id,
          title: changelog.title,
          version: changelog.version,
          content: changelog.content,
          commit_count: commitData.length,
          public_slug: changelog.public_slug,
          is_published: changelog.is_published,
          created_at: changelog.created_at,
          repo_id: repoId
        },
        message: `Generated changelog from ${commitData.length} commits`
      })

    } catch (githubError: any) {
      console.error('GitHub API Error:', githubError)
      
      if (githubError.status === 404) {
        return NextResponse.json({ 
          error: 'Repository not found on GitHub or access denied' 
        }, { status: 404 })
      } else if (githubError.status === 403) {
        return NextResponse.json({ 
          error: 'GitHub API access denied. Please check your permissions.' 
        }, { status: 403 })
      } else if (githubError.status === 409) {
        return NextResponse.json({ 
          error: 'Repository is empty or has no commits' 
        }, { status: 409 })
      } else {
        return NextResponse.json({ 
          error: 'Failed to fetch commits from GitHub',
          details: githubError.message
        }, { status: 500 })
      }
    }

  } catch (error) {
    console.error('Error generating changelog:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 