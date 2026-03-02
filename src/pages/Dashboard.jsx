import React, { useCallback, useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { TickerMarquee } from '../components/TickerMarquee';
import { ChartCard } from '../components/ChartCard';
import { StockGrid } from '../components/StockGrid';
import { FloatingAIButton } from '../components/FloatingAIButton';
import { useTheme } from '../hooks/useTheme';

const STORAGE_KEY = 'meridian-stocks';

function loadStocks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStocks(stocks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
}

const DEFAULT_STOCK = {
  symbolToken: '99926000', // NIFTY 50 index
  name: 'NIFTY 50',
  exchange: 'NSE',
  tradingSymbol: 'NIFTY'
};

export function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [savedStocks, setSavedStocks] = useState(loadStocks());

  const [selectedStock, setSelectedStock] = useState(DEFAULT_STOCK);
  const [chartData, setChartData] = useState(null);
  const [loadingChart, setLoadingChart] = useState(true);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiContext, setAiContext] = useState(null);

  useEffect(() => {
    saveStocks(savedStocks);
  }, [savedStocks]);

  // 🔥 Load default chart on first render (NIFTY)
  useEffect(() => {
    async function loadDefaultChart() {
      setLoadingChart(true);
      try {
        const res = await fetch('https://stock.kavyta.com/api/chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbolToken: DEFAULT_STOCK.symbolToken,
            timeframe: '1D'
          })
        });

        const data = await res.json();
        setChartData(data);
      } catch (err) {
        console.error('default chart failed', err);
        setChartData(null);
      } finally {
        setLoadingChart(false);
      }
    }

    loadDefaultChart();
  }, []);

  // 🔥 Stock selected from search
const handleStockSelect = useCallback(async (stock) => {
  setSelectedStock(stock);

  setSavedStocks((prev) => {
    if (prev.some((s) => s.symbolToken === stock.symbolToken)) return prev;
    return [stock, ...prev];
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  setLoadingChart(true);
  try {
    const res = await fetch('https://stock.kavyta.com/api/chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
  symbolToken: String(stock.symbolToken || ''),
  timeframe: '1D'
})

    });console.log('sending chart request', {
  symbolToken: stock.symbolToken
});

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    console.log('chart data:', data);

    setChartData(data || {});
  } catch (err) {
    console.error('chart fetch failed', err);
    setChartData({});
  } finally {
    setLoadingChart(false);
  }
}, []);

  const handleRemoveStock = useCallback((symbolToken) => {
    setSavedStocks((prev) => prev.filter((s) => s.symbolToken !== symbolToken));
  }, []);

  const handleAIChat = useCallback((stock) => {
    setAiContext({
      stockName: stock.name,
      symbolToken: stock.symbolToken,
      exchange: stock.exchange
    });
    setAiOpen(true);
  }, []);

  const handleOpenAI = useCallback(() => {
    setAiContext(null);
    setAiOpen(true);
  }, []);

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: 'var(--bg)' }}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onStockSelect={handleStockSelect}
        onOpenAI={handleOpenAI}
      />

      <TickerMarquee />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <ChartCard
          stock={selectedStock}
          chartData={chartData}
          loading={loadingChart}
        />

        <StockGrid
          stocks={savedStocks}
          onRemove={handleRemoveStock}
          onAIChat={handleAIChat}
        />

        <div className="h-8" />
      </main>

      <footer
        className="w-full py-5 text-center"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Made with ♥ by <span style={{ color: 'var(--gold)' }}>Kavyta Group Pvt. Ltd.</span> ·
          For educational purposes only
        </span>
      </footer>

      <FloatingAIButton
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        onOpen={handleOpenAI}
        context={aiContext}
      />
    </div>
  );
}