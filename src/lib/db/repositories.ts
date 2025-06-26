import { Collection, ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { COLLECTIONS, RepositoryDocument } from './schemas'

// Get repositories collection
async function getRepositoriesCollection(): Promise<Collection<RepositoryDocument>> {
  const client = await clientPromise
  const db = client.db()
  return db.collection<RepositoryDocument>(COLLECTIONS.REPOSITORIES)
}

// Create a new repository
export async function createRepository(repositoryData: {
  user_id: string
  repo_name: string
  repo_full_name: string
  repo_url: string
  github_repo_id: number
  default_branch: string
  is_private: boolean
  github_updated_at?: Date
  description?: string | null
  language?: string | null
  stargazers_count?: number
  forks_count?: number
}): Promise<RepositoryDocument> {
  const collection = await getRepositoriesCollection()
  
  const now = new Date()
  const repoDoc: RepositoryDocument = {
    ...repositoryData,
    connected_at: now,
    has_changelogs: false,
  }

  const result = await collection.insertOne(repoDoc)
  return {
    ...repoDoc,
    _id: result.insertedId.toString(),
  }
}

// Find repository by GitHub repo ID
export async function getRepositoryByGithubId(githubRepoId: number): Promise<RepositoryDocument | null> {
  const collection = await getRepositoriesCollection()
  return await collection.findOne({ github_repo_id: githubRepoId })
}

// Find repository by ID
export async function getRepositoryById(repoId: string): Promise<RepositoryDocument | null> {
  const collection = await getRepositoriesCollection()
  return await collection.findOne({ _id: new ObjectId(repoId) as any })
}

// Find repository by slug (repo_full_name or repo_name)
export async function getRepositoryBySlug(slug: string): Promise<RepositoryDocument | null> {
  const collection = await getRepositoriesCollection()
  
  // Try to find by repo_full_name first (e.g., "owner/repo")
  let repo = await collection.findOne({ public_slug: slug })
  
  return repo
}

// Get all repositories for a user
export async function getUserRepositories(userId: string): Promise<RepositoryDocument[]> {
  const collection = await getRepositoriesCollection()
  return await collection.find({ user_id: userId }).sort({ connected_at: -1 }).toArray()
}

// Update repository information
export async function updateRepository(
  repoId: string,
  updateData: Partial<Omit<RepositoryDocument, '_id' | 'user_id' | 'connected_at'>>
): Promise<RepositoryDocument | null> {
  const collection = await getRepositoriesCollection()
  
  const result = await collection.findOneAndUpdate(
    { _id: repoId as any },
    { $set: updateData },
    { returnDocument: 'after' }
  )
  
  return result || null
}

// Update repository sync timestamp
export async function updateRepositorySync(repoId: string): Promise<RepositoryDocument | null> {
  const collection = await getRepositoriesCollection()
  
  const result = await collection.findOneAndUpdate(
    { _id: repoId as any },
    { $set: { last_sync_at: new Date() } },
    { returnDocument: 'after' }
  )
  
  return result || null
}

// Find or create repository (upsert operation)
export async function findOrCreateRepository(repositoryData: {
  user_id: string
  repo_name: string
  repo_full_name: string
  repo_url: string
  github_repo_id: number
  default_branch: string
  is_private: boolean
  github_updated_at?: Date
  description?: string | null
  language?: string | null
  stargazers_count?: number
  forks_count?: number
}): Promise<RepositoryDocument> {
  const collection = await getRepositoriesCollection()
  
  // Try to find existing repository
  let repo = await getRepositoryByGithubId(repositoryData.github_repo_id)
  
  if (repo) {
    // Update existing repository with latest data
    
    const updatedRepo = await updateRepository(repo._id!, {
      repo_name: repositoryData.repo_name,
      repo_full_name: repositoryData.repo_full_name,
      repo_url: repositoryData.repo_url,
      default_branch: repositoryData.default_branch,
      is_private: repositoryData.is_private,
      github_updated_at: repositoryData.github_updated_at,
      description: repositoryData.description,
      language: repositoryData.language,
      stargazers_count: repositoryData.stargazers_count,
      forks_count: repositoryData.forks_count,
    })
    return updatedRepo!
  } else {
    // Create new repository
    return await createRepository(repositoryData)
  }
}

// Delete repository
export async function deleteRepository(repoId: string): Promise<boolean> {
  const collection = await getRepositoriesCollection()
  const result = await collection.deleteOne({ _id: repoId as any })
  return result.deletedCount > 0
}

// Get repository with changelog count
export async function getRepositoryWithStats(repoId: string): Promise<RepositoryDocument & { changelogCount: number } | null> {
  const client = await clientPromise
  const db = client.db()
  
  const pipeline = [
    { $match: { _id: repoId as any } },
    {
      $lookup: {
        from: COLLECTIONS.CHANGELOGS,
        localField: '_id',
        foreignField: 'repo_id',
        as: 'changelogs'
      }
    },
    {
      $addFields: {
        changelogCount: { $size: '$changelogs' }
      }
    },
    {
      $project: {
        changelogs: 0 // Don't include the full changelogs array
      }
    }
  ]
  
  const repos = await db.collection(COLLECTIONS.REPOSITORIES).aggregate(pipeline).toArray()
  return repos[0] as (RepositoryDocument & { changelogCount: number }) || null
}

// Check if user has access to repository
export async function checkUserRepositoryAccess(
  userId: string, 
  repoId: string, 
  repoFullName: string
): Promise<RepositoryDocument | null> {
  const collection = await getRepositoriesCollection()
  console.log("repoId", repoId)
  console.log("repoFullName", repoFullName)
  console.log("userId", userId)
  
  // Check if repository exists, belongs to user, and matches the full name
  return await collection.findOne({ 
    _id: new ObjectId(repoId) as any,
    user_id: userId,
    repo_full_name: repoFullName
  })
}

// Get paginated repositories for a user with sorting
export async function getUserRepositoriesPaginated(
  userId: string, 
  page: number = 1, 
  limit: number = 10
): Promise<{
  repositories: (RepositoryDocument & { changelogCount: number })[]
  totalCount: number
  hasMore: boolean
}> {
  const client = await clientPromise
  const db = client.db()
  
  const skip = (page - 1) * limit
  
  // Aggregation pipeline to get repositories with changelog count and proper sorting
  const pipeline = [
    { $match: { user_id: userId } },
    {
      $lookup: {
        from: COLLECTIONS.CHANGELOGS,
        localField: '_id',
        foreignField: 'repo_id',
        as: 'changelogs'
      }
    },
    {
      $addFields: {
        changelogCount: { $size: '$changelogs' },
        sortKey: {
          $cond: {
            if: { $gt: [{ $size: '$changelogs' }, 0] },
            then: {
              // For repositories with changelogs, sort by latest changelog creation date
              $max: '$changelogs.created_at'
            },
            else: {
              // For repositories without changelogs, sort by GitHub update date
              $ifNull: ['$github_updated_at', '$connected_at']
            }
          }
        }
      }
    },
    {
      $sort: {
        changelogCount: -1, // Repositories with changelogs first
        sortKey: -1 // Then by most recent activity
      }
    },
    {
      $project: {
        changelogs: 0 // Don't include the full changelogs array
      }
    }
  ]
  
  // Get total count
  const totalPipeline = [...pipeline, { $count: 'total' }]
  const totalResult = await db.collection(COLLECTIONS.REPOSITORIES).aggregate(totalPipeline).toArray()
  const totalCount = totalResult[0]?.total || 0
  
  // Get paginated results
  const paginatedPipeline = [...pipeline, { $skip: skip }, { $limit: limit }]
  const repositories = await db.collection(COLLECTIONS.REPOSITORIES).aggregate(paginatedPipeline).toArray()
  
  return {
    repositories: repositories as (RepositoryDocument & { changelogCount: number })[],
    totalCount,
    hasMore: totalCount > (skip + limit)
  }
}

// Update repository changelog status
export async function updateRepositoryChangelogStatus(repoId: string, hasChangelogs: boolean): Promise<void> {
  const collection = await getRepositoriesCollection()
  await collection.updateOne(
    { _id: new ObjectId(repoId) as any },
    { $set: { has_changelogs: hasChangelogs } }
  )
} 