import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/google';
import { prisma } from '@/lib/db';

// POST /api/tasks/:id/claim - Claim a task (User only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const taskId = params.id;
    const userId = payload.userId as string;

    // Check task exists and is open
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check and release expired claims first
    await checkAndReleaseExpired(taskId);

    // Reload task
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!updatedTask || updatedTask.status !== 'open') {
      return NextResponse.json(
        { error: 'Task is not available for claiming' },
        { status: 400 }
      );
    }

    // Check if user already claimed this task
    const existingClaim = await prisma.claim.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId
        }
      }
    });

    if (existingClaim && existingClaim.status !== 'expired') {
      return NextResponse.json(
        { error: 'You have already claimed this task' },
        { status: 400 }
      );
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + updatedTask.timeoutHours);

    // Create claim and update task status
    const claim = await prisma.$transaction(async (tx) => {
      const newClaim = await tx.claim.upsert({
        where: {
          taskId_userId: {
            taskId,
            userId
          }
        },
        create: {
          taskId,
          userId,
          status: 'claimed',
          expiresAt
        },
        update: {
          status: 'claimed',
          expiresAt,
          claimedAt: new Date()
        }
      });

      await tx.task.update({
        where: { id: taskId },
        data: { status: 'assigned' }
      });

      return newClaim;
    });

    return NextResponse.json({
      success: true,
      claim: {
        id: claim.id,
        status: claim.status,
        expiresAt: claim.expiresAt
      },
      task: {
        dynamicCode: updatedTask.dynamicCode
      }
    });

  } catch (error) {
    console.error('Claim task error:', error);
    return NextResponse.json(
      { error: 'Failed to claim task' },
      { status: 500 }
    );
  }
}

// Helper function to check and release expired claims
async function checkAndReleaseExpired(taskId: string) {
  const now = new Date();

  const expiredClaims = await prisma.claim.findMany({
    where: {
      taskId,
      status: 'claimed',
      expiresAt: {
        lt: now
      }
    }
  });

  if (expiredClaims.length > 0) {
    await prisma.$transaction(async (tx) => {
      // Update expired claims
      await tx.claim.updateMany({
        where: {
          id: { in: expiredClaims.map(c => c.id) }
        },
        data: {
          status: 'expired'
        }
      });

      // Reset task to open
      await tx.task.update({
        where: { id: taskId },
        data: { status: 'open' }
      });
    });
  }
}
