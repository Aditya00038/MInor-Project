import { useState } from 'react';
import { Send, Bot, User as UserIcon } from 'lucide-react';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! I\'m your civic assistant. How can I help you today?',
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');

  const predefinedResponses = {
    'how to report': 'To report a problem, go to the "Report Problem" page, select a category, add description, capture your location, upload an image/video, and submit. You\'ll receive status updates!',
    'track report': 'You can track all your reports on the "Track Reports" page. Filter by status to see Reported, Assigned, In Progress, or Completed issues.',
    'status': 'Report statuses are:\n• Reported - Issue submitted\n• Assigned - Assigned to a worker\n• In Progress - Worker is resolving it\n• Completed - Issue resolved',
    'categories': 'We support these categories:\n• Garbage on Open Spaces\n• Road Damage\n• Drainage Issues\n• Street Light Problem\n• Water Leakage\n• Pothole\n• Other',
    'before after': 'Once a problem is completed, you can view before-and-after images in the report details to see how it was resolved.',
    'leaderboard': 'The Leaderboard page shows top-performing workers based on completed tasks and citizen ratings. This encourages accountability and recognition.',
    'workers': 'Field workers receive task assignments and can also self-assign low-priority tasks. They upload before-and-after images as proof of work.',
    'hi': 'Hello! How can I assist you with civic issues today?',
    'hello': 'Hi there! I\'m here to help. What would you like to know?',
    'help': 'I can help you with:\n• How to report problems\n• Track your reports\n• Understanding report statuses\n• Problem categories\n• Before-after verification\n• Leaderboard info\n\nJust ask me anything!'
  };

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(predefinedResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    
    return 'I\'m here to help! Try asking about:\n• How to report issues\n• Tracking reports\n• Report statuses\n• Problem categories\n• Leaderboard\n\nOr type "help" for more options.';
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      type: 'user',
      text: input,
      time: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      const botResponse = {
        type: 'bot',
        text: getBotResponse(input),
        time: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <Bot size={32} />
        <div>
          <h1>Civic Assistant</h1>
          <p>Ask me anything about reporting civic issues</p>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'bot' ? <Bot size={24} /> : <UserIcon size={24} />}
            </div>
            <div className="message-content">
              <p>{message.text}</p>
              <span className="message-time">
                {message.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your question..."
        />
        <button onClick={handleSend} disabled={!input.trim()}>
          <Send size={20} />
        </button>
      </div>

      <div className="quick-questions">
        <p>Quick questions:</p>
        <div className="question-buttons">
          <button onClick={() => setInput('How to report a problem?')}>
            How to report?
          </button>
          <button onClick={() => setInput('Track my reports')}>
            Track reports
          </button>
          <button onClick={() => setInput('Report statuses')}>
            Report status
          </button>
          <button onClick={() => setInput('Help')}>
            Help
          </button>
        </div>
      </div>
    </div>
  );
}
