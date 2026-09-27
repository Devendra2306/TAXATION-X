"use client";

import React, { useState } from 'react';
import { Send, Bot, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm the NexTax AI Expert. I can help you with tax queries, choosing regimes, or understanding your deductions. What's on your mind?" }
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', text: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    
    try {
      const parsedData = localStorage.getItem('parsedTaxData') || '{}';
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({ role: m.role, content: m.text })),
          user_context: JSON.parse(parsedData)
        })
      });
      
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      setMessages([...currentMessages, { role: 'assistant', text: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages([...currentMessages, { role: 'assistant', text: "Sorry, I am having trouble connecting to the server right now." }]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 h-[calc(100vh-6rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">AI Tax Expert</h1>
        <p className="text-slate-500">Ask any questions about your taxes or the filing process.</p>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">NexTax AI Assistant</h3>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <ShieldCheck size={12} /> Privacy protected (No PII stored)
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx} 
              className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-primary/10 text-primary'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about 80C, capital gains, regimes..."
              className="w-full bg-slate-100 border-none rounded-xl pl-4 pr-12 py-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
