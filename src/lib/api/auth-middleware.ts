import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export interface AuthenticatedSession {
  user: { id: string }
  accessToken: string
}

export async function withAuth<T extends Record<string, any>>(
  handler: (request: NextRequest, session: AuthenticatedSession, params?: T) => Promise<NextResponse>,
  requiresGitHubToken = true
) {
  return async (request: NextRequest, context?: { params: T }) => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (requiresGitHubToken && !session.accessToken) {
        return NextResponse.json({ 
          error: 'GitHub access token not found. Please reconnect your GitHub account.' 
        }, { status: 401 })
      }

      return await handler(request, session as AuthenticatedSession, context?.params)
    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
  }
} 