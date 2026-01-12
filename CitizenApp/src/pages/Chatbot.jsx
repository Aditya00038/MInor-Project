import { useState } from 'react';
import { Send, Bot, User as UserIcon, Recycle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const BACKEND_URL = 'http://localhost:8000';

export default function Chatbot() {
  const { darkMode, colors } = useTheme();

  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hi! I'm your eco chatbot. Ask me how to reuse plastic, cardboard, old clothes, or other waste items to create something useful.",
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      type: 'user',
      text: input,
      time: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const query = input;
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chatbot/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: query })
      });

      if (!res.ok) {
        throw new Error('Failed to reach chatbot backend');
      }

      const data = await res.json();

      const botMessage = {
        type: 'bot',
        text: data.reply || 'I found a few ideas, but something went wrong formatting them.',
        time: new Date(),
        ideas: data.ideas || []
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const fallback = {
        type: 'bot',
        text: 'I could not reach the eco-ideas server. Make sure the backend is running on http://localhost:8000. Meanwhile, try asking about plastic bottle planters, cardboard organizers, or bags from old t-shirts.',
        time: new Date()
      };
      setMessages(prev => [...prev, fallback]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${colors.surface} rounded-3xl shadow-lg overflow-hidden border ${colors.border}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 flex items-center gap-3 text-white">
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
            <Recycle size={26} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Eco Chatbot</h1>
            <p className="text-xs text-white/80">Ask how to reuse plastic, paper, cardboard & old items</p>
          </div>
        </div>

        {/* Messages */}
        <div className={`h-96 overflow-y-auto p-4 space-y-3 ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user'
                    ? 'bg-green-500 text-white'
                    : darkMode
                      ? 'bg-gray-800 text-green-400'
                      : 'bg-white text-green-600 border border-green-100'
                }`}>
                  {message.type === 'bot' ? <Bot size={18} /> : <UserIcon size={18} />}
                </div>
                <div>
                  <div className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                    message.type === 'user'
                      ? 'bg-green-500 text-white'
                      : darkMode
                        ? 'bg-gray-800 text-gray-100'
                        : 'bg-white text-slate-900 shadow-sm'
                  }`}>
                    {message.text}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                    <span>{message.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Optional rich idea cards when available */}
                  {message.type === 'bot' && message.ideas && message.ideas.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.ideas.map((idea) => (
                        <div
                          key={idea.id}
                          className={`border rounded-2xl p-2 text-xs ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-emerald-100 bg-emerald-50'}`}
                        >
                          <div className="font-semibold text-xs mb-1">{idea.title}</div>
                          <div className="text-[11px] opacity-80 mb-1">Materials: {idea.materials?.join(', ')}</div>
                          <div className="text-[11px] opacity-80 mb-1">Difficulty: {idea.difficulty}</div>
                          {idea.summary && (
                            <div className="text-[11px] opacity-90">{idea.summary}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex justify-start mt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-150" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-300" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className={`p-3 border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about recycling ideas..."
              className={`flex-1 rounded-2xl px-3 py-2 text-sm outline-none ${
                darkMode ? 'bg-gray-800 text-gray-100 placeholder-gray-500' : 'bg-slate-100 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                !input.trim() || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              <Send size={18} />
            </button>
          </div>

          {/* Quick prompts */}
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              'Ideas with plastic bottles',
              'Reuse old t-shirts',
              'Cardboard projects for home',
              'Kids craft with waste items'
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setInput(q)}
                className={`px-3 py-1 rounded-full text-[11px] border ${darkMode ? 'border-gray-700 text-gray-300' : 'border-slate-200 text-slate-600'} bg-transparent`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
