/**
 * ChatWindow.jsx
 * Real-time chat component for AKIG
 * Handles messaging, typing indicators, and agent status
 */

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './ChatWindow.css';

const ChatWindow = ({ userId, authToken, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState({});
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:4000', {
      auth: {
        token: authToken
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setConnectionStatus('connected');
      setLoading(false);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionStatus('disconnected');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('error');
    });

    // Chat events
    socketInstance.on('join-chat-success', (data) => {
      console.log('Joined chat:', data.chatId);
      setChatId(data.chatId);
    });

    socketInstance.on('message-received', (data) => {
      setMessages(prev => [...prev, data]);
      scrollToBottom();
    });

    socketInstance.on('message-delivered', (data) => {
      console.log('Message delivered:', data.messageId);
    });

    socketInstance.on('user-typing', (data) => {
      setIsTyping(prev => ({
        ...prev,
        [data.userId]: data.isTyping
      }));
    });

    socketInstance.on('agent-status-updated', (data) => {
      setAgents(prev =>
        prev.map(agent =>
          agent.id === data.agentId
            ? { ...agent, status: data.status }
            : agent
        )
      );
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      alert('Connection error: ' + error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [authToken]);

  // Load initial chat data
  useEffect(() => {
    if (socket && connectionStatus === 'connected') {
      loadAgents();
    }
  }, [socket, connectionStatus]);

  // Fetch available agents
  const loadAgents = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/agents/available`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setAgents(data.data);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  // Create new chat
  const handleCreateChat = async () => {
    try {
      if (!socket) return;

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/chats`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agentId: selectedAgent?.id || null
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        const newChat = data.data;
        setChatId(newChat.id);
        setMessages([]);

        // Join chat room via Socket.io
        socket.emit('join-chat', { chatId: newChat.id });
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat');
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (!inputMessage.trim() || !socket || !chatId) {
      return;
    }

    socket.emit('send-message', {
      chatId,
      message: inputMessage,
      fileUrl: null,
      fileType: null
    });

    setInputMessage('');
    setIsTyping(prev => ({ ...prev, [userId]: false }));
  };

  // Handle typing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);

    if (!isTyping[userId]) {
      socket?.emit('typing', { chatId });
      setIsTyping(prev => ({ ...prev, [userId]: true }));
    }

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stop-typing', { chatId });
      setIsTyping(prev => ({ ...prev, [userId]: false }));
    }, 2000);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close chat
  const handleCloseChat = () => {
    if (chatId) {
      socket?.emit('leave-chat', { chatId });
    }
    onClose?.();
  };

  if (loading || connectionStatus === 'connecting') {
    return (
      <div className="chat-window loading">
        <div className="spinner"></div>
        <p>Connecting...</p>
      </div>
    );
  }

  if (!chatId) {
    return (
      <div className="chat-window initial">
        <div className="chat-header">
          <h2>Start a Chat</h2>
          <button onClick={handleCloseChat} className="close-btn">×</button>
        </div>

        <div className="chat-content">
          <div className="agents-section">
            <h3>Select an Agent</h3>
            <div className="agents-list">
              {agents.length === 0 ? (
                <p className="no-agents">No agents available right now</p>
              ) : (
                agents.map(agent => (
                  <div
                    key={agent.id}
                    className={`agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className={`agent-status ${agent.status}`}></div>
                    <div className="agent-info">
                      <p className="agent-name">{agent.name}</p>
                      <p className="agent-status-text">{agent.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={handleCreateChat}
            className="start-chat-btn"
            disabled={agents.length === 0}
          >
            {agents.length === 0 ? 'No Agents Available' : 'Start Chat'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="header-left">
          <h2>Chat</h2>
          <span className={`status ${connectionStatus}`}>{connectionStatus}</span>
        </div>
        <button onClick={handleCloseChat} className="close-btn">×</button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.senderType === 'user' ? 'user' : 'agent'}`}
            >
              <div className="message-content">
                <p className="sender-name">{msg.senderName}</p>
                <p className="message-text">{msg.message}</p>
                {msg.fileUrl && (
                  <div className="message-file">
                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                      📎 File: {msg.fileType}
                    </a>
                  </div>
                )}
                <p className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Typing indicators */}
        {Object.entries(isTyping).map(([uid, typing]) =>
          typing && uid !== userId ? (
            <div key={uid} className="message agent typing">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          ) : null
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-section">
        <div className="chat-input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            disabled={connectionStatus !== 'connected'}
            className="chat-input"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || connectionStatus !== 'connected'}
            className="send-btn"
          >
            Send
          </button>
        </div>
        <p className="connection-hint">
          {connectionStatus === 'connected'
            ? 'Connected'
            : connectionStatus === 'disconnected'
            ? 'Disconnected - Reconnecting...'
            : 'Connection error'}
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;
