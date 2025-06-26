import clientPromise from '@/lib/mongodb'
import { initializeCollections } from './schemas'

/**
 * Initialize the MongoDB database with proper collections and indexes
 * This should be called once when setting up the application
 */
export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing MongoDB database...')
    
    const client = await clientPromise
    const db = client.db()
    
    // Initialize collections with proper indexing
    await initializeCollections(db)
    
    console.log('✅ Database initialized successfully')
    console.log('📊 Collections created:')
    console.log('  - users (with github_id, email, username indexes)')
    console.log('  - repositories (with user_id, github_repo_id, repo_full_name indexes)')
    console.log('  - changelogs (with repo_id, public_slug, version indexes)')
    console.log('  - commits (with repo_id, commit_hash, processed indexes)')
    
    return true
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    return false
  }
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