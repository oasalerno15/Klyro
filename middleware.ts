import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          // Create a new response
          supabaseResponse = NextResponse.next({
            request,
          })
          // Set the cookies on the response
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not run any code between createServerClient and auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow access to public routes
  const publicRoutes = ['/', '/login', '/signup', '/debug-auth']
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isStaticFile = request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js)$/)

  // Don't redirect for public routes, auth routes, API routes, or static files
  if (isPublicRoute || isAuthRoute || isApiRoute || isStaticFile) {
    return supabaseResponse
  }

  // Redirect unauthenticated users to landing page for protected routes
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access landing page, redirect to dashboard
  if (user && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 