/**
 * Leaderboard Routes (Express Backend)
 * /api/v1/leaderboard
 *
 * Handles ranking queries for users
 */

const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /leaderboard
 * Get leaderboard rankings
 * Query params:
 *  - type: "total" (default) | "today" | "streak"
 *  - limit: number (default 100, max 200)
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    type = 'total',
    limit = 100
  } = req.query;

  const parsedLimit = Math.min(parseInt(limit, 10) || 100, 200);

  let users;
  let orderBy;

  switch (type) {
    case 'today':
      // Today's leaderboard - based on points gained today
      // For MVP, we use total points as we don't have PointLedger yet
      // TODO: Implement with PointLedger table
      orderBy = { points: 'desc' };
      break;

    case 'streak':
      // Consecutive completion streak
      orderBy = { currentStreak: 'desc' };
      break;

    case 'total':
    default:
      // Total points leaderboard
      orderBy = { points: 'desc' };
      break;
  }

  users = await prisma.user.findMany({
    where: {
      points: { gt: 0 }  // Only show users with points
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      title: true,
      location: true,
      points: true,
      tasksCompleted: true,
      tasksAccepted: true,
      currentStreak: true,
      createdAt: true
    },
    orderBy,
    take: parsedLimit
  });

  // Add rank to each user
  const rankedUsers = users.map((user, index) => ({
    ...user,
    rank: index + 1
  }));

  success(res, {
    type,
    users: rankedUsers,
    count: rankedUsers.length
  });
}));

module.exports = router;
