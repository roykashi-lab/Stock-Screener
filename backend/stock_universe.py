"""Stock universe management - provides ticker lists for screening."""

# Major US stocks + international tickers for demonstration
# In production, this would pull from a database or comprehensive API

SP500_SAMPLE = [
    "AAPL", "MSFT", "AMZN", "NVDA", "GOOGL", "META", "TSLA", "BRK-B", "UNH", "JNJ",
    "JPM", "V", "XOM", "PG", "MA", "HD", "CVX", "MRK", "ABBV", "LLY",
    "PEP", "KO", "COST", "AVGO", "TMO", "MCD", "WMT", "CSCO", "ACN", "ABT",
    "DHR", "CRM", "LIN", "NEE", "AMD", "TXN", "PM", "UPS", "RTX", "HON",
    "ORCL", "INTC", "LOW", "AMGN", "UNP", "QCOM", "BA", "GS", "SBUX", "CAT",
    "IBM", "GE", "INTU", "BLK", "ADP", "DE", "MDLZ", "ISRG", "GILD", "ADI",
    "BKNG", "SYK", "VRTX", "MMC", "REGN", "TMUS", "CI", "ZTS", "AXP", "NOW",
    "PYPL", "LRCX", "SCHW", "CME", "SLB", "MO", "BDX", "CB", "PLD", "EQIX",
    "DUK", "SO", "CL", "ITW", "ICE", "NOC", "WM", "FIS", "APD", "SHW",
    "NFLX", "AMAT", "COP", "EOG", "PANW", "ABNB", "SNOW", "CRWD", "DDOG", "PLTR",
]

NASDAQ_EXTRA = [
    "MRVL", "MU", "KLAC", "SNPS", "CDNS", "FTNT", "WDAY", "TEAM", "ZS", "OKTA",
    "BILL", "DKNG", "DASH", "COIN", "RIVN", "LCID", "SOFI", "HOOD", "RBLX", "U",
    "ROKU", "TTD", "SHOP", "SQ", "MELI", "SE", "PINS", "SNAP", "SPOT", "NET",
    "TWLO", "DOCU", "ZM", "PTON", "ETSY", "ROKU", "CHWY", "OPEN", "CLOV", "WISH",
    "MNDY", "CFLT", "PATH", "GTLB", "DOCN", "HUBS", "VEEV", "PAYC", "PCOR", "ESTC",
]

SMALL_CAP_SAMPLE = [
    "SMCI", "IONQ", "RGTI", "QUBT", "SOUN", "RKLB", "LUNR", "ASTR", "ASTS", "JOBY",
    "LILM", "ACHR", "EVTL", "BLDE", "ARQQ", "QBTS", "DNA", "GEVO", "PLUG", "FCEL",
    "BE", "ENVX", "QS", "MVST", "PTRA", "GOEV", "NKLA", "WKHS", "RIDE", "FSR",
    "LAZR", "OUST", "AEVA", "INVZ", "CPTN", "LIDR", "MVIS", "VLDR", "BNGO", "EDIT",
    "CRSP", "BEAM", "NTLA", "VERV", "PRME", "DMTK", "SDGR", "RXRX", "ABCL", "TWST",
]

UK_SAMPLE = [
    "SHEL.L", "AZN.L", "HSBA.L", "ULVR.L", "BP.L", "GSK.L", "RIO.L", "BATS.L",
    "DGE.L", "LSEG.L", "REL.L", "CRH.L", "NG.L", "VOD.L", "BT-A.L", "BARC.L",
]

GERMANY_SAMPLE = [
    "SAP.DE", "SIE.DE", "ALV.DE", "DTE.DE", "BAS.DE", "MBG.DE", "BMW.DE", "IFX.DE",
    "MRK.DE", "ADS.DE", "HEN3.DE", "VOW3.DE", "RWE.DE", "DTG.DE",
]

JAPAN_SAMPLE = [
    "7203.T", "6758.T", "9984.T", "6861.T", "8306.T", "9432.T", "6501.T", "7267.T",
    "4502.T", "8035.T", "6902.T", "7741.T", "4063.T", "6367.T",
]

CANADA_SAMPLE = [
    "RY.TO", "TD.TO", "ENB.TO", "CNR.TO", "BN.TO", "BMO.TO", "CP.TO", "SU.TO",
    "TRI.TO", "MFC.TO", "ATD.TO", "CSU.TO", "WCN.TO", "NTR.TO",
]

AUSTRALIA_SAMPLE = [
    "BHP.AX", "CBA.AX", "CSL.AX", "NAB.AX", "WBC.AX", "ANZ.AX", "FMG.AX", "WES.AX",
    "MQG.AX", "TLS.AX", "WOW.AX", "RIO.AX", "ALL.AX", "COL.AX",
]

INDIA_SAMPLE = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "BHARTIARTL.NS", "SBIN.NS", "ITC.NS", "KOTAKBANK.NS",
    "LT.NS", "HCLTECH.NS", "AXISBANK.NS", "WIPRO.NS",
]

HONGKONG_SAMPLE = [
    "0700.HK", "9988.HK", "1299.HK", "0005.HK", "0941.HK", "2318.HK",
    "0388.HK", "1398.HK", "0883.HK", "0016.HK",
]

FRANCE_SAMPLE = [
    "MC.PA", "OR.PA", "SAN.PA", "AI.PA", "SU.PA", "BNP.PA", "TTE.PA", "CS.PA",
    "AIR.PA", "KER.PA", "SAF.PA", "DG.PA",
]

COUNTRY_TICKERS = {
    "US": SP500_SAMPLE + NASDAQ_EXTRA + SMALL_CAP_SAMPLE,
    "UK": UK_SAMPLE,
    "Germany": GERMANY_SAMPLE,
    "Japan": JAPAN_SAMPLE,
    "Canada": CANADA_SAMPLE,
    "Australia": AUSTRALIA_SAMPLE,
    "India": INDIA_SAMPLE,
    "Hong Kong": HONGKONG_SAMPLE,
    "France": FRANCE_SAMPLE,
}


def get_tickers(countries: list[str] | None = None) -> list[str]:
    """Get tickers for given countries. If empty/None, return all US stocks."""
    if not countries:
        countries = ["US"]
    tickers = []
    for c in countries:
        tickers.extend(COUNTRY_TICKERS.get(c, []))
    return list(set(tickers))  # deduplicate
