# 🤖 Bidirectional Communications Chat Widget

A customizable, embeddable chatbot widget for your bidirectional AI-Human customer interface system. This widget provides seamless integration between AI assistance and human agent escalation.

## 🚀 Quick Start

### 1. Basic Integration

Add this single script tag to your website:

```html
<script 
    src="https://your-domain.com/widget/embed.js"
    data-backend-url="http://localhost:3001"
    data-position="bottom-right"
    data-primary-color="#667eea">
</script>
```

### 2. What You Need

**Required:**
- `data-backend-url`: Your backend server URL (where your Node.js server is running)

**Optional:**
- `data-position`: Widget position (`bottom-right`, `bottom-left`, `top-right`, `top-left`)
- `data-primary-color`: Primary color for the widget
- `data-auto-open`: Auto-open widget on page load (`true`/`false`)

## 📋 Configuration Options

### Required Parameters

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-backend-url` | Your backend server URL | `http://localhost:3001` |

### Optional Parameters

| Attribute | Description | Default | Options |
|-----------|-------------|---------|---------|
| `data-position` | Widget position | `bottom-right` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `data-primary-color` | Primary color | `#667eea` | Any valid CSS color |
| `data-secondary-color` | Secondary color | `#f7fafc` | Any valid CSS color |
| `data-text-color` | Text color | `#2d3748` | Any valid CSS color |
| `data-auto-open` | Auto-open on load | `false` | `true`, `false` |
| `data-welcome-message` | Welcome message | `"Hello! I'm your AI assistant..."` | Any string |
| `data-api-key` | API authentication key | `null` | Your API key |
| `data-user-id` | Custom user ID | Auto-generated | Any string |
| `data-enable-escalation` | Enable human escalation | `true` | `true`, `false` |
| `data-escalation-keywords` | Escalation trigger words | `human,agent,help,support` | Comma-separated list |
| `data-typing-indicator` | Show typing indicator | `true` | `true`, `false` |
| `data-sound` | Enable sound notifications | `false` | `true`, `false` |
| `data-max-messages` | Max messages to keep | `100` | Any number |
| `data-widget-id` | Custom widget ID | `bidirectional-chat-widget` | Any string |

## 🎨 Styling Examples

### Light Theme
```html
<script 
    src="embed.js"
    data-backend-url="http://localhost:3001"
    data-primary-color="#667eea"
    data-secondary-color="#f7fafc"
    data-text-color="#2d3748">
</script>
```

### Dark Theme
```html
<script 
    src="embed.js"
    data-backend-url="http://localhost:3001"
    data-primary-color="#4a5568"
    data-secondary-color="#2d3748"
    data-text-color="#e2e8f0">
</script>
```

### Brand Theme
```html
<script 
    src="embed.js"
    data-backend-url="http://localhost:3001"
    data-primary-color="#e53e3e"
    data-secondary-color="#fed7d7"
    data-text-color="#2d3748">
</script>
```

## 🔧 Advanced Usage

### Programmatic Initialization

For more control, initialize the widget programmatically:

```html
<script src="chatbot-widget.js"></script>
<script>
const widget = new BidirectionalChatWidget({
    backendUrl: 'http://localhost:3001',
    position: 'bottom-left',
    primaryColor: '#e53e3e',
    autoOpen: false,
    onMessage: (message) => {
        console.log('New message:', message);
    },
    onEscalation: (info) => {
        console.log('Escalated to human agent:', info);
        // Custom escalation handling
    },
    onError: (error) => {
        console.error('Widget error:', error);
        // Custom error handling
    }
});
</script>
```

### Global API Methods

The widget exposes these global methods:

```javascript
// Open the chat widget
openChatWidget();

// Close the chat widget
closeChatWidget();

// Send a message programmatically
sendChatMessage('Hello from JavaScript!');

// Add a custom message
addChatMessage('This is a system message', 'system');
```

### Event Listeners

Listen for widget events:

```javascript
document.addEventListener('bidirectionalChatReady', (event) => {
    console.log('Chat widget is ready!', event.detail.widget);
});

// Access the widget instance
const widget = window.bidirectionalChatWidget;
```

## 🎯 Features

### ✅ AI Chat
- Real-time streaming responses
- Typing indicators
- Message history
- Auto-scroll

### ✅ Human Escalation
- Automatic escalation detection
- Seamless handoff to human agents
- Real-time agent messages via WebSocket
- Status indicators

### ✅ Customization
- Multiple themes
- Custom colors
- Flexible positioning
- Responsive design

### ✅ Integration
- Easy embed script
- Programmatic API
- Event callbacks
- Error handling

## 📱 Mobile Support

The widget is fully responsive and works on:
- Desktop browsers
- Mobile devices
- Tablets
- Progressive Web Apps (PWAs)

## 🔒 Security

- API key authentication support
- CORS-enabled backend integration
- Secure WebSocket connections
- Input sanitization

## 🛠️ Backend Requirements

Your backend server must provide these endpoints:

### Required Endpoints
- `GET /api/health` - Health check
- `POST /api/chat/stream` - Streaming chat with Dify
- `POST /api/chatwoot/send-message` - Send message to Chatwoot
- `WebSocket /{escalation_key}` - Real-time agent messages

### Environment Variables
```env
DIFY_API_URL=https://your-dify-instance.com/v1
DIFY_API_KEY=your-dify-api-key
CHATWOOT_URL=https://your-chatwoot-instance.com
CHATWOOT_API_KEY=your-chatwoot-api-key
CHATWOOT_ACCOUNT_ID=your-account-id
CHATWOOT_INBOX_ID=your-inbox-id
```

## 📁 File Structure

```
widget/
├── chatbot-widget.js          # Main widget class
├── embed.js                   # Easy integration script
├── examples/
│   ├── basic-usage.html       # Basic integration example
│   └── custom-styling.html    # Styling examples
└── README.md                  # This documentation
```

## 🚀 Deployment

### 1. Host the Files
Upload the widget files to your web server:
- `chatbot-widget.js`
- `embed.js`

### 2. Update URLs
Update the script src in your embed code:
```html
<script src="https://your-domain.com/widget/embed.js" ...></script>
```

### 3. Configure Backend
Ensure your backend server is running and accessible from your website.

## 🐛 Troubleshooting

### Common Issues

**Widget not loading:**
- Check that the script URL is correct
- Verify your backend server is running
- Check browser console for errors

**Messages not sending:**
- Verify `data-backend-url` is correct
- Check backend API endpoints
- Ensure CORS is configured

**Escalation not working:**
- Verify Chatwoot configuration
- Check WebSocket connections
- Review backend logs

### Debug Mode

Enable debug logging:
```javascript
const widget = new BidirectionalChatWidget({
    backendUrl: 'http://localhost:3001',
    onError: (error) => {
        console.error('Widget Error:', error);
    }
});
```

## 📞 Support

For issues or questions:
1. Check the browser console for errors
2. Verify your backend server logs
3. Test with the provided examples
4. Review the configuration options

## 🔄 Updates

To update the widget:
1. Replace the widget files on your server
2. Clear browser cache
3. Test the integration

---

**Made with ❤️ for seamless AI-Human customer interactions**
