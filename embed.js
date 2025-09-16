/**
 * Bidirectional Communications Chatbot Widget - Embed Script
 * Easy integration script for websites
 */

(function() {
    'use strict';
    
    // Configuration from script tag attributes
    const script = document.currentScript;
    const config = {
        // Required
        backendUrl: script.getAttribute('data-backend-url') || 'http://localhost:3001',
        
        // Optional
        position: script.getAttribute('data-position') || 'bottom-right',
        theme: script.getAttribute('data-theme') || 'light',
        primaryColor: script.getAttribute('data-primary-color') || '#667eea',
        secondaryColor: script.getAttribute('data-secondary-color') || '#f7fafc',
        textColor: script.getAttribute('data-text-color') || '#2d3748',
        
        // Behavior
        autoOpen: script.getAttribute('data-auto-open') === 'true',
        showWelcomeMessage: script.getAttribute('data-welcome-message') !== 'false',
        welcomeMessage: script.getAttribute('data-welcome-message') || "Hello! I'm your AI assistant. How can I help you today?",
        
        // API
        apiKey: script.getAttribute('data-api-key'),
        userId: script.getAttribute('data-user-id'),
        
        // Escalation
        enableEscalation: script.getAttribute('data-enable-escalation') !== 'false',
        escalationKeywords: script.getAttribute('data-escalation-keywords')?.split(',') || ['human', 'agent', 'help', 'support'],
        
        // UI
        showTypingIndicator: script.getAttribute('data-typing-indicator') !== 'false',
        enableSound: script.getAttribute('data-sound') !== 'false',
        maxMessages: parseInt(script.getAttribute('data-max-messages')) || 100,
        
        // Widget ID
        widgetId: script.getAttribute('data-widget-id') || 'bidirectional-chat-widget'
    };
    
    // Load the main widget script
    function loadWidgetScript() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.BidirectionalChatWidget) {
                resolve();
                return;
            }
            
            const widgetScript = document.createElement('script');
            widgetScript.src = script.src.replace('embed.js', 'chatbot-widget.js');
            widgetScript.onload = resolve;
            widgetScript.onerror = reject;
            document.head.appendChild(widgetScript);
        });
    }
    
    // Initialize widget
    function initWidget() {
        loadWidgetScript().then(() => {
            window.bidirectionalChatWidget = new window.BidirectionalChatWidget(config);
            
            // Expose global methods for external control
            window.openChatWidget = () => window.bidirectionalChatWidget.open();
            window.closeChatWidget = () => window.bidirectionalChatWidget.close();
            window.sendChatMessage = (message) => window.bidirectionalChatWidget.sendMessage(message);
            window.addChatMessage = (content, role) => window.bidirectionalChatWidget.addCustomMessage(content, role);
            
            // Dispatch ready event
            document.dispatchEvent(new CustomEvent('bidirectionalChatReady', {
                detail: { widget: window.bidirectionalChatWidget }
            }));
            
        }).catch(error => {
            console.error('Failed to load bidirectional chat widget:', error);
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
    
})();
