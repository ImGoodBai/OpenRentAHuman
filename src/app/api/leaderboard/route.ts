/**
 * Leaderboard API
 * GET /api/leaderboard
 *
 * Query params:
 * - type: 'total' | 'today' | 'streak' (default: 'total')
 * - limit: number (default: 50, max: 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'total';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let orderBy: any;
    let select: any = {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      title: true,
      bio: true,
      skills: true,
      location: true,
      points: true,
      tasksCompleted: true,
      tasksAccepted: true,
      currentStreak: true,
      createdAt: true,
    };

    switch (type) {
      case 'today':
        // For today's leaderboard, we need to calculate points earned today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Get all accepted claims today with task details
        const todayClaims = await prisma.claim.findMany({
          where: {
            status: 'accepted',
            reviewedAt: {
              gte: todayStart,
            },
          },
          include: {
            task: {
              select: {
                rewardPoints: true,
              },
            },
            user: {
              select,
            },
          },
        });

        // Aggregate by user
        const userPointsMap = new Map<string, { user: any; todayPoints: number }>();

        todayClaims.forEach((claim) => {
          const existing = userPointsMap.get(claim.userId);
          if (existing) {
            existing.todayPoints += claim.task.rewardPoints;
          } else {
            userPointsMap.set(claim.userId, {
              user: claim.user,
              todayPoints: claim.task.rewardPoints,
            });
          }
        });

        // Sort and limit
        const leaderboardWithTodayPoints = Array.from(userPointsMap.values())
          .map(({ user, todayPoints }) => ({
            ...user,
            todayPoints,
          }))
          .sort((a, b) => b.todayPoints - a.todayPoints)
          .slice(0, limit);

        return NextResponse.json({
          success: true,
          data: leaderboardWithTodayPoints,
          type: 'today',
          count: leaderboardWithTodayPoints.length,
        });

      case 'streak':
        orderBy = { currentStreak: 'desc' };
        break;

      case 'total':
      default:
        orderBy = { points: 'desc' };
        break;
    }

    // For total and streak, simple query
    if (type !== 'today') {
      const users = await prisma.user.findMany({
        where: {
          points: {
            gt: 0, // Only show users with at least 1 point
          },
        },
        select,
        orderBy,
        take: limit,
      });

      return NextResponse.json({
        success: true,
        data: users,
        type,
        count: users.length,
      });
    }
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leaderboard',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
