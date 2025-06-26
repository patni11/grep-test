import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ChangelogGenerationData {
  commits: Array<{
    sha: string
    message: string
    author_name: string
    author_email: string
    committed_at: string
  }>
  repoName: string
  repoFullName: string
  repoUrl?: string
  isPrivate?: boolean
}

// Group commits by month for better organization
function groupCommitsByMonth(commits: Array<{
  sha: string
  message: string
  author_name: string
  author_email: string
  committed_at: string
}>) {
  const groups: Record<string, typeof commits> = {}
  
  commits.forEach(commit => {
    const date = new Date(commit.committed_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!groups[monthKey]) {
      groups[monthKey] = []
    }
    groups[monthKey].push(commit)
  })
  
  // Sort by month (newest first)
  const sortedEntries = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  
  return sortedEntries.map(([monthKey, monthCommits]) => {
    const firstCommitDate = new Date(monthCommits[0].committed_at)
    const monthLabel = firstCommitDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    return { monthKey, monthLabel, commits: monthCommits }
  })
}

// Enhanced function to analyze and extract meaningful data from commits
function analyzeCommits(commits: Array<{
  sha: string
  message: string
  author_name: string
  author_email: string
  committed_at: string
}>) {
  const analysis = {
    patterns: {
      features: [] as string[],
      fixes: [] as string[],
      improvements: [] as string[],
      documentation: [] as string[],
      testing: [] as string[],
      dependencies: [] as string[],
      configuration: [] as string[],
      refactoring: [] as string[],
      other: [] as string[]
    },
    authors: new Set<string>(),
    timeSpread: {
      earliest: new Date(Math.min(...commits.map(c => new Date(c.committed_at).getTime()))),
      latest: new Date(Math.max(...commits.map(c => new Date(c.committed_at).getTime())))
    },
    commitFrequency: commits.length,
    filePatterns: [] as string[]
  }

  commits.forEach(commit => {
    const message = commit.message.toLowerCase()
    const fullMessage = commit.message
    
    analysis.authors.add(commit.author_name)
    
    // Enhanced pattern detection
    if (message.includes('feat') || message.includes('add') || message.includes('new') || 
        message.includes('implement') || message.includes('create') || message.includes('introduce')) {
      analysis.patterns.features.push(fullMessage)
    } else if (message.includes('fix') || message.includes('bug') || message.includes('patch') || 
               message.includes('resolve') || message.includes('correct')) {
      analysis.patterns.fixes.push(fullMessage)
    } else if (message.includes('improve') || message.includes('enhance') || message.includes('optimize') || 
               message.includes('update') || message.includes('upgrade') || message.includes('better')) {
      analysis.patterns.improvements.push(fullMessage)
    } else if (message.includes('doc') || message.includes('readme') || message.includes('comment') || 
               message.includes('guide')) {
      analysis.patterns.documentation.push(fullMessage)
    } else if (message.includes('test') || message.includes('spec') || message.includes('coverage')) {
      analysis.patterns.testing.push(fullMessage)
    } else if (message.includes('dep') || message.includes('package') || message.includes('npm') || 
               message.includes('yarn') || message.includes('install')) {
      analysis.patterns.dependencies.push(fullMessage)
    } else if (message.includes('config') || message.includes('setup') || message.includes('env') || 
               message.includes('settings')) {
      analysis.patterns.configuration.push(fullMessage)
    } else if (message.includes('refactor') || message.includes('clean') || message.includes('reorganize') || 
               message.includes('restructure')) {
      analysis.patterns.refactoring.push(fullMessage)
    } else if (!message.includes('merge') && !message.includes('bump') && 
               !message.includes('version') && fullMessage.trim().length > 5) {
      analysis.patterns.other.push(fullMessage)
    }

    // Extract potential file patterns from commit messages
    const fileMatches = fullMessage.match(/\b\w+\.\w+\b/g)
    if (fileMatches) {
      analysis.filePatterns.push(...fileMatches)
    }
  })

  return analysis
}

