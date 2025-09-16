/**
 * Bidirectional Communications Chatbot Widget
 * Embeddable widget for AI-Human customer interface
 */

class BidirectionalChatWidget {
    constructor(config) {
        this.config = {
            // Required configuration
            backendUrl: config.backendUrl || 'http://localhost:3001',
            widgetId: config.widgetId || 'bidirectional-chat-widget',
            
            // Optional configuration
            position: config.position || 'bottom-right', // bottom-right, bottom-left, top-right, top-left
            theme: config.theme || 'light', // light, dark, custom
            primaryColor: config.primaryColor || '#667eea',
            secondaryColor: config.secondaryColor || '#f7fafc',
            textColor: config.textColor || '#2d3748',
            
            // Behavior settings
            autoOpen: config.autoOpen || false,
            showWelcomeMessage: config.showWelcomeMessage !== false,
            welcomeMessage: config.welcomeMessage || "Hello! I'm your AI assistant. How can I help you today?",
            
            // API settings
            apiKey: config.apiKey || null, // Optional API key for authentication
            userId: config.userId || this.generateUserId(),
            
            // Escalation settings
            enableEscalation: config.enableEscalation !== false,
            escalationKeywords: config.escalationKeywords || ['human', 'agent', 'help', 'support'],
            
            // UI settings
            showTypingIndicator: config.showTypingIndicator !== false,
            enableSound: config.enableSound !== false,
            maxMessages: config.maxMessages || 100,
            
            // Callbacks
            onMessage: config.onMessage || null,
            onEscalation: config.onEscalation || null,
            onError: config.onError || null,
            
            ...config
        };
        
        this.isOpen = false;
        this.isEscalated = false;
        this.messages = [];
        this.conversationId = '';
        this.escalationKey = '';
        this.wsConnection = null;
        this.isLoading = false;
        
        this.init();
    }
    
    generateUserId() {
        return `user_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    init() {
        this.createWidgetHTML();
        this.attachEventListeners();
        this.loadStyles();
        
        if (this.config.autoOpen) {
            this.open();
        }
        
        // Add welcome message if enabled
        if (this.config.showWelcomeMessage) {
            this.addMessage({
                content: this.config.welcomeMessage,
                role: 'assistant',
                timestamp: Date.now()
            });
        }
    }
    
    createWidgetHTML() {
        // Create widget container
        const widgetContainer = document.createElement('div');
        widgetContainer.id = this.config.widgetId;
        widgetContainer.className = 'bidirectional-chat-widget';
        
        // Create toggle button
        const toggleButton = document.createElement('div');
        toggleButton.className = 'chat-toggle-button';
        toggleButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span class="notification-badge" style="display: none;">1</span>
        `;
        
        // Create chat window
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.innerHTML = `
            <div class="chat-header">
                <div class="chat-title">
                    <div class="status-indicator">
                        <div class="status-dot ai"></div>
                        <span class="status-text">AI Assistant</span>
                    </div>
                </div>
                <button class="close-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <div class="chat-messages" id="${this.config.widgetId}-messages">
                <!-- Messages will be added here -->
            </div>
            
            <div class="chat-input-container">
                <div class="typing-indicator" style="display: none;">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
                <div class="input-wrapper">
                    <textarea 
                        class="chat-input" 
                        placeholder="Type your message..."
                        rows="1"
                    ></textarea>
                    <button class="send-button" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        widgetContainer.appendChild(toggleButton);
        widgetContainer.appendChild(chatWindow);
        
        // Add to page
        document.body.appendChild(widgetContainer);
        
        this.widget = widgetContainer;
        this.toggleButton = toggleButton;
        this.chatWindow = chatWindow;
        this.messagesContainer = chatWindow.querySelector('.chat-messages');
        this.chatInput = chatWindow.querySelector('.chat-input');
        this.sendButton = chatWindow.querySelector('.send-button');
        this.typingIndicator = chatWindow.querySelector('.typing-indicator');
        this.statusIndicator = chatWindow.querySelector('.status-indicator');
    }
    
    attachEventListeners() {
        // Toggle button
        this.toggleButton.addEventListener('click', () => {
            this.isOpen ? this.close() : this.open();
        });
        
        // Close button
        this.chatWindow.querySelector('.close-button').addEventListener('click', () => {
            this.close();
        });
        
        // Send button
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Input events
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.chatInput.addEventListener('input', () => {
            this.sendButton.disabled = !this.chatInput.value.trim();
            this.autoResizeTextarea();
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.widget.contains(e.target)) {
                this.close();
            }
        });
    }
    
    autoResizeTextarea() {
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
    }
    
    open() {
        this.isOpen = true;
        this.widget.classList.add('open');
        this.chatInput.focus();
        this.hideNotification();
    }
    
    close() {
        this.isOpen = false;
        this.widget.classList.remove('open');
    }
    
    showNotification() {
        const badge = this.toggleButton.querySelector('.notification-badge');
        badge.style.display = 'block';
    }
    
    hideNotification() {
        const badge = this.toggleButton.querySelector('.notification-badge');
        badge.style.display = 'none';
    }
    
    addMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}`;
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageElement.innerHTML = `
            <div class="message-content">${this.formatMessage(message.content)}</div>
            <div class="message-time">${timestamp}</div>
        `;
        
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        
        // Store message
        this.messages.push(message);
        
        // Limit messages
        if (this.messages.length > this.config.maxMessages) {
            this.messages.shift();
            this.messagesContainer.removeChild(this.messagesContainer.firstChild);
        }
        
        // Show notification if closed
        if (!this.isOpen && message.role === 'assistant') {
            this.showNotification();
        }
        
        // Callback
        if (this.config.onMessage) {
            this.config.onMessage(message);
        }
    }
    
    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
    
