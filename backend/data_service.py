"""Stock data fetching and caching service using yfinance.

Technical indicators implemented with pure numpy/pandas (no external TA lib).
"""

from __future__ import annotations
import logging
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf
from cachetools import TTLCache

from config import CACHE_TTL_SECONDS

logger = logging.getLogger(__name__)

# Caches
_info_cache: TTLCache = TTLCache(maxsize=2000, ttl=CACHE_TTL_SECONDS)
_hist_cache: TTLCache = TTLCache(maxsize=2000, ttl=CACHE_TTL_SECONDS)
_batch_cache: TTLCache = TTLCache(maxsize=100, ttl=60)


def _safe_float(val: Any, default: float = 0.0) -> float:
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _safe_int(val: Any, default: int = 0) -> int:
    try:
        return int(_safe_float(val, float(default)))
    except (ValueError, TypeError):
        return default


# ─── Data Fetching ────────────────────────────────────────────────

def fetch_stock_info(ticker: str) -> dict[str, Any]:
    if ticker in _info_cache:
        return _info_cache[ticker]
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}
        _info_cache[ticker] = info
        return info
    except Exception as e:
        logger.warning(f"Failed to fetch info for {ticker}: {e}")
        return {}


def fetch_history(ticker: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
    cache_key = f"{ticker}_{period}_{interval}"
    if cache_key in _hist_cache:
        return _hist_cache[cache_key]
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period=period, interval=interval)
        if hist is not None and not hist.empty:
            _hist_cache[cache_key] = hist
            return hist
    except Exception as e:
        logger.warning(f"Failed to fetch history for {ticker}: {e}")
    return pd.DataFrame()


def batch_download(tickers: list[str], period: str = "1y", interval: str = "1d") -> dict[str, pd.DataFrame]:
    cache_key = f"batch_{'_'.join(sorted(tickers[:10]))}_{len(tickers)}_{period}"
    if cache_key in _batch_cache:
        return _batch_cache[cache_key]

    result = {}
    chunk_size = 50
    for i in range(0, len(tickers), chunk_size):
        chunk = tickers[i:i + chunk_size]
        try:
            data = yf.download(chunk, period=period, interval=interval, group_by="ticker", threads=True)
            if data is not None and not data.empty:
                if len(chunk) == 1:
                    result[chunk[0]] = data
                else:
                    for t in chunk:
                        try:
                            if t in data.columns.get_level_values(0):
                                df = data[t].dropna(how="all")
                                if not df.empty:
                                    result[t] = df
                        except (KeyError, Exception):
                            pass
        except Exception as e:
            logger.warning(f"Batch download failed for chunk: {e}")

    _batch_cache[cache_key] = result
    return result


# ─── Pure numpy/pandas Technical Indicators ───────────────────────

def _sma(series: pd.Series, window: int) -> pd.Series:
    return series.rolling(window=window, min_periods=window).mean()


def _ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()


def compute_rsi(df: pd.DataFrame, window: int = 14) -> float | None:
    if df.empty or len(df) < window + 1:
        return None
    try:
        close = df["Close"].dropna()
        if len(close) < window + 1:
            return None
        delta = close.diff()
        gain = delta.clip(lower=0)
        loss = (-delta.clip(upper=0))
        avg_gain = gain.ewm(alpha=1 / window, min_periods=window).mean()
        avg_loss = loss.ewm(alpha=1 / window, min_periods=window).mean()
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        val = rsi.iloc[-1]
        return round(float(val), 2) if not np.isnan(val) else None
    except Exception:
        return None


def compute_macd_signal(df: pd.DataFrame) -> str | None:
    if df.empty or len(df) < 35:
        return None
    try:
        close = df["Close"].dropna()
        ema12 = _ema(close, 12)
        ema26 = _ema(close, 26)
        macd_line = ema12 - ema26
        signal_line = _ema(macd_line, 9)
        if len(macd_line) < 2 or len(signal_line) < 2:
            return None
        if macd_line.iloc[-1] > signal_line.iloc[-1] and macd_line.iloc[-2] <= signal_line.iloc[-2]:
            return "bullish"
        if macd_line.iloc[-1] < signal_line.iloc[-1] and macd_line.iloc[-2] >= signal_line.iloc[-2]:
            return "bearish"
        if macd_line.iloc[-1] > signal_line.iloc[-1]:
            return "bullish"
        return "bearish"
    except Exception:
        return None


