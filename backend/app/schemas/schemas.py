from pydantic import BaseModel
from typing import Optional, List
from typing import Literal, Optional
from pydantic import BaseModel

class UsuarioSchema(BaseModel):
    nome: str
    email: str 
    senha: str
    ativo: bool = True
    admin: bool = False

    class config:
        from_attributes = True

class LoginSchema(BaseModel):

    email: str
    senha: str

    class Config:
        from_attributes = True

class JogoCreateSchema(BaseModel):
    nome: str
    categoria: str
    ano: int
    descricao: str

    class Config:
        from_attributes = True


class VinculoJogoSchema(BaseModel):
    jogo_id: int
    plataforma: Literal["PC", "PS5", "XBOX"]
    subcategoria: Optional[Literal["Steam", "Epic"]] = None

class JogoOut(JogoCreateSchema):
    id: int

    class Config:
        from_attributes = True
    