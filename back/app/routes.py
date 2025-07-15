from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from . import models, schemas, database, auth
from fastapi.responses import JSONResponse
import os
import shutil
from typing import Optional, List
import pandas as pd
import io
import traceback
from datetime import datetime
from .models import ExcelUser

router = APIRouter()


# ========================= Регистрация и вход =========================

@router.post("/register", response_model=schemas.UserOut)
def register(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(
        (models.User.username == user_data.username) |
        (models.User.email == user_data.email)
    ).first()
    if user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    hashed_pw = auth.get_password_hash(user_data.password)
    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not auth.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = auth.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


# ========================= CRM =========================

@router.get("/users", response_model=list[schemas.UserOut])
def get_users(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()


@router.get("/crm")
def get_crm(db: Session = Depends(database.get_db)):
    entries = db.query(models.CRMEntry).all()
    return [entry.data for entry in entries]


# ========================= Профиль пользователя =========================

@router.get("/me/profile", response_model=schemas.UserFullProfile)
def get_my_profile(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return current_user


@router.post("/me/profile")
async def upsert_user_profile(
    full_name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    birth_date: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if full_name is not None:
        current_user.full_name = full_name
    if phone is not None:
        current_user.phone = phone
    if birth_date is not None:
        current_user.birth_date = birth_date
    if city is not None:
        current_user.city = city
    if address is not None:
        current_user.address = address

    if file:
        uploads_dir = "static"
        os.makedirs(uploads_dir, exist_ok=True)
        filename = f"user_{current_user.id}_{file.filename}"
        file_path = os.path.join(uploads_dir, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        current_user.profile_photo_url = f"/static/{filename}"

    db.commit()
    db.refresh(current_user)
    return {"message": "Профиль обновлён", "user_id": current_user.id}
