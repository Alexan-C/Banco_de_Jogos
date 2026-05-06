import "../pages/Jogos.css";
import { useEffect, useState } from "react";
import api from "../services/api";
import { createPortal } from "react-dom";
import { FaSteam, FaPlaystation, FaXbox } from "react-icons/fa";
import { SiEpicgames } from "react-icons/si";
import { gerenciarVinculo, sincronizarBotoesPopup } from "../services/vinculo";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

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
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [jogoSelecionado, setJogoSelecionado] = useState<Jogo | null>(null);

  const location = useLocation();

  
  useEffect(() => {
    if (showPopup && jogoSelecionado) {
      const timer = setTimeout(() => {
        sincronizarBotoesPopup(jogoSelecionado.id);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showPopup, jogoSelecionado]);

  useEffect(() => {
    api
      .get("pedidos/list", { withCredentials: true })
      .then((res) => {
        const listaValida = Array.isArray(res.data) ? res.data : [];
        setJogos(listaValida);
      })
      .catch((err) => {
        console.error("Erro ao buscar jogos", err);
        setJogos([]);
      })
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (!carregando && jogos.length > 0 && location.state?.abrirJogoId) {
      const jogoParaAbrir = jogos.find(
        (j) => j.id === location.state.abrirJogoId,
      );

      if (jogoParaAbrir) {
        setTimeout(() => {
          setJogoSelecionado(jogoParaAbrir);
          setShowPopup(true);

          window.history.replaceState({}, document.title);
        }, 0);
      }
    }
  }, [carregando, jogos, location.state]);

  const handleVinculo = async (
    e: React.MouseEvent<HTMLButtonElement>,
    plataforma: string,
    sub: string | null,
  ) => {
    if (!jogoSelecionado) return;

    await gerenciarVinculo(
      e.currentTarget,
      jogoSelecionado.id,
      plataforma,
      sub,
    );

    setJogos((jogosAtuais) =>
      jogosAtuais.map((j) => {
        if (j.id === jogoSelecionado.id) {
          const plataformasAtuais = j.detalhes_plataformas || [];
          const jaExiste = plataformasAtuais.some(
            (p) => p.plataforma === plataforma && p.subcategoria === sub,
          );

          return {
            ...j,
            detalhes_plataformas: jaExiste
              ? plataformasAtuais.filter(
                  (p) =>
                    !(p.plataforma === plataforma && p.subcategoria === sub),
                )
              : [
                  ...plataformasAtuais,
                  { plataforma: plataforma, subcategoria: sub },
                ],
          };
        }
        return j;
      }),
    );

    setTimeout(() => {
      sincronizarBotoesPopup(jogoSelecionado.id);
    }, 50);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
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

  return (
    <>
      <div className="biblioteca-container">
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
              {jogos.map((jogo) => (
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
                    setJogoSelecionado(jogo);
                    setShowPopup(true);
                    sincronizarBotoesPopup(jogo.id);
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
                      className="btn-platform-choice btn-ps"
                      data-plataforma="PS5"
                      onClick={(e) => handleVinculo(e, "PS5", null)}
                    >
                      <FaPlaystation /> PlayStation
                    </button>
                    <button
                      className="btn-platform-choice btn-xbox"
                      data-plataforma="XBOX"
                      onClick={(e) => handleVinculo(e, "XBOX", null)}
                    >
                      <FaXbox /> Xbox
                    </button>
                  </div>

                  <h4>Vincular ao PC</h4>
                  <div className="btn-row">
                    <button
                      className="btn-platform-choice btn-epic"
                      data-plataforma="PC"
                      data-sub="Epic"
                      onClick={(e) => handleVinculo(e, "PC", "Epic")}
                    >
                      <SiEpicgames /> Epic Games
                    </button>
                    <button
                      className="btn-platform-choice btn-steam"
                      data-plataforma="PC"
                      data-sub="Steam"
                      onClick={(e) => handleVinculo(e, "PC", "Steam")}
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
