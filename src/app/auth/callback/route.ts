import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const cookieStore = await cookies()

  console.log('Auth callback triggered:', {
    origin,
    hasCode: !!code,
    fullUrl: requestUrl.toString()
  })

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/?error=auth_error&message=${encodeURIComponent(error.message)}`)
      }
      
      console.log('Successfully exchanged code for session:', {
        userEmail: data.session?.user?.email,
        userId: data.session?.user?.id,
        redirectingTo: `${origin}/dashboard`
      })
      
      // Add a small delay to ensure session is properly set
      const response = NextResponse.redirect(`${origin}/dashboard`)
      
      // Ensure cookies are properly set in the response
      const sessionCookies = cookieStore.getAll()
      sessionCookies.forEach(cookie => {
        if (cookie.name.includes('supabase')) {
          response.cookies.set(cookie.name, cookie.value, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/'
          })
        }
      })
      
      return response
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${origin}/?error=auth_error&message=${encodeURIComponent('Unexpected error')}`)
    }
  }

  // No code present, redirect to error
  console.error('No code found in callback URL')
  return NextResponse.redirect(`${origin}/?error=no_code`)
} 