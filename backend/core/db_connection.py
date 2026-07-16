# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables to store the database and client
client = None
db = None

async def connect_to_mongo():
    global client, db
    mongodb_uri = os.getenv("MONGODB_URI")
    
    if not mongodb_uri or mongodb_uri == "mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority":
        logger.warning("MONGODB_URI is not configured properly in .env")
        return
        
    try:
        # Initialize Motor client
        client = AsyncIOMotorClient(mongodb_uri)
        # Select database (change "voxbiz" to your actual db name)
        db = client.voxbiz
        
        # Ping the database to verify connection
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB Cloud!")
        
        # Bootstrap Indexes
        await init_indexes(db)
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")

async def init_indexes(db_instance):
    """Idempotent index bootstrap for necessary collections."""
    try:
        # pyrefly: ignore [missing-import]
        from pymongo import ASCENDING
        
        # users collection
        await db_instance["users"].create_index([("email", ASCENDING)], unique=True)
        
        # user_databases metadata collection
        await db_instance["user_databases"].create_index([("user_id", ASCENDING)])
        await db_instance["user_databases"].create_index([("id", ASCENDING), ("user_id", ASCENDING)])
        
        # pending mutations
        await db_instance["pending_mutations"].create_index([("mutation_id", ASCENDING)], unique=True)
        
        # password_resets TTL index (self-destructs unused codes at exact expiration time)
        await db_instance["password_resets"].create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)
        
        logger.info("Successfully bootstrapped database indexes.")
    except Exception as e:
        logger.error(f"Error bootstrapping indexes: {e}")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("Closed MongoDB connection.")

# Utility function to get the database instance
def get_db():
    return db

from fastapi import HTTPException

def get_active_db():
    """Dependency that ensures the database is connected before proceeding."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    return db

