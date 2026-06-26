import { NextRequest, NextResponse } from 'next/server';
import { parseGoogleTokensCookie, oauth2Client } from '@/lib/google';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  const tokens = parseGoogleTokensCookie(cookieHeader);

  if (!tokens) {
    return NextResponse.json({ connected: false });
  }

  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    return NextResponse.json({ 
      connected: true, 
      user: {
        email: userInfo.data.email,
        name: userInfo.data.name,
        picture: userInfo.data.picture
      }
    });
  } catch (err) {
    console.error('Error fetching Google user info:', err);
    // Token might be invalid or expired without refresh
    return NextResponse.json({ connected: false, error: 'Token invalid or expired' });
  }
}
