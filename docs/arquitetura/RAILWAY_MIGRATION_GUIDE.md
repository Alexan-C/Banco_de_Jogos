# Guia de Migração SQLite → PostgreSQL para Railway

## 📋 Resumo das Mudanças

### 1. **models.py** - Configuração Dinâmica do Banco
- ✅ Engine agora usa `DATABASE_URL` via `os.getenv()`
- ✅ Fallback automático para `sqlite:///banco.db` se variável não existir
- ✅ Compatibilidade: converte `postgres://` para `postgresql://` automaticamente
- ✅ Estrutura dos modelos (Usuario, Jogo, Biblioteca) **não alterada**

### 2. **seed.py** (NOVO) - Script de Inicialização
- ✅ Função `seed_database()` que:
  - Cria todas as tabelas com `Base.metadata.create_all()`
  - Verifica se existe usuário com `admin=True`
  - Se não existir, cria usuário admin inicial
  - Usa dados das variáveis de ambiente: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`

### 3. **run_seed.py** (NOVO) - Script Executável
- ✅ Arquivo que chama `seed_database()` quando executado
- ✅ Destinado para rodar antes do Uvicorn no Railway

### 4. **requirements.txt** (NOVO) - Dependências
- ✅ Adicionado `psycopg2-binary` para conexão com PostgreSQL
- ✅ Todas as dependências necessárias incluídas

---

## 🚀 Comando de Inicialização para Railway

```bash
python run_seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Explicação:**
- `python run_seed.py` - Executa seed do banco (cria tabelas e admin)
- `&&` - Executa próximo comando apenas se o anterior for bem-sucedido
- `uvicorn app.main:app --host 0.0.0.0 --port $PORT` - Inicia o servidor

---

## 🔧 Variáveis de Ambiente Necessárias

### Para Railway:

```
# Banco de dados
DATABASE_URL=postgresql://usuario:senha@host:5432/banco_nome

# Usuário administrador (seed)
ADMIN_EMAIL=admin@seuapp.com
ADMIN_PASSWORD=sua_senha_segura_aqui
ADMIN_NAME=Administrador

# Segurança (já existentes)
SECRET_KEY=sua_chave_secreta
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Para Desenvolvimento Local:

```
# Usar SQLite (padrão)
# DATABASE_URL=sqlite:///banco.db (se não definir, usa isso automaticamente)

# OU usar PostgreSQL local
DATABASE_URL=postgresql://usuario:senha@localhost:5432/seu_banco

ADMIN_EMAIL=admin@localhost.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin Local

SECRET_KEY=sua_chave_local
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 📦 Dependências Principais

| Biblioteca | Versão | Propósito |
|-----------|--------|----------|
| `psycopg2-binary` | 2.9.9 | Driver PostgreSQL para Python |
| `sqlalchemy` | 2.0.23 | ORM e gerenciamento de banco |
| `fastapi` | 0.104.1 | Framework web |
| `uvicorn` | 0.24.0 | Servidor ASGI |
| `passlib` + `bcrypt` | latest | Hash de senhas |
| `python-jose` | 3.3.0 | Autenticação JWT |
| `python-dotenv` | 1.0.0 | Carregamento de .env |

---

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente definidas no Railway
- [ ] PostgreSQL criado no Railway
- [ ] `requirements.txt` instalado: `pip install -r requirements.txt`
- [ ] Comando de inicialização configurado no Railway (vide acima)
- [ ] Testar localmente: `python run_seed.py && uvicorn app.main:app --reload`
- [ ] Rotas não foram alteradas (verificar `/auth/`, `/order/`, etc.)

---

## 🔍 Testando Localmente

```bash
# 1. Instalar dependências
pip install -r requirements.txt

# 2. Executar seed (cria tabelas e admin)
python run_seed.py

# 3. Iniciar servidor
uvicorn app.main:app --reload

# 4. Testar API
# GET http://localhost:8000/docs
```

---

## 📝 Notas Importantes

✅ **O que não foi alterado:**
- Estrutura dos modelos `Usuario`, `Jogo`, `Biblioteca`
- Rotas de autenticação e pedidos
- Frontend (sem alterações necessárias)
- Dependências do `dependencies.py`

⚠️ **Próximos passos:**
- Se usar Alembic para migrações, executar: `alembic upgrade head`
- Considerar adicionar backups automáticos no Railway
- Monitorar logs iniciais para erros de conexão

---

## 🆘 Troubleshooting

**Erro: "psycopg2" não encontrado**
→ Instalar: `pip install psycopg2-binary`

**Erro: "postgres:// not supported"**
→ Usar `postgresql://` na DATABASE_URL (já convertido automaticamente pelo código)

**Erro: "admin user already exists"**
→ Normal na primeira execução, seed verifica antes de criar

**Erro: "CONNECTION REFUSED"**
→ Verificar DATABASE_URL e credenciais no Railway
