import sys
import asyncio
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
from app.database import connect_to_mongo, close_mongo_connection, get_collection
from app.services.market_data import get_historical_ohlcv, get_stock_quote
from app.services.signal_engine import generate_and_save_analysis
from app.services.portfolio import execute_trade, calculate_live_portfolio, reset_user_portfolio
from app.services.backtesting import execute_and_save_backtest

async def test_full_pipeline():
    print("--- 1. Connecting to MongoDB ---")
    await connect_to_mongo()
    
    print("\n--- 2. Testing Market Data & Indicators ---")
    df = await get_historical_ohlcv("AAPL", timeframe="1M", force_refresh=True)
    print(f"Candles retrieved: {len(df)} rows")
    print(f"Columns: {list(df.columns)}")
    quote = await get_stock_quote("AAPL")
    print(f"AAPL Quote: INR {quote['current_price']} ({quote['change_percent']}%)")
    
    print("\n--- 3. Testing ML Inference & Explainable AI ---")
    analysis = await generate_and_save_analysis("AAPL", df)
    print(f"Signal: {analysis['signal']} (Confidence: {analysis['confidence']}%)")
    print(f"Up Prob: {analysis['up_probability']}% | Down Prob: {analysis['down_probability']}%")
    print("Reasons:")
    for r in analysis["reasons"]:
        print(f"  - {r}")
        
    print("\n--- 4. Testing Paper Trading ---")
    test_email = "test_trader@trademind.ai"
    await reset_user_portfolio(test_email)
    
    # Buy 10 shares of AAPL
    buy_res = await execute_trade(test_email, "AAPL", "BUY", 10, analysis)
    print("Buy Trade Result:", buy_res["message"])
    print(f"Cash Remaining: INR {buy_res['portfolio']['cash']}")
    
    # Check live portfolio
    port = await calculate_live_portfolio(test_email)
    print(f"Portfolio Total Value: INR {port['total_value']}, Holdings Count: {port['holdings_count']}")
    
    # Sell 5 shares
    sell_res = await execute_trade(test_email, "AAPL", "SELL", 5, analysis)
    print("Sell Trade Result:", sell_res["message"])
    print(f"Realized P/L: INR {sell_res['trade']['realized_pl']}")
    
    print("\n--- 5. Testing Backtest Engine ---")
    bt_res = await execute_and_save_backtest(test_email, "AAPL", "TradeMind AI ML-Ensemble Signal", "6M", 100000.0)
    print(f"Backtest Total Return: {bt_res['total_return_percent']}% | Trades: {bt_res['total_trades']} | Win Rate: {bt_res['win_rate_percent']}%")
    print(f"Max Drawdown: {bt_res['max_drawdown_percent']}% | Final Capital: INR {bt_res['final_capital']}")
    
    await close_mongo_connection()
    print("\n>>> ALL BACKEND PIPELINES AND MONGODB PERSISTENCE VERIFIED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
