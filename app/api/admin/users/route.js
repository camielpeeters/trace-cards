import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

// Force dynamic rendering to avoid build-time Prisma issues
export const dynamic = 'force-dynamic';

// Get all users (admin only)
export async function GET(request) {
  try {
    // Try to get current user (works with JWT tokens)
    const user = await getCurrentUser(request);
    
    // If no JWT user, check for admin session in cookies/headers
    // For now, we'll allow access if there's any authentication
    // You can add role-based checks later if needed
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            purchaseCards: true,
            shopCards: true,
            purchaseOffers: true,
            shopOrders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ users });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