    showTypingIndicator() {
        if (this.config.showTypingIndicator) {
            this.typingIndicator.style.display = 'block';
            this.scrollToBottom();
        }
    }
    
    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    updateStatus(isEscalated, agentName = 'Expert Agent') {
        const statusDot = this.statusIndicator.querySelector('.status-dot');
        const statusText = this.statusIndicator.querySelector('.status-text');
        
        if (isEscalated) {
            statusDot.className = 'status-dot human';
            statusText.textContent = agentName;
            this.isEscalated = true;
        } else {
            statusDot.className = 'status-dot ai';
            statusText.textContent = 'AI Assistant';
            this.isEscalated = false;
        }
    }
    
    async sendMessage() {
        const content = this.chatInput.value.trim();
        if (!content || this.isLoading) return;
        
        // Add user message
        this.addMessage({
            content: content,
            role: 'user',
            timestamp: Date.now()
        });
        
        // Clear input
        this.chatInput.value = '';
        this.sendButton.disabled = true;
        this.autoResizeTextarea();
        
        // Show typing indicator
        this.showTypingIndicator();
        this.isLoading = true;
        
        try {
            if (this.isEscalated) {
                await this.sendToChatwoot(content);
            } else {
                await this.sendToDify(content);
            }
        } catch (error) {
            this.handleError(error);
        } finally {
            this.hideTypingIndicator();
            this.isLoading = false;
        }
    }
    
