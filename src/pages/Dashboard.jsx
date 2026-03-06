// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Header } from "../components/Header";
import { TickerMarquee } from "../components/TickerMarquee";
import { ChartCard } from "../components/ChartCard";
import { StockGrid } from "../components/StockGrid";
import { FloatingAIButton } from "../components/FloatingAIButton";

const DEFAULT_STOCK = {
  symbolToken: "99926000", // NIFTY 50 index
  name: "NIFTY 50",
  exchange: "NSE",
  tradingSymbol: "NIFTY",
};

export default function Dashboard({
  theme,
  selectedStock,
  savedStocks,
  setSavedStocks,
  handleRemoveStock,
}) {
  const [chartData, setChartData] = useState(null);
  const [loadingChart, setLoadingChart] = useState(true);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiContext, setAiContext] = useState(null);

  // Load chart whenever selectedStock changes
  useEffect(() => {
    async function loadChart() {
      setLoadingChart(true);
      try {
        const res = await fetch("https://b.jpassociate.co.in/api/chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbolToken: selectedStock?.symbolToken || DEFAULT_STOCK.symbolToken,
            timeframe: "1D",
          }),
        });

        const data = await res.json();
        setChartData(data);
      } catch (err) {
        console.error("Chart fetch failed", err);
        setChartData(null);
      } finally {
        setLoadingChart(false);
      }
    }

    loadChart();
  }, [selectedStock]);

  const handleAIChat = useCallback((stock) => {
    setAiContext({
      stockName: stock.name,
      symbolToken: stock.symbolToken,
      exchange: stock.exchange,
    });
    setAiOpen(true);
  }, []);

  const handleOpenAI = useCallback(() => {
    setAiContext(null);
    setAiOpen(true);
  }, []);

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "var(--bg)" }}>
      <TickerMarquee />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Chart */}
        <ChartCard stock={selectedStock} chartData={chartData} loading={loadingChart} />

        {/* Stock Grid */}
        <StockGrid
          stocks={savedStocks}
          onRemove={handleRemoveStock}
          onAIChat={handleAIChat}
        />
      </main>

      <footer
        className="w-full py-5 text-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Made with ♥ by <span style={{ color: "var(--gold)" }}>Kavyta Group Pvt. Ltd.</span> ·
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