import React, { useState, useRef, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Send, BrainCircuit, Bot, User, Sparkles, HelpCircle, MessageSquare } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChat: React.FC = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I am your AI Blood Bank Compatibility Assistant. 

You can ask me questions like:
*   "Can AB+ donate to O+?"
*   "How often can I donate blood?"
*   "Who is the universal donor?"

How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading || !token) return;

    const userMessage = text;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Map history format to backend compatible format
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: historyPayload,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.message || 'Failed to process prompt.'}` },
        ]);
      }
    } catch (error) {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Unable to contact AI service.' },
      ]);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-8 text-left">
        <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>AI Compatibility Assistant</span>
            <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[9px] font-bold uppercase tracking-wider">
              Gemini Powered
            </span>
          </h1>
          <p className="text-slate-400 text-xs">Verify donor charts and guidelines instantly</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Helper Chips Column */}
        <div className="md:col-span-4 space-y-4 order-2 md:order-1 text-left">
          <div className="glass-panel p-5 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-red-400" />
              <span>Suggested Queries</span>
            </h3>
            <div className="space-y-2">
              {[
                'Can A+ donate to O+?',
                'Who is the universal recipient?',
                'What is the age limit to donate?',
                'How long to wait after donating?',
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(q)}
                  className="w-full text-left p-3 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-red-500/20 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">{q}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border-l-4 border-red-500/20 text-xs space-y-2">
            <h4 className="font-bold text-slate-300">Important Medical Note</h4>
            <p className="text-slate-400 leading-relaxed">
              This helper assistant uses artificial intelligence (Gemini) to evaluate standard eligibility questions. In case of real emergencies, verify parameters with blood bank coordinators.
            </p>
          </div>
        </div>

        {/* Chat Interface Column */}
        <div className="md:col-span-8 flex flex-col h-[500px] glass-panel rounded-xl overflow-hidden order-1 md:order-2">
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/20">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse text-right' : 'text-left'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-slate-900 border-slate-800 text-slate-200'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-red-600 text-white rounded-tr-none border border-red-500/30'
                        : 'bg-slate-900/60 text-slate-300 rounded-tl-none border border-slate-800'
                    }`}
                  >
                    {/* Render simple bullets/newlines properly */}
                    <div className="whitespace-pre-line text-left">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 max-w-[85%] text-left">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900/60 border border-slate-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-4 border-t border-slate-800 bg-slate-950/60 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about donor compatibility..."
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl outline-none text-slate-200 text-xs transition-all placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-red-600/10 hover:shadow-red-600/20 transition-all border border-red-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
