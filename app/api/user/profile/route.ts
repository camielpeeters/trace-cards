// User Profile CRUD (NAW gegevens)

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../lib/prisma';

// Force dynamic rendering (uses request.headers via getCurrentUser)
export const dynamic = 'force-dynamic';

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('../../../lib/auth');
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrisma();
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// POST/PUT - Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('../../../lib/auth');
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      street,
      houseNumber,
      houseNumberExt,
      postalCode,
      city,
      country = 'NL',
      phoneNumber,
      dateOfBirth,
    } = body;

    // Validation
    if (!firstName || !lastName || !street || !houseNumber || !postalCode || !city) {
      return NextResponse.json(
        { error: 'Required fields: firstName, lastName, street, houseNumber, postalCode, city' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        firstName,
        lastName,
        street,
        houseNumber,
        houseNumberExt,
        postalCode,
        city,
        country,
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        firstName,
        lastName,
        street,
        houseNumber,
        houseNumberExt,
        postalCode,
        city,
        country,
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error saving profile:', error);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}
