from sqlalchemy import create_engine, Column, String, Integer, Boolean, ForeignKey, event
from sqlalchemy.orm import declarative_base, relationship
import os

# Obter DATABASE_URL da variável de ambiente ou usar SQLite como fallback
database_url = os.getenv("DATABASE_URL", "sqlite:///banco.db")

# Compatibilidade: converter postgres:// para postgresql:// (requerido pelo SQLAlchemy)
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

db = create_engine(database_url, echo=True)

Base = declarative_base()


@event.listens_for(db, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome",String)
    email = Column("email", String, nullable=False, unique=True)
    senha = Column("senha", String)
    admin = Column("admin",Boolean, default=False)
    ativo = Column("ativo", Boolean, default=True)


    jogos = relationship("Biblioteca", back_populates="usuario", cascade="all, delete-orphan")
    
    def __init__(self,nome, email, senha, ativo= True, admin= False):
        self.nome = nome
        self.email = email
        self.senha = senha
        self.ativo = ativo
        self.admin = admin


# ADICIONAR JOGOS 
class Jogo(Base):
    __tablename__ = "jogos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    categoria = Column(String, nullable=False)
    ano = Column(Integer)
    descricao = Column(String)
    capa_url = Column(String)

    jogos_usuarios = relationship("Biblioteca", back_populates="jogo", cascade="all, delete-orphan")

    def __init__(self,nome, categoria, ano, descricao, capa_url):
            self.nome = nome
            self.categoria = categoria
            self.ano = ano
            self.descricao = descricao
            self.capa_url = capa_url
# TODOS OS JOGOS
class Biblioteca(Base):
    __tablename__ = "biblioteca"

    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), index=True)
    jogo_id = Column(Integer, ForeignKey("jogos.id", ondelete="CASCADE"), index=True)
    
    plataforma = Column(String, nullable=False)
    subcategoria = Column(String, nullable=True)

    def __init__(self,usuario_id, jogo_id,plataforma, subcategoria):
            self.usuario_id = usuario_id
            self.jogo_id = jogo_id
            self.plataforma = plataforma
            self.subcategoria = subcategoria


    usuario = relationship("Usuario", back_populates="jogos")
    jogo = relationship("Jogo", back_populates="jogos_usuarios")




