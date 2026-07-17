from fastapi import Depends, HTTPException, status

# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordBearer

from core.jwt.jwt_handler import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependency to validate JWT tokens and extract user info.
    Use this in your route functions to protect them:
    async def my_route(user = Depends(get_current_user)):
    """
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Returning the dictionary payload. Can also fetch full user from DB if needed.
    return payload
