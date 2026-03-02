import React, { useEffect, useState } from 'react';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

function TickerRow({ items, color, label }) {
  const doubled = [...items, ...items, ...items];

  if (!items || items.length === 0) return null;

  return (
    <div
      className="w-full overflow-hidden py-2 flex items-center gap-3"
      style={{ borderBottom: `1px solid ${color}18` }}
    >
      <div
        className="flex-shrink-0 px-3 py-1 text-xs font-bold tracking-wider uppercase z-10"
        style={{
          backgroundColor: `${color}18`,
          color,
          borderRight: `1px solid ${color}30`,
          fontFamily: 'Inter, sans-serif',
          minWidth: '80px',
          textAlign: 'center'
        }}
      >
        {label}
      </div>

      <div className="flex-1 overflow-hidden">
        <div
          className={
            label === 'GAINERS'
              ? 'ticker-track-gainers'
              : 'ticker-track-losers'
          }
          style={{ display: 'flex', width: 'max-content' }}
        >
          {doubled.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-5 whitespace-nowrap"
            >
              <span
                className="w-px h-3 opacity-20"
                style={{ backgroundColor: color }}
              />

              <span
                className="font-semibold text-xs"
                style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}
              >
                {item.name}
              </span>

              <span
                className="font-mono text-xs tabular-nums"
                style={{
                  color: 'var(--text-secondary)',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                ₹
                {Number(item.price).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>

              <span
                className="font-bold text-xs tabular-nums flex items-center gap-0.5"
                style={{ color, fontFamily: 'Inter, sans-serif' }}
              >
                {item.changePercent > 0 ? (
                  <TrendingUpIcon size={10} />
                ) : (
                  <TrendingDownIcon size={10} />
                )}
                {item.changePercent > 0 ? '+' : ''}
                {Number(item.changePercent).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export function TickerMarquee() {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function loadData() {
    try {
      setLoading(true);

      const res = await fetch('http://localhost:8080/api/gainers');

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${text}`);
      }

      const data = await res.json();
      console.log(data)
      const formatData = (list) =>
        (list || []).slice(0, 12).map((d) => ({
          name: d.companyName ?? d.tradingSymbol ?? d.name,
          price: parseFloat(d.ltp ?? d.price ?? 0),
          changePercent: parseFloat(
            d.perChange ?? d.changePercent ?? d.pChange ?? 0
          )
        }));

      setGainers(formatData(data.gainers));
      setLosers(formatData(data.losers));

    } catch (err) {
      console.error('Ticker API error:', err);
    } finally {
      setLoading(false);
    }
  }

  loadData();
}, []); // ✅ Show loading until BOTH finished
  if (loading) {
    return (
      <div className="w-full py-3 text-center text-sm"
        style={{ color: 'var(--text-muted)' }}>
        Loading market movers...
      </div>
    );
  }

  if (gainers.length === 0 && losers.length === 0) return null;

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: 'var(--card)',
        borderBottom: '1px solid var(--border)'
      }}
    >
      <TickerRow items={gainers} color="#22C55E" label="GAINERS" />
      <TickerRow items={losers} color="#EF4444" label="LOSERS" />
    </div>
  );
}