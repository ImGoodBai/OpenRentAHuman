/**
 * Get Current User Profile API
 * GET /api/users/me/profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/google';
import { prisma } from '@/lib/db';

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

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        title: true,
        bio: true,
        skills: true,
        location: true,
        isRemote: true,
        points: true,
        tasksCompleted: true,
        tasksAccepted: true,
        currentStreak: true,
        createdAt: true,
        xiaohongshu: true,
        weibo: true,
        wechat: true,
        twitter: true,
        github: true,
        website: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
