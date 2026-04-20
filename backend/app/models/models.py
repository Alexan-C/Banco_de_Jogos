from sqlalchemy import create_engine, Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

db = create_engine("sqlite:///banco.db")

Base = declarative_base()


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome",String)
    email = Column("email", String, nullable=False, unique=True)
    senha = Column("senha", String)
    admin = Column("admin",Boolean, default=False)
    ativo = Column("ativo", Boolean, default=True)

    jogos = relationship("Biblioteca", back_populates="usuario")
    
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

    jogos_usuarios = relationship("Biblioteca", back_populates="jogo")

    def __init__(self,nome, categoria, ano, descricao):
            self.nome = nome
            self.categoria = categoria
            self.ano = ano
            self.descricao = descricao

# TODOS OS JOGOS
class Biblioteca(Base):
    __tablename__ = "biblioteca"

    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    jogo_id = Column(Integer, ForeignKey("jogos.id"))
    
    plataforma = Column(String, nullable=False)
    subcategoria = Column(String, nullable=True)

    def __init__(self,usuario_id, jogo_id,plataforma, subcategoria):
            self.usuario_id = usuario_id
            self.jogo_id = jogo_id
            self.plataforma = plataforma
            self.subcategoria = subcategoria


    usuario = relationship("Usuario", back_populates="jogos")
    jogo = relationship("Jogo", back_populates="jogos_usuarios")




