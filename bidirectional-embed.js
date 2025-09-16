// Bidirectional Communications Widget Embed Script
// Similar to Vapi's embed script structure

(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.bidirectionalWidgetInitialized) {
    return;
  }
  window.bidirectionalWidgetInitialized = true;
  
  // Load the main widget script
  function loadWidgetScript() {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.BidirectionalWidget) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://widgetbot.netlify.app/bidirectional-widget.umd.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  // Initialize widget with configuration
  function initializeWidget() {
    // Find the current script tag
    const currentScript = document.currentScript || 
      Array.from(document.querySelectorAll('script')).find(s => 
        s.src && s.src.includes('bidirectional-embed.js')
      );
    
    if (!currentScript) {
      console.error('Bidirectional Widget: Could not find script tag');
      return;
    }
    
    // Extract configuration from data attributes
    const config = {
      backendUrl: currentScript.getAttribute('data-backend-url') || 'https://bidirectional-backend-production.up.railway.app',
      position: currentScript.getAttribute('data-position') || 'bottom-right',
      primaryColor: currentScript.getAttribute('data-primary-color') || '#667eea',
      autoOpen: currentScript.getAttribute('data-auto-open') === 'true',
      theme: currentScript.getAttribute('data-theme') || 'light'
    };
    
    // Validate required configuration
    if (!config.backendUrl) {
      console.error('Bidirectional Widget: data-backend-url is required');
      return;
    }
    
    // Load and initialize widget
    loadWidgetScript()
      .then(() => {
        if (window.BidirectionalWidget) {
          const widget = new window.BidirectionalWidget(config);
          window.bidirectionalWidget = widget;
          
          // Auto-open if configured
          if (config.autoOpen) {
            setTimeout(() => widget.open(), 1000);
          }
          
          console.log('Bidirectional Widget initialized successfully');
        } else {
          console.error('Bidirectional Widget: Failed to load widget class');
        }
      })
      .catch(error => {
        console.error('Bidirectional Widget: Failed to load script:', error);
      });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
  } else {
    initializeWidget();
  }
  
})();
