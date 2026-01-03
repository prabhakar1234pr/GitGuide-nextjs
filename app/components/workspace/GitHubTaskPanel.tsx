'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { type Task, completeTask } from '../../lib/api-roadmap'

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
}

export default function GitHubTaskPanel({ task, project, onComplete, initialCompleted }: GitHubTaskPanelProps & { initialCompleted?: boolean }) {
  const { getToken } = useAuth()
  const [input, setInput] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [isCompleted, setIsCompleted] = useState(initialCompleted || false)
  
  useEffect(() => {
    if (initialCompleted) {
      setIsCompleted(true)
      setIsVerified(true)
      onComplete()
    }
  }, [initialCompleted, onComplete])

  // Validate URL format
  const validateUrl = (url: string, taskType: string): boolean => {
    if (!url.trim()) return false
    
    if (taskType === 'github_profile') {
      const pattern = /^https?:\/\/github\.com\/[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}\/?$/
      return pattern.test(url.trim())
    } else if (taskType === 'create_repo') {
      const pattern = /^https?:\/\/github\.com\/[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}\/[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}\/?$/
      return pattern.test(url.trim())
    } else if (taskType === 'verify_commit') {
      // Can be URL or SHA
      if (url.startsWith('http')) {
        const pattern = /^https?:\/\/github\.com\/[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}\/[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}\/commit\/[a-f0-9]{7,40}$/
        return pattern.test(url.trim())
      } else {
        const shaPattern = /^[a-f0-9]{7,40}$/i
        return shaPattern.test(url.trim())
      }
    }
    return false
  }

  // Auto-complete when URL is valid
  useEffect(() => {
    const validateAndComplete = async () => {
      if (validateUrl(input, task.task_type) && !isCompleted) {
        setIsVerified(true)
        try {
          const token = await getToken()
          if (!token) return
          
          await completeTask(project.project_id, task.task_id, token)
          setIsCompleted(true)
          onComplete()
        } catch (error) {
          console.error('Failed to complete task:', error)
        }
      } else if (!validateUrl(input, task.task_type)) {
        setIsVerified(false)
      }
    }

    const timer = setTimeout(validateAndComplete, 1000)
    return () => clearTimeout(timer)
  }, [input, task.task_type, isCompleted, project.project_id, task.task_id, getToken, onComplete])

  const handleVerify = () => {
    if (validateUrl(input, task.task_type)) {
      setIsVerified(true)
    }
  }

  const getTaskSpecificContent = () => {
    switch (task.task_type) {
      case 'github_profile':
        return {
          title: 'GitHub Profile',
          placeholder: 'Paste your GitHub profile URL here...',
          verifyLabel: 'Verify Profile'
        }
      case 'create_repo':
        return {
          title: 'Create Repository',
          placeholder: 'Paste your repository URL here...',
          verifyLabel: 'Verify Repository'
        }
      case 'verify_commit':
        return {
          title: 'Verify Commit',
          placeholder: 'Paste your commit SHA or URL here...',
          verifyLabel: 'Verify Commit'
        }
      default:
        return {
          title: 'GitHub Task',
          placeholder: 'Enter information...',
          verifyLabel: 'Verify'
        }
    }
  }

  const content = getTaskSpecificContent()

  return (
    <div className="flex flex-col h-full">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">{content.title}</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">{task.description}</p>
          </div>

          <div className="p-4 bg-[#252526] rounded border border-zinc-800">
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              {content.title} URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={content.placeholder}
                className="flex-1 px-3 py-2 bg-[#1e1e1e] text-zinc-200 rounded border border-zinc-700 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleVerify}
                disabled={!input.trim() || isVerified}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
              >
                {isVerified ? 'Verified ✓' : content.verifyLabel}
              </button>
            </div>
            {isVerified && (
              <p className="mt-2 text-sm text-green-400">✓ Verification successful!</p>
            )}
          </div>

          <div className="p-4 bg-[#252526] rounded border border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">Project Repository</h3>
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {project.github_url} →
            </a>
          </div>
        </div>
      </div>

      {/* Status */}
      {isCompleted && (
        <div className="px-4 py-3 border-t border-zinc-800 bg-[#252526]">
          <div className="w-full px-4 py-2 bg-green-600/20 text-green-400 text-sm font-medium rounded border border-green-500/30 text-center">
            ✓ Task Completed
          </div>
        </div>
      )}
    </div>
  )
}

