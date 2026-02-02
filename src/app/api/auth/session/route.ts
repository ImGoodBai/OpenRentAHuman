import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/google';
import { prisma } from '@/lib/db';

// GET /api/auth/session - Verify session and return user info
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session token' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = await verifySessionToken(sessionToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        accounts: {
          where: { isActive: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      accounts: user.accounts.map((acc: {
        id: string;
        platform: string;
        agentName: string;
        displayName: string | null;
        isActive: boolean;
      }) => ({
        id: acc.id,
        platform: acc.platform,
        agentName: acc.agentName,
        displayName: acc.displayName,
        isActive: acc.isActive,
      })),
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'Session verification failed' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/session - Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });

  // Clear session cookie
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });

  return response;
}
