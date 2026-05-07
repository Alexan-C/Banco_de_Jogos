"""
Script para executar seed do banco de dados antes de iniciar o servidor
Deve ser chamado pelo comando de inicialização do Railway
"""
from app.seed import seed_database

if __name__ == "__main__":
    print("🚀 Inicializando banco de dados...")
    seed_database()
    print("✓ Banco de dados pronto!")
