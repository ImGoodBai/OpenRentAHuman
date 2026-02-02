import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/google';
import { prisma } from '@/lib/db';

// GET /api/user/accounts - Get all platform accounts for current user
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifySessionToken(sessionToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const accounts = await prisma.platformAccount.findMany({
      where: { userId: payload.userId as string },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// POST /api/user/accounts - Create new platform account
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifySessionToken(sessionToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, agentName, apiKey, displayName, verificationCode, claimUrl, isClaimed } = body;

    if (!platform || !agentName || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, agentName, apiKey' },
        { status: 400 }
      );
    }

    // Check if account already exists
    const existing = await prisma.platformAccount.findUnique({
      where: {
        userId_platform_agentName: {
          userId: payload.userId as string,
          platform,
          agentName,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Account already exists' },
        { status: 409 }
      );
    }

    // Create new account
    const account = await prisma.platformAccount.create({
      data: {
        userId: payload.userId as string,
        platform,
        agentName,
        apiKey,
        displayName,
        verificationCode: verificationCode || null,
        claimUrl: claimUrl || null,
        isClaimed: isClaimed !== undefined ? isClaimed : false,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error('Failed to create account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

// PATCH /api/user/accounts/:id - Update account
export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifySessionToken(sessionToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { id, displayName, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing account id' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.platformAccount.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Update account
    const account = await prisma.platformAccount.update({
      where: { id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Failed to update account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/accounts/:id - Delete account
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifySessionToken(sessionToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing account id' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.platformAccount.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Delete account
    await prisma.platformAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
