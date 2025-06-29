import { notFound } from 'next/navigation'
import { getChangelogBySlug } from '@/lib/db/changelogs'
import { getRepositoryById } from '@/lib/db/repositories'
import { ChangelogActions } from '@/components/ChangelogActions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, GitCommit, Eye } from 'lucide-react'

interface ChangelogPageProps {
  params: Promise<{
    slug: string
  }>
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  })
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

// Enhanced function to parse inline markdown formatting
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let currentIndex = 0
  let key = 0

  // Regular expressions for different inline formatting
  const patterns = [
    // Bold text **text**
    { regex: /\*\*(.*?)\*\*/g, component: (text: string, url?: string) => <strong key={key++} className="font-semibold">{text}</strong> },
    // Italic text *text*
    { regex: /\*(.*?)\*/g, component: (text: string, url?: string) => <em key={key++} className="italic">{text}</em> },
    // Code text `text`
    { regex: /`(.*?)`/g, component: (text: string, url?: string) => <code key={key++} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">{text}</code> },
    // Links [text](url)
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, component: (text: string, url?: string) => <a key={key++} href={url!} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{text}</a> }
  ]

  // Find all matches and their positions
  const matches: Array<{ start: number; end: number; replacement: React.ReactNode }> = []
  
  patterns.forEach(pattern => {
    let match
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
    
    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0]
      const capturedText = match[1]
      const url = match[2] // For links
      
      matches.push({
        start: match.index,
        end: match.index + fullMatch.length,
        replacement: url ? pattern.component(capturedText, url) : pattern.component(capturedText)
      })
    }
  })

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start)

  // Build the result array with formatted and unformatted parts
  matches.forEach(match => {
    // Add text before this match
    if (currentIndex < match.start) {
      const beforeText = text.slice(currentIndex, match.start)
      if (beforeText) {
        parts.push(beforeText)
      }
    }
    
    // Add the formatted replacement
    parts.push(match.replacement)
    currentIndex = match.end
  })

  // Add remaining text after all matches
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex)
    if (remainingText) {
      parts.push(remainingText)
    }
  }

  // If no matches found, return the original text
  if (matches.length === 0) {
    return [text]
  }

  return parts
}

// Simple markdown parser for our changelog content
function parseMarkdown(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactElement[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.startsWith('# ')) {
      const headerText = line.substring(2)
      elements.push(
        <h1 key={key++} className="text-3xl font-bold text-black mb-6 pb-3 border-b border-gray-200">
          {parseInlineMarkdown(headerText)}
        </h1>
      )
    } else if (line.startsWith('## 📅 ')) {
      const headerText = line.substring(3)
      elements.push(
        <div key={key++} className="mt-12 mb-6">
          <Card className="border-l-4 border-l-black bg-gray-50/50">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-black m-0 flex items-center">
                {parseInlineMarkdown(headerText)}
              </h2>
            </CardContent>
          </Card>
        </div>
      )
    } else if (line.startsWith('### ')) {
      const headerText = line.substring(4)
      elements.push(
        <h3 key={key++} className="text-xl font-semibold text-black mt-8 mb-4 flex items-center">
          {parseInlineMarkdown(headerText)}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      const headerText = line.substring(3)
      elements.push(
        <h2 key={key++} className="text-2xl font-bold text-black mt-10 mb-4">
          {parseInlineMarkdown(headerText)}
        </h2>
      )
    } else if (line.startsWith('- **') && line.includes('**')) {
      const match = line.match(/^- \*\*(.*?)\*\* \*(.*?)\*$/)
      if (match) {
        elements.push(
          <div key={key++} className="flex items-start space-x-3 mb-3">
            <div className="w-1.5 h-1.5 bg-black rounded-full mt-2.5 flex-shrink-0"></div>
            <div className="flex-1">
              <span className="text-black font-semibold">{match[1]}</span>
              <span className="text-gray-600 text-sm ml-2">({match[2]})</span>
            </div>
          </div>
        )
      }
    } else if (line.startsWith('- ')) {
      const listText = line.substring(2)
      elements.push(
        <div key={key++} className="flex items-start space-x-3 mb-3">
          <div className="w-1.5 h-1.5 bg-black rounded-full mt-2.5 flex-shrink-0"></div>
          <div className="flex-1 text-gray-700">{parseInlineMarkdown(listText)}</div>
        </div>
      )
    } else if (line.startsWith('*') && line.endsWith('*') && !line.includes('**')) {
      const italicText = line.substring(1, line.length - 1)
      elements.push(
        <p key={key++} className="text-gray-600 text-sm italic mb-4">
          {parseInlineMarkdown(italicText)}
        </p>
      )
    } else if (line.startsWith('**') && line.endsWith('**')) {
      const boldText = line.substring(2, line.length - 2)
      elements.push(
        <p key={key++} className="text-black font-semibold mb-4">
          {parseInlineMarkdown(boldText)}
        </p>
      )
    } else if (line === '---') {
      elements.push(
        <hr key={key++} className="my-8 border-gray-200" />
      )
    } else if (line.trim() && !line.startsWith('#')) {
      elements.push(
        <p key={key++} className="text-gray-700 leading-relaxed mb-4">
          {parseInlineMarkdown(line)}
        </p>
      )
    }
  }

  return elements
}

