/**
 * RealTimeGateway.js
 * WebSocket gateway using Socket.io for real-time chat
 * Manages connections, message routing, and presence updates
 */

const SocketIO = require('socket.io');
const ChatService = require('../services/ChatService');
const { verifyToken } = require('../middleware/auth');

class RealTimeGateway {
  constructor(server) {
    this.io = new SocketIO(server, {
      cors: { 
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      maxHttpBufferSize: 10 * 1024 * 1024 // 10MB for file uploads
    });

    this.setupMiddleware();
    this.setupEvents();
  }

  /**
   * Setup Socket.io middleware for authentication
   */
  setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('No token provided'));
      }

      try {
        const decoded = verifyToken(token);
        socket.userId = decoded.id;
        socket.userRole = decoded.role; // 'user', 'agent', 'admin'
        socket.userName = decoded.name;
        next();
      } catch (error) {
        console.error('Token verification failed:', error);
        next(new Error('Invalid token'));
      }
    });
  }

  /**
   * Setup Socket.io event handlers
   */
  setupEvents() {
    this.io.on('connection', (socket) => {
      console.log(`[CHAT] User ${socket.userId} connected - Role: ${socket.userRole}`);

      // User joins a specific chat room
      socket.on('join-chat', async (data) => {
        try {
          const { chatId } = data;
          
          if (!chatId) {
            socket.emit('error', { message: 'Chat ID required' });
            return;
          }

          // Join Socket.io room
          socket.join(`chat:${chatId}`);
          console.log(`[CHAT] User ${socket.userId} joined chat ${chatId}`);

          // Notify others that user is online
          this.io.to(`chat:${chatId}`).emit('user-joined', {
            chatId,
            userId: socket.userId,
            userName: socket.userName,
            userRole: socket.userRole,
            timestamp: new Date()
          });

          socket.emit('join-chat-success', { 
            chatId, 
            message: 'Successfully joined chat' 
          });
        } catch (error) {
          console.error('Error joining chat:', error);
          socket.emit('error', { message: error.message });
        }
      });

      // User sends a message
      socket.on('send-message', async (data) => {
        try {
          const { chatId, message, fileUrl, fileType } = data;

          if (!chatId || !message || !message.trim()) {
            socket.emit('error', { message: 'Invalid message data' });
            return;
          }

          // Save message to database
          const msg = await ChatService.addMessage(
            chatId,
            socket.userId,
            socket.userRole === 'user' ? 'user' : 'agent',
            message,
            fileUrl || null,
            fileType || null
          );

          // Broadcast message to chat room
          this.io.to(`chat:${chatId}`).emit('message-received', {
            id: msg.id,
            chatId: msg.chat_id,
            senderId: msg.sender_id,
            senderName: socket.userName,
            senderType: msg.sender_type,
            message: msg.message,
            fileUrl: msg.file_url,
            fileType: msg.file_type,
            createdAt: msg.created_at
          });

          // Confirm delivery to sender
          socket.emit('message-delivered', { 
            messageId: msg.id,
            chatId: msg.chat_id,
            status: 'delivered' 
          });

          console.log(`[CHAT] Message sent in chat ${chatId} by user ${socket.userId}`);
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // User marks message as read
      socket.on('mark-read', async (data) => {
        try {
          const { messageId } = data;

          if (!messageId) {
            socket.emit('error', { message: 'Message ID required' });
            return;
          }

          await ChatService.markAsRead(messageId);

          // Broadcast read status to all connected users
          this.io.emit('message-read', { 
            messageId,
            readBy: socket.userId,
            readAt: new Date()
          });
        } catch (error) {
          console.error('Error marking message as read:', error);
          socket.emit('error', { message: 'Failed to mark as read' });
        }
      });

      // User is typing
      socket.on('typing', (data) => {
        try {
          const { chatId } = data;

          if (!chatId) return;

          // Broadcast typing status to chat room (except sender)
          socket.to(`chat:${chatId}`).emit('user-typing', {
            chatId,
            userId: socket.userId,
            userName: socket.userName,
            isTyping: true
          });
        } catch (error) {
          console.error('Error handling typing event:', error);
        }
      });

      // User stops typing
      socket.on('stop-typing', (data) => {
        try {
          const { chatId } = data;

          if (!chatId) return;

          socket.to(`chat:${chatId}`).emit('user-typing', {
            chatId,
            userId: socket.userId,
            userName: socket.userName,
            isTyping: false
          });
        } catch (error) {
          console.error('Error handling stop-typing event:', error);
        }
      });

      // Agent updates presence status
      socket.on('agent-status', async (data) => {
        try {
          if (socket.userRole !== 'agent') {
            socket.emit('error', { message: 'Only agents can update status' });
            return;
          }

          const { status } = data; // 'online', 'away', 'busy', 'offline'

          if (!['online', 'away', 'busy', 'offline'].includes(status)) {
            socket.emit('error', { message: 'Invalid status' });
            return;
          }

          // Update in database
          await ChatService.updateAgentPresence(socket.userId, status);

          // Broadcast to all connected users
          this.io.emit('agent-status-updated', {
            agentId: socket.userId,
            agentName: socket.userName,
            status,
            timestamp: new Date()
          });

          console.log(`[CHAT] Agent ${socket.userId} status updated to ${status}`);
        } catch (error) {
          console.error('Error updating agent status:', error);
          socket.emit('error', { message: 'Failed to update status' });
        }
      });

      // User leaves chat room
      socket.on('leave-chat', (data) => {
        try {
          const { chatId } = data;

          if (!chatId) return;

          socket.leave(`chat:${chatId}`);

          // Notify others
          this.io.to(`chat:${chatId}`).emit('user-left', {
            chatId,
            userId: socket.userId,
            userName: socket.userName,
            timestamp: new Date()
          });

          console.log(`[CHAT] User ${socket.userId} left chat ${chatId}`);
        } catch (error) {
          console.error('Error leaving chat:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        try {
          console.log(`[CHAT] User ${socket.userId} disconnected`);

          // If agent, mark as offline
          if (socket.userRole === 'agent') {
            await ChatService.updateAgentPresence(socket.userId, 'offline');
            this.io.emit('agent-status-updated', {
              agentId: socket.userId,
              agentName: socket.userName,
              status: 'offline',
              timestamp: new Date()
            });
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`[CHAT] Socket error for user ${socket.userId}:`, error);
      });
    });
  }

  /**
   * Emit event to specific chat room
   * @param {number} chatId - Chat ID
   * @param {string} event - Event name
   * @param {Object} data - Data to send
   */
  emitToChat(chatId, event, data) {
    this.io.to(`chat:${chatId}`).emit(event, data);
  }

  /**
   * Emit event to specific user
   * @param {number} userId - User ID
   * @param {string} event - Event name
   * @param {Object} data - Data to send
   */
  emitToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Get connected users count
   * @returns {number} Number of connected sockets
   */
  getConnectedUsersCount() {
    return this.io.engine.clientsCount || 0;
  }

  /**
   * Get room members
   * @param {string} room - Room name (e.g., "chat:123")
   * @returns {number} Number of members in room
   */
  getRoomMembersCount(room) {
    const sockets = this.io.sockets.adapter.rooms.get(room);
    return sockets ? sockets.size : 0;
  }
}

module.exports = RealTimeGateway;
