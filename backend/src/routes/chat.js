/**
 * routes/chat.js
 * Chat API endpoints
 * GET/POST operations for chat management
 */

const express = require('express');
const router = express.Router();
const ChatService = require('../services/ChatService');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/chats
 * Create a new chat session
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { agentId } = req.body;
    const userId = req.user.id;

    const chat = await ChatService.createChat(userId, agentId || null);

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: chat
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat',
      error: error.message
    });
  }
});

/**
 * GET /api/chats/:id/messages
 * Get chat message history with pagination
 */
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Validate pagination
    const parsedLimit = Math.min(parseInt(limit) || 50, 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    const messages = await ChatService.getChatHistory(id, parsedLimit, parsedOffset);

    res.status(200).json({
      success: true,
      message: 'Chat history retrieved',
      data: messages,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        count: messages.length
      }
    });
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history',
      error: error.message
    });
  }
});

/**
 * GET /api/chats/user/:userId
 * Get all chats for a specific user
 */
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    // Verify user can only access their own chats
    if (parseInt(userId) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const userChats = await ChatService.getUserChats(userId, parseInt(limit) || 20);

    res.status(200).json({
      success: true,
      message: 'User chats retrieved',
      data: userChats,
      count: userChats.length
    });
  } catch (error) {
    console.error('Error retrieving user chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user chats',
      error: error.message
    });
  }
});

/**
 * GET /api/chats/:id/unread-count
 * Get unread message count for a chat
 */
router.get('/:id/unread-count', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const unreadCount = await ChatService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      message: 'Unread count retrieved',
      data: {
        chatId: id,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error retrieving unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve unread count',
      error: error.message
    });
  }
});

/**
 * GET /api/agents/available
 * Get list of available agents
 */
router.get('/agents/available', authenticate, async (req, res) => {
  try {
    const availableAgents = await ChatService.getAvailableAgents();

    res.status(200).json({
      success: true,
      message: 'Available agents retrieved',
      data: availableAgents,
      count: availableAgents.length
    });
  } catch (error) {
    console.error('Error retrieving available agents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available agents',
      error: error.message
    });
  }
});

/**
 * POST /api/chats/:id/close
 * Close a chat session
 */
router.post('/:id/close', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'User closed' } = req.body;

    await ChatService.closeChat(id, reason);

    res.status(200).json({
      success: true,
      message: 'Chat closed successfully',
      data: {
        chatId: id,
        closedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error closing chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close chat',
      error: error.message
    });
  }
});

/**
 * PUT /api/chats/:messageId/read
 * Mark a message as read
 */
router.put('/:messageId/read', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;

    await ChatService.markAsRead(messageId);

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: {
        messageId
      }
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message
    });
  }
});

/**
 * GET /api/agents/:agentId/presence
 * Get agent presence status
 */
router.get('/agents/:agentId/presence', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;

    const presence = await ChatService.getAgentPresence(agentId);

    res.status(200).json({
      success: true,
      message: 'Agent presence retrieved',
      data: presence
    });
  } catch (error) {
    console.error('Error retrieving agent presence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve agent presence',
      error: error.message
    });
  }
});

module.exports = router;
