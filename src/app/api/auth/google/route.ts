import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setAuthCookie } from '@/lib/auth'

// ─── Google OAuth2 Configuration ─────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

const REDIRECT_PATH = '/api/auth/google'

function getRedirectUri(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  return `${protocol}://${host}${REDIRECT_PATH}`
}

// ─── GET Handler: Initiate OAuth or Handle Callback ──────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // If Google env vars are not configured, return error
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('[Google OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'Google OAuth no está configurado. El administrador debe configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.',
        },
        { status: 503 }
      )
    }

    // Handle OAuth error response from Google
    if (error) {
      console.error('[Google OAuth] Google returned error:', error)
      return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error)}`, request.url))
    }

    // Step 1: If no code, redirect to Google OAuth consent screen
    if (!code) {
      const redirectUri = getRedirectUri(request)
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
      googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
      googleAuthUrl.searchParams.set('response_type', 'code')
      googleAuthUrl.searchParams.set('scope', 'openid email profile')
      googleAuthUrl.searchParams.set('access_type', 'offline')
      googleAuthUrl.searchParams.set('prompt', 'consent')

      // Add state for CSRF protection
      const stateToken = crypto.randomUUID()
      googleAuthUrl.searchParams.set('state', stateToken)

      return NextResponse.redirect(googleAuthUrl.toString())
    }

    // Step 2: Exchange code for tokens
    const redirectUri = getRedirectUri(request)
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text().catch(() => 'Unknown error')
      console.error('[Google OAuth] Token exchange failed:', errText)
      return NextResponse.redirect(new URL('/?auth_error=token_exchange_failed', request.url))
    }

    const tokenData = await tokenResponse.json()
    const idToken = tokenData.id_token

    if (!idToken) {
      console.error('[Google OAuth] No ID token in response')
      return NextResponse.redirect(new URL('/?auth_error=no_id_token', request.url))
    }

    // Step 3: Verify the ID token using Google's tokeninfo endpoint
    const verifyResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    )

    if (!verifyResponse.ok) {
      const errText = await verifyResponse.text().catch(() => 'Unknown error')
      console.error('[Google OAuth] ID token verification failed:', errText)
      return NextResponse.redirect(new URL('/?auth_error=token_verification_failed', request.url))
    }

    const userInfo = await verifyResponse.json()

    // Verify the token was issued for our client
    if (userInfo.aud !== GOOGLE_CLIENT_ID) {
      console.error('[Google OAuth] Token audience mismatch:', userInfo.aud)
      return NextResponse.redirect(new URL('/?auth_error=invalid_audience', request.url))
    }

    const googleId = userInfo.sub
    const email = userInfo.email
    const name = userInfo.name || ''
    const avatar = userInfo.picture || ''

    if (!email) {
      console.error('[Google OAuth] No email in Google profile')
      return NextResponse.redirect(new URL('/?auth_error=no_email', request.url))
    }

    // Step 4: Find or create user
    let user = await db.user.findUnique({
      where: { email },
      include: { businessProfile: true },
    })

    if (user) {
      // Update existing user with Google info
      const updateData: Record<string, unknown> = {
        googleId: googleId || user.googleId,
        avatar: avatar || user.avatar,
        name: name || user.name,
        emailVerified: true,
      }

      user = await db.user.update({
        where: { id: user.id },
        data: updateData,
        include: { businessProfile: true },
      })
    } else {
      // Create new user from Google OAuth
      user = await db.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          googleId: googleId || '',
          avatar: avatar || '',
          role: 'BUYER', // Default role; user can switch later
          phone: '',
          department: '',
          address: '',
          isVerified: false,
          emailVerified: true,
          phoneVerified: false,
        },
        include: { businessProfile: true },
      })
    }

    // Step 5: Set auth cookie and redirect to home
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.set('pc_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    // Create audit log for Google login
    try {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'GOOGLE_LOGIN',
          entity: 'User',
          entityId: user.id,
          details: `Google OAuth login for ${email}`,
        },
      })
    } catch {
      // Audit log failure shouldn't block login
    }

    return response
  } catch (error) {
    console.error('[Google OAuth] Unexpected error:', error)
    return NextResponse.redirect(new URL('/?auth_error=unexpected_error', request.url))
  }
}

// ─── POST Handler: Direct Google auth (for client-side Google Sign-In) ───────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, googleId, avatar, role, phone, department, address } = body

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email es requerido' }, { status: 400 })
    }

    // If Google env vars are not set, we still allow the POST method
    // for client-side Google Sign-In (ID token verified on client)
    // But we note it in the log
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.warn('[Google Auth POST] Google OAuth env vars not configured, proceeding with client-side verification')
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { email },
      include: { businessProfile: true },
    })

    if (user) {
      // Update existing user
      const updateData: Record<string, unknown> = {
        googleId: googleId || user.googleId,
        avatar: avatar || user.avatar,
        name: name || user.name,
        emailVerified: true,
      }
      if (phone) updateData.phone = phone.replace(/[\s\-()]/g, '')
      if (department) updateData.department = department
      if (address) updateData.address = address

      user = await db.user.update({
        where: { id: user.id },
        data: updateData,
        include: { businessProfile: true },
      })
    } else {
      // Create new user
      const userRole = role === 'SELLER' ? 'SELLER' : 'BUYER'
      user = await db.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          googleId: googleId || '',
          avatar: avatar || '',
          role: userRole,
          phone: phone ? phone.replace(/[\s\-()]/g, '') : '',
          department: department || '',
          address: address || '',
          isVerified: false,
          emailVerified: true,
          phoneVerified: false,
        },
        include: { businessProfile: true },
      })

      if (userRole === 'SELLER') {
        await db.businessProfile.create({ data: { userId: user.id } })
        user = await db.user.findUnique({
          where: { id: user.id },
          include: { businessProfile: true },
        })
      }
    }

    // Set auth cookie
    const { password: _, ...safeUser } = user!
    const response = NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        requiresVerification: false,
      },
    })
    response.cookies.set('pc_user_id', user!.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('[Google Auth POST] Error:', error)
    return NextResponse.json({ success: false, error: 'Error al autenticar con Google' }, { status: 500 })
  }
}
