import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google';
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=google_auth_failed', req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=no_code', req.url));
  }

  try {
    const tokens = await getTokensFromCode(code);
    
    const response = NextResponse.redirect(new URL('/dashboard/settings?google_sync=success', req.url));
    response.cookies.set('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  } catch (err) {
    console.error('Failed to get Google tokens:', err);
    return NextResponse.redirect(new URL('/dashboard/settings?error=google_token_exchange_failed', req.url));
  }
}
