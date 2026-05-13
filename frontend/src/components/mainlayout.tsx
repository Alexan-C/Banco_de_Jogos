import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "./mainlayout.css";
import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  Gamepad2,
  User,
  LogOut,
  Crown,
  LogIn,
} from "lucide-react";

const rotas: Record<string, string> = {
  Início: "/",
  Biblioteca: "/minha_biblioteca",
  Jogos: "/jogos",
  Gerenciar: "/admin/adicionar",
};

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  // admin verificação e verificação de login
  const activeTab =
    Object.keys(rotas).find((key) => rotas[key] === location.pathname) ||
    "Início";
  const estaLogado = !!localStorage.getItem("token");
  const adminSalvo = localStorage.getItem("user_admin");
  const nome = localStorage.getItem("nome") || "Jogador";
  const eAdmin = estaLogado && adminSalvo === "true";

  const handleSair = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_admin");
    localStorage.removeItem("nome");
    window.location.href = "/";
  };

  const tabs = ["Início", "Biblioteca", "Jogos", "Gerenciar"];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMenuAberto(false);
    }, 0);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  useEffect(() => {
    document.title = "Gerenciar";
}, []);
  return (
    <div className="layout-wrapper">
      <nav className="navbar-main">
        <div className="nav-left-section">
          <div className="nav-logo" onClick={() => navigate("/")}>
            <Gamepad2 size={28} className="logo-icon" />
            <span className="logo-text">GameVault</span>
          </div>
        </div>

        <div className="nav-tabs">
          {tabs.map((tab) => {
            if (tab === "Gerenciar" && !eAdmin) return null;

            return (
              <button
                key={tab}
                className={`nav-tab-item ${activeTab === tab ? "active" : ""}`}
                onClick={() => navigate(rotas[tab])}
              >
                {tab}
                {activeTab === tab && <div className="active-indicator" />}
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

              <div
                className="avatar-wrapper"
                onClick={() => setMenuAberto(!menuAberto)}
              >
                {eAdmin && (
                  <Crown
                    className="crown-icon-admin"
                    size={20}
                    style={{ color: "gold" }}
                  />
                )}
                <div className="avatar-circle">
                  <div className="avatar-gradient">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <ChevronDown
                  className={`chevron-icon ${menuAberto ? "rotated" : ""}`}
                />
              </div>

              {menuAberto && (
                <div className="dropdown-menu">
                  <button
                    onClick={handleSair}
                    className="dropdown-item btn-sair"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              className="login-btn-nav"
              onClick={() => navigate("/login")}
            >
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
      <footer className="footer-main">
        <div className="footer-content">
          <div className="footer-right">
            <p className="disclaimer-text">
  Este site é um projeto de estudo sem fins lucrativos. Todas as imagens e marcas pertencem aos seus respectivos proprietários.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};


export default MainLayout;
