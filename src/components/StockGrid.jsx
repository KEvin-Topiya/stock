import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StockCard } from './StockCard';

export function StockGrid({ stocks, onRemove, onAIChat }) {
  if (!stocks || stocks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{
            backgroundColor: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)'
          }}
        >
          <span style={{ fontSize: '28px' }}>
            📈
          </span>
        </div>

        <div
          className="font-semibold mb-1"
          style={{
            color: 'var(--text)',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          No stocks added yet
        </div>

        <div
          className="text-sm"
          style={{
            color: 'var(--text-muted)',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          Search for a company above to add it to your dashboard
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h3
          className="font-bold"
          style={{
            fontSize: '20px',
            color: 'var(--text)',
            fontFamily: 'Playfair Display, serif'
          }}
        >
          My Stocks
        </h3>

        <span
          className="text-xs"
          style={{
            color: 'var(--text-muted)',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {stocks.length} {stocks.length === 1 ? 'stock' : 'stocks'} · Live prices
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {stocks.map((stock, i) => (
            <StockCard
              key={stock.symbolToken}
              stock={stock}
              index={i}
              onRemove={onRemove}
              onAIChat={onAIChat}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}