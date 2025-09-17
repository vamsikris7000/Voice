// Simple Bidirectional Communications Widget
// Guaranteed to work with visible messages

class SimpleBidirectionalWidget {
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
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  init() {
    this.createWidget();
    this.attachEventListeners();
    this.loadInitialMessage();
  }
  
  createWidget() {
    // Create main widget container
    this.widget = document.createElement('div');
    this.widget.id = 'simple-bidirectional-widget';
    this.widget.innerHTML = `
      <style>
        #simple-bidirectional-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .simple-toggle {
          width: 60px;
          height: 60px;
          background: ${this.config.primaryColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
          color: white;
          font-size: 24px;
        }
        
        .simple-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        
        .simple-popup {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          display: none;
          flex-direction: column;
          overflow: hidden;
        }
        
        .simple-popup.open {
          display: flex !important;
        }
        
        .simple-header {
          background: ${this.config.primaryColor};
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        
        .simple-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .simple-close {
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
        
        .simple-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: white;
          min-height: 300px;
        }
        
        .simple-message {
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
        
        .simple-input {
          padding: 16px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        
        .simple-input input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
        }
        
        .simple-input input:focus {
          border-color: ${this.config.primaryColor};
        }
        
        .simple-input button {
          padding: 12px 20px;
          background: ${this.config.primaryColor};
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        
        .simple-input button:hover {
          opacity: 0.9;
        }
        
        .simple-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .typing-indicator {
          display: none;
          padding: 12px 16px;
          background: #f1f3f4;
          border-radius: 18px;
          max-width: 80px;
          align-self: flex-start;
        }
        
        .typing-indicator.show {
          display: block;
        }
        
        .typing-dots {
          display: flex;
          gap: 4px;
        }
        
        .typing-dot {
          width: 6px;
          height: 6px;
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
        
        @media (max-width: 480px) {
          .simple-popup {
            width: 300px;
            height: 400px;
            right: -50px;
          }
        }
      </style>
      
      <div class="simple-toggle">💬</div>
      
      <div class="simple-popup">
        <div class="simple-header">
          <h3>Chat Assistant</h3>
          <button class="simple-close">×</button>
        </div>
        
        <div class="simple-messages" id="simple-messages">
          <!-- Messages will be added here -->
        </div>
        
        <div class="typing-indicator" id="typing-indicator">
          <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
        
        <div class="simple-input">
          <input type="text" id="simple-input-field" placeholder="Type your message..." />
          <button id="simple-send">Send</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.widget);
  }
  
  attachEventListeners() {
    const toggle = this.widget.querySelector('.simple-toggle');
    const popup = this.widget.querySelector('.simple-popup');
    const close = this.widget.querySelector('.simple-close');
    const input = this.widget.querySelector('#simple-input-field');
    const sendBtn = this.widget.querySelector('#simple-send');
    
    toggle.addEventListener('click', () => this.togglePopup());
    close.addEventListener('click', () => this.closePopup());
    sendBtn.addEventListener('click', () => this.sendMessage());
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  }
  
  togglePopup() {
    const popup = this.widget.querySelector('.simple-popup');
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      popup.classList.add('open');
    } else {
      popup.classList.remove('open');
    }
  }
  
  closePopup() {
    const popup = this.widget.querySelector('.simple-popup');
    this.isOpen = false;
    popup.classList.remove('open');
  }
  
  async sendMessage() {
    const inputField = this.widget.querySelector('#simple-input-field');
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
    console.log('🚀 Sending to Dify:', message);
    console.log('👤 User ID:', this.userId);
    console.log('💬 Conversation ID:', this.conversationId || 'NEW');
    
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
      throw new Error(`Dify API error: ${response.status}`);
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
              console.log('📨 Dify response:', data);
              
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
    console.log('🚀 Sending to backend:', message);
    
    const response = await fetch(`${this.config.backendUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        conversationId: this.conversationId,
        userId: this.userId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
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
              console.log('📨 Backend response:', data);
              
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
    const messagesContainer = this.widget.querySelector('#simple-messages');
    if (!messagesContainer) {
      console.error('Messages container not found');
      return null;
    }
    
    console.log(`📝 Adding ${sender} message:`, text);
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `simple-message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
    
    console.log(`✅ Message added successfully. Total messages: ${messagesContainer.children.length}`);
    
    return messageDiv;
  }
  
  updateMessage(messageElement, text) {
    if (messageElement) {
      const contentDiv = messageElement.querySelector('.message-content');
      if (contentDiv) {
        contentDiv.textContent = text;
        
        // Scroll to bottom
        const messagesContainer = this.widget.querySelector('#simple-messages');
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);
      }
    }
  }
  
  showTypingIndicator() {
    const indicator = this.widget.querySelector('#typing-indicator');
    if (indicator) {
      indicator.classList.add('show');
      
      // Scroll to bottom
      const messagesContainer = this.widget.querySelector('#simple-messages');
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 50);
    }
  }
  
  hideTypingIndicator() {
    const indicator = this.widget.querySelector('#typing-indicator');
    if (indicator) {
      indicator.classList.remove('show');
    }
  }
  
  loadInitialMessage() {
    console.log('🚀 Loading initial message...');
    
    // Add initial message
    setTimeout(() => {
      this.addMessage('Hello! How can I help you today?', 'bot');
      console.log('✅ Initial message loaded');
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
  
  resetConversation() {
    this.conversationId = null;
    this.userId = this.generateUserId();
    this.messages = [];
    
    // Clear messages from UI
    const messagesContainer = this.widget.querySelector('#simple-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    
    // Add fresh initial message
    this.loadInitialMessage();
    
    console.log('🔄 Conversation reset. New User ID:', this.userId);
  }
  
  destroy() {
    if (this.widget && this.widget.parentNode) {
      this.widget.parentNode.removeChild(this.widget);
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SimpleBidirectionalWidget;
} else if (typeof window !== 'undefined') {
  window.SimpleBidirectionalWidget = SimpleBidirectionalWidget;
}
