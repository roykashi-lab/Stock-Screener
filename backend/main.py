"""FastAPI backend for the Stock Screener."""

from __future__ import annotations
import logging
import math
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

from models import (
    ScreenerFilters, ScreenerResponse, StockDetailResponse, StockDetail,
    FilterMetadata, NewsItem,
)
from data_service import (
    fetch_stock_info, fetch_history, batch_download,
    compute_stock_metrics, compute_rsi, compute_macd_signal,
    compute_bollinger_position, compute_atr, _safe_float,
)
from screener_engine import apply_filters, sort_stocks, to_stock_result, count_active_filters
from stock_universe import get_tickers, COUNTRY_TICKERS
from config import INDICES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stock Screener API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/screener", response_model=ScreenerResponse)
async def run_screener(filters: ScreenerFilters):
    """Run the stock screener with the given filters."""
    countries = filters.countries if filters.countries else ["US"]
    tickers = get_tickers(countries)

    logger.info(f"Screening {len(tickers)} tickers with {count_active_filters(filters)} active filters")

    # Fetch data in parallel using batch download
    all_hist = batch_download(tickers, period="1y", interval="1d")

    # Fetch info and compute metrics in parallel
    results = []

    def process_ticker(ticker: str):
        hist = all_hist.get(ticker)
        if hist is None or hist.empty:
            return None
        info = fetch_stock_info(ticker)
        return compute_stock_metrics(ticker, info, hist)

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(process_ticker, t): t for t in tickers}
        for future in as_completed(futures):
            try:
                stock = future.result()
                if stock is not None and apply_filters(stock, filters):
                    results.append(stock)
            except Exception as e:
                logger.debug(f"Error processing {futures[future]}: {e}")

    # Sort
    results = sort_stocks(results, filters.sort_by, filters.sort_order)
    total_count = len(results)
    total_pages = max(1, math.ceil(total_count / filters.page_size))

    # Paginate
    start = (filters.page - 1) * filters.page_size
    end = start + filters.page_size
    page_results = results[start:end]

    return ScreenerResponse(
        results=[to_stock_result(s) for s in page_results],
        total_count=total_count,
        page=filters.page,
        page_size=filters.page_size,
        total_pages=total_pages,
        filters_applied=count_active_filters(filters),
    )


