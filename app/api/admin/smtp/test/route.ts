// Admin API - Test SMTP Connection
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

// POST - Test SMTP connection by sending a test email
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { host, port, secure, user: smtpUser, password, fromEmail, fromName } = body;

    if (!host || !port || !smtpUser || !password || !fromEmail) {
      return NextResponse.json(
        { error: 'All SMTP fields are required for testing' },
        { status: 400 }
      );
    }

    // Dynamic import nodemailer (only on server)
    const nodemailer = await import('nodemailer');

    // Create transporter
    const transporter = nodemailer.default.createTransport({
      host,
      port: parseInt(port),
      secure: secure || false,
      auth: {
        user: smtpUser,
        pass: password,
      },
    });

    // Verify connection
    await transporter.verify();

    // Send test email
    const info = await transporter.sendMail({
      from: fromName ? `"${fromName}" <${fromEmail}>` : fromEmail,
      to: user.email, // Send to admin's email
      subject: '✅ SMTP Test - Trace Cards',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
            SMTP Test Succesvol!
          </h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Je SMTP instellingen werken correct! Deze email werd verzonden vanuit je Trace Cards applicatie.
          </p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              <strong>SMTP Host:</strong> ${host}<br>
              <strong>Port:</strong> ${port}<br>
              <strong>Secure:</strong> ${secure ? 'Ja (SSL)' : 'Nee (TLS)'}<br>
              <strong>Van:</strong> ${fromEmail}
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Je kunt nu wachtwoord herstel emails en notificaties verzenden!
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('Error testing SMTP:', error);
    return NextResponse.json(
      { 
        error: 'SMTP test failed', 
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
}
