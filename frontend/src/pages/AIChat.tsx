import React, { useState, useRef, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Send, BrainCircuit, Bot, User, HelpCircle, MessageSquare } from 'lucide-react';

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
    <div className="relative min-h-[calc(100vh-80px)] bg-radial-overlay bg-grid-pattern py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-800/80 pb-5 mb-8 text-left">
          <div className="w-11 h-11 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse">
            <BrainCircuit className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <span className="text-gradient">AI Compatibility Assistant</span>
              <span className="px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                Gemini Active
              </span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Verify donor compatibility metrics and safety guidelines instantly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Helper Chips Column */}
          <div className="md:col-span-4 space-y-4 order-2 md:order-1 text-left">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
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
                    className="w-full text-left p-3 rounded-xl bg-slate-900/40 hover:bg-slate-900/90 border border-slate-850 hover:border-red-500/30 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-2 hover:translate-x-1 duration-200"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate">{q}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-l-4 border-red-500/40 text-xs space-y-2 border border-white/5 shadow-xl">
              <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-[10px]">Medical Dispatch Note</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                This conversational tool evaluates general safety procedures. Always verify eligibility limits with a blood donation coordinator in urgent scenarios.
              </p>
            </div>
          </div>

          {/* Chat Interface Column */}
          <div className="md:col-span-8 flex flex-col h-[520px] glass-panel rounded-2xl border border-white/5 shadow-2xl overflow-hidden order-1 md:order-2">
            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-950/30">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse text-right' : 'text-left'}`}
                  >
                    <div
                      className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
                        isUser
                          ? 'bg-slate-900 border-slate-850 text-slate-200'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-br from-red-600 to-red-700 text-white rounded-tr-none border border-red-500/20 shadow-md shadow-red-650/10'
                          : 'bg-slate-900/80 text-slate-250 rounded-tl-none border border-slate-800 shadow-sm'
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
                  <div className="w-8.5 h-8.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900/80 border border-slate-800 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
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
              className="p-4 border-t border-slate-900 bg-slate-950/70 flex gap-3.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about donor compatibility parameters..."
                className="flex-1 px-4 py-3 bg-slate-900/60 border border-slate-850 focus:border-red-500/40 rounded-xl outline-none text-slate-200 text-xs transition-all placeholder:text-slate-600 input-premium"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-3 bg-red-650 hover:bg-red-550 disabled:opacity-40 text-white rounded-xl shadow-lg shadow-red-600/10 hover:shadow-red-650/20 transition-all border border-red-500/20 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
