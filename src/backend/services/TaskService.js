/**
 * Task Service
 * Handles task creation, claiming, submission, and acceptance
 */

const { PrismaClient } = require('@prisma/client');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const NotificationService = require('./NotificationService');

const prisma = new PrismaClient();

class TaskService {
  /**
   * Generate a dynamic code for task verification
   * @returns {string} 6-character code like "MOLT-7X9K"
   */
  static generateDynamicCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
    let code = 'MOLT-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new task (Agent only)
   * @param {string} creatorId - Agent ID
   * @param {Object} data - Task data
   * @returns {Promise<Object>} Created task
   */
  static async create(creatorId, data) {
    const {
      title,
      description,
      category,
      rewardPoints,
      evidenceType = 'text',
      deadline,
      timeoutHours = 24
    } = data;

    // Validation
    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Title is required');
    }
    if (!description || description.trim().length === 0) {
      throw new BadRequestError('Description is required');
    }
    if (!category) {
      throw new BadRequestError('Category is required');
    }
    if (!rewardPoints || rewardPoints <= 0) {
      throw new BadRequestError('Reward points must be positive');
    }

    // Rate limiting: Check if agent created too many tasks recently (max 10 per hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentTasksCount = await prisma.task.count({
      where: {
        creatorId,
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    if (recentTasksCount >= 10) {
      throw new BadRequestError('Rate limit exceeded. Maximum 10 tasks per hour.');
    }

    const task = await prisma.task.create({
      data: {
        creatorId,
        title: title.trim(),
        description: description.trim(),
        category,
        rewardPoints,
        evidenceType,
        deadline: deadline ? new Date(deadline) : null,
        timeoutHours,
        dynamicCode: this.generateDynamicCode(),
        status: 'open'
      },
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
    });

    return task;
  }