    async sendToDify(message) {
        const response = await fetch(`${this.config.backendUrl}/api/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
            },
            body: JSON.stringify({
                query: message,
                user: this.config.userId,
                conversation_id: this.conversationId || '',
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');
        
        let accumulatedContent = '';
        let messageId = null;
        let escalationDetected = false;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        if (data.event === 'agent_message') {
                            accumulatedContent += data.answer || '';
                            
                            if (!messageId) {
                                messageId = Date.now();
                                this.addMessage({
                                    content: accumulatedContent,
                                    role: 'assistant',
                                    timestamp: messageId,
                                    isStreaming: true
                                });
                            } else {
                                // Update existing message
                                const lastMessage = this.messagesContainer.lastChild;
                                if (lastMessage) {
                                    lastMessage.querySelector('.message-content').innerHTML = 
                                        this.formatMessage(accumulatedContent);
                                }
                            }
                        }
                        
                        if (data.event === 'message_end') {
                            this.conversationId = data.conversation_id;
                            
                            // Finalize message
                            const lastMessage = this.messagesContainer.lastChild;
                            if (lastMessage) {
                                lastMessage.querySelector('.message-content').innerHTML = 
                                    this.formatMessage(accumulatedContent);
                            }
                        }
                        
                        // Handle escalation
                        if (data.event === 'escalation_success') {
                            escalationDetected = true;
                            this.escalationKey = data.escalation_info?.escalation_key;
                            
                            this.updateStatus(true, 'Expert Agent');
                            
                            this.addMessage({
                                content: '🔄 You are now connected to a human agent. They will assist you shortly.',
                                role: 'system',
                                timestamp: Date.now()
                            });
                            
                            // Start WebSocket connection for agent messages
                            this.connectWebSocket();
                            
                            // Callback
                            if (this.config.onEscalation) {
                                this.config.onEscalation(data.escalation_info);
                            }
                        }
                        
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        }
    }
    
    async sendToChatwoot(message) {
        if (!this.escalationKey) {
            throw new Error('No escalation session available');
        }
        
        const response = await fetch(`${this.config.backendUrl}/api/chatwoot/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
            },
            body: JSON.stringify({
                escalation_key: this.escalationKey,
                message: message,
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send message to Chatwoot');
        }
    }
    
    connectWebSocket() {
        if (!this.escalationKey) return;
        
        const wsUrl = this.config.backendUrl.replace('http://', 'ws://').replace('https://', 'wss://');
        this.wsConnection = new WebSocket(`${wsUrl}/${this.escalationKey}`);
        
        this.wsConnection.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'new_agent_message' && data.message) {
                    this.addMessage({
                        content: data.message.content,
                        role: 'assistant',
                        timestamp: data.message.timestamp,
                        agentName: data.message.sender
                    });
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };
        
        this.wsConnection.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        this.wsConnection.onclose = () => {
            console.log('WebSocket connection closed');
        };
    }
    
    handleError(error) {
        console.error('Chat widget error:', error);
        
        this.addMessage({
            content: 'Sorry, I encountered an error. Please try again.',
            role: 'system',
            timestamp: Date.now()
        });
        
        if (this.config.onError) {
            this.config.onError(error);
        }
    }
    
