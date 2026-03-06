// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Dashboard from "./pages/Dashboard.jsx";
import IPO from "./pages/Ipo.jsx";

// Components
import { Header } from "./components/Header.jsx";

const STORAGE_KEY = "meridian-stocks";

// Helpers to persist stocks
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
  symbolToken: "99926000", // NIFTY 50 index
  name: "NIFTY 50",
  exchange: "NSE",
  tradingSymbol: "NIFTY",
};

export default function App() {
  const [theme, setTheme] = useState("light");
  const [savedStocks, setSavedStocks] = useState(loadStocks());
  const [selectedStock, setSelectedStock] = useState(DEFAULT_STOCK);

  useEffect(() => {
    saveStocks(savedStocks);
  }, [savedStocks]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const handleStockSelect = useCallback((stock) => {
    setSelectedStock(stock);

    setSavedStocks((prev) => {
      if (prev.some((s) => s.symbolToken === stock.symbolToken)) return prev;
      return [stock, ...prev];
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleOpenAI = () => {
    console.log("Open AI Assistant opened from Header");
  };

  const handleRemoveStock = useCallback((symbolToken) => {
    setSavedStocks((prev) => prev.filter((s) => s.symbolToken !== symbolToken));
  }, []);

  return (
    <Router>
      {/* Header always visible */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onStockSelect={handleStockSelect}
        onOpenAI={handleOpenAI}
      />

      {/* Pages */}
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              theme={theme}
              selectedStock={selectedStock}
              savedStocks={savedStocks}
              setSavedStocks={setSavedStocks}
              handleRemoveStock={handleRemoveStock}
            />
          }
        />
        <Route
          path="/ipo"
          element={
            <IPO
              theme={theme}
              selectedStock={selectedStock}
              savedStocks={savedStocks}
              setSavedStocks={setSavedStocks}
              handleRemoveStock={handleRemoveStock}
            />
          }
        />
      </Routes>
    </Router>
  );
}