import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "./mainlayout.css";
import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import {
  ChevronDown,
  Gamepad2,
  User,
  LogOut,
  Crown,
  LogIn,
  Search,
  X,
} from "lucide-react";

interface Jogo {
  id: number;
  ano: number;
  nome: string;
  descricao: string;
  categoria: string;
  capa_url: string;
}
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
  const [searchQuery, setSearchQuery] = useState("");
  const [todosOsJogos, setTodosOsJogos] = useState<Jogo[]>([]);

  // admin verificação e verificação de login
  const activeTab =
    Object.keys(rotas).find((key) => rotas[key] === location.pathname) ||
    "Início";
  const estaLogado = !!localStorage.getItem("token");
  const adminSalvo = localStorage.getItem("user_admin");
  const nome = localStorage.getItem("nome") || "Jogador";
  const eAdmin = estaLogado && adminSalvo === "true";

  const mostrarBusca =
    location.pathname === "/minha_biblioteca" || location.pathname === "/jogos";

  const handleSair = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_admin");
    localStorage.removeItem("nome");
    window.location.href = "/";
  };

  const tabs = ["Início", "Biblioteca", "Jogos", "Gerenciar"];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery("");
      setMenuAberto(false);
    }, 0);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  useEffect(() => {
    const buscarJogos = async () => {
      try {
        const response = await api.get("/pedidos/list");
        console.log(" Jogos carregados:", response.data);
        console.log("Total de jogos:", response.data?.length || 0);
        if (response.data && response.data.length > 0) {
          console.log("Primeiro jogo:", response.data[0]);
        }
        setTodosOsJogos(response.data);
      } catch (error) {
        console.error("Erro ao buscar lista de jogos:", error);
      }
    };
    buscarJogos();
  }, []);

  const jogosFiltrados = useMemo(() => {
    if (!searchQuery) return todosOsJogos;

    return todosOsJogos.filter((jogo) =>
      jogo.nome.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, todosOsJogos]);

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
        </div>

        <div
          className={`search-container-nav ${mostrarBusca ? "visible" : ""}`}
        >
          {mostrarBusca && (
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder={`Buscar em ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {searchQuery && (
                <div className="search-results-dropdown">
                  {jogosFiltrados.length > 0 ? (
                    jogosFiltrados.map((jogo) => (
                      <div
                        key={jogo.id}
                        className="search-result-item"
                        onClick={() => {
                          const jogoId = jogo.id;
                          const noCaminhoCerto =
                            location.pathname === "/minha_biblioteca" ||
                            location.pathname === "/jogos";

                          if (noCaminhoCerto) {
                            window.dispatchEvent(
                              new CustomEvent("abrirJogo", { detail: jogoId }),
                            );
                          } else {
                            navigate("/minha_biblioteca", {
                              state: { abrirJogoId: jogoId },
                            });
                          }

                          setSearchQuery("");
                        }}
                      >
                        <img
                          src={jogo.capa_url}
                          alt={jogo.nome}
                          className="result-img"
                        />
                        <div className="result-info">
                          <span className="result-name">{jogo.nome}</span>
                          <span className="result-category">
                            {jogo.categoria || "Digital Game"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">Nenhum jogo encontrado</div>
                  )}
                </div>
              )}

              {searchQuery && (
                <X
                  className="clear-search"
                  size={16}
                  onClick={() => setSearchQuery("")}
                />
              )}
            </div>
          )}
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
          <Outlet context={{ searchQuery }} />
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
