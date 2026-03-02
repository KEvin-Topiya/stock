import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUpIcon, TrendingDownIcon, LoaderIcon } from 'lucide-react';

export function MarketStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/market-stats');
      const data = await res.json();
      setStats(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to fetch market stats', err);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="market-card w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {loading ? (
        <div className="flex justify-center items-center py-6">
          <LoaderIcon size={18} className="animate-spin" />
        </div>
      ) : (
        <div
          className="flex items-stretch divide-x"
          style={{ borderColor: 'var(--border)' }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label || i}
              className="flex-1 px-5 py-4 min-w-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.1 * i + 0.3
              }}
            >
              <div
                className="font-sans font-medium uppercase tracking-widest mb-1"
                style={{
                  fontSize: '9px',
                  color: 'var(--text-muted)'
                }}
              >
                {stat.label}
              </div>

              <div
                className="font-display font-bold tabular-nums"
                style={{
                  fontSize: '20px',
                  color: 'var(--text)',
                  lineHeight: 1.2
                }}
              >
                {stat.value}
              </div>

              <div
                className="font-sans font-semibold text-xs tabular-nums flex items-center gap-1 mt-1"
                style={{
                  color: stat.isPositive ? '#22C55E' : '#EF4444'
                }}
              >
                {stat.isPositive ? (
                  <TrendingUpIcon size={11} />
                ) : (
                  <TrendingDownIcon size={11} />
                )}
                {stat.change}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}