// Database Schema Types
export interface User {
    id: string; // UUID
    github_id: string;
    username: string;
    email: string;
    avatar_url: string;
    access_token: string; // Encrypted GitHub token
    created_at: Date;
    updated_at: Date;
  }
  
  export interface Repository {
    id: string; // UUID
    user_id: string; // FK to User
    repo_name: string;
    repo_full_name: string; // e.g., "username/repo"
    repo_url: string;
    github_repo_id: number; // GitHub's internal repo ID
    default_branch: string;
    is_private: boolean;
    connected_at: Date;
    last_sync_at: Date | null;
  }
  
  export interface Changelog {
    id: string; // UUID
    repo_id: string; // FK to Repository
    title: string;
    version: string | null; // e.g., "v1.2.3" or null for latest
    content: string; // Markdown content
    commit_hashes: string[]; // Array of commit SHAs
    public_slug: string; // URL-friendly slug
    from_commit: string | null; // Starting commit hash
    to_commit: string; // Ending commit hash
    is_published: boolean;
    created_at: Date;
    updated_at: Date;
  }
  
  export interface Commit {
    id: string; // UUID
    repo_id: string; // FK to Repository
    commit_hash: string;
    commit_message: string;
    author_name: string;
    author_email: string;
    committed_at: Date;
    created_at: Date;
  }
  
  // API Response Types
  export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    default_branch: string;
    private: boolean;
    updated_at: string;
  }
  
  export interface GitHubCommit {
    sha: string;
    commit: {
      message: string;
      author: {
        name: string;
        email: string;
        date: string;
      };
    };
  }
  
  export interface ChangelogGenerationRequest {
    repoId: string;
    fromCommit?: string;
    toCommit?: string;
    version?: string;
    title?: string;
  }