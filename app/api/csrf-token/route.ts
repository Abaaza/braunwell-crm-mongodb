import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/csrf'
import { getCookie } from 'cookies-next'

export async function GET(request: NextRequest) {
  try {
    // Get session token to associate with CSRF token
    const sessionToken = request.cookies.get('session-token')?.value
    
    // Generate CSRF token
    const csrfToken = await generateCSRFToken(sessionToken)
    
    return NextResponse.json({ token: csrfToken })
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}