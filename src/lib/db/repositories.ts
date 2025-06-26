import { Collection } from 'mongodb'
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
}): Promise<RepositoryDocument> {
  const collection = await getRepositoriesCollection()
  
  const now = new Date()
  const repoDoc: RepositoryDocument = {
    ...repositoryData,
    connected_at: now,
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
  return await collection.findOne({ _id: repoId as any })
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