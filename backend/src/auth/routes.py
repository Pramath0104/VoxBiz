from fastapi import APIRouter, Depends, Request

# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordRequestForm

# pyrefly: ignore [missing-import]
from pydantic import BaseModel

from core.limiter import limiter
from src.user.dtos import UserCreate

from .controller import AuthController
from .dtos import TokenResponse

router = APIRouter()
auth_controller = AuthController()

@router.post("/register", response_model=TokenResponse)
@limiter.limit("5/minute")
async def register(request: Request, user: UserCreate):
    return await auth_controller.register_user(user)

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, req: OAuth2PasswordRequestForm = Depends()):
    return await auth_controller.login_user(req.username, req.password)


class MockResetRequest(BaseModel):
    email: str

@router.post("/send-reset-code")
@limiter.limit("3/minute")
async def send_reset_code(request: Request, req: MockResetRequest):
    """
    Send reset code endpoint.
    """
    return await auth_controller.send_reset_code(req.email)

class MockVerifyRequest(BaseModel):
    email: str
    code: str

@router.post("/verify")
@limiter.limit("3/minute")
async def verify_code(request: Request, req: MockVerifyRequest):
    """
    Verify code endpoint.
    """
    return await auth_controller.verify_code(req.email, req.code)

class MockResetPasswordRequest(BaseModel):
    email: str
    code: str
    newPassword: str

@router.post("/reset-password")
@limiter.limit("3/minute")
async def reset_password(request: Request, req: MockResetPasswordRequest):
    """
    Password reset endpoint.
    """
    return await auth_controller.reset_password(req.email, req.code, req.newPassword)

from fastapi import HTTPException

from core.middleware.authentication import get_current_user


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    user_data = await auth_controller.user_repo.get_user_by_id(user["user_id"])
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    # Don't return hashed password
    user_data.pop("hashed_password", None)
    return user_data

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

@router.put("/change-password")
async def change_password(req: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    return await auth_controller.change_password(user["user_id"], req.currentPassword, req.newPassword)
