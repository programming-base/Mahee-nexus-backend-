const messageRepo = require('../repositories/message.repository');
const userRepo = require('../repositories/user.repository');

/**
 * Get the support message thread for a user (jobseeker or employer).
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function getMyMessages(userId) {
  return messageRepo.findThreadByUser(userId);
}

/**
 * Send a message from a user to admin (receiver_id = NULL).
 * @param {number} userId
 * @param {string} message
 * @returns {Promise<object>}
 */
async function sendMessageToAdmin(userId, message) {
  return messageRepo.createUserMessage(userId, message);
}

/**
 * List all conversations for admin inbox.
 * @returns {Promise<Array>}
 */
async function listConversations() {
  return messageRepo.findAllConversationsForAdmin();
}

/**
 * Get a specific conversation thread (admin view).
 * Marks unread messages from that user as read.
 * @param {number} targetUserId
 * @returns {Promise<object>} { user, messages }
 */
async function getConversation(targetUserId) {
  const user = await userRepo.findById(targetUserId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  await messageRepo.markThreadAsRead(targetUserId);
  const messages = await messageRepo.findThreadByUser(targetUserId);

  return { user: { id: user.id, email: user.email }, messages };
}

/**
 * Send a reply from admin to a specific user.
 * @param {number} adminUserId
 * @param {number} targetUserId
 * @param {string} message
 * @returns {Promise<object>}
 */
async function replyToUser(adminUserId, targetUserId, message) {
  const user = await userRepo.findById(targetUserId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return messageRepo.createAdminReply(adminUserId, targetUserId, message);
}

module.exports = {
  getMyMessages,
  sendMessageToAdmin,
  listConversations,
  getConversation,
  replyToUser,
};
