import React, { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SunIcon,
  MoonIcon,
  SparklesIcon,
  SearchIcon,
  XIcon,
  LoaderIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export function Header({ theme, onToggleTheme, onStockSelect, onOpenAI }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // 🔥 Search API call
  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `https://b.jpassociate.co.in/api/search?q=${encodeURIComponent(q.trim())}`
      );

      if (!res.ok) throw new Error(await res.text());

      let data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      const filtered = list.filter((item) =>
        (item.name || "").toLowerCase().includes(q.toLowerCase())
      );

      setResults(filtered.slice(0, 20));
      setOpen(filtered.length > 0);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => search(query), 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(stock) {
    onStockSelect(stock);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full"
      style={{
        backgroundColor: "var(--card)",
        borderBottom: "1px solid rgba(245, 158, 11, 0.15)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex flex-col leading-none flex-shrink-0">
          <span
            className="font-black tracking-tight gold-gradient-text"
            style={{
              fontSize: "24px",
              lineHeight: 1,
              fontFamily: "Playfair Display, serif",
            }}
          >
            Stock Gpt
          </span>
          <span
            className="font-medium tracking-widest uppercase"
            style={{
              fontSize: "8px",
              color: "var(--text-muted)",
              letterSpacing: "0.25em",
              marginTop: "2px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            MARKETS
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex gap-4 items-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm font-medium ${isActive ? "text-gold" : "text-gray-700"}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/ipo"
            className={({ isActive }) =>
              `text-sm font-medium ${isActive ? "text-gold" : "text-gray-700"}`
            }
          >
            IPO
          </NavLink>
        </div>

        {/* Search Bar */}
        <div ref={containerRef} className="relative flex-1 max-w-md">
          <div
            className="flex items-center gap-2 px-4 h-10 rounded-full"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            {loading ? (
              <LoaderIcon
                size={15}
                className="animate-spin"
                style={{ color: "var(--gold)" }}
              />
            ) : (
              <SearchIcon size={15} style={{ color: "var(--text-muted)" }} />
            )}

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stocks by company name..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--text)", fontFamily: "Inter, sans-serif" }}
              onFocus={() => results.length > 0 && setOpen(true)}
            />

            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
                aria-label="Clear"
              >
                <XIcon size={13} style={{ color: "var(--text-muted)" }} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {open && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 left-0 right-0 rounded-xl shadow-2xl z-50"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="max-h-72 overflow-y-auto">
                  {results.map((r, i) => (
                    <button
                      key={`${r.symbolToken}-${i}`}
                      onClick={() =>
                        handleSelect({
                          symbolToken: r.token || r.symbolToken,
                          name: r.name,
                          exchange: r.exch_seg,
                          tradingSymbol: r.symbol,
                        })
                      }
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                      style={{
                        borderBottom:
                          i < results.length - 1
                            ? "1px solid var(--border)"
                            : "none",
                      }}
                    >
                      <div>
                        <div
                          className="font-semibold text-sm"
                          style={{ color: "var(--text)" }}
                        >
                          {r.name}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {r.tradingSymbol}
                        </div>
                      </div>

                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: "rgba(245,158,11,0.12)",
                          color: "var(--gold)",
                        }}
                      >
                        {r.exchange}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Theme Toggle */}
          {/* <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--border)",
              color: "var(--gold)",
            }}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {theme === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
            </motion.div>
          </button> */}

          {/* AI Button */}
          <button
            onClick={onOpenAI}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              color: "#1A1A1A",
            }}
            aria-label="Open AI Assistant"
          >
            <SparklesIcon size={15} />
          </button>
        </div>
      </div>
    </motion.header>
  );
}