from datetime import datetime

from core.db_connection import get_db


class ResetTokenRepository:
    def get_collection(self):
        db = get_db()
        if db is None:
            raise Exception("Database connection not established")
        return db.password_resets

    async def save_reset_token(self, email: str, hashed_token: str, expires_at: datetime):
        collection = self.get_collection()
        # Invalidate any previous unused tokens for this email
        await collection.update_many(
            {"email": email, "used": False},
            {"$set": {"used": True}}
        )
        # Save new token
        await collection.insert_one({
            "email": email,
            "hashed_token": hashed_token,
            "expires_at": expires_at,
            "used": False,
            "created_at": datetime.utcnow()
        })

    async def get_valid_reset_token(self, email: str):
        collection = self.get_collection()
        # Find token that is unused and not expired
        now = datetime.utcnow()
        return await collection.find_one({
            "email": email,
            "used": False,
            "expires_at": {"$gt": now}
        }, sort=[("created_at", -1)])

    async def mark_token_used(self, _id):
        collection = self.get_collection()
        await collection.update_one(
            {"_id": _id},
            {"$set": {"used": True}}
        )
