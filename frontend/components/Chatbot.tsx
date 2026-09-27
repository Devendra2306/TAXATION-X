'use client';
import { useState, useRef, useEffect } from 'react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi! I'm your AI tax assistant. I can help with tax queries, deduction suggestions, and filing guidance. What would you like to know?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let response = "I can definitely help with that. Based on current tax laws, you should ensure you have all relevant documents ready. Is there anything specific?";
      if (text.toLowerCase().includes("deduction")) {
        response = "You can claim deductions under 80C (up to ₹1.5L for PF, LIC, ELSS), 80D (Health Insurance ₹25k/₹50k), 80CCD(1B) (NPS ₹50k extra), and 80TTA (Savings Interest ₹10k) under the Old Regime.";
      } else if (text.toLowerCase().includes("regime")) {
        response = "The New Regime has lower tax rates but removes most deductions (80C, 80D, HRA). The Old Regime has higher rates but lets you reduce taxable income. Upload your Form 16 and we'll compare both for you!";
      } else if (text.toLowerCase().includes("verify")) {
        response = "To e-verify: Go to incometax.gov.in → e-Verify Return → Enter PAN, AY, and Acknowledgment Number → Choose Aadhaar OTP → Done in 2 minutes!";
      }
      setMessages(prev => [...prev, { sender: 'bot', text: response }]);
    }, 1000);
  };

  return (
    <>
      {!isOpen && (
        <button className="fab-chat" onClick={() => setIsOpen(true)}>🤖</button>
      )}

      {isOpen && (
        <div className="chat-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🤖</span>
              <span style={{ fontWeight: 600 }}>OFS Tax Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1rem' }}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={msg.sender === 'user' ? 'chat-bubble chat-bubble-user' : 'chat-bubble chat-bubble-bot'}>
                {msg.text}
              </div>
            ))}

            {messages.length === 1 && (
              <div className="chat-quick-actions">
                <button className="chat-quick-btn" onClick={() => handleSend("What deductions can I claim?")}>💰 Deductions</button>
                <button className="chat-quick-btn" onClick={() => handleSend("Old vs New regime?")}>⚖️ Old vs New</button>
                <button className="chat-quick-btn" onClick={() => handleSend("How to e-verify?")}>✅ e-Verify</button>
              </div>
            )}

            {isTyping && (
              <div className="chat-bubble chat-bubble-bot">
                <div className="typing-dots"><span></span><span></span><span></span></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}>
            <input
              className="input"
              style={{ borderRadius: '20px', fontSize: '0.85rem' }}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything about taxes..."
            />
            <button type="submit" className="btn-primary" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, flexShrink: 0 }} disabled={!inputValue.trim()}>↑</button>
          </form>
        </div>
      )}
    </>
  );
}
