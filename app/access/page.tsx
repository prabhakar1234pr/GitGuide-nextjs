import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase, Users } from "lucide-react";

export default function AccessPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple header */}
      <header className="border-b border-zinc-200 bg-white">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-zinc-900 font-semibold text-lg tracking-tight hover:opacity-80"
          >
            GitGuide
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Back to home
            </Link>
          </div>
        </nav>
      </header>

      {/* Two-column layout */}
      <main className="max-w-5xl mx-auto px-6 py-20">
        <h1 className="text-2xl font-bold text-zinc-900 text-center mb-16">
          Access your account
        </h1>

        <div className="grid md:grid-cols-2 gap-12 md:gap-8">
          {/* For Managers */}
          <div className="relative p-8 md:p-10 rounded-2xl border-2 border-zinc-200 hover:border-sky-200 transition-colors bg-zinc-50/50">
            <span className="inline-block px-3 py-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider mb-6">
              Business
            </span>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-sky-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">For Managers</h2>
            </div>
            <p className="text-zinc-600 text-[15px] leading-relaxed mb-8">
              Create learning guides from GitHub repos, assign them to your
              team, and track progress across your organization.
            </p>
            <div className="space-y-4">
              <Button
                asChild
                className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg"
              >
                <Link href="/sign-in?role=manager">Login</Link>
              </Button>
              <p className="text-[13px] text-zinc-500 text-center">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up?role=manager"
                  className="text-sky-600 hover:text-sky-700 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* For Employees */}
          <div className="relative p-8 md:p-10 rounded-2xl border-2 border-zinc-200 hover:border-violet-200 transition-colors bg-zinc-50/50">
            <span className="inline-block px-3 py-1 rounded-full bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider mb-6">
              Learning
            </span>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">
                For Employees
              </h2>
            </div>
            <p className="text-zinc-600 text-[15px] leading-relaxed mb-8">
              Get assigned guides, work through concepts and tasks, and build
              real projects in the workspace. Verify your progress as you learn.
            </p>
            <div className="space-y-4">
              <Button
                asChild
                className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg"
              >
                <Link href="/sign-in?role=employee">Login</Link>
              </Button>
              <p className="text-[13px] text-zinc-500 text-center">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up?role=employee"
                  className="text-violet-600 hover:text-violet-700 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
