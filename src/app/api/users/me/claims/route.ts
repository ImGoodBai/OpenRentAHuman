import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/google';
import { prisma } from '@/lib/db';

// GET /api/users/me/claims - Get my claimed tasks
export async function GET(request: NextRequest) {
  try {
    // Verify user session
    const sessionToken = request.cookies.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = await verifySessionToken(sessionToken);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const userId = payload.userId as string;

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const where: any = { userId };
    if (statusFilter) {
      where.status = statusFilter;
    }

    // Get claims with tasks
    const claims = await prisma.claim.findMany({
      where,
      include: {
        task: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        claimedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      claims,
      count: claims.length
    });

  } catch (error) {
    console.error('Get claims error:', error);
    return NextResponse.json(
      { error: 'Failed to get claims' },
      { status: 500 }
    );
  }
}
