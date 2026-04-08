import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { ScreenerFilters, ScreenerResponse, DEFAULT_FILTERS } from "../types";
import { runScreener } from "../services/api";
import FilterPanel from "../components/FilterPanel";
import ResultsTable from "../components/ResultsTable";

export default function ScreenerPage() {
  const [filters, setFilters] = useState<ScreenerFilters>({ ...DEFAULT_FILTERS });
  const [response, setResponse] = useState<ScreenerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = useCallback(async (f: ScreenerFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await runScreener(f);
      setResponse(data);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch results");
    } finally {
      setLoading(false);
    }
  }, []);

  // Run initial search on mount
  useEffect(() => {
    doSearch(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => doSearch(filters);

  const handleReset = () => {
    const fresh = { ...DEFAULT_FILTERS };
    setFilters(fresh);
    doSearch(fresh);
  };

  const handleSort = (field: string) => {
    const newOrder =
      filters.sort_by === field && filters.sort_order === "desc" ? "asc" : "desc";
    const updated = { ...filters, sort_by: field, sort_order: newOrder, page: 1 };
    setFilters(updated);
    doSearch(updated);
  };

  const handlePageChange = (page: number) => {
    const updated = { ...filters, page };
    setFilters(updated);
    doSearch(updated);
  };

  return (
    <>
      <header className="app-header">
        <Link to="/" style={{ textDecoration: "none" }}>
          <h1>
            <span className="logo-icon">&#9670;</span>
            Stock Screener
          </h1>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {response && (
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {response.filters_applied} filter{response.filters_applied !== 1 ? "s" : ""} active
            </span>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="screener-layout">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            onApply={handleApply}
            onReset={handleReset}
            loading={loading}
          />

          <div className="results-panel">
            {error && (
              <div style={{ padding: 20, color: "var(--red)", textAlign: "center" }}>
                {error}
              </div>
            )}
            <ResultsTable
              results={response?.results || []}
              totalCount={response?.total_count || 0}
              page={response?.page || 1}
              totalPages={response?.total_pages || 1}
              filters={filters}
              onSort={handleSort}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </>
  );
}
