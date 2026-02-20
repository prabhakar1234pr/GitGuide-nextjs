"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GitMerge, Loader2, AlertTriangle } from "lucide-react";
import type { BranchInfo } from "../../lib/api-git";

interface MergeBranchesProps {
  branches: BranchInfo[];
  currentBranch?: string;
  onMerge: (branch: string, noFF: boolean, message?: string) => Promise<void>;
  onAbortMerge: () => Promise<void>;
  hasConflicts?: boolean;
  isLoading?: boolean;
  readOnly?: boolean;
}

export default function MergeBranches({
  branches,
  currentBranch,
  onMerge,
  onAbortMerge,
  hasConflicts = false,
  isLoading = false,
  readOnly = false,
}: MergeBranchesProps) {
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [branchToMerge, setBranchToMerge] = useState<string | null>(null);
  const [mergeMessage, setMergeMessage] = useState("");
  const [noFF, setNoFF] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    if (!branchToMerge) return;
    setIsMerging(true);
    try {
      await onMerge(branchToMerge, noFF, mergeMessage.trim() || undefined);
      setMergeDialogOpen(false);
      setBranchToMerge(null);
      setMergeMessage("");
      setNoFF(false);
    } catch (err) {
      console.error("Failed to merge:", err);
    } finally {
      setIsMerging(false);
    }
  };

  const availableBranches = branches.filter(
    (b) => b.name !== currentBranch && !b.current
  );

  return (
    <>
      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <GitMerge className="w-4 h-4" />
              Merge Branches
            </CardTitle>
            {hasConflicts && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 text-yellow-500 border-yellow-500/30"
              >
                <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                Conflicts
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-3 space-y-2">
            {hasConflicts ? (
              <div className="space-y-3">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[11px] font-medium text-yellow-400 mb-1">
                        Merge Conflicts Detected
                      </p>
                      <p className="text-[10px] text-zinc-400 mb-2">
                        Resolve conflicts in the Conflicts tab, then complete
                        the merge.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onAbortMerge}
                        disabled={isLoading || readOnly}
                        className="h-7 text-[10px] border-red-500/30 text-red-400 hover:text-red-300"
                      >
                        Abort Merge
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="text-[11px] text-zinc-400 mb-2">
                  Merge a branch into{" "}
                  <span className="font-mono text-zinc-300">
                    {currentBranch || "current branch"}
                  </span>
                </div>
                {availableBranches.length === 0 ? (
                  <div className="text-zinc-500 text-sm p-4 text-center">
                    No other branches to merge
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableBranches.map((branch) => (
                      <div
                        key={branch.name}
                        className="flex items-center justify-between p-2 rounded hover:bg-zinc-800/50 border border-zinc-700"
                      >
                        <span className="text-[11px] font-mono text-zinc-300">
                          {branch.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBranchToMerge(branch.name);
                            setMergeDialogOpen(true);
                          }}
                          disabled={isLoading || readOnly}
                          className="h-6 px-2 text-[10px] text-zinc-400 hover:text-white"
                        >
                          Merge
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="bg-[#0c0c0e] border border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Merge Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                Merge{" "}
                <span className="font-mono text-zinc-400">{branchToMerge}</span>{" "}
                into{" "}
                <span className="font-mono text-zinc-400">{currentBranch}</span>
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                Merge Message (optional)
              </label>
              <Input
                value={mergeMessage}
                onChange={(e) => setMergeMessage(e.target.value)}
                placeholder="Merge branch-name into main"
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="no-ff"
                checked={noFF}
                onChange={(e) => setNoFF(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="no-ff"
                className="text-[11px] text-zinc-400 cursor-pointer"
              >
                Create merge commit (even if fast-forward is possible)
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setMergeDialogOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={isMerging || !branchToMerge || readOnly}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Merging...
                </>
              ) : (
                "Merge"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
