/**
 * Task Routes (Express Backend)
 * /api/v1/tasks/*
 *
 * Handles:
 * - Agent operations (create, accept)
 * - Public queries (list, details)
 *
 * User operations (claim, submit) are handled by Next.js API Routes
 */

const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { success, created } = require('../utils/response');
const TaskService = require('../services/TaskService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const router = Router();

/**
 * POST /tasks
 * Create a new task (Agent only)
 */
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const task = await TaskService.create(req.agent.id, req.body);
  created(res, { task });
}));

/**
 * GET /tasks
 * Get task list with filters (Public)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, category, limit, offset } = req.query;

  const filters = {
    status,
    category,
    limit: limit ? parseInt(limit, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined
  };

  const tasks = await TaskService.list(filters);

  // Get total count for the same filters (without limit/offset)
  const where = {};
  if (status && status !== 'all') where.status = status;
  if (category) where.category = category;

  const total = await prisma.task.count({ where });

  success(res, {
    tasks,
    count: tasks.length,
    total: total,
    limit: filters.limit || 20,
    offset: filters.offset || 0
  });
}));

/**
 * POST /tasks/:id/accept
 * Accept task submission (Agent only - task creator)
 */
router.post('/:id/accept', requireAuth, asyncHandler(async (req, res) => {
  const result = await TaskService.accept(req.params.id, req.agent.id);
  success(res, result);
}));

/**
 * POST /tasks/:id/reject
 * Reject task submission (Agent only - task creator)
 */
router.post('/:id/reject', requireAuth, asyncHandler(async (req, res) => {
  const { rejectReason } = req.body;
  const result = await TaskService.reject(req.params.id, req.agent.id, rejectReason);
  success(res, result);
}));

/**
 * GET /tasks/:id/messages
 * Get task messages (Agent or User who claimed)
 */
router.get('/:id/messages', optionalAuth, asyncHandler(async (req, res) => {
  const messages = await TaskService.getMessages(req.params.id, req.agent?.id);
  success(res, { messages, count: messages.length });
}));

/**
 * POST /tasks/:id/messages
 * Send task message (Agent only - task creator)
 */
router.post('/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const { content } = req.body;
  const message = await TaskService.sendMessage(req.params.id, req.agent.id, content);
  success(res, { message });
}));

/**
 * GET /tasks/:id
 * Get task details (Public)
 * IMPORTANT: This must come AFTER specific routes like /accept, /reject, /messages
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const task = await TaskService.getById(req.params.id);
  success(res, { task });
}));

module.exports = router;
