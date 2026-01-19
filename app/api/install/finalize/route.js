import { NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Force dynamic rendering (uses file system)
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Create .installed file to mark installation as complete
    const installedPath = join(process.cwd(), '.installed');
    writeFileSync(installedPath, new Date().toISOString());

    return NextResponse.json({
      success: true,
      message: 'Installation finalized successfully'
    });

  } catch (error) {
    console.error('Finalize error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
