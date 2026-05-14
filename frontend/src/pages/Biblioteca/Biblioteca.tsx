import "./Biblioteca.css";
import { useEffect, useState, useMemo, useCallback} from "react";
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

const estaAutenticado = () => {
return !!localStorage.getItem("token"); 
  };

  const Biblioteca = () => {
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [jogoSelecionadoId, setJogoSelecionadoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const { data: jogos = [], isLoading: carregando } = useQuery<Jogo[]>({
    queryKey: ["biblioteca"],
    queryFn: async () => {
      const response = await api.get("pedidos/minha_biblioteca");
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

    const queryClient = useQueryClient();

    const jogoSelecionado = useMemo(() => {
  return jogos.find((j) => j.id === jogoSelecionadoId,) || null;
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
      (p) =>
        !(
          p.plataforma === plataforma && p.subcategoria === sub
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
  onMutate: async ({jogoId,plataforma,sub,jaExiste,}) => {
    await queryClient.cancelQueries({
      queryKey: ["biblioteca"],
    });
    const jogoAnterior = queryClient.getQueryData<Jogo[]>(["biblioteca"])?.find((j)=> j.id === jogoId);

    if(!jogoAnterior){
      return{jogoAnterior: null, jogoId}
    }
 queryClient.setQueryData<Jogo[]>(
        ["biblioteca"],
        (prev) => {
          // Type guard explícito
          if (!prev || !Array.isArray(prev)) {
            return [];
          }

          return prev.map((jogo) => {
            if (jogo.id !== jogoId) {
              return jogo;
            }
             const novasPlataformas =
            atualizarPlataformas(
              jogo.detalhes_plataformas || [],
              plataforma,
              sub,
              jaExiste
            );

          return {
            ...jogo,
            detalhes_plataformas: novasPlataformas,
          };
        })

        // remove da biblioteca se ficar sem plataformas
        .filter((jogo) => {
          if (jogo.id === jogoId) {
            return (
              jogo.detalhes_plataformas &&
              jogo.detalhes_plataformas.length > 0
            );
          }

          return true;
        });
    }
  );

  return { jogoAnterior, jogoId };
},

    // ===== ROLLBACK EM CASO DE ERRO =====
    onError: (err, _, context) => {
      // ✅ Rollback apenas do jogo que falhou, não do cache todo
      if (context?.jogoAnterior && context?.jogoId) {
        queryClient.setQueryData<Jogo[]>(
          ["biblioteca"],
          (prev) => {
            if (!prev || !Array.isArray(prev)) {
              return [];
            }

            return prev.map((jogo) =>
              jogo.id === context.jogoId ? context.jogoAnterior : jogo
            );
          }
        );
      }

      alert(tratarErroApi(err));
    },

    // ===== SINCRONIZA COM SERVIDOR =====
    // ✅ MELHORADO: Apenas invalida se realmente necessário
    onSettled: (data: Jogo | undefined, error: Error | null) => {
      if (error) {
        // Se houver erro mesmo após rollback, re-buscar para sincronizar
        queryClient.invalidateQueries({queryKey: ["jogos"],});
        queryClient.invalidateQueries({queryKey: ["biblioteca"],});
        return
      } else if (data && typeof data === 'object' && 'id' in data) {
        
        // Se sucesso, atualizar com dados do servidor (mais recentes que o otimista)
        queryClient.setQueryData<Jogo[]>(["biblioteca"],
          
          (prev) => {
            if (!prev || !Array.isArray(prev)) {
              return [data];
            }
            const jogoExiste = prev.some((j)=> j.id === data.id)

            if (!jogoExiste){
              return [...prev,data];
            }
            // Encontrar e atualizar o jogo que foi modificado
            return prev.map((jogo) =>
              jogo.id === data.id
                ? {
                    ...jogo,
                    detalhes_plataformas: data.detalhes_plataformas,
                  }
                : jogo
            );
          }
        );
      }
    },
  });
  const PLATAFORMAS_VALIDAS = ["PS5", "XBOX", "PC"] 

  const handleVinculo = (plataforma: string, sub: string | null) => {
    if (!jogoSelecionadoId) return;
    if (vinculoMutation.isPending){
      return
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
      (p) => p.plataforma === plataforma && p.subcategoria === sub
    );

    vinculoMutation.mutate({
      jogoId: jogoSelecionadoId,
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
    if (!searchQuery.trim()) {
      return jogos;
    }

    const queryLower = searchQuery.toLowerCase();
    return jogos.filter((jogo) =>
      jogo.nome.toLowerCase().includes(queryLower)
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

  // ✅ CONSOLIDADO: Um único listener + location.state + cleanup
  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      
      if (!customEvent.detail) return;
      
      const jogoEncontrado = jogos.find(
        (j) => j.id === Number(customEvent.detail)
      );
      if (location.state?.abrirJogoId) {
        const jogoEncontrado = jogos.find(
          (jogo) => jogo.id === location.state.abrirJogoId
        );
    
        if (jogoEncontrado) {
          setJogoSelecionadoId(jogoEncontrado.id);
          setShowPopup(true);
        }

      }
      if (jogoEncontrado) {
        setJogoSelecionadoId(jogoEncontrado.id);
        setShowPopup(true);
        setErroBusca(null);
      } else {
        setErroBusca("Você não vinculou esse jogo");
        
        const timerId = setTimeout(() => {
          setErroBusca(null);
        }, 3000);
        return() => clearTimeout(timerId)
      }
    };

    window.addEventListener("abrirJogo", handleEvent);

    
    return () => {
      window.removeEventListener("abrirJogo", handleEvent);
    };
    // ✅ Dependência apenas do valor específico, não do objeto todo
  }, [jogos, location.state?.abrirJogoId, location.pathname]);
  
  // ✅ Efeito para controlar overflow quando modal abre/fecha
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
  

const jogoTemPlataforma = useCallback((
  plataforma: string,
  sub: string | null
): boolean => {
  return jogoSelecionado?.detalhes_plataformas?.some(
    (p) => p.plataforma === plataforma && p.subcategoria === sub
  ) ?? false;
}, [jogoSelecionado]);

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
              setJogoSelecionadoId(jogoEncontrado.id);
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
                    setJogoSelecionadoId(jogo.id);
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
