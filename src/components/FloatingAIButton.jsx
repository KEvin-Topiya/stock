import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, XIcon, SendIcon, LoaderIcon } from 'lucide-react';

const WELCOME_MESSAGES = {
  default:
    "Hello! I'm your AI market assistant. I can help you analyze stocks, explain market trends, and provide risk insights. What would you like to know?"
};

function getWelcome(ctx) {
  if (ctx?.stockName) {
    return `Hello! I'm ready to analyze **${ctx.stockName}** for you. I can provide trend analysis, risk commentary, and market insights. What would you like to know?`;
  }
  return WELCOME_MESSAGES.default;
}

function formatMessage(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

export function FloatingAIButton({
  isOpen,
  onClose,
  onOpen,
  context
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: getWelcome(context)
        }
      ]);
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, context?.stockName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: context ?? null,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await res.json();

      const reply =
        data.reply ??
        data.message ??
        data.response ??
        data.content ??
        "I'm analyzing the market data. Please note I provide analysis only — not buy or sell recommendations.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + 'r',
          role: 'assistant',
          content: reply
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + 'e',
          role: 'assistant',
          content: context?.stockName
            ? `Based on available data for **${context.stockName}**: This stock shows typical market volatility patterns. For a thorough analysis, consider reviewing its recent earnings, sector performance, and broader market conditions. Remember, all investments carry risk.`
            : "I'm here to help with market analysis and trend insights. Please note that I provide educational analysis only — never direct buy or sell recommendations."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="market-card overflow-hidden flex flex-col"
            style={{
              width: '360px',
              height: '520px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3.5 flex items-center justify-between flex-shrink-0"
              style={{
                borderBottom: '1px solid var(--border)',
                background:
                  'linear-gradient(135deg, rgba(245,158,11,0.07), rgba(217,119,6,0.03))'
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)'
                  }}
                >
                  <SparklesIcon size={13} color="#1A1A1A" />
                </div>

                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    AI Market Assistant
                  </div>

                  {context?.stockName ? (
                    <div className="text-xs" style={{ color: 'var(--gold)' }}>
                      Analyzing: {context.stockName}
                    </div>
                  ) : (
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Analysis only · No buy/sell advice
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--border)'
                }}
              >
                <XIcon size={13} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed"
                    style={{
                      ...(msg.role === 'user'
                        ? {
                            background:
                              'linear-gradient(135deg, #F59E0B, #D97706)',
                            color: '#1A1A1A',
                            borderBottomRightRadius: '4px'
                          }
                        : {
                            backgroundColor: 'var(--bg)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            borderBottomLeftRadius: '4px'
                          })
                    }}
                  >
                    {formatMessage(msg.content)}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div
                    className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2"
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <LoaderIcon
                      size={12}
                      className="animate-spin"
                      style={{ color: 'var(--gold)' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Analyzing...
                    </span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Disclaimer */}
            <div
              className="px-4 py-1.5 text-center"
              style={{
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--bg)'
              }}
            >
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                ⚠️ Analysis only · Not financial advice
              </span>
            </div>

            {/* Input */}
            <div
              className="px-3 py-3 flex items-center gap-2"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !e.shiftKey && sendMessage()
                }
                placeholder={
                  context?.stockName
                    ? `Ask about ${context.stockName}...`
                    : 'Ask about any stock...'
                }
                className="flex-1 text-xs px-3.5 py-2.5 rounded-full outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)'
                }}
                disabled={loading}
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#1A1A1A',
                  opacity: !input.trim() || loading ? 0.5 : 1
                }}
              >
                <SendIcon size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          onClick={onOpen}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #F59E0B, #D97706)'
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <SparklesIcon size={22} color="#1A1A1A" />
        </motion.button>
      )}
    </div>
  );
}