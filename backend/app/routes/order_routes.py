from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.dependencies.dependencies import verificar_token, pegar_sessao, Usuario
from app.schemas.schemas import JogoCreateSchema,VinculoJogoSchema
from app.models.models import Jogo, Biblioteca
from typing import Optional
from sqlalchemy import func


order_router = APIRouter(prefix="/pedidos", tags=["pedidos"])

@order_router.get("/list") 
async def listar_todos_os_jogos(session: Session = Depends(pegar_sessao)):

    jogos = session.query(Jogo).all()
       
    if not jogos:
        return {"mensagem": "Nenhum jogo cadastrado ainda.", "jogos": []}
        
    return jogos

@order_router.post("/jogo/adicionar_jogo")
async def adicionar_jogos(adicionar_jogo: JogoCreateSchema, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    if not usuario.admin:
        raise HTTPException (status_code=403, detail= "Você não tem autorização para fazer essa operação")
    else:
        jogo_existente = session.query(Jogo).filter(Jogo.nome == adicionar_jogo.nome).first()
        if jogo_existente:
            raise HTTPException(status_code=400, detail="Este jogo já existe")
        try: 
            novo_jogo = Jogo(adicionar_jogo.nome,adicionar_jogo.categoria,adicionar_jogo.ano,adicionar_jogo.descricao, adicionar_jogo.capa_url)
            session.add(novo_jogo)
            session.commit()
            session.refresh(novo_jogo)
            return {"mensagem": "Jogo adicionado com sucesso", "Jogo" : novo_jogo}
        
        except Exception as e:
                session.rollback()
                print(f"Erro: {e}")
                raise HTTPException(status_code=500, detail="Erro ao salvar o jogo")
        
@order_router.delete("/jogo/removerJogo")
async def remover_jogo_por_nome(nome_jogo: str, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    if not usuario.admin:
        raise HTTPException(status_code=403, detail="Acesso Negado")
    
    jogo = session.query(Jogo).filter(Jogo.nome == nome_jogo).first()
    
    if not jogo:
        raise HTTPException(status_code=404, detail=f"Jogo '{nome_jogo}' não encontrado")
    
    try:
        session.delete(jogo)
        session.commit()
        return {"mensagem": f"Jogo '{nome_jogo}' removido com sucesso!"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail="Erro interno ao remover")

@order_router.post("/vincular")
async def vincular_jogo(dados: VinculoJogoSchema,session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    jogo_existe = session.query(Jogo).filter(Jogo.id == dados.jogo_id).first()
    
    if not jogo_existe:
         raise HTTPException(status_code= 404, detail=f"O jogo {dados.jogo_id} não existe ou foi removido")
    if dados.plataforma == "PC" and dados.subcategoria not in ["Steam", "Epic"]:
        raise HTTPException(
            status_code=400, 
            detail="Para PC, selecione obrigatoriamente Steam ou Epic."
        )
  
    sub_final = dados.subcategoria if dados.plataforma == "PC" else None
   
    vinculo_existente = session.query(Biblioteca).filter(Biblioteca.usuario_id == usuario.id,Biblioteca.jogo_id == dados.jogo_id,Biblioteca.plataforma == dados.plataforma,Biblioteca.subcategoria == sub_final).first()

    
    
    if vinculo_existente:
        local = f"{dados.plataforma}"
        if sub_final:
            local += f" ({sub_final})"
            
        raise HTTPException(
            status_code=400, 
            detail=f"Você já possui este jogo vinculado ao {local}."
        )
   
    novo_item = Biblioteca(
        usuario_id=usuario.id,
        jogo_id=dados.jogo_id,
        plataforma=dados.plataforma,
        subcategoria=sub_final
    )
    
    session.add(novo_item)
    session.commit()
    return {"mensagem": "Vinculado com sucesso!"}

@order_router.get("/minha_biblioteca")
async def listar_minha_biblioteca(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
     
     resultados = session.query(Biblioteca).options(joinedload(Biblioteca.jogo)).filter(Biblioteca.usuario_id == usuario.id).all()

     if not resultados:
          return {"mensagem": "Sua Biblioteca ainda está vazia", "jogos": []}
     
     biblioteca_dict = {}

     for item in resultados:
        jogo_id = item.jogo.id
               
          
    
        if jogo_id not in biblioteca_dict:
            biblioteca_dict[jogo_id] = {
                "id": item.jogo.id,
                "nome": item.jogo.nome,
                "categoria": item.jogo.categoria,
                "ano": item.jogo.ano,
                "descricao": item.jogo.descricao,
                "capa_url": item.jogo.capa_url,
                "detalhes_plataformas": []
            }

        biblioteca_dict[jogo_id]["detalhes_plataformas"].append({
            "plataforma": item.plataforma,
            "subcategoria": item.subcategoria  
        })

     return list(biblioteca_dict.values())

@order_router.delete("/desvincular/{jogo_id}")
async def desvincular_especifico(jogo_id: int, plataforma: str, subcategoria: Optional[str] = None, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
     query = session.query(Biblioteca).filter(Biblioteca.usuario_id == usuario.id, Biblioteca.jogo_id == jogo_id, Biblioteca.plataforma == plataforma)

     if subcategoria is None or subcategoria == "":
        query = query.filter(Biblioteca.subcategoria.is_(None))
     else:
      query = query.filter(
       func.lower(Biblioteca.subcategoria) == subcategoria.lower()
    )
     
     vinculo = query.first()
     if not vinculo:
          raise HTTPException(status_code=404, detail="Este vínculo não existe na sua biblioteca")
     session.delete(vinculo)
     session.commit()
     return {"mensagem": "Vínculo removido!"}

     