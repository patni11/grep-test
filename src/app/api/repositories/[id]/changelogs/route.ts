import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getChangelogsByRepository } from '@/lib/db/changelogs'


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repoId = params.id

    if (!repoId) {
      return NextResponse.json({ 
        error: 'Repository ID is required' 
      }, { status: 400 })
    }

    // Check if user has access to this repository
    // First get the repository to check access
    const { getRepositoryById } = await import('@/lib/db/repositories')
    const repository = await getRepositoryById(repoId)
    
    if (!repository || repository.user_id !== session.user.id) {
      return NextResponse.json({ 
        error: 'Repository not found or access denied' 
      }, { status: 404 })
    }

    // Get changelogs for this repository
    const changelogs = await getChangelogsByRepository(repoId)

    return NextResponse.json({
      success: true,
      changelogs: changelogs.map(changelog => ({
        id: changelog._id,
        title: changelog.title,
        version: changelog.version,
        content: changelog.content,
        public_slug: changelog.public_slug,
        is_published: changelog.is_published,
        created_at: changelog.created_at,
        updated_at: changelog.updated_at,
        commit_count: changelog.commit_hashes.length
      })),
      total: changelogs.length,
      repository: {
        id: repository._id,
        name: repository.repo_name,
        full_name: repository.repo_full_name
      }
    })

  } catch (error) {
    console.error('Error fetching changelogs:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 