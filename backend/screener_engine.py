"""Screener engine - applies all filters to stock data."""

from __future__ import annotations
import logging
from typing import Any

from models import ScreenerFilters, StockResult, SortField, SortOrder
from data_service import (
    check_single_day_move,
    is_bollinger_squeeze,
    check_golden_cross,
    check_death_cross,
    _safe_float,
)

logger = logging.getLogger(__name__)


def apply_filters(stock: dict[str, Any], filters: ScreenerFilters) -> bool:
    """Return True if stock passes all active filters."""

    # Market cap
    mc = stock.get("market_cap", 0) or 0
    if filters.market_cap_min is not None and mc < filters.market_cap_min:
        return False
    if filters.market_cap_max is not None and mc > filters.market_cap_max:
        return False

    # 52-week high/low
    if filters.new_52w_high is True:
        if stock["price"] < stock["week_52_high"] * 0.99:
            return False
    if filters.new_52w_low is True:
        if stock["price"] > stock["week_52_low"] * 1.01:
            return False

    # Distance from 52w high
    if filters.pct_from_52w_high_min is not None:
        if stock["distance_from_52w_high"] < filters.pct_from_52w_high_min:
            return False
    if filters.pct_from_52w_high_max is not None:
        if stock["distance_from_52w_high"] > filters.pct_from_52w_high_max:
            return False

    # Distance from 52w low
    if filters.pct_from_52w_low_min is not None:
        if stock["distance_from_52w_low"] < filters.pct_from_52w_low_min:
            return False
    if filters.pct_from_52w_low_max is not None:
        if stock["distance_from_52w_low"] > filters.pct_from_52w_low_max:
            return False

    # Today's % move (general range)
    if filters.pct_change_today_min is not None:
        if stock["change_pct"] < filters.pct_change_today_min:
            return False
    if filters.pct_change_today_max is not None:
        if stock["change_pct"] > filters.pct_change_today_max:
            return False

    # % up today
    if filters.pct_up_today_min is not None:
        if stock["change_pct"] < filters.pct_up_today_min:
            return False
    if filters.pct_up_today_max is not None:
        if stock["change_pct"] > filters.pct_up_today_max:
            return False

    # % down today
    if filters.pct_down_today_min is not None:
        if stock["change_pct"] > -filters.pct_down_today_min:
            return False
    if filters.pct_down_today_max is not None:
        if stock["change_pct"] < -filters.pct_down_today_max:
            return False

    # Single-day moves in past
    hist = stock.get("hist")
    if hist is not None:
        if filters.pct_up_single_day_min is not None and filters.pct_up_single_day_lookback_days:
            q_check = filters.pct_up_single_day_lower_quartile or False
            if not check_single_day_move(
                hist, filters.pct_up_single_day_min,
                filters.pct_up_single_day_lookback_days,
                direction="up", quartile_check=q_check
            ):
                return False

        if filters.pct_down_single_day_min is not None and filters.pct_down_single_day_lookback_days:
            q_check = filters.pct_down_single_day_upper_quartile or False
            if not check_single_day_move(
                hist, filters.pct_down_single_day_min,
                filters.pct_down_single_day_lookback_days,
                direction="down", quartile_check=q_check
            ):
                return False

    # Volume multiple of 30-day average
    if filters.volume_x_avg_30d_min is not None:
        if stock["relative_volume"] < filters.volume_x_avg_30d_min:
            return False

    # Gap up
    if filters.gap_up_pct_min is not None:
        if stock["gap_pct"] < filters.gap_up_pct_min:
            return False

    # Gap down
    if filters.gap_down_pct_min is not None:
        if stock["gap_pct"] > -filters.gap_down_pct_min:
            return False

    # RSI
    if filters.rsi_min is not None:
        if stock.get("rsi") is None or stock["rsi"] < filters.rsi_min:
            return False
    if filters.rsi_max is not None:
        if stock.get("rsi") is None or stock["rsi"] > filters.rsi_max:
            return False

    # Short float
    if filters.short_float_min is not None:
        sf = stock.get("short_float")
        if sf is None or sf < filters.short_float_min:
            return False
    if filters.short_float_max is not None:
        sf = stock.get("short_float")
        if sf is None or sf > filters.short_float_max:
            return False

    # Chart patterns
    if filters.chart_patterns:
        stock_patterns = set(stock.get("chart_patterns", []))
        required = set(p.value for p in filters.chart_patterns)
        if not required.intersection(stock_patterns):
            return False

    # P/E
    if filters.pe_ratio_min is not None:
        pe = stock.get("pe_ratio")
        if pe is None or pe < filters.pe_ratio_min:
            return False
    if filters.pe_ratio_max is not None:
        pe = stock.get("pe_ratio")
        if pe is None or pe > filters.pe_ratio_max:
            return False

    # Dividend yield
    if filters.dividend_yield_min is not None:
        dy = stock.get("dividend_yield")
        if dy is None or dy < filters.dividend_yield_min:
            return False
    if filters.dividend_yield_max is not None:
        dy = stock.get("dividend_yield")
        if dy is None or dy > filters.dividend_yield_max:
            return False

    # Sector
    if filters.sectors:
        if stock.get("sector", "") not in filters.sectors:
            return False

    # Industry
    if filters.industries:
        if stock.get("industry", "") not in filters.industries:
            return False

    # Moving average crossovers
    if hist is not None:
        if filters.golden_cross is True:
            if not check_golden_cross(hist):
                return False
        if filters.death_cross is True:
            if not check_death_cross(hist):
                return False

    # MACD
    if filters.macd_bullish is True:
        if stock.get("macd_signal") != "bullish":
            return False
    if filters.macd_bearish is True:
        if stock.get("macd_signal") != "bearish":
            return False

    # Bollinger squeeze
    if filters.bollinger_squeeze is True:
        if stock.get("bollinger_position") != "squeeze":
            return False

    # ATR
    if filters.atr_min is not None:
        atr = stock.get("atr")
        if atr is None or atr < filters.atr_min:
            return False
    if filters.atr_max is not None:
        atr = stock.get("atr")
        if atr is None or atr > filters.atr_max:
            return False

    # Relative volume
    if filters.relative_volume_min is not None:
        if stock["relative_volume"] < filters.relative_volume_min:
            return False

    # Float shares
    if filters.float_shares_min is not None:
        fs = stock.get("float_shares")
        if fs is None or fs < filters.float_shares_min:
            return False
    if filters.float_shares_max is not None:
        fs = stock.get("float_shares")
        if fs is None or fs > filters.float_shares_max:
            return False

    # News catalyst
    if filters.has_news_catalyst is True:
        if not stock.get("has_news_catalyst", False):
            return False

    return True


