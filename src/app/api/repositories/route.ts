import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For GitHub OAuth, we need to get the access token from the account
    // We'll need to store this in the session callback or fetch it from the database
    // For now, let's use a mock response and we'll update this to use the actual token
    
    // Mock data for now - replace with actual GitHub API call
    const mockRepositories = [
      {
        id: 1,
        name: 'my-awesome-app',
        full_name: `${session.user.name}/my-awesome-app`,
        private: false,
        html_url: 'https://github.com/user/my-awesome-app',
        description: 'An awesome application',
        updated_at: '2024-01-15T10:30:00Z',
        language: 'TypeScript',
        stargazers_count: 15,
        forks_count: 3
      },
      {
        id: 2,
        name: 'another-project',
        full_name: `${session.user.name}/another-project`,
        private: true,
        html_url: 'https://github.com/user/another-project',
        description: 'Another great project',
        updated_at: '2024-01-10T15:45:00Z',
        language: 'JavaScript',
        stargazers_count: 8,
        forks_count: 1
      }
    ]

    return NextResponse.json({ repositories: mockRepositories })
  } catch (error) {
    console.error('Error fetching repositories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 