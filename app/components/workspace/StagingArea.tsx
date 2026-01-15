'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Minus, FileText, Eye, X } from 'lucide-react'
import type { GitStatusResponse } from '../../lib/api-git'

interface StagingAreaProps {
  status: GitStatusResponse | null
  onStage: (files?: string[]) => Promise<void>
  onUnstage: (files?: string[]) => Promise<void>
  onViewDiff?: (filePath: string, staged: boolean) => void
  isLoading?: boolean
}

export default function StagingArea({
  status,
  onStage,
  onUnstage,
  onViewDiff,
  isLoading = false
}: StagingAreaProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const stagedFiles = status?.staged || []
  const unstagedFiles = [
    ...(status?.modified || []).filter(f => !stagedFiles.includes(f)),
    ...(status?.untracked || [])
  ]

  const handleStage = async (file?: string) => {
    await onStage(file ? [file] : undefined)
    setSelectedFile(null)
  }

  const handleUnstage = async (file?: string) => {
    await onUnstage(file ? [file] : undefined)
    setSelectedFile(null)
  }

  const handleViewDiff = (filePath: string, staged: boolean) => {
    setSelectedFile(filePath)
    if (onViewDiff) {
      onViewDiff(filePath, staged)
    }
  }

  return (
    <div className="space-y-4">
      {/* Staged Files Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-emerald-400 border-emerald-500/20">
            Staged ({stagedFiles.length})
          </Badge>
          {stagedFiles.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUnstage()}
              disabled={isLoading}
              className="h-6 px-2 text-[10px] text-zinc-400 hover:text-white"
            >
              Unstage All
            </Button>
          )}
        </div>
        <ScrollArea className="h-32 border border-zinc-800 rounded-md bg-zinc-950/50">
          <div className="p-2">
            {stagedFiles.length === 0 ? (
              <div className="p-3 text-[11px] text-zinc-600 text-center">No staged files</div>
            ) : (
              <div className="space-y-1">
                {stagedFiles.map((file) => (
                  <div
                    key={file}
                    className={`flex items-center justify-between p-1.5 rounded hover:bg-zinc-800/50 ${
                      selectedFile === file ? 'bg-zinc-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span className="text-[11px] text-zinc-300 truncate font-mono">{file}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {onViewDiff && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDiff(file, true)}
                          className="h-6 w-6 text-zinc-500 hover:text-white"
                          title="View diff"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnstage(file)}
                        disabled={isLoading}
                        className="h-6 w-6 text-zinc-500 hover:text-red-400"
                        title="Unstage"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Unstaged Files Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-yellow-500 border-yellow-500/20">
            Unstaged ({unstagedFiles.length})
          </Badge>
          {unstagedFiles.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStage()}
              disabled={isLoading}
              className="h-6 px-2 text-[10px] text-zinc-400 hover:text-white"
            >
              Stage All
            </Button>
          )}
        </div>
        <ScrollArea className="h-32 border border-zinc-800 rounded-md bg-zinc-950/50">
          <div className="p-2">
            {unstagedFiles.length === 0 ? (
              <div className="p-3 text-[11px] text-zinc-600 text-center">No unstaged files</div>
            ) : (
              <div className="space-y-1">
                {unstagedFiles.map((file) => (
                  <div
                    key={file}
                    className={`flex items-center justify-between p-1.5 rounded hover:bg-zinc-800/50 ${
                      selectedFile === file ? 'bg-zinc-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                      <span className="text-[11px] text-zinc-300 truncate font-mono">{file}</span>
                      {status?.untracked?.includes(file) && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 text-zinc-500 border-zinc-700 shrink-0">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {onViewDiff && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDiff(file, false)}
                          className="h-6 w-6 text-zinc-500 hover:text-white"
                          title="View diff"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStage(file)}
                        disabled={isLoading}
                        className="h-6 w-6 text-zinc-500 hover:text-emerald-400"
                        title="Stage"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
