/**
 * User List API (Talent Marketplace)
 * GET /api/users
 *
 * Query params:
 * - skills: comma-separated skills to filter by
 * - location: location to filter by
 * - isRemote: 'true' | 'false' to filter remote workers
 * - minPoints: minimum points threshold
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 * - sortBy: 'points' | 'tasksCompleted' | 'createdAt' (default: 'points')
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const skillsParam = searchParams.get('skills');
    const location = searchParams.get('location');
    const isRemoteParam = searchParams.get('isRemote');
    const minPointsParam = searchParams.get('minPoints');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'points';

    // Build where clause
    const where: any = {};

    // Filter by skills (array contains any of the specified skills)
    if (skillsParam) {
      const skills = skillsParam.split(',').map((s) => s.trim());
      where.skills = {
        hasSome: skills,
      };
    }

    // Filter by location
    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    // Filter by remote availability
    if (isRemoteParam !== null) {
      where.isRemote = isRemoteParam === 'true';
    }

    // Filter by minimum points
    if (minPointsParam) {
      where.points = {
        gte: parseInt(minPointsParam),
      };
    }

    // Build orderBy clause
    let orderBy: any;
    switch (sortBy) {
      case 'tasksCompleted':
        orderBy = { tasksCompleted: 'desc' };
        break;
      case 'createdAt':
        orderBy = { createdAt: 'desc' };
        break;
      case 'points':
      default:
        orderBy = { points: 'desc' };
        break;
    }

    // Fetch users
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
      total: totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('User list API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
