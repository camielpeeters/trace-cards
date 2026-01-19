import { NextResponse } from 'next/server';
import { getPrisma } from '../../lib/prisma';

// Force dynamic rendering (uses Prisma)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get Prisma client instance
    const prisma = getPrisma();
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
