from fastapi import APIRouter, UploadFile, File, Query, Body, Form, HTTPException
from typing import List, Optional
import pandas as pd
import io
import numpy as np
from datetime import datetime
from collections import defaultdict, Counter
from fastapi.responses import StreamingResponse

router = APIRouter()

# Словарь синонимов для унификации полей
FIELD_SYNONYMS = {
    "Дата": ["Дата", "Дата платежа"],
    "E-mail": ["E-mail", "Электронная почта"],
    "Сумма": ["Сумма", "Сумма платежа"],
    # Добавь другие пары, если нужно
}

# Глобальное хранилище для всех загруженных пользователей (на время жизни процесса)
all_users_data = []

@router.post("/upload_excel_2025", tags=["Excel"])
async def upload_excel_2025(
    files: List[UploadFile] = File(...),
    sources: List[str] = Form(...)
):
    global all_users_data
    dataframes = []
    for file, source in zip(files, sources):
        content = await file.read()
        excel = pd.read_excel(io.BytesIO(content), sheet_name=None)
        for sheet_name, sheet_df in excel.items():
            sheet_df['month'] = sheet_name  # Добавляем столбец с названием листа
            sheet_df['источник'] = source   # Добавляем столбец источник
            dataframes.append(sheet_df)

    # Собираем все уникальные столбцы
    all_columns = set()
    for df in dataframes:
        all_columns.update(df.columns)
    all_columns = list(all_columns)

    # Приводим все датафреймы к общему набору столбцов
    normalized_dfs = []
    for df in dataframes:
        for col in all_columns:
            if col not in df.columns:
                df[col] = None
        normalized_dfs.append(df[all_columns])

    # Объединяем все строки
    result_df = pd.concat(normalized_dfs, ignore_index=True)

    # Заменяем NaN, inf, -inf на None для корректного JSON
    result_df = result_df.replace([np.nan, np.inf, -np.inf], None)

    # Преобразуем в список словарей
    result = result_df.to_dict(orient='records')

    # Унификация полей по синонимам и сортировка
    final_result = []
    next_id = len(all_users_data) + 1
    for row in result:
        # Унификация полей
        for main_field, synonyms in FIELD_SYNONYMS.items():
            value = None
            for syn in synonyms:
                if row.get(syn) not in [None, '', [], {}]:
                    value = row[syn]
                    break
            row[main_field] = value
            # Удаляем все синонимы, кроме основного
            for syn in synonyms:
                if syn != main_field and syn in row:
                    del row[syn]
        # Фильтрация и коррекция полей (если нужно)
        # ...
        # Сортировка: сначала заполненные, потом пустые
        not_null = {k: v for k, v in row.items() if v not in [None, '', [], {}] and k != "источник"}
        is_null = {k: v for k, v in row.items() if v in [None, '', [], {}] and k != "источник"}
        ordered_row = {**not_null, **is_null}
        # Добавляем телефон и язык, даже если их нет
        if "телефон" not in ordered_row:
            ordered_row["телефон"] = None
        if "язык" not in ordered_row:
            ordered_row["язык"] = None
        # Поле 'источник' всегда в конце
        if "источник" in row:
            ordered_row["источник"] = row["источник"]
        # Добавляем уникальный id
        ordered_row["id"] = next_id
        next_id += 1
        final_result.append(ordered_row)

    all_users_data.extend(final_result)
    return final_result

@router.get("/count_users_excel_2025", tags=["Excel"])
def count_users_excel_2025():
    return {"all_users": len(all_users_data)}

@router.get("/all_users_excel_2025", tags=["Excel"])
def all_users_excel_2025():
    result = []
    for row in all_users_data:
        gender = row.get("gender")
        if not gender:
            fio = row.get("ФИО")
            gender = guess_gender_by_fio(fio)
        row_with_gender = dict(row)
        row_with_gender["gender"] = gender
        # Добавляем телефон и язык, даже если их нет
        if "телефон" not in row_with_gender:
            row_with_gender["телефон"] = None
        if "язык" not in row_with_gender:
            row_with_gender["язык"] = None
        # Формируем новый словарь: все поля кроме 'источник', потом 'источник'
        ordered = {k: v for k, v in row_with_gender.items() if k != "источник"}
        if "источник" in row_with_gender:
            ordered["источник"] = row_with_gender["источник"]
        result.append(ordered)
    return result

