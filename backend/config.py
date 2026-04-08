"""Configuration for the Stock Screener backend."""

import os
from dotenv import load_dotenv

load_dotenv()

# Universe of stocks by index/country
INDICES = {
    "US": {
        "S&P 500": "^GSPC",
        "NASDAQ 100": "^NDX",
        "Dow Jones 30": "^DJI",
        "Russell 2000": "^RUT",
    },
    "UK": {
        "FTSE 100": "^FTSE",
        "FTSE 250": "^FTMC",
    },
    "Germany": {
        "DAX 40": "^GDAXI",
    },
    "France": {
        "CAC 40": "^FCHI",
    },
    "Japan": {
        "Nikkei 225": "^N225",
    },
    "Hong Kong": {
        "Hang Seng": "^HSI",
    },
    "Canada": {
        "S&P/TSX": "^GSPTSE",
    },
    "Australia": {
        "ASX 200": "^AXJO",
    },
    "India": {
        "NIFTY 50": "^NSEI",
    },
}

# Chart pattern definitions
CHART_PATTERNS = [
    "double_top",
    "double_bottom",
    "head_and_shoulders",
    "inverse_head_and_shoulders",
    "ascending_triangle",
    "descending_triangle",
    "symmetrical_triangle",
    "bull_flag",
    "bear_flag",
    "cup_and_handle",
    "wedge_up",
    "wedge_down",
]

# Cache settings
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "300"))
SCREENER_CACHE_TTL = int(os.getenv("SCREENER_CACHE_TTL", "60"))

# API keys (optional)
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