def compute_bollinger_position(df: pd.DataFrame, window: int = 20, num_std: float = 2.0) -> str | None:
    if df.empty or len(df) < window:
        return None
    try:
        close = df["Close"].dropna()
        mid = _sma(close, window)
        std = close.rolling(window=window, min_periods=window).std()
        upper = mid + num_std * std
        lower = mid - num_std * std
        band_width = (upper - lower).iloc[-1]
        price = close.iloc[-1]
        if band_width == 0 or np.isnan(band_width):
            return None
        avg_bw = (upper - lower).rolling(20).mean().iloc[-1]
        if not np.isnan(avg_bw) and avg_bw > 0 and band_width < avg_bw * 0.5:
            return "squeeze"
        if price >= upper.iloc[-1]:
            return "above_upper"
        if price <= lower.iloc[-1]:
            return "below_lower"
        if price > mid.iloc[-1]:
            return "upper_half"
        return "lower_half"
    except Exception:
        return None


def is_bollinger_squeeze(df: pd.DataFrame) -> bool:
    return compute_bollinger_position(df) == "squeeze"


def compute_atr(df: pd.DataFrame, window: int = 14) -> float | None:
    if df.empty or len(df) < window + 1:
        return None
    try:
        high = df["High"]
        low = df["Low"]
        close = df["Close"]
        tr1 = high - low
        tr2 = (high - close.shift()).abs()
        tr3 = (low - close.shift()).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(window=window, min_periods=window).mean()
        val = atr.iloc[-1]
        return round(float(val), 2) if not np.isnan(val) else None
    except Exception:
        return None


def check_golden_cross(df: pd.DataFrame) -> bool:
    if df.empty or len(df) < 205:
        return False
    try:
        close = df["Close"].dropna()
        sma50 = _sma(close, 50)
        sma200 = _sma(close, 200)
        for i in range(-5, 0):
            if sma50.iloc[i] > sma200.iloc[i] and sma50.iloc[i - 1] <= sma200.iloc[i - 1]:
                return True
        return False
    except Exception:
        return False


def check_death_cross(df: pd.DataFrame) -> bool:
    if df.empty or len(df) < 205:
        return False
    try:
        close = df["Close"].dropna()
        sma50 = _sma(close, 50)
        sma200 = _sma(close, 200)
        for i in range(-5, 0):
            if sma50.iloc[i] < sma200.iloc[i] and sma50.iloc[i - 1] >= sma200.iloc[i - 1]:
                return True
        return False
    except Exception:
        return False


# ─── Chart Pattern Detection ─────────────────────────────────────

def detect_chart_patterns(df: pd.DataFrame) -> list[str]:
    patterns = []
    if df.empty or len(df) < 60:
        return patterns

    try:
        close = df["Close"].values
        high = df["High"].values
        low = df["Low"].values
        n = len(close)

        c = close[-60:]
        h = high[-60:]
        lo = low[-60:]

        peaks, troughs = [], []
        for i in range(2, len(c) - 2):
            if h[i] > h[i - 1] and h[i] > h[i - 2] and h[i] > h[i + 1] and h[i] > h[i + 2]:
                peaks.append((i, h[i]))
            if lo[i] < lo[i - 1] and lo[i] < lo[i - 2] and lo[i] < lo[i + 1] and lo[i] < lo[i + 2]:
                troughs.append((i, lo[i]))

        if len(peaks) >= 2:
            p1, p2 = peaks[-2], peaks[-1]
            if abs(p1[1] - p2[1]) / p1[1] < 0.02 and p2[0] - p1[0] > 5:
                patterns.append("double_top")

        if len(troughs) >= 2:
            t1, t2 = troughs[-2], troughs[-1]
            if abs(t1[1] - t2[1]) / t1[1] < 0.02 and t2[0] - t1[0] > 5:
                patterns.append("double_bottom")

        if len(peaks) >= 3:
            p1, p2, p3 = peaks[-3], peaks[-2], peaks[-1]
            if p2[1] > p1[1] and p2[1] > p3[1] and abs(p1[1] - p3[1]) / p1[1] < 0.03:
                patterns.append("head_and_shoulders")

        if len(troughs) >= 3:
            t1, t2, t3 = troughs[-3], troughs[-2], troughs[-1]
            if t2[1] < t1[1] and t2[1] < t3[1] and abs(t1[1] - t3[1]) / t1[1] < 0.03:
                patterns.append("inverse_head_and_shoulders")

        if len(peaks) >= 2 and len(troughs) >= 2:
            if abs(peaks[-1][1] - peaks[-2][1]) / peaks[-1][1] < 0.015:
                if troughs[-1][1] > troughs[-2][1]:
                    patterns.append("ascending_triangle")
            if abs(troughs[-1][1] - troughs[-2][1]) / troughs[-1][1] < 0.015:
                if peaks[-1][1] < peaks[-2][1]:
                    patterns.append("descending_triangle")

        if n > 30:
            pre_flag = c[:20]
            flag_zone = c[20:]
            if pre_flag[-1] > pre_flag[0] * 1.10:
                flag_range = (max(flag_zone) - min(flag_zone)) / min(flag_zone)
                if flag_range < 0.05:
                    patterns.append("bull_flag")
            if pre_flag[-1] < pre_flag[0] * 0.90:
                flag_range = (max(flag_zone) - min(flag_zone)) / max(flag_zone)
                if flag_range < 0.05:
                    patterns.append("bear_flag")

    except Exception as e:
        logger.debug(f"Pattern detection error: {e}")

    return patterns