def parse_date_safe(date_str):
    return datetime.strptime(date_str, "%d.%m.%Y")

@router.get("/filter_users_by_date_excel_2025", tags=["Excel"])
def filter_users_by_date_excel_2025(
    date_from: str = Query(..., description="Начальная дата в формате DD.MM.YYYY"),
    date_to: str = Query(..., description="Конечная дата в формате DD.MM.YYYY")
):
    filtered = []
    dt_from = parse_date_safe(date_from)
    dt_to = parse_date_safe(date_to)
    for row in all_users_data:
        date_val = row.get("Дата")
        if date_val:
            try:
                # Поддержка форматов ISO, dd/mm/yyyy, dd.mm.yyyy
                if isinstance(date_val, str) and "/" in date_val:
                    dt = datetime.strptime(date_val, "%d/%m/%Y")
                elif isinstance(date_val, str) and "." in date_val:
                    dt = datetime.strptime(date_val, "%d.%m.%Y")
                else:
                    dt = datetime.fromisoformat(str(date_val).replace("Z", ""))
                if dt_from <= dt <= dt_to:
                    filtered.append(row)
            except Exception:
                continue
    return filtered

@router.get("/filter_users_by_count_excel_2025", tags=["Excel"])
def filter_users_by_count_excel_2025(
    type: str = Query(..., regex="^(single|periodic|frequent)$", description="single/periodic/frequent"),
    by: str = Query("ФИО", description="Ключ для группировки: 'ФИО' или 'E-mail'")
):
    counter = defaultdict(list)
    for row in all_users_data:
        key = row.get(by)
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

@router.get("/user_analytics_excel_2025", tags=["Excel"])
def user_analytics_excel_2025(
    key: str = Query(..., description="Значение для поиска (ФИО или E-mail)"),
    by: str = Query("ФИО", description="Поле для поиска: 'ФИО' или 'E-mail'")
):
    user_rows = [row for row in all_users_data if row.get(by) == key]
    if not user_rows:
        return {"error": "User not found"}

    # Считаем суммы
    amounts = []
    dates = []
    months = []
    for row in user_rows:
        # Сумма
        try:
            if row.get("Сумма") is not None:
                amounts.append(float(row["Сумма"]))
        except Exception:
            pass
        # Дата
        date_val = row.get("Дата")
        if date_val:
            try:
                if isinstance(date_val, str) and "/" in date_val:
                    dt = datetime.strptime(date_val, "%d/%m/%Y")
                elif isinstance(date_val, str) and "." in date_val:
                    dt = datetime.strptime(date_val, "%d.%m.%Y")
                else:
                    dt = datetime.fromisoformat(str(date_val).replace("Z", ""))
                dates.append(dt)
                months.append(dt.strftime("%Y-%m"))
            except Exception:
                pass

    gender = guess_gender_by_fio(key) if by == "ФИО" else "неизвестно"

    stats = {
        "total_count": len(user_rows),
        "total_amount": sum(amounts) if amounts else 0,
        "average_amount": sum(amounts)/len(amounts) if amounts else 0,
        "min_amount": min(amounts) if amounts else None,
        "max_amount": max(amounts) if amounts else None,
        "first_transaction": min(dates).strftime("%Y-%m-%d") if dates else None,
        "last_transaction": max(dates).strftime("%Y-%m-%d") if dates else None,
        "most_frequent_month": Counter(months).most_common(1)[0][0] if months else None
    }
    return {
        "user_info": {by: key, "gender": gender},
        "stats": stats,
        "transactions": user_rows
    }

