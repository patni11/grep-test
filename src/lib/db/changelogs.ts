import { Collection, ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { COLLECTIONS, ChangelogDocument, CommitDocument } from './schemas'
import { generateChangelogWithAI, ChangelogGenerationData } from '@/lib/openai'

export interface CreateChangelogData {
  repo_id: string
  title: string
  version?: string
  content: string
  commit_hashes: string[]
  from_commit?: string
  to_commit: string
  is_published?: boolean
}

export interface GenerateChangelogFromCommits {
  commits: Array<{
    sha: string
    message: string
    author_name: string
    author_email: string
    committed_at: string
  }>
  repoName: string
  repoFullName: string
  repoUrl?: string
  isPrivate?: boolean
}

// Generate changelog content from commits using AI
export async function generateChangelogContent(data: GenerateChangelogFromCommits): Promise<{
  title: string
  content: string
  version: string
}> {
  const changelogData: ChangelogGenerationData = {
    commits: data.commits,
    repoName: data.repoName,
    repoFullName: data.repoFullName,
    repoUrl: data.repoUrl,
    isPrivate: data.isPrivate
  }
  
  return await generateChangelogWithAI(changelogData)
}

// Get changelogs collection
async function getChangelogsCollection(): Promise<Collection<ChangelogDocument>> {
  const client = await clientPromise
  const db = client.db()
  return db.collection<ChangelogDocument>(COLLECTIONS.CHANGELOGS)
}

// Get commits collection
async function getCommitsCollection(): Promise<Collection<CommitDocument>> {
  const client = await clientPromise
  const db = client.db()
  return db.collection<CommitDocument>(COLLECTIONS.COMMITS)
}

export async function createChangelog(data: CreateChangelogData): Promise<ChangelogDocument> {
  const collection = await getChangelogsCollection()
  
  // Generate a unique public slug
  const baseSlug = data.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  let publicSlug = baseSlug
  let counter = 1
  
  // Ensure slug uniqueness
  while (await collection.findOne({ public_slug: publicSlug })) {
    publicSlug = `${baseSlug}-${counter}`
    counter++
  }
  
  const changelog: ChangelogDocument = {
    repo_id: data.repo_id,
    title: data.title,
    version: data.version,
    content: data.content,
    commit_hashes: data.commit_hashes,
    public_slug: publicSlug,
    from_commit: data.from_commit,
    to_commit: data.to_commit,
    is_published: data.is_published || false,
    created_at: new Date(),
    updated_at: new Date()
  }
  
  const result = await collection.insertOne(changelog)
  
  return {
    ...changelog,
    _id: result.insertedId.toString()
  }
}

export async function getChangelogsByRepository(repoId: string): Promise<ChangelogDocument[]> {
  const collection = await getChangelogsCollection()
  
  const changelogs = await collection
    .find({ repo_id: repoId })
    .sort({ created_at: -1 })
    .toArray()
  
  return changelogs.map((changelog: any) => ({
    ...changelog,
    _id: changelog._id?.toString()
  }))
}

export async function getChangelogById(id: string): Promise<ChangelogDocument | null> {
  const collection = await getChangelogsCollection()
  
  const changelog = await collection.findOne({ _id: id as any })
  
  if (!changelog) return null
  
  return {
    ...changelog,
    _id: changelog._id?.toString()
  }
}

export async function getChangelogBySlug(slug: string): Promise<ChangelogDocument | null> {
  const collection = await getChangelogsCollection()
  
  const changelog = await collection.findOne({ public_slug: slug })
  
  if (!changelog) return null
  
  return {
    ...changelog,
    _id: changelog._id?.toString()
  }
}

export async function updateChangelog(id: string, updates: Partial<ChangelogDocument>): Promise<boolean> {
  const collection = await getChangelogsCollection()
  
  const result = await collection.updateOne(
    { _id: id as any },
    { 
      $set: {
        ...updates,
        updated_at: new Date()
      }
    }
  )
  
  return result.modifiedCount > 0
}

export async function publishChangelog(id: string): Promise<boolean> {
  return updateChangelog(id, { is_published: true })
}

export async function unpublishChangelog(id: string): Promise<boolean> {
  return updateChangelog(id, { is_published: false })
}

export async function deleteChangelog(id: string): Promise<boolean> {
  const collection = await getChangelogsCollection()
  
  const result = await collection.deleteOne({ _id: id as any })
  
  return result.deletedCount > 0
}

// Store commits for future changelog generation
export async function storeCommits(repoId: string, commits: Array<{
  sha: string
  message: string
  author_name: string
  author_email: string
  committed_at: string
}>): Promise<void> {
  const collection = await getCommitsCollection()
  
  const commitDocs: CommitDocument[] = commits.map(commit => ({
    repo_id: repoId,
    commit_hash: commit.sha,
    commit_message: commit.message,
    author_name: commit.author_name,
    author_email: commit.author_email,
    committed_at: new Date(commit.committed_at),
    created_at: new Date(),
    processed: false
  }))
  
  // Use upsert to avoid duplicates
  for (const commitDoc of commitDocs) {
    await collection.updateOne(
      { commit_hash: commitDoc.commit_hash },
      { $setOnInsert: commitDoc },
      { upsert: true }
    )
  }
} 