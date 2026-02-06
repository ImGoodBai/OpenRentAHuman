/**
 * Notifications API
 * GET /api/notifications - Get user notifications
 * POST /api/notifications/:id/read - Mark notification as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/google';
import { prisma } from '@/lib/db';

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const sessionToken = request.cookies.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifySessionToken(sessionToken);
    if (!payload?.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: any = { userId: payload.userId };
    if (isRead !== null) {
      where.isRead = isRead === 'true';
    }

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 100),
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: payload.userId,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
      count: notifications.length,
    });
  } catch (error) {
    console.error('Get notifications API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