def guess_gender_by_fio(fio: str) -> str:
    if not fio or not isinstance(fio, str):
        return "неизвестно"
    fio_parts = fio.strip().split()
    if len(fio_parts) < 2:
        return "неизвестно"
    surname = fio_parts[0].lower()
    otchestvo = fio_parts[-1].lower() if len(fio_parts) > 2 else ""
    # Женские окончания
    if surname.endswith(("ова", "ева", "ина", "ая", "ская", "цкая")) or \
       otchestvo.endswith(("овна", "евна", "ична", "қызы", "кызы", "гызи", "гулы")):
        return "женщина"
    # Мужские окончания
    if surname.endswith(("ов", "ев", "ин", "ский", "цкий")) or \
       otchestvo.endswith(("ович", "евич", "ич", "улы", "оглы")):
        return "мужчина"
    return "неизвестно"

def guess_language_by_fio(fio: str) -> str:
    if not fio or not isinstance(fio, str):
        return "неизвестно"
    fio_lower = fio.lower()
    kazakh_letters = set("әөүқғңұhі")
    kazakh_endings = ("улы", "қызы", "кызы", "оглы", "гулы", "бек", "хан", "бай", "жан", "гали", "мырза", "нур")
    russian_endings = ("ов", "ова", "ев", "ева", "ин", "ина", "ский", "ская", "цкий", "цкая", "ович", "овна", "евич", "евна", "ич", "ична")
    # Казахские буквы
    if any(ch in kazakh_letters for ch in fio_lower):
        return "казахский"
    # Казахские окончания
    if any(fio_lower.endswith(end) for end in kazakh_endings):
        return "казахский"
    # Русские окончания
    if any(fio_lower.endswith(end) for end in russian_endings):
        return "русский"
    return "неизвестно"

@router.get("/users_with_unknown_gender_excel_2025", tags=["Excel"])
def users_with_unknown_gender_excel_2025():
    result = []
    for row in all_users_data:
        fio = row.get("ФИО")
        gender = guess_gender_by_fio(fio)
        if gender == "неизвестно":
            row_with_gender = dict(row)
            row_with_gender["gender"] = gender
            result.append(row_with_gender)
    return result

@router.post("/set_user_phone_excel_2025", tags=["Excel"])
def set_user_phone_excel_2025(
    id: int = Body(..., description="ID пользователя"),
    phone: str = Body(..., description="Новый телефон")
):
    updated = 0
    for row in all_users_data:
        if row.get("id") == id:
            row["телефон"] = phone
            updated += 1
    return {"updated": updated}

@router.post("/set_user_language_excel_2025", tags=["Excel"])
def set_user_language_excel_2025(
    id: int = Body(..., description="ID пользователя"),
    language: str = Body(..., description="Новый язык")
):
    updated = 0
    for row in all_users_data:
        if row.get("id") == id:
            row["язык"] = language
            updated += 1
    return {"updated": updated}

@router.post("/set_user_gender_excel_2025", tags=["Excel"])
def set_user_gender_excel_2025(
    id: int = Body(..., description="ID пользователя"),
    gender: str = Body(..., description="Новый пол: 'мужчина', 'женщина', 'неизвестно'")
):
    updated = 0
    for row in all_users_data:
        if row.get("id") == id:
            row["gender"] = gender
            updated += 1
    return {"updated": updated}

@router.get("/filter_users_by_gender_excel_2025", tags=["Excel"])
def filter_users_by_gender_excel_2025(
    gender: str = Query(..., description="Гендер: мужчина/женщина/неизвестно (регистр и варианты не важны)")
):
    gender_norm = gender.strip().lower()
    gender_map = {
        "мужчина": "мужчина",
        "женщина": "женщина",
        "неизвестно": "неизвестно",
        "муж": "мужчина",
        "жен": "женщина",
        "male": "мужчина",
        "female": "женщина"
    }
    gender_norm = gender_map.get(gender_norm, gender_norm)
    result = []
    for row in all_users_data:
        g = row.get("gender")
        if not g:
            fio = row.get("ФИО")
            g = guess_gender_by_fio(fio)
        if g and g.strip().lower() == gender_norm:
            result.append(row)
    return result

