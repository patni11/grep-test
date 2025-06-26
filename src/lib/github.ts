export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  description: string | null
  updated_at: string
  language: string | null
  stargazers_count: number
  forks_count: number
  default_branch: string
  clone_url: string
}

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
    committer: {
      name: string
      email: string
      date: string
    }
  }
  author: {
    login: string
    avatar_url: string
  } | null
  committer: {
    login: string
    avatar_url: string
  } | null
  html_url: string
}

export interface GitHubApiError {
  message: string
  status: number
}

export class GitHubService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Greptile-App/1.0'
      }
    })

    if (!response.ok) {
      const error: GitHubApiError = {
        message: `GitHub API Error: ${response.statusText}`,
        status: response.status
      }
      throw error
    }

    return response.json()
  }

  async getRepositories(page = 1, perPage = 100): Promise<GitHubRepository[]> {
    try {
      // Fetch user's repositories (both owned and collaborated)
      const repos = await this.makeRequest<GitHubRepository[]>(
        `/user/repos?sort=updated&direction=desc&per_page=${perPage}&page=${page}&affiliation=owner,collaborator`
      )
      
      return repos
    } catch (error) {
      console.error('Error fetching repositories from GitHub:', error)
      throw error
    }
  }

  async getAllRepositories(): Promise<GitHubRepository[]> {
    const allRepos: GitHubRepository[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const repos = await this.getRepositories(page, perPage)
      allRepos.push(...repos)
      
      // If we got fewer than perPage repos, we've reached the end
      if (repos.length < perPage) {
        break
      }
      
      page++
    }

    return allRepos
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.makeRequest<GitHubRepository>(`/repos/${owner}/${repo}`)
  }

  async getCommits(owner: string, repo: string, options: {
    branch?: string
    since?: string
    until?: string
    perPage?: number
    page?: number
  } = {}): Promise<GitHubCommit[]> {
    const {
      branch,
      since,
      until,
      perPage = 20,
      page = 1
    } = options

    let endpoint = `/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`
    
    if (branch) {
      endpoint += `&sha=${branch}`
    }
    if (since) {
      endpoint += `&since=${since}`
    }
    if (until) {
      endpoint += `&until=${until}`
    }

    try {
      return this.makeRequest<GitHubCommit[]>(endpoint)
    } catch (error) {
      console.error(`Error fetching commits for ${owner}/${repo}:`, error)
      throw error
    }
  }

  async getLatestCommits(owner: string, repo: string, limit = 20): Promise<GitHubCommit[]> {
    // Get the repository info to get the default branch
    const repoInfo = await this.getRepository(owner, repo)
    
    // Fetch commits from the default branch
    return this.getCommits(owner, repo, {
      branch: repoInfo.default_branch,
      perPage: limit
    })
  }

  async getUserInfo() {
    return this.makeRequest('/user')
  }
} 