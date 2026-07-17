# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr



class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str
