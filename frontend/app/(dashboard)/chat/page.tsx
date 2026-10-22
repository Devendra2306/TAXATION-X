"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  ShieldCheck,
  Lock,
  Sparkles,
  Loader2,
  Trash2,
  Copy,
  Check,
  ArrowRight,
  Scale,
  DollarSign,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export default function ChatPage() {
  const initialGreeting: ChatMessage = {
    role: 'assistant',
    text:
      "👋 Hello! I am your dedicated **NexTax AI Tax Expert**, powered by Indian Chartered Accountant intelligence for **FY 2024-25 (AY 2025-26)**.\n\n" +
      "I have full context of current tax laws, slabs, and exemptions. If you have uploaded your Form 16, I can analyze your exact numbers and compute your optimal regime. How can I help you save tax today?"
  };

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    { title: 'Compare Regimes', query: 'Based on my salary, should I choose Old or New Tax Regime?' },
    { title: '80C & 80D Deductions', query: 'What are all the deductions I can claim to reduce tax under Old Regime?' },
    { title: 'HRA Exemption Formula', query: 'How can I calculate my maximum HRA exemption?' },
    { title: 'Capital Gains (Budget 24)', query: 'What are the latest STCG and LTCG tax rates on shares and mutual funds?' },
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: 'user', text };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setLoading(true);

    try {
      const parsedData = typeof window !== 'undefined' ? localStorage.getItem('parsedTaxData') : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let userContext = null;
      if (parsedData) {
        try {
          userContext = JSON.parse(parsedData);
        } catch {
          userContext = null;
        }
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: currentMessages.map((m) => ({ role: m.role, content: m.text })),
          user_context: userContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch (${res.status})`);
      }

      const data = await res.json();
      setMessages([...currentMessages, { role: 'assistant', text: data.reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...currentMessages,
        {
          role: 'assistant',
          text:
            "⚠️ **Connection Notice:** Unable to reach the AI server right now.\n\n" +
            "💡 **CA Insight for FY 2024-25:** Under the **New Tax Regime**, total income up to **₹7.75 Lakhs** has zero tax liability after rebate u/s 87A and the ₹75,000 Standard Deduction. Under the **Old Tax Regime**, you can reduce income via Section 80C (up to ₹1.5L), 80D (health insurance up to ₹50k), and HRA.\n\n" +
            "Please try sending your message again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const renderFormatted = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-base mt-3 mb-1">
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
                <span className="text-primary font-bold shrink-0 mt-0.5">•</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: raw.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>'),
                  }}
                />
              </div>
            );
          }
          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{
                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>'),
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12 h-[calc(100vh-5.5rem)] flex flex-col font-sans">
      {/* Header with Encryption Trust Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 px-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            NexTax AI Tax Studio
            <span className="text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">
              FY 2024-25
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time Chartered Accountant intelligence calibrated for Indian Income Tax regulations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-semibold px-3 py-1.5 rounded-xl">
            <Lock size={13} className="text-emerald-600" />
            <span>256-Bit SSL Encrypted</span>
          </div>

          <button
            onClick={() => setMessages([initialGreeting])}
            title="Clear Chat History"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200/60 px-3 py-1.5 rounded-xl transition-all"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/50 custom-scrollbar">
          {messages.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              className={`flex gap-3.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
                }`}
              >
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>

              <div className="relative group">
                <div
                  className={`p-4 rounded-3xl ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-xs shadow-md shadow-primary/10'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    renderFormatted(msg.text)
                  )}
                </div>

                {msg.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(msg.text, idx)}
                    className="absolute -bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 shadow-xs text-slate-500 hover:text-slate-800 rounded-lg p-1 text-[11px] flex items-center gap-1"
                    title="Copy Answer"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <Check size={12} className="text-emerald-600" />
                        <span className="text-emerald-600 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Bot size={18} />
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-3xl rounded-tl-xs shadow-sm flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-primary" />
                <span className="text-xs text-slate-600 font-medium">
                  NexTax AI verifying Income Tax Act provisions...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompt Cards */}
        {messages.length <= 3 && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q.query)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white text-slate-700 hover:text-primary hover:border-primary/40 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs transition-all shrink-0 active:scale-95"
              >
                <Sparkles size={12} className="text-amber-500" />
                {q.title}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about 80C, 80D, capital gains, Old vs New regime, Form 16..."
              disabled={loading}
              className="w-full bg-slate-100/80 border border-slate-200/80 rounded-2xl pl-5 pr-14 py-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary focus:bg-white transition-all placeholder:text-slate-400 font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2.5 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Send size={18} />
            </button>
          </form>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" /> End-to-end encrypted • Certified Indian CA Logic
            </span>
            <span>Section 115BAC & Old Regime Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
