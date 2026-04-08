import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { StockDetailResponse, NewsItem } from "../types";
import { getStockDetail } from "../services/api";
import { formatCompact, formatPct, formatPrice, pctClass } from "../services/format";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";

export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<StockDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    getStockDetail(ticker)
      .then(setData)
      .catch((e) => setError(e?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [ticker]);

  // Auto-scroll timeline to "today" marker on load
  useEffect(() => {
    if (data && timelineRef.current) {
      const marker = timelineRef.current.querySelector(".timeline-now-marker") as HTMLElement;
      if (marker) {
        const container = timelineRef.current;
        container.scrollLeft = marker.offsetLeft - container.clientWidth / 2;
      }
    }
  }, [data]);

  if (loading) {
    return (
      <>
        <header className="app-header">
          <Link to="/" style={{ textDecoration: "none" }}>
            <h1><span className="logo-icon">&#9670;</span> Stock Screener</h1>
          </Link>
        </header>
        <div className="loading"><div className="spinner" /><div className="loading-text">Loading {ticker}...</div></div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <header className="app-header">
          <Link to="/" style={{ textDecoration: "none" }}>
            <h1><span className="logo-icon">&#9670;</span> Stock Screener</h1>
          </Link>
        </header>
        <div className="empty-state">
          <h3>Error loading stock</h3>
          <p>{error || "Unknown error"}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/")}>Back to Screener</button>
        </div>
      </>
    );
  }

  const { detail: d, news_timeline, price_history } = data;

  // Prepare chart data
  const chartData = price_history.map((p) => ({
    date: p.date,
    price: p.close,
    volume: p.volume,
    high: p.high,
    low: p.low,
  }));

  // Split news into past and future for timeline
  const today = new Date().toISOString().split("T")[0];
  const pastNews = news_timeline.filter((n) => !n.is_future && n.date <= today);
  const futureNews = news_timeline.filter((n) => n.is_future || n.date > today);

  // Total timeline items
  const allItems = [
    ...pastNews.map((n) => ({ ...n, type: "past" as const })),
    ...futureNews.map((n) => ({ ...n, type: "future" as const })),
  ];

  const fundamentals: { label: string; value: string }[] = [
    { label: "Market Cap", value: formatCompact(d.market_cap) },
    { label: "P/E Ratio", value: d.pe_ratio != null ? d.pe_ratio.toFixed(2) : "N/A" },
    { label: "Forward P/E", value: d.forward_pe != null ? d.forward_pe.toFixed(2) : "N/A" },
    { label: "Dividend Yield", value: d.dividend_yield != null ? (d.dividend_yield * 100).toFixed(2) + "%" : "N/A" },
    { label: "52W High", value: formatPrice(d.week_52_high) },
    { label: "52W Low", value: formatPrice(d.week_52_low) },
    { label: "% from 52W High", value: formatPct(d.distance_from_52w_high) },
    { label: "% from 52W Low", value: formatPct(d.distance_from_52w_low) },
    { label: "Short Float", value: d.short_float != null ? (d.short_float * 100).toFixed(2) + "%" : "N/A" },
    { label: "Float Shares", value: d.float_shares != null ? formatCompact(d.float_shares) : "N/A" },
    { label: "Shares Out", value: d.shares_outstanding != null ? formatCompact(d.shares_outstanding) : "N/A" },
    { label: "Beta", value: d.beta != null ? d.beta.toFixed(2) : "N/A" },
    { label: "Inst. Ownership", value: d.institutional_ownership != null ? (d.institutional_ownership * 100).toFixed(1) + "%" : "N/A" },
    { label: "Insider Ownership", value: d.insider_ownership != null ? (d.insider_ownership * 100).toFixed(1) + "%" : "N/A" },
    { label: "Avg Volume (30d)", value: formatCompact(d.avg_volume_30d) },
    { label: "Rel. Volume", value: d.relative_volume.toFixed(2) + "x" },
  ];

  return (
    <>
      <header className="app-header">
        <Link to="/" style={{ textDecoration: "none" }}>
          <h1><span className="logo-icon">&#9670;</span> Stock Screener</h1>
        </Link>
      </header>

      <div className="detail-page">
        {/* Header */}
        <div className="detail-header">
          <button className="detail-back" onClick={() => navigate("/")}>
            &#8592; Back to Screener
          </button>
          <div className="detail-title-row">
            <span className="detail-ticker">{d.ticker}</span>
            <span className="detail-name">{d.name}</span>
            {d.sector && <span className="badge badge-blue">{d.sector}</span>}
            {d.exchange && <span className="badge badge-orange">{d.exchange}</span>}
          </div>
          <div className="detail-price-row">
            <span className="detail-price">{formatPrice(d.price)}</span>
            <span className={`detail-change ${pctClass(d.change_pct)}`}>
              {formatPct(d.change_pct)}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Vol: {formatCompact(d.volume)}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="detail-body">
          <div className="detail-left">
            {/* Price Chart */}
            <div className="chart-section">
              <h2>Price Chart (1Y)</h2>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2962ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2962ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#787b86", fontSize: 10 }}
                    tickFormatter={(v) => v.substring(5)}
                    axisLine={{ stroke: "#363a45" }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: "#787b86", fontSize: 10 }}
                    axisLine={{ stroke: "#363a45" }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{ background: "#1e222d", border: "1px solid #363a45", borderRadius: 4, fontSize: 12 }}
                    labelStyle={{ color: "#d1d4dc" }}
                    itemStyle={{ color: "#2962ff" }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#2962ff" fill="url(#priceGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>

              {/* Volume Chart */}
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Bar dataKey="volume" fill="#363a45" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* News Timeline */}
            <div className="timeline-section">
              <h2>News Timeline</h2>
              <div className="timeline-container" ref={timelineRef}>
                <div className="timeline-track" style={{ minWidth: allItems.length * 210 + 100 }}>
                  <div className="timeline-line" />

                  {/* Past news */}
                  {pastNews.map((item, i) => (
                    <TimelineCard key={`past-${i}`} item={item} type="past" />
                  ))}

                  {/* Now marker */}
                  <div style={{ flex: "0 0 80px", position: "relative" }}>
                    <div className="timeline-now-marker" style={{ left: "50%" }}>
                      <span className="timeline-now-label">TODAY</span>
                    </div>
                    <div style={{ height: 60 }} />
                  </div>

                  {/* Future catalysts */}
                  {futureNews.length > 0 ? (
                    futureNews.map((item, i) => (
                      <TimelineCard key={`future-${i}`} item={item} type="future" />
                    ))
                  ) : (
                    <div style={{ flex: "0 0 200px", padding: "35px 8px 0", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        No upcoming catalysts
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {d.description && (
              <div className="description-section">
                <h2>About</h2>
                <div className={`description-text ${descExpanded ? "expanded" : ""}`}>
                  {d.description}
                </div>
                {d.description.length > 200 && (
                  <button className="show-more-btn" onClick={() => setDescExpanded(!descExpanded)}>
                    {descExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="detail-right">
            {/* Fundamentals */}
            <div className="fundamentals-grid">
              {fundamentals.map((f) => (
                <div className="fundamental-item" key={f.label}>
                  <div className="fundamental-label">{f.label}</div>
                  <div className="fundamental-value">{f.value}</div>
                </div>
              ))}
            </div>

            {/* Technical Indicators */}
            <div className="technicals-section">
              <h2>Technical Indicators</h2>

              <div className="technical-item">
                <span className="technical-label">RSI (14)</span>
                <span className="technical-value" style={{
                  color: d.rsi != null ? (d.rsi <= 30 ? "var(--green)" : d.rsi >= 70 ? "var(--red)" : "var(--text-primary)") : "var(--text-muted)"
                }}>
                  {d.rsi != null ? d.rsi.toFixed(1) : "N/A"}
                  {d.rsi != null && (
                    <span style={{ fontSize: 11, marginLeft: 8, color: "var(--text-muted)" }}>
                      {d.rsi <= 30 ? "(Oversold)" : d.rsi >= 70 ? "(Overbought)" : "(Neutral)"}
                    </span>
                  )}
                </span>
              </div>

              <div className="technical-item">
                <span className="technical-label">MACD Signal</span>
                <span className="technical-value">
                  {d.macd_signal ? (
                    <span className={`badge ${d.macd_signal === "bullish" ? "badge-green" : "badge-red"}`}>
                      {d.macd_signal}
                    </span>
                  ) : "N/A"}
                </span>
              </div>

              <div className="technical-item">
                <span className="technical-label">ATR (14)</span>
                <span className="technical-value">{d.atr != null ? `$${d.atr.toFixed(2)}` : "N/A"}</span>
              </div>

              {d.next_earnings_date && (
                <div className="technical-item">
                  <span className="technical-label">Next Earnings</span>
                  <span className="technical-value">
                    <span className="badge badge-orange">{d.next_earnings_date}</span>
                  </span>
                </div>
              )}

              <div className="technical-item">
                <span className="technical-label">52W Range Position</span>
                <span className="technical-value">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatPrice(d.week_52_low)}</span>
                    <div style={{
                      width: 100, height: 6, background: "var(--bg-tertiary)", borderRadius: 3, position: "relative"
                    }}>
                      <div style={{
                        position: "absolute",
                        left: `${Math.max(0, Math.min(100, ((d.price - d.week_52_low) / (d.week_52_high - d.week_52_low)) * 100))}%`,
                        top: -2,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "var(--accent-blue)",
                        transform: "translateX(-50%)",
                      }} />
                    </div>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatPrice(d.week_52_high)}</span>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TimelineCard({ item, type }: { item: NewsItem; type: "past" | "future" }) {
  const dotClass = item.category === "earnings" ? "earnings" : type;

  return (
    <div className={`timeline-item ${dotClass}`}>
      <div className="timeline-dot" />
      <div className="timeline-date">{item.date}</div>
      <a
        href={item.url || undefined}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
        onClick={(e) => { if (!item.url) e.preventDefault(); }}
      >
        <div className="timeline-card">
          <div className="timeline-card-title">{item.title}</div>
          {item.source && <div className="timeline-card-source">{item.source}</div>}
          <span className={`timeline-card-category ${item.category}`}>{item.category}</span>
        </div>
      </a>
    </div>
  );
}
