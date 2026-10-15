import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("trademind.database")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    raw_url = settings.MONGODB_URL
    masked_url = raw_url
    if "@" in raw_url:
        try:
            prefix, rest = raw_url.split("@", 1)
            scheme, userpass = prefix.split("://", 1)
            user = userpass.split(":", 1)[0]
            masked_url = f"{scheme}://{user}:****@{rest}"
        except Exception:
            masked_url = "mongodb+srv://****:****@****"
    logger.info(f"Connecting to MongoDB at {masked_url}...")
    try:
        db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        
        # Verify connection
        await db_instance.client.admin.command('ping')
        logger.info(f"Connected successfully to MongoDB database '{settings.DATABASE_NAME}'")
        
        # Create indexes
        await get_collection("users").create_index("email", unique=True)
        await get_collection("market_data").create_index([("symbol", 1), ("timeframe", 1)])
        await get_collection("holdings").create_index([("user_email", 1), ("symbol", 1)])
        await get_collection("trades").create_index([("user_email", 1), ("timestamp", -1)])
        await get_collection("watchlists").create_index([("user_email", 1), ("symbol", 1)])
        await get_collection("alerts").create_index([("user_email", 1), ("is_active", 1)])
        await get_collection("predictions").create_index([("symbol", 1), ("timestamp", -1)])
        await get_collection("signals").create_index([("symbol", 1), ("timestamp", -1)])
        await get_collection("backtests").create_index([("user_email", 1), ("created_at", -1)])
        await get_collection("chat_messages").create_index([("user_email", 1), ("timestamp", -1)])
        logger.info("MongoDB indexes verified/created successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db_instance.db

def get_collection(collection_name: str):
    if db_instance.db is None:
        # Fallback client if called before event loop lifespan
        db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
    return db_instance.db[collection_name]
