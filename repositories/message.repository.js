const pool = require('../config/db');

/**
 * Fetch all messages in a user's support thread with admin.
 * Covers both directions:
 *   - messages sent by the user to admin (receiver_id IS NULL)
 *   - messages sent by admin to the user (receiver_id = userId)
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function findThreadByUser(userId) {
  const { rows } = await pool.query(
    `SELECT id, sender_id, receiver_id, message, is_read, created_at
     FROM messages
     WHERE (sender_id = $1 AND receiver_id IS NULL)
        OR receiver_id = $1
     ORDER BY created_at ASC`,
    [userId]
  );
  return rows;
}

/**
 * Mark all unread messages from a specific user (sent to admin) as read.
 * Used when admin opens the conversation.
 * @param {number} fromUserId
 * @returns {Promise<void>}
 */
async function markThreadAsRead(fromUserId) {
  await pool.query(
    `UPDATE messages
     SET is_read = true
     WHERE sender_id = $1 AND receiver_id IS NULL AND is_read = false`,
    [fromUserId]
  );
}

/**
 * List all unique conversations visible to admin.
 * Returns one row per user with last-message time and unread count.
 * @returns {Promise<Array>}
 */
async function findAllConversationsForAdmin() {
  const { rows } = await pool.query(
    `SELECT
       u.id AS user_id,
       u.email,
       MAX(m.created_at) AS last_message_time,
       COUNT(CASE WHEN m.is_read = false AND m.receiver_id IS NULL THEN 1 END) AS unread_count
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.receiver_id IS NULL
     GROUP BY u.id, u.email
     ORDER BY last_message_time DESC`
  );
  return rows;
}

/**
 * Insert a new message sent by a user to admin (receiver_id = NULL).
 * @param {number} senderUserId
 * @param {string} message
 * @returns {Promise<object>}
 */
async function createUserMessage(senderUserId, message) {
  const { rows } = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, message, is_read)
     VALUES ($1, NULL, $2, false)
     RETURNING id, sender_id, receiver_id, message, is_read, created_at`,
    [senderUserId, message]
  );
  return rows[0];
}

/**
 * Insert a reply sent by admin to a specific user.
 * @param {number} adminUserId
 * @param {number} receiverUserId
 * @param {string} message
 * @returns {Promise<object>}
 */
async function createAdminReply(adminUserId, receiverUserId, message) {
  const { rows } = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, message, is_read)
     VALUES ($1, $2, $3, false)
     RETURNING id, sender_id, receiver_id, message, is_read, created_at`,
    [adminUserId, receiverUserId, message]
  );
  return rows[0];
}

module.exports = {
  findThreadByUser,
  markThreadAsRead,
  findAllConversationsForAdmin,
  createUserMessage,
  createAdminReply,
};
