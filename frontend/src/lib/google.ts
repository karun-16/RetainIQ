import { google } from 'googleapis';
import { parseCookie } from 'cookie';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

export const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

export const getGoogleAuthUrl = () => {
  const scopes = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.send',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
};

export const getTokensFromCode = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const parseGoogleTokensCookie = (cookieHeader: string | null) => {
  if (!cookieHeader) return null;
  const cookies = parseCookie(cookieHeader);
  const tokenString = cookies['google_tokens'];
  if (!tokenString) return null;
  try {
    const rawTokens = JSON.parse(tokenString);
    // Refresh token check and refresh logic could be added here
    oauth2Client.setCredentials(rawTokens);
    return rawTokens;
  } catch (e) {
    return null;
  }
};
