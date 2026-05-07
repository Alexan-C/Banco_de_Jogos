# 📊 Sumário de Mudanças - Migração SQLite → PostgreSQL

## 📁 Arquivos Modificados/Criados

### ✏️ MODIFICADO: `app/models/models.py`

**Antes:**
```python
from sqlalchemy import create_engine, Column, String, Integer, Boolean, ForeignKey, event
from sqlalchemy.orm import declarative_base, relationship

db = create_engine("sqlite:///banco.db", echo=True)
```

**Depois:**
```python
from sqlalchemy import create_engine, Column, String, Integer, Boolean, ForeignKey, event
from sqlalchemy.orm import declarative_base, relationship
import os

# Obter DATABASE_URL da variável de ambiente ou usar SQLite como fallback
database_url = os.getenv("DATABASE_URL", "sqlite:///banco.db")

# Compatibilidade: converter postgres:// para postgresql:// (requerido pelo SQLAlchemy)
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

db = create_engine(database_url, echo=True)
```

---

### 🆕 CRIADO: `app/seed.py`

Função `seed_database()` que:
- ✅ Cria todas as tabelas com `Base.metadata.create_all(bind=engine)`
- ✅ Verifica se existe usuário admin
- ✅ Cria usuário admin inicial se não existir
- ✅ Usa variáveis de ambiente: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`

---

### 🆕 CRIADO: `run_seed.py`

Script executável que chama `seed_database()` - **deve ser executado antes do Uvicorn**

---

### 🆕 CRIADO: `requirements.txt`

Dependências principais:
```
psycopg2-binary==2.9.9      # ← Driver PostgreSQL (novo!)
sqlalchemy==2.0.23
fastapi==0.104.1
uvicorn==0.24.0
passlib==1.7.4
bcrypt==4.1.1
python-jose==3.3.0
python-dotenv==1.0.0
python-multipart==0.0.6
pydantic==2.5.0
alembic==1.13.1
```

---

## 🚀 Comando de Inicialização para Railway

```bash
python run_seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## 🔑 Variáveis de Ambiente Necessárias

```
DATABASE_URL=postgresql://user:pass@host:5432/database
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=senha_segura
ADMIN_NAME=Administrador
SECRET_KEY=sua_chave_secreta
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## ✅ Validações

- ✓ Compatibilidade `postgres://` → `postgresql://` automática
- ✓ Fallback para SQLite local se DATABASE_URL não definir
- ✓ Criação automática de tabelas e usuário admin
- ✓ Modelos (Usuario, Jogo, Biblioteca) não alterados
- ✓ Rotas não alteradas
- ✓ Dependencies não alteradas
- ✓ Frontend não afetado

---

## 📝 Estrutura Final do Backend

```
backend/
├── app/
│   ├── main.py              (inalterado)
│   ├── seed.py              (NOVO - seed database)
│   ├── models/
│   │   └── models.py        (MODIFICADO - DATABASE_URL)
│   ├── dependencies/
│   │   └── dependencies.py  (inalterado)
│   ├── routes/
│   │   ├── auth_routes.py   (inalterado)
│   │   └── order_routes.py  (inalterado)
│   └── schemas/
│       └── schemas.py       (inalterado)
├── alembic/                 (inalterado)
├── run_seed.py              (NOVO - executa seed)
├── requirements.txt         (NOVO - dependências)
├── alembic.ini              (inalterado)
├── banco.db                 (SQLite local - será ignorado em produção)
└── RAILWAY_MIGRATION_GUIDE.md (NOVO - documentação)
```

---

## 🎯 Próximas Ações

1. **Instalar dependências localmente:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Testar localmente:**
   ```bash
   python run_seed.py
   uvicorn app.main:app --reload
   ```

3. **Configurar no Railway:**
   - Criar PostgreSQL database
   - Adicionar variáveis de ambiente
   - Usar comando de inicialização acima

4. **Deploy:**
   - Push do código para GitHub
   - Railway fará deploy automático

---

## ⚠️ Importante

O comando `python run_seed.py &&` **sempre** será executado antes do servidor:
- Primeira execução: cria tabelas e usuário admin
- Próximas execuções: apenas valida tabelas e admin já existentes (sem duplicar)

Isso garante que o banco sempre esteja sincronizado, independente de quantas vezes o container reiniciar.
