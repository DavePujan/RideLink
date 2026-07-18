import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function SupportChatbot() {
  const { token, dbUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message and load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ridesathi_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        initializeDefault();
      }
    } else {
      initializeDefault();
    }
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ridesathi_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const initializeDefault = () => {
    const welcome: Message = {
      role: 'assistant',
      content: `Namaste${dbUser?.name ? `, ${dbUser.name}` : ''}! 🚗 I am **RideSathi Mitra**, your personalized AI travel assistant. 

How can I help you today? I can:
- 📅 **Check your active bookings** or offered carpools.
- 🔍 **Help you search** for rides or guide you on how to book seats.
- 🚗 **Explain how to offer rides** or register your vehicle.
- ⚙️ **Troubleshoot platform settings** on your Profile page.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([welcome]);
  };

  const handleClearChat = () => {
    const conf = window.confirm('Are you sure you want to clear your chat history?');
    if (conf) {
      localStorage.removeItem('ridesathi_chat_history');
      initializeDefault();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const newMsg: Message = {
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      // Map history to server schema
      const mappedMessages = updatedHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: mappedMessages }),
      });

      const data = await res.json();

      if (data.success) {
        const botMsg: Message = {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err: any) {
      console.error('Chatbot error:', err);
      const errorMsg: Message = {
        role: 'assistant',
        content: 'I apologize, but I am experiencing connectivity issues right now. Please verify your internet connection or try again shortly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Simple Markdown parsing for bullet points, bold tags, and paragraphs
  const parseMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let content = line;
      // Bold tags
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet items
      if (line.trim().startsWith('- ')) {
        const itemText = content.replace(/^\s*-\s+/, '');
        return (
          <li key={idx} className="ml-4 list-disc pl-1 mb-1 leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: content.startsWith('- ') ? itemText : content }} />
        );
      }
      return (
        <p key={idx} className="mb-2 leading-relaxed text-slate-700 min-h-[4px]" dangerouslySetInnerHTML={{ __html: content }} />
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-4 rounded-full text-white cursor-pointer shadow-lg flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-slate-800 hover:bg-slate-900 rotate-90' : 'bg-blue-600 hover:bg-blue-700'}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          id="chatbot-launcher-btn"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </motion.button>
      </div>

      {/* Slide-Up Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-24 right-6 w-[360px] sm:w-[400px] h-[520px] bg-white rounded-2xl border border-slate-200/80 shadow-2xl z-50 overflow-hidden flex flex-col font-sans"
            id="chatbot-container-panel"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                    RideSathi Mitra
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] font-semibold text-blue-100 uppercase tracking-wider">AI Support • Context Aware</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <button
                    onClick={handleClearChat}
                    className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition"
                    title="Clear history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0 flex items-center justify-center font-bold text-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div className="space-y-1">
                    <div
                      className={`p-3 text-xs rounded-2xl leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {parseMarkdown(msg.content)}
                        </div>
                      )}
                    </div>
                    <p className={`text-[9px] text-slate-400 font-medium ${msg.role === 'user' ? 'text-right pr-1' : 'pl-1'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2.5 max-w-[85%] mr-auto">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0 flex items-center justify-center font-bold text-xs">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your bookings, schedules, etc..."
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl py-2 px-3.5 text-xs text-slate-800 outline-none transition"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 transition cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
