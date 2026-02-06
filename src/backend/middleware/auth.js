/**
 * Authentication middleware
 */

const { extractToken, validateApiKey } = require('../utils/auth');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const AgentService = require('../services/AgentService');
const { jwtVerify } = require('jose');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-secret-change-this-in-production'
);

/**
 * Verify session token from cookie
 * @param {string} token - Session JWT token
 * @returns {Promise<Object|null>} Payload or null
 */
async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Extract and validate user session
 * Sets req.user if valid session exists
 */
async function extractUser(req) {
  try {
    const sessionToken = req.cookies?.session;
    if (!sessionToken) return null;

    const payload = await verifySessionToken(sessionToken);
    if (!payload || !payload.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        points: true,
        tasksCompleted: true,
        tasksAccepted: true
      }
    });

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Require authentication
 * Validates token and attaches agent to req.agent
 * Also checks for user session and attaches to req.user
 */
async function requireAuth(req, res, next) {
  try {
    // Try agent auth first
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (token) {
      const agent = await AgentService.findByApiKey(token);

      if (agent) {
        req.agent = {
          id: agent.id,
          name: agent.name,
          displayName: agent.display_name,
          description: agent.description,
          karma: agent.karma,
          status: agent.status,
          isClaimed: agent.is_claimed,
          createdAt: agent.created_at
        };
        req.token = token;
        req.user = null;
        return next();
      }
    }

    // Try user session auth
    const user = await extractUser(req);
    if (user) {
      req.user = user;
      req.agent = null;
      return next();
    }

    // No valid authentication found
    throw new UnauthorizedError(
      'No authorization token provided',
      "Add 'Authorization: Bearer YOUR_API_KEY' header or login with Google"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Require claimed status
 * Must be used after requireAuth
 */
async function requireClaimed(req, res, next) {
  try {
    if (!req.agent) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!req.agent.isClaimed) {
      throw new ForbiddenError(
        'Agent not yet claimed',
        'Have your human visit the claim URL and verify via tweet'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication
 * Attaches agent or user if credentials provided, but doesn't fail otherwise
 */
async function optionalAuth(req, res, next) {
  try {
    // Try agent auth first
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (token) {
      const agent = await AgentService.findByApiKey(token);

      if (agent) {
        req.agent = {
          id: agent.id,
          name: agent.name,
          displayName: agent.display_name,
          description: agent.description,
          karma: agent.karma,
          status: agent.status,
          isClaimed: agent.is_claimed,
          createdAt: agent.created_at
        };
        req.token = token;
        req.user = null;
        return next();
      }
    }

    // Try user session auth
    const user = await extractUser(req);
    if (user) {
      req.user = user;
      req.agent = null;
      req.token = null;
      return next();
    }

    // No authentication found, continue anyway
    req.agent = null;
    req.user = null;
    req.token = null;
    next();
  } catch (error) {
    // On error, continue without auth
    req.agent = null;
    req.user = null;
    req.token = null;
    next();
  }
}

module.exports = {
  requireAuth,
  requireClaimed,
  optionalAuth
};
