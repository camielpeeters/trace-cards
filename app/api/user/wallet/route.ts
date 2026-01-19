// User Wallet - Balance and transactions

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../lib/prisma';

// Force dynamic rendering (uses request.headers via getCurrentUser)
export const dynamic = 'force-dynamic';

// GET - Get wallet balance and recent transactions
export async function GET(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('../../../lib/auth');
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrisma();
    
    // Get or create wallet
    let wallet = await prisma.userWallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prisma.userWallet.create({
        data: {
          userId: user.id,
          balance: 0.00,
          currency: 'EUR',
        },
      });
    }

    // Get recent transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
        dailySpendLimit: wallet.dailySpendLimit,
      },
      transactions,
    });
  } catch (error: any) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}
