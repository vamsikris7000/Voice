(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.BidirectionalWidget = {}));
})(this, (function (exports) { 'use strict';

  // Bidirectional Communications Widget
  // Similar to Vapi's embeddable widget structure
  
  class BidirectionalWidget {
    constructor(config) {
      this.config = {
        backendUrl: config.backendUrl || 'https://bidirectional-backend-production.up.railway.app',
        difyApiUrl: config.difyApiUrl || null,
        difyApiKey: config.difyApiKey || null,
        position: config.position || 'bottom-right',
        primaryColor: config.primaryColor || '#667eea',
        autoOpen: config.autoOpen || false,
        theme: config.theme || 'light',
        ...config
      };
      
      this.isOpen = false;
      this.isLoading = false;
      this.messages = [];
      this.conversationId = null;
      this.userId = this.generateUserId();
      
      this.init();
    }
    
    generateUserId() {
      return 'user_' + Math.random().toString(36).substr(2, 9);
    }
    
    init() {
      this.createWidget();
      this.attachEventListeners();
      this.loadInitialMessage();
    }
    
    createWidget() {
      // Create main widget container
      this.widget = document.createElement('div');
      this.widget.id = 'bidirectional-widget';
      this.widget.className = 'bidirectional-widget';
      
      // Create toggle button
      this.toggleButton = document.createElement('div');
      this.toggleButton.className = 'bidirectional-toggle';
      this.toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
          <path d="M7 9H17V11H7V9ZM7 12H15V14H7V12Z" fill="currentColor"/>
        </svg>
      `;
      
      // Create chat popup
      this.chatPopup = document.createElement('div');
      this.chatPopup.className = 'bidirectional-popup';
      this.chatPopup.innerHTML = `
        <div class="bidirectional-header">
          <h3>AI Assistant</h3>
          <button class="bidirectional-close">×</button>
        </div>
        <div class="bidirectional-messages" id="bidirectional-messages">
        </div>
        <div class="bidirectional-input">
          <input type="text" id="bidirectional-input-field" placeholder="Type your message..." />
          <button id="bidirectional-send">Send</button>
        </div>
      `;
      
      this.widget.appendChild(this.toggleButton);
      this.widget.appendChild(this.chatPopup);
      
      // Add styles
      this.addStyles();
      
      // Append to body
      document.body.appendChild(this.widget);
    }
    
    addStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .bidirectional-widget {
          position: fixed;
          ${this.getPositionStyles()};
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .bidirectional-toggle {
          width: 60px;
          height: 60px;
          background: ${this.config.primaryColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
          color: white;
        }
        
        .bidirectional-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        
        .bidirectional-popup {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          display: none;
          flex-direction: column;
          overflow: hidden;
          order: 1;
        }
        
        .bidirectional-popup.open {
          display: flex;
        }
        
        .bidirectional-header {
          background: ${this.config.primaryColor};
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
          order: 1;
        }
        
        .bidirectional-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .bidirectional-close {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .bidirectional-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 200px;
          max-height: calc(500px - 120px);
          order: 2;
          background: white;
        }
        
        .bidirectional-message {
          display: flex;
          flex-direction: column;
          max-width: 80%;
          margin-bottom: 8px;
        }
        
        .bot-message {
          align-self: flex-start;
        }
        
        .user-message {
          align-self: flex-end;
        }
        
        .message-content {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
        
        .bot-message .message-content {
          background: #f1f3f4;
          color: #333;
        }
        
        .user-message .message-content {
          background: ${this.config.primaryColor};
          color: white;
        }
        
        .message-time {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
          padding: 0 4px;
        }
        
        .bidirectional-input {
          padding: 16px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          gap: 8px;
          flex-shrink: 0;
          background: white;
          order: 3;
        }
        
        .bidirectional-input input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
        }
        
        .bidirectional-input input:focus {
          border-color: ${this.config.primaryColor};
        }
        
        .bidirectional-input button {
          padding: 12px 20px;
          background: ${this.config.primaryColor};
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        
        .bidirectional-input button:hover {
          opacity: 0.9;
        }
        
        .bidirectional-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          background: #f1f3f4;
          border-radius: 18px;
          max-width: 80px;
        }
        
        .typing-dot {
          width: 8px;
          height: 8px;
          background: #999;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        
        /* Ensure messages are visible */
        .bidirectional-messages .bidirectional-message {
          opacity: 1;
          visibility: visible;
        }
        
        /* Fix any potential z-index issues */
        .bidirectional-popup {
          z-index: 1001;
        }
        
        .bidirectional-toggle {
          z-index: 1000;
        }
        
        @media (max-width: 480px) {
          .bidirectional-popup {
            width: 300px;
            height: 400px;
          }
        }
      `;
      
      document.head.appendChild(style);
    }
    
    getPositionStyles() {
      const positions = {
        'bottom-right': 'bottom: 20px; right: 20px;',
        'bottom-left': 'bottom: 20px; left: 20px;',
        'top-right': 'top: 20px; right: 20px;',
        'top-left': 'top: 20px; left: 20px;',
        'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%);'
      };
      return positions[this.config.position] || positions['bottom-right'];
    }
    
    attachEventListeners() {
      // Toggle popup
      this.toggleButton.addEventListener('click', () => {
        this.togglePopup();
      });
      
      // Close popup
      this.chatPopup.querySelector('.bidirectional-close').addEventListener('click', () => {
        this.closePopup();
      });
      
      // Send message
      const sendButton = this.chatPopup.querySelector('#bidirectional-send');
      const inputField = this.chatPopup.querySelector('#bidirectional-input-field');
      
      sendButton.addEventListener('click', () => {
        this.sendMessage();
      });
      
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }
    
    togglePopup() {
      this.isOpen = !this.isOpen;
      this.chatPopup.classList.toggle('open', this.isOpen);
      
      if (this.isOpen) {
        this.focusInput();
      }
    }
    
    closePopup() {
      this.isOpen = false;
      this.chatPopup.classList.remove('open');
    }
    
    focusInput() {
      const inputField = this.chatPopup.querySelector('#bidirectional-input-field');
      setTimeout(() => inputField.focus(), 100);
    }
    
    async sendMessage() {
      const inputField = this.chatPopup.querySelector('#bidirectional-input-field');
      const message = inputField.value.trim();
      
      if (!message || this.isLoading) return;
      
      // Add user message
      this.addMessage(message, 'user');
      inputField.value = '';
      
      // Show typing indicator
      this.showTypingIndicator();
      
      try {
        this.isLoading = true;
        await this.sendToBackend(message);
      } catch (error) {
        console.error('Error sending message:', error);
        this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
      } finally {
        this.hideTypingIndicator();
        this.isLoading = false;
      }
    }
    
    async sendToBackend(message) {
      // Check if user has provided Dify configuration
      if (this.config.difyApiUrl && this.config.difyApiKey) {
        return await this.sendToDify(message);
      } else {
        return await this.sendToBackendProxy(message);
      }
    }
    
    async sendToDify(message) {
      const response = await fetch(`${this.config.difyApiUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.difyApiKey}`
        },
        body: JSON.stringify({
          query: message,
          inputs: {},
          user: this.userId,
          conversation_id: this.conversationId || '',
          response_mode: 'streaming'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = '';
      let messageElement = null;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.event === 'agent_message' && data.answer) {
                  botMessage += data.answer;
                  
                  if (!messageElement) {
                    this.hideTypingIndicator();
                    messageElement = this.addMessage('', 'bot');
                  }
                  
                  this.updateMessage(messageElement, botMessage);
                }
                
                if (data.event === 'message_end') {
                  this.conversationId = data.conversation_id;
                  break;
                }
              } catch (e) {
                console.warn('Failed to parse SSE data:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
    
    async sendToBackendProxy(message) {
      const response = await fetch(`${this.config.backendUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          inputs: {},
          user: this.userId,
          conversation_id: this.conversationId || '',
          response_mode: 'streaming'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = '';
      let messageElement = null;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.event === 'agent_message' && data.answer) {
                  botMessage += data.answer;
                  
                  if (!messageElement) {
                    this.hideTypingIndicator();
                    messageElement = this.addMessage('', 'bot');
                  }
                  
                  this.updateMessage(messageElement, botMessage);
                }
                
                if (data.event === 'message_end') {
                  this.conversationId = data.conversation_id;
                  break;
                }
              } catch (e) {
                console.warn('Failed to parse SSE data:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
    
    addMessage(text, sender) {
      const messagesContainer = this.chatPopup.querySelector('#bidirectional-messages');
      if (!messagesContainer) {
        console.error('Messages container not found');
        return null;
      }
      
      const messageDiv = document.createElement('div');
      messageDiv.className = `bidirectional-message ${sender}-message`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.textContent = text;
      
      const timeDiv = document.createElement('div');
      timeDiv.className = 'message-time';
      timeDiv.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      messageDiv.appendChild(contentDiv);
      messageDiv.appendChild(timeDiv);
      messagesContainer.appendChild(messageDiv);
      
      console.log(`Added ${sender} message:`, text);
      console.log('Messages container children count:', messagesContainer.children.length);
      console.log('Message element:', messageDiv);
      
      this.scrollToBottom();
      return messageDiv;
    }
    
    updateMessage(messageElement, text) {
      const contentDiv = messageElement.querySelector('.message-content');
      contentDiv.textContent = text;
      this.scrollToBottom();
    }
    
    showTypingIndicator() {
      const messagesContainer = this.chatPopup.querySelector('#bidirectional-messages');
      const typingDiv = document.createElement('div');
      typingDiv.className = 'bidirectional-message bot-message typing-indicator';
      typingDiv.innerHTML = `
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `;
      messagesContainer.appendChild(typingDiv);
      this.scrollToBottom();
    }
    
    hideTypingIndicator() {
      const typingIndicator = this.chatPopup.querySelector('.typing-indicator');
      if (typingIndicator) {
        typingIndicator.parentElement.remove();
      }
    }
    
    scrollToBottom() {
      const messagesContainer = this.chatPopup.querySelector('#bidirectional-messages');
      if (messagesContainer) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 10);
      }
    }
    
    loadInitialMessage() {
      // Add initial message programmatically to ensure it's visible
      const initialMessage = this.addMessage('Hello! How can I help you today?', 'bot');
      
      this.messages.push({
        role: 'bot',
        content: 'Hello! How can I help you today?',
        timestamp: new Date()
      });
      
      // Ensure the initial message is visible
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
    
    // Public API methods
    open() {
      if (!this.isOpen) {
        this.togglePopup();
      }
    }
    
    close() {
      if (this.isOpen) {
        this.closePopup();
      }
    }
    
    destroy() {
      if (this.widget && this.widget.parentNode) {
        this.widget.parentNode.removeChild(this.widget);
      }
    }
  }
  
  // Auto-initialize widget when script loads
  function initializeWidget() {
    // Find script tag with data attributes
    const script = document.currentScript || 
      Array.from(document.querySelectorAll('script')).find(s => 
        s.src && s.src.includes('bidirectional-widget.umd.js')
      );
    
    if (script) {
      const config = {
        backendUrl: script.getAttribute('data-backend-url') || 'https://bidirectional-backend-production.up.railway.app',
        position: script.getAttribute('data-position') || 'bottom-right',
        primaryColor: script.getAttribute('data-primary-color') || '#667eea',
        autoOpen: script.getAttribute('data-auto-open') === 'true',
        theme: script.getAttribute('data-theme') || 'light'
      };
      
      const widget = new BidirectionalWidget(config);
      
      // Make widget globally accessible
      window.bidirectionalWidget = widget;
      
      // Auto-open if configured
      if (config.autoOpen) {
        setTimeout(() => widget.open(), 1000);
      }
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
  } else {
    initializeWidget();
  }
  
  // Export for module systems
  exports.BidirectionalWidget = BidirectionalWidget;
  exports.default = BidirectionalWidget;
  
}));