def sort_stocks(stocks: list[dict], sort_by: SortField, sort_order: SortOrder) -> list[dict]:
    """Sort the stock list by the specified field."""
    key_map = {
        SortField.TICKER: "ticker",
        SortField.NAME: "name",
        SortField.PRICE: "price",
        SortField.CHANGE_PCT: "change_pct",
        SortField.MARKET_CAP: "market_cap",
        SortField.VOLUME: "volume",
        SortField.RSI: "rsi",
        SortField.SHORT_FLOAT: "short_float",
        SortField.DISTANCE_FROM_52W_HIGH: "distance_from_52w_high",
        SortField.DISTANCE_FROM_52W_LOW: "distance_from_52w_low",
        SortField.RELATIVE_VOLUME: "relative_volume",
        SortField.GAP_PCT: "gap_pct",
        SortField.ATR: "atr",
        SortField.PE_RATIO: "pe_ratio",
        SortField.DIVIDEND_YIELD: "dividend_yield",
        SortField.FLOAT_SHARES: "float_shares",
        SortField.SECTOR: "sector",
    }
    key = key_map.get(sort_by, "market_cap")
    reverse = sort_order == SortOrder.DESC

    def sort_key(s):
        val = s.get(key)
        if val is None:
            return float("-inf") if reverse else float("inf")
        if isinstance(val, str):
            return val.lower()
        return val

    return sorted(stocks, key=sort_key, reverse=reverse)


