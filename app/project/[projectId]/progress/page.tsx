"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getEmployeesProgress,
  type EmployeeProgress,
} from "@/app/lib/api-client";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Github,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EmployeesProgressPage() {
  const params = useParams();
  const { getToken } = useAuth();
  const projectId = params.projectId as string;

  const [employees, setEmployees] = useState<EmployeeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await getEmployeesProgress(projectId, token);
        if (res.success) {
          setEmployees(res.employees);
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load employee progress"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId, getToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const pct = (done: number, total: number) =>
    total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href={`/project/${projectId}`}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to project
        </Link>

        <h1 className="text-2xl font-semibold mb-2">Employee Progress</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Track the progress of employees who have access to this project.
        </p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {employees.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500">
              No employees have been granted access yet.
            </p>
            <Link
              href={`/project/${projectId}/access`}
              className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
            >
              Grant access to employees
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {employees.map((emp) => {
              const taskPct = pct(emp.tasks_completed, emp.total_tasks);
              return (
                <div
                  key={emp.user_id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-medium">
                        {emp.name || emp.email}
                      </h3>
                      {emp.name && (
                        <p className="text-zinc-500 text-sm">{emp.email}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {emp.github_connected ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          GitHub Connected
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">
                          GitHub Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  {(emp.github_username || emp.user_repo_url) && (
                    <div className="flex items-center gap-4 mb-4 text-xs text-zinc-500">
                      {emp.github_username && (
                        <span className="flex items-center gap-1">
                          <Github className="w-3 h-3" />@{emp.github_username}
                        </span>
                      )}
                      {emp.user_repo_url && (
                        <a
                          href={emp.user_repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Repository
                        </a>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-500">Days</span>
                        <span className="text-zinc-300">
                          {emp.days_completed}/{emp.total_days}
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{
                            width: `${pct(emp.days_completed, emp.total_days)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-500">Concepts</span>
                        <span className="text-zinc-300">
                          {emp.concepts_completed}/{emp.total_concepts}
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{
                            width: `${pct(emp.concepts_completed, emp.total_concepts)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-500">Tasks</span>
                        <span className="text-zinc-300">
                          {emp.tasks_completed}/{emp.total_tasks}
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${taskPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
