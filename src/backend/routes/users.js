/**
 * User Routes (Express Backend)
 * /api/v1/users/*
 *
 * Handles user listing and details for "人才市场" (Human Marketplace)
 */

const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /users
 * Get user list (人才市场)
 * Query params:
 *  - limit: number (default 20, max 100)
 *  - offset: number (default 0)
 *  - skills: comma-separated skill tags
 *  - minPoints: minimum points
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    limit = 20,
    offset = 0,
    skills,
    minPoints
  } = req.query;

  const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const parsedOffset = parseInt(offset, 10) || 0;

  // Build where clause
  const where = {};

  if (skills) {
    const skillArray = skills.split(',').map(s => s.trim());
    where.skills = {
      hasSome: skillArray
    };
  }

  if (minPoints) {
    where.points = {
      gte: parseInt(minPoints, 10)
    };
  }

  // Get users
  const users = await prisma.user.findMany({
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
      createdAt: true
    },
    orderBy: {
      points: 'desc'  // 积分高的优先展示
    },
    take: parsedLimit,
    skip: parsedOffset
  });

  // Get total count
  const total = await prisma.user.count({ where });

  success(res, {
    users,
    count: users.length,
    total,
    limit: parsedLimit,
    offset: parsedOffset
  });
}));

/**
 * GET /users/:id
 * Get user details (人才详情)
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
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
      createdAt: true
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  success(res, { user });
}));

module.exports = router;
