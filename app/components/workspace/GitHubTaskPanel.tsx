'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { type Task, completeTask } from '../../lib/api-roadmap'

interface NextNavigation {
  type: 'task' | 'concept' | 'day' | 'complete'
  taskId?: string
  conceptId?: string
  dayNumber?: number
  projectId: string
}

interface GitHubTaskPanelProps {
  task: Task
  project: {
    project_id: string
    project_name: string
    github_url: string
    skill_level: string
    target_days: number
    status: string
    created_at: string
  }
  onComplete: () => void
  nextTaskId?: string | null
  nextNavigation?: NextNavigation | null
}

interface VerificationResult {
  success: boolean
  checks: {
    label: string
    passed: boolean
    detail?: string
  }[]
  error?: string
}

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error'

export default function GitHubTaskPanel({ task, project, onComplete, initialCompleted, nextTaskId, nextNavigation }: GitHubTaskPanelProps & { initialCompleted?: boolean }) {
  const { getToken } = useAuth()
  const router = useRouter()
  
  // Handle navigation to next content
  const handleNextNavigation = () => {
    if (!nextNavigation) {
      router.push(`/project/${project.project_id}`)
      return
    }
    
    switch (nextNavigation.type) {
      case 'task':
        router.push(`/workspace?task=${nextNavigation.taskId}`)
        break
      case 'concept':
      case 'day':
        // Navigate to docs page for next concept
        router.push(`/docs/${nextNavigation.conceptId}?project=${nextNavigation.projectId}`)
        break
      case 'complete':
        router.push(`/project/${nextNavigation.projectId}`)
        break
      default:
        router.push(`/project/${project.project_id}`)
    }
  }
  
  // Get button text based on next navigation
  const getNextButtonText = () => {
    if (!nextNavigation) return 'Back to Roadmap'
    
    switch (nextNavigation.type) {
      case 'task':
        return 'Continue to Next Task'
      case 'concept':
        return 'Continue to Next Lesson'
      case 'day':
        return `Start Day ${nextNavigation.dayNumber}`
      case 'complete':
        return '🎉 Roadmap Complete!'
      default:
        return 'Back to Roadmap'
    }
  }
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<VerificationStatus>(initialCompleted ? 'success' : 'idle')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isCompleted, setIsCompleted] = useState(initialCompleted || false)
  const [isFocused, setIsFocused] = useState(false)
  
  useEffect(() => {
    if (initialCompleted) {
      setIsCompleted(true)
      setStatus('success')
      onComplete()
    }
  }, [initialCompleted, onComplete])

  // Extract username from GitHub URL
  const extractUsername = (url: string): string | null => {
    const match = url.match(/github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\/?$/)
    return match ? match[1] : null
  }

  // Extract owner/repo from GitHub repo URL
  const extractRepo = (url: string): { owner: string; repo: string } | null => {
    const match = url.match(/github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+)\/?$/)
    return match ? { owner: match[1], repo: match[2] } : null
  }

  // Extract commit info from URL or SHA
  const extractCommit = (input: string, projectUrl: string): { owner: string; repo: string; sha: string } | null => {
    // Full commit URL
    const urlMatch = input.match(/github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+)\/commit\/([a-f0-9]{7,40})/)
    if (urlMatch) {
      return { owner: urlMatch[1], repo: urlMatch[2], sha: urlMatch[3] }
    }
    
    // Just SHA - use project repo
    const shaMatch = input.match(/^[a-f0-9]{7,40}$/i)
    if (shaMatch) {
      const repoInfo = extractRepo(projectUrl)
      if (repoInfo) {
        return { ...repoInfo, sha: input }
      }
    }
    
    return null
  }

  // Verify GitHub profile
  const verifyProfile = async (username: string): Promise<VerificationResult> => {
    try {
      const response = await fetch(`https://api.github.com/users/${username}`)
      
      if (response.status === 404) {
        return {
          success: false,
          checks: [],
          error: `User "${username}" not found on GitHub`
        }
      }
      
      if (!response.ok) {
        return {
          success: false,
          checks: [],
          error: 'Failed to fetch GitHub profile. Please try again.'
        }
      }
      
      const data = await response.json()
      
      const checks = [
        {
          label: 'Profile exists',
          passed: true,
          detail: `@${data.login}`
        },
        {
          label: 'Profile photo',
          passed: !!data.avatar_url && !data.avatar_url.includes('identicons'),
          detail: data.avatar_url ? 'Found' : 'Not set'
        },
        {
          label: 'Name filled in',
          passed: !!data.name && data.name.trim().length > 0,
          detail: data.name || 'Not set'
        },
        {
          label: 'Bio/description',
          passed: !!data.bio && data.bio.trim().length > 0,
          detail: data.bio ? 'Found' : 'Not set'
        }
      ]
      
      const allPassed = checks.every(c => c.passed)
      
      return {
        success: allPassed,
        checks,
        error: allPassed ? undefined : 'Please complete the missing profile items above'
      }
    } catch {
      return {
        success: false,
        checks: [],
        error: 'Network error. Please check your connection.'
      }
    }
  }

  // Verify repository
  const verifyRepo = async (owner: string, repo: string): Promise<VerificationResult> => {
    try {
      // Fetch repo details
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
      
      if (response.status === 404) {
        return {
          success: false,
          checks: [],
          error: `Repository "${owner}/${repo}" not found or is private`
        }
      }
      
      if (!response.ok) {
        return {
          success: false,
          checks: [],
          error: 'Failed to fetch repository. Please try again.'
        }
      }
      
      const data = await response.json()
      
      // Check for README file
      let hasReadme = false
      try {
        const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`)
        hasReadme = readmeResponse.ok
      } catch {
        hasReadme = false
      }
      
      // Check license from repo data
      const hasLicense = !!data.license
      
      const checks = [
        {
          label: 'Repository exists',
          passed: true,
          detail: data.full_name
        },
        {
          label: 'Repository is public',
          passed: !data.private,
          detail: data.private ? 'Private' : 'Public'
        },
        {
          label: 'Has README file',
          passed: hasReadme,
          detail: hasReadme ? 'Found' : 'Not found'
        },
        {
          label: 'Has License',
          passed: hasLicense,
          detail: data.license?.name || 'Not set'
        }
      ]
      
      // All checks must pass
      const success = checks.every(c => c.passed)
      
      return {
        success,
        checks,
        error: success ? undefined : 'Please complete the missing requirements above'
      }
    } catch {
      return {
        success: false,
        checks: [],
        error: 'Network error. Please check your connection.'
      }
    }
  }

  // Verify commit
  const verifyCommit = async (owner: string, repo: string, sha: string): Promise<VerificationResult> => {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`)
      
      if (response.status === 404) {
        return {
          success: false,
          checks: [],
          error: `Commit "${sha.substring(0, 7)}" not found in ${owner}/${repo}`
        }
      }
      
      if (!response.ok) {
        return {
          success: false,
          checks: [],
          error: 'Failed to fetch commit. Please try again.'
        }
      }
      
      const data = await response.json()
      
      // Check if commit modifies README.md
      const modifiesReadme = data.files?.some((file: { filename: string }) => 
        file.filename.toLowerCase().includes('readme')
      ) || false
      
      const checks = [
        {
          label: 'Commit exists',
          passed: true,
          detail: data.sha.substring(0, 7)
        },
        {
          label: 'Commit message',
          passed: !!data.commit?.message,
          detail: data.commit?.message?.split('\n')[0] || 'No message'
        },
        {
          label: 'Modifies README',
          passed: modifiesReadme,
          detail: modifiesReadme ? 'README.md updated' : 'README.md not changed in this commit'
        },
        {
          label: 'Author',
          passed: true,
          detail: data.commit?.author?.name || data.author?.login || 'Unknown'
        }
      ]
      
      const success = checks.every(c => c.passed)
      
      return {
        success,
        checks,
        error: success ? undefined : 'This commit must include changes to README.md'
      }
    } catch {
      return {
        success: false,
        checks: [],
        error: 'Network error. Please check your connection.'
      }
    }
  }

  // Main verification function
  const handleVerify = useCallback(async () => {
    if (!input.trim() || status === 'verifying' || isCompleted) return
    
    setStatus('verifying')
    setVerificationResult(null)
    
    let result: VerificationResult
    
    if (task.task_type === 'github_profile') {
      const username = extractUsername(input)
      if (!username) {
        result = { success: false, checks: [], error: 'Invalid GitHub profile URL format' }
      } else {
        result = await verifyProfile(username)
      }
    } else if (task.task_type === 'create_repo') {
      const repoInfo = extractRepo(input)
      if (!repoInfo) {
        result = { success: false, checks: [], error: 'Invalid repository URL format' }
      } else {
        result = await verifyRepo(repoInfo.owner, repoInfo.repo)
      }
    } else if (task.task_type === 'verify_commit') {
      const commitInfo = extractCommit(input, project.github_url)
      if (!commitInfo) {
        result = { success: false, checks: [], error: 'Invalid commit URL or SHA format' }
      } else {
        result = await verifyCommit(commitInfo.owner, commitInfo.repo, commitInfo.sha)
      }
    } else {
      result = { success: false, checks: [], error: 'Unknown task type' }
    }
    
    setVerificationResult(result)
    
    if (result.success) {
      setStatus('success')
      try {
        const token = await getToken()
        if (token) {
          await completeTask(project.project_id, task.task_id, token)
          setIsCompleted(true)
          onComplete()
        }
      } catch (error) {
        console.error('Failed to complete task:', error)
      }
    } else {
      setStatus('error')
    }
  }, [input, status, isCompleted, task.task_type, task.task_id, project.project_id, project.github_url, getToken, onComplete])

  const getTaskContent = () => {
    switch (task.task_type) {
      case 'github_profile':
        return {
          icon: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          ),
          placeholder: 'https://github.com/yourusername',
          hint: 'Enter your GitHub profile URL'
        }
      case 'create_repo':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          ),
          placeholder: 'https://github.com/username/repository',
          hint: 'Enter your repository URL'
        }
      case 'verify_commit':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          placeholder: 'Commit URL or SHA (e.g., abc1234)',
          hint: 'Enter your commit SHA or full URL'
        }
      default:
        return {
          icon: null,
          placeholder: 'Enter information...',
          hint: ''
        }
    }
  }

  const content = getTaskContent()

  // Parse description to extract intro and list items
  const parseDescription = (description: string) => {
    const hasNumberedList = /\d+[).]\s/.test(description)
    
    if (!hasNumberedList) {
      return { intro: description, items: [] }
    }
    
    const parts = description.split(/(?=\d+[).]\s)/)
    const intro = parts[0]?.trim() || ''
    const items = parts.slice(1).map(item => {
      return item.replace(/^\d+[).]\s*/, '').trim()
    }).filter(Boolean)
    
    return { intro, items }
  }

  const { intro, items } = parseDescription(task.description)

  return (
    <div className="py-12 px-8">
      <div className="max-w-xl mx-auto">
        {/* Task Description */}
        <div className="mb-10">
          {intro && (
            <p className="text-stone-600 text-lg leading-relaxed" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {intro}
            </p>
          )}
          
          {items.length > 0 && (
            <ul className="mt-6 space-y-3">
              {items.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-stone-600" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Input Card */}
        <div className={`bg-white rounded-2xl border-2 transition-all duration-200 ${
          status === 'success'
            ? 'border-emerald-400 shadow-lg shadow-emerald-100' 
            : status === 'error'
              ? 'border-red-300 shadow-lg shadow-red-50'
              : isFocused 
                ? 'border-amber-400 shadow-lg shadow-amber-50' 
                : 'border-stone-200 shadow-sm'
        }`}>
          <div className="p-6">
            {/* Icon and Label */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${
                status === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                status === 'error' ? 'bg-red-100 text-red-600' :
                'bg-stone-100 text-stone-600'
              }`}>
                {content.icon}
              </div>
              <span className="text-sm font-medium text-stone-500">{content.hint}</span>
            </div>
            
            {/* Input Field */}
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  if (status === 'error') setStatus('idle')
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder={content.placeholder}
                disabled={isCompleted}
                className="flex-1 px-0 py-2 text-lg text-stone-800 bg-transparent border-none focus:outline-none placeholder:text-stone-300 disabled:text-stone-500"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
              />
              
              {!isCompleted && (
                <button
                  onClick={handleVerify}
                  disabled={!input.trim() || status === 'verifying'}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {status === 'verifying' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verifying
                    </>
                  ) : (
                    'Verify'
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Verification Results */}
          {verificationResult && (
            <div className={`px-6 py-4 border-t ${
              status === 'success' 
                ? 'bg-emerald-50 border-emerald-100' 
                : 'bg-red-50 border-red-100'
            } rounded-b-2xl`}>
              {/* Checks List */}
              {verificationResult.checks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {verificationResult.checks.map((check, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {check.passed ? (
                        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-sm ${check.passed ? 'text-emerald-700' : 'text-red-700'}`}>
                        {check.label}
                      </span>
                      {check.detail && (
                        <span className="text-xs text-stone-500 truncate max-w-[200px]">
                          {check.detail}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Status Message */}
              {status === 'success' ? (
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All checks passed! Task completed.
                </div>
              ) : verificationResult.error ? (
                <div className="flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{verificationResult.error}</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Helper Text */}
        {status === 'idle' && !isCompleted && (
          <p className="text-center text-stone-400 text-sm mt-4">
            Enter your URL and click Verify to check your GitHub profile
          </p>
        )}

        {/* Next Navigation Button */}
        {isCompleted && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleNextNavigation}
              className={`px-6 py-3 text-white rounded-full font-medium transition-colors shadow-lg flex items-center gap-2 ${
                nextNavigation?.type === 'complete' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  : nextNavigation?.type === 'day'
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                    : 'bg-stone-800 hover:bg-stone-900 shadow-stone-300'
              }`}
            >
              {nextNavigation?.type === 'complete' ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : null}
              {getNextButtonText()}
              {nextNavigation?.type !== 'complete' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
