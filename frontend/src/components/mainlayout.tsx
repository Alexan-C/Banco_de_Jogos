import { useNavigate, useLocation, Outlet} from 'react-router-dom';
import './mainlayout.css'
import React, { useState } from 'react';
import { ChevronDown, Gamepad2, User, LogOut, Crown, LogIn} from 'lucide-react';
// import { nav } from 'framer-motion/client';

export const MainLayout: React.FC = () =>{
  
  // !! = se tiver token está logado (True ou seja logado ) se não retornar é falso (Não logado)
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false)
  const [activeTab, setActiveTab] = useState('Início')

  
  // admin verificação e verificação de login
const  estaLogado = !!localStorage.getItem('token')
const adminSalvo = localStorage.getItem('user_admin');
const nome = localStorage.getItem('nome') || "Jogador"
const eAdmin = estaLogado && adminSalvo === 'true';

const handleSair = () => {
  localStorage.removeItem('token') // remove o token
  localStorage.removeItem('user_admin')
  localStorage.removeItem('nome')
  setMenuAberto(false)
  window.location.href = '/'
}
const tabs = ['Início', 'Biblioteca', 'Jogos', 'Gerenciar'];

const rotas: Record<string, string> = {
  'Início': '/',
  'Biblioteca': '/minha_biblioteca',
  'Jogos': '/jogos',
  'Gerenciar': '/admin/adicionar'
};

return (
        <div className="layout-wrapper">
            <nav className="navbar-main">
                <div className="logo-section">
                    <div className="logo-box">
                        <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="logo-text">GameVault</span>
                </div>

                <div className="nav-tabs">
                    {tabs.map((tab) => {
                        if (tab === 'Gerenciar' && !eAdmin) {
                            return null;
                        }

                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    navigate(rotas[tab]);
                                }}
                                className={`tab-btn ${activeTab === tab ? 'active' : 'inactive'}`}
                            >
                                {tab}
                                {activeTab === tab && <div className="tab-indicator" />}
                            </button>
                        );
                    })}
                </div>

                <div className="profile-section">
                    {estaLogado ? (
                        <>
                            <div className="user-info">
                                <span className="user-name">{nome}</span>
                            </div>

                            <div className="avatar-wrapper" onClick={() => setMenuAberto(!menuAberto)}>
                                {eAdmin && <Crown className="crown-icon-admin" size={20} style={{ color: 'gold' }} />}
                                
                                <div className="avatar-circle">
                                    <div className="avatar-gradient">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <ChevronDown className={`chevron-icon ${menuAberto ? 'rotated' : ''}`} />
                            </div>

                            {menuAberto && (
                                <div className="dropdown-menu">
                                    <button onClick={handleSair} className="dropdown-item btn-sair">
                                        <LogOut className="w-4 h-4" /> 
                                        <span>Sair da Conta</span>
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <button className="login-btn-nav" onClick={() => navigate('/login')}>
                            <LogIn className="w-5 h-5" />
                            <span>Entrar</span>
                        </button>
                    )}
                </div>
            </nav>

            <main className="content-area">
                <div key={location.pathname} className="animacao-suave">
                <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout