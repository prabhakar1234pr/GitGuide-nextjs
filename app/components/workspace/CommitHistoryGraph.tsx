"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitBranch, Loader2, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CommitGraphEntry } from "../../lib/api-git";

interface CommitHistoryGraphProps {
  commits: CommitGraphEntry[];
  branches: Record<string, string>;
  currentBranch?: string;
  onCommitClick?: (sha: string) => void;
  onResetToCommit?: (sha: string) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

export default function CommitHistoryGraph({
  commits,
  currentBranch,
  onCommitClick,
  onResetToCommit,
  isLoading = false,
  readOnly = false,
}: CommitHistoryGraphProps) {
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Build commit map for quick lookup
  const commitMap = useMemo(() => {
    const map = new Map<string, CommitGraphEntry>();
    commits.forEach((commit) => {
      map.set(commit.sha, commit);
    });
    return map;
  }, [commits]);

  // Build graph structure
  const _graphData = useMemo(() => {
    const nodes: Array<{
      commit: CommitGraphEntry;
      x: number;
      y: number;
      level: number;
    }> = [];
    const edges: Array<{ from: string; to: string }> = [];
    const levelMap = new Map<string, number>();
    const processed = new Set<string>();

    // Calculate levels (distance from HEAD)
    const calculateLevel = (
      sha: string,
      visited: Set<string> = new Set()
    ): number => {
      if (visited.has(sha)) return 0;
      if (levelMap.has(sha)) return levelMap.get(sha)!;

      visited.add(sha);
      const commit = commitMap.get(sha);
      if (!commit || commit.parents.length === 0) {
        levelMap.set(sha, 0);
        return 0;
      }

      const maxParentLevel = Math.max(
        ...commit.parents.map((p) => calculateLevel(p, visited))
      );
      const level = maxParentLevel + 1;
      levelMap.set(sha, level);
      return level;
    };

    commits.forEach((commit) => {
      if (!processed.has(commit.sha)) {
        calculateLevel(commit.sha);
        processed.add(commit.sha);
      }
    });

    // Build nodes and edges
    commits.forEach((commit, index) => {
      const level = levelMap.get(commit.sha) || 0;
      nodes.push({
        commit,
        x: level * 120,
        y: index * 60,
        level,
      });

      commit.parents.forEach((parent) => {
        if (commitMap.has(parent)) {
          edges.push({ from: commit.sha, to: parent });
        }
      });
    });

    return { nodes, edges };
  }, [commits, commitMap]);

  if (isLoading) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (commits.length === 0) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardContent className="p-8 text-center text-zinc-500 text-sm">
          No commits found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/40 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Commit History
          </CardTitle>
          {currentBranch && (
            <span className="text-[10px] text-zinc-500 font-mono">
              {currentBranch}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-2">
            {commits.map((commit) => {
              const isSelected = selectedCommit === commit.sha;
              const isCurrentBranch = commit.branches.includes(
                currentBranch || ""
              );

              return (
                <div
                  key={commit.sha}
                  onClick={() => {
                    setSelectedCommit(commit.sha);
                    if (onCommitClick) {
                      onCommitClick(commit.sha);
                    }
                  }}
                  className={`
                    p-3 rounded-md border cursor-pointer transition-colors
                    ${
                      isSelected
                        ? "bg-blue-500/10 border-blue-500/50"
                        : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-zinc-400">
                          {commit.sha.slice(0, 7)}
                        </span>
                        {commit.branches.length > 0 && (
                          <div className="flex items-center gap-1">
                            {commit.branches.map((branch, idx) => (
                              <span
                                key={`${commit.sha}-${branch}-${idx}`}
                                className={`
                                  text-[9px] px-1.5 py-0.5 rounded font-mono
                                  ${
                                    isCurrentBranch
                                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                      : "bg-zinc-700/50 text-zinc-400 border border-zinc-600"
                                  }
                                `}
                              >
                                {branch}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-300 font-medium mb-1">
                        {commit.message}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {commit.author_name} •{" "}
                        {new Date(commit.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {commit.parents.length > 1 && (
                        <div className="text-[9px] text-zinc-600">Merge</div>
                      )}
                      {onResetToCommit && !readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowResetConfirm(commit.sha);
                          }}
                          title="Reset to this commit"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={showResetConfirm !== null}
        onOpenChange={(open) => !open && setShowResetConfirm(null)}
      >
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-red-400">Reset to Commit</DialogTitle>
            <DialogDescription className="text-zinc-400">
              This will reset your current branch to commit{" "}
              <span className="font-mono text-zinc-300">
                {showResetConfirm?.slice(0, 7)}
              </span>
              .
              <br />
              <strong className="text-red-400">Warning:</strong> This will
              discard all uncommitted changes and commits after this point.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(null)}
              disabled={isResetting}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!showResetConfirm || !onResetToCommit) return;
                setIsResetting(true);
                try {
                  await onResetToCommit(showResetConfirm);
                  setShowResetConfirm(null);
                } catch (error) {
                  console.error("Failed to reset:", error);
                } finally {
                  setIsResetting(false);
                }
              }}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isResetting ? "Resetting..." : "Reset to Commit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
