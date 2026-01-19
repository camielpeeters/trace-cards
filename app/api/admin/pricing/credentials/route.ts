// API Credentials CRUD for pricing services (CardMarket, TCGPlayer)

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';
import { isAuthenticated } from '../../../../lib/auth';
import { encrypt, decrypt } from '../../../../lib/encryption';

// Force dynamic rendering (uses Prisma and authentication)
export const dynamic = 'force-dynamic';

// GET - List all API credentials (decrypted for admin)
export async function GET() {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrisma();
    const credentials = await prisma.apiCredential.findMany({
      orderBy: { service: 'asc' },
    });

    // Decrypt sensitive fields for display (admin only)
    const decrypted = credentials.map(cred => ({
      id: cred.id,
      service: cred.service,
      apiKey: cred.apiKey ? '***' + cred.apiKey.slice(-4) : null, // Only show last 4 chars
      hasApiSecret: !!cred.apiSecret,
      hasAccessToken: !!cred.accessToken,
      hasRefreshToken: !!cred.refreshToken,
      isActive: cred.isActive,
      lastSync: cred.lastSync,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt,
    }));

    return NextResponse.json({ credentials: decrypted });
  } catch (error: any) {
    console.error('Error fetching API credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}

// POST - Create or update API credentials
export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { service, apiKey, apiSecret, accessToken, refreshToken } = body;

    if (!service || !apiKey) {
      return NextResponse.json(
        { error: 'Service and API key are required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Encrypt sensitive data
    const encryptedData = {
      service,
      apiKey: encrypt(apiKey),
      apiSecret: apiSecret ? encrypt(apiSecret) : null,
      accessToken: accessToken ? encrypt(accessToken) : null,
      refreshToken: refreshToken ? encrypt(refreshToken) : null,
      isActive: true,
    };

    // Upsert (update or create)
    const credential = await prisma.apiCredential.upsert({
      where: { service },
      update: encryptedData,
      create: encryptedData,
    });

    return NextResponse.json({
      success: true,
      credential: {
        id: credential.id,
        service: credential.service,
        isActive: credential.isActive,
      },
    });
  } catch (error: any) {
    console.error('Error saving API credentials:', error);
    return NextResponse.json(
      { error: 'Failed to save credentials' },
      { status: 500 }
    );
  }
}

// DELETE - Remove API credentials
export async function DELETE(request: NextRequest) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    if (!service) {
      return NextResponse.json(
        { error: 'Service parameter is required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    await prisma.apiCredential.delete({
      where: { service },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting API credentials:', error);
    return NextResponse.json(
      { error: 'Failed to delete credentials' },
      { status: 500 }
    );
  }
}