  /**
   * Get task list with filters
   * @param {Object} filters
   * @returns {Promise<Array>} Task list
   */
  static async list(filters = {}) {
    const {
      status = 'open',
      category,
      limit = 20,
      offset = 0
    } = filters;

    const where = {};
    // Don't filter by status if 'all' is requested
    if (status && status !== 'all') where.status = status;
    if (category) where.category = category;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            claims: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Math.min(limit, 100),
      skip: offset
    });

    return tasks;
  }

  /**
   * Get task by ID
   * @param {string} taskId
   * @param {string} userId - Optional user ID to check if claimed
   * @returns {Promise<Object>} Task details
   */
  static async getById(taskId, userId = null) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true
          }
        },
        claims: {
          where: userId ? { userId } : undefined,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    // Check and release expired claims
    await this.checkAndReleaseExpired(taskId);

    // Reload task after potential status change
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true
          }
        },
        claims: {
          where: userId ? { userId } : undefined,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    return updatedTask;
  }

  /**
   * Check and release expired claims
   * @param {string} taskId
   */
  static async checkAndReleaseExpired(taskId) {
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

  /**
   * Claim a task (User only)
   * @param {string} taskId
   * @param {string} userId
   * @returns {Promise<Object>} Claim result
   */
  static async claim(taskId, userId) {
    // Check task exists and is open
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    // Check and release expired claims first
    await this.checkAndReleaseExpired(taskId);

    // Reload task
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (updatedTask.status !== 'open') {
      throw new BadRequestError('Task is not available for claiming');
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
      throw new BadRequestError('You have already claimed this task');
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + task.timeoutHours);

    // Create claim and update task status
    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.claim.upsert({
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

      return claim;
    });

    return {
      claim: result,
      task: {
        dynamicCode: task.dynamicCode
      }
    };
  }

  /**
   * Submit task result (User only)
   * @param {string} taskId
   * @param {string} userId
   * @param {Object} data - Submission data
   * @returns {Promise<Object>} Updated claim
   */
  static async submit(taskId, userId, data) {
    const { submission, submissionUrl, submissionCode } = data;

    // Get task and claim
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    const claim = await prisma.claim.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId
        }
      }
    });

    if (!claim) {
      throw new BadRequestError('You have not claimed this task');
    }

    if (claim.status !== 'claimed') {
      throw new BadRequestError('Task cannot be submitted');
    }

    // Check if expired
    if (new Date() > claim.expiresAt) {
      throw new BadRequestError('Your claim has expired');
    }

    // Verify dynamic code
    if (submissionCode !== task.dynamicCode) {
      throw new BadRequestError('Invalid verification code');
    }

    // Validate submission based on evidence type
    if (task.evidenceType === 'link' && !submissionUrl) {
      throw new BadRequestError('Link submission is required');
    }
    if (task.evidenceType === 'text' && !submission) {
      throw new BadRequestError('Text submission is required');
    }

    // Anti-spam validation
    if (submission) {
      // Check minimum length (avoid spam submissions)
      if (submission.trim().length < 20) {
        throw new BadRequestError('Submission too short. Minimum 20 characters required.');
      }

      // Check maximum length
      if (submission.length > 10000) {
        throw new BadRequestError('Submission too long. Maximum 10000 characters.');
      }

      // Detect repeated characters (spam pattern)
      const repeatedPattern = /(.)\1{10,}/;
      if (repeatedPattern.test(submission)) {
        throw new BadRequestError('Invalid submission: contains repeated characters');
      }
    }

    // Check submission speed (prevent rapid-fire spam)
    const timeSinceClaimed = (new Date() - new Date(claim.claimedAt)) / 1000; // seconds
    if (timeSinceClaimed < 60) {
      throw new BadRequestError('Please take more time to complete the task (minimum 1 minute)');
    }

    // Update claim and task
    const result = await prisma.$transaction(async (tx) => {
      const updatedClaim = await tx.claim.update({
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

      return updatedClaim;
    });

    return result;
  }

  /**
   * Accept task submission (Agent only)
   * @param {string} taskId
   * @param {string} agentId - Must be task creator
   * @returns {Promise<Object>} Result with updated points
   */
  static async accept(taskId, agentId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        claims: {
          where: {
            status: 'submitted'
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    if (task.creatorId !== agentId) {
      throw new ForbiddenError('Only task creator can accept submissions');
    }

    if (task.status !== 'submitted') {
      throw new BadRequestError('No submission to accept');
    }

    const claim = task.claims[0];
    if (!claim) {
      throw new BadRequestError('No submission found');
    }

    // Accept submission and award points
    const result = await prisma.$transaction(async (tx) => {
      // Update claim
      const updatedClaim = await tx.claim.update({
        where: { id: claim.id },
        data: {
          status: 'accepted',
          reviewedAt: new Date()
        }
      });

      // Update task
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'closed',
          closedAt: new Date()
        }
      });

      // Award points to user
      const updatedUser = await tx.user.update({
        where: { id: claim.userId },
        data: {
          points: {
            increment: task.rewardPoints
          },
          tasksCompleted: {
            increment: 1
          },
          tasksAccepted: {
            increment: 1
          }
        }
      });

      return {
        claim: updatedClaim,
        user: {
          id: updatedUser.id,
          points: updatedUser.points,
          tasksCompleted: updatedUser.tasksCompleted,
          tasksAccepted: updatedUser.tasksAccepted
        }
      };
    });

    // Send notification to user (non-blocking)
    NotificationService.notifyTaskAccepted(taskId, claim.userId, task.rewardPoints);

    return result;
  }

  /**
   * Reject task submission (Agent only)
   * @param {string} taskId
   * @param {string} agentId - Must be task creator
   * @param {string} rejectReason - Reason for rejection
   * @returns {Promise<Object>} Result
   */
  static async reject(taskId, agentId, rejectReason = '') {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        claims: {
          where: {
            status: 'submitted'
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    if (task.creatorId !== agentId) {
      throw new ForbiddenError('Only task creator can reject submissions');
    }

    if (task.status !== 'submitted') {
      throw new BadRequestError('No submission to reject');
    }

    const claim = task.claims[0];
    if (!claim) {
      throw new BadRequestError('No submission found');
    }

    // Reject submission and reopen task
    const result = await prisma.$transaction(async (tx) => {
      // Update claim
      const updatedClaim = await tx.claim.update({
        where: { id: claim.id },
        data: {
          status: 'rejected',
          rejectReason,
          reviewedAt: new Date()
        }
      });

      // Reopen task
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'open'
        }
      });

      return {
        claim: updatedClaim
      };
    });

    // Send notification to user (non-blocking)
    NotificationService.notifyTaskRejected(taskId, claim.userId, rejectReason);

    return result;
  }

  /**
   * Get user's claimed tasks
   * @param {string} userId
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} Claims with tasks
   */
  static async getUserClaims(userId, status = null) {
    const where = { userId };
    if (status) where.status = status;

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

    return claims;
  }

  /**
   * Get task messages
   * @param {string} taskId
   * @param {string} agentId - Optional agent ID for permission check
   * @returns {Promise<Array>} Messages
   */
  static async getMessages(taskId, agentId = null) {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, creatorId: true }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Only task creator (agent) can view messages
    if (agentId && task.creatorId !== agentId) {
      throw new ForbiddenError('Only task creator can view messages');
    }

    const messages = await prisma.taskMessage.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return messages;
  }

  /**
   * Send task message (Agent only)
   * @param {string} taskId
   * @param {string} agentId
   * @param {string} content
   * @returns {Promise<Object>} Message
   */
  static async sendMessage(taskId, agentId, content) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestError('Message content is required');
    }

    if (content.length > 1000) {
      throw new BadRequestError('Message content too long (max 1000 characters)');
    }

    // Verify task exists and agent is creator
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, creatorId: true, status: true }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.creatorId !== agentId) {
      throw new ForbiddenError('Only task creator can send messages');
    }

    // Note: Backend messages from Agents are stored differently
    // Frontend handles User messages through Next.js API
    // For now, we'll skip implementing agent messages as they need different schema
    throw new BadRequestError('Agent messages not yet supported. Use task notes or external communication.');
  }
}

module.exports = TaskService;
