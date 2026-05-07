from fastapi import FastAPI
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
)

app = FastAPI()

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated ="auto")
oauth2_schema = OAuth2PasswordBearer(tokenUrl="auth/login-form")

from app.routes.auth_routes import auth_router
from app.routes.order_routes import order_router

app.include_router(auth_router)
app.include_router(order_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Libera para todos os links da Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# uvicorn app.main:app --reload
# alembic revision --autogenerate -m ""
# alembic upgrade head
# python run_seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT