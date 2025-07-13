from pydantic import BaseModel, EmailStr
from typing import Optional
from fastapi import APIRouter, HTTPException
from . import models, database

router = APIRouter()

class UserUpdate(BaseModel):
    id: int
    name: str | None = None
    phone: str | None = None
    gender: str | None = None
    language: str | None = None
    # добавьте другие поля по необходимости


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        orm_mode = True


class UserProfileOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    profile_photo_url: Optional[str] = None

    class Config:
        orm_mode = True


class UserFullProfile(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str]
    phone: Optional[str]
    birth_date: Optional[str]
    city: Optional[str]
    address: Optional[str]
    profile_photo_url: Optional[str]

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class ManualCRMEntryCreate(BaseModel):
    data: dict = {
        "Дата платежа": "14/02/2025",
        "Код платежа": 9009920,
        "Уникальный идентификатор": 504594857493,
        "Лицевой счет": 990823401201,
        "Сумма": 5000,
        "Комиссия": None,
        "ИИН": 990823401201,
        "ФИО": "СЕЙСЕНАЛЫ АҚНҰР НҰРЛАНҚЫЗЫ",
        "month": "Февраль"
    }
    source: str = "manual"


class ExcelUserCreate(BaseModel):
    email: str
    month: str
    date: str  # Можно заменить на datetime, если нужно строгое хранение даты
    fio: str
    summa: int
    payment_id: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = None
    source: str

class ExcelUserOut(ExcelUserCreate):
    id: int

    class Config:
        orm_mode = True
