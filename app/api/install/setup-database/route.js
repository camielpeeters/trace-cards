import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // Run Prisma commands
    console.log('Generating Prisma Client...');
    try {
      await execAsync('npx prisma generate', {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'production' },
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for Plesk
      });
    } catch (generateError) {
      console.error('Prisma generate error:', generateError);
      // Continue anyway, might already be generated
    }

    console.log('Pushing database schema...');
    const dbPushResult = await execAsync('npx prisma db push --skip-generate --accept-data-loss', {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'production' },
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer for Plesk
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
      help: 'Zorg ervoor dat je schrijfrechten hebt op de data/ folder en dat Prisma correct is geïnstalleerd.'
    }, { status: 500 });
  }
}
