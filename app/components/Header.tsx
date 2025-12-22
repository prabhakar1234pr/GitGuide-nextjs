import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="max-w-5xl mx-auto px-8 h-14 flex items-center justify-between">
        <Link 
          href="/" 
          className="text-[15px] font-medium text-zinc-900 hover:text-zinc-600 transition-colors duration-200"
        >
          GitGuide
        </Link>
        
        <div className="flex items-center gap-8">
          <SignedOut>
            <Link 
              href="/sign-in" 
              className="text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
            >
              Sign in
            </Link>
            <Link 
              href="/sign-up"
              className="px-3.5 py-1.5 text-[13px] font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-all duration-200"
            >
              Get started
            </Link>
          </SignedOut>
          
          <SignedIn>
            <Link 
              href="/dashboard" 
              className="text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
            >
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
    </header>
  )
}