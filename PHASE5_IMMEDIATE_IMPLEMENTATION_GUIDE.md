# PHASE 5: IMMEDIATE IMPLEMENTATION GUIDE
## Ready-to-Code Specifications for Next Phase

**Document Version:** 1.0  
**Created:** October 29, 2025  
**Purpose:** Provide complete code-ready specifications for Phase 5 highest-priority features  
**Status:** ✅ READY FOR DEVELOPERS

---

## TABLE OF CONTENTS

1. Real-Time Chat Implementation
2. Live Notifications Service
3. Smart Search (NLP-Based)
4. Price Prediction Engine
5. AI-Enhanced Lead Scoring
6. Advanced Map Features
7. Mobile App Architecture
8. Getting Started Checklist

---

## 1. REAL-TIME CHAT IMPLEMENTATION

### Architecture Overview

```
Client (React)                    Server (Node.js)              Database (PostgreSQL)
    ├─ ChatWindow.jsx             ├─ Socket.io                  ├─ chats table
    ├─ MessageList.jsx            ├─ ChatService.js             ├─ chat_messages table
    ├─ MessageInput.jsx           ├─ messageQueue (Redis)       └─ agent_presence table
    └─ PresenceIndicator.jsx      └─ RealTimeGateway.js
```

### Backend Implementation

#### Step 1: Install Dependencies

```bash
npm install socket.io socket.io-client redis dotenv
```

#### Step 2: Database Schema

```sql
-- chats table
CREATE TABLE chats (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  agent_id BIGINT REFERENCES agents(id),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active', -- active, closed, resolved
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- chat_messages table
CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id),
  sender_type VARCHAR(20), -- 'user' or 'agent'
  message TEXT NOT NULL,
  file_url TEXT,
  file_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- agent_presence table
CREATE TABLE agent_presence (
  agent_id BIGINT PRIMARY KEY REFERENCES agents(id),
  status VARCHAR(20) DEFAULT 'offline', -- online, away, busy, offline
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  current_chat_count INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_agent_id ON chats(agent_id);
CREATE INDEX idx_chats_status ON chats(status);
CREATE INDEX idx_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX idx_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_messages_read_at ON chat_messages(read_at);
```

#### Step 3: ChatService.js

