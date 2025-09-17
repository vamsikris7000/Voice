// Simple Bidirectional Widget Embed Script
// This script loads the simple widget and initializes it

(function() {
  'use strict';
  
  // Get the current script element
  const currentScript = document.currentScript;
  if (!currentScript) {
    console.error('Simple Bidirectional Widget: Could not find script element');
    return;
  }
  
  // Extract configuration from data attributes
  const config = {
    backendUrl: currentScript.getAttribute('data-backend-url') || 'https://bidirectional-backend-production.up.railway.app',
    difyApiUrl: currentScript.getAttribute('data-dify-api-url') || null,
    difyApiKey: currentScript.getAttribute('data-dify-api-key') || null,
    position: currentScript.getAttribute('data-position') || 'bottom-right',
    primaryColor: currentScript.getAttribute('data-primary-color') || '#667eea',
    autoOpen: currentScript.getAttribute('data-auto-open') === 'true',
    theme: currentScript.getAttribute('data-theme') || 'light'
  };
  
  // Validate configuration
  if (!config.backendUrl && (!config.difyApiUrl || !config.difyApiKey)) {
    console.error('Simple Bidirectional Widget: Either data-backend-url OR (data-dify-api-url and data-dify-api-key) is required');
    return;
  }
  
  console.log('🚀 Simple Bidirectional Widget: Initializing with config:', config);
  
  // Load the widget script
  const script = document.createElement('script');
  script.src = 'https://widgetbot.netlify.app/simple-widget.js';
  script.async = true;
  
  script.onload = function() {
    console.log('✅ Simple Widget script loaded');
    
    // Initialize the widget
    if (window.SimpleBidirectionalWidget) {
      const widget = new window.SimpleBidirectionalWidget(config);
      
      // Store widget instance globally for debugging
      window.simpleBidirectionalWidget = widget;
      
      console.log('🎉 Simple Bidirectional Widget initialized successfully!');
      
      // Auto-open if configured
      if (config.autoOpen) {
        setTimeout(() => {
          widget.open();
        }, 1000);
      }
    } else {
      console.error('❌ SimpleBidirectionalWidget class not found');
    }
  };
  
  script.onerror = function() {
    console.error('❌ Failed to load Simple Widget script');
  };
  
  // Add script to document
  document.head.appendChild(script);
  
})();
