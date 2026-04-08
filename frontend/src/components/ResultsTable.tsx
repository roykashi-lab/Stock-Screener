import React from "react";
import { useNavigate } from "react-router-dom";
import { StockResult, ScreenerFilters } from "../types";
import { formatCompact, formatPct, formatPrice, formatVolume, pctClass } from "../services/format";

interface ResultsTableProps {
  results: StockResult[];
  totalCount: number;
  page: number;
  totalPages: number;
  filters: ScreenerFilters;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
  loading: boolean;
}

const COLUMNS: { key: string; label: string; sortable: boolean }[] = [
  { key: "ticker", label: "Ticker", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "price", label: "Price", sortable: true },
  { key: "change_pct", label: "Change %", sortable: true },
  { key: "gap_pct", label: "Gap %", sortable: true },
  { key: "volume", label: "Volume", sortable: true },
  { key: "relative_volume", label: "Rel Vol", sortable: true },
  { key: "market_cap", label: "Mkt Cap", sortable: true },
  { key: "distance_from_52w_high", label: "% from 52H", sortable: true },
  { key: "distance_from_52w_low", label: "% from 52L", sortable: true },
  { key: "rsi", label: "RSI", sortable: true },
  { key: "short_float", label: "Short %", sortable: true },
  { key: "sector", label: "Sector", sortable: true },
];

export default function ResultsTable({
  results, totalCount, page, totalPages, filters, onSort, onPageChange, loading,
}: ResultsTableProps) {
  const navigate = useNavigate();

  const handleSort = (key: string) => onSort(key);

  const renderSortArrow = (key: string) => {
    if (filters.sort_by !== key) return null;
    return <span className="sort-arrow">{filters.sort_order === "asc" ? "\u25B2" : "\u25BC"}</span>;
  };

  const rsiColor = (rsi: number | null) => {
    if (rsi == null) return "var(--text-muted)";
    if (rsi <= 30) return "var(--green)";
    if (rsi >= 70) return "var(--red)";
    return "var(--text-primary)";
  };

  const rsiBg = (rsi: number | null) => {
    if (rsi == null) return "var(--bg-tertiary)";
    if (rsi <= 30) return "var(--green)";
    if (rsi >= 70) return "var(--red)";
    if (rsi >= 50) return "var(--orange)";
    return "var(--accent-blue)";
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <div className="loading-text">Scanning stocks...</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#128270;</div>
        <h3>No stocks found</h3>
        <p>Try adjusting your filters or expanding the search criteria</p>
      </div>
    );
  }

  return (
    <>
      <div className="results-toolbar">
        <div className="results-info">
          <span className="results-count">{totalCount} stocks</span>
          <span>Page {page} of {totalPages}</span>
        </div>
      </div>

      <table className="results-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={filters.sort_by === col.key ? "sorted" : ""}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                {col.label}
                {renderSortArrow(col.key)}
              </th>
            ))}
            <th>Patterns</th>
            <th>MACD</th>
          </tr>
        </thead>
        <tbody>
          {results.map((stock) => (
            <tr key={stock.ticker} onClick={() => navigate(`/stock/${encodeURIComponent(stock.ticker)}`)}>
              <td><span className="stock-ticker">{stock.ticker}</span></td>
              <td><span className="stock-name">{stock.name}</span></td>
              <td>{formatPrice(stock.price)}</td>
              <td>
                <span className={pctClass(stock.change_pct)}>
                  {formatPct(stock.change_pct)}
                </span>
              </td>
              <td>
                <span className={pctClass(stock.gap_pct)}>
                  {formatPct(stock.gap_pct)}
                </span>
              </td>
              <td>{formatVolume(stock.volume)}</td>
              <td>
                <div className="volume-bar">
                  <span>{stock.relative_volume.toFixed(1)}x</span>
                  <div className="volume-bar-track">
                    <div className="volume-bar-fill" style={{ width: `${Math.min(stock.relative_volume / 5 * 100, 100)}%` }} />
                  </div>
                </div>
              </td>
              <td>{formatCompact(stock.market_cap)}</td>
              <td>
                <span className={stock.distance_from_52w_high >= -5 ? "positive" : stock.distance_from_52w_high <= -20 ? "negative" : "neutral"}>
                  {formatPct(stock.distance_from_52w_high)}
                </span>
              </td>
              <td>
                <span className={stock.distance_from_52w_low >= 50 ? "positive" : stock.distance_from_52w_low <= 10 ? "negative" : "neutral"}>
                  {formatPct(stock.distance_from_52w_low)}
                </span>
              </td>
              <td>
                <span style={{ color: rsiColor(stock.rsi) }}>
                  {stock.rsi != null ? stock.rsi.toFixed(0) : "N/A"}
                </span>
                {stock.rsi != null && (
                  <div className="rsi-bar">
                    <div className="rsi-bar-fill" style={{ width: `${stock.rsi}%`, background: rsiBg(stock.rsi) }} />
                  </div>
                )}
              </td>
              <td>
                {stock.short_float != null ? (
                  <span className={stock.short_float > 20 ? "negative" : "neutral"}>
                    {(stock.short_float * 100).toFixed(1)}%
                  </span>
                ) : (
                  <span className="neutral">N/A</span>
                )}
              </td>
              <td><span className="neutral" style={{ fontSize: 11 }}>{stock.sector || "N/A"}</span></td>
              <td>
                {stock.chart_patterns.length > 0 ? (
                  stock.chart_patterns.map((p) => (
                    <span key={p} className="badge badge-blue" style={{ marginRight: 2 }}>
                      {p.replace(/_/g, " ")}
                    </span>
                  ))
                ) : (
                  <span className="neutral">-</span>
                )}
              </td>
              <td>
                {stock.macd_signal ? (
                  <span className={`badge ${stock.macd_signal === "bullish" ? "badge-green" : "badge-red"}`}>
                    {stock.macd_signal}
                  </span>
                ) : (
                  <span className="neutral">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const p = page <= 5 ? i + 1 : page + i - 4;
            if (p > totalPages || p < 1) return null;
            return (
              <button key={p} className={p === page ? "active" : ""} onClick={() => onPageChange(p)}>
                {p}
              </button>
            );
          })}
          <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
