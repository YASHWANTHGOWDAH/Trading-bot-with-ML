import re
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from app.database import get_collection
from app.security import hash_password, verify_password, create_access_token, get_current_user
from app.services.portfolio import get_or_create_portfolio

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    """Registers a new user, hashes password with Argon2, initializes paper portfolio."""
    if req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )
        
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )
        
    email_clean = req.email.lower().strip()
    users_col = get_collection("users")
    
    # Check if duplicate email
    existing_user = await users_col.find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )
        
    password_hash = hash_password(req.password)
    new_user = {
        "name": req.name.strip(),
        "email": email_clean,
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc)
    }
    
    insert_res = await users_col.insert_one(new_user)
    user_id = str(insert_res.inserted_id)
    
    # Initialize virtual paper trading portfolio with default ₹1,00,000
    await get_or_create_portfolio(email_clean)
    
    # Generate JWT token
    token = create_access_token({"sub": email_clean, "name": req.name})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": req.name.strip(),
            "email": email_clean
        },
        "message": "User registered successfully."
    }

@router.post("/login")
async def login(req: LoginRequest):
    """Authenticates user with Argon2 and issues a JWT token."""
    email_clean = req.email.lower().strip()
    users_col = get_collection("users")
    
    user = await users_col.find_one({"email": email_clean})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    if not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    token = create_access_token({"sub": email_clean, "name": user.get("name", "")})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": email_clean
        }
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Returns currently authenticated user profile."""
    return current_user