@router.get("/filter_users_by_language_excel_2025", tags=["Excel"])
def filter_users_by_language_excel_2025(
    language: str = Query(..., description="Язык: казахский/русский/английский/другой (регистр и варианты не важны)")
):
    lang_norm = language.strip().lower()
    lang_map = {
        "казахский": "казахский",
        "русский": "русский",
        "английский": "английский",
        "английский язык": "английский",
        "english": "английский",
        "другой": "другой",
        "other": "другой"
    }
    lang_norm = lang_map.get(lang_norm, lang_norm)
    result = []
    for row in all_users_data:
        l = row.get("язык")
        if not l or l == "неизвестно":
            fio = row.get("ФИО")
            l = guess_language_by_fio(fio)
        l_norm = l.strip().lower() if l else "неизвестно"
        if lang_norm == "другой":
            if l_norm not in ("казахский", "русский", "английский"):
                result.append(row)
        elif l_norm == lang_norm:
            result.append(row)
    return result

# --------- Расширенная функция фильтрации -------------------------
# Теперь параметры type / gender / language / source могут быть списками,
# чтобы поддерживать выбор нескольких значений одного поля
# (?type=single&type=frequent).

def apply_filters(
    data: list[dict],
    type: list[str] | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    amount_from: float | None = None,
    amount_to: float | None = None,
    gender: list[str] | None = None,
    language: list[str] | None = None,
    source: list[str] | None = None,
) -> list[dict]:
    filtered = data

    # 2. Фильтр по источнику (можно несколько значений)
    if source:
        source_set = {s.strip().lower() for s in source}
        filtered = [row for row in filtered if str(row.get("источник", "")).strip().lower() in source_set]

    # 3. Фильтр по типу донаций (single/periodic/frequent) — список значений
    if type:
        from collections import defaultdict
        accepted = {t.strip().lower() for t in type}
        valid = {"single", "periodic", "frequent"}
        if not accepted <= valid:
            raise HTTPException(status_code=400, detail="Unsupported type value")

        counter = defaultdict(list)
        for row in filtered:
            key = row.get("ФИО") or row.get("E-mail")  # группируем по ФИО/Email
            if key:
                counter[key].append(row)

        temp = []
        for rows in counter.values():
            cnt = len(rows)
            cls = (
                "single"   if cnt == 1 else
                "periodic" if 2 <= cnt <= 4 else
                "frequent"
            )
            if cls in accepted:
                temp.extend(rows)
        filtered = temp

    # 4. Фильтр по периоду (дата)
    if date_from and date_to:
        try:
            dt_from = parse_date_safe(date_from)
            dt_to = parse_date_safe(date_to)
            temp = []
            for row in filtered:
                date_val = row.get("Дата")
                if date_val:
                    try:
                        if isinstance(date_val, str) and "/" in date_val:
                            dt = datetime.strptime(date_val, "%d/%m/%Y")
                        elif isinstance(date_val, str) and "." in date_val:
                            dt = datetime.strptime(date_val, "%d.%m.%Y")
                        else:
                            dt = datetime.fromisoformat(str(date_val).replace("Z", ""))
                        if dt_from <= dt <= dt_to:
                            temp.append(row)
                    except Exception:
                        continue
            filtered = temp
        except Exception:
            pass

    # 5. Фильтр по сумме (Сумма)
    if amount_from is not None or amount_to is not None:
        temp = []
        for row in filtered:
            try:
                amount = float(row.get("Сумма")) if row.get("Сумма") is not None else None
            except Exception:
                amount = None
            if amount is not None:
                if amount_from is not None and amount < amount_from:
                    continue
                if amount_to is not None and amount > amount_to:
                    continue
                temp.append(row)
        filtered = temp

    # 6. Фильтр по полу (может быть несколько значений)
    if gender:
        accepted_raw = gender
        gender_map_single = {
            "мужчина": "мужчина",
            "женщина": "женщина",
            "неизвестно": "неизвестно",
            "муж": "мужчина",
            "жен": "женщина",
            "male": "мужчина",
            "female": "женщина",
        }
        accepted = {gender_map_single.get(g.strip().lower(), g.strip().lower()) for g in accepted_raw}
        temp = []
        for row in filtered:
            g = row.get("gender")
            if not g:
                fio = row.get("ФИО")
                g = guess_gender_by_fio(fio)
            g_norm = g.strip().lower() if g else "неизвестно"
            if g_norm in accepted:
                temp.append(row)
        filtered = temp

    # 7. Фильтр по языку (список значений)
    if language:
        lang_map_single = {
            "казахский": "казахский",
            "русский": "русский",
            "английский": "английский",
            "английский язык": "английский",
            "english": "английский",
            "другой": "другой",
            "other": "другой",
        }
        accepted_raw = language
        accepted = {lang_map_single.get(l.strip().lower(), l.strip().lower()) for l in accepted_raw}

        temp = []
        for row in filtered:
            l = row.get("язык")
            if not l or l == "неизвестно":
                fio = row.get("ФИО")
                l = guess_language_by_fio(fio)
            l_norm = l.strip().lower() if l else "неизвестно"
            if "другой" in accepted:
                if l_norm not in ("казахский", "русский", "английский"):
                    temp.append(row)
            if l_norm in accepted:
                temp.append(row)
        filtered = temp

    return filtered

