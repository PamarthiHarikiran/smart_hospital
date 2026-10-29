const Notification = require('../models/Notification');

/**
 * Helper to dispatch in-app notifications
 * @param {Object} param0
 * @param {string} param0.userId - Target recipient user ID
 * @param {string} param0.title - Notification title
 * @param {string} param0.message - Notification body
 * @param {string} param0.type - APPOINTMENT | LAB | PRESCRIPTION | PHARMACY | BILL | ADMISSION | SYSTEM
 * @param {string} [param0.link] - Optional routing link for frontend
 */
const createNotification = async ({ userId, title, message, type = 'SYSTEM', link = '' }) => {
  try {
    if (!userId) return null;
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      link,
    });
    return notification;
  } catch (error) {
    console.error(`Failed to create notification for user ${userId}:`, error.message);
    return null;
  }
};

module.exports = { createNotification };
