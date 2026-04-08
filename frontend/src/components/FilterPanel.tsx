import React, { useState, useCallback } from "react";
import { ScreenerFilters } from "../types";

interface FilterPanelProps {
  filters: ScreenerFilters;
  onChange: (filters: ScreenerFilters) => void;
  onApply: () => void;
  onReset: () => void;
  loading: boolean;
}

interface SectionState {
  [key: string]: boolean;
}

const COUNTRIES = ["US", "UK", "Germany", "France", "Japan", "Hong Kong", "Canada", "Australia", "India"];
const SECTORS = [
  "Technology", "Healthcare", "Financial Services", "Consumer Cyclical",
  "Communication Services", "Industrials", "Consumer Defensive",
  "Energy", "Basic Materials", "Real Estate", "Utilities",
];
const CHART_PATTERNS = [
  { value: "double_top", label: "Double Top" },
  { value: "double_bottom", label: "Double Bottom" },
  { value: "head_and_shoulders", label: "Head & Shoulders" },
  { value: "inverse_head_and_shoulders", label: "Inverse H&S" },
  { value: "ascending_triangle", label: "Ascending Triangle" },
  { value: "descending_triangle", label: "Descending Triangle" },
  { value: "symmetrical_triangle", label: "Symmetrical Triangle" },
  { value: "bull_flag", label: "Bull Flag" },
  { value: "bear_flag", label: "Bear Flag" },
  { value: "cup_and_handle", label: "Cup & Handle" },
  { value: "wedge_up", label: "Rising Wedge" },
  { value: "wedge_down", label: "Falling Wedge" },
];