@app.get("/api/stock/{ticker}", response_model=StockDetailResponse)
async def get_stock_detail(ticker: str):
    """Get detailed stock information and news timeline."""
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}
        hist = t.history(period="1y", interval="1d")

        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {ticker}")

        current_price = _safe_float(hist["Close"].iloc[-1])
        prev_close = _safe_float(hist["Close"].iloc[-2]) if len(hist) >= 2 else current_price

        change_pct = ((current_price - prev_close) / prev_close * 100) if prev_close > 0 else 0

        year_data = hist.tail(252)
        week_52_high = _safe_float(year_data["High"].max())
        week_52_low = _safe_float(year_data["Low"].min())

        vol_30 = hist["Volume"].tail(30)
        avg_vol_30d = int(vol_30.mean()) if len(vol_30) > 0 else 0
        today_vol = int(hist["Volume"].iloc[-1])
        rel_vol = (today_vol / avg_vol_30d) if avg_vol_30d > 0 else 0

        dist_high = ((current_price - week_52_high) / week_52_high * 100) if week_52_high > 0 else 0
        dist_low = ((current_price - week_52_low) / week_52_low * 100) if week_52_low > 0 else 0

        detail = StockDetail(
            ticker=ticker,
            name=info.get("shortName") or info.get("longName") or ticker,
            price=round(current_price, 2),
            change_pct=round(change_pct, 2),
            volume=today_vol,
            market_cap=_safe_float(info.get("marketCap")),
            week_52_high=round(week_52_high, 2),
            week_52_low=round(week_52_low, 2),
            sector=info.get("sector", ""),
            industry=info.get("industry", ""),
            description=info.get("longBusinessSummary", ""),
            pe_ratio=_safe_float(info.get("trailingPE"), None) if info.get("trailingPE") else None,
            forward_pe=_safe_float(info.get("forwardPE"), None) if info.get("forwardPE") else None,
            dividend_yield=_safe_float(info.get("dividendYield"), None) if info.get("dividendYield") else None,
            beta=_safe_float(info.get("beta"), None) if info.get("beta") else None,
            short_float=_safe_float(info.get("shortPercentOfFloat"), None) if info.get("shortPercentOfFloat") else None,
            float_shares=_safe_float(info.get("floatShares"), None) if info.get("floatShares") else None,
            shares_outstanding=_safe_float(info.get("sharesOutstanding"), None) if info.get("sharesOutstanding") else None,
            institutional_ownership=_safe_float(info.get("heldPercentInstitutions"), None) if info.get("heldPercentInstitutions") else None,
            insider_ownership=_safe_float(info.get("heldPercentInsiders"), None) if info.get("heldPercentInsiders") else None,
            rsi=compute_rsi(hist),
            macd_signal=compute_macd_signal(hist),
            atr=compute_atr(hist),
            avg_volume_30d=avg_vol_30d,
            relative_volume=round(rel_vol, 2),
            distance_from_52w_high=round(dist_high, 2),
            distance_from_52w_low=round(dist_low, 2),
            country=info.get("country", ""),
            exchange=info.get("exchange", ""),
        )

        # Earnings dates
        try:
            cal = t.calendar
            if cal is not None and not cal.empty:
                if hasattr(cal, 'iloc'):
                    detail.next_earnings_date = str(cal.iloc[0, 0]) if cal.shape[1] > 0 else None
        except Exception:
            pass

        # News
        news_timeline = []
        try:
            news = t.news or []
            for item in news[:20]:
                pub_date = datetime.fromtimestamp(item.get("providerPublishTime", 0))
                news_timeline.append(NewsItem(
                    date=pub_date.strftime("%Y-%m-%d"),
                    title=item.get("title", ""),
                    summary=item.get("title", ""),  # yfinance news has limited summary
                    source=item.get("publisher", ""),
                    url=item.get("link", ""),
                    sentiment=None,
                    is_future=False,
                    category="news",
                ))
        except Exception:
            pass

        # Generate future catalyst placeholders (earnings, ex-dividend dates)
        try:
            if detail.next_earnings_date:
                news_timeline.append(NewsItem(
                    date=detail.next_earnings_date,
                    title=f"{ticker} Earnings Report",
                    summary=f"Upcoming quarterly earnings report for {detail.name}",
                    source="Earnings Calendar",
                    url="",
                    sentiment=None,
                    is_future=True,
                    category="earnings",
                ))
        except Exception:
            pass

        # Price history for chart
        price_history = []
        for idx, row in hist.iterrows():
            price_history.append({
                "date": idx.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })

        return StockDetailResponse(
            detail=detail,
            news_timeline=sorted(news_timeline, key=lambda x: x.date),
            price_history=price_history,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching detail for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/filters/metadata", response_model=FilterMetadata)
async def get_filter_metadata():
    """Get available filter options."""
    return FilterMetadata(
        countries=INDICES,
        sectors=[
            "Technology", "Healthcare", "Financial Services", "Consumer Cyclical",
            "Communication Services", "Industrials", "Consumer Defensive",
            "Energy", "Basic Materials", "Real Estate", "Utilities",
        ],
        industries=[],  # Would be populated dynamically
        chart_patterns=[
            {"value": "double_top", "label": "Double Top"},
            {"value": "double_bottom", "label": "Double Bottom"},
            {"value": "head_and_shoulders", "label": "Head & Shoulders"},
            {"value": "inverse_head_and_shoulders", "label": "Inverse H&S"},
            {"value": "ascending_triangle", "label": "Ascending Triangle"},
            {"value": "descending_triangle", "label": "Descending Triangle"},
            {"value": "symmetrical_triangle", "label": "Symmetrical Triangle"},
            {"value": "bull_flag", "label": "Bull Flag"},
            {"value": "bear_flag", "label": "Bear Flag"},
            {"value": "cup_and_handle", "label": "Cup & Handle"},
            {"value": "wedge_up", "label": "Rising Wedge"},
            {"value": "wedge_down", "label": "Falling Wedge"},
        ],
        sort_fields=[
            {"value": "ticker", "label": "Ticker"},
            {"value": "name", "label": "Name"},
            {"value": "price", "label": "Price"},
            {"value": "change_pct", "label": "Change %"},
            {"value": "market_cap", "label": "Market Cap"},
            {"value": "volume", "label": "Volume"},
            {"value": "rsi", "label": "RSI"},
            {"value": "short_float", "label": "Short Float"},
            {"value": "relative_volume", "label": "Rel. Volume"},
            {"value": "gap_pct", "label": "Gap %"},
            {"value": "atr", "label": "ATR"},
            {"value": "pe_ratio", "label": "P/E Ratio"},
            {"value": "dividend_yield", "label": "Dividend Yield"},
        ],
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