    loadStyles() {
        if (document.getElementById('bidirectional-chat-widget-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'bidirectional-chat-widget-styles';
        styles.textContent = `
            .bidirectional-chat-widget {
                position: fixed;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .chat-toggle-button {
                position: fixed;
                ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                width: 60px;
                height: 60px;
                background: ${this.config.primaryColor};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                color: white;
            }
            
            .chat-toggle-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            }
            
            .notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #e53e3e;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
            }
            
            .chat-window {
                position: fixed;
                ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                ${this.config.position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                display: none;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            
            .bidirectional-chat-widget.open .chat-window {
                display: flex;
            }
            
            .chat-header {
                background: ${this.config.primaryColor};
                color: white;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .chat-title {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #10b981;
            }
            
            .status-dot.human {
                background: #f59e0b;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .close-button {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background 0.2s;
            }
            
            .close-button:hover {
                background: rgba(255,255,255,0.1);
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                background: ${this.config.secondaryColor};
            }
            
            .message {
                margin-bottom: 12px;
                display: flex;
                flex-direction: column;
            }
            
            .message.user {
                align-items: flex-end;
            }
            
            .message.assistant, .message.system {
                align-items: flex-start;
            }
            
            .message-content {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 18px;
                word-wrap: break-word;
                line-height: 1.4;
            }
            
            .message.user .message-content {
                background: ${this.config.primaryColor};
                color: white;
                border-bottom-right-radius: 4px;
            }
            
            .message.assistant .message-content {
                background: white;
                color: ${this.config.textColor};
                border: 1px solid #e2e8f0;
                border-bottom-left-radius: 4px;
            }
            
            .message.system .message-content {
                background: #fef3c7;
                color: #92400e;
                border: 1px solid #fbbf24;
                text-align: center;
                font-size: 14px;
            }
            
            .message-time {
                font-size: 11px;
                color: #9ca3af;
                margin-top: 4px;
                padding: 0 8px;
            }
            
            .typing-indicator {
                padding: 12px 16px;
                display: flex;
                align-items: center;
            }
            
            .typing-dots {
                display: flex;
                gap: 4px;
            }
            
            .typing-dots span {
                width: 8px;
                height: 8px;
                background: #9ca3af;
                border-radius: 50%;
                animation: typing 1.4s infinite;
            }
            
            .typing-dots span:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .typing-dots span:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes typing {
                0%, 60%, 100% {
                    transform: translateY(0);
                    opacity: 0.5;
                }
                30% {
                    transform: translateY(-10px);
                    opacity: 1;
                }
            }
            
            .chat-input-container {
                padding: 16px;
                background: white;
                border-top: 1px solid #e2e8f0;
            }
            
            .input-wrapper {
                display: flex;
                gap: 8px;
                align-items: flex-end;
            }
            
            .chat-input {
                flex: 1;
                border: 1px solid #d1d5db;
                border-radius: 20px;
                padding: 12px 16px;
                resize: none;
                outline: none;
                font-family: inherit;
                font-size: 14px;
                line-height: 1.4;
                min-height: 20px;
                max-height: 120px;
            }
            
            .chat-input:focus {
                border-color: ${this.config.primaryColor};
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .send-button {
                width: 40px;
                height: 40px;
                border: none;
                border-radius: 50%;
                background: ${this.config.primaryColor};
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .send-button:hover:not(:disabled) {
                background: ${this.config.primaryColor}dd;
                transform: scale(1.05);
            }
            
            .send-button:disabled {
                background: #d1d5db;
                cursor: not-allowed;
                transform: none;
            }
            
            /* Scrollbar */
            .chat-messages::-webkit-scrollbar {
                width: 6px;
            }
            
            .chat-messages::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }
            
            .chat-messages::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;
            }
            
            .chat-messages::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
            
            /* Mobile responsive */
            @media (max-width: 480px) {
                .chat-window {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 120px);
                    ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                    ${this.config.position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // Public API methods
    open() {
        this.open();
    }
    
    close() {
        this.close();
    }
    
    sendMessage(message) {
        if (message) {
            this.chatInput.value = message;
        }
        this.sendMessage();
    }
    
    addCustomMessage(content, role = 'assistant') {
        this.addMessage({
            content: content,
            role: role,
            timestamp: Date.now()
        });
    }
    
    destroy() {
        if (this.wsConnection) {
            this.wsConnection.close();
        }
        if (this.widget && this.widget.parentNode) {
            this.widget.parentNode.removeChild(this.widget);
        }
        const styles = document.getElementById('bidirectional-chat-widget-styles');
        if (styles) {
            styles.remove();
        }
    }
}

// Auto-initialize if data attributes are present
document.addEventListener('DOMContentLoaded', () => {
    const widgetElement = document.querySelector('[data-bidirectional-chat-widget]');
    if (widgetElement) {
        const config = {
            backendUrl: widgetElement.dataset.backendUrl,
            widgetId: widgetElement.dataset.widgetId,
            position: widgetElement.dataset.position,
            theme: widgetElement.dataset.theme,
            primaryColor: widgetElement.dataset.primaryColor,
            autoOpen: widgetElement.dataset.autoOpen === 'true',
            ...JSON.parse(widgetElement.dataset.config || '{}')
        };
        
        window.bidirectionalChatWidget = new BidirectionalChatWidget(config);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BidirectionalChatWidget;
}

// Global access
window.BidirectionalChatWidget = BidirectionalChatWidget;
