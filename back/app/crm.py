from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
import pandas as pd
import io
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
    year: int | None = Query(None),
    month: str | None = Query(None),
    amount_from: float | None = Query(None, description="Минимальная сумма (Сумма)"),
    amount_to: float | None = Query(None, description="Максимальная сумма (Сумма)"),
    date_from: str | None = Query(None, description="Начальная дата DD.MM.YYYY"),
    date_to: str | None = Query(None, description="Конечная дата DD.MM.YYYY"),
    source: list[str] | None = Query(None, description="Источник(и)"),
    type: list[str] | None = Query(None, description="Тип(ы) донатора: single/periodic/frequent"),
    gender: list[str] | None = Query(None, description="Гендер(ы): мужчина/женщина/неизвестно"),
    language: list[str] | None = Query(None, description="Язык(и): казахский/русский/английский/другой"),
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
            src_val = (data.get("source") or entry.source or "").strip().lower()
            if src_val not in {s.strip().lower() for s in source}:
                continue
        # Фильтрация по полу
        if gender:
            g_val = (data.get("gender") or data.get("пол") or "").strip().lower()
            if g_val not in {g.strip().lower() for g in gender}:
                continue
        # Фильтрация по языку
        if language:
            l_val = (data.get("language") or data.get("язык") or "").strip().lower()
            if l_val not in {lang.strip().lower() for lang in language}:
                continue
        result.append(data)
    # Группировка и фильтрация по типу донатора
    if type:
        from collections import defaultdict
        accepted = {t.strip().lower() for t in type}
        valid = {"single", "periodic", "frequent"}
        accepted = accepted & valid
        if accepted:
            counter = defaultdict(list)
            for row in result:
                key_grp = row.get("ИИН") or row.get("ФИО") or row.get("E-mail & phone number") or row.get("Номер телефон ")
                if key_grp:
                    counter[key_grp].append(row)

            temp_res = []
            for rows in counter.values():
                cnt = len(rows)
                clazz = (
                    "single" if cnt == 1 else
                    "periodic" if 2 <= cnt <= 4 else
                    "frequent"
                )
                if clazz in accepted:
                    temp_res.extend(rows)
            result = temp_res
    return result

def normalize(value: str | None) -> str | None:
    """Приводит строку к нижнему регистру, убирает лишние пробелы/переводы строк."""
    if not value or not isinstance(value, str):
        return None
    return re.sub(r"\s+", " ", value).strip().lower()


def extract_fio_iin(sender_str: str | None):
    """Возвращает (fio, iin) из составной строки отправителя."""
    fio = None
    iin = None
    if sender_str:
        # Первая строка до перевода строки обычно содержит ФИО
        fio = sender_str.split('\n')[0].strip()
        match = re.search(r'(?:ИИН|БИН): ?(\d{10,12})', sender_str, re.IGNORECASE)
        if match:
            iin = match.group(1)
    return fio, iin

@router.get("/crm/donator_profile", tags=["CRM"])
def donator_profile(key: str = Query(...), db: Session = Depends(get_db)):
    """Ищет донора по произвольному ключу (ФИО, ИИН, email, телефон, либо любая
    подстрока в поле "Отправитель ...").

    Алгоритм поиска:
    1. Нормализуем key (нижний регистр, trim).  
    2. Проходим все записи, для каждой собираем возможные значения (ИИН, ФИО,
       email/телефон, а также извлекаем fio/iin из поля отправителя).  
    3. Сравниваем нормализованные строки; совпадение при exact == или если одна
       строка является подстрокой другой.  
    4. Если среди найденных записей обнаружен ИИН – расширяем выборку всеми
       записями с тем же ИИН.
    """
    entries = db.query(CRMEntry).all()
    norm_key = normalize(key)

    donations: list[dict] = []
    found_iin: str | None = None

    for entry in entries:
        data = entry.data

        candidates: list[str | None] = [
            data.get("ИИН"),
            data.get("ФИО"),
            data.get("E-mail & phone number"),
            data.get("Номер телефон "),
        ]

        # Добавляем данные из поля Отправитель
        sender_raw = data.get("Отправитель (Наименование, БИК, ИИК, БИН/ИИН)")
        fio_from_sender, iin_from_sender = extract_fio_iin(sender_raw)
        candidates.extend([fio_from_sender, iin_from_sender, sender_raw])

        matched = False
        for cand in candidates:
            norm_cand = normalize(str(cand)) if cand is not None else None
            if norm_cand and (
                norm_cand == norm_key or
                norm_key in norm_cand or
                norm_cand in norm_key
            ):
                matched = True
                break

        if matched:
            donations.append(data)
            if data.get("ИИН"):
                found_iin = str(data.get("ИИН"))
            elif iin_from_sender:
                found_iin = iin_from_sender

    # Если нашли ИИН — собираем все записи с тем же ИИН для полноты
    if found_iin:
        donations = [
            d.data for d in entries
            if str(d.data.get("ИИН", "")) == found_iin or
               extract_fio_iin(d.data.get("Отправитель (Наименование, БИК, ИИК, БИН/ИИН)"))[1] == found_iin
        ]
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

# ========================= Экспорт CRM в Excel =========================

@router.get("/crm/export_excel", tags=["CRM"])
def export_crm_excel(
    year: int = Query(None),
    month: str = Query(None),
    amount_from: float = Query(None),
    amount_to: float = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None),
    source: str = Query(None),
    type: str = Query(None, regex="^(single|periodic|frequent)$"),
    gender: str = Query(None),
    language: str = Query(None),
    db: Session = Depends(get_db)
):
    """Формирует Excel-файл с теми же фильтрами, что и /crm/filter."""

    # Получаем данные тем же способом, что /crm/filter
    rows = filter_crm(
        year=year,
        month=month,
        amount_from=amount_from,
        amount_to=amount_to,
        date_from=date_from,
        date_to=date_to,
        source=source,
        type=type,
        gender=gender,
        language=language,
        db=db,
    )

    if not rows:
        raise HTTPException(status_code=404, detail="Нет данных под выбранные фильтры")

    df = pd.DataFrame(rows)
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=crm_filtered.xlsx"},
    )

# (эндпоинт /crm/combined_users_excel удалён по требованию)

def hit(cand: str | None, key: str) -> bool:
    if not cand:
        return False
    if key.isdigit() and len(key) in (10, 12):      # ИИН/БИН
        return cand == key
    if "@" in key:                                  # e-mail
        return cand == key
    # ФИО – допускаем подстроку
    return key in cand or cand in key
