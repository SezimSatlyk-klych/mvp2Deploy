from fastapi import APIRouter, UploadFile, File, Depends, Form
from sqlalchemy.orm import Session
from .database import SessionLocal, get_db
from .models import CRMEntry
import pandas as pd
import traceback
import io
import logging
import datetime
import math
from .schemas import ManualCRMEntryCreate

logging.basicConfig(level=logging.INFO)

router = APIRouter()


def get_month_from_date_string(date_str):
    if not date_str or pd.isnull(date_str):
        return None
    try:
        date_str = str(date_str).strip()
        if date_str.lower() in ['nan', 'nat', 'none', '']:
            return None
        parsed_date = pd.to_datetime(date_str, errors='coerce', dayfirst=True)
        return parsed_date.month if pd.notnull(parsed_date) else None
    except:
        return None


def extract_months_from_excels(files, month_names):
    """Возвращает множество месяцев (имена листов, совпадающие с месяцами) из списка UploadFile."""
    import io
    import pandas as pd
    found_months = set()
    for file in files:
        if hasattr(file, 'read') and callable(file.read):
            # FastAPI UploadFile (async)
            content = file.file.read() if hasattr(file.file, 'read') else file.read()
        else:
            # bytes-like
            content = file
        excel = pd.ExcelFile(io.BytesIO(content))
        for sheet_name in excel.sheet_names:
            if sheet_name in month_names:
                found_months.add(sheet_name)
    return found_months


def convert_timestamps(obj):
    if isinstance(obj, dict):
        return {k: convert_timestamps(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_timestamps(i) for i in obj]
    elif hasattr(obj, 'isoformat') and callable(obj.isoformat):
        return obj.isoformat()
    elif obj is None:
        return None
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    else:
        return obj


@router.post("/upload_excel", tags=["CRM"])
async def upload_excel(
    files: list[UploadFile] = File(...),
    source: str = Form(None)
):
    all_entries = []
    month_names = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                   'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    for file in files:
        try:
            content = await file.read()
            excel = pd.ExcelFile(io.BytesIO(content))
            for sheet_name in excel.sheet_names:
                df = pd.read_excel(excel, sheet_name=sheet_name)
                for _, row in df.iterrows():
                    row_data = row.to_dict()
                    # Удаляем все варианты ключа 'month' или 'месяц'
                    for key in list(row_data.keys()):
                        if key.strip().lower() in ['month', 'месяц']:
                            del row_data[key]
                    # Добавляем определение месяца
                    if sheet_name in month_names:
                        row_data['month'] = sheet_name
                    else:
                        # Пробуем взять месяц из поля "Дата" или "Дата и время"
                        date_field = None
                        for k in row_data:
                            if k.strip().lower() in ['дата', 'дата и время', 'date', 'datetime']:
                                date_field = row_data[k]
                                break
                        month_num = get_month_from_date_string(date_field)
                        row_data['month'] = month_names[month_num - 1] if month_num and 1 <= month_num <= 12 else None

                    if row_data['month'] is not None:
                        row_data = convert_timestamps(row_data)
                        entry_dict = {'data': row_data}
                        if source:
                            entry_dict['source'] = source
                        all_entries.append(entry_dict)
        except Exception as e:
            return {"status": "error", "error": str(e)}

    if not all_entries:
        return {"status": "no_valid_data"}

    db: Session = SessionLocal()
    try:
        for entry in all_entries:
            db_entry = CRMEntry(data=entry['data'], source=entry.get('source', 'import'))
            db.add(db_entry)
        db.commit()
        return {"status": "success", "saved": len(all_entries)}
    except Exception as e:
        db.rollback()
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@router.post("/get_months_from_excel", tags=["CRM"])
async def get_months_from_excel(files: list[UploadFile] = File(...)):
    month_names = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                   'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    found_months = set()
    for file in files:
        content = await file.read()
        excel = pd.ExcelFile(io.BytesIO(content))
        for sheet_name in excel.sheet_names:
            if sheet_name in month_names:
                found_months.add(sheet_name)
    return {"months": sorted(found_months, key=lambda m: month_names.index(m))}


@router.post("/manual_crm_entry", tags=["CRM"])
async def manual_crm_entry(entry: ManualCRMEntryCreate, db: Session = Depends(get_db)):
    try:
        db_entry = CRMEntry(data=entry.data, source=entry.source)
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return {"status": "success", "id": db_entry.id}
    except Exception as e:
        db.rollback()
        return {"status": "error", "error": str(e)}
