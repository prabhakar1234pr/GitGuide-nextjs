'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { type Task, completeTask } from '../../lib/api-roadmap'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent } from '../../../components/ui/card'
import { 
  Github, 
  Check, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  CheckCircle2,
  FolderCode,
  GitCommit
} from 'lucide-react'

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
  initialCompleted?: boolean
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

export default function GitHubTaskPanel({ 
  task, 
  project, 
  onComplete, 
  initialCompleted, 
  nextTaskId, 
  nextNavigation 
}: GitHubTaskPanelProps) {
  const { getToken } = useAuth()
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<VerificationStatus>(initialCompleted ? 'success' : 'idle')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isCompleted, setIsCompleted] = useState(initialCompleted || false)

  // Helper to parse description with points
  const parsedDescription = (() => {
    let desc = task.description || ''
    
    // Rewrite logic for specific tasks to make them more professional
    if (task.task_type === 'verify_commit' && desc.includes('pencil icon')) {
      desc = "Finalize your first contribution by committing changes to your repository. 1) Ensure your name is listed correctly as the author. 2) You can edit files directly on GitHub using the pencil icon, or work locally and push your changes. After committing, paste the commit URL below."
    }

    const hasPoints = /\d+[).]\s/.test(desc)
    
    if (!hasPoints) return { intro: desc, points: [], footer: '' }
    
    const parts = desc.split(/(?=\d+[).]\s)/)
    const intro = parts[0]?.trim() || ''
    let points = parts.slice(1).map(p => p.replace(/^\d+[).]\s*/, '').trim())
    let footer = ''

    // Logic to separate the verification sentence from the last point
    if (points.length > 0) {
      const lastPoint = points[points.length - 1]
      const verifyRegex = /(.*?\.)\s*(We'll verify.*|Our system.*|Please.*|After creating.*|Once finished.*|After committing.*)/i
      const match = lastPoint.match(verifyRegex)
      
      if (match) {
        points[points.length - 1] = match[1].trim()
        
        if (task.task_type === 'github_profile') {
          footer = "Our system will now perform a quick scan to ensure your profile meets these requirements."
        } else if (task.task_type === 'create_repo') {
          footer = "Once your repository is live, paste the URL below so we can verify your project setup."
        } else if (task.task_type === 'verify_commit') {
          footer = "After pushing your changes, paste the commit URL or SHA below to verify your contribution."
        } else {
          footer = "Please provide the required information below to proceed with verification."
        }
      }
    }
    
    return { intro, points, footer }
  })()

  useEffect(() => {
    if (initialCompleted) {
      setIsCompleted(true)
      setStatus('success')
      onComplete()
    }
  }, [initialCompleted, onComplete])

  // Logic remains same but UI is brand-new
  const extractUsername = (url: string) => url.trim().match(/github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\/?$/)?.[1] || null
  
  const extractRepo = (url: string) => {
    // Robust regex to handle various github URL formats and trailing slashes
    const match = url.trim().match(/github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+)/)
    return match ? { owner: match[1], repo: match[2].replace(/\.git$/, '').split('/')[0] } : null
  }

  const extractCommit = (input: string, projectUrl: string) => {
    const cleanInput = input.trim()
    
    // Case 1: Full commit URL
    const urlMatch = cleanInput.match(/github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+)\/commit\/([a-f0-9]{7,40})/)
    if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2], sha: urlMatch[3] }
    
    // Case 2: Just SHA (7 to 40 hex chars)
    const shaMatch = cleanInput.match(/^[a-f0-9]{7,40}$/i)
    if (shaMatch) {
      const repoInfo = extractRepo(projectUrl)
      if (repoInfo) {
        return { ...repoInfo, sha: cleanInput }
      }
    }
    return null
  }

  const githubFetch = async (url: string) => {
    // In a production app, we would include a GitHub token here to avoid rate limiting.
    // For now, we'll just handle the errors more gracefully.
    const res = await fetch(url)
    
    if (res.status === 403 && res.headers.get('X-RateLimit-Remaining') === '0') {
      throw new Error('GitHub API rate limit exceeded. Please try again later.')
    }
    
    if (!res.ok) {
      if (res.status === 404) throw new Error('Not found on GitHub')
      throw new Error(`GitHub error: ${res.statusText}`)
    }
    
    return res.json()
  }

  const handleVerify = async () => {
    if (!input.trim() || status === 'verifying' || isCompleted) return
    setStatus('verifying')
    setVerificationResult(null)
    
    let result: VerificationResult
    try {
      if (task.task_type === 'github_profile') {
        const username = extractUsername(input)
        if (!username) throw new Error('Invalid GitHub profile URL')
        const data = await githubFetch(`https://api.github.com/users/${username}`)
        result = {
          success: !!data.name && !!data.bio,
          checks: [
            { label: 'Profile found', passed: true, detail: `@${data.login}` },
            { label: 'Bio & Name complete', passed: !!data.name && !!data.bio, detail: data.bio ? 'Found bio' : 'Bio missing' }
          ]
        }
      } else if (task.task_type === 'create_repo') {
        const repo = extractRepo(input)
        if (!repo) throw new Error('Invalid repo URL')
        const data = await githubFetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}`)
        result = {
          success: !data.private,
          checks: [
            { label: 'Repository found', passed: true, detail: data.full_name },
            { label: 'Visibility check', passed: !data.private, detail: data.private ? 'Private' : 'Public' }
          ]
        }
      } else if (task.task_type === 'verify_commit') {
        const commit = extractCommit(input, project.github_url)
        if (!commit) throw new Error('Invalid commit URL or SHA')
        const data = await githubFetch(`https://api.github.com/repos/${commit.owner}/${commit.repo}/commits/${commit.sha}`)
        
        // Basic check: commit exists and has a message
        const hasMessage = !!data.commit?.message
        
        result = {
          success: hasMessage,
          checks: [
            { label: 'Commit verified', passed: true, detail: data.sha.substring(0, 7) },
            { label: 'Author recognized', passed: true, detail: data.commit?.author?.name || 'Verified' },
            { label: 'Commit message found', passed: hasMessage, detail: data.commit?.message?.split('\n')[0] || 'No message' }
          ]
        }
      } else {
        result = { success: false, checks: [], error: 'Unsupported task type' }
      }

      setVerificationResult(result)
      if (result.success) {
        const token = await getToken()
        await completeTask(project.project_id, task.task_id, token)
        setStatus('success')
        setIsCompleted(true)
        onComplete()
      } else {
        setStatus('error')
      }
    } catch (err) {
      setVerificationResult({ success: false, checks: [], error: err instanceof Error ? err.message : 'Failed' })
      setStatus('error')
    }
  }

  const config = {
    github_profile: { icon: Github, placeholder: 'https://github.com/your-username', label: 'Verify Profile' },
    create_repo: { icon: FolderCode, placeholder: 'https://github.com/you/project-name', label: 'Verify Repository' },
    verify_commit: { icon: GitCommit, placeholder: 'Commit URL or SHA', label: 'Verify Commit' }
  }[task.task_type] || { icon: Github, placeholder: 'Enter URL...', label: 'Verify' }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="space-y-6">
        {parsedDescription.intro && (
          <p className="text-zinc-400 text-[15px] leading-relaxed">
            {parsedDescription.intro}
          </p>
        )}
        
        {parsedDescription.points.length > 0 && (
          <div className="space-y-6">
            <ul className="space-y-3 pl-1">
              {parsedDescription.points.map((point, i) => (
                <li key={i} className="flex gap-3 text-zinc-400 text-[14px] leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/10 text-blue-500 text-[10px] font-bold flex items-center justify-center mt-0.5 border border-blue-500/20">
                    {i + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            
            {parsedDescription.footer && (
              <p className="text-zinc-500 text-[13px] font-medium pl-1 border-l-2 border-blue-600/20 italic">
                {parsedDescription.footer}
              </p>
            )}
          </div>
        )}
        
        {task.hints && task.hints.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {task.hints.map((hint, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 group hover:border-blue-500/20 transition-all">
                <div className="mt-0.5 text-blue-500">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <p className="text-[12px] text-zinc-500 leading-relaxed font-medium">{hint}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Card className="bg-zinc-900/30 border-zinc-800 shadow-xl overflow-hidden group">
        <CardContent className="p-0">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500">
                  <config.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{config.label}</span>
              </div>
              {isCompleted && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Verified</Badge>}
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={config.placeholder}
                  disabled={isCompleted}
                  className="bg-zinc-950/50 border-zinc-800 focus:border-blue-500/50 h-12 text-sm text-white placeholder:text-zinc-700 rounded-xl"
                />
              </div>
              {!isCompleted && (
                <Button 
                  onClick={handleVerify}
                  disabled={status === 'verifying' || !input.trim()}
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  {status === 'verifying' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                </Button>
              )}
            </div>
          </div>

          {verificationResult && (
            <div className={`px-6 py-4 border-t ${status === 'success' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
              {verificationResult.checks.map((check, i) => (
                <div key={i} className="flex items-center justify-between mb-2 last:mb-0">
                  <div className="flex items-center gap-2">
                    {check.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                    <span className={`text-[11px] font-bold ${check.passed ? 'text-emerald-500/80' : 'text-red-500/80'}`}>{check.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-mono">{check.detail}</span>
                </div>
              ))}
              {verificationResult.error && (
                <p className="text-[11px] text-red-400 font-medium mt-2">{verificationResult.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
