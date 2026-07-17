from fastapi import HTTPException

from core.jwt.jwt_handler import create_access_token, hash_password, verify_password
from src.auth.dtos import TokenResponse
from src.user.dtos import UserCreate, UserInDB
from src.user.repository import UserRepository


class AuthController:
    def __init__(self):
        self.user_repo = UserRepository()

    async def register_user(self, user: UserCreate) -> TokenResponse:
        # Check if user already exists
        existing_user = await self.user_repo.get_user_by_email(user.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
            
        # Hash password and save to DB
        hashed_pwd = hash_password(user.password)
        user_in_db = UserInDB(**user.model_dump(exclude={'password'}), hashed_password=hashed_pwd)
        
        user_id = await self.user_repo.create_user(user_in_db)
        
        # Generate JWT
        token = create_access_token(data={"user_id": user_id, "email": user.email})
        
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user_id,
            username=user.username
        )

    async def login_user(self, username: str, password: str) -> TokenResponse:
        # Find user by email (Swagger UI uses 'username' field for the form data, so we treat it as email)
        user_data = await self.user_repo.get_user_by_email(username)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        # Verify password
        if not verify_password(password, user_data['hashed_password']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        # Generate JWT
        user_id = str(user_data['_id'])
        token = create_access_token(data={"user_id": user_id, "email": user_data['email']})
        
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user_id,
            username=user_data['username']
        )



    async def send_reset_code(self, email: str) -> dict:
        existing_user = await self.user_repo.get_user_by_email(email)
        if not existing_user:
            # Return success even if user doesn't exist to prevent email enumeration
            return {"success": True, "message": "If the email is registered, a code has been sent."}
            
        import secrets
        from datetime import datetime, timedelta
        
        # Generate 6-digit code
        reset_code = ''.join(secrets.choice('0123456789') for _ in range(6))
        hashed_code = hash_password(reset_code)
        expires_at = datetime.utcnow() + timedelta(seconds=30)
        
        from src.auth.repository import ResetTokenRepository
        repo = ResetTokenRepository()
        await repo.save_reset_token(email, hashed_code, expires_at)
        
        import asyncio

        from core.core_services.email_service import email_service
        # Dispatch email asynchronously
        asyncio.create_task(
            email_service.send_email(
                to_email=email,
                subject="Your VoxBiz Password Reset Code",
                body=f"Your password reset code is: {reset_code}\nThis code will expire in 30 seconds."
            )
        )
        
        return {"success": True, "message": "If the email is registered, a code has been sent."}

    async def verify_code(self, email: str, code: str) -> dict:
        from src.auth.repository import ResetTokenRepository
        repo = ResetTokenRepository()
        token_record = await repo.get_valid_reset_token(email)
        
        if not token_record or not verify_password(code, token_record['hashed_token']):
            raise HTTPException(status_code=400, detail="Invalid or expired reset code")
            
        return {"success": True, "message": "Code verified successfully"}

    async def reset_password(self, email: str, code: str, new_password: str) -> dict:
        from src.auth.repository import ResetTokenRepository
        repo = ResetTokenRepository()
        token_record = await repo.get_valid_reset_token(email)
        
        if not token_record or not verify_password(code, token_record['hashed_token']):
            raise HTTPException(status_code=400, detail="Invalid or expired reset code")
            
        hashed_pwd = hash_password(new_password)
        updated = await self.user_repo.update_password(email, hashed_pwd)
        
        if not updated:
            raise HTTPException(status_code=500, detail="Failed to update password")
            
        # Mark token as used
        await repo.mark_token_used(token_record['_id'])
            
        return {"success": True, "message": "Password reset successfully"}

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> dict:
        user_data = await self.user_repo.get_user_by_id(user_id)
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not verify_password(current_password, user_data['hashed_password']):
            raise HTTPException(status_code=400, detail="Incorrect current password")
            
        hashed_pwd = hash_password(new_password)
        updated = await self.user_repo.update_password(user_data['email'], hashed_pwd)
        
        if not updated:
            raise HTTPException(status_code=500, detail="Failed to update password")
            
        return {"success": True, "message": "Password changed successfully"}
