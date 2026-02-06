import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/google';
import { prisma } from '@/lib/db';

// POST /api/tasks/:id/submit - Submit task result (User only)
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

    // Parse request body
    const body = await request.json();
    const { submission, submissionUrl, submissionCode } = body;

    // Get task
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get claim
    const claim = await prisma.claim.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId
        }
      }
    });

    if (!claim) {
      return NextResponse.json(
        { error: 'You have not claimed this task' },
        { status: 400 }
      );
    }

    if (claim.status !== 'claimed') {
      return NextResponse.json(
        { error: 'Task cannot be submitted' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > claim.expiresAt) {
      return NextResponse.json(
        { error: 'Your claim has expired' },
        { status: 400 }
      );
    }

    // Verify dynamic code
    if (submissionCode !== task.dynamicCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Validate submission based on evidence type
    if (task.evidenceType === 'link' && !submissionUrl) {
      return NextResponse.json(
        { error: 'Link submission is required' },
        { status: 400 }
      );
    }
    if (task.evidenceType === 'text' && !submission) {
      return NextResponse.json(
        { error: 'Text submission is required' },
        { status: 400 }
      );
    }

    // Update claim and task
    const updatedClaim = await prisma.$transaction(async (tx) => {
      const newClaim = await tx.claim.update({
        where: {
          taskId_userId: {
            taskId,
            userId
          }
        },
        data: {
          status: 'submitted',
          submission,
          submissionUrl,
          submissionCode,
          submittedAt: new Date()
        }
      });

      await tx.task.update({
        where: { id: taskId },
        data: { status: 'submitted' }
      });

      return newClaim;
    });

    return NextResponse.json({
      success: true,
      claim: {
        id: updatedClaim.id,
        status: updatedClaim.status,
        submittedAt: updatedClaim.submittedAt
      }
    });

  } catch (error) {
    console.error('Submit task error:', error);
    return NextResponse.json(
      { error: 'Failed to submit task' },
      { status: 500 }
    );
  }
}
