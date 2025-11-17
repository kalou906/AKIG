/**
 * ChatService.js
 * Real-time chat service for agent-user communication
 * Manages chat creation, messages, presence, and history
 */

const { pool } = require('../db');

class ChatService {
  constructor() {
    // Redis disabled for development
    this.redisClient = null;
  }

  /**
   * Create a new chat session
   * @param {number} userId - User ID starting the chat
   * @param {number} agentId - Agent ID (optional, will assign if not provided)
   * @returns {Promise<Object>} Chat object
   */
  async createChat(userId, agentId = null) {
    const client = await pool.connect();
    try {
      // Determine agent assignment
      let finalAgentId = agentId;
      if (!finalAgentId) {
        // Get available agent with lowest chat count
        const agentResult = await pool.query(
          `SELECT agent_id FROM agent_presence 
           WHERE status IN ('online', 'away')
           ORDER BY current_chat_count ASC
           LIMIT 1`
        );
        finalAgentId = agentResult.rows.length > 0 ? agentResult.rows[0].agent_id : null;
      }

      // Create chat in database
      const result = await client.query(
        `INSERT INTO chats (user_id, agent_id, status, created_at, updated_at) 
         VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, finalAgentId]
      );

      const chat = result.rows[0];

      // Cache in Redis
      await this.redisClient.setex(
        `chat:${chat.id}`,
        3600,
        JSON.stringify(chat)
      );

      // Increment agent's chat count
      if (finalAgentId) {
        await pool.query(
          `UPDATE agent_presence 
           SET current_chat_count = current_chat_count + 1 
           WHERE agent_id = $1`,
          [finalAgentId]
        );
      }

      return chat;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add a message to a chat
   * @param {number} chatId - Chat ID
   * @param {number} senderId - Sender's user ID
   * @param {string} senderType - 'user' or 'agent'
   * @param {string} message - Message text
   * @param {string} fileUrl - Optional file URL
   * @param {string} fileType - Optional file type (image, document, etc)
   * @returns {Promise<Object>} Message object
   */
  async addMessage(chatId, senderId, senderType, message, fileUrl = null, fileType = null) {
    const client = await pool.connect();
    try {
      // Validate inputs
      if (!chatId || !senderId || !message.trim()) {
        throw new Error('Invalid message parameters');
      }

      // Insert message
      const result = await client.query(
        `INSERT INTO chat_messages 
         (chat_id, sender_id, sender_type, message, file_url, file_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING *`,
        [chatId, senderId, senderType, message.trim(), fileUrl, fileType]
      );

      const msg = result.rows[0];

      // Update chat's updated_at timestamp
      await client.query(
        'UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [chatId]
      );

      // Cache message in Redis (last 50 messages per chat)
      const cacheKey = `chat:${chatId}:messages`;
      await this.redisClient.lpush(cacheKey, JSON.stringify(msg));
      await this.redisClient.ltrim(cacheKey, 0, 49);

      return msg;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get chat history
   * @param {number} chatId - Chat ID
   * @param {number} limit - Number of messages to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of messages
   */
  async getChatHistory(chatId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM chat_messages 
         WHERE chat_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [chatId, limit, offset]
      );
      return result.rows.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }

  /**
   * Mark a message as read
   * @param {number} messageId - Message ID
   * @returns {Promise<Object>} Updated message
   */
  async markAsRead(messageId) {
    try {
      const result = await pool.query(
        `UPDATE chat_messages 
         SET read_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND read_at IS NULL
         RETURNING *`,
        [messageId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Get agent's presence status
   * @param {number} agentId - Agent ID
   * @returns {Promise<Object>} Presence info or null
   */
  async getAgentPresence(agentId) {
    try {
      const result = await pool.query(
        'SELECT * FROM agent_presence WHERE agent_id = $1',
        [agentId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching agent presence:', error);
      throw error;
    }
  }

  /**
   * Update agent presence status
   * @param {number} agentId - Agent ID
   * @param {string} status - 'online', 'away', 'busy', 'offline'
   * @returns {Promise<Object>} Updated presence
   */
  async updateAgentPresence(agentId, status) {
    try {
      const result = await pool.query(
        `INSERT INTO agent_presence (agent_id, status, last_active, current_chat_count)
         VALUES ($1, $2, CURRENT_TIMESTAMP, 0)
         ON CONFLICT (agent_id) DO UPDATE
         SET status = $2, last_active = CURRENT_TIMESTAMP
         RETURNING *`,
        [agentId, status]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating agent presence:', error);
      throw error;
    }
  }

  /**
   * Get available agents (online, not too busy)
   * @returns {Promise<Array>} Array of available agents
   */
  async getAvailableAgents() {
    try {
      const result = await pool.query(
        `SELECT ap.*, u.email, u.first_name, u.last_name
         FROM agent_presence ap
         LEFT JOIN agents a ON ap.agent_id = a.id
         LEFT JOIN users u ON a.user_id = u.id
         WHERE ap.status IN ('online', 'away')
         AND ap.current_chat_count < 5
         ORDER BY ap.current_chat_count ASC, ap.last_active DESC
         LIMIT 10`
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching available agents:', error);
      throw error;
    }
  }

  /**
   * Close a chat session
   * @param {number} chatId - Chat ID
   * @returns {Promise<Object>} Updated chat
   */
  async closeChat(chatId) {
    const client = await pool.connect();
    try {
      // Get chat details
      const chatResult = await client.query(
        'SELECT * FROM chats WHERE id = $1',
        [chatId]
      );

      if (chatResult.rows.length === 0) {
        throw new Error('Chat not found');
      }

      const chat = chatResult.rows[0];

      // Close chat
      const result = await client.query(
        `UPDATE chats 
         SET status = 'closed', ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [chatId]
      );

      // Decrement agent's chat count
      if (chat.agent_id) {
        await client.query(
          `UPDATE agent_presence 
           SET current_chat_count = GREATEST(0, current_chat_count - 1)
           WHERE agent_id = $1`,
          [chat.agent_id]
        );
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error closing chat:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get unread message count for user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Unread message count
   */
  async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as unread_count
         FROM chat_messages cm
         JOIN chats c ON cm.chat_id = c.id
         WHERE c.user_id = $1
         AND cm.sender_type = 'agent'
         AND cm.read_at IS NULL`,
        [userId]
      );
      return parseInt(result.rows[0].unread_count) || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Get user's recent chats
   * @param {number} userId - User ID
   * @param {number} limit - Number of chats to fetch
   * @returns {Promise<Array>} Array of chats
   */
  async getUserChats(userId, limit = 10) {
    try {
      const result = await pool.query(
        `SELECT c.*, 
                COUNT(CASE WHEN cm.read_at IS NULL AND cm.sender_type = 'agent' THEN 1 END) as unread_count,
                (SELECT message FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
         FROM chats c
         LEFT JOIN chat_messages cm ON c.id = cm.chat_id
         WHERE c.user_id = $1
         GROUP BY c.id
         ORDER BY c.updated_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching user chats:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();
