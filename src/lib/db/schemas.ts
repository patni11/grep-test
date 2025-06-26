import { Db } from 'mongodb'

// MongoDB Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  REPOSITORIES: 'repositories', 
  CHANGELOGS: 'changelogs',
  COMMITS: 'commits'
} as const

// MongoDB Schema Interfaces (matching your entities.ts but with _id for MongoDB)
export interface UserDocument {
  _id?: string
  github_id: string
  username: string
  email: string
  avatar_url: string
  access_token?: string // Optional - will be encrypted if stored
  created_at: Date
  updated_at: Date
}

export interface RepositoryDocument {
  _id?: string
  user_id: string
  repo_name: string
  repo_full_name: string
  repo_url: string
  github_repo_id: number
  default_branch: string
  is_private: boolean
  connected_at: Date
  last_sync_at?: Date
  webhook_id?: string
  // New fields for better sorting and filtering
  github_updated_at?: Date
  description?: string | null
  language?: string | null
  stargazers_count?: number
  forks_count?: number
  has_changelogs?: boolean
}

export interface ChangelogDocument {
  _id?: string
  repo_id: string
  title: string
  version?: string
  content: string
  commit_hashes: string[]
  public_slug: string
  from_commit?: string
  to_commit: string
  is_published: boolean
  created_at: Date
  updated_at: Date
}

export interface CommitDocument {
  _id?: string
  repo_id: string
  commit_hash: string
  commit_message: string
  author_name: string
  author_email: string
  committed_at: Date
  created_at: Date
  processed?: boolean
}

// Initialize database collections with proper indexing
export async function initializeCollections(db: Db) {
  // Users collection
  const usersCollection = db.collection(COLLECTIONS.USERS)
  await usersCollection.createIndex({ github_id: 1 }, { unique: true })
  await usersCollection.createIndex({ email: 1 }, { unique: true })
  await usersCollection.createIndex({ username: 1 })

  // Repositories collection
  const reposCollection = db.collection(COLLECTIONS.REPOSITORIES)
  await reposCollection.createIndex({ user_id: 1 })
  await reposCollection.createIndex({ github_repo_id: 1 }, { unique: true })
  await reposCollection.createIndex({ repo_full_name: 1 })
  await reposCollection.createIndex({ user_id: 1, repo_name: 1 })

  // Changelogs collection
  const changelogsCollection = db.collection(COLLECTIONS.CHANGELOGS)
  await changelogsCollection.createIndex({ repo_id: 1 })
  await changelogsCollection.createIndex({ public_slug: 1 }, { unique: true })
  await changelogsCollection.createIndex({ repo_id: 1, version: 1 })
  await changelogsCollection.createIndex({ created_at: -1 })

  // Commits collection
  const commitsCollection = db.collection(COLLECTIONS.COMMITS)
  await commitsCollection.createIndex({ repo_id: 1 })
  await commitsCollection.createIndex({ commit_hash: 1 }, { unique: true })
  await commitsCollection.createIndex({ repo_id: 1, committed_at: -1 })
  await commitsCollection.createIndex({ processed: 1 })
} 