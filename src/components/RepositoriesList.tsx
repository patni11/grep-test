'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Folder, Plus, Star, GitFork, Lock, Globe, AlertCircle, RefreshCw, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Repository {
  id: string
  github_repo_id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  description: string | null
  updated_at: string
  language: string | null
  stargazers_count: number
  forks_count: number
  isConnected: boolean
  changelogCount?: number
  lastSync?: string
  connectedAt?: string
}

interface RepositoriesResponse {
  repositories: Repository[]
  totalCount: number
  hasMore: boolean
  currentPage: number
  warning?: string
  error?: string
  lastUpdated?: string
  message?: string
}

export function RepositoriesList() {
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [connectingRepos, setConnectingRepos] = useState<Set<number>>(new Set())
  const [generatingRepos, setGeneratingRepos] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async (forceRefresh = false, page = 1, append = false) => {
    try {
      if (forceRefresh && page === 1) {
        setRefreshing(true)
        setRepositories([])
        setCurrentPage(1)
      } else if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      setError(null)
      setWarning(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (forceRefresh) {
        params.append('refresh', 'true')
      }
      
      const url = `/api/repositories?${params.toString()}`
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch repositories')
      }
      
      const data: RepositoriesResponse = await response.json()
      
      if (append && page > 1) {
        setRepositories(prev => [...prev, ...data.repositories])
      } else {
        setRepositories(data.repositories)
      }
      
      setHasMore(data.hasMore || false)
      setCurrentPage(data.currentPage || page)
      setTotalCount(data.totalCount || 0)
      setWarning(data.warning || null)
      setLastUpdated(data.lastUpdated || null)
      setMessage(data.message || null)
      
      if (data.error && !data.warning) {
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repositories')
      console.error('Error fetching repositories:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  const handleRefresh = () => {
    fetchRepositories(true, 1, false)
  }

  const handleLoadMore = () => {
    fetchRepositories(false, currentPage + 1, true)
  }

  const handleConnect = async (githubRepoId: number, repoFullName: string) => {
    try {
      setConnectingRepos(prev => new Set(prev).add(githubRepoId))
      
      const response = await fetch('/api/repositories/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoId: githubRepoId, repoFullName }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to connect repository')
      }

      const result = await response.json()
      console.log('Repository connected:', result.message)

      // Refresh the repositories list
      await fetchRepositories()
    } catch (err) {
      console.error('Error connecting repository:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect repository')
    } finally {
      setConnectingRepos(prev => {
        const newSet = new Set(prev)
        newSet.delete(githubRepoId)
        return newSet
      })
    }
  }

  const handleView = async (githubRepoId: number, repoDbId: string) => {
    try {
      if (!repoDbId || repoDbId.trim() === '') {
        setError('Repository ID is missing. Please reconnect the repository.')
        return
      }

      // Fetch changelogs for this repository
      const response = await fetch(`/api/repositories/${repoDbId}/changelogs`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch changelogs')
      }

      const data = await response.json()
      
      if (!data.changelogs || data.changelogs.length === 0) {
        setError('No changelogs found for this repository. Generate one first.')
        return
      }

      // Find the latest published changelog, or fall back to the latest one
      const latestPublishedChangelog = data.changelogs.find((changelog: any) => changelog.is_published)
      const latestChangelog = latestPublishedChangelog || data.changelogs[0]

      if (!latestChangelog.public_slug) {
        setError('Changelog URL not available. Please try generating a new changelog.')
        return
      }

      // Redirect to the public changelog URL
      const changelogUrl = `/changelog/${latestChangelog.public_slug}`
      window.open(changelogUrl, '_blank')
      
    } catch (err) {
      console.error('Error viewing changelog:', err)
      setError(err instanceof Error ? err.message : 'Failed to view changelog')
    }
  }

  const handleGenerate = async (githubRepoId: number, repoDbId: string, repoFullName: string) => {
    try {
      setGeneratingRepos(prev => new Set(prev).add(githubRepoId))
      
      if (!repoDbId || repoDbId.trim() === '') {
        throw new Error('Repository ID is missing. Please reconnect the repository.')
      }
      
      const response = await fetch('/api/repositories/changelogs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoId: repoDbId,
          repoFullName: repoFullName
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate changelog')
      }

      const result = await response.json()
      console.log('Changelog generated:', result.message)
      
      // Show success message
      setMessage(`✅ ${result.message}. Changelog: "${result.changelog.title}"`)
      
      // Automatically redirect to the new changelog if it has a public slug
      if (result.changelog?.public_slug) {
        const changelogUrl = `/changelog/${result.changelog.public_slug}`
        window.open(changelogUrl, '_blank')
      }
      
      // Refresh the repositories list to update changelog count
      await fetchRepositories()
    } catch (err) {
      console.error('Error generating changelog:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate changelog')
    } finally {
      setGeneratingRepos(prev => {
        const newSet = new Set(prev)
        newSet.delete(githubRepoId)
        return newSet
      })
    }
  }

  const handleConnectNew = () => {
    // TODO: Implement connect new repository logic (maybe show GitHub repo selector)
    console.log('Connect new repository')
  }

  const formatDate = (dateString: string) => {
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

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
    
    // For older dates, show the actual date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-black">Your Repositories</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-black">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error && repositories.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-black">Your Repositories</h3>
        <Card className="border-red-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-600">{error}</p>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button 
                onClick={() => fetchRepositories()} 
                className="bg-black text-white hover:bg-gray-800"
              >
                Try Again
              </Button>
              <Button 
                onClick={handleRefresh}
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh from GitHub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-black">Your Repositories</h3>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <Badge variant="outline" className="border-black text-black bg-gray-50">
              <Clock className="w-3 h-3 mr-1" />
              Updated {formatLastUpdated(lastUpdated)}
            </Badge>
          )}
          <Badge variant="outline" className="border-black text-black">
            {repositories.length} of {totalCount} repositories
          </Badge>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-black text-black hover:bg-black hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {warning && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-yellow-800 text-sm">{warning}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* {message && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="p-4">
            <p className="text-green-800 text-sm">{message}</p>
          </CardContent>
        </Card>
      )} */}
      
      <div className="space-y-4">
        {repositories.map((repo) => (
          <Card key={repo.id} className="border-black">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Folder className="w-5 h-5 text-black mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-semibold text-black">
                        {repo.name}
                      </h4>
                      <div className="flex items-center space-x-1">
                        {repo.private ? (
                          <Lock className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Globe className="w-4 h-4 text-green-600" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {repo.private ? 'Private' : 'Public'}
                        </Badge>
                        {/* {repo.changelogCount && repo.changelogCount > 0 && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {repo.changelogCount} changelog{repo.changelogCount !== 1 ? 's' : ''}
                          </Badge>
                        )} */}
                      </div>
                    </div>
                    
                    {repo.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {repo.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                      {repo.language && (
                        <span className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        {repo.stargazers_count}
                      </span>
                      <span className="flex items-center">
                        <GitFork className="w-3 h-3 mr-1" />
                        {repo.forks_count}
                      </span>
                      <span>Updated {formatDate(repo.updated_at)}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      {repo.isConnected ? (
                        <>
                          {repo.changelogCount === 0 ? (
                            'Connected • No changelogs yet'
                          ) : (
                            `Connected • ${repo.changelogCount} changelog${repo.changelogCount !== 1 ? 's' : ''}`
                          )}
                        </>
                      ) : (
                        'Not connected to changelog generation'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  {repo.isConnected ? (
                    <>
                      {repo.changelogCount && repo.changelogCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(repo.github_repo_id, repo.id)}
                          className="border-black text-black hover:bg-black hover:text-white"
                        >
                          View
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleGenerate(repo.github_repo_id, repo.id, repo.full_name)}
                        disabled={generatingRepos.has(repo.github_repo_id) || !repo.id}
                        className="bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        {generatingRepos.has(repo.github_repo_id) ? (
                          'Generating...'
                        ) : (
                          'Generate'
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(repo.github_repo_id, repo.full_name)}
                      disabled={connectingRepos.has(repo.github_repo_id)}
                      className="bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {connectingRepos.has(repo.github_repo_id) ? (
                        'Connecting...'
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {repositories.length === 0 && !loading && (
        <Card className="border-dashed border-black">
          <CardContent className="p-4 text-center">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-black mb-2">No repositories found</h4>
            <p className="text-gray-600 mb-4">
              Make sure you have repositories in your GitHub account.
            </p>
            <div className="flex justify-center space-x-2">
              <Button
                onClick={() => fetchRepositories()}
                className="bg-black text-white hover:bg-gray-800"
              >
                Load Repositories
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Fetch from GitHub
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
            className="border-black text-black hover:bg-black hover:text-white"
          >
            {loadingMore ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              <>
                Load More ({totalCount - repositories.length} remaining)
              </>
            )}
          </Button>
        </div>
      )}
      
      <Button
        onClick={handleConnectNew}
        variant="outline"
        className="w-full border-black text-black hover:bg-black hover:text-white border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Refresh Repository List
      </Button>
    </div>
  )
} 