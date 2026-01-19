import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';
import { signToken } from '../../../lib/jwt';

// Force dynamic rendering (uses Prisma)
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { username, email, password, displayName } = await request.json();
    
    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Username validation
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username.toLowerCase())) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters, lowercase letters, numbers, and underscores only' },
        { status: 400 }
      );
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Check if username exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }
    
    // Check if email exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName || username
      }
    });
    
    // Generate token
    const token = signToken(user.id, user.username);
    
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
