import { getChangelogBySlug } from '@/lib/db/changelogs'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, GitCommit } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-black">{changelog.title}</h1>
            <Badge variant="outline" className="border-green-600 text-green-600">
              Published
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(changelog.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            {changelog.commit_hashes && changelog.commit_hashes.length > 0 && (
              <div className="flex items-center space-x-1">
                <GitCommit className="w-4 h-4" />
                <span>{changelog.commit_hashes.length} commits</span>
              </div>
            )}
            
            {changelog.version && (
              <Badge variant="secondary">{changelog.version}</Badge>
            )}
          </div>
        </div>

        <Card className="border-black">
          <CardContent className="p-8">
            <div 
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: changelog.content.replace(/\n/g, '<br />') 
              }}
            />
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This changelog was automatically generated from repository commits.</p>
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
    title: changelog.title,
    description: `Changelog for ${changelog.title} - ${changelog.version || 'Latest changes'}`,
  }
} 