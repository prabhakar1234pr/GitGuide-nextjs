import { SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'
import Header from './components/Header'

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-8 pt-32 pb-20">
          <div className="max-w-3xl">
            <h1 className="text-[48px] leading-[1.1] font-semibold tracking-tight text-zinc-900 mb-6">
              Transform GitHub repositories into personalized learning journeys
            </h1>
            
            <SignedOut>
              <p className="text-[17px] leading-relaxed text-zinc-600 mb-10 max-w-2xl">
                AI-powered platform that turns any GitHub repository into an interactive tutorial. 
                Get context-aware explanations, understand complex codebases, and learn at your own pace.
              </p>
              <div className="flex gap-3">
                <Link 
                  href="/sign-up"
                  className="px-5 py-2.5 text-[14px] font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-all duration-200"
                >
                  Get started
                </Link>
                <Link 
                  href="/sign-in"
                  className="px-5 py-2.5 text-[14px] font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:border-zinc-400 hover:bg-zinc-50 transition-all duration-200"
                >
                  Sign in
                </Link>
              </div>
            </SignedOut>
            
            <SignedIn>
              <p className="text-[17px] leading-relaxed text-zinc-600 mb-10">
                Welcome back. Continue your learning journey with AI-powered repository analysis.
              </p>
              <Link 
                href="/dashboard"
                className="inline-block px-5 py-2.5 text-[14px] font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-all duration-200"
              >
                Go to dashboard
              </Link>
            </SignedIn>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-5xl mx-auto px-8 py-20 border-t border-zinc-200">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-[15px] font-medium text-zinc-900 mb-3">
                Context-Aware Chat
              </h3>
              <p className="text-[14px] leading-relaxed text-zinc-600">
                Ask questions about any part of the codebase. Get explanations that understand the full context.
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-zinc-900 mb-3">
                Interactive Learning
              </h3>
              <p className="text-[14px] leading-relaxed text-zinc-600">
                Follow structured tutorials generated from the repository. Learn by doing, not just reading.
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-zinc-900 mb-3">
                Smart Analysis
              </h3>
              <p className="text-[14px] leading-relaxed text-zinc-600">
                Automatically detects patterns, architecture decisions, and best practices in the code.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}