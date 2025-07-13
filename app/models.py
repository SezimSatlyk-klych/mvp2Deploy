from sqlalchemy import Column, Integer, String, JSON
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)  # ФИО пользователя
    profile_photo_url = Column(String, nullable=True)  # Путь к загруженному фото
    phone = Column(String, nullable=True)  # Телефон
    birth_date = Column(String, nullable=True)  # Дата рождения
    city = Column(String, nullable=True)  # Город
    address = Column(String, nullable=True)  # Адрес


class CRMEntry(Base):
    __tablename__ = "crm_entries"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(JSON)
    source = Column(String, default="import")


class ExcelUser(Base):
    __tablename__ = "excel_users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, index=True)
    month = Column(String)
    date = Column(String)  # Можно заменить на DateTime, если нужно строгое хранение даты
    fio = Column(String)
    summa = Column(Integer)
    payment_id = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    language = Column(String, nullable=True)
    source = Column(String)
