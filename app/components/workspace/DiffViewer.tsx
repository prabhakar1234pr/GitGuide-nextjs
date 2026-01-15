'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Sidebar, FileText } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DiffViewerProps {
  filePath: string
  diff: string
  staged: boolean
  onClose: () => void
}

interface DiffLine {
  oldLine?: number
  newLine?: number
  content: string
  type: 'added' | 'removed' | 'context' | 'header'
}

function parseDiff(diff: string): { oldLines: DiffLine[]; newLines: DiffLine[]; hunks: Array<{ oldStart: number; oldCount: number; newStart: number; newCount: number }> } {
  if (!diff || diff.trim() === '') {
    return { oldLines: [], newLines: [], hunks: [] }
  }

  const lines = diff.split('\n')
  const oldLines: DiffLine[] = []
  const newLines: DiffLine[] = []
  const hunks: Array<{ oldStart: number; oldCount: number; newStart: number; newCount: number }> = []

  let oldLineNum = 0
  let newLineNum = 0
  let currentHunk: { oldStart: number; oldCount: number; newStart: number; newCount: number } | null = null

  for (const line of lines) {
    if (line.startsWith('@@')) {
      // Parse hunk header: @@ -oldStart,oldCount +newStart,newCount @@
      const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)
      if (match) {
        if (currentHunk) {
          hunks.push(currentHunk)
        }
        oldLineNum = parseInt(match[1]) - 1
        newLineNum = parseInt(match[3]) - 1
        currentHunk = {
          oldStart: parseInt(match[1]),
          oldCount: parseInt(match[2] || '1'),
          newStart: parseInt(match[3]),
          newCount: parseInt(match[4] || '1'),
        }
        oldLines.push({ type: 'header', content: line })
        newLines.push({ type: 'header', content: line })
        continue
      }
    }

    if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) {
      oldLines.push({ type: 'header', content: line })
      newLines.push({ type: 'header', content: line })
      continue
    }

    const isAdded = line.startsWith('+') && !line.startsWith('+++')
    const isRemoved = line.startsWith('-') && !line.startsWith('---')
    const isContext = line.startsWith(' ')

    if (isRemoved) {
      oldLineNum++
      oldLines.push({
        oldLine: oldLineNum,
        newLine: undefined,
        content: line.substring(1),
        type: 'removed',
      })
      newLines.push({
        oldLine: oldLineNum,
        newLine: undefined,
        content: '',
        type: 'removed',
      })
    } else if (isAdded) {
      newLineNum++
      oldLines.push({
        oldLine: undefined,
        newLine: newLineNum,
        content: '',
        type: 'added',
      })
      newLines.push({
        oldLine: undefined,
        newLine: newLineNum,
        content: line.substring(1),
        type: 'added',
      })
    } else if (isContext) {
      oldLineNum++
      newLineNum++
      const content = line.substring(1)
      oldLines.push({
        oldLine: oldLineNum,
        newLine: newLineNum,
        content,
        type: 'context',
      })
      newLines.push({
        oldLine: oldLineNum,
        newLine: newLineNum,
        content,
        type: 'context',
      })
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk)
  }

  return { oldLines, newLines, hunks }
}

export default function DiffViewer({ filePath, diff, staged, onClose }: DiffViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('split')

  const { oldLines, newLines, hunks } = parseDiff(diff)

  useEffect(() => {
    // Auto-scroll to first change
    if (scrollRef.current) {
      const firstChange = scrollRef.current.querySelector('.diff-line-added, .diff-line-removed')
      if (firstChange) {
        firstChange.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [diff])

  const renderUnifiedDiff = () => {
    if (!diff || diff.trim() === '') {
      return <div className="text-zinc-500 text-sm p-4">No changes detected</div>
    }

    const lines = diff.split('\n')
    return lines.map((line, index) => {
      const isAdded = line.startsWith('+') && !line.startsWith('+++')
      const isRemoved = line.startsWith('-') && !line.startsWith('---')

      let className = 'font-mono text-xs px-4 py-0.5'
      if (isAdded) {
        className += ' bg-emerald-500/10 text-emerald-300'
      } else if (isRemoved) {
        className += ' bg-red-500/10 text-red-300'
      } else if (line.startsWith('@@')) {
        className += ' bg-zinc-800/50 text-zinc-400 font-semibold'
      } else if (line.startsWith('diff') || line.startsWith('index')) {
        className += ' text-zinc-500'
      } else {
        className += ' text-zinc-400'
      }

      return (
        <div key={index} className={className}>
          {line || '\u00A0'}
        </div>
      )
    })
  }

  const renderSplitDiff = () => {
    if (oldLines.length === 0 && newLines.length === 0) {
      return <div className="text-zinc-500 text-sm p-4">No changes detected</div>
    }

    return (
      <div className="grid grid-cols-2 divide-x divide-zinc-800">
        {/* Old File */}
        <div className="bg-zinc-950/50">
          <div className="sticky top-0 bg-zinc-900/80 border-b border-zinc-800 px-4 py-2 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-mono text-zinc-400">Original</span>
          </div>
          <div className="font-mono text-xs">
            {oldLines.map((line, index) => {
              let className = 'px-4 py-0.5 flex items-start gap-2'
              if (line.type === 'removed') {
                className += ' bg-red-500/10 text-red-300'
              } else if (line.type === 'header') {
                className += ' bg-zinc-800/50 text-zinc-500 font-semibold'
              } else if (line.type === 'context') {
                className += ' text-zinc-400'
              } else {
                className += ' text-zinc-600'
              }

              return (
                <div key={index} className={className}>
                  <span className="text-zinc-600 text-[10px] w-8 text-right shrink-0">
                    {line.oldLine || ''}
                  </span>
                  <span className="flex-1">{line.content || '\u00A0'}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* New File */}
        <div className="bg-zinc-950/50">
          <div className="sticky top-0 bg-zinc-900/80 border-b border-zinc-800 px-4 py-2 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-mono text-zinc-400">Modified</span>
          </div>
          <div className="font-mono text-xs">
            {newLines.map((line, index) => {
              let className = 'px-4 py-0.5 flex items-start gap-2'
              if (line.type === 'added') {
                className += ' bg-emerald-500/10 text-emerald-300'
              } else if (line.type === 'removed') {
                className += ' bg-red-500/10 text-red-300'
              } else if (line.type === 'header') {
                className += ' bg-zinc-800/50 text-zinc-500 font-semibold'
              } else if (line.type === 'context') {
                className += ' text-zinc-400'
              } else {
                className += ' text-zinc-600'
              }

              return (
                <div key={index} className={className}>
                  <span className="text-zinc-600 text-[10px] w-8 text-right shrink-0">
                    {line.newLine || ''}
                  </span>
                  <span className="flex-1">{line.content || '\u00A0'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="bg-zinc-900/40 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono text-zinc-300 truncate flex-1">
            {filePath}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'unified' | 'split')}>
              <TabsList className="h-7 bg-zinc-800">
                <TabsTrigger value="split" className="text-[10px] px-2 h-6">
                  <Sidebar className="w-3 h-3 mr-1" />
                  Split
                </TabsTrigger>
                <TabsTrigger value="unified" className="text-[10px] px-2 h-6">
                  Unified
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {staged ? 'Staged' : 'Unstaged'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div ref={scrollRef}>
            {viewMode === 'split' ? renderSplitDiff() : renderUnifiedDiff()}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