export async function generateChangelogWithAI(data: ChangelogGenerationData): Promise<{
  title: string
  content: string
  version: string
}> {
  const { commits, repoName, repoFullName, repoUrl, isPrivate } = data
  
  // Generate a version number based on current date
  const now = new Date()
  const version = `v${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}`
  
  // Group commits by month
  const monthlyGroups = groupCommitsByMonth(commits)
  
  // Analyze commits for patterns and insights
  const commitAnalysis = analyzeCommits(commits)
  
  // Determine if this is a sparse repository (limited commits)
  const isSparseRepo = commits.length <= 5 || commitAnalysis.commitFrequency < 5

  // Create a more intelligent prompt that handles sparse repos differently
  const enhancedPrompt = `
You are an expert technical writer and software development analyst creating a changelog for a repository. Your task is to analyze commits and create a meaningful, user-focused changelog that tells the story of the project's evolution.

Repository Context:
- Name: ${repoName}
- Full Name: ${repoFullName}
- Type: ${isPrivate ? 'Private' : 'Public'} repository
${repoUrl ? `- URL: ${repoUrl}` : ''}

Commit Analysis Summary:
- Total Commits: ${commits.length}
- Active Contributors: ${commitAnalysis.authors.size} (${Array.from(commitAnalysis.authors).slice(0, 3).join(', ')}${commitAnalysis.authors.size > 3 ? '...' : ''})
- Time Period: ${commitAnalysis.timeSpread.earliest.toLocaleDateString()} to ${commitAnalysis.timeSpread.latest.toLocaleDateString()}
- Development Activity: ${commitAnalysis.commitFrequency < 10 ? 'Light' : commitAnalysis.commitFrequency < 30 ? 'Moderate' : 'Heavy'}
- Repository Type: ${isSparseRepo ? 'Early Stage/Limited Activity' : 'Active Development'}

Pattern Analysis:
${commitAnalysis.patterns.features.length > 0 ? `- Features/New Functionality: ${commitAnalysis.patterns.features.length} commits` : ''}
${commitAnalysis.patterns.fixes.length > 0 ? `- Bug Fixes/Patches: ${commitAnalysis.patterns.fixes.length} commits` : ''}
${commitAnalysis.patterns.improvements.length > 0 ? `- Improvements/Enhancements: ${commitAnalysis.patterns.improvements.length} commits` : ''}
${commitAnalysis.patterns.refactoring.length > 0 ? `- Code Refactoring: ${commitAnalysis.patterns.refactoring.length} commits` : ''}
${commitAnalysis.patterns.dependencies.length > 0 ? `- Dependencies/Packages: ${commitAnalysis.patterns.dependencies.length} commits` : ''}
${commitAnalysis.patterns.testing.length > 0 ? `- Testing: ${commitAnalysis.patterns.testing.length} commits` : ''}
${commitAnalysis.patterns.documentation.length > 0 ? `- Documentation: ${commitAnalysis.patterns.documentation.length} commits` : ''}
${commitAnalysis.patterns.configuration.length > 0 ? `- Configuration: ${commitAnalysis.patterns.configuration.length} commits` : ''}

Raw Commit Data by Month:
${monthlyGroups.map(({ monthLabel, commits: monthCommits }) => {
    const commitList = monthCommits.map((commit, index) => 
      `  ${index + 1}. "${commit.message.split('\n')[0]}" (${commit.author_name}, ${new Date(commit.committed_at).toLocaleDateString()})`
    ).join('\n')
    
    return `**${monthLabel}** (${monthCommits.length} commits):\n${commitList}`
  }).join('\n\n')}

INSTRUCTIONS:
${isSparseRepo ? `
This is an EARLY-STAGE repository with limited commits. Create a concise, focused changelog that:

1. **Keep it Simple**: Don't create empty sections or forced categories
2. **Focus on Reality**: If there are only initial commits, call it what it is - project foundation/setup
3. **Be Honest**: Don't over-embellish limited activity
4. **Consolidate**: Group all related commits into meaningful, substantial sections
5. **NO EMPTY SECTIONS**: Only create sections that have actual content

For sparse repos, prefer a simpler structure:
- Start with: # ${repoName} - ${version}
- Brief introduction about the project's current state
- ## 📅 [Month Year] with a single comprehensive section about what was accomplished
- Focus on the foundation/setup rather than trying to create multiple categories
` : `
You have complete creative freedom to interpret this data and create a compelling changelog. You should:

1. **Infer Meaning**: Even if commit messages are vague, use context clues, patterns, and timing to infer what might have happened
2. **Group Intelligently**: Combine related commits into logical features or improvements
3. **Tell a Story**: Create a narrative about the project's development
4. **Be User-Focused**: Translate technical commits into user-facing benefits
5. **Handle Poor Commits**: When commit messages are unhelpful, group them by timing/author and create reasonable descriptions
6. **Monthly Structure**: Organize by month with engaging subsections

Structure Requirements:
- Start with: # ${repoName} - ${version}
- Use monthly groupings: ## 📅 [Month Year]
- Include engaging subsections with emojis (only when you have content for them)
- Make it visually appealing and easy to read
- Focus on impact and benefits, not just technical details
`}

CRITICAL: Never create empty sections or section headers without content. Only include sections that have actual commits or meaningful content to display.

Be creative, insightful, and don't just repeat commit messages verbatim. Generate meaningful content that tells the real story of this project's development!
`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert technical writer and software development analyst. You excel at interpreting commit data, understanding development patterns, and creating compelling changelogs that tell the story of a project's evolution. You have the creative freedom to infer meaning from vague commits and present information in the most user-friendly way possible."
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.8, // Increased for more creativity
    })

    const aiGeneratedContent = response.choices[0]?.message?.content
    
    if (!aiGeneratedContent) {
      throw new Error('No content generated by OpenAI')
    }

    // Add metadata footer with more insights
    const content = `${aiGeneratedContent}\n\n---\n\n### 📊 Generation Insights\n- **Total Commits Analyzed:** ${commits.length}\n- **Active Contributors:** ${commitAnalysis.authors.size}\n- **Development Period:** ${monthlyGroups.length} month${monthlyGroups.length !== 1 ? 's' : ''}\n- **Activity Level:** ${commitAnalysis.commitFrequency < 10 ? 'Light' : commitAnalysis.commitFrequency < 30 ? 'Moderate' : 'Heavy'}\n- **Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\n*This changelog was intelligently generated using AI analysis of commit patterns and development activity.*`
    
    // Generate title
    const title = `${repoName} - ${version}`
    
    return { title, content, version }
    
  } catch (error) {
    console.error('OpenAI API Error:', error)
    
    // Enhanced fallback with better analysis
    return generateEnhancedFallbackChangelog(data, version, commitAnalysis)
  }
}

