import { NextRequest, NextResponse } from 'next/server';
import { parseGoogleTokensCookie, oauth2Client } from '@/lib/google';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  const tokens = parseGoogleTokensCookie(cookieHeader);

  if (!tokens) {
    return NextResponse.json({ error: 'Google account not connected' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      employeeName, 
      employeeEmail, 
      title, 
      reason, 
      description, 
      startDateTime, 
      endDateTime, 
      platform,
      sendEmail,
      pdfAttachmentBase64,
      icsAttachmentBase64
    } = body;

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // 1. Create Calendar Event & Google Meet (if requested)
    let conferenceData = undefined;
    if (platform === 'Google Meet') {
      conferenceData = {
        createRequest: {
          requestId: `retainiq-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      };
    }

    const event = {
      summary: title,
      description: description || reason,
      start: { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      attendees: [{ email: employeeEmail }],
      conferenceData
    };

    const calendarRes = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all' // This tells Google to send the calendar invite natively too
    });

    const createdEvent = calendarRes.data;
    const meetLink = createdEvent.hangoutLink || '';
    const eventId = createdEvent.id || '';

    // 2. Send Custom Gmail Email if requested
    if (sendEmail) {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const userProfile = await google.oauth2({ version: 'v2', auth: oauth2Client }).userinfo.get();
      const senderEmail = userProfile.data.email || 'hr@retainiq.com';

      // Build MIME message for Gmail API
      const boundary = `retainiq-boundary-${Date.now()}`;
      let message = `To: ${employeeEmail}\n` +
                    `From: ${senderEmail}\n` +
                    `Subject: ${title}\n` +
                    `MIME-Version: 1.0\n` +
                    `Content-Type: multipart/mixed; boundary="${boundary}"\n\n` +
                    `--${boundary}\n` +
                    `Content-Type: text/html; charset="UTF-8"\n\n` +
                    `
                      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                          <h1 style="margin: 0; font-size: 24px;">RetainIQ</h1>
                          <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Predict. Prevent. Retain.</p>
                        </div>
                        <div style="padding: 20px;">
                          <p>Hi <strong>${employeeName}</strong>,</p>
                          <p>I would like to schedule a <strong>${reason}</strong> meeting with you.</p>
                          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;">
                            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Title:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${title}</td></tr>
                            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date & Time:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${new Date(startDateTime).toLocaleString()}</td></tr>
                            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Platform:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${platform}</td></tr>
                          </table>
                          <p><strong>Description:</strong></p>
                          <p style="background: #f9fafb; padding: 15px; border-radius: 6px;">${description || 'No additional description provided.'}</p>
                          ${meetLink ? `<div style="text-align: center; margin: 30px 0;"><a href="${meetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Google Meet</a></div>` : ''}
                        </div>
                        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #eee;">
                          <p style="margin: 0;">CONFIDENTIAL NOTICE</p>
                          <p style="margin: 5px 0 0;">This email and any attachments are confidential.</p>
                        </div>
                      </div>
                    ` + `\n\n`;

      if (pdfAttachmentBase64) {
        message += `--${boundary}\n` +
                   `Content-Type: application/pdf; name="Employee_Report.pdf"\n` +
                   `Content-Disposition: attachment; filename="Employee_Report.pdf"\n` +
                   `Content-Transfer-Encoding: base64\n\n` +
                   `${pdfAttachmentBase64}\n\n`;
      }

      if (icsAttachmentBase64) {
        message += `--${boundary}\n` +
                   `Content-Type: text/calendar; name="invite.ics"\n` +
                   `Content-Disposition: attachment; filename="invite.ics"\n` +
                   `Content-Transfer-Encoding: base64\n\n` +
                   `${icsAttachmentBase64}\n\n`;
      }

      message += `--${boundary}--`;

      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage }
      });
    }

    return NextResponse.json({ 
      success: true, 
      eventId, 
      meetLink 
    });
    
  } catch (err: any) {
    console.error('Failed to schedule via Google:', err);
    return NextResponse.json({ error: err.message || 'Failed to interact with Google API' }, { status: 500 });
  }
}