def to_stock_result(stock: dict) -> StockResult:
    """Convert internal stock dict to API response model."""
    return StockResult(
        ticker=stock["ticker"],
        name=stock["name"],
        price=stock["price"],
        change_pct=stock["change_pct"],
        volume=stock["volume"],
        avg_volume_30d=stock["avg_volume_30d"],
        relative_volume=stock["relative_volume"],
        market_cap=stock.get("market_cap", 0) or 0,
        week_52_high=stock["week_52_high"],
        week_52_low=stock["week_52_low"],
        distance_from_52w_high=stock["distance_from_52w_high"],
        distance_from_52w_low=stock["distance_from_52w_low"],
        rsi=stock.get("rsi"),
        short_float=stock.get("short_float"),
        gap_pct=stock.get("gap_pct", 0),
        sector=stock.get("sector", ""),
        industry=stock.get("industry", ""),
        pe_ratio=stock.get("pe_ratio"),
        dividend_yield=stock.get("dividend_yield"),
        atr=stock.get("atr"),
        float_shares=stock.get("float_shares"),
        macd_signal=stock.get("macd_signal"),
        bollinger_position=stock.get("bollinger_position"),
        chart_patterns=stock.get("chart_patterns", []),
        has_news_catalyst=stock.get("has_news_catalyst", False),
        earnings_date=stock.get("earnings_date"),
        country=stock.get("country", ""),
        exchange=stock.get("exchange", ""),
    )


def count_active_filters(filters: ScreenerFilters) -> int:
    """Count how many filters are actively set."""
    count = 0
    if filters.countries:
        count += 1
    if filters.indices:
        count += 1
    if filters.market_cap_min != 50_000_000 or filters.market_cap_max is not None:
        count += 1
    if filters.new_52w_high is not None:
        count += 1
    if filters.new_52w_low is not None:
        count += 1
    if filters.pct_from_52w_high_min is not None or filters.pct_from_52w_high_max is not None:
        count += 1
    if filters.pct_from_52w_low_min is not None or filters.pct_from_52w_low_max is not None:
        count += 1
    if filters.pct_change_today_min is not None or filters.pct_change_today_max is not None:
        count += 1
    if filters.pct_up_today_min is not None:
        count += 1
    if filters.pct_down_today_min is not None:
        count += 1
    if filters.pct_up_single_day_min is not None:
        count += 1
    if filters.pct_down_single_day_min is not None:
        count += 1
    if filters.volume_x_avg_30d_min is not None:
        count += 1
    if filters.gap_up_pct_min is not None:
        count += 1
    if filters.gap_down_pct_min is not None:
        count += 1
    if filters.rsi_min is not None or filters.rsi_max is not None:
        count += 1
    if filters.chart_patterns:
        count += 1
    if filters.short_float_min is not None or filters.short_float_max is not None:
        count += 1
    if filters.pe_ratio_min is not None or filters.pe_ratio_max is not None:
        count += 1
    if filters.dividend_yield_min is not None or filters.dividend_yield_max is not None:
        count += 1
    if filters.sectors:
        count += 1
    if filters.industries:
        count += 1
    if filters.golden_cross is not None:
        count += 1
    if filters.death_cross is not None:
        count += 1
    if filters.macd_bullish is not None or filters.macd_bearish is not None:
        count += 1
    if filters.bollinger_squeeze is not None:
        count += 1
    if filters.atr_min is not None or filters.atr_max is not None:
        count += 1
    if filters.relative_volume_min is not None:
        count += 1
    if filters.float_shares_min is not None or filters.float_shares_max is not None:
        count += 1
    if filters.has_news_catalyst is not None:
        count += 1
    return count