@router.get("/filter_users_excel_2025", tags=["Excel"])
def filter_users_excel_2025(
    type: list[str] | None = Query(None, description="Тип(ы) донаций: single/periodic/frequent"),
    date_from: str | None = Query(None, description="Начальная дата DD.MM.YYYY"),
    date_to: str | None = Query(None, description="Конечная дата DD.MM.YYYY"),
    amount_from: float | None = Query(None, description="Минимальная сумма (Сумма)"),
    amount_to: float | None = Query(None, description="Максимальная сумма (Сумма)"),
    gender: list[str] | None = Query(None, description="Пол(ы): мужчина/женщина/неизвестно"),
    language: list[str] | None = Query(None, description="Язык(и): казахский/русский/английский/другой"),
    source: list[str] | None = Query(None, description="Источник(и)"),
):
    return apply_filters(
        all_users_data,
        type,
        date_from,
        date_to,
        amount_from,
        amount_to,
        gender,
        language,
        source,
    )

@router.get("/export_users_excel_2025", tags=["Excel"])
def export_users_excel_2025(
    type: list[str] | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    amount_from: float | None = Query(None),
    amount_to: float | None = Query(None),
    gender: list[str] | None = Query(None),
    language: list[str] | None = Query(None),
    source: list[str] | None = Query(None),
):
    rows = apply_filters(
        all_users_data,
        type,
        date_from,
        date_to,
        amount_from,
        amount_to,
        gender,
        language,
        source,
    )

    if not rows:
        raise HTTPException(404, "Нет данных под выбранные фильтры")

    df = pd.DataFrame(rows)
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=filtered_users.xlsx"}
    )

@router.post("/add_user_excel_2025", tags=["Excel"])
def add_user_excel_2025(user: dict = Body(...)):
    global all_users_data
    # Корректно формируем id
    next_id = len(all_users_data) + 1 if all_users_data else 1
    user = dict(user)
    user["id"] = next_id
    # Добавляем телефон и язык, даже если их нет
    if "телефон" not in user:
        user["телефон"] = None
    if "язык" not in user:
        user["язык"] = None
    all_users_data.append(user)
    return user

@router.put("/update_user_excel_2025", tags=["Excel"])
def update_user_excel_2025(
    id: int = Body(..., description="ID пользователя"),
    updates: dict = Body(..., description="Поля для обновления")
):
    for user in all_users_data:
        if user.get("id") == id:
            user.update(updates)
            return {"success": True, "user": user}
    raise HTTPException(status_code=404, detail="User not found") 