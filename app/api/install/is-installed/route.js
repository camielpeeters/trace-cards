import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const installedPath = join(process.cwd(), '.installed');
  const installed = existsSync(installedPath);

  return NextResponse.json({ installed });
}