# ─── Metric Computation ──────────────────────────────────────────

def compute_stock_metrics(ticker: str, info: dict, hist: pd.DataFrame) -> dict[str, Any] | None:
    if hist.empty or len(hist) < 2:
        return None

    try:
        current_price = _safe_float(hist["Close"].iloc[-1])
        if current_price == 0:
            return None

        prev_close = _safe_float(hist["Close"].iloc[-2])
        today_open = _safe_float(hist["Open"].iloc[-1])
        today_volume = _safe_int(hist["Volume"].iloc[-1])

        change_pct = ((current_price - prev_close) / prev_close * 100) if prev_close > 0 else 0
        gap_pct = ((today_open - prev_close) / prev_close * 100) if prev_close > 0 else 0

        year_data = hist.tail(252) if len(hist) >= 252 else hist
        week_52_high = _safe_float(year_data["High"].max())
        week_52_low = _safe_float(year_data["Low"].min())

        dist_from_high = ((current_price - week_52_high) / week_52_high * 100) if week_52_high > 0 else 0
        dist_from_low = ((current_price - week_52_low) / week_52_low * 100) if week_52_low > 0 else 0

        vol_30 = hist["Volume"].tail(30)
        avg_vol_30d = _safe_int(vol_30.mean()) if len(vol_30) > 0 else 0
        relative_volume = (today_volume / avg_vol_30d) if avg_vol_30d > 0 else 0

        market_cap = _safe_float(info.get("marketCap"))

        rsi = compute_rsi(hist)
        macd_signal = compute_macd_signal(hist)
        bollinger = compute_bollinger_position(hist)
        atr = compute_atr(hist)
        chart_pats = detect_chart_patterns(hist)

        return {
            "ticker": ticker,
            "name": info.get("shortName") or info.get("longName") or ticker,
            "price": round(current_price, 2),
            "change_pct": round(change_pct, 2),
            "volume": today_volume,
            "avg_volume_30d": avg_vol_30d,
            "relative_volume": round(relative_volume, 2),
            "market_cap": market_cap,
            "week_52_high": round(week_52_high, 2),
            "week_52_low": round(week_52_low, 2),
            "distance_from_52w_high": round(dist_from_high, 2),
            "distance_from_52w_low": round(dist_from_low, 2),
            "rsi": rsi,
            "short_float": _safe_float(info.get("shortPercentOfFloat"), None) if info.get("shortPercentOfFloat") is not None else None,
            "gap_pct": round(gap_pct, 2),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "pe_ratio": _safe_float(info.get("trailingPE"), None) if info.get("trailingPE") is not None else None,
            "dividend_yield": _safe_float(info.get("dividendYield"), None) if info.get("dividendYield") is not None else None,
            "atr": atr,
            "float_shares": _safe_float(info.get("floatShares"), None) if info.get("floatShares") is not None else None,
            "macd_signal": macd_signal,
            "bollinger_position": bollinger,
            "chart_patterns": chart_pats,
            "has_news_catalyst": False,
            "earnings_date": None,
            "country": info.get("country", ""),
            "exchange": info.get("exchange", ""),
            "today_open": today_open,
            "prev_close": prev_close,
            "hist": hist,
        }
    except Exception as e:
        logger.warning(f"Error computing metrics for {ticker}: {e}")
        return None


def check_single_day_move(hist: pd.DataFrame, pct_min: float, lookback_days: int,
                          direction: str = "up", quartile_check: bool = False) -> bool:
    if hist.empty or len(hist) < 2:
        return False

    lookback = min(lookback_days, len(hist) - 1)
    recent = hist.tail(lookback + 1)

    for i in range(1, len(recent)):
        prev = _safe_float(recent["Close"].iloc[i - 1])
        if prev == 0:
            continue

        curr_close = _safe_float(recent["Close"].iloc[i])
        day_pct = (curr_close - prev) / prev * 100

        if direction == "up" and day_pct >= pct_min:
            if quartile_check:
                day_high = _safe_float(recent["High"].iloc[i])
                day_low = _safe_float(recent["Low"].iloc[i])
                day_range = day_high - day_low
                if day_range > 0:
                    position = (curr_close - day_low) / day_range
                    if position <= 0.25:
                        return True
            else:
                return True

        if direction == "down" and day_pct <= -pct_min:
            if quartile_check:
                day_high = _safe_float(recent["High"].iloc[i])
                day_low = _safe_float(recent["Low"].iloc[i])
                day_range = day_high - day_low
                if day_range > 0:
                    position = (curr_close - day_low) / day_range
                    if position >= 0.75:
                        return True
            else:
                return True

    return False