```javascript
// src/services/ChatService.js
const { pool } = require('../db');
const redis = require('redis');

class ChatService {
  constructor() {
    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
  }

  // Create new chat
  async createChat(userId, agentId = null) {
    try {
      const result = await pool.query(
        `INSERT INTO chats (user_id, agent_id, status) 
         VALUES ($1, $2, 'active')
         RETURNING *`,
        [userId, agentId]
      );
      
      // Store in Redis for quick access
      const chatId = result.rows[0].id;
      await this.redisClient.setex(
        `chat:${chatId}`,
        3600,
        JSON.stringify(result.rows[0])
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  // Add message to chat
  async addMessage(chatId, senderId, senderType, message, fileUrl = null, fileType = null) {
    try {
      const result = await pool.query(
        `INSERT INTO chat_messages 
         (chat_id, sender_id, sender_type, message, file_url, file_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING *`,
        [chatId, senderId, senderType, message, fileUrl, fileType]
      );

      // Update chat's updated_at timestamp
      await pool.query(
        'UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [chatId]
      );

      // Store in Redis for quick access
      const messageKey = `chat:${chatId}:messages`;
      await this.redisClient.lpush(
        messageKey,
        JSON.stringify(result.rows[0])
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Get chat history
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

  // Mark message as read
  async markAsRead(messageId) {
    try {
      const result = await pool.query(
        `UPDATE chat_messages 
         SET read_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND read_at IS NULL
         RETURNING *`,
        [messageId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Get agent presence
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

  // Update agent presence
  async updateAgentPresence(agentId, status) {
    try {
      const result = await pool.query(
        `INSERT INTO agent_presence (agent_id, status, last_active)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
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

  // Get available agents (online, not busy)
  async getAvailableAgents() {
    try {
      const result = await pool.query(
        `SELECT ap.*, u.email, u.first_name, u.last_name
         FROM agent_presence ap
         JOIN agents a ON ap.agent_id = a.id
         JOIN users u ON a.user_id = u.id
         WHERE ap.status IN ('online', 'away')
         AND ap.current_chat_count < 5
         ORDER BY ap.current_chat_count ASC
         LIMIT 10`
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching available agents:', error);
      throw error;
    }
  }

  // Close chat
  async closeChat(chatId) {
    try {
      const result = await pool.query(
        `UPDATE chats 
         SET status = 'closed', ended_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [chatId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error closing chat:', error);
      throw error;
    }
  }

  // Get unread message count for user
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
      return parseInt(result.rows[0].unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();
```

#### Step 4: Socket.io Gateway

```javascript
// src/gateways/RealTimeGateway.js
const SocketIO = require('socket.io');
const ChatService = require('../services/ChatService');
const { verifyToken } = require('../middleware/auth');

class RealTimeGateway {
  constructor(server) {
    this.io = new SocketIO(server, {
      cors: { origin: process.env.FRONTEND_URL },
      transports: ['websocket', 'polling']
    });
    this.setupMiddleware();
    this.setupEvents();
  }

  setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token provided'));
      
      try {
        const decoded = verifyToken(token);
        socket.userId = decoded.id;
        socket.userRole = decoded.role; // 'user' or 'agent'
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  setupEvents() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected:`, socket.id);

      // User joins chat
      socket.on('join-chat', async (data) => {
        const { chatId } = data;
        socket.join(`chat:${chatId}`);
        console.log(`User ${socket.userId} joined chat ${chatId}`);
      });

      // User sends message
      socket.on('send-message', async (data) => {
        try {
          const { chatId, message, fileUrl, fileType } = data;
          
          // Save to database
          const msg = await ChatService.addMessage(
            chatId,
            socket.userId,
            socket.userRole,
            message,
            fileUrl,
            fileType
          );

          // Broadcast to chat room
          this.io.to(`chat:${chatId}`).emit('message-received', {
            id: msg.id,
            chatId: msg.chat_id,
            senderId: msg.sender_id,
            senderType: msg.sender_type,
            message: msg.message,
            fileUrl: msg.file_url,
            fileType: msg.file_type,
            createdAt: msg.created_at
          });

          // Mark as delivered
          socket.emit('message-delivered', { messageId: msg.id });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // User reads message
      socket.on('mark-read', async (data) => {
        try {
          const { messageId } = data;
          await ChatService.markAsRead(messageId);
          
          // Broadcast read status
          this.io.emit('message-read', { messageId });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Typing indicator
      socket.on('typing', (data) => {
        const { chatId } = data;
        socket.to(`chat:${chatId}`).emit('user-typing', {
          userId: socket.userId,
          isTyping: true
        });
      });

      socket.on('stop-typing', (data) => {
        const { chatId } = data;
        socket.to(`chat:${chatId}`).emit('user-typing', {
          userId: socket.userId,
          isTyping: false
        });
      });

      // Agent presence update
      socket.on('agent-status', async (data) => {
        if (socket.userRole === 'agent') {
          const { status } = data; // 'online', 'away', 'busy', 'offline'
          await ChatService.updateAgentPresence(socket.userId, status);
          
          // Broadcast to all connected users
          this.io.emit('agent-status-updated', {
            agentId: socket.userId,
            status
          });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        if (socket.userRole === 'agent') {
          ChatService.updateAgentPresence(socket.userId, 'offline');
          this.io.emit('agent-status-updated', {
            agentId: socket.userId,
            status: 'offline'
          });
        }
      });
    });
  }
}

module.exports = RealTimeGateway;
```

#### Step 5: API Routes

```javascript
// src/routes/chat.routes.js
const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const ChatService = require('../services/ChatService');

const router = express.Router();

// Create new chat
router.post('/chats', authMiddleware, async (req, res) => {
  try {
    const { agentId } = req.body;
    const chat = await ChatService.createChat(req.user.id, agentId);
    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat history
router.get('/chats/:chatId/messages', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const messages = await ChatService.getChatHistory(chatId, limit, offset);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available agents
router.get('/agents/available', authMiddleware, async (req, res) => {
  try {
    const agents = await ChatService.getAvailableAgents();
    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/chats/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await ChatService.getUnreadCount(req.user.id);
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Close chat
router.post('/chats/:chatId/close', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await ChatService.closeChat(chatId);
    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Frontend Implementation

#### ChatWindow.jsx

```javascript
// frontend/src/components/Chat/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './ChatWindow.css';

const ChatWindow = ({ chatId, agentId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentPresence, setAgentPresence] = useState(null);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(process.env.REACT_APP_API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      newSocket.emit('join-chat', { chatId });
    });

    newSocket.on('message-received', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('user-typing', (data) => {
      setIsTyping(data.isTyping);
    });

    newSocket.on('agent-status-updated', (data) => {
      if (data.agentId === agentId) {
        setAgentPresence(data.status);
      }
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [chatId, agentId]);

  // Load initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/chats/${chatId}/messages`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        const data = await response.json();
        setMessages(data.messages);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !socket) return;

    socket.emit('send-message', {
      chatId,
      message: messageInput.trim()
    });

    setMessageInput('');
    socket.emit('stop-typing', { chatId });
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    // Emit typing indicator
    socket?.emit('typing', { chatId });

    // Clear typing timeout
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stop-typing', { chatId });
    }, 3000);
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Live Chat</h3>
        <div className="agent-status">
          <span className={`status-indicator ${agentPresence}`}></span>
          <span>{agentPresence === 'online' ? 'Agent Online' : 'Agent Offline'}</span>
        </div>
        <button onClick={onClose}>×</button>
      </div>

      <div className="messages-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.senderType === 'user' ? 'user' : 'agent'}`}
          >
            <p>{msg.message}</p>
            <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
          </div>
        ))}
        {isTyping && <div className="typing-indicator">Agent is typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          type="text"
          value={messageInput}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;
```

#### CSS Styling

```css
/* frontend/src/components/Chat/ChatWindow.css */
.chat-window {
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.online {
  background-color: #4ade80;
}

.status-indicator.away {
  background-color: #facc15;
}

.status-indicator.busy {
  background-color: #f87171;
}

.status-indicator.offline {
  background-color: #9ca3af;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f9fafb;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  background: #667eea;
  color: white;
  padding: 10px 12px;
  border-radius: 12px 12px 4px 12px;
}

.message.agent {
  align-self: flex-start;
  background: white;
  color: #1f2937;
  padding: 10px 12px;
  border-radius: 12px 12px 12px 4px;
  border: 1px solid #e5e7eb;
}

.message p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.message small {
  font-size: 12px;
  opacity: 0.7;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.input-container {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.input-container input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.input-container button {
  padding: 10px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.input-container button:hover {
  background: #5568d3;
}
```

---

## 2. LIVE NOTIFICATIONS SERVICE

### Database Schema

```sql
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- property_alert, price_drop, new_lead, etc
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- flexible data storage
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  notification_type VARCHAR(50),
  enabled BOOLEAN DEFAULT TRUE,
  send_email BOOLEAN DEFAULT TRUE,
  send_push BOOLEAN DEFAULT TRUE,
  send_sms BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
```

### NotificationService.js

```javascript
// src/services/NotificationService.js
const { pool } = require('../db');
const redis = require('redis');
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.redisClient = redis.createClient();
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Trigger property alert
  async triggerPropertyAlert(userId, property) {
    const notification = {
      type: 'property_alert',
      title: `New Property: ${property.title}`,
      message: `${property.bedrooms}BR, ${property.bathrooms}BA - $${property.price}`,
      data: { propertyId: property.id, price: property.price, location: property.location }
    };
    
    await this.createNotification(userId, notification);
  }

  // Trigger price drop alert
  async triggerPriceDrop(userId, property, oldPrice, newPrice) {
    const savings = oldPrice - newPrice;
    const notification = {
      type: 'price_drop',
      title: `Price Drop on Saved Property!`,
      message: `${property.title} dropped from $${oldPrice} to $${newPrice} (Save $${savings})`,
      data: { propertyId: property.id, oldPrice, newPrice, savings }
    };
    
    await this.createNotification(userId, notification);
  }

  // Create notification
  async createNotification(userId, notificationData) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, notificationData.type, notificationData.title, notificationData.message, JSON.stringify(notificationData.data)]
      );

      const notification = result.rows[0];

      // Store in Redis for real-time delivery
      await this.redisClient.lpush(
        `notifications:${userId}`,
        JSON.stringify(notification)
      );

      // Get user preferences
      const prefs = await this.getUserNotificationPreferences(userId, notificationData.type);
      
      // Send based on preferences
      if (prefs.send_email) {
        await this.sendEmailNotification(userId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user preferences
  async getUserNotificationPreferences(userId, type) {
    try {
      const result = await pool.query(
        `SELECT * FROM notification_preferences
         WHERE user_id = $1 AND notification_type = $2`,
        [userId, type]
      );

      return result.rows[0] || {
        send_email: true,
        send_push: true,
        send_sms: false
      };
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return {};
    }
  }

  // Send email notification
  async sendEmailNotification(userId, notification) {
    try {
      const userResult = await pool.query(
        'SELECT email, first_name FROM users WHERE id = $1',
        [userId]
      );

      const user = userResult.rows[0];
      if (!user) return;

      await this.emailTransporter.sendMail({
        to: user.email,
        subject: notification.title,
        html: `
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          <p><a href="${process.env.FRONTEND_URL}/notifications">View Details</a></p>
        `
      });

      console.log(`Email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  // Get unread notifications
  async getUnreadNotifications(userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications
         WHERE user_id = $1 AND read_at IS NULL
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark as read
  async markAsRead(notificationId) {
    try {
      const result = await pool.query(
        `UPDATE notifications
         SET read_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [notificationId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
```

### API Routes

```javascript
// src/routes/notifications.routes.js
const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const NotificationService = require('../services/NotificationService');

const router = express.Router();

router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await NotificationService.getUnreadNotifications(req.user.id);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id);
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 3. SMART SEARCH (NLP-BASED)

### Installation

```bash
npm install spacy natural compromise
pip install spacy
python -m spacy download en_core_web_sm
```

### SmartSearchService.js

```javascript
// src/services/SmartSearchService.js
const natural = require('natural');
const compromise = require('compromise');
const { pool } = require('../db');

class SmartSearchService {
  // Parse natural language query
  parseSearchQuery(query) {
    try {
      const normalized = query.toLowerCase().trim();
      const doc = compromise(query);

      const filters = {
        price: this.extractPrice(normalized),
        location: this.extractLocation(normalized),
        type: this.extractPropertyType(normalized),
        features: this.extractFeatures(normalized),
        bedrooms: this.extractBedrooms(normalized),
        bathrooms: this.extractBathrooms(normalized),
        sqft: this.extractSquareFootage(normalized)
      };

      return filters;
    } catch (error) {
      console.error('Error parsing search query:', error);
      return {};
    }
  }

  extractPrice(query) {
    const pricePatterns = [
      /under\s+\$?([\d,]+)/i,
      /below\s+\$?([\d,]+)/i,
      /less\s+than\s+\$?([\d,]+)/i,
      /max\s+\$?([\d,]+)/i,
      /up\s+to\s+\$?([\d,]+)/i,
      /from\s+\$?([\d,]+)\s+to\s+\$?([\d,]+)/i,
      /between\s+\$?([\d,]+)\s+and\s+\$?([\d,]+)/i
    ];

    for (const pattern of pricePatterns) {
      const match = query.match(pattern);
      if (match) {
        if (match[2]) { // range
          return {
            min: parseInt(match[1].replace(/,/g, '')),
            max: parseInt(match[2].replace(/,/g, ''))
          };
        } else { // single value
          return { max: parseInt(match[1].replace(/,/g, '')) };
        }
      }
    }

    return null;
  }

  extractLocation(query) {
    // Keywords for location extraction
    const locationPatterns = [
      /in\s+([a-z\s]+?)(?:\s+(?:with|has|near|with|but|and)|$)/i,
      /near\s+([a-z\s]+?)(?:\s+(?:with|has|near|but|and)|$)/i,
      /around\s+([a-z\s]+?)(?:\s+(?:with|has|near|but|and)|$)/i
    ];

    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  extractPropertyType(query) {
    const types = {
      apartment: ['apartment', 'apt', 'flat', 'studio'],
      house: ['house', 'villa', 'home', 'single family'],
      condo: ['condo', 'condominimum', 'townhouse', 'townhome'],
      land: ['land', 'lot', 'plot', 'acreage']
    };

    for (const [type, keywords] of Object.entries(types)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return type;
        }
      }
    }

    return null;
  }

  extractBedrooms(query) {
    const match = query.match(/(\d+)\s*(?:bed|br|bedroom)/i);
    return match ? parseInt(match[1]) : null;
  }

  extractBathrooms(query) {
    const match = query.match(/(\d+)\s*(?:bath|ba|bathroom)/i);
    return match ? parseInt(match[1]) : null;
  }

  extractSquareFootage(query) {
    const match = query.match(/(\d+)\s*(?:sqft|sq ft|square feet|sqm|m2)/i);
    return match ? parseInt(match[1]) : null;
  }

  extractFeatures(query) {
    const featureKeywords = {
      'parking': ['parking', 'garage', 'carport'],
      'balcony': ['balcony', 'patio', 'deck'],
      'pool': ['pool', 'swimming pool'],
      'garden': ['garden', 'yard', 'backyard'],
      'ac': ['ac', 'air conditioning', 'air-conditioned'],
      'washer': ['washer', 'laundry'],
      'dishwasher': ['dishwasher'],
      'fireplace': ['fireplace']
    };

    const features = [];
    for (const [feature, keywords] of Object.entries(featureKeywords)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          features.push(feature);
          break;
        }
      }
    }

    return features.length > 0 ? features : null;
  }

  // Convert filters to SQL WHERE clause
  async buildSearchQuery(filters) {
    let where = [];
    let params = [];
    let paramIndex = 1;

    if (filters.price?.max) {
      where.push(`price <= $${paramIndex}`);
      params.push(filters.price.max);
      paramIndex++;
    }

    if (filters.price?.min) {
      where.push(`price >= $${paramIndex}`);
      params.push(filters.price.min);
      paramIndex++;
    }

    if (filters.type) {
      where.push(`property_type = $${paramIndex}`);
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.bedrooms) {
      where.push(`bedrooms >= $${paramIndex}`);
      params.push(filters.bedrooms);
      paramIndex++;
    }

    if (filters.bathrooms) {
      where.push(`bathrooms >= $${paramIndex}`);
      params.push(filters.bathrooms);
      paramIndex++;
    }

    if (filters.location) {
      where.push(`location ILIKE $${paramIndex}`);
      params.push(`%${filters.location}%`);
      paramIndex++;
    }

    // Build final query
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    return { whereClause, params };
  }

  // Execute smart search
  async smartSearch(query, limit = 20) {
    try {
      const filters = this.parseSearchQuery(query);
      const { whereClause, params } = await this.buildSearchQuery(filters);

      const sql = `
        SELECT * FROM properties
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1}
      `;

      params.push(limit);

      const result = await pool.query(sql, params);

      return {
        filters,
        results: result.rows,
        count: result.rows.length
      };
    } catch (error) {
      console.error('Error in smart search:', error);
      throw error;
    }
  }
}

module.exports = new SmartSearchService();
```

### API Route

```javascript
router.post('/search/smart', async (req, res) => {
  try {
    const { query } = req.body;
    const results = await SmartSearchService.smartSearch(query);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## GETTING STARTED CHECKLIST

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 15 installed and running
- [ ] Redis 6+ installed
- [ ] Python 3.9+ for ML models

### Installation Steps

```bash
# 1. Backend setup
cd backend
npm install socket.io redis nodemailer spacy natural compromise

# 2. Environment variables
cp .env.example .env
# Edit .env with your credentials

# 3. Database migration
npm run migrate

# 4. Start backend
npm run dev

# 5. Frontend setup
cd ../frontend
npm install

# 6. Start frontend
npm start
```

### Testing Commands

```bash
# Test real-time chat
curl -X POST http://localhost:4000/api/chats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"agentId": 1}'

# Test smart search
curl -X POST http://localhost:4000/api/search/smart \
  -H "Content-Type: application/json" \
  -d '{"query": "3 bedroom apartment under $1000 in downtown with parking"}'

# Test notifications
curl http://localhost:4000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Status:** ✅ READY FOR IMPLEMENTATION  
**Next Steps:** Follow the code in each section and deploy gradually

