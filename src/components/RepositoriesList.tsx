'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Folder, Plus } from 'lucide-react'

interface Repository {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  description: string
  updated_at: string
  language: string
  stargazers_count: number
  forks_count: number
}

interface RepositoryWithStatus extends Repository {
  isConnected: boolean
  changelogCount?: number
  lastChangelogDate?: string
}

export function RepositoriesList() {
  const [repositories, setRepositories] = useState<RepositoryWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    try {
      const response = await fetch('/api/repositories')
      if (!response.ok) {
        throw new Error('Failed to fetch repositories')
      }
      const data = await response.json()
      
      // Add mock status for demonstration
      const repositoriesWithStatus: RepositoryWithStatus[] = data.repositories.map((repo: Repository, index: number) => ({
        ...repo,
        isConnected: index === 0, // Mock: first repo is connected
        changelogCount: index === 0 ? 2 : undefined,
        lastChangelogDate: index === 0 ? '2 days ago' : undefined
      }))
      
      setRepositories(repositoriesWithStatus)
    } catch (err) {
      setError('Failed to load repositories')
      console.error('Error fetching repositories:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = (repoId: number) => {
    // TODO: Implement repository connection logic
    console.log('Connecting repository:', repoId)
  }

  const handleView = (repoId: number) => {
    // TODO: Implement view changelogs logic
    console.log('Viewing changelogs for repository:', repoId)
  }

  const handleGenerate = (repoId: number) => {
    // TODO: Implement generate changelog logic
    console.log('Generating changelog for repository:', repoId)
  }

  const handleConnectNew = () => {
    // TODO: Implement connect new repository logic
    console.log('Connect new repository')
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
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-black">Your Repositories</h3>
        <Card className="border-red-500">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-black">Your Repositories</h3>
      
      <div className="space-y-4">
        {repositories.map((repo) => (
          <Card key={repo.id} className="border-black">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Folder className="w-5 h-5 text-black mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-black mb-1">
                      {repo.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {repo.isConnected ? (
                        `${repo.changelogCount} changelogs • Last: ${repo.lastChangelogDate}`
                      ) : (
                        'Not connected'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  {repo.isConnected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(repo.id)}
                        className="border-black text-black hover:bg-black hover:text-white"
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleGenerate(repo.id)}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        Generate
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(repo.id)}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Button
        onClick={handleConnectNew}
        variant="outline"
        className="w-full border-black text-black hover:bg-black hover:text-white border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Connect New Repository
      </Button>
    </div>
  )
} 