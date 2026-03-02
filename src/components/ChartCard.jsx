import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

function SkeletonChart() {
  return (
    <div className="animate-pulse">
      <div className="p-6 pb-2">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="h-7 w-40 rounded mb-2" style={{ backgroundColor: 'var(--border)' }} />
            <div className="h-9 w-32 rounded mb-2" style={{ backgroundColor: 'var(--border)' }} />
            <div className="h-4 w-24 rounded" style={{ backgroundColor: 'var(--border)' }} />
          </div>
        </div>
      </div>
      <div className="h-72 mx-6 mb-4 rounded-lg" style={{ backgroundColor: 'var(--border)' }} />
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="market-card px-4 py-3" style={{ border: '1px solid rgba(245, 158, 11, 0.4)' }}>
      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="font-bold tabular-nums" style={{ fontSize: '18px', color: 'var(--gold)' }}>
        ₹{Number(payload[0].value).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </div>
    </div>
  );
}

export function ChartCard({
  stock,
  chartData,
  loading = false
}) {
  const [activeRange, setActiveRange] = useState('1D');

  const data = chartData ?? {};
  const currentData =
    data?.[activeRange] ||
    data?.data?.[activeRange] ||
    [];

  const firstValue = currentData[0]?.value ?? 0;
  const lastValue = currentData[currentData.length - 1]?.value ?? 0;

  const change = lastValue - firstValue;
  const changePercent = firstValue > 0 ? ((change / firstValue) * 100).toFixed(2) : '0.00';

  const isPositive = change >= 0;
  const chartColor = isPositive ? '#22C55E' : '#EF4444';

  const ltp = lastValue;

  if (!stock) return null;

  return (
    <motion.div className="market-card w-full">
      {loading ? (
        <SkeletonChart />
      ) : (
        <>
          <div className="p-6 pb-2">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-bold" style={{ fontSize: '26px', color: 'var(--text)' }}>
                  {stock.name}
                </h2>

                <div className="flex items-baseline gap-3 mt-1.5">
                  <span className="font-bold tabular-nums" style={{ fontSize: '34px', color: 'var(--text)' }}>
                    ₹{(ltp ?? 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>

                  <span
                    className="font-semibold text-sm tabular-nums flex items-center gap-1"
                    style={{ color: chartColor }}
                  >
                    {isPositive ? <TrendingUpIcon size={14} /> : <TrendingDownIcon size={14} />}
                    {isPositive ? '+' : ''}
                    {change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent}%)
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: 'rgba(245,158,11,0.12)',
                      color: 'var(--gold)'
                    }}
                  >
                    {stock.exchange}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {stock.tradingSymbol}
                  </span>
                </div>
              </div>

              {/* Range Buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                {['1D', '1W', '1M', '1Y', 'ALL'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setActiveRange(range)}
                    className="relative px-3 py-1.5 font-medium text-xs rounded transition-colors"
                    style={{
                      color: activeRange === range ? 'var(--gold)' : 'var(--text-muted)',
                      backgroundColor:
                        activeRange === range ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
                    }}
                  >
                    {range}
                    {activeRange === range && (
                      <motion.span
                        layoutId="range-indicator"
                        className="absolute bottom-0 left-0 right-0 h-px"
                        style={{ backgroundColor: 'var(--gold)' }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeRange}
              className="h-72 px-2 pb-4"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    opacity={0.4}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="time"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    orientation="right"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                    width={90}
                    domain={['auto', 'auto']}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={2}
                    fillOpacity={0.2}
                    fill={chartColor}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: chartColor,
                      stroke: 'var(--card)',
                      strokeWidth: 2
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}