export default function FilterPanel({ filters, onChange, onApply, onReset, loading }: FilterPanelProps) {
  const [open, setOpen] = useState<SectionState>({
    country: true,
    marketCap: false,
    week52: false,
    todayMove: false,
    historicalMove: false,
    volume: false,
    gap: false,
    technical: false,
    chartPatterns: false,
    fundamentals: false,
    sector: false,
    signals: false,
    news: false,
  });

  const toggle = useCallback((key: string) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setFilter = useCallback(
    (key: keyof ScreenerFilters, value: any) => {
      onChange({ ...filters, [key]: value, page: 1 });
    },
    [filters, onChange]
  );

  const parseNum = (v: string): number | null => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  const toggleArrayItem = (arr: string[], item: string): string[] => {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  };

  const countActive = (): number => {
    let c = 0;
    if (filters.countries.length > 0 && !(filters.countries.length === 1 && filters.countries[0] === "US")) c++;
    if (filters.market_cap_min !== 50000000 || filters.market_cap_max !== null) c++;
    if (filters.new_52w_high) c++;
    if (filters.new_52w_low) c++;
    if (filters.pct_from_52w_high_min !== null || filters.pct_from_52w_high_max !== null) c++;
    if (filters.pct_from_52w_low_min !== null || filters.pct_from_52w_low_max !== null) c++;
    if (filters.pct_up_today_min !== null) c++;
    if (filters.pct_down_today_min !== null) c++;
    if (filters.pct_up_single_day_min !== null) c++;
    if (filters.pct_down_single_day_min !== null) c++;
    if (filters.volume_x_avg_30d_min !== null) c++;
    if (filters.gap_up_pct_min !== null) c++;
    if (filters.gap_down_pct_min !== null) c++;
    if (filters.rsi_min !== null || filters.rsi_max !== null) c++;
    if (filters.chart_patterns.length > 0) c++;
    if (filters.short_float_min !== null || filters.short_float_max !== null) c++;
    if (filters.pe_ratio_min !== null || filters.pe_ratio_max !== null) c++;
    if (filters.sectors.length > 0) c++;
    if (filters.golden_cross) c++;
    if (filters.death_cross) c++;
    if (filters.macd_bullish) c++;
    if (filters.macd_bearish) c++;
    if (filters.bollinger_squeeze) c++;
    if (filters.has_news_catalyst) c++;
    if (filters.relative_volume_min !== null) c++;
    return c;
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="filter-section">
      <div className="filter-section-header" onClick={() => toggle(id)}>
        <h3>{title}</h3>
        <span className={`arrow ${open[id] ? "open" : ""}`}>&#9660;</span>
      </div>
      {open[id] && <div className="filter-section-body">{children}</div>}
    </div>
  );

  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <h2>Filters</h2>
        {countActive() > 0 && <span className="filter-count">{countActive()}</span>}
      </div>

      {/* Country */}
      <Section id="country" title="Country / Market">
        <div className="chips-container">
          {COUNTRIES.map((c) => (
            <span
              key={c}
              className={`filter-chip ${filters.countries.includes(c) ? "active" : ""}`}
              onClick={() => setFilter("countries", toggleArrayItem(filters.countries, c))}
            >
              {c}
            </span>
          ))}
        </div>
      </Section>

      {/* Market Cap */}
      <Section id="marketCap" title="Market Cap">
        <div className="filter-row">
          <label>Min</label>
          <input
            type="text"
            className="filter-input"
            placeholder="50M"
            value={filters.market_cap_min != null ? (filters.market_cap_min / 1e6).toString() : ""}
            onChange={(e) => setFilter("market_cap_min", e.target.value ? parseFloat(e.target.value) * 1e6 : null)}
          />
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>M</span>
        </div>
        <div className="filter-row">
          <label>Max</label>
          <input
            type="text"
            className="filter-input"
            placeholder="No cap"
            value={filters.market_cap_max != null ? (filters.market_cap_max / 1e6).toString() : ""}
            onChange={(e) => setFilter("market_cap_max", e.target.value ? parseFloat(e.target.value) * 1e6 : null)}
          />
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>M</span>
        </div>
        <div className="chips-container" style={{ marginTop: 8 }}>
          {[
            { label: "Micro <$300M", min: 50e6, max: 300e6 },
            { label: "Small $300M-$2B", min: 300e6, max: 2e9 },
            { label: "Mid $2B-$10B", min: 2e9, max: 10e9 },
            { label: "Large $10B+", min: 10e9, max: null },
          ].map((preset) => (
            <span
              key={preset.label}
              className={`filter-chip ${filters.market_cap_min === preset.min && filters.market_cap_max === preset.max ? "active" : ""}`}
              onClick={() => { setFilter("market_cap_min", preset.min); onChange({ ...filters, market_cap_min: preset.min, market_cap_max: preset.max, page: 1 }); }}
            >
              {preset.label}
            </span>
          ))}
        </div>
      </Section>

      {/* 52-Week */}
      <Section id="week52" title="52-Week High / Low">
        <div className="filter-row">
          <span
            className={`filter-toggle ${filters.new_52w_high ? "active" : ""}`}
            onClick={() => setFilter("new_52w_high", filters.new_52w_high ? null : true)}
          >
            New 52W High
          </span>
          <span
            className={`filter-toggle ${filters.new_52w_low ? "active" : ""}`}
            onClick={() => setFilter("new_52w_low", filters.new_52w_low ? null : true)}
          >
            New 52W Low
          </span>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>% from 52W High</div>
          <div className="filter-range">
            <input className="filter-input" type="number" placeholder="Min %" value={filters.pct_from_52w_high_min ?? ""} onChange={(e) => setFilter("pct_from_52w_high_min", parseNum(e.target.value))} />
            <span className="separator">to</span>
            <input className="filter-input" type="number" placeholder="Max %" value={filters.pct_from_52w_high_max ?? ""} onChange={(e) => setFilter("pct_from_52w_high_max", parseNum(e.target.value))} />
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>% from 52W Low</div>
          <div className="filter-range">
            <input className="filter-input" type="number" placeholder="Min %" value={filters.pct_from_52w_low_min ?? ""} onChange={(e) => setFilter("pct_from_52w_low_min", parseNum(e.target.value))} />
            <span className="separator">to</span>
            <input className="filter-input" type="number" placeholder="Max %" value={filters.pct_from_52w_low_max ?? ""} onChange={(e) => setFilter("pct_from_52w_low_max", parseNum(e.target.value))} />
          </div>
        </div>
      </Section>

      {/* Today's Move */}
      <Section id="todayMove" title="Today's Price Move">
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>% Move Up Today</div>
        <div className="filter-range">
          <input className="filter-input" type="number" placeholder="Min %" value={filters.pct_up_today_min ?? ""} onChange={(e) => setFilter("pct_up_today_min", parseNum(e.target.value))} />
          <span className="separator">to</span>
          <input className="filter-input" type="number" placeholder="Max %" value={filters.pct_up_today_max ?? ""} onChange={(e) => setFilter("pct_up_today_max", parseNum(e.target.value))} />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>% Move Down Today</div>
        <div className="filter-range">
          <input className="filter-input" type="number" placeholder="Min %" value={filters.pct_down_today_min ?? ""} onChange={(e) => setFilter("pct_down_today_min", parseNum(e.target.value))} />
          <span className="separator">to</span>
          <input className="filter-input" type="number" placeholder="Max %" value={filters.pct_down_today_max ?? ""} onChange={(e) => setFilter("pct_down_today_max", parseNum(e.target.value))} />
        </div>
      </Section>

      {/* Historical Move */}
      <Section id="historicalMove" title="Historical Single-Day Move">
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Big Up Day in Past</div>
        <div className="filter-range">
          <input className="filter-input" type="number" placeholder="Min % up" value={filters.pct_up_single_day_min ?? ""} onChange={(e) => setFilter("pct_up_single_day_min", parseNum(e.target.value))} />
          <span className="separator">in</span>
          <input className="filter-input" type="number" placeholder="Days" value={filters.pct_up_single_day_lookback_days ?? ""} onChange={(e) => setFilter("pct_up_single_day_lookback_days", parseNum(e.target.value))} />
          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>days</span>
        </div>
        <label className="filter-checkbox" style={{ marginTop: 4 }}>
          <input type="checkbox" checked={filters.pct_up_single_day_lower_quartile === true} onChange={(e) => setFilter("pct_up_single_day_lower_quartile", e.target.checked ? true : null)} />
          Closed in lower quartile (bearish reversal)
        </label>

        <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Big Down Day in Past</div>
        <div className="filter-range">
          <input className="filter-input" type="number" placeholder="Min % down" value={filters.pct_down_single_day_min ?? ""} onChange={(e) => setFilter("pct_down_single_day_min", parseNum(e.target.value))} />
          <span className="separator">in</span>
          <input className="filter-input" type="number" placeholder="Days" value={filters.pct_down_single_day_lookback_days ?? ""} onChange={(e) => setFilter("pct_down_single_day_lookback_days", parseNum(e.target.value))} />
          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>days</span>
        </div>
        <label className="filter-checkbox" style={{ marginTop: 4 }}>
          <input type="checkbox" checked={filters.pct_down_single_day_upper_quartile === true} onChange={(e) => setFilter("pct_down_single_day_upper_quartile", e.target.checked ? true : null)} />
          Closed in upper quartile (bullish reversal)
        </label>
      </Section>

      {/* Volume */}
      <Section id="volume" title="Volume">
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>X times 30-Day Avg Volume</div>
        <div className="filter-row">
          <input className="filter-input" type="number" step="0.5" placeholder="e.g. 2.0" value={filters.volume_x_avg_30d_min ?? ""} onChange={(e) => setFilter("volume_x_avg_30d_min", parseNum(e.target.value))} />
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>x avg</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Relative Volume Min</div>
        <div className="filter-row">
          <input className="filter-input" type="number" step="0.5" placeholder="e.g. 1.5" value={filters.relative_volume_min ?? ""} onChange={(e) => setFilter("relative_volume_min", parseNum(e.target.value))} />
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>x</span>
        </div>
      </Section>

      {/* Opening Gap */}
      <Section id="gap" title="Opening Gap">
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Gap Up % (Open vs Prev Close)</div>
        <div className="filter-row">
          <input className="filter-input" type="number" placeholder="Min % gap up" value={filters.gap_up_pct_min ?? ""} onChange={(e) => setFilter("gap_up_pct_min", parseNum(e.target.value))} />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Gap Down %</div>
        <div className="filter-row">
          <input className="filter-input" type="number" placeholder="Min % gap down" value={filters.gap_down_pct_min ?? ""} onChange={(e) => setFilter("gap_down_pct_min", parseNum(e.target.value))} />
        </div>
      </Section>

      {/* Technical Indicators */}
      <Section id="technical" title="Technical Indicators">
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>RSI (14)</div>
        <div className="filter-range">
          <input className="filter-input" type="number" placeholder="Min" value={filters.rsi_min ?? ""} onChange={(e) => setFilter("rsi_min", parseNum(e.target.value))} />
          <span className="separator">to</span>
          <input className="filter-input" type="number" placeholder="Max" value={filters.rsi_max ?? ""} onChange={(e) => setFilter("rsi_max", parseNum(e.target.value))} />
        </div>
        <div className="chips-container" style={{ marginTop: 4 }}>
          <span className={`filter-chip ${filters.rsi_max === 30 && filters.rsi_min === null ? "active" : ""}`} onClick={() => onChange({ ...filters, rsi_min: null, rsi_max: 30, page: 1 })}>Oversold &lt;30</span>
          <span className={`filter-chip ${filters.rsi_min === 70 && filters.rsi_max === null ? "active" : ""}`} onClick={() => onChange({ ...filters, rsi_min: 70, rsi_max: null, page: 1 })}>Overbought &gt;70</span>
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>MACD</div>
        <div className="filter-row">
          <span className={`filter-toggle ${filters.macd_bullish ? "active" : ""}`} onClick={() => setFilter("macd_bullish", filters.macd_bullish ? null : true)}>Bullish</span>
          <span className={`filter-toggle ${filters.macd_bearish ? "active" : ""}`} onClick={() => setFilter("macd_bearish", filters.macd_bearish ? null : true)}>Bearish</span>
        </div>

        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Bollinger Bands</div>
        <span className={`filter-toggle ${filters.bollinger_squeeze ? "active" : ""}`} onClick={() => setFilter("bollinger_squeeze", filters.bollinger_squeeze ? null : true)}>Squeeze</span>
      </Section>

      {/* Chart Patterns */}
      <Section id="chartPatterns" title="Chart Patterns">
        <div className="chips-container">
          {CHART_PATTERNS.map((p) => (
            <span
              key={p.value}
              className={`filter-chip ${filters.chart_patterns.includes(p.value) ? "active" : ""}`}
              onClick={() => setFilter("chart_patterns", toggleArrayItem(filters.chart_patterns, p.value))}
            >
              {p.label}
            </span>
          ))}
        </div>
      </Section>

      {/* Short Interest & Fundamentals */}
      <Section id="fundamentals" title="Fundamentals & Short Interest">
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Short Float %</div>
        <div className="filter-range">
          <input className="filter-input" type="number" placeholder="Min %" value={filters.short_float_min ?? ""} onChange={(e) => setFilter("short_float_min", parseNum(e.target.value))} />
          <span className="separator">to</span>
          <input className="filter-input" type="number" placeholder="Max %" value={filters.short_float_max ?? ""} onChange={(e) => setFilter("short_float_max", parseNum(e.target.value))} />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>P/E Ratio</div>
        <div className="filter-range">
          <input className="filter-input" type="number" placeholder="Min" value={filters.pe_ratio_min ?? ""} onChange={(e) => setFilter("pe_ratio_min", parseNum(e.target.value))} />
          <span className="separator">to</span>
          <input className="filter-input" type="number" placeholder="Max" value={filters.pe_ratio_max ?? ""} onChange={(e) => setFilter("pe_ratio_max", parseNum(e.target.value))} />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Dividend Yield %</div>
        <div className="filter-range">
          <input className="filter-input" type="number" placeholder="Min %" value={filters.dividend_yield_min ?? ""} onChange={(e) => setFilter("dividend_yield_min", parseNum(e.target.value))} />
          <span className="separator">to</span>
          <input className="filter-input" type="number" placeholder="Max %" value={filters.dividend_yield_max ?? ""} onChange={(e) => setFilter("dividend_yield_max", parseNum(e.target.value))} />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Float Size (shares)</div>
        <div className="filter-range">
          <input className="filter-input" type="number" placeholder="Min" value={filters.float_shares_min ?? ""} onChange={(e) => setFilter("float_shares_min", parseNum(e.target.value))} />
          <span className="separator">to</span>
          <input className="filter-input" type="number" placeholder="Max" value={filters.float_shares_max ?? ""} onChange={(e) => setFilter("float_shares_max", parseNum(e.target.value))} />
        </div>
      </Section>

      {/* Sector */}
      <Section id="sector" title="Sector / Industry">
        <div className="chips-container">
          {SECTORS.map((s) => (
            <span
              key={s}
              className={`filter-chip ${filters.sectors.includes(s) ? "active" : ""}`}
              onClick={() => setFilter("sectors", toggleArrayItem(filters.sectors, s))}
            >
              {s}
            </span>
          ))}
        </div>
      </Section>

      {/* MA Signals */}
      <Section id="signals" title="Moving Average Signals">
        <div className="filter-row">
          <span className={`filter-toggle ${filters.golden_cross ? "active" : ""}`} onClick={() => setFilter("golden_cross", filters.golden_cross ? null : true)}>Golden Cross</span>
          <span className={`filter-toggle ${filters.death_cross ? "active" : ""}`} onClick={() => setFilter("death_cross", filters.death_cross ? null : true)}>Death Cross</span>
        </div>
      </Section>

      {/* News */}
      <Section id="news" title="News & Catalysts">
        <span className={`filter-toggle ${filters.has_news_catalyst ? "active" : ""}`} onClick={() => setFilter("has_news_catalyst", filters.has_news_catalyst ? null : true)}>Has News Catalyst</span>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Earnings Within (days)</div>
        <div className="filter-row">
          <input className="filter-input" type="number" placeholder="e.g. 7" value={filters.earnings_within_days ?? ""} onChange={(e) => setFilter("earnings_within_days", parseNum(e.target.value))} />
        </div>
      </Section>

      {/* Actions */}
      <div className="filter-actions">
        <button className="btn btn-primary" onClick={onApply} disabled={loading}>
          {loading ? "Screening..." : "Screen Stocks"}
        </button>
        <button className="btn btn-secondary" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
