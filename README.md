Site desenvolvido somente para fins acadêmicos. 

🎮 GameVault
O GameVault é uma plataforma full-stack desenvolvida para a gestão e organização de bibliotecas de jogos digitais. O projeto permite cadastrar títulos, categorizá-los, gerenciar vínculos com diferentes plataformas (Steam, Epic, PlayStation, Xbox) e visualizar detalhes técnicos com uma interface rica e animada.

Nota: Este projeto foi desenvolvido para fins acadêmicos e de estudo pessoal.

🚀 Tecnologias Utilizadas
Frontend
React + TypeScript: Construção de interfaces tipadas e eficientes.

Framer Motion: Animações fluidas e transições suaves entre páginas.

TanStack Query (React Query): Gerenciamento de estado assíncrono e cache de dados.

Lucide React: Biblioteca de ícones minimalistas.

React Router Dom: Gerenciamento de rotas e navegação.

Backend
FastAPI (Python): Framework de alta performance para a construção da API.

SQLAlchemy: ORM para comunicação com o banco de dados.

Alembic: Gerenciamento de migrações de banco de dados.

Passlib + Bcrypt: Hashing de senhas seguro para autenticação.

Python-Jose: Geração e validação de tokens JWT.

Infraestrutura
PostgreSQL: Banco de dados relacional para persistência de dados.

Railway: Hospedagem do backend e do banco de dados.

Vercel: Hospedagem do frontend com deploy contínuo.

🛠️ Funcionalidades Principais
Autenticação Segura: Sistema de login e registro com proteção contra força bruta (Bcrypt).

Gestão de Biblioteca: Cadastro completo de jogos com nome, categoria, ano de lançamento e descrição.

Busca em Tempo Real: Filtro inteligente de jogos por nome diretamente na barra de navegação.

Vínculo Multiplataforma: Interface interativa para associar jogos a diferentes ecossistemas (PC/Console).

Design Responsivo: Layout moderno com gradientes customizados e suporte a temas escuros.

Popups Dinâmicos: Visualização de detalhes dos jogos sem sair da página principal.

📦 Como Executar o Projeto
1. Clonar o repositório
Bash
git clone https://github.com/seu-usuario/gamevault.git
cd gamevault
2. Configurar o Backend
Bash
cd backend
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate no Windows
pip install -r requirements.txt
# Configure seu arquivo .env com as credenciais do banco
uvicorn app.main:app --reload
3. Configurar o Frontend
Bash
cd frontend
npm install
npm run dev

📐 Estrutura do Banco de Dados
O banco de dados foi modelado seguindo os princípios de normalização, garantindo que a relação entre usuários, jogos e seus vínculos de plataforma seja íntegra e performática.

📝 Licença
Este projeto é destinado exclusivamente para estudo. Todas as imagens de jogos (como Elden Ring, Lies of P, etc.) são marcas registradas de seus respectivos proprietários.
