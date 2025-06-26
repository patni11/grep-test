import { Collection } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { COLLECTIONS, UserDocument } from './schemas'

// Get users collection
async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const client = await clientPromise
  const db = client.db()
  return db.collection<UserDocument>(COLLECTIONS.USERS)
}

// Find user by GitHub ID
export async function getUserByGithubId(githubId: string): Promise<UserDocument | null> {
  const collection = await getUsersCollection()
  return await collection.findOne({ github_id: githubId })
}

// Find or create user (upsert operation)
export async function findOrCreateUser(githubData: {
  id: string
  login: string
  email: string
  avatar_url: string
  access_token?: string
}): Promise<UserDocument> {
  const collection = await getUsersCollection()

  const now = new Date()

  const result = await collection.findOneAndUpdate(
    { github_id: githubData.id },
    {
      $set: {
        username: githubData.login,
        email: githubData.email,
        avatar_url: githubData.avatar_url,
        access_token: githubData.access_token,
        updated_at: now,
      },
      $setOnInsert: {
        github_id: githubData.id,
        created_at: now,
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
    }
  )

  // Mongo driver typings differ between versions – if `value` exists, use it.
  const user = (result as any)?.value ?? (result as any)

  // Ensure _id is a string for consistency with createUser helper
  if (user && user._id && typeof user._id !== 'string') {
    user._id = user._id.toString()
  }

  return user as UserDocument
}
