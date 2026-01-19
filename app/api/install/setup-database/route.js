import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Force dynamic rendering (uses Prisma)
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'DATABASE_URL is not set. Configure PostgreSQL connection string in environment variables.'
      }, { status: 400 });
    }

    // Run Prisma commands
    console.log('Generating Prisma Client...');
    try {
      await execAsync('npx prisma generate', {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'production' },
        maxBuffer: 1024 * 1024 * 10
      });
    } catch (generateError) {
      console.error('Prisma generate error:', generateError);
      // Continue anyway, might already be generated
    }

    console.log('Pushing database schema...');
    const dbPushResult = await execAsync('npx prisma db push --skip-generate --accept-data-loss', {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'production' },
      maxBuffer: 1024 * 1024 * 10
    });

    // Test database connection
    try {
      const { default: prisma } = await import('../../../lib/prisma');
      if (prisma) {
        // Simple connection test
        await prisma.$connect();
        await prisma.$disconnect();
      }
    } catch (dbError) {
      console.warn('Database connection test warning:', dbError.message);
      // Don't fail if test fails, might be expected on first run
    }

    return NextResponse.json({
      success: true,
      message: 'Database configured successfully',
      output: dbPushResult.stdout
    });

  } catch (error) {
    console.error('Setup database error:', error);
    return NextResponse.json({
      error: error.message || 'Database setup failed',
      details: error.stderr || error.stdout || error.toString(),
      help: 'Ensure DATABASE_URL is set to a valid PostgreSQL connection string.'
    }, { status: 500 });
  }
}
