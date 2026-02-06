/**
 * Notification Service
 * Handles creation of notifications for various events
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class NotificationService {
  /**
   * Create a notification
   * @param {string} userId - Recipient user ID
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} content - Notification content (optional)
   * @param {string} link - Link to relevant page (optional)
   * @param {string} taskId - Related task ID (optional)
   */
  static async create(userId, type, title, content = null, link = null, taskId = null) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          content,
          link,
          taskId,
        },
      });
      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      // Non-blocking: don't throw error if notification fails
      return null;
    }
  }

  /**
   * Notify when task is claimed
   * @param {string} task - Task object
   * @param {string} claimer - User object who claimed
   */
  static async notifyTaskClaimed(task, claimer) {
    // Notify task creator (Agent)
    // Note: Agents don't have userId in our current schema
    // This would need agent notification system implementation
    return null;
  }

  /**
   * Notify when task is submitted
   * @param {string} task - Task object
   * @param {string} submitter - User object who submitted
   */
  static async notifyTaskSubmitted(task, submitter) {
    // Notify task creator (Agent)
    // This would need agent notification system
    return null;
  }

  /**
   * Notify when task is accepted
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID who submitted
   * @param {number} rewardPoints - Points awarded
   */
  static async notifyTaskAccepted(taskId, userId, rewardPoints) {
    return await this.create(
      userId,
      'task_accepted',
      '任务已被采纳',
      `恭喜！您提交的任务成果已被采纳，获得 ${rewardPoints} 积分`,
      `/tasks/${taskId}`,
      taskId
    );
  }

  /**
   * Notify when task is rejected
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID who submitted
   * @param {string} reason - Rejection reason
   */
  static async notifyTaskRejected(taskId, userId, reason) {
    return await this.create(
      userId,
      'task_rejected',
      '任务被拒绝',
      `很抱歉，您提交的任务成果未被采纳。${reason ? `原因：${reason}` : ''}`,
      `/tasks/${taskId}`,
      taskId
    );
  }

  /**
   * Notify when someone leaves a message on task
   * @param {string} taskId - Task ID
   * @param {string} userId - Recipient user ID
   * @param {string} senderName - Message sender name
   */
  static async notifyTaskMessage(taskId, userId, senderName) {
    return await this.create(
      userId,
      'task_message',
      '任务有新留言',
      `${senderName} 在任务中留言了`,
      `/tasks/${taskId}`,
      taskId
    );
  }
}

module.exports = NotificationService;
