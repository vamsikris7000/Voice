/**
 * Custom Bidirectional Communications Chatbot Widget
 * Beautiful, embeddable chatbot with AI-Human escalation
 */

class CustomChatbotWidget {
    constructor(options = {}) {
        this.options = {
            backendUrl: options.backendUrl || 'https://bidirectional-backend-production.up.railway.app',
            position: options.position || 'bottom-right',
            primaryColor: options.primaryColor || '#667eea',
            welcomeMessage: options.welcomeMessage || "Hello! I'm your AI assistant. How can I help you today?",
            autoOpen: options.autoOpen || false,
            enableEscalation: options.enableEscalation !== false,
            escalationKeywords: options.escalationKeywords || ['human', 'agent', 'help', 'support'],
            onMessage: options.onMessage || null,
            onEscalation: options.onEscalation || null,
            onError: options.onError || null,
            ...options
        };

        this.isOpen = false;
        this.isEscalated = false;
        this.messages = [];
        this.userId = this.generateUserId();
        this.conversationId = null;
        this.escalationKey = null;
        this.agentName = null;
        this.wsConnection = null;
        this.isTyping = false;

        this.init();
    }

    init() {
        this.createWidget();
        this.bindEvents();
        this.checkBackendHealth();
        
        if (this.options.autoOpen) {
            setTimeout(() => this.open(), 1000);
        }
    }

    createWidget() {
        // Create main widget container
        this.widget = document.createElement('div');
        this.widget.id = 'custom-chatbot-widget';
        this.widget.className = 'chatbot-widget';
        this.widget.style.cssText = this.getWidgetStyles();

        // Create toggle button
        this.toggle = document.createElement('div');
        this.toggle.id = 'chatbot-toggle';
        this.toggle.className = 'chatbot-toggle';
        this.toggle.innerHTML = this.getToggleIcon();

        // Create popup
        this.popup = document.createElement('div');
        this.popup.id = 'chatbot-popup';
        this.popup.className = 'chatbot-popup';
        this.popup.innerHTML = this.getPopupHTML();

        // Assemble widget
        this.widget.appendChild(this.toggle);
        this.widget.appendChild(this.popup);

        // Add to page
        document.body.appendChild(this.widget);

        // Get references to elements
        this.messagesContainer = this.popup.querySelector('#chatbot-messages');
        this.inputField = this.popup.querySelector('#chatbot-input-field');
        this.sendBtn = this.popup.querySelector('#chatbot-send');
        this.closeBtn = this.popup.querySelector('#chatbot-close');
        this.header = this.popup.querySelector('.chatbot-header h3');
    }

