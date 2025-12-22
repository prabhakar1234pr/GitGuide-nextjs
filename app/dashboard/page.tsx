import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Header from '../components/Header'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-8 py-16">
          {/* Page Header */}
          <div className="mb-16">
            <h1 className="text-[32px] font-semibold tracking-tight text-zinc-900 mb-2">
              Dashboard
            </h1>
            <p className="text-[15px] text-zinc-600">
              Welcome back, {user?.firstName || 'User'}
            </p>
          </div>

          {/* Content Grid */}
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="border border-zinc-200 rounded-lg p-8">
              <h2 className="text-[16px] font-medium text-zinc-900 mb-6">Profile</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="text-[13px] font-medium text-zinc-500 w-32">Email</span>
                  <span className="text-[14px] text-zinc-900">{user?.emailAddresses[0]?.emailAddress}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-[13px] font-medium text-zinc-500 w-32">User ID</span>
                  <span className="text-[13px] text-zinc-600 font-mono">{user?.id}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border border-zinc-200 rounded-lg p-8">
              <h2 className="text-[16px] font-medium text-zinc-900 mb-3">
                Start Learning
              </h2>
              <p className="text-[14px] leading-relaxed text-zinc-600 mb-6">
                Analyze any GitHub repository to begin your personalized learning journey with AI-powered explanations.
              </p>
              <button className="px-4 py-2 text-[13px] font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-all duration-200">
                Analyze repository
              </button>
            </div>

            {/* Recent Activity - Placeholder */}
            <div className="border border-zinc-200 rounded-lg p-8">
              <h2 className="text-[16px] font-medium text-zinc-900 mb-3">
                Recent Activity
              </h2>
              <p className="text-[14px] text-zinc-500">
                No recent activity yet. Start analyzing repositories to see your learning progress here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}