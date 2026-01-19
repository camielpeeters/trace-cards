import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// Force dynamic rendering (uses Prisma)
export const dynamic = 'force-dynamic';

// Simple test route to check database connection
export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Prisma client is not initialized',
          details: 'Check server logs for initialization errors'
        },
        { status: 500 }
      );
    }
    
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      prismaInitialized: !!prisma
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Database connection failed',
        details: error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
