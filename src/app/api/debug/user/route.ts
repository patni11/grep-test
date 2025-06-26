import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    
    // Get NextAuth user
    const user = await db.collection('users').findOne({ _id: session.user.id as any })

    return NextResponse.json({
      session: {
        user: session.user,
        expires: session.expires
      },
      user: user ? {
        id: user._id,
        githubId: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      } : null
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 