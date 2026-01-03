'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { type Task, completeTask } from '../../lib/api-roadmap'

interface CodeEditorProps {
  task: Task
  projectId: string
  onComplete: () => void
}

export default function CodeEditor({ task, projectId, onComplete, initialCompleted }: CodeEditorProps & { initialCompleted?: boolean }) {
  const { getToken } = useAuth()
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(initialCompleted || false)
  
  useEffect(() => {
    if (initialCompleted) {
      setIsCompleted(true)
      onComplete()
    }
  }, [initialCompleted, onComplete])

  // Validate and auto-complete when code meets requirements
  useEffect(() => {
    const validateAndComplete = async () => {
      if (code.trim().length >= 10 && !isCompleted) {
        // Basic validation: code has sufficient content
        try {
          const token = await getToken()
          if (!token) return
          
          await completeTask(projectId, task.task_id, token)
          setIsCompleted(true)
          onComplete()
        } catch (error) {
          console.error('Failed to complete task:', error)
        }
      }
    }

    // Debounce validation
    const timer = setTimeout(validateAndComplete, 2000)
    return () => clearTimeout(timer)
  }, [code, isCompleted, projectId, task.task_id, getToken, onComplete])

  const handleRun = async () => {
    setIsRunning(true)
    // Simulate code execution
    setTimeout(() => {
      setOutput('Code executed successfully!')
      setIsRunning(false)
    }, 1000)
  }

  const handleSave = () => {
    // Save code logic here
    console.log('Saving code:', code)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="px-4 py-2 border-b border-zinc-800 bg-[#252526] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Code Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex">
        <div className="flex-1 p-4">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your code here..."
            className="w-full h-full bg-[#1e1e1e] text-zinc-200 font-mono text-sm p-4 rounded border border-zinc-800 focus:outline-none focus:border-blue-500 resize-none"
            style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
          />
        </div>
      </div>

      {/* Output Panel */}
      {output && (
        <div className="border-t border-zinc-800 bg-[#252526] p-4">
          <h3 className="text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wide">Output</h3>
          <pre className="text-sm text-zinc-400 font-mono whitespace-pre-wrap">{output}</pre>
        </div>
      )}

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

