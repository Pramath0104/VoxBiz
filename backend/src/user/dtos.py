# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "60a7c9f9f9b9f9b9f9b9f9b9",
                "username": "johndoe",
                "email": "johndoe@example.com",
                "created_at": "2023-01-01T00:00:00Z"
            }
        }

class UserInDB(UserBase):
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
