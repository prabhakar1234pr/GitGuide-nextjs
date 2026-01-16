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
  // Track which lines have been processed to avoid double-processing
  const processedIndices = new Set<number>()

  // Helper function to normalize content (remove leading + or - and trim)
  const normalizeContent = (line: string): string => {
    let normalized = line
    if (normalized.startsWith('+') || normalized.startsWith('-')) {
      normalized = normalized.substring(1)
    }
    if (normalized.startsWith(' ')) {
      normalized = normalized.substring(1)
    }
    // Remove any trailing "\ No newline at end of file" metadata that might be part of the line
    // This shouldn't normally happen, but we normalize just in case
    return normalized.trim()
  }

  // Helper function to find next non-metadata line (skips \ No newline, headers, etc.)
  const findNextDiffLine = (startIndex: number): { index: number; line: string } | null => {
    for (let j = startIndex; j < lines.length; j++) {
      const candidate = lines[j]
      // Skip metadata lines including "\ No newline at end of file"
      if (candidate.startsWith('\\') || 
          candidate.startsWith('diff') || 
          candidate.startsWith('index') || 
          candidate.startsWith('---') || 
          candidate.startsWith('+++') ||
          candidate.startsWith('@@') ||
          candidate.trim() === '') {
        continue
      }
      return { index: j, line: candidate }
    }
    return null
  }

  for (let i = 0; i < lines.length; i++) {
    // Skip already processed lines
    if (processedIndices.has(i)) {
      continue
    }

    const line = lines[i]
    
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
        processedIndices.add(i)
        continue
      }
    }

    if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) {
      oldLines.push({ type: 'header', content: line })
      newLines.push({ type: 'header', content: line })
      processedIndices.add(i)
      continue
    }

    // Skip "No newline" messages and empty lines
    if (line.startsWith('\\') || line.trim() === '') {
      processedIndices.add(i)
      continue
    }

    const isAdded = line.startsWith('+') && !line.startsWith('+++')
    const isRemoved = line.startsWith('-') && !line.startsWith('---')
    const isContext = line.startsWith(' ')

    if (isRemoved) {
      oldLineNum++
      const removedContent = normalizeContent(line)
      
      // Look ahead to find the next added line with same content (unchanged line)
      // This handles cases where a line is deleted and re-added with identical content
      // (often due to "\ No newline at end of file" causing Git to show it as removed+added)
      const nextDiff = findNextDiffLine(i + 1)
      
      if (nextDiff && nextDiff.line.startsWith('+') && !nextDiff.line.startsWith('+++')) {
        const addedContent = normalizeContent(nextDiff.line)
        
        // If content matches exactly (ignoring diff metadata), this is an unchanged line
        if (removedContent === addedContent) {
          // Treat as context (unchanged) - same line in both old and new
          // This ensures unchanged lines are NOT shown as green in the modified view
          newLineNum++
          oldLines.push({
            oldLine: oldLineNum,
            newLine: newLineNum,
            content: removedContent,
            type: 'context',
          })
          newLines.push({
            oldLine: oldLineNum,
            newLine: newLineNum,
            content: removedContent,
            type: 'context',
          })
          // Mark both lines as processed
          processedIndices.add(i)
          processedIndices.add(nextDiff.index)
          continue
        }
      }
      
      // Real removal (not matched with an identical addition)
      oldLines.push({
        oldLine: oldLineNum,
        newLine: undefined,
        content: removedContent,
        type: 'removed',
      })
      newLines.push({
        oldLine: oldLineNum,
        newLine: undefined,
        content: '',
        type: 'removed',
      })
      processedIndices.add(i)
    } else if (isAdded) {
      // Check if this added line was already processed as part of a removed+added pair
      if (processedIndices.has(i)) {
        continue
      }
      
      newLineNum++
      const addedContent = normalizeContent(line)
      
      // Real addition (not matched with a removal)
      oldLines.push({
        oldLine: undefined,
        newLine: newLineNum,
        content: '',
        type: 'added',
      })
      newLines.push({
        oldLine: undefined,
        newLine: newLineNum,
        content: addedContent,
        type: 'added',
      })
      processedIndices.add(i)
    } else if (isContext) {
      oldLineNum++
      newLineNum++
      const content = normalizeContent(line)
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
      processedIndices.add(i)
    } else {
      // Unknown line type, skip it
      processedIndices.add(i)
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
    // Use parsed lines (includes headers)
    const allLines = oldLines
    
    if (allLines.filter(l => l.type !== 'header').length === 0) {
      return <div className="text-zinc-500 text-sm p-4">No changes detected (file is identical to HEAD)</div>
    }

    // Build unified view from parsed lines
    const unifiedLines: Array<{ type: 'added' | 'removed' | 'context' | 'header'; content: string; oldLine?: number; newLine?: number }> = []
    
    // Process lines to create unified view
    for (let i = 0; i < oldLines.length; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]
      
      if (oldLine.type === 'header') {
        unifiedLines.push({ type: 'header', content: oldLine.content })
      } else if (oldLine.type === 'context') {
        // Context line appears once in unified view
        unifiedLines.push({
          type: 'context',
          content: oldLine.content,
          oldLine: oldLine.oldLine,
          newLine: oldLine.newLine,
        })
      } else if (oldLine.type === 'removed') {
        // Removed line
        unifiedLines.push({
          type: 'removed',
          content: oldLine.content,
          oldLine: oldLine.oldLine,
        })
      } else if (oldLine.type === 'added') {
        // Added line
        unifiedLines.push({
          type: 'added',
          content: newLine.content,
          newLine: newLine.newLine,
        })
      }
    }
    
    // Count changes per hunk for headers
    let currentHunkIndex = -1
    const hunkCounts: Array<{ added: number; removed: number }> = []
    
    for (let i = 0; i < unifiedLines.length; i++) {
      if (unifiedLines[i].type === 'header') {
        currentHunkIndex++
        hunkCounts[currentHunkIndex] = { added: 0, removed: 0 }
      } else if (currentHunkIndex >= 0) {
        if (unifiedLines[i].type === 'added') {
          hunkCounts[currentHunkIndex].added++
        } else if (unifiedLines[i].type === 'removed') {
          hunkCounts[currentHunkIndex].removed++
        }
      }
    }
    
    // Render unified view
    let hunkIndex = -1
    return unifiedLines.map((line, index) => {
      if (line.type === 'header') {
        hunkIndex++
        const match = line.content.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)
        if (match) {
          const newStart = parseInt(match[3])
          const counts = hunkCounts[hunkIndex] || { added: 0, removed: 0 }
          const parts: string[] = []
          if (counts.removed > 0) {
            parts.push(`${counts.removed} line${counts.removed > 1 ? 's' : ''} removed`)
          }
          if (counts.added > 0) {
            parts.push(`${counts.added} line${counts.added > 1 ? 's' : ''} added`)
          }
          const summary = parts.length > 0 ? ` (${parts.join(', ')})` : ''
          
          return (
            <div key={index} className="bg-zinc-800/50 text-zinc-400 font-semibold px-4 py-2 border-y border-zinc-700">
              Changes at line {newStart}{summary}
            </div>
          )
        }
      }

      let className = 'font-mono text-xs px-4 py-0.5'
      let prefix = ''
      
      if (line.type === 'added') {
        className += ' bg-emerald-500/10 text-emerald-300'
        prefix = '+'
      } else if (line.type === 'removed') {
        className += ' bg-red-500/10 text-red-300'
        prefix = '-'
      } else {
        // Context (unchanged) - normal color
        className += ' text-zinc-400'
        prefix = ' '
      }

      return (
        <div key={index} className={className}>
          {prefix}{line.content || '\u00A0'}
        </div>
      )
    })
  }

  const renderSplitDiff = () => {
    // Filter out header/metadata lines (Git diff metadata)
    const filteredOldLines = oldLines.filter(line => line.type !== 'header')
    const filteredNewLines = newLines.filter(line => line.type !== 'header')
    
    if (filteredOldLines.length === 0 && filteredNewLines.length === 0) {
      return <div className="text-zinc-500 text-sm p-4">No changes detected</div>
    }

    return (
      <div className="grid grid-cols-2 divide-x divide-zinc-800 h-full">
        {/* Old File */}
        <div className="bg-zinc-950/50 flex flex-col min-h-0">
          <div className="sticky top-0 bg-zinc-900/80 border-b border-zinc-800 px-4 py-2 flex items-center gap-2 z-10 shrink-0">
            <FileText className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-semibold text-zinc-300">Original</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="font-mono text-xs">
              {filteredOldLines.map((line, index) => {
                let className = 'px-4 py-0.5 flex items-start gap-2'
                if (line.type === 'removed') {
                  className += ' bg-red-500/10 text-red-300'
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
          </ScrollArea>
        </div>

        {/* New File */}
        <div className="bg-zinc-950/50 flex flex-col min-h-0">
          <div className="sticky top-0 bg-zinc-900/80 border-b border-zinc-800 px-4 py-2 flex items-center gap-2 z-10 shrink-0">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-semibold text-zinc-300">Modified</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="font-mono text-xs">
              {filteredNewLines.map((line, index) => {
                let className = 'px-4 py-0.5 flex items-start gap-2'
                if (line.type === 'added') {
                  className += ' bg-emerald-500/10 text-emerald-300'
                } else if (line.type === 'removed') {
                  className += ' bg-red-500/10 text-red-300'
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
          </ScrollArea>
        </div>
      </div>
    )
  }

  return (
    <Card className="bg-zinc-900/40 border-zinc-800 h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
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
      <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="flex-1">
          <div ref={scrollRef}>
            {viewMode === 'split' ? renderSplitDiff() : renderUnifiedDiff()}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
