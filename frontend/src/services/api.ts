import axios from "axios";
import {
  ScreenerFilters,
  ScreenerResponse,
  StockDetailResponse,
  FilterMetadata,
} from "../types";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export async function runScreener(
  filters: ScreenerFilters
): Promise<ScreenerResponse> {
  const { data } = await api.post<ScreenerResponse>("/api/screener", filters);
  return data;
}

export async function getStockDetail(
  ticker: string
): Promise<StockDetailResponse> {
  const { data } = await api.get<StockDetailResponse>(
    `/api/stock/${encodeURIComponent(ticker)}`
  );
  return data;
}

export async function getFilterMetadata(): Promise<FilterMetadata> {
  const { data } = await api.get<FilterMetadata>("/api/filters/metadata");
  return data;
}
