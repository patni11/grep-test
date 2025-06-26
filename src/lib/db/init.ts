import clientPromise from '@/lib/mongodb'
import { initializeCollections } from './schemas'

let initialized = false

/**
 * Initialize the MongoDB database with proper collections and indexes
 * This should be called once when setting up the application
 */
export async function initializeDatabase() {
  if (initialized) {
    return
  }

  try {
    const client = await clientPromise
    const db = client.db()
    
    console.log('Initializing database collections and indexes...')
    await initializeCollections(db)
    
    initialized = true
    console.log('Database initialization completed successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

// Auto-initialize on import in development
if (process.env.NODE_ENV === 'development') {
  initializeDatabase().catch(console.error)
}

/**
 * Check database connection and collections status
 */
export async function checkDatabaseHealth() {
  try {
    const client = await clientPromise
    const db = client.db()
    
    // Check if collections exist
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    const requiredCollections = ['users', 'repositories', 'changelogs', 'commits']
    const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name))
    
    if (missingCollections.length > 0) {
      console.warn('⚠️  Missing collections:', missingCollections)
      return {
        healthy: false,
        missingCollections,
        availableCollections: collectionNames
      }
    }
    
    console.log('✅ Database health check passed')
    return {
      healthy: true,
      missingCollections: [],
      availableCollections: collectionNames
    }
  } catch (error) {
    console.error('❌ Database health check failed:', error)
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      missingCollections: [],
      availableCollections: []
    }
  }
} 