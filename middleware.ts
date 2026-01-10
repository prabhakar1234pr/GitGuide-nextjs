import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/public(.*)'
]);

// Check if Clerk keys are configured
const isClerkConfigured = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  process.env.CLERK_SECRET_KEY
);

// Wrap clerkMiddleware in try-catch to handle missing keys gracefully
let authMiddleware: (request: Request) => Promise<Response> | Response;

try {
  if (isClerkConfigured) {
    authMiddleware = clerkMiddleware(async (auth, request) => {
      // Redirect authenticated users from home to dashboard
      const { userId } = await auth();
      if (userId && request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Protect all routes except public ones
      if (!isPublicRoute(request)) {
        await auth.protect()
      }
    }, {
      // Disable debug mode in production
      debug: process.env.NODE_ENV === 'development',
    });
  } else {
    // Passthrough middleware when Clerk is not configured
    authMiddleware = function middleware() {
      return NextResponse.next();
    };
  }
} catch (error) {
  // Fallback to passthrough if Clerk initialization fails
  authMiddleware = function middleware() {
    return NextResponse.next();
  };
}

export default authMiddleware;
  
export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}