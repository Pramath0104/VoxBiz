from core.db_connection import get_db
from src.user.dtos import UserInDB
from typing import Optional

class UserRepository:
    def get_collection(self):
        db = get_db()
        if db is None:
            raise Exception("Database connection not established")
        return db.users

    async def create_user(self, user_in_db: UserInDB) -> str:
        """Insert a new user and return their stringified ObjectId"""
        collection = self.get_collection()
        user_dict = user_in_db.model_dump()
        result = await collection.insert_one(user_dict)
        return str(result.inserted_id)

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """Find a user by their email address"""
        collection = self.get_collection()
        user = await collection.find_one({"email": email})
        if user:
            # Convert ObjectId to string for easier serialization later
            user["_id"] = str(user["_id"])
        return user

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Find a user by their ObjectId string"""
        # pyrefly: ignore [missing-import]
        from bson.objectid import ObjectId
        collection = self.get_collection()
        try:
            user = await collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user["_id"] = str(user["_id"])
            return user
        except Exception:
            return None

    async def update_password(self, email: str, hashed_password: str) -> bool:
        """Update a user's password by email"""
        collection = self.get_collection()
        result = await collection.update_one(
            {"email": email},
            {"$set": {"hashed_password": hashed_password}}
        )
        return result.modified_count > 0