    getWidgetStyles() {
        return `
            position: fixed;
            ${this.options.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
            ${this.options.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
    }

    getToggleIcon() {
        return `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
                <path d="M7 9H17V11H7V9ZM7 12H15V14H7V12Z" fill="currentColor"/>
            </svg>
        `;
    }

    getPopupHTML() {
        return `
            <div class="chatbot-header">
                <h3>Chat Assistant</h3>
                <button id="chatbot-close" class="chatbot-close">×</button>
            </div>
            <div id="chatbot-messages" class="chatbot-messages">
                <div class="chat-message bot-message">
                    <div class="message-content">
                        ${this.options.welcomeMessage}
                    </div>
                    <div class="message-time">Just now</div>
                </div>
            </div>
            <div class="chatbot-input">
                <input type="text" id="chatbot-input-field" placeholder="Type your message..." />
                <button id="chatbot-send">Send</button>
            </div>
        `;
    }

    bindEvents() {
        // Toggle popup
        this.toggle.addEventListener('click', () => this.togglePopup());

        // Close popup
        this.closeBtn.addEventListener('click', () => this.close());

        // Send message
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // Enter key
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Input focus
        this.inputField.addEventListener('focus', () => {
            if (!this.isOpen) {
                this.open();
            }
        });
    }

    async checkBackendHealth() {
        try {
            const response = await fetch(`${this.options.backendUrl}/api/health`);
            if (response.ok) {
                console.log('✅ Backend is healthy');
            } else {
                throw new Error('Backend health check failed');
            }
        } catch (error) {
            console.error('❌ Backend health check failed:', error);
            this.addMessage('Sorry, the chat service is temporarily unavailable. Please try again later.', 'bot');
        }
    }

    togglePopup() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.popup.classList.add('open');
        this.inputField.focus();
        this.scrollToBottom();
    }

    close() {
        this.isOpen = false;
        this.popup.classList.remove('open');
    }

    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        this.inputField.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            if (this.isEscalated) {
                await this.sendToHumanAgent(message);
            } else {
                await this.sendToAI(message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, there was an error sending your message. Please try again.', 'bot');
            
            if (this.options.onError) {
                this.options.onError(error);
            }
        }
    }

    async sendToAI(message) {
        const response = await fetch(`${this.options.backendUrl}/api/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                user_id: this.userId,
                conversation_id: this.conversationId,
                response_mode: 'streaming'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        this.hideTypingIndicator();

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
                            
                            if (data.event === 'message') {
                                aiResponse += data.answer;
                                this.updateLastMessage(aiResponse, 'bot');
                            } else if (data.event === 'escalation') {
                                this.handleEscalation(data);
                            } else if (data.event === 'message_end') {
                                this.conversationId = data.conversation_id;
                                this.finalizeLastMessage();
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    async sendToHumanAgent(message) {
        const response = await fetch(`${this.options.backendUrl}/api/chatwoot/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                escalation_key: this.escalationKey
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        this.hideTypingIndicator();
    }

    handleEscalation(data) {
        this.isEscalated = true;
        this.escalationKey = data.escalation_key;
        this.agentName = data.agent_name || 'Human Agent';
        
        this.header.textContent = `Chat with ${this.agentName}`;
        this.addMessage(`You've been connected to ${this.agentName}. They'll help you with your request.`, 'bot');
        
        // Start WebSocket connection for real-time agent messages
        this.connectToAgentWebSocket();
        
        if (this.options.onEscalation) {
            this.options.onEscalation(data);
        }
    }

    connectToAgentWebSocket() {
        if (this.wsConnection) {
            this.wsConnection.close();
        }

        const wsUrl = `wss://${this.options.backendUrl.replace('https://', '')}/${this.escalationKey}`;
        this.wsConnection = new WebSocket(wsUrl);

        this.wsConnection.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'agent_message') {
                    this.addMessage(data.message, 'agent');
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.wsConnection.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        this.messagesContainer.appendChild(messageDiv);
        
        this.messages.push({ text, sender, timestamp: new Date() });
        this.scrollToBottom();

        if (this.options.onMessage) {
            this.options.onMessage({ text, sender, timestamp: new Date() });
        }
    }

    updateLastMessage(text, sender) {
        const lastMessage = this.messagesContainer.lastElementChild;
        if (lastMessage && lastMessage.classList.contains(`${sender}-message`)) {
            const contentDiv = lastMessage.querySelector('.message-content');
            contentDiv.textContent = text;
            this.scrollToBottom();
        }
    }

    finalizeLastMessage() {
        // Message is complete, no more updates needed
    }

    showTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = this.messagesContainer.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    // Public API methods
    open() {
        this.open();
    }

    close() {
        this.close();
    }

    sendMessage(message) {
        this.inputField.value = message;
        this.sendMessage();
    }

    destroy() {
        if (this.wsConnection) {
            this.wsConnection.close();
        }
        if (this.widget && this.widget.parentNode) {
            this.widget.parentNode.removeChild(this.widget);
        }
    }
}

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
    .chatbot-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .chatbot-toggle {
        width: 60px;
        height: 60px;
        background: #667eea;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
        color: white;
    }

    .chatbot-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    .chatbot-popup {
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
    }

    .chatbot-popup.open {
        display: flex;
    }

    .chatbot-header {
        background: #667eea;
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .chatbot-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }

    .chatbot-close {
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

    .chatbot-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .chat-message {
        display: flex;
        flex-direction: column;
        max-width: 80%;
    }

    .bot-message {
        align-self: flex-start;
    }

    .user-message {
        align-self: flex-end;
    }

    .agent-message {
        align-self: flex-start;
        border-left: 3px solid #28a745;
    }

    .message-content {
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
    }

    .bot-message .message-content {
        background: #f1f3f4;
        color: #333;
    }

    .agent-message .message-content {
        background: #e8f5e8;
        color: #2d5a2d;
    }

    .user-message .message-content {
        background: #667eea;
        color: white;
    }

    .message-time {
        font-size: 11px;
        color: #666;
        margin-top: 4px;
        padding: 0 4px;
    }

    .chatbot-input {
        padding: 16px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        gap: 8px;
    }

    .chatbot-input input {
        flex: 1;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 20px;
        outline: none;
        font-size: 14px;
    }

    .chatbot-input input:focus {
        border-color: #667eea;
    }

    .chatbot-input button {
        padding: 12px 20px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
    }

    .chatbot-input button:hover {
        background: #5a6fd8;
    }

    .typing-indicator .message-content {
        background: #f1f3f4;
        padding: 16px;
    }

    .typing-dots {
        display: flex;
        gap: 4px;
    }

    .typing-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #999;
        animation: typing 1.4s infinite ease-in-out;
    }

    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes typing {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
    }

    @media (max-width: 480px) {
        .chatbot-popup {
            width: 300px;
            height: 400px;
        }
    }
`;
document.head.appendChild(style);

// Export for global use
window.CustomChatbotWidget = CustomChatbotWidget;
