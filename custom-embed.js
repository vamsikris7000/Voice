/**
 * Custom Chatbot Widget - Easy Embed Script
 * Simple integration for the custom chatbot widget
 */

(function() {
    'use strict';
    
    // Configuration from script tag attributes
    const script = document.currentScript;
    const config = {
        // Required
        backendUrl: script.getAttribute('data-backend-url') || 'https://bidirectional-backend-production.up.railway.app',
        
        // Optional
        position: script.getAttribute('data-position') || 'bottom-right',
        primaryColor: script.getAttribute('data-primary-color') || '#667eea',
        welcomeMessage: script.getAttribute('data-welcome-message') || "Hello! I'm your AI assistant. How can I help you today?",
        autoOpen: script.getAttribute('data-auto-open') === 'true',
        enableEscalation: script.getAttribute('data-enable-escalation') !== 'false',
        escalationKeywords: script.getAttribute('data-escalation-keywords')?.split(',') || ['human', 'agent', 'help', 'support'],
        
        // Callbacks
        onMessage: null,
        onEscalation: null,
        onError: null
    };
    
    // Load the main widget script
    function loadWidgetScript() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.CustomChatbotWidget) {
                resolve();
                return;
            }
            
            const widgetScript = document.createElement('script');
            widgetScript.src = script.src.replace('custom-embed.js', 'custom-chatbot-widget.js');
            widgetScript.onload = resolve;
            widgetScript.onerror = reject;
            document.head.appendChild(widgetScript);
        });
    }
    
    // Initialize widget
    function initWidget() {
        loadWidgetScript().then(() => {
            window.customChatbotWidget = new window.CustomChatbotWidget(config);
            
            // Expose global methods for external control
            window.openCustomChatbot = () => window.customChatbotWidget.open();
            window.closeCustomChatbot = () => window.customChatbotWidget.close();
            window.sendCustomChatMessage = (message) => window.customChatbotWidget.sendMessage(message);
            
            // Dispatch ready event
            document.dispatchEvent(new CustomEvent('customChatbotReady', {
                detail: { widget: window.customChatbotWidget }
            }));
            
        }).catch(error => {
            console.error('Failed to load custom chatbot widget:', error);
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
    
})();
