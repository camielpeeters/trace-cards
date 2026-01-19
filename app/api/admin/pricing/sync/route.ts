// Manual price sync trigger for admin

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

// Force dynamic rendering to avoid build-time Prisma issues
export const dynamic = 'force-dynamic';

// POST - Trigger manual price sync
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { source, cardIds } = body; // Optional: sync specific cards

    // TODO: Implement actual price sync logic
    // This would:
    // 1. Get API credentials for the source
    // 2. Fetch prices from CardMarket/TCGPlayer
    // 3. Update CardPrice records in database
    // 4. Update lastSync timestamp

    const prisma = getPrisma();
    
    // Update lastSync for the credential
    if (source) {
      await prisma.apiCredential.updateMany({
        where: { service: source.toLowerCase(), isActive: true },
        data: { lastSync: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Price sync initiated',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error syncing prices:', error);
    return NextResponse.json(
      { error: 'Failed to sync prices', details: error.message },
      { status: 500 }
    );
  }
}
