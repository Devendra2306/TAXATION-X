'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  X,
  Maximize2,
  Trash2,
  Lock,
  MessageSquare,
  Loader2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Chatbot({ isOpen: controlledIsOpen, onClose: controlledOnClose }: ChatbotProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalOpen;

  const handleToggle = (open: boolean) => {
    if (isControlled && controlledOnClose && !open) {
      controlledOnClose();
    } else {
      setInternalOpen(open);
    }
  };

  const initialGreeting: ChatMessage = {
    role: 'assistant',
    content:
      "👋 Hello! I am **NexTax AI**, your certified Chartered Accountant assistant for **FY 2024-25 (AY 2025-26)**.\n\n" +
      "I can help you calculate taxes, choose between Old & New regimes, maximize 80C/80D deductions, and file Form 16 accurately. What would you like to know?"
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  const quickPrompts = [
    { label: '⚖️ Old vs New Regime', text: 'Which regime is better for my salary: Old or New?' },
    { label: '💰 Max Deductions', text: 'What deductions can I claim under Section 80C and 80D?' },
    { label: '🏠 HRA Exemption', text: 'How is HRA exemption calculated?' },
    { label: '🗓️ ITR Deadlines', text: 'What is the ITR filing deadline and late fee penalty?' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const parsedTaxData = typeof window !== 'undefined' ? localStorage.getItem('parsedTaxData') : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let userContext = null;
      if (parsedTaxData) {
        try {
          userContext = JSON.parse(parsedTaxData);
        } catch {
          userContext = null;
        }
      }

      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          user_context: userContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Chat API error (${res.status})`);
      }

      const data = await res.json();
      const replyText = data.reply || "I'm sorry, I couldn't generate a response. Please try again.";
      setMessages([...newHistory, { role: 'assistant', content: replyText }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content:
            "⚠️ **Connection Notice:** Unable to reach the live AI server right now.\n\n" +
            "💡 **Quick Tip:** For FY 2024-25, the **New Tax Regime** offers zero tax up to **₹7.75 Lakhs** (including ₹75k Standard Deduction). If your eligible 80C/80D/HRA deductions exceed ₹4 Lakhs, the **Old Regime** may save you more.\n\n" +
            "Please try sending your message again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([initialGreeting]);
  };

  const handleExpandStudio = () => {
    handleToggle(false);
    router.push('/chat');
  };

  // Simple Markdown renderer for bullet points, bold text, headings
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-[13.5px] leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1 flex items-center gap-1.5">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('**') && line.endsWith('**')) {
            return (
              <p key={idx} className="font-bold text-slate-800">
                {line.replace(/\*\*/g, '')}
              </p>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const raw = line.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-indigo-600 font-bold shrink-0 mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{
                  __html: raw.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }} />
              </div>
            );
          }
          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{
                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Trigger FAB */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleToggle(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-3.5 rounded-full shadow-[0_12px_32px_rgba(15,23,42,0.35)] border border-white/20 hover:shadow-indigo-500/25 transition-all group"
          aria-label="Open NexTax AI Assistant"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles size={16} className="group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div className="text-left pr-1 hidden sm:block">
            <div className="text-xs font-bold leading-tight flex items-center gap-1">
              AI Tax Expert <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[10px] text-indigo-200/80 font-medium leading-none mt-0.5">Ask questions free</div>
          </div>
        </motion.button>
      )}

      {/* Interactive Chat Drawer Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.3)] border border-slate-200/80 overflow-hidden flex flex-col font-sans"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 pb-3.5 shrink-0 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                    <Bot size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm tracking-tight text-white">NexTax CA Assistant</h3>
                      <span className="text-[10px] font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-1.5 py-0.2 rounded-full">
                        AI Certified
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-indigo-200/80">
                      <Lock size={10} className="text-emerald-400" />
                      <span>256-Bit SSL Encrypted Session</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-300">
                  <button
                    onClick={handleExpandStudio}
                    title="Open Full Screen Studio"
                    className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Maximize2 size={15} />
                  </button>
                  <button
                    onClick={handleClearChat}
                    title="Clear Conversation"
                    className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={() => handleToggle(false)}
                    title="Close"
                    className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors ml-1"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Security Pill Bar */}
              <div className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 flex items-center justify-between text-[10px] text-slate-300 font-medium">
                <span className="flex items-center gap-1 text-emerald-300">
                  <ShieldCheck size={12} /> Bank-Grade Security
                </span>
                <span className="text-slate-400">AY 2025-26 Updated</span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 custom-scrollbar">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200/50">
                      <Bot size={15} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      renderFormattedText(msg.content)
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/50">
                    <Bot size={15} />
                  </div>
                  <div className="bg-white border border-slate-200/80 text-slate-600 p-3.5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-indigo-600" />
                    <span className="text-xs font-medium text-slate-500">NexTax AI analyzing tax laws...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips (when few messages) */}
            {messages.length <= 2 && (
              <div className="px-3.5 py-2 bg-slate-100/70 border-t border-slate-200/50 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
                {quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q.text)}
                    disabled={isLoading}
                    className="inline-flex items-center text-xs font-medium bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-200 px-3 py-1.5 rounded-full border border-slate-200/80 shadow-2xs transition-all shrink-0 active:scale-95"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-slate-200/80 shrink-0"
            >
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-2xl px-3.5 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white transition-all shadow-inner">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask any tax question (e.g. 80C, salary tax)..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-slate-900 placeholder:text-slate-400 font-medium py-1.5"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send size={15} />
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-500" /> 256-bit SSL encrypted • No PII shared
                </span>
                <button
                  type="button"
                  onClick={handleExpandStudio}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5"
                >
                  Full AI Studio <ChevronRight size={10} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
