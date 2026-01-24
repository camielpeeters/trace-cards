// Admin API - SMTP Settings
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';
import { encrypt } from '../../../../lib/encryption';

export const dynamic = 'force-dynamic';

// GET - Get SMTP settings
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrisma();
    
    const settings = await prisma.smtpSettings.findFirst({
      where: { userId: user.id },
    });

    if (!settings) {
      return NextResponse.json({ settings: null });
    }

    // Don't send password to frontend
    return NextResponse.json({
      settings: {
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        user: settings.user,
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
      },
    });
  } catch (error: any) {
    console.error('Error fetching SMTP settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Save SMTP settings
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
        { error: 'Host, port, user, password, and fromEmail are required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    
    // Encrypt password
    const encryptedPassword = encrypt(password);

    // Upsert settings
    const settings = await prisma.smtpSettings.upsert({
      where: { userId: user.id },
      update: {
        host,
        port: parseInt(port),
        secure: secure || false,
        user: smtpUser,
        password: encryptedPassword,
        fromEmail,
        fromName: fromName || null,
      },
      create: {
        userId: user.id,
        host,
        port: parseInt(port),
        secure: secure || false,
        user: smtpUser,
        password: encryptedPassword,
        fromEmail,
        fromName: fromName || null,
      },
    });

    return NextResponse.json({ success: true, settings: { id: settings.id } });
  } catch (error: any) {
    console.error('Error saving SMTP settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings', details: error.message },
      { status: 500 }
    );
  }
}
