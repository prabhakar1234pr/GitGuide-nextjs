'use client'

import Link from 'next/link'
import Header from '../../components/Header'

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#2a2e32]">
        {/* Subtle background pattern */}
        <div 
          className="fixed inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
        
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-[#3a3f44]/80 backdrop-blur-sm rounded-2xl border border-red-500/20 p-8 text-center">
              {/* Error icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-semibold text-white mb-3">
                Something Went Wrong
              </h1>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                {error.message || 'We couldn\'t load this project. Please try again.'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
                <Link 
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-zinc-900 bg-white hover:bg-zinc-100 rounded-xl transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

