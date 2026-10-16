import asyncio
import os
import sys
from pathlib import Path
import pandas as pd

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.market_data import SUPPORTED_STOCKS, get_historical_ohlcv, get_stock_quote

async def export_all_stocks_to_csv():
    output_dir = backend_dir.parent / "data"
    stocks_dir = output_dir / "stocks"
    output_dir.mkdir(parents=True, exist_ok=True)
    stocks_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Exporting stock data for {len(SUPPORTED_STOCKS)} stocks to CSV...")
    
    combined_records = []
    
    for item in SUPPORTED_STOCKS:
        symbol = item["symbol"]
        name = item["name"]
        exchange = item["exchange"]
        currency = item.get("currency", "$" if exchange == "NASDAQ" else "₹")
        
        print(f"Fetching {symbol} ({name})...")
        try:
            # Fetch 1 year of daily historical data enriched with indicators
            df = await get_historical_ohlcv(symbol, timeframe="1Y")
            
            # Add metadata columns
            df["symbol"] = symbol
            df["name"] = name
            df["exchange"] = exchange
            df["currency"] = currency
            
            # Reorder columns for readability
            cols_priority = ["symbol", "name", "exchange", "currency", "timestamp", "open", "high", "low", "close", "volume", "sma20", "sma50", "rsi", "macd", "macd_signal", "macd_hist", "recent_return_1d", "volatility", "sma_gap"]
            existing_cols = [c for c in cols_priority if c in df.columns]
            other_cols = [c for c in df.columns if c not in existing_cols]
            df = df[existing_cols + other_cols]
            
            # Save individual CSV
            stock_csv_path = stocks_dir / f"{symbol}.csv"
            df.to_csv(stock_csv_path, index=False)
            
            combined_records.append(df)
            print(f" -> Saved {len(df)} rows to {stock_csv_path.name}")
        except Exception as e:
            print(f" -> Error exporting {symbol}: {e}")

    if combined_records:
        master_df = pd.concat(combined_records, ignore_index=True)
        master_csv_path = output_dir / "all_stocks_market_data.csv"
        master_df.to_csv(master_csv_path, index=False)
        print(f"\n Master dataset successfully saved to: {master_csv_path}")
        print(f"Total rows: {len(master_df)}, Total columns: {len(master_df.columns)}")

if __name__ == "__main__":
    asyncio.run(export_all_stocks_to_csv())
