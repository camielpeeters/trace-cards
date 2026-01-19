// Get card price display data

import { NextRequest, NextResponse } from 'next/server';
import { getCardDisplayPrice } from '../../../../lib/pricing-sync';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const priceData = await getCardDisplayPrice(params.id);
    
    if (!priceData) {
      return NextResponse.json(
        { error: 'Card not found or no pricing data' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(priceData);
    
  } catch (error: any) {
    console.error('Price fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch price' },
      { status: 500 }
    );
  }
}
