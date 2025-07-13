from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from . import models, database, crm
from .routes import router
from .upload_excel import router as upload_excel_router
from .merge_excel import router as merge_excel_router
import os
from fastapi.openapi.utils import get_openapi
from fastapi.security import OAuth2PasswordBearer

# Создание таблиц
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Разрешаем CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
         "http://localhost:5173",
         "http://localhost",
         "http://localhost:80",
         "http://localhost:81",
         "http://4.231.121.231",
         "donorflowaai.xyz",
         "www.donorflowaai.xyz",
         "https://www.donorflowaai.xyz",
         "https://donorflowaai.xyz"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем static/ — для фото профиля
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Подключаем роутеры
app.include_router(router, prefix="/api")
app.include_router(crm.router, prefix="/api")
app.include_router(upload_excel_router, prefix="/api")
app.include_router(merge_excel_router, prefix="/api")

# Добавляем схему безопасности Bearer для Swagger UI
@app.on_event("startup")
def customize_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    # Применяем BearerAuth ко всем методам
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = customize_openapi
