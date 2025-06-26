import { Collection, ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { COLLECTIONS, UserDocument } from './schemas'

// Get users collection
async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const client = await clientPromise
  const db = client.db()
  return db.collection<UserDocument>(COLLECTIONS.USERS)
}

// Create a new user from GitHub data
export async function createUser(githubData: {
  id: string
  login: string
  email: string
  avatar_url: string
  access_token?: string
}): Promise<UserDocument> {
  const collection = await getUsersCollection()
  
  const now = new Date()
  const userDoc: UserDocument = {
    github_id: githubData.id,
    username: githubData.login,
    email: githubData.email,
    avatar_url: githubData.avatar_url,
    access_token: githubData.access_token, // Store if provided (should be encrypted in production)
    created_at: now,
    updated_at: now,
  }

  const result = await collection.insertOne(userDoc)
  return {
    ...userDoc,
    _id: result.insertedId.toString(),
  }
}

// Find user by GitHub ID
export async function getUserByGithubId(githubId: string): Promise<UserDocument | null> {
  const collection = await getUsersCollection()
  return await collection.findOne({ github_id: githubId })
}

// Find user by email
export async function getUserByEmail(email: string): Promise<UserDocument | null> {
  const collection = await getUsersCollection()
  return await collection.findOne({ email })
}

// Find user by MongoDB _id
export async function getUserById(userId: string): Promise<UserDocument | null> {
  const collection = await getUsersCollection()
  return await collection.findOne({ _id: userId as any })
}

// Update user information
export async function updateUser(
  userId: string, 
  updateData: Partial<Omit<UserDocument, '_id' | 'github_id' | 'created_at'>>
): Promise<UserDocument | null> {
  const collection = await getUsersCollection()
  
  const result = await collection.findOneAndUpdate(
    { _id: userId as any },
    { 
      $set: {
        ...updateData,
        updated_at: new Date(),
      }
    },
    { returnDocument: 'after' }
  )
  
  return result || null
}

// Update user by GitHub ID (useful for NextAuth callbacks)
export async function updateUserByGithubId(
  githubId: string,
  updateData: Partial<Omit<UserDocument, '_id' | 'github_id' | 'created_at'>>
): Promise<UserDocument | null> {
  const collection = await getUsersCollection()
  
  const result = await collection.findOneAndUpdate(
    { github_id: githubId },
    { 
      $set: {
        ...updateData,
        updated_at: new Date(),
      }
    },
    { returnDocument: 'after' }
  )
  
  return result || null
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

// Get user with their repositories count
export async function getUserWithStats(userId: string): Promise<UserDocument & { repositoryCount: number } | null> {
  const client = await clientPromise
  const db = client.db()
  
  const pipeline = [
    { $match: { _id: userId as any } },
    {
      $lookup: {
        from: COLLECTIONS.REPOSITORIES,
        localField: '_id',
        foreignField: 'user_id',
        as: 'repositories'
      }
    },
    {
      $addFields: {
        repositoryCount: { $size: '$repositories' }
      }
    },
    {
      $project: {
        repositories: 0 // Don't include the full repositories array
      }
    }
  ]
  
  const users = await db.collection(COLLECTIONS.USERS).aggregate(pipeline).toArray()
  return users[0] as (UserDocument & { repositoryCount: number }) || null
} 