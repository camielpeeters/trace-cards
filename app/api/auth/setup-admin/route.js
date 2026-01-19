import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';

// Force dynamic rendering (uses Prisma)
export const dynamic = 'force-dynamic';

// This route allows creating or updating the admin user
// Useful for migration from localStorage to database
export async function POST(request) {
  try {
    // Check if prisma is initialized
    if (!prisma) {
      console.error('Prisma client is not initialized');
      return NextResponse.json(
        { error: 'Database client not initialized. Please check server logs.' },
        { status: 500 }
      );
    }
    
    // Check if prisma is initialized
    if (!prisma) {
      console.error('Prisma client is not initialized');
      return NextResponse.json(
        { 
          error: 'Database client not initialized. Please check server logs.',
          details: 'Prisma client is null. Check if database file exists and Prisma is correctly configured.'
        },
        { status: 500 }
      );
    }
    
    // Test database connection with a simple query
    try {
      // Use a simple count query instead of $queryRaw which might not work with adapter
      await prisma.user.count();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      console.error('Error details:', {
        message: dbError.message,
        code: dbError.code,
        name: dbError.name,
        stack: dbError.stack?.substring(0, 500)
      });
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please check your database configuration.',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { username, email, password } = body;
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Check if admin user exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    
    if (existingUser) {
      // Update password if user exists
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { username: username.toLowerCase() },
        data: { passwordHash }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Admin password updated successfully'
      });
    } else {
      // Check if email is already taken
      if (email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        });
        
        if (existingEmail) {
          return NextResponse.json(
            { error: 'Email is already registered' },
            { status: 409 }
          );
        }
      }
      
      // Create new admin user
      const passwordHash = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          username: username.toLowerCase(),
          email: email ? email.toLowerCase() : `${username}@admin.local`,
          passwordHash,
          displayName: username
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    }
    
  } catch (error) {
    console.error('Setup admin error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle Prisma errors specifically
    if (error.code === 'P2002') {
      // Unique constraint violation
      const field = error.meta?.target?.[0] || 'field';
      return NextResponse.json(
        { error: `${field === 'username' ? 'Gebruikersnaam' : 'Email'} is al in gebruik` },
        { status: 409 }
      );
    }
    
    // Handle database connection errors
    if (error.message && error.message.includes('SQLITE')) {
      return NextResponse.json(
        { error: 'Database error: ' + error.message },
        { status: 500 }
      );
    }
    
    // Handle other Prisma errors
    if (error.code && error.code.startsWith('P')) {
      return NextResponse.json(
        { error: 'Database error: ' + (error.message || 'Unknown error') },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    // Don't disconnect - keep connection for reuse
    // Prisma manages connection pooling automatically
  }
}
