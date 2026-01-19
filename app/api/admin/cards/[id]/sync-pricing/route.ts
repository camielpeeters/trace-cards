// Sync pricing for a single card

import { NextRequest, NextResponse } from 'next/server';
import { syncCardPricing } from '../../../../../lib/pricing-sync';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { getCurrentUser } = await import('../../../../../lib/auth');
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Sync pricing for this card
    const pricing = await syncCardPricing(params.id);
    
    return NextResponse.json({
      success: true,
      pricing
    });
    
  } catch (error: any) {
    console.error('Pricing sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync pricing' },
      { status: 500 }
    );
  }
}
