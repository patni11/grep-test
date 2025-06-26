import { getChangelogBySlug } from '@/lib/db/changelogs'
import { getRepositoryById } from '@/lib/db/repositories'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChangelogActions } from '@/components/ChangelogActions'
import { 
  Calendar, 
  GitCommit, 
  Hash, 
  ExternalLink, 
  Star,
  Clock,
  GitBranch
} from 'lucide-react'

interface ChangelogPageProps {
  params: {
    slug: string
  }
}

export default async function ChangelogPage({ params }: ChangelogPageProps) {
  const changelog = await getChangelogBySlug(params.slug)

  if (!changelog || !changelog.is_published) {
    notFound()
  }

  // Get repository information for additional context
  let repository = null
  try {
    repository = await getRepositoryById(changelog.repo_id)
  } catch (error) {
    // Continue without repository info if not found
    console.log('Repository not found for changelog')
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCommitHash = (hash: string) => {
    return hash.substring(0, 7)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                  <Star className="w-3 h-3 mr-1" />
                  Published
                </Badge>
                {changelog.version && (
                  <Badge variant="outline" className="border-blue-400/30 text-blue-300 bg-blue-500/10">
                    <Hash className="w-3 h-3 mr-1" />
                    {changelog.version}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {changelog.title}
              </h1>
              
              {repository && (
                <div className="flex items-center gap-2 text-gray-300 mb-4">
                  <GitBranch className="w-4 h-4" />
                  <span className="text-sm">
                    {repository.repo_full_name}
                  </span>
                  {repository.repo_url && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-300 hover:text-white p-1 h-auto"
                      asChild
                    >
                      <a href={repository.repo_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Published {formatDate(changelog.created_at)}</span>
                </div>
                
                {changelog.commit_hashes && changelog.commit_hashes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <GitCommit className="w-4 h-4" />
                    <span>{changelog.commit_hashes.length} commits included</span>
                  </div>
                )}
                
                {changelog.updated_at && changelog.updated_at !== changelog.created_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Updated {formatDate(changelog.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <ChangelogActions 
              title={changelog.title}
              content={changelog.content}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar with metadata */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-gray-900">Release Details</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {changelog.version && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Version</label>
                    <p className="text-sm font-mono text-gray-900 mt-1">{changelog.version}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Release Date</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(changelog.created_at)}</p>
                </div>
                
                {changelog.commit_hashes && changelog.commit_hashes.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Commits</label>
                    <p className="text-sm text-gray-900 mt-1">{changelog.commit_hashes.length} changes</p>
                  </div>
                )}
                
                {changelog.from_commit && changelog.to_commit && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Commit Range</label>
                    <div className="text-xs font-mono text-gray-600 mt-1 space-y-1">
                      <div>From: {formatCommitHash(changelog.from_commit)}</div>
                      <div>To: {formatCommitHash(changelog.to_commit)}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commit Hashes */}
            {changelog.commit_hashes && changelog.commit_hashes.length > 0 && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <h3 className="font-semibold text-gray-900">Included Commits</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {changelog.commit_hashes.slice(0, 10).map((hash, index) => (
                      <div key={hash} className="flex items-center gap-2 text-xs">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <code className="font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {formatCommitHash(hash)}
                        </code>
                      </div>
                    ))}
                    {changelog.commit_hashes.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2">
                        +{changelog.commit_hashes.length - 10} more commits
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main changelog content */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8 lg:p-12">
                <div 
                  className="prose prose-lg prose-gray max-w-none
                           prose-headings:text-gray-900 prose-headings:font-bold
                           prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-0
                           prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2
                           prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6
                           prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                           prose-ul:mb-6 prose-li:mb-2 prose-li:text-gray-700
                           prose-strong:text-gray-900 prose-strong:font-semibold
                           prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                           prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto"
                  dangerouslySetInnerHTML={{ 
                    __html: changelog.content
                      .replace(/\n/g, '<br />')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`(.*?)`/g, '<code>$1</code>')
                      .replace(/#{3}\s(.*?)(<br \/>|$)/g, '<h3>$1</h3>')
                      .replace(/#{2}\s(.*?)(<br \/>|$)/g, '<h2>$1</h2>')
                      .replace(/#{1}\s(.*?)(<br \/>|$)/g, '<h1>$1</h1>')
                      .replace(/^-\s(.*?)(<br \/>|$)/gm, '<li>$1</li>')
                      .replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>')
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
              <GitCommit className="w-4 h-4" />
              <span>This changelog was automatically generated from repository commits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ChangelogPageProps) {
  const changelog = await getChangelogBySlug(params.slug)

  if (!changelog || !changelog.is_published) {
    return {
      title: 'Changelog Not Found',
    }
  }

  return {
    title: `${changelog.title} - Changelog`,
    description: `${changelog.title} - ${changelog.version || 'Latest changes'}. View the complete changelog with ${changelog.commit_hashes?.length || 0} commits.`,
    openGraph: {
      title: changelog.title,
      description: `Changelog: ${changelog.version || 'Latest changes'}`,
      type: 'article',
      publishedTime: changelog.created_at.toISOString(),
      modifiedTime: changelog.updated_at?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: changelog.title,
      description: `${changelog.title} - ${changelog.version || 'Latest changes'}`,
    }
  }
} 