'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { type Task, completeTask } from '../../lib/api-roadmap'

interface QuizPanelProps {
  task: Task
  projectId: string
  onComplete: () => void
}

export default function QuizPanel({ task, projectId, onComplete, initialCompleted }: QuizPanelProps & { initialCompleted?: boolean }) {
  const { getToken } = useAuth()
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isCompleted, setIsCompleted] = useState(initialCompleted || false)
  
  useEffect(() => {
    if (initialCompleted) {
      setIsCompleted(true)
      onComplete()
    }
  }, [initialCompleted, onComplete])

  // Parse questions from task description (assuming format like "Q1: ... Q2: ...")
  const questions = task.description.split(/(?=Q\d+:)/i).filter(q => q.trim())

  // Validate and auto-complete when all questions are answered
  useEffect(() => {
    const validateAndComplete = async () => {
      const allAnswered = questions.every((_, index) => {
        const answer = answers[index]
        return answer && answer.trim().length >= 5
      })

      if (allAnswered && questions.length > 0 && !isCompleted) {
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

    const timer = setTimeout(validateAndComplete, 2000)
    return () => clearTimeout(timer)
  }, [answers, questions, isCompleted, projectId, task.task_id, getToken, onComplete])

  const handleAnswerChange = (index: number, answer: string) => {
    setAnswers({ ...answers, [index]: answer })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quiz</h2>
          
          {questions.map((question, index) => (
            <div key={index} className="p-4 bg-[#252526] rounded border border-zinc-800">
              <div className="text-zinc-300 mb-3 whitespace-pre-wrap">{question.trim()}</div>
              <textarea
                value={answers[index] || ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Your answer..."
                className="w-full h-24 bg-[#1e1e1e] text-zinc-200 p-3 rounded border border-zinc-700 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          ))}
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

