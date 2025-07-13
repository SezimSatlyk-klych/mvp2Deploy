from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from .database import SessionLocal, get_db
from .models import CRMEntry
from datetime import datetime
from dateutil.parser import parse as parse_date
from collections import defaultdict
import re
import calendar

router = APIRouter()

@router.get("/crm", tags=["CRM"])
def get_crm(db: Session = Depends(get_db)):
    month_names = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ]
    entries = db.query(CRMEntry).all()
    result = []
    for entry in entries:
        data = entry.data.copy()
        date_str = data.get('Дата') or data.get('Дата платежа') or data.get('Дата и время')
        if date_str:
            try:
                if '.' in date_str or '/' in date_str:
                    date_obj = parse_date(date_str, dayfirst=True)
                else:
                    date_obj = parse_date(date_str)
                data['month'] = month_names[date_obj.month - 1]
            except Exception:
                pass
        # Добавляем источник
        data['source'] = entry.source if hasattr(entry, 'source') else None
        result.append(data)
    return result

@router.get("/crm/filter", tags=["CRM"])
def filter_crm(
    year: int = Query(None),
    month: str = Query(None),
    amount_from: float = Query(None, description="Минимальная сумма (Сумма)"),
    amount_to: float = Query(None, description="Максимальная сумма (Сумма)"),
    date_from: str = Query(None, description="Начальная дата в формате DD.MM.YYYY"),
    date_to: str = Query(None, description="Конечная дата в формате DD.MM.YYYY"),
    source: str = Query(None, description="Источник (опционально)"),
    type: str = Query(None, regex="^(single|periodic|frequent)$", description="Тип донатора: single/periodic/frequent (опционально)"),
    gender: str = Query(None, description="Гендер (опционально)"),
    language: str = Query(None, description="Язык (опционально)"),
    db: Session = Depends(get_db)
):
    month_names = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ]
    entries = db.query(CRMEntry).all()
    result = []
    for entry in entries:
        data = entry.data.copy()
        date_str = data.get('Дата') or data.get('Дата платежа') or data.get('Дата и время')
        date_obj = None
        if date_str:
            try:
                if '.' in date_str or '/' in date_str:
                    date_obj = parse_date(date_str, dayfirst=True)
                else:
                    date_obj = parse_date(date_str)
                data['month'] = month_names[date_obj.month - 1]
            except Exception:
                pass
        # Добавляем источник
        data['source'] = entry.source if hasattr(entry, 'source') else None
        # Фильтрация по месяцу
        if month:
            month_query = month.strip().lower()
            if data.get('month', '').strip().lower() != month_query:
                continue
        # Фильтрация по году
        if year and date_obj:
            if date_obj.year != year:
                continue
        # Фильтрация по дате
        if date_from and date_to and date_obj:
            try:
                dt_from = parse_date(date_from, dayfirst=True)
                dt_to = parse_date(date_to, dayfirst=True)
                if not (dt_from <= date_obj <= dt_to):
                    continue
            except Exception:
                continue
        # Фильтрация по сумме
        amount = None
        for sum_field in ["Сумма", "Сумма операции", "Кредит", "Дебет"]:
            if data.get(sum_field) is not None:
                try:
                    amount = float(data[sum_field])
                    break
                except Exception:
                    pass
        if amount_from is not None and (amount is None or amount < amount_from):
            continue
        if amount_to is not None and (amount is None or amount > amount_to):
            continue
        # Фильтрация по источнику
        if source:
            src = data.get("source") or entry.source or ""
            if src.strip().lower() != source.strip().lower():
                continue
        # Фильтрация по полу
        if gender:
            g = data.get("gender") or data.get("пол")
            if not g or g.strip().lower() != gender.strip().lower():
                continue
        # Фильтрация по языку
        if language:
            l = data.get("language") or data.get("язык")
            if not l or l.strip().lower() != language.strip().lower():
                continue
        result.append(data)
    # Группировка и фильтрация по типу донатора
    if type:
        from collections import defaultdict
        counter = defaultdict(list)
        for row in result:
            # Для группировки используем ИИН, если есть, иначе ФИО, иначе email, иначе телефон
            key = row.get("ИИН") or row.get("ФИО") or row.get("E-mail & phone number") or row.get("Номер телефон ")
            if key:
                counter[key].append(row)
        if type == "single":
            result = [rows[0] for rows in counter.values() if len(rows) == 1]
        elif type == "periodic":
            result = [row for rows in counter.values() if 2 <= len(rows) <= 4 for row in rows]
        elif type == "frequent":
            result = [row for rows in counter.values() if len(rows) >= 5 for row in rows]
        else:
            result = []
    return result

def extract_fio_iin(sender_str):
    fio = None
    iin = None
    if sender_str:
        fio = sender_str.split('\n')[0].strip()
        match = re.search(r'ИИН: ?(\d{12})', sender_str)
        if match:
            iin = match.group(1)
        else:
            match = re.search(r'БИН: ?(\d{10,12})', sender_str)
            if match:
                iin = match.group(1)
    return fio, iin

@router.get("/crm/donator_profile", tags=["CRM"])
def donator_profile(key: str = Query(...), db: Session = Depends(get_db)):
    entries = db.query(CRMEntry).all()
    donations = []
    found_iin = None
    for entry in entries:
        data = entry.data
        # Пробуем найти по основным полям
        if (
            str(data.get("ИИН", "")) == key
            or str(data.get("ФИО", "")) == key
            or str(data.get("E-mail & phone number", "")) == key
            or str(data.get("Номер телефон ", "")) == key
        ):
            donations.append(data)
            if data.get("ИИН"):
                found_iin = str(data.get("ИИН"))
        else:
            # Пробуем найти по парсингу из отправителя
            fio, iin = extract_fio_iin(data.get("Отправитель (Наименование, БИК, ИИК, БИН/ИИН)"))
            if key == fio or key == iin:
                donations.append(data)
                if iin:
                    found_iin = iin
    # Если нашли ИИН — собираем все записи с этим ИИН
    if found_iin:
        donations = [d.data for d in entries if str(d.data.get("ИИН", "")) == found_iin or extract_fio_iin(d.data.get("Отправитель (Наименование, БИК, ИИК, БИН/ИИН)"))[1] == found_iin]
    if not donations:
        return {"error": "Donator not found"}
    donator_info = {
        "ИИН": donations[0].get("ИИН"),
        "ФИО": donations[0].get("ФИО"),
        "E-mail & phone number": donations[0].get("E-mail & phone number")
    }
    amounts = []
    dates = []
    for d in donations:
        for sum_field in ["Сумма", "Сумма операции", "Кредит", "Дебет"]:
            if d.get(sum_field) is not None:
                try:
                    amounts.append(float(d[sum_field]))
                    break
                except Exception:
                    pass
        for date_field in ["Дата", "Дата платежа", "Дата и время"]:
            if d.get(date_field):
                dates.append(str(d[date_field]))
                break
    stats = {
        "total_count": len(donations),
        "total_amount": sum(amounts) if amounts else 0,
        "average_amount": sum(amounts)/len(amounts) if amounts else 0,
        "first_donation": min(dates) if dates else None,
        "last_donation": max(dates) if dates else None
    }
    return {
        "donator_info": donator_info,
        "donations": donations,
        "stats": stats
    }