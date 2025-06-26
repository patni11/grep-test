import { NextResponse } from 'next/server'

export interface APIError {
  message: string
  status?: number
  details?: string
}

export function handleGitHubError(error: any): NextResponse {
  console.error('GitHub API Error:', error)
  
  if (error.status === 404) {
    return NextResponse.json({ 
      error: 'Repository not found or access denied' 
    }, { status: 404 })
  } else if (error.status === 403) {
    return NextResponse.json({ 
      error: 'GitHub API access denied. Please check your permissions.' 
    }, { status: 403 })
  } else if (error.status === 409) {
    return NextResponse.json({ 
      error: 'Repository is empty or has no commits' 
    }, { status: 409 })
  } else {
    return NextResponse.json({ 
      error: 'GitHub API error',
      details: error.message
    }, { status: 500 })
  }
}

export function handleAPIError(error: unknown, context = 'API operation'): NextResponse {
  console.error(`Error in ${context}:`, error)
  
  return NextResponse.json({ 
    error: 'Internal server error',
    details: error instanceof Error ? error.message : 'Unknown error'
  }, { status: 500 })
}

export function createErrorResponse(message: string, status = 400, details?: string): NextResponse {
  return NextResponse.json({ 
    error: message,
    ...(details && { details })
  }, { status })
} 