import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import * as ics from 'ics';

export async function POST(req: Request) {
  try {
    const { employeeName, employeeEmail, title, date, time, duration, meetingLink, notes, scheduledAt } = await req.json();

    const smtpHost = process.env.SMTP_HOST || 'smtp.ethereal.email';
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    let transporter;

    if (smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2563EB; margin: 0;">RetainIQ</h2>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Predict. Prevent. Retain.</p>
        </div>
        
        <h3 style="color: #0f172a;">Hello ${employeeName},</h3>
        <p style="color: #334155; line-height: 1.6;">
          A new meeting has been scheduled with you. Please review the details below:
        </p>

        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Meeting Title:</strong> ${title}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration} minutes</p>
          ${meetingLink ? `<p style="margin: 5px 0;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #2563EB;">Join Meeting</a></p>` : ''}
        </div>

        ${notes ? `
          <h4 style="color: #0f172a; margin-bottom: 5px;">Notes / Agenda</h4>
          <p style="color: #334155; line-height: 1.6; margin-top: 0;">${notes}</p>
        ` : ''}

        <p style="color: #94a3b8; font-size: 14px; margin-top: 40px; text-align: center;">
          This is an automated message from your HR team via RetainIQ.
        </p>
      </div>
    `;

    // Generate ICS file
    let icsContent = '';
    if (scheduledAt) {
      const dt = new Date(scheduledAt);
      const event = {
        start: [dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours(), dt.getMinutes()] as ics.DateArray,
        duration: { minutes: duration },
        title: title,
        description: notes || '',
        location: meetingLink || 'In Person / Unknown',
        url: meetingLink,
        status: 'CONFIRMED' as const,
        organizer: { name: 'HR Department', email: 'hr@retainiq.example.com' },
        attendees: [
          { name: employeeName, email: employeeEmail, rsvp: true, role: 'REQ-PARTICIPANT' as const }
        ]
      };
      const { error, value } = ics.createEvent(event);
      if (!error && value) {
        icsContent = value;
      }
    }

    const attachments = [];
    if (icsContent) {
      attachments.push({
        filename: 'invite.ics',
        content: icsContent,
        contentType: 'text/calendar; method=REQUEST'
      });
    }

    const info = await transporter.sendMail({
      from: '"HR Department" <hr@retainiq.example.com>',
      to: employeeEmail || 'employee@example.com',
      subject: `Meeting Scheduled: ${title}`,
      html: htmlContent,
      attachments: attachments,
    });

    return NextResponse.json({ success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) });

  } catch (error: any) {
    console.error('Email sending error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
