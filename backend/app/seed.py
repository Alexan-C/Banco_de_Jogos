import os
from sqlalchemy.orm import sessionmaker
from app.models.models import db, Base, Usuario
from app.main import bcrypt_context


def seed_database():
    """
    Executa a seed do banco de dados:
    1. Cria todas as tabelas
    2. Verifica se existe um usuário administrador
    3. Se não existir, cria um usuário admin inicial
    """
    # Criar todas as tabelas
    Base.metadata.create_all(bind=db)
    print("✓ Tabelas criadas/verificadas com sucesso")
    
    # Criar sessão para verificar/criar admin
    Session = sessionmaker(bind=db)
    session = Session()
    
    try:
        # Verificar se já existe um usuário com admin=True
        admin_user = session.query(Usuario).filter(Usuario.admin == True).first()
        
        if admin_user is None:
            # Obter dados do admin das variáveis de ambiente
            admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
            admin_senha = os.getenv("ADMIN_PASSWORD", "admin123")
            admin_nome = os.getenv("ADMIN_NAME", "Administrador")
            
            # Hash da senha
            senha_hash = bcrypt_context.hash(admin_senha)
            
            # Criar novo usuário admin
            novo_admin = Usuario(
                nome=admin_nome,
                email=admin_email,
                senha=senha_hash,
                ativo=True,
                admin=True
            )
            session.add(novo_admin)
            session.commit()
            print(f"✓ Usuário administrador criado: {admin_email}")
        else:
            print(f"✓ Usuário administrador já existe: {admin_user.email}")
    
    except Exception as e:
        print(f"✗ Erro ao criar usuário admin: {e}")
        session.rollback()
    
    finally:
        session.close()