// Enhanced fallback function with better commit analysis
function generateEnhancedFallbackChangelog(
  data: ChangelogGenerationData, 
  version: string,
  analysis: ReturnType<typeof analyzeCommits>
): {
  title: string
  content: string
  version: string
} {
  const { commits, repoName } = data
  
  // Generate title
  const title = `${repoName} - ${version}`
  
  // Group commits by month
  const monthlyGroups = groupCommitsByMonth(commits)
  
  // Build enhanced changelog content
  const now = new Date()
  let content = `# ${title}\n\n`
  content += `**Release Date:** ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n`
  content += `*This release includes ${commits.length} commits from ${analysis.authors.size} contributor${analysis.authors.size !== 1 ? 's' : ''} over ${monthlyGroups.length} month${monthlyGroups.length !== 1 ? 's' : ''}.*\n\n`
  
  monthlyGroups.forEach(({ monthLabel, commits: monthCommits }) => {
    content += `## 📅 ${monthLabel}\n\n`
    
    // Create month summary based on patterns
    const monthAnalysis = analyzeCommits(monthCommits)
    const totalChanges = Object.values(monthAnalysis.patterns).reduce((sum, arr) => sum + arr.length, 0)
    
    // Check if this is a sparse repository
    const isSparseMonth = monthCommits.length <= 5 && totalChanges <= 3
    
    if (isSparseMonth) {
      // For sparse months, create a consolidated section
      content += `*${monthCommits.length} commit${monthCommits.length !== 1 ? 's' : ''} establishing the project foundation*\n\n`
      
      // Check if this looks like initial setup
      const hasInitialCommits = monthCommits.some(c => 
        c.message.toLowerCase().includes('initial') || 
        c.message.toLowerCase().includes('first') ||
        c.message.toLowerCase().includes('setup') ||
        c.message.toLowerCase().includes('init')
      )
      
      if (hasInitialCommits) {
        content += `### 🎯 Project Foundation\n`
        content += `- Project initialization and repository setup\n`
        content += `- Initial codebase structure established\n`
        if (monthCommits.length > 1) {
          content += `- ${monthCommits.length} foundational commits by ${new Set(monthCommits.map(c => c.author_name)).size} contributor${new Set(monthCommits.map(c => c.author_name)).size !== 1 ? 's' : ''}\n`
        }
        content += '\n'
      } else {
        // Generic sparse content
        content += `### 📝 Development Activity\n`
        monthCommits.forEach(commit => {
          const message = commit.message.split('\n')[0]
          const date = new Date(commit.committed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          content += `- ${message} *(${date})*\n`
        })
        content += '\n'
      }
    } else {
      // Regular detailed categorization for active months
      content += `*${monthCommits.length} commits bringing ${totalChanges} notable changes this month*\n\n`
      
      if (monthAnalysis.patterns.features.length > 0) {
        content += `### 🚀 New Features & Functionality\n`
        monthAnalysis.patterns.features.forEach((commit) => {
          const message = commit.split('\n')[0]
          const date = monthCommits.find(c => c.message === commit)?.committed_at
          const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          content += `- ${message} *(${formattedDate})*\n`
        })
        content += '\n'
      }
      
      if (monthAnalysis.patterns.improvements.length > 0) {
        content += `### ✨ Improvements & Enhancements\n`
        monthAnalysis.patterns.improvements.forEach((commit) => {
          const message = commit.split('\n')[0]
          const date = monthCommits.find(c => c.message === commit)?.committed_at
          const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          content += `- ${message} *(${formattedDate})*\n`
        })
        content += '\n'
      }
      
      if (monthAnalysis.patterns.fixes.length > 0) {
        content += `### 🐛 Bug Fixes & Patches\n`
        monthAnalysis.patterns.fixes.forEach((commit) => {
          const message = commit.split('\n')[0]
          const date = monthCommits.find(c => c.message === commit)?.committed_at
          const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          content += `- ${message} *(${formattedDate})*\n`
        })
        content += '\n'
      }
      
      if (monthAnalysis.patterns.refactoring.length > 0) {
        content += `### 🔧 Code Quality & Refactoring\n`
        monthAnalysis.patterns.refactoring.forEach((commit) => {
          const message = commit.split('\n')[0]
          const date = monthCommits.find(c => c.message === commit)?.committed_at
          const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          content += `- ${message} *(${formattedDate})*\n`
        })
        content += '\n'
      }
      
      if (monthAnalysis.patterns.dependencies.length > 0) {
        content += `### 📦 Dependencies & Packages\n`
        monthAnalysis.patterns.dependencies.forEach((commit) => {
          const message = commit.split('\n')[0]
          const date = monthCommits.find(c => c.message === commit)?.committed_at
          const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          content += `- ${message} *(${formattedDate})*\n`
        })
        content += '\n'
      }
      
      if (monthAnalysis.patterns.testing.length > 0) {
        content += `### 🧪 Testing & Quality Assurance\n`
        monthAnalysis.patterns.testing.forEach((commit) => {
          const message = commit.split('\n')[0]
          const date = monthCommits.find(c => c.message === commit)?.committed_at
          const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          content += `- ${message} *(${formattedDate})*\n`
        })
        content += '\n'
      }
      
      if (monthAnalysis.patterns.documentation.length > 0) {
        content += `### 📚 Documentation & Guides\n`
        monthAnalysis.patterns.documentation.forEach((commit) => {
          const message = commit.split('\n')[0]
          const date = monthCommits.find(c => c.message === commit)?.committed_at
          const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          content += `- ${message} *(${formattedDate})*\n`
        })
        content += '\n'
      }
      
      if (monthAnalysis.patterns.configuration.length > 0) {
        content += `### ⚙️ Configuration & Setup\n`
        monthAnalysis.patterns.configuration.forEach((commit) => {
          const message = commit.split('\n')[0]
          const date = monthCommits.find(c => c.message === commit)?.committed_at
          const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          content += `- ${message} *(${formattedDate})*\n`
        })
        content += '\n'
      }
      
      // Handle miscellaneous commits with more intelligence
      if (monthAnalysis.patterns.other.length > 0) {
        content += `### 📝 Other Changes\n`
        monthAnalysis.patterns.other.forEach((commit) => {
          const message = commit.split('\n')[0]
          const date = monthCommits.find(c => c.message === commit)?.committed_at
          const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          content += `- ${message} *(${formattedDate})*\n`
        })
        content += '\n'
      }
      
      // If no patterns detected, create a generic section
      if (totalChanges === 0) {
        content += `### 📝 Development Activity\n`
        content += `- ${monthCommits.length} commits with various improvements and maintenance\n`
        content += `- Active development by ${new Set(monthCommits.map(c => c.author_name)).size} contributor${new Set(monthCommits.map(c => c.author_name)).size !== 1 ? 's' : ''}\n\n`
      }
    }
    
    content += `---\n\n`
  })
  
  content += `### 📊 Generation Insights\n- **Total Commits Analyzed:** ${commits.length}\n- **Active Contributors:** ${analysis.authors.size}\n- **Development Period:** ${monthlyGroups.length} month${monthlyGroups.length !== 1 ? 's' : ''}\n- **Activity Level:** ${analysis.commitFrequency < 10 ? 'Light' : analysis.commitFrequency < 30 ? 'Moderate' : 'Heavy'}\n- **Generated:** ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\n*This changelog was generated with enhanced pattern analysis (OpenAI unavailable).*`
  
  return { title, content, version }
}

export { openai } 