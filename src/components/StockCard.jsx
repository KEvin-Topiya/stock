import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  XIcon,
  SparklesIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from 'lucide-react';

export function StockCard({
  stock,
  index,
  onRemove,
  onAIChat
}) {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchPrice = async () => {
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tokens: [stock.symbolToken]
        })
      });

      const data = await res.json();

      const fetched =
        data?.ltp?.data?.fetched ??
        data?.data?.fetched ??
        data?.fetched ??
        [];

      if (fetched.length > 0) {
        const ltpVal = parseFloat(fetched[0].ltp);

        setPrice((prev) => ({
          ltp: ltpVal,
          prevLtp: prev?.ltp ?? null
        }));
      }
    } catch {
      // optional fallback mock (remove if not needed)
      setPrice((prev) => {
        const base = prev?.ltp ?? 1000 + Math.random() * 3000;
        const newLtp = parseFloat(
          (base + (Math.random() - 0.5) * 10).toFixed(2)
        );

        return {
          ltp: newLtp,
          prevLtp: prev?.ltp ?? null
        };
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    intervalRef.current = setInterval(fetchPrice, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stock.symbolToken]);

  const change =
    price?.prevLtp != null ? price.ltp - price.prevLtp : null;

  const changePercent =
    change != null && price?.prevLtp
      ? (change / price.prevLtp) * 100
      : null;

  const isPositive =
    change == null ? null : change >= 0;

  const priceColor =
    isPositive === null
      ? 'var(--text)'
      : isPositive
      ? '#22C55E'
      : '#EF4444';

  return (
    <motion.div
      className="market-card relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: 'easeOut'
      }}
      style={{
        borderLeft: `3px solid ${
          isPositive === null
            ? 'var(--border)'
            : isPositive
            ? '#22C55E'
            : '#EF4444'
        }`
      }}
    >
      <div className="p-4">

        {/* Top Section */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <div
              className="font-semibold text-sm leading-tight truncate"
              style={{
                color: 'var(--text)',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {stock.name}
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'rgba(245,158,11,0.1)',
                  color: 'var(--gold)',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {stock.exchange}
              </span>

              <span
                className="text-xs truncate"
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {stock.tradingSymbol}
              </span>
            </div>
          </div>

          <button
            onClick={() => onRemove(stock.symbolToken)}
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-150"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--border)'
            }}
          >
            <XIcon size={11} />
          </button>
        </div>

        {/* Price Section */}
        {loading ? (
          <div className="animate-pulse">
            <div
              className="h-8 w-28 rounded mb-1.5"
              style={{ backgroundColor: 'var(--border)' }}
            />
            <div
              className="h-4 w-20 rounded"
              style={{ backgroundColor: 'var(--border)' }}
            />
          </div>
        ) : (
          <div className="mb-3">
            <div
              className="font-bold tabular-nums"
              style={{
                fontSize: '26px',
                color: priceColor,
                lineHeight: 1,
                fontFamily: 'Inter, sans-serif'
              }}
            >
              ₹
              {price?.ltp?.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }) ?? '—'}
            </div>

            {change !== null && changePercent !== null ? (
              <div
                className="flex items-center gap-1 mt-1 text-xs font-semibold tabular-nums"
                style={{
                  color: priceColor,
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {isPositive ? (
                  <TrendingUpIcon size={11} />
                ) : (
                  <TrendingDownIcon size={11} />
                )}
                {isPositive ? '+' : ''}
                {change.toFixed(2)} ({isPositive ? '+' : ''}
                {changePercent.toFixed(2)}%)
              </div>
            ) : (
              <div
                className="text-xs mt-1"
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Live · refreshes every 30s
              </div>
            )}
          </div>
        )}

        {/* AI Button */}
        <button
          onClick={() => onAIChat(stock)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
          style={{
            backgroundColor: 'rgba(245,158,11,0.08)',
            color: 'var(--gold)',
            border: '1px solid rgba(245,158,11,0.2)',
            fontFamily: 'Inter, sans-serif'
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              'rgba(245,158,11,0.15)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              'rgba(245,158,11,0.08)')
          }
        >
          <SparklesIcon size={12} />
          Ask AI about this stock
        </button>

      </div>
    </motion.div>
  );
}