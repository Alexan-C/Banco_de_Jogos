import "./Biblioteca.css";
import { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { createPortal } from "react-dom";
import { FaSteam, FaPlaystation, FaXbox } from "react-icons/fa";
import { SiEpicgames } from "react-icons/si";
import {
  desvincularJogo,
  vincularJogo,
  tratarErroApi,
} from "../../services/vinculo";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { SearchBar } from "../../components/Pesquisar/SearchBar";

interface Jogo {
  id: number;
  ano: number;
  nome: string;
  descricao: string;
  categoria: string;
  capa_url: string;

  detalhes_plataformas?: Array<{
    plataforma: string;
    subcategoria: string | null;
  }>;
}
const Biblioteca = () => {
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [jogoSelecionado, setJogoSelecionado] = useState<Jogo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const estaAutenticado = () => {
  return !!localStorage.getItem("token"); 
    };

  const { data: jogos = [], isLoading: carregando } = useQuery<Jogo[]>({
    queryKey: ["biblioteca"],
    queryFn: async () => {
      const response = await api.get("pedidos/minha_biblioteca");
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });

    const queryClient = useQueryClient();

const atualizarPlataformas = (
  plataformas: Array<{
    plataforma: string;
    subcategoria: string | null;
  }>,
  plataforma: string,
  sub: string | null,
  remover: boolean,
) => {
  if (remover) {
    return plataformas.filter(
      (p) =>
        !(
          p.plataforma === plataforma &&
          p.subcategoria === sub
        ),
    );
  }

  return [
    ...plataformas,
    {
      plataforma,
      subcategoria: sub,
    },
  ];
};

const vinculoMutation = useMutation({
  mutationFn: async ({
    jogoId,
    plataforma,
    sub,
    jaExiste,
  }: {
    jogoId: number;
    plataforma: string;
    sub: string | null;
    jaExiste: boolean;
  }) => {

    if (jaExiste) {
      return await desvincularJogo(
        jogoId,
        plataforma,
        sub,
      );
    }

    return await vincularJogo({
      jogo_id: jogoId,
      plataforma,
      subcategoria: sub,
    });
  },

  // ===== UPDATE OTIMISTA =====
  onMutate: async ({
    jogoId,
    plataforma,
    sub,
    jaExiste,
  }) => {

    await queryClient.cancelQueries({
      queryKey: ["jogos"],
    });

    const cacheAnterior =
      queryClient.getQueryData<Jogo[]>(["jogos"]);

    queryClient.setQueryData<Jogo[]>(
      ["jogos"],
      (prev = []) =>
        prev.map((jogo) => {
          if (jogo.id !== jogoId) {
            return jogo;
          }

          return {
            ...jogo,
            detalhes_plataformas:
              atualizarPlataformas(
                jogo.detalhes_plataformas || [],
                plataforma,
                sub,
                jaExiste,
              ),
          };
        }),
    );

    setJogoSelecionado((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        detalhes_plataformas:
          atualizarPlataformas(
            prev.detalhes_plataformas || [],
            plataforma,
            sub,
            jaExiste,
          ),
      };
    });

    return { cacheAnterior };
  },

  // ===== ROLLBACK =====
  onError: (err, _, context) => {

    queryClient.setQueryData(
      ["jogos"],
      context?.cacheAnterior,
    );

    alert(tratarErroApi(err));
  },

  // ===== SINCRONIZA =====
  onSettled: () => {
    queryClient.invalidateQueries({
      queryKey: ["jogos"],
    });
  },
});

const handleVinculo = (
  plataforma: string,
  sub: string | null,
) => {

  if (!jogoSelecionado) return;

  if (!estaAutenticado()) {
    navigate("/login", {
      state: {
        from: location.pathname,
        abrirJogoId: jogoSelecionado.id,
      },
    });

    return;
  }

  const plataformasAtuais =
    jogoSelecionado.detalhes_plataformas || [];

  const jaExiste = plataformasAtuais.some(
    (p) =>
      p.plataforma === plataforma &&
      p.subcategoria === sub,
  );

  vinculoMutation.mutate({
    jogoId: jogoSelecionado.id,
    plataforma,
    sub,
    jaExiste,
  });
};


  const cardMesaVariants: Variants = {
    hidden: {
      opacity: 0,
      y: -50,
      rotateX: 15,
      scale: 1.1,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  const jogosFiltrados = useMemo(() => {
    return jogos.filter((jogo) =>
      jogo.nome.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [jogos, searchQuery]);

  const getPlatformClass = (p: {
    plataforma: string;
    subcategoria: string | null;
  }) => {
    const plataforma = p.plataforma.toUpperCase();
    const sub = p.subcategoria?.toUpperCase();

    if (plataforma === "XBOX") return "color-xbox";
    if (plataforma === "PS5") return "color-ps5";

    if (plataforma === "PC") {
      if (sub === "STEAM") return "color-steam";
      if (sub === "EPIC") return "color-epic";
    }
    return "";
  };

  useEffect(() => {
    const abrirModalComJogo = (id: number) => {
      const jogoEncontrado = jogos.find((jogo) => jogo.id === id);
      if (jogoEncontrado) {
        setJogoSelecionado(jogoEncontrado);
        setShowPopup(true);
      }
    };
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<number>;

      if (customEvent.detail) {
        abrirModalComJogo(customEvent.detail);
      }
    };

    window.addEventListener("abrirJogo", handleEvent);

    if (location.state?.abrirJogoId) {
      abrirModalComJogo(location.state.abrirJogoId);

      navigate(location.pathname, {
        replace: true,
        state: {},
      });
    }
    return () => {
      window.removeEventListener("abrirJogo", handleEvent);
    };
  }, [jogos, location.state, location.pathname, navigate]);

  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showPopup]);

  const jogoTemPlataforma = (plataforma: string, sub: string | null) => {
    return jogoSelecionado?.detalhes_plataformas?.some(
      (p) => p.plataforma === plataforma && p.subcategoria === sub,
    );
  };

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<number>;

      if (!customEvent.detail) return;

      const jogoEncontrado = jogos.find(
        (j) => j.id === Number(customEvent.detail),
      );

      if (jogoEncontrado) {
        setJogoSelecionado(jogoEncontrado);
        setShowPopup(true);
        setErroBusca(null);
      } else {
        setErroBusca("Você não vinculou esse jogo");

        setTimeout(() => {
          setErroBusca(null);
        }, 3000);
      }
    };

    window.addEventListener("abrirJogo", handleEvent);

    return () => {
      window.removeEventListener("abrirJogo", handleEvent);
    };
  }, [jogos]);

    useEffect(() => {
    document.title = "Biblioteca";
}, []);
  return (
    <>
      {erroBusca && <div className="popup-erro">{erroBusca}</div>}
      <div className="biblioteca-container">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          jogos={jogos}
          placeholder="Buscar em Biblioteca..."
          onResultClick={(jogoId) => {
            const jogoEncontrado = jogos.find((j) => j.id === jogoId);
            if (jogoEncontrado) {
              setJogoSelecionado(jogoEncontrado);
              setShowPopup(true);
            }
          }}
          showResults={true}
        />
        {carregando ? (
          <div
            style={{ textAlign: "center", color: "#888", marginTop: "50px" }}
          >
            <p>Carregando Jogos...</p>
          </div>
        ) : (
          <div className="jogos-grid">
            <AnimatePresence mode="popLayout">
              {jogosFiltrados.map((jogo) => (
                <motion.div
                  layout
                  key={jogo.id}
                  variants={cardMesaVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{
                    y: -5,
                    rotateX: 0,
                    transition: { duration: 0.1 },
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="card-jogo-minimalista"
                  onClick={() => {
                    setJogoSelecionado(jogo);
                    setShowPopup(true);
                  }}
                >
                  <img
                    src={jogo.capa_url}
                    className="capa-principal"
                    alt={jogo.nome}
                  />

                  <div className="plataformas-sutis-grid">
                    {jogo.detalhes_plataformas?.map((p) => (
                      <span
                        key={p.plataforma + p.subcategoria}
                        className={`icon-sutil ${getPlatformClass(p)}`}
                      >
                        {p.plataforma === "PS5" && <FaPlaystation />}
                        {p.plataforma === "XBOX" && <FaXbox />}
                        {p.plataforma === "PC" &&
                          (p.subcategoria === "Steam" ? (
                            <FaSteam />
                          ) : (
                            <SiEpicgames />
                          ))}
                      </span>
                    ))}
                  </div>

                  <div className="card-overlay-minimalista">
                    <span>{jogo.nome}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {showPopup &&
        jogoSelecionado &&
        createPortal(
          <div className="popup-overlay" onClick={() => setShowPopup(false)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="close-popup"
                onClick={() => setShowPopup(false)}
              >
                ✕
              </button>

              <div className="popup-left">
                <img
                  src={jogoSelecionado.capa_url}
                  className="img-main"
                  alt={jogoSelecionado.nome}
                />
                <div className="gradient-overlay"></div>
              </div>

              <div className="popup-right">
                <span className="badge-categoria">
                  {jogoSelecionado.categoria}
                </span>
                <h2 className="popup-title">{jogoSelecionado.nome}</h2>
                <p className="description-Estilo">
                  {jogoSelecionado.descricao}
                </p>

                <div className="platform-group">
                  <h4>Vincular ao Console</h4>
                  <div className="btn-row">
                    <button
                      className={`btn-platform-choice btn-ps ${
                        jogoTemPlataforma("PS5", null) ? "active" : ""
                      }`}
                      onClick={() => handleVinculo("PS5", null)}
                    >
                      <FaPlaystation /> PlayStation
                    </button>
                    <button
                      className={`btn-platform-choice btn-xbox ${
                        jogoTemPlataforma("XBOX", null) ? "active" : ""
                      }`}
                      onClick={() => handleVinculo("XBOX", null)}
                    >
                      <FaXbox /> Xbox
                    </button>
                  </div>

                  <h4>Vincular ao PC</h4>
                  <div className="btn-row">
                    <button
                      className={`btn-platform-choice btn-epic ${
                        jogoTemPlataforma("PC", "Epic") ? "active" : ""
                      }`}
                      onClick={() => handleVinculo("PC", "Epic")}
                    >
                      <SiEpicgames /> Epic Games
                    </button>
                    <button
                      className={`btn-platform-choice btn-steam ${
                        jogoTemPlataforma("PC", "Steam") ? "active" : ""
                      }`}
                      onClick={() => handleVinculo("PC", "Steam")}
                    >
                      <FaSteam /> Steam
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
export default Biblioteca;
