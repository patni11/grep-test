import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getRepositoryById } from '@/lib/db/repositories'
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

    // Get repository from database
    const repository = await getRepositoryById(repoId)
    if (!repository) {
        console.log("Repository not found api/repos/id/changelogs")
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Verify repository belongs to user
    if (repository.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get changelogs for this repository
    const changelogs = await getChangelogsByRepository(repoId)

    return NextResponse.json({
      success: true,
      repository: {
        id: repository._id,
        name: repository.repo_name,
        full_name: repository.repo_full_name
      },
      changelogs: changelogs.map(changelog => ({
        id: changelog._id,
        title: changelog.title,
        version: changelog.version,
        content: changelog.content,
        commit_count: changelog.commit_hashes?.length || 0,
        public_slug: changelog.public_slug,
        is_published: changelog.is_published,
        created_at: changelog.created_at,
        updated_at: changelog.updated_at
      })),
      total_count: changelogs.length
    })

  } catch (error) {
    console.error('Error fetching changelogs:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 