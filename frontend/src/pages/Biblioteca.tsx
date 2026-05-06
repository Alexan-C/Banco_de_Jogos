import "../pages/Biblioteca.css";
import { useEffect, useState } from "react";
import api from "../services/api";
import { gerenciarVinculo, sincronizarBotoesPopup } from "../services/vinculo";
import { createPortal } from "react-dom";
import { FaSteam, FaPlaystation, FaXbox } from "react-icons/fa";
import { SiEpicgames } from "react-icons/si";
import { AnimatePresence, motion } from "framer-motion";
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
const Biblioteca = () => {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [jogoSelecionado, setJogoSelecionado] = useState<Jogo | null>(null);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  useEffect(() => {
    if (showPopup && jogoSelecionado) {
      sincronizarBotoesPopup(jogoSelecionado.id);
    }
  }, [showPopup, jogoSelecionado]);

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
    api
      .get("pedidos/minha_biblioteca")
      .then((res) => {
        const listaValida = Array.isArray(res.data) ? res.data : [];
        setJogos(listaValida);
      })
      .catch((err) => {
        console.error("Erro ao buscar jogos", err);
        setJogos([]);
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

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

    setJogos((jogosAtuais) => {
      const novaLista = jogosAtuais
        .map((j) => {
          if (j.id === jogoSelecionado.id) {
            const jaExiste = j.detalhes_plataformas?.some(
              (p) => p.plataforma === plataforma && p.subcategoria === sub,
            );

            if (jaExiste) {
              return {
                ...j,
                detalhes_plataformas: j.detalhes_plataformas?.filter(
                  (p) =>
                    !(p.plataforma === plataforma && p.subcategoria === sub),
                ),
              };
            } else {
              return {
                ...j,
                detalhes_plataformas: [
                  ...(j.detalhes_plataformas || []),
                  { plataforma, subcategoria: sub },
                ],
              };
            }
          }
          return j;
        })

        .filter(
          (j) => j.detalhes_plataformas && j.detalhes_plataformas.length > 0,
        );

      const aindaExiste = novaLista.some((j) => j.id === jogoSelecionado.id);
      if (!aindaExiste) {
        setTimeout(() => {
          setShowPopup(false);
          setJogoSelecionado(null);
        }, 100);
      }

      return novaLista;
    });

    setTimeout(() => {
      if (jogoSelecionado) sincronizarBotoesPopup(jogoSelecionado.id);
    }, 50);
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

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<number>;

if (customEvent.detail) {
        const jogoEncontrado = jogos.find(
          (j) => Number(j.id) === Number(customEvent.detail),
        );

        if (jogoEncontrado) {
          setJogoSelecionado(jogoEncontrado);
          setShowPopup(true);
          setErroBusca(null);
        } else {
          setErroBusca("Você não vinculou esse Jogo");

          setTimeout(() => {
            setErroBusca(null);
          }, 3000);
        }
      }
    };

    window.addEventListener("abrirJogo", handleEvent);

    return () => {
      window.removeEventListener("abrirJogo", handleEvent);
    };
  }, [jogos]);

  return (
    <>
    {erroBusca && (
  <div className="popup-erro">
    {erroBusca}
  </div>
         )}
      <div className="biblioteca-container">
        {carregando ? (
          <div
            style={{ textAlign: "center", color: "#888", marginTop: "50px" }}
          >
            <p>Carregando Jogos...</p>
          </div>
        ) : (
          <div className="jogos-grid">
            <AnimatePresence mode="popLayout">
              {jogos.map((jogo) => (
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
export default Biblioteca;
