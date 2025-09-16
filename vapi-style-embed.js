/**
 * Bidirectional Communications Chat Widget - Vapi Style
 * Matches Vapi's embed approach exactly
 */

(function() {
    'use strict';
    
    // Configuration from custom element attributes
    function getConfigFromElement(element) {
        return {
            // Required
            backendUrl: element.getAttribute('backend-url') || 'https://bidirectional-backend-production.up.railway.app',
            
            // Vapi-style attributes
            publicKey: element.getAttribute('public-key'),
            assistantId: element.getAttribute('assistant-id'),
            mode: element.getAttribute('mode') || 'chat',
            theme: element.getAttribute('theme') || 'light',
            
            // Custom attributes
            position: element.getAttribute('position') || 'bottom-right',
            primaryColor: element.getAttribute('primary-color') || '#667eea',
            autoOpen: element.getAttribute('auto-open') === 'true',
            welcomeMessage: element.getAttribute('welcome-message') || "Hello! I'm your AI assistant. How can I help you today?",
            
            // API
            apiKey: element.getAttribute('api-key'),
            userId: element.getAttribute('user-id'),
            
            // Escalation
            enableEscalation: element.getAttribute('enable-escalation') !== 'false',
            escalationKeywords: element.getAttribute('escalation-keywords')?.split(',') || ['human', 'agent', 'help', 'support'],
            
            // UI
            showTypingIndicator: element.getAttribute('typing-indicator') !== 'false',
            enableSound: element.getAttribute('sound') !== 'false',
            maxMessages: parseInt(element.getAttribute('max-messages')) || 100,
            
            // Widget ID
            widgetId: element.getAttribute('widget-id') || 'bidirectional-chat-widget'
        };
    }
    
    // Load the main widget script
    function loadWidgetScript() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.BidirectionalChatWidget) {
                resolve();
                return;
            }
            
            const widgetScript = document.createElement('script');
            widgetScript.src = 'https://widgetbot.netlify.app/chatbot-widget.js';
            widgetScript.onload = resolve;
            widgetScript.onerror = reject;
            document.head.appendChild(widgetScript);
        });
    }
    
    // Initialize widget for a custom element
    function initWidgetForElement(element) {
        loadWidgetScript().then(() => {
            const config = getConfigFromElement(element);
            
            // Create widget instance
            const widget = new window.BidirectionalChatWidget(config);
            
            // Store reference on the element
            element._widget = widget;
            
            // Expose global methods for external control
            if (!window.openChatWidget) {
                window.openChatWidget = () => {
                    const elements = document.querySelectorAll('bidirectional-widget');
                    elements.forEach(el => el._widget?.open());
                };
            }
            
            if (!window.closeChatWidget) {
                window.closeChatWidget = () => {
                    const elements = document.querySelectorAll('bidirectional-widget');
                    elements.forEach(el => el._widget?.close());
                };
            }
            
            if (!window.sendChatMessage) {
                window.sendChatMessage = (message) => {
                    const elements = document.querySelectorAll('bidirectional-widget');
                    elements.forEach(el => el._widget?.sendMessage(message));
                };
            }
            
            // Dispatch ready event
            element.dispatchEvent(new CustomEvent('bidirectionalChatReady', {
                detail: { widget, config }
            }));
            
        }).catch(error => {
            console.error('Failed to load bidirectional chat widget:', error);
        });
    }
    
    // Define custom element
    class BidirectionalWidget extends HTMLElement {
        constructor() {
            super();
        }
        
        connectedCallback() {
            // Initialize widget when element is added to DOM
            initWidgetForElement(this);
        }
        
        disconnectedCallback() {
            // Clean up when element is removed
            if (this._widget) {
                this._widget.destroy();
            }
        }
    }
    
    // Register custom element
    if (!customElements.get('bidirectional-widget')) {
        customElements.define('bidirectional-widget', BidirectionalWidget);
    }
    
    // Also support vapi-widget for compatibility
    if (!customElements.get('vapi-widget')) {
        customElements.define('vapi-widget', BidirectionalWidget);
    }
    
})();
