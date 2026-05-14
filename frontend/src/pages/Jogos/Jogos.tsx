import "./Jogos.css";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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

const Jogos = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [jogoSelecionadoId, setJogoSelecionadoId] = useState<number | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const popupJaAberto = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const estaAutenticado = () => {
    return !!localStorage.getItem("token");
  };
  const { data: jogos = [], isLoading: carregando } = useQuery<Jogo[]>({
    queryKey: ["jogos"],
    queryFn: async () => {
      const response = await api.get("pedidos/list");
      return response.data;
    },
    staleTime: 0, // Reduzido de 5min para 30s
    gcTime: 1000 * 60 * 5, // Limpar cache após 5min se não usado
    refetchOnWindowFocus: false,
  });
  

  const queryClient = useQueryClient();

  const jogoSelecionado = useMemo(() => {
    return jogos.find((j) => j.id === jogoSelecionadoId) || null;
  }, [jogos, jogoSelecionadoId]);

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
        (p) => !(p.plataforma === plataforma && p.subcategoria === sub),
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
        return await desvincularJogo(jogoId, plataforma, sub);
      }

      return await vincularJogo({
        jogo_id: jogoId,
        plataforma,
        subcategoria: sub,
      });
    },

    // ===== UPDATE OTIMISTA =====
    onMutate: async ({ jogoId, plataforma, sub, jaExiste }) => {
      await queryClient.cancelQueries({
        queryKey: ["jogos"],
      });

      const cacheAnterior = queryClient.getQueryData<Jogo[]>(["jogos"]);

      queryClient.setQueryData<Jogo[]>(["jogos"], (prev = []) =>
        prev.map((jogo) => {
          if (jogo.id !== jogoId) {
            return jogo;
          }

          return {
            ...jogo,
            detalhes_plataformas: atualizarPlataformas(
              jogo.detalhes_plataformas || [],
              plataforma,
              sub,
              jaExiste,
            ),
          };
        }),
      );
      return { cacheAnterior };
    },

    // ===== ROLLBACK =====
    onError: (err, _, context) => {
      queryClient.setQueryData(["jogos"], context?.cacheAnterior);

      alert(tratarErroApi(err));
    },

    // ===== SINCRONIZA =====
    onSettled: async () => {
       queryClient.refetchQueries({
        queryKey: ["jogos"],
      });

       queryClient.refetchQueries({
        queryKey: ["biblioteca"],
      });
    },
  });

  const PLATAFORMAS_VALIDAS = ["PS5", "XBOX", "PC"];

  const handleVinculo = (plataforma: string, sub: string | null) => {
    if (!jogoSelecionadoId) return;
    if (vinculoMutation.isPending) {
      return;
    }

    if (!estaAutenticado()) {
      navigate("/login", {
        state: {
          from: location.pathname,
          abrirJogoId: jogoSelecionadoId,
        },
      });

      return;
    }
    if (!PLATAFORMAS_VALIDAS.includes(plataforma)) {
      console.warn("Plataforma inválida:", plataforma);
      return;
    }

    if (plataforma === "PC") {
      if (!["Steam", "Epic"].includes(sub || "")) {
        console.warn("Subcategoria inválida para PC:", sub);
        return;
      }
    }

    const plataformasAtuais = jogoSelecionado?.detalhes_plataformas || [];

    const jaExiste = plataformasAtuais.some(
      (p) => p.plataforma === plataforma && p.subcategoria === sub,
    );

    vinculoMutation.mutate({
      jogoId: jogoSelecionadoId,
      plataforma,
      sub,
      jaExiste,
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 15,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 450,
        damping: 30,
        mass: 0.3,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: "easeOut",
      },
    },
  };

  const jogosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) {
      return jogos;
    }

    const queryLower = searchQuery.toLowerCase();
    return jogos.filter((jogo) => jogo.nome.toLowerCase().includes(queryLower));
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
  const handleEvent = (e: Event) => {
    const customEvent = e as CustomEvent<number>;

    if (!customEvent.detail) return;

    const jogoEncontrado = jogos.find(
      (j) => j.id === Number(customEvent.detail),
    );

    if (jogoEncontrado) {
      setJogoSelecionadoId(jogoEncontrado.id);
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
  if (popupJaAberto.current) return;
  if (carregando || jogos.length === 0) return;

  const jogoId = location.state?.abrirJogoId;
  if (!jogoId) return;

  const jogoEncontrado = jogos.find(
    (jogo) => jogo.id === Number(jogoId),
  );

  if (!jogoEncontrado) return;


  popupJaAberto.current = true;


  setTimeout(() => {
    setJogoSelecionadoId(jogoEncontrado.id);
    setShowPopup(true);


    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, 0);

}, [carregando, jogos, location, navigate]);

  // Efeito para controlar overflow quando modal abre/fecha
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

  // ✅ Efeito para definir title e garantir cleanup
  useEffect(() => {
    document.title = "Biblioteca";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // ✅ Abrir modal se veio via location.state

  const jogoTemPlataforma = useCallback(
    (plataforma: string, sub: string | null): boolean => {
      return (
        jogoSelecionado?.detalhes_plataformas?.some(
          (p) => p.plataforma === plataforma && p.subcategoria === sub,
        ) ?? false
      );
    },
    [jogoSelecionado],
  );
  

  return (
    <>
      {erroBusca && <div className="popup-erro">{erroBusca}</div>}
      <div className="biblioteca-container">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          jogos={jogos}
          placeholder="Buscar em Jogos..."
          onResultClick={(jogoId) => {
            const jogoEncontrado = jogos.find((j) => j.id === jogoId);
            if (jogoEncontrado) {
              setJogoSelecionadoId(jogoEncontrado.id);
              setShowPopup(true);
            }
          }}
          showResults={true}
        />

        <AnimatePresence mode="wait">
          {carregando ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: "center", color: "#888", marginTop: "50px" }}
            >
              <p>Carregando Jogos...</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              className="jogos-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {jogosFiltrados.map((jogo) => (
                <motion.div
                  layout
                  key={jogo.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{
                    y: -10,
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="card-jogo-minimalista"
                  onClick={() => {
                    setJogoSelecionadoId(jogo.id);
                    setShowPopup(true);
                  }}
                >
                  <img
                    src={jogo.capa_url}
                    className="capa-principal"
                    alt={jogo.nome}
                    loading="lazy"
                    decoding="async"
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
                          (p.subcategoria?.toLowerCase() === "steam" ? (
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
            </motion.div>
          )}
        </AnimatePresence>
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
                  loading="lazy"
                  decoding="async"
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
export default Jogos;
