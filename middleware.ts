import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/',
  '/server(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/signin(.*)',
  '/signup(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Non proteggere le route pubbliche
  if (isPublicRoute(req)) {
    return
  }
  
  // Proteggi le route private
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