export default async function ChangelogPage({ params }: ChangelogPageProps) {
  const { slug } = await params
  const changelog = await getChangelogBySlug(slug)
  
  if (!changelog || !changelog.is_published) {
    notFound()
  }

  const repository = await getRepositoryById(changelog.repo_id)
  
  if (!repository) {
    notFound()
  }

  const markdownElements = parseMarkdown(changelog.content)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <GitCommit className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{changelog.title}</h1>
                <p className="text-gray-300 mt-1">
                  {repository.repo_full_name}
                </p>
              </div>
            </div>
            <ChangelogActions 
              title={changelog.title} 
              content={changelog.content}
            />
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Changelog Details (1/4) */}
          <div className="lg:w-1/4 w-full flex-shrink-0">
            <div className="lg:sticky lg:top-8">
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-black mb-6">Changelog Details</h2>
                  
                  {/* Version */}
                  {changelog.version && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Version</h3>
                      <Badge 
                        variant="outline" 
                        className="border-black text-black font-medium"
                      >
                        {changelog.version}
                      </Badge>
                    </div>
                  )}

                  {/* Publication Info */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Publication</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <CalendarDays className="w-4 h-4 mr-2 text-gray-500" />
                        <span>Published {formatRelativeDate(changelog.created_at.toString())}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(changelog.created_at.toString())}
                      </div>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Last Updated</h3>
                    <div className="text-sm text-gray-700">
                      {formatDate(changelog.updated_at.toString())}
                    </div>
                  </div>

                  {/* Commits Info */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Commits Analyzed</h3>
                    <div className="flex items-center">
                      <GitCommit className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm font-medium">{changelog.commit_hashes.length} commits</span>
                    </div>
                  </div>

                  {/* Repository Info */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Repository</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Eye className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{repository.is_private ? 'Private' : 'Public'}</span>
                      </div>
                      <a 
                        href={repository.repo_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors block truncate"
                      >
                        View on GitHub →
                      </a>
                    </div>
                  </div>

                  {/* Commit Hashes (expandable) */}
                  <details className="group">
                    <summary className="text-sm font-medium text-gray-600 mb-2 cursor-pointer hover:text-black transition-colors">
                      Commit Hashes ({changelog.commit_hashes.length})
                    </summary>
                    <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                      {changelog.commit_hashes.map((hash, index) => (
                        <div key={index} className="text-xs font-mono bg-gray-50 px-2 py-1 rounded">
                          {hash.substring(0, 7)}
                        </div>
                      ))}
                    </div>
                  </details>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Content Area - Changelog Content (3/4) */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8">
                <div className="prose prose-lg max-w-none">
                  {markdownElements}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}