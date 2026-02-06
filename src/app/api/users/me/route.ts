/**
 * Update User Profile API
 * PATCH /api/users/me
 *
 * Body:
 * - name: string (optional)
 * - title: string (optional)
 * - bio: string (optional)
 * - skills: string[] (optional)
 * - location: string (optional)
 * - isRemote: boolean (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/google';
import { prisma } from '@/lib/db';

export async function PATCH(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { name, title, bio, skills, location, isRemote } = body;

    // Build update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (title !== undefined) updateData.title = title.trim() || null;
    if (bio !== undefined) updateData.bio = bio.trim() || null;
    if (skills !== undefined) {
      // Validate skills is an array
      if (!Array.isArray(skills)) {
        return NextResponse.json(
          { success: false, error: 'Skills must be an array' },
          { status: 400 }
        );
      }
      updateData.skills = skills.map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    }
    if (location !== undefined) updateData.location = location.trim() || null;
    if (isRemote !== undefined) {
      if (typeof isRemote !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'isRemote must be a boolean' },
          { status: 400 }
        );
      }
      updateData.isRemote = isRemote;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
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
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update profile API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
