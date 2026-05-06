from fastapi import Depends, HTTPException,Request
from app.main import SECRET_KEY, ALGORITHM, oauth2_schema
from app.models.models import db
from sqlalchemy.orm import sessionmaker, Session
from app.models.models import Usuario
from jose import jwt, JWTError
from typing import Optional



def pegar_sessao():
    try: 
        Session = sessionmaker(bind= db)
        session = Session()
        yield session
    finally:
        session.close()

def verificar_token(token: str = Depends(oauth2_schema), session: Session = Depends(pegar_sessao)):
    try:
        dic_info = jwt.decode(token, SECRET_KEY, ALGORITHM)
        id_usuario = int(dic_info.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Acesso Negado, verifique a validade do token")
        
    usuario = session.query(Usuario).filter(Usuario.id==id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Acesso Inválido")
    return usuario

def obter_usuario_opcional(request: Request) -> Optional[int]:
    
    token = request.cookies.get("access_token") 
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        
    
    if not token:
        return None

    
    try:      
        if token.startswith("Bearer "):
            token = token.replace("Bearer ", "")

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        
        if user_id:
            print(f"Usuário identificado: {user_id}")
            return int(user_id)

    except Exception:
          return None