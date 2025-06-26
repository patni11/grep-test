import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Helper function to verify GitHub webhook signature
function verifySignature(body: string, signature: string, secret: string): boolean {
  if (!signature || !signature.startsWith('sha256=')) {
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex')

  const actualSignature = signature.slice(7) // Remove 'sha256=' prefix

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(actualSignature, 'hex')
  )
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const body = await request.text()
    
    // Get GitHub signature from headers
    const signature = request.headers.get('x-hub-signature-256')
    const event = request.headers.get('x-github-event')
    const delivery = request.headers.get('x-github-delivery')

    // Verify webhook secret
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('GITHUB_WEBHOOK_SECRET environment variable not set')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify the signature
    if (!signature || !verifySignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse the JSON payload
    const payload = JSON.parse(body)

    console.log(`Received GitHub webhook: ${event} (delivery: ${delivery})`)

    // Handle different webhook events
    switch (event) {
      case 'push':
        await handlePushEvent(payload)
        break
      
      case 'pull_request':
        await handlePullRequestEvent(payload)
        break
      
      case 'issues':
        await handleIssuesEvent(payload)
        break
      
      case 'repository':
        await handleRepositoryEvent(payload)
        break
      
      case 'ping':
        console.log('Received ping from GitHub webhook')
        break
      
      default:
        console.log(`Unhandled webhook event: ${event}`)
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })

  } catch (error) {
    console.error('Error processing GitHub webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Event handlers
async function handlePushEvent(payload: any) {
  console.log(`Push to ${payload.repository.full_name}:`)
  console.log(`- Branch: ${payload.ref}`)
  console.log(`- Commits: ${payload.commits.length}`)
  console.log(`- Pusher: ${payload.pusher.name}`)
  
  // Add your push event logic here
  // e.g., trigger CI/CD, update database, send notifications
}

async function handlePullRequestEvent(payload: any) {
  const action = payload.action
  const pr = payload.pull_request
  
  console.log(`Pull request ${action}:`)
  console.log(`- Repository: ${payload.repository.full_name}`)
  console.log(`- PR #${pr.number}: ${pr.title}`)
  console.log(`- Author: ${pr.user.login}`)
  console.log(`- State: ${pr.state}`)
  
  // Add your pull request logic here
  // e.g., run tests, update project management tools, send notifications
}

async function handleIssuesEvent(payload: any) {
  const action = payload.action
  const issue = payload.issue
  
  console.log(`Issue ${action}:`)
  console.log(`- Repository: ${payload.repository.full_name}`)
  console.log(`- Issue #${issue.number}: ${issue.title}`)
  console.log(`- Author: ${issue.user.login}`)
  console.log(`- State: ${issue.state}`)
  
  // Add your issues logic here
  // e.g., create tasks, send notifications, update project management
}

async function handleRepositoryEvent(payload: any) {
  const action = payload.action
  const repository = payload.repository
  
  console.log(`Repository ${action}:`)
  console.log(`- Repository: ${repository.full_name}`)
  console.log(`- Description: ${repository.description}`)
  
  // Add your repository event logic here
  // e.g., sync repository data, update databases
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for webhooks.' },
    { status: 405 }
  )
} 