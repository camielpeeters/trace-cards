import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';

// Force dynamic rendering (uses request.headers)
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ user });
    
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
