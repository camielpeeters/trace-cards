import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPrisma } from '../../../lib/prisma';

// Force dynamic rendering (uses Prisma)
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { username, email, password, displayName } = await request.json();

    // Get Prisma client instance
    const prisma = getPrisma();

    // Check if any users exist
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json({
        error: 'Admin user already exists. Use /register for additional users.'
      }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName || username
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
