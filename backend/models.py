"""Pydantic models for the Stock Screener API."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# --- Enums ---

class ChartPattern(str, Enum):
    DOUBLE_TOP = "double_top"
    DOUBLE_BOTTOM = "double_bottom"
    HEAD_AND_SHOULDERS = "head_and_shoulders"
    INVERSE_HEAD_AND_SHOULDERS = "inverse_head_and_shoulders"
    ASCENDING_TRIANGLE = "ascending_triangle"
    DESCENDING_TRIANGLE = "descending_triangle"
    SYMMETRICAL_TRIANGLE = "symmetrical_triangle"
    BULL_FLAG = "bull_flag"
    BEAR_FLAG = "bear_flag"
    CUP_AND_HANDLE = "cup_and_handle"
    WEDGE_UP = "wedge_up"
    WEDGE_DOWN = "wedge_down"


class SortField(str, Enum):
    TICKER = "ticker"
    NAME = "name"
    PRICE = "price"
    CHANGE_PCT = "change_pct"
    MARKET_CAP = "market_cap"
    VOLUME = "volume"
    RSI = "rsi"
    SHORT_FLOAT = "short_float"
    DISTANCE_FROM_52W_HIGH = "distance_from_52w_high"
    DISTANCE_FROM_52W_LOW = "distance_from_52w_low"
    RELATIVE_VOLUME = "relative_volume"
    GAP_PCT = "gap_pct"
    ATR = "atr"
    PE_RATIO = "pe_ratio"
    DIVIDEND_YIELD = "dividend_yield"
    FLOAT_SHARES = "float_shares"
    SECTOR = "sector"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


# --- Request Models ---

class ScreenerFilters(BaseModel):
    # Country / Index
    countries: list[str] = Field(default_factory=list, description="Country codes e.g. ['US','UK']")
    indices: list[str] = Field(default_factory=list, description="Index symbols e.g. ['^GSPC','^NDX']")

    # Market cap
    market_cap_min: Optional[float] = Field(50_000_000, description="Min market cap in USD")
    market_cap_max: Optional[float] = Field(None, description="Max market cap in USD (null=no cap)")

    # 52-week
    new_52w_high: Optional[bool] = None
    new_52w_low: Optional[bool] = None
    pct_from_52w_high_min: Optional[float] = None
    pct_from_52w_high_max: Optional[float] = None
    pct_from_52w_low_min: Optional[float] = None
    pct_from_52w_low_max: Optional[float] = None

    # Today's move
    pct_change_today_min: Optional[float] = None
    pct_change_today_max: Optional[float] = None
    pct_up_today_min: Optional[float] = None
    pct_up_today_max: Optional[float] = None
    pct_down_today_min: Optional[float] = None
    pct_down_today_max: Optional[float] = None

    # Historical single-day moves
    pct_up_single_day_min: Optional[float] = None
    pct_up_single_day_lookback_days: Optional[int] = Field(None, description="Number of past trading days to search")
    pct_up_single_day_lower_quartile: Optional[bool] = Field(None, description="Closed in lower quartile of that day's range")
    pct_down_single_day_min: Optional[float] = None
    pct_down_single_day_lookback_days: Optional[int] = None
    pct_down_single_day_upper_quartile: Optional[bool] = Field(None, description="Closed in upper quartile of that day's range")

    # Volume
    volume_x_avg_30d_min: Optional[float] = Field(None, description="Minimum multiple of 30-day avg volume")

    # Gap
    gap_up_pct_min: Optional[float] = None
    gap_down_pct_min: Optional[float] = None

    # Technical indicators
    rsi_min: Optional[float] = None
    rsi_max: Optional[float] = None
    chart_patterns: list[ChartPattern] = Field(default_factory=list)

    # Short interest
    short_float_min: Optional[float] = None
    short_float_max: Optional[float] = None

    # Fundamentals
    pe_ratio_min: Optional[float] = None
    pe_ratio_max: Optional[float] = None
    dividend_yield_min: Optional[float] = None
    dividend_yield_max: Optional[float] = None

    # Sector / Industry
    sectors: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)

    # Moving average crossovers
    golden_cross: Optional[bool] = None
    death_cross: Optional[bool] = None

    # MACD
    macd_bullish: Optional[bool] = None
    macd_bearish: Optional[bool] = None

    # Bollinger
    bollinger_squeeze: Optional[bool] = None

    # Earnings proximity
    earnings_within_days: Optional[int] = None

    # ATR
    atr_min: Optional[float] = None
    atr_max: Optional[float] = None

    # Relative volume
    relative_volume_min: Optional[float] = None

    # Float
    float_shares_min: Optional[float] = None
    float_shares_max: Optional[float] = None

    # News catalyst
    has_news_catalyst: Optional[bool] = None

    # Sorting & pagination
    sort_by: SortField = SortField.MARKET_CAP
    sort_order: SortOrder = SortOrder.DESC
    page: int = 1
    page_size: int = 50


# --- Response Models ---

class StockResult(BaseModel):
    ticker: str
    name: str
    price: float
    change_pct: float
    volume: int
    avg_volume_30d: int
    relative_volume: float
    market_cap: float
    week_52_high: float
    week_52_low: float
    distance_from_52w_high: float
    distance_from_52w_low: float
    rsi: Optional[float] = None
    short_float: Optional[float] = None
    gap_pct: float = 0.0
    sector: str = ""
    industry: str = ""
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    atr: Optional[float] = None
    float_shares: Optional[float] = None
    macd_signal: Optional[str] = None
    bollinger_position: Optional[str] = None
    chart_patterns: list[str] = Field(default_factory=list)
    has_news_catalyst: bool = False
    earnings_date: Optional[str] = None
    country: str = ""
    exchange: str = ""


class ScreenerResponse(BaseModel):
    results: list[StockResult]
    total_count: int
    page: int
    page_size: int
    total_pages: int
    filters_applied: int


class NewsItem(BaseModel):
    date: str
    title: str
    summary: str
    source: str
    url: str
    sentiment: Optional[str] = None
    is_future: bool = False
    category: str = "news"


class StockDetail(BaseModel):
    ticker: str
    name: str
    price: float
    change_pct: float
    volume: int
    market_cap: float
    week_52_high: float
    week_52_low: float
    sector: str
    industry: str
    description: str
    pe_ratio: Optional[float] = None
    forward_pe: Optional[float] = None
    dividend_yield: Optional[float] = None
    beta: Optional[float] = None
    short_float: Optional[float] = None
    float_shares: Optional[float] = None
    shares_outstanding: Optional[float] = None
    institutional_ownership: Optional[float] = None
    insider_ownership: Optional[float] = None
    rsi: Optional[float] = None
    macd_signal: Optional[str] = None
    atr: Optional[float] = None
    earnings_date: Optional[str] = None
    next_earnings_date: Optional[str] = None
    avg_volume_30d: int = 0
    relative_volume: float = 0.0
    distance_from_52w_high: float = 0.0
    distance_from_52w_low: float = 0.0
    country: str = ""
    exchange: str = ""


class StockDetailResponse(BaseModel):
    detail: StockDetail
    news_timeline: list[NewsItem]
    price_history: list[dict]


class FilterMetadata(BaseModel):
    countries: dict[str, dict[str, str]]
    sectors: list[str]
    industries: list[str]
    chart_patterns: list[dict[str, str]]
    sort_fields: list[dict[str, str]]
