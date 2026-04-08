export interface StockResult {
  ticker: string;
  name: string;
  price: number;
  change_pct: number;
  volume: number;
  avg_volume_30d: number;
  relative_volume: number;
  market_cap: number;
  week_52_high: number;
  week_52_low: number;
  distance_from_52w_high: number;
  distance_from_52w_low: number;
  rsi: number | null;
  short_float: number | null;
  gap_pct: number;
  sector: string;
  industry: string;
  pe_ratio: number | null;
  dividend_yield: number | null;
  atr: number | null;
  float_shares: number | null;
  macd_signal: string | null;
  bollinger_position: string | null;
  chart_patterns: string[];
  has_news_catalyst: boolean;
  earnings_date: string | null;
  country: string;
  exchange: string;
}

export interface ScreenerResponse {
  results: StockResult[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  filters_applied: number;
}

export interface ScreenerFilters {
  countries: string[];
  indices: string[];
  market_cap_min: number | null;
  market_cap_max: number | null;
  new_52w_high: boolean | null;
  new_52w_low: boolean | null;
  pct_from_52w_high_min: number | null;
  pct_from_52w_high_max: number | null;
  pct_from_52w_low_min: number | null;
  pct_from_52w_low_max: number | null;
  pct_change_today_min: number | null;
  pct_change_today_max: number | null;
  pct_up_today_min: number | null;
  pct_up_today_max: number | null;
  pct_down_today_min: number | null;
  pct_down_today_max: number | null;
  pct_up_single_day_min: number | null;
  pct_up_single_day_lookback_days: number | null;
  pct_up_single_day_lower_quartile: boolean | null;
  pct_down_single_day_min: number | null;
  pct_down_single_day_lookback_days: number | null;
  pct_down_single_day_upper_quartile: boolean | null;
  volume_x_avg_30d_min: number | null;
  gap_up_pct_min: number | null;
  gap_down_pct_min: number | null;
  rsi_min: number | null;
  rsi_max: number | null;
  chart_patterns: string[];
  short_float_min: number | null;
  short_float_max: number | null;
  pe_ratio_min: number | null;
  pe_ratio_max: number | null;
  dividend_yield_min: number | null;
  dividend_yield_max: number | null;
  sectors: string[];
  industries: string[];
  golden_cross: boolean | null;
  death_cross: boolean | null;
  macd_bullish: boolean | null;
  macd_bearish: boolean | null;
  bollinger_squeeze: boolean | null;
  earnings_within_days: number | null;
  atr_min: number | null;
  atr_max: number | null;
  relative_volume_min: number | null;
  float_shares_min: number | null;
  float_shares_max: number | null;
  has_news_catalyst: boolean | null;
  sort_by: string;
  sort_order: string;
  page: number;
  page_size: number;
}

export interface NewsItem {
  date: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  sentiment: string | null;
  is_future: boolean;
  category: string;
}

export interface StockDetail {
  ticker: string;
  name: string;
  price: number;
  change_pct: number;
  volume: number;
  market_cap: number;
  week_52_high: number;
  week_52_low: number;
  sector: string;
  industry: string;
  description: string;
  pe_ratio: number | null;
  forward_pe: number | null;
  dividend_yield: number | null;
  beta: number | null;
  short_float: number | null;
  float_shares: number | null;
  shares_outstanding: number | null;
  institutional_ownership: number | null;
  insider_ownership: number | null;
  rsi: number | null;
  macd_signal: string | null;
  atr: number | null;
  earnings_date: string | null;
  next_earnings_date: string | null;
  avg_volume_30d: number;
  relative_volume: number;
  distance_from_52w_high: number;
  distance_from_52w_low: number;
  country: string;
  exchange: string;
}

export interface PriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockDetailResponse {
  detail: StockDetail;
  news_timeline: NewsItem[];
  price_history: PriceBar[];
}

export interface FilterMetadata {
  countries: Record<string, Record<string, string>>;
  sectors: string[];
  industries: string[];
  chart_patterns: { value: string; label: string }[];
  sort_fields: { value: string; label: string }[];
}

export const DEFAULT_FILTERS: ScreenerFilters = {
  countries: ["US"],
  indices: [],
  market_cap_min: 50000000,
  market_cap_max: null,
  new_52w_high: null,
  new_52w_low: null,
  pct_from_52w_high_min: null,
  pct_from_52w_high_max: null,
  pct_from_52w_low_min: null,
  pct_from_52w_low_max: null,
  pct_change_today_min: null,
  pct_change_today_max: null,
  pct_up_today_min: null,
  pct_up_today_max: null,
  pct_down_today_min: null,
  pct_down_today_max: null,
  pct_up_single_day_min: null,
  pct_up_single_day_lookback_days: null,
  pct_up_single_day_lower_quartile: null,
  pct_down_single_day_min: null,
  pct_down_single_day_lookback_days: null,
  pct_down_single_day_upper_quartile: null,
  volume_x_avg_30d_min: null,
  gap_up_pct_min: null,
  gap_down_pct_min: null,
  rsi_min: null,
  rsi_max: null,
  chart_patterns: [],
  short_float_min: null,
  short_float_max: null,
  pe_ratio_min: null,
  pe_ratio_max: null,
  dividend_yield_min: null,
  dividend_yield_max: null,
  sectors: [],
  industries: [],
  golden_cross: null,
  death_cross: null,
  macd_bullish: null,
  macd_bearish: null,
  bollinger_squeeze: null,
  earnings_within_days: null,
  atr_min: null,
  atr_max: null,
  relative_volume_min: null,
  float_shares_min: null,
  float_shares_max: null,
  has_news_catalyst: null,
  sort_by: "market_cap",
  sort_order: "desc",
  page: 1,
  page_size: 50,
};